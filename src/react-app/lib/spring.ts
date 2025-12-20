/**
 * Spring physics for organic animations
 * Uses a damped harmonic oscillator model
 */

export interface SpringConfig {
  tension: number;      // Spring stiffness (higher = faster)
  friction: number;     // Damping (higher = less bouncy)
}

export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  tension: 120,
  friction: 18,
};

export class Spring {
  value: number;
  target: number;
  velocity: number;
  tension: number;
  friction: number;

  constructor(
    initialValue: number = 0,
    tension: number = DEFAULT_SPRING_CONFIG.tension,
    friction: number = DEFAULT_SPRING_CONFIG.friction
  ) {
    this.value = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    this.tension = tension;
    this.friction = friction;
  }

  /**
   * Update the spring physics
   * @param dt - Delta time in seconds
   * @returns Current spring value
   */
  update(dt: number): number {
    // Clamp dt to prevent instability with large time gaps
    const clampedDt = Math.min(dt, 0.1);

    // Spring force: F = -k * displacement
    const force = (this.target - this.value) * this.tension;

    // Damping force: F = -c * velocity
    const damping = this.velocity * this.friction;

    // Apply forces (F = ma, assuming m = 1)
    this.velocity += (force - damping) * clampedDt;
    this.value += this.velocity * clampedDt;

    return this.value;
  }

  /**
   * Set a new target for the spring
   */
  setTarget(target: number): void {
    this.target = target;
  }

  /**
   * Update spring parameters
   */
  setParams(tension: number, friction: number): void {
    this.tension = tension;
    this.friction = friction;
  }

  /**
   * Immediately set value without animation
   */
  snapTo(value: number): void {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  /**
   * Check if spring has settled (velocity near zero and close to target)
   */
  isSettled(threshold: number = 0.001): boolean {
    return (
      Math.abs(this.velocity) < threshold &&
      Math.abs(this.target - this.value) < threshold
    );
  }
}

/**
 * Create a spring with variance for organic particle movement
 */
export function createVariedSpring(
  initialValue: number,
  baseTension: number,
  tensionVariance: number,
  baseFriction: number,
  frictionVariance: number
): Spring {
  const tension = baseTension + Math.random() * tensionVariance;
  const friction = baseFriction + Math.random() * frictionVariance;
  return new Spring(initialValue, tension, friction);
}
