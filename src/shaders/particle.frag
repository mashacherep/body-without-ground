varying vec3 vColor;
varying float vAlpha;
varying float vPhase;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  if (dist > 0.5) discard;

  // Organic noise-like edge — break the perfect circle
  float noiseOffset = sin(vPhase * 17.3 + uv.x * 31.0) * cos(vPhase * 7.1 + uv.y * 23.0) * 0.06;
  float adjustedDist = dist + noiseOffset;

  // Soft falloff — no hard bright core, just gradual dimming
  float glow = 1.0 - smoothstep(0.0, 0.45, adjustedDist);
  glow = pow(glow, 1.8);

  // Subtle inner concentration (NOT a hard bright circle)
  float innerGlow = 1.0 - smoothstep(0.0, 0.2, adjustedDist);
  innerGlow = pow(innerGlow, 3.0) * 0.3; // very subtle

  float brightness = glow + innerGlow;

  // Color stays mostly the type color — only the very center gets slightly warmer
  // NO white-washing — keep the natural color
  vec3 col = vColor;
  col = mix(col, col * 1.15, innerGlow); // slightly brighter center, same hue

  // Subtle phase-based luminosity variation (organic shimmer)
  float shimmer = 1.0 + sin(vPhase * 11.0 + vColor.g * 5.0) * 0.05;

  // Desaturate slightly for realism — pure saturated colors look neon
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(luma), 0.15); // 15% desaturation

  gl_FragColor = vec4(col * shimmer, vAlpha * brightness * 0.85);
}
