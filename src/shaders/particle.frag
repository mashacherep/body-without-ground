varying vec3 vColor;
varying float vAlpha;
varying float vPhase;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // Sharp center, soft edge — not blurry
  float glow = 1.0 - smoothstep(0.0, 0.35, dist);
  glow *= glow; // sharpen

  vec3 col = vColor;

  // Slight desaturation
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(luma), 0.08);

  gl_FragColor = vec4(col, vAlpha * glow);
}
