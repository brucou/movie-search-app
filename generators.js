import { range } from "ramda"
import { events } from "./src/properties"
import { INITIAL_REQUEST_RESULTS, MOVIE_SEARCH_RESULTS } from "./tests/fixtures"

const MAX = 3;

// monoidal zero
function chainZero({ state }) {
  return { state, generated: [] }
}

// TODO : make lower values more likely
const randomStrategy = { choose: max => {
  return Math.floor(Math.random() * (max||MAX)) }
}

function oneOf(generators) {
  return oneOfCore(randomStrategy, generators)
}

function oneOfCore(choiceStrategy, generators) {
  return function oneOfCore({ state }) {
    const choice = choiceStrategy.choose(generators.length);
    return generators[choice]({ state })
  }
}

function init(value, initState) {
  return function init({ state }) {
    return { state: initState, generated: [value] }
  }
}

function chain(generators) {
  return function chain({ state }) {
    return generators.reduce((acc, generator) => {
      const { state: s1, generated: g1 } = acc;
      const { state: s2, generated: g2 } = generator({ state: s1 });
      return { state: s2, generated: g1.concat(g2) }
    }, { state, generated: [] });
  }
}

function oneOrMoreCore(choiceStrategy, generator) {
  return function oneOrMoreCore({state}) {
    if (typeof choiceStrategy === "number") choiceStrategy = Object.assign({}, randomStrategy, { max: choiceStrategy });
    const number = choiceStrategy.choose(choiceStrategy.max || MAX - 1) + 1;

    return chain(range(0, number).map(_ => generator))({state})
  }
}

function oneOrMore(generator) {
  return oneOrMoreCore(randomStrategy, generator)
}

function noneOrMoreCore(choiceStrategy, generator) {
  return function noneOrMoreCore({state}){
    const number = choiceStrategy.choose(choiceStrategy.max || MAX);
    if (number === 0) return chainZero({state})
    else return oneOrMoreCore({ choose: () => number }, generator)({state})
  }
}
function noneOrMore(generator) {
  return noneOrMoreCore(randomStrategy, generator)
}

function run(generator, initialState) {
  return generator({ state: initialState }).generated
}


// function clickIn({state}){
//   return {
//     state : state, // TODO : add movie details
//     generated : [{click : state something}]
//   }
// }

export {
  noneOrMore,
  oneOrMore,
  oneOrMoreCore,
  chain,
  init,
  oneOf,
  chainZero,
  randomStrategy,
  run
}
