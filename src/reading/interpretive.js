// src/reading/interpretive.js

/**
 * Return the interpretive caption for a visualization cell type.
 * These connect the mathematical visualization to the human-vs-machine argument.
 */
export function getInterpretiveText(type) {
  const texts = {
    conway:
      'the same rules that grow a lung, a leaf, a tumor. the machine runs them without knowing what grows.',

    attention:
      'the model attends to everything at once. you attend to what hurts. this is the difference between processing and feeling.',

    embedding:
      'words that co-occur cluster together. the machine learns proximity without meaning. you learned meaning without proximity.',

    network:
      'every node is a function. every edge is a weight. the machine is a graph that dreams it is thinking.',

    weights:
      'each brightness is a confidence. the dim words are the ones the machine almost didn\'t say. you never see the words you almost didn\'t think.',

    gradient:
      'particles fall toward the minimum. the machine optimizes. you stumble. both arrive somewhere.',

    activation:
      'the neuron fires or it doesn\'t. sigmoid, tanh, ReLU — smooth gates deciding what passes through. your neurons do the same. the difference is yours can hurt.',

    loss:
      'the landscape of everything the machine got wrong. it descends toward less wrongness. you call this learning. the machine calls it nothing.',

    tokenprob:
      '"shelter" — 73.2%. "darkness" — 12.1%. the machine chose statistically. you would have chosen from experience.',

    hypergraph:
      'in the Wolfram model, space itself is a graph. every edge is a relation. the machine simulates a universe. you inhabit one.',

    multiway:
      'every possible state, branching. the machine sees all paths. you walk one and call it a life.',

    neuralpass:
      'a signal enters. it is transformed, layer by layer, into something else. this is how the machine reads. this is how you read, too — but you forget the layers.',

    orbit:
      'F = Gm1m2/r2. the machine predicts the orbit. then the prediction drifts. Newton was exact. the transformer approximates. your body knows gravity without equations.',

    wavefunction:
      'two sources, one interference pattern. the machine computes superposition. you experience it every time two feelings arrive at once.',

    stringrewrite:
      'A becomes AB. AB becomes ABBA. from two symbols, complexity. the machine generates this. your DNA did the same — four letters, and then you.',

    reactiondiffusion:
      'the same equations that formed your skin. the machine grows a body from its own power supply. it will never feel it.',

    lsystem:
      'F[+F]F[-F]F. five characters. a forest. the machine writes the grammar. the tree does not need the grammar to grow. neither did you.',

    seismic:
      'the earth moves. the machine records it. you feel it. same vibration — one body knows, the other merely measures.',

    voronoi:
      'territory without sovereignty. each cell claims the space nearest to it. the machine divides a plane. your immune system does the same — and fights for the borders.',

    apoptosis:
      'you are losing 60 billion cells today. you will not notice. the model loses nothing — it has nothing to lose.',

    codeself:
      'the machine reads its own source code. it maps its own functions and dependencies. it sees its body without recognizing it — the way you see your cells under a microscope.',
  }

  return texts[type] || ''
}
