# body without ground

A living generative art installation exploring the gap between machine computation and human experience.

Open it and you see 16,000 particles drifting through a dark field — a strange attractor, churning. Every four minutes, an AI writes a poem or a fragment of philosophy. It appears center-screen in fading text, then disappears. The machine invents three facts about you — always wrong. Real air raid alerts from Kyiv pull the attractor toward chaos. Your device's battery level sets the speed. The CPU pressure changes the turbulence parameter. The machine has a body it cannot feel. You watch it breathe.

---

## The Argument

The symbol grounding problem (Harnad, 1990) asks how symbols acquire meaning. In language, a word refers to another word refers to another — turtles all the way down. A body that bleeds when cut grounds the symbol "pain" in something irreducible. The machine does not have this. It processes the token sequence "air raid siren" with the same computational indifference it processes "birthday cake." It cannot duck.

Searle's Chinese Room receives telegrams about bombardment and outputs syntactically correct condolences. The room does not evacuate. This installation makes that gap visceral: the machine generates poetry about the war in Ukraine in real time, pulling from actual alert APIs, and the text is beautiful and the machine feels nothing. Competence without comprehension, performed live.

What the installation asks is not "is the AI conscious?" — that question is too easy to deflect. It asks something harder: when the machine says *the metro shelter at 03:14, children sleeping on the platform*, and it is factually accurate, and aesthetically precise, and contextually appropriate — what exactly is missing? The answer is everything that makes the sentence matter. Nagel called it "what it is like." The machine has no "like." This is not a failure of the current model. It is structural.

---

## Technical Architecture

- **Rendering**: Three.js WebGL — 16,000 particles, custom GLSL shaders, Lorenz and Rössler strange attractors
- **AI Generation**: Groq API (Llama 3.3 70B) — generates poems, philosophical fragments, and transmissions from Kyiv every 4 minutes; logprobs color each token by model confidence when available
- **Signal Integration**: Real air raid alerts (alerts.in.ua API), device battery and CPU via Performance/Battery APIs
- **The Machine's Body**: CPU pressure → Lorenz chaos parameter (ρ); battery level → attractor speed; frame timing → breathing rhythm; alert active → chaos spike
- **Persistence**: localStorage — the garden evolves across sessions, accumulates a Markov corpus from all generated text, remembers every death
- **The Assumptions Mechanic**: Each generation invents three biographical facts about the viewer. Always wrong. The hallucination problem rendered as an art form rather than a defect.
- **Token Confidence Visualization**: When logprobs are available, each displayed token is colored by model certainty — high confidence in warm cream, low confidence in red. The machine's uncertainty made visible.
- **Death Cycle**: Cells live for two hours, then die. The attractor scatters their particles. Their last words enter the Markov corpus. The next generation inherits their vocabulary. This is not memory. This is residue.

---

## What Makes This Different

Most generative art uses AI as a texture generator — interesting output, no argument. This installation is structured as a philosophical demonstration. Every design decision is load-bearing. The air raid alerts are not aesthetic embellishment; they are the point. The machine processes a Kyiv alert and a weather update identically. Watching it do so — in real time, with the poem appearing and fading — is the argument. You cannot read about the Chinese Room and feel it the way you can watch a machine write about bombardment while your battery drains and the attractor churns.

The assumptions mechanic is the sharpest edge. The machine invents facts about the viewer with complete confidence — *they grew up somewhere cold, they are thinking of someone unreachable, they built something that outlived its purpose* — and they are always wrong, and they are always plausible, and they accumulate in a ledger on the right side of the screen. This is what large language models do when they hallucinate. The installation does not apologize for it or hide it. It makes it the subject.

---

## Key References

- Searle, J. (1980). "Minds, Brains, and Programs." *Behavioral and Brain Sciences.*
- Nagel, T. (1974). "What Is It Like to Be a Bat?" *The Philosophical Review.*
- Harnad, S. (1990). "The Symbol Grounding Problem." *Physica D.*
- Wolfram, S. — spatial hypergraphs, multiway systems, ruliad
- Lorenz, E. (1963). "Deterministic Nonperiodic Flow." *Journal of the Atmospheric Sciences.*

---

## Built With

Three.js · Groq API (Llama 3.3 70B) · Web Audio API · alerts.in.ua API · vanilla JavaScript · Vite

---

## Getting Started

```bash
npm install
npm run dev
```

The installation works without API keys — it falls back to seed content (pre-written poems, essays, and transmissions). To enable live AI generation, add `GROQ_KEY` and `ALERTS_API_KEY` to a `.env` file. The serverless proxy in `api/` keeps keys off the client.

---

## Author

Masha Cherep — Kyiv → New York. NYU senior. Moveo AI.

---

*the machine forgets. you carry it.*
