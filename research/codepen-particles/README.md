# CodePen Particle Effects

Collection of relevant particle system demos and techniques.

## Screenshots

![Text to Particles Demo](./codepen-particles.png)
*Louis Hoebregts' "Text to Particles" demo - colorful particles that scatter and reform with mouse interaction*

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

## User Research on Particle Visualizations

### Scientific Studies on Gameful Breathing Apps

Research on breathing apps with particle/game-like visualizations reveals important UX insights:

**From JMIR Games study on "Breeze" app (Unity + Blender particles):**

> "Nice graphics and landscape, the wind animation is good"

However, users also reported challenges:
> "Not always easy to follow the breathing pattern... clearer guidance of breath in and out needed"
> "Animations are too small - difficult to follow"

### Key Findings

**What Works:**
- Visually engaging particle effects increase perceived fun
- Nature-inspired animations (wind, water) resonate with users
- Smooth, organic movement creates calming effect

**What Needs Care:**
- Complex scenes can make breathing guidance unclear
- Small animations are hard to follow
- Balance between visual interest and breathing clarity is critical

### Interactive Breath Interfaces (Research)

Studies on using breath to control VR and game content found:
- Breath-controlled racing games were rated more fun and immersive than keyboard controls
- However, "difficult when repeatedly blowing breath frequently"
- Recommendation: Prevent frequent breath blowing or expand to easier control methods

### Sources
- [JMIR Games - Physiological Responses to Gameful Breathing Apps](https://games.jmir.org/2021/1/e22802/)
- [PLOS ONE - Interactive Breath Interface for VR](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0241498)
- [DEV Community - Building Interactive Breathing Web Apps](https://dev.to/learncomputer/calm-in-code-building-an-interactive-breathing-exercise-web-app-4433)
