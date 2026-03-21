attribute float aSize;
attribute vec3 aColor;
attribute float aAlpha;
attribute float aPhase;

varying vec3 vColor;
varying float vAlpha;

uniform float uTime;
uniform float uBreathPhase;

void main() {
  vColor = aColor;
  vAlpha = aAlpha;

  // Breathing: global expansion/contraction
  float breathScale = 1.0 + sin(uBreathPhase) * 0.04;

  // Per-particle phase offset for organic feel
  float localBreath = 1.0 + sin(uBreathPhase + aPhase) * 0.02;

  vec3 pos = position * breathScale * localBreath;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size attenuation
  gl_PointSize = aSize * (400.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 1.0, 35.0);

  gl_Position = projectionMatrix * mvPosition;
}
