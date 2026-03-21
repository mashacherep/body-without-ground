varying vec3 vColor;
varying float vAlpha;
varying float vPhase;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // Clean smooth falloff — like a real point of light
  float glow = exp(-dist * dist * 12.0);

  // Very subtle color warmth toward center
  vec3 col = mix(vColor, vColor * 1.1, glow * 0.3);

  // Gentle desaturation for realism
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(luma), 0.1);

  gl_FragColor = vec4(col, vAlpha * glow);
}
