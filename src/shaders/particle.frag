varying vec3 vColor;
varying float vAlpha;
varying float vPhase;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // Crisp center with soft edge
  float glow = 1.0 - smoothstep(0.0, 0.4, dist);
  glow *= glow;

  gl_FragColor = vec4(vColor, vAlpha * glow);
}
