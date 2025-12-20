# CodePen Particle Effects

Collection of relevant particle system demos and techniques.

## Featured Demos

### 1. Text to Particles - Louis Hoebregts
**Source**: [codepen.io/Mamboleoo/pen/obWGYr](https://codepen.io/Mamboleoo/pen/obWGYr)

- Text rendered as colorful particles
- Particles scatter and reform on interaction
- Colors: Orange, yellow, teal mix
- Mouse interaction affects particle behavior

**Techniques**:
- Canvas 2D particle rendering
- Mouse position tracking
- Particle physics (attraction/repulsion)
- Color palette management

### 2. Interactive 3D Background - Kevin Levron
**Source**: [codepen.io/soju22/pen/PLeLwo](https://codepen.io/soju22/pen/PLeLwo)

- Three.js with PlaneBufferGeometry
- Simplex noise animation
- Flowing wave terrain effect
- Adjustable parameters (noise, height coefficients)

**Techniques**:
- Three.js setup
- Simplex/Perlin noise
- Vertex displacement
- GUI controls for parameters

### 3. tsParticles Collection - Matteo Bruni
**Source**: [codepen.io/collection/DPOage](https://codepen.io/collection/DPOage)

Library of particle effects:
- Mouse cursor trails
- Click pop effects
- Zig-zag paths
- Configurable particle systems

**Techniques**:
- tsParticles library usage
- Configuration-based particle systems
- Event-driven particles

## Relevant Techniques for breathe-together

### Particle Rendering
```javascript
// Basic particle structure
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.size = Math.random() * 3 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
```

### Breathing-Synced Motion
```javascript
// Sync particle behavior to breathing phase
function updateParticles(breathPhase, progress) {
  particles.forEach(p => {
    // During inhale: particles move inward
    if (breathPhase === 'inhale') {
      p.vx = (centerX - p.x) * 0.01 * progress;
      p.vy = (centerY - p.y) * 0.01 * progress;
    }
    // During exhale: particles drift outward
    else {
      p.vx = (p.x - centerX) * 0.005;
      p.vy = (p.y - centerY) * 0.005;
    }
  });
}
```

### Glow Effects
```javascript
// Add glow to particles
ctx.shadowBlur = 15;
ctx.shadowColor = particle.color;
ctx.beginPath();
ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
ctx.fill();
ctx.shadowBlur = 0; // Reset
```

## Libraries to Consider

1. **Three.js** - Current choice, good for 3D orb + particles
2. **tsParticles** - Lightweight, config-based, good for 2D
3. **Pts.js** - Creative coding library with particle support
4. **Canvas API** - Direct control, best performance for simple effects
