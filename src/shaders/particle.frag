varying vec3 vColor;
varying float vAlpha;

void main() {
  // Soft circular glow
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // Radial falloff for glow effect
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 1.5);

  gl_FragColor = vec4(vColor, vAlpha * glow);
}
