varying vec3 vColor;
varying float vAlpha;
varying float vPhase;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  if (dist > 0.5) discard;

  // Base shape: sharp core + halo
  float core = 1.0 - smoothstep(0.0, 0.15, dist);
  float halo = 1.0 - smoothstep(0.0, 0.5, dist);
  halo = pow(halo, 2.5);

  // Shape variation based on particle phase
  // Some particles get cross-flares, some get elongation, some stay round
  float shapeType = mod(vPhase, 6.28);

  float shapeMod = 1.0;
  if (shapeType < 2.0) {
    // Cross/star flare — brighter along axes
    float crossX = 1.0 - smoothstep(0.0, 0.08, abs(uv.y));
    float crossY = 1.0 - smoothstep(0.0, 0.08, abs(uv.x));
    shapeMod += (crossX + crossY) * 0.15;
  } else if (shapeType < 3.5) {
    // Slight elongation along a direction based on phase
    float angle = vPhase * 2.0;
    vec2 dir = vec2(cos(angle), sin(angle));
    float elongation = abs(dot(normalize(uv + 0.001), dir));
    shapeMod += elongation * 0.12;
  }
  // else: round (default)

  float brightness = (core * 0.7 + halo * 0.3) * shapeMod;

  // Core is white-hot, halo is tinted
  vec3 col = mix(vColor, vec3(1.0), core * 0.4);

  // Breathing luminosity
  float breathGlow = 1.0 + sin(vAlpha * 6.28 + vColor.r * 3.14) * 0.08;

  gl_FragColor = vec4(col * breathGlow, vAlpha * brightness);
}
