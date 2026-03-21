varying vec3 vColor;
varying float vAlpha;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // Sharp bright core + subtle outer halo
  float core = 1.0 - smoothstep(0.0, 0.15, dist);  // bright center
  float halo = 1.0 - smoothstep(0.0, 0.5, dist);   // soft outer glow
  halo = pow(halo, 2.5);

  float brightness = core * 0.7 + halo * 0.3;

  // Color: core is white-hot, halo is tinted
  vec3 col = mix(vColor, vec3(1.0), core * 0.4);

  gl_FragColor = vec4(col, vAlpha * brightness);
}
