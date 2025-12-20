import { useEffect, useRef } from 'react';
import { Spring, createVariedSpring } from '../lib/spring';
import { hexToRgb, getMoodColor } from '../lib/colors';
import { VisualizationConfig } from '../lib/config';
import { BreathState } from '../hooks/useBreathSync';
import { PresenceData } from '../hooks/usePresence';
import { MOOD_IDS, MoodId } from '../lib/simulationConfig';

// WebGL Shaders
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_opacity;

  uniform vec2 u_resolution;

  varying float v_opacity;

  void main() {
    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    gl_PointSize = a_size;
    v_opacity = a_opacity;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform vec3 u_color;
  varying float v_opacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.2, dist) * v_opacity;
    gl_FragColor = vec4(u_color, alpha);
  }
`;

// Particle class for managing individual particle state
class Particle {
  index: number;
  total: number;
  baseAngle: number;
  radiusMultiplier: number;
  angleOffset: number;
  phaseOffset: number;
  size: number;
  opacity: number;
  spring: Spring;

  constructor(index: number, total: number, config: VisualizationConfig) {
    this.index = index;
    this.total = total;
    this.baseAngle = (index / total) * Math.PI * 2;
    this.radiusMultiplier = config.radiusVarianceMin + Math.random() * (config.radiusVarianceMax - config.radiusVarianceMin);
    this.angleOffset = (Math.random() - 0.5) * config.angleOffsetRange;
    this.phaseOffset = Math.random() * Math.PI * 2;
    this.size = config.particleMinSize + Math.random() * (config.particleMaxSize - config.particleMinSize);
    this.opacity = config.particleMinOpacity + Math.random() * (config.particleMaxOpacity - config.particleMinOpacity);
    this.spring = createVariedSpring(
      1,
      config.springTension,
      config.springTensionVariance,
      config.springFriction,
      config.springFrictionVariance
    );
  }

  reset(config: VisualizationConfig) {
    this.radiusMultiplier = config.radiusVarianceMin + Math.random() * (config.radiusVarianceMax - config.radiusVarianceMin);
    this.angleOffset = (Math.random() - 0.5) * config.angleOffsetRange;
    this.size = config.particleMinSize + Math.random() * (config.particleMaxSize - config.particleMinSize);
    this.opacity = config.particleMinOpacity + Math.random() * (config.particleMaxOpacity - config.particleMinOpacity);
    this.spring = createVariedSpring(
      1,
      config.springTension,
      config.springTensionVariance,
      config.springFriction,
      config.springFrictionVariance
    );
  }

  update(breathState: BreathState, dt: number, config: VisualizationConfig): void {
    let targetRadius = 1;

    if (breathState.phase === 'in') {
      targetRadius = config.breatheInScale + breathState.progress * (config.breatheOutScale - config.breatheInScale);
    } else if (breathState.phase === 'out') {
      targetRadius = config.breatheOutScale - breathState.progress * (config.breatheOutScale - config.breatheInScale);
    } else if (breathState.phase === 'hold-in') {
      targetRadius = config.breatheOutScale + Math.sin(Date.now() * config.holdOscillationSpeed + this.phaseOffset) * config.holdOscillation;
    } else {
      targetRadius = config.breatheInScale + Math.sin(Date.now() * config.holdOscillationSpeed + this.phaseOffset) * config.holdOscillation;
    }

    this.spring.setTarget(targetRadius);
    this.spring.update(dt);
  }

  getPosition(baseRadius: number, time: number, config: VisualizationConfig): { x: number; y: number; size: number; opacity: number } {
    const wobble = Math.sin(time * config.wobbleSpeed + this.phaseOffset) * config.wobbleAmount;
    const angle = this.baseAngle + this.angleOffset + wobble;
    const radius = baseRadius * this.spring.value * this.radiusMultiplier;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: this.size,
      opacity: this.opacity,
    };
  }
}

// WebGL helper functions
function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

interface ParticleFieldProps {
  breathState: BreathState;
  presence: PresenceData;
  config: VisualizationConfig;
  moodColor: string;
}

export function ParticleField({ breathState, presence, config, moodColor }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mainSpringRef = useRef(new Spring(1, config.mainSpringTension, config.mainSpringFriction));
  const lastTimeRef = useRef(Date.now());
  const buffersRef = useRef<{
    position: WebGLBuffer | null;
    size: WebGLBuffer | null;
    opacity: WebGLBuffer | null;
    positionLocation: number;
    sizeLocation: number;
    opacityLocation: number;
    resolutionLocation: WebGLUniformLocation | null;
    colorLocation: WebGLUniformLocation | null;
  } | null>(null);

  // Initialize/reinitialize particles when count changes
  useEffect(() => {
    const count = config.particleCount;
    if (particlesRef.current.length !== count) {
      particlesRef.current = Array.from({ length: count }, (_, i) => new Particle(i, count, config));
    } else {
      particlesRef.current.forEach((p) => p.reset(config));
    }
  }, [config.particleCount, config]);

  // Update main spring params
  useEffect(() => {
    mainSpringRef.current.setParams(config.mainSpringTension, config.mainSpringFriction);
  }, [config.mainSpringTension, config.mainSpringFriction]);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Create shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;
    programRef.current = program;

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const sizeLocation = gl.getAttribLocation(program, 'a_size');
    const opacityLocation = gl.getAttribLocation(program, 'a_opacity');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const colorLocation = gl.getUniformLocation(program, 'u_color');

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();
    const opacityBuffer = gl.createBuffer();

    buffersRef.current = {
      position: positionBuffer,
      size: sizeBuffer,
      opacity: opacityBuffer,
      positionLocation,
      sizeLocation,
      opacityLocation,
      resolutionLocation,
      colorLocation,
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return () => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;

    let animationId: number;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * config.baseRadius;

      // Update main spring
      let targetScale = 1;
      if (breathState.phase === 'in') {
        targetScale = config.breatheInScale + breathState.progress * (config.breatheOutScale - config.breatheInScale);
      } else if (breathState.phase === 'out') {
        targetScale = config.breatheOutScale - breathState.progress * (config.breatheOutScale - config.breatheInScale);
      } else if (breathState.phase === 'hold-in') {
        targetScale = config.breatheOutScale;
      } else {
        targetScale = config.breatheInScale;
      }
      mainSpringRef.current.setTarget(targetScale);
      mainSpringRef.current.update(dt);
      const mainScale = mainSpringRef.current.value;

      // Clear with background color and trail fade
      const bgColor = hexToRgb(config.backgroundColor);
      gl.clearColor(bgColor.r, bgColor.g, bgColor.b, config.trailFade);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const program = programRef.current;
      const buffers = buffersRef.current;
      if (!program || !buffers) {
        animationId = requestAnimationFrame(render);
        return;
      }

      gl.useProgram(program);

      // Set resolution
      gl.uniform2f(buffers.resolutionLocation, width, height);

      // Set color
      const color = hexToRgb(moodColor || config.primaryColor);
      gl.uniform3f(buffers.colorLocation, color.r, color.g, color.b);

      // Update particles
      const particles = particlesRef.current;
      const positions = new Float32Array(particles.length * 2);
      const sizes = new Float32Array(particles.length);
      const opacities = new Float32Array(particles.length);

      particles.forEach((particle, i) => {
        particle.update(breathState, dt, config);
        const pos = particle.getPosition(baseRadius * mainScale, now, config);
        positions[i * 2] = centerX + pos.x;
        positions[i * 2 + 1] = centerY + pos.y;
        sizes[i] = pos.size * dpr;
        opacities[i] = pos.opacity;
      });

      // Upload particle data
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(buffers.positionLocation);
      gl.vertexAttribPointer(buffers.positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.size);
      gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(buffers.sizeLocation);
      gl.vertexAttribPointer(buffers.sizeLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.opacity);
      gl.bufferData(gl.ARRAY_BUFFER, opacities, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(buffers.opacityLocation);
      gl.vertexAttribPointer(buffers.opacityLocation, 1, gl.FLOAT, false, 0, 0);

      // Draw particles
      gl.drawArrays(gl.POINTS, 0, particles.length);

      // Draw presence particles in mood-colored orbital segments
      // Each mood gets a proportional arc of the orbit
      const totalPresence = presence.count;
      if (totalPresence > 0) {
        // Get mood counts and filter to moods with users
        const moodCounts: { moodId: MoodId; count: number; color: string }[] = [];
        for (const moodId of MOOD_IDS) {
          const count = presence.moods[moodId] ?? 0;
          if (count > 0) {
            moodCounts.push({
              moodId,
              count,
              color: getMoodColor(moodId),
            });
          }
        }

        // Calculate orbital segment positions
        // Each mood gets a slice of the full circle proportional to its user count
        let angleOffset = now * config.presenceOrbitSpeed;

        for (const { count, color } of moodCounts) {
          // Skip if no users in this mood
          if (count === 0) continue;

          // Calculate the arc size for this mood segment
          const arcSize = (count / totalPresence) * Math.PI * 2;
          const particlesInSegment = Math.min(
            Math.ceil((count / totalPresence) * config.presenceCount),
            count
          );

          if (particlesInSegment === 0) continue;

          const segmentPositions = new Float32Array(particlesInSegment * 2);
          const segmentSizes = new Float32Array(particlesInSegment);
          const segmentOpacities = new Float32Array(particlesInSegment);

          for (let i = 0; i < particlesInSegment; i++) {
            // Position within this segment's arc
            const t = particlesInSegment > 1 ? i / (particlesInSegment - 1) : 0.5;
            const angle = angleOffset + t * arcSize;
            const radiusWobble = Math.sin(now * 0.001 + i * 0.5) * 0.05;
            const radius = baseRadius * mainScale * (config.presenceRadius + radiusWobble);

            segmentPositions[i * 2] = centerX + Math.cos(angle) * radius;
            segmentPositions[i * 2 + 1] = centerY + Math.sin(angle) * radius;
            segmentSizes[i] = config.presenceSize * dpr;
            segmentOpacities[i] = config.presenceOpacity;
          }

          // Set mood color for this segment
          const moodRgb = hexToRgb(color);
          gl.uniform3f(buffers.colorLocation, moodRgb.r, moodRgb.g, moodRgb.b);

          // Upload and draw segment particles
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
          gl.bufferData(gl.ARRAY_BUFFER, segmentPositions, gl.DYNAMIC_DRAW);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.size);
          gl.bufferData(gl.ARRAY_BUFFER, segmentSizes, gl.DYNAMIC_DRAW);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.opacity);
          gl.bufferData(gl.ARRAY_BUFFER, segmentOpacities, gl.DYNAMIC_DRAW);

          gl.drawArrays(gl.POINTS, 0, particlesInSegment);

          // Move to next segment
          angleOffset += arcSize;
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [breathState, presence, config, moodColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}
