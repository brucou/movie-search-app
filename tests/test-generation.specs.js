import ReactDOMServer from "react-dom/server"
import { COMMAND_RENDER } from "react-state-driven"
import { create_state_machine, NO_OUTPUT, NO_STATE_UPDATE, testFsm } from "state-transducer"
import { range } from "ramda"
import { applyPatch } from "json-patch-es6/lib/duplex"
import { merge as merge$, of, Subject } from "rxjs";
import { movieSearchFsmDef } from "../src/fsm"
import { COMMAND_MOVIE_DETAILS_SEARCH, COMMAND_MOVIE_SEARCH, events, screens } from "../src/properties"
import { INITIAL_REQUEST_RESULTS, MOVIE_SEARCH_DETAIL_RESULTS, MOVIE_SEARCH_RESULTS, testSequences } from "./fixtures"
import { mapOverObj } from "fp-rosetree";
import { chain, init, noneOrMore, oneOf, oneOrMore, oneOrMoreCore, run } from "../generators"

export function tryCatch(fn, err) {
  return function (...args) {
    try {
      return fn.apply(null, args)
    }
    catch (e) {
      return err(e)
    }
  }
}

export function constGen(input, generatorState) {
  return function constGen(extS, genS) {
    return { hasGeneratedInput: true, input, generatorState };
  };
}

/**
 * Format results from automated test generation.
 * CONTRACT : React is used for DOM rendering.
 * NOTE : unclear if that works with React fragment. Probably, if `renderToStaticMarkup` works with it
 * @param results
 * @returns {*}
 */
export function reactFormatOutputSequence(results) {
  const fakeTrigger = eventName => function fakeEventHandler() {};
  console.log('results', results)

  const formattedResults = results.map(result => {
    const { inputSequence, outputSequence, controlStateSequence } = result;
    return {
      inputSequence,
      controlStateSequence,
      outputSequence: tryCatch(
        outputSequence => outputSequence.map(outputs => {
          return (outputs || []).map(output => {
            if (output === null) return output
            const { command, params } = output;
            if (command !== 'render') return output

            return {
              command,
              params: ReactDOMServer.renderToStaticMarkup(params(fakeTrigger))
            }
          })
        }),
        e => {
          console.error(`Error while computing output sequences for input sequences`, inputSequence);
          return "ERROR: " + e
        }
      )(outputSequence)
    }
  });

  console.log('formatted results', formattedResults);
  return formattedResults
}

function isFunction(obj) {
  return typeof obj === "function";
}

function isPOJO(obj) {
  const proto = Object.prototype;
  const gpo = Object.getPrototypeOf;

  if (obj === null || typeof obj !== "object") {
    return false;
  }
  return gpo(obj) === proto;
}

export function formatResult(result) {
  if (!isPOJO(result)) {
    return result;
  }
  else {
    return mapOverObj({
        key: x => x,
        leafValue: prop => isFunction(prop)
          ? (prop.name || prop.displayName || "anonymous")
          : Array.isArray(prop)
            ? prop.map(formatResult)
            : prop
      },
      result);
  }
}

function formatInputSequence(inputSequence){
  return inputSequence.map(input => Object.keys(input)[0]).join(' -> ')
}

/**
 *
 * @param {FSM_Model} model
 * @param {Operation[]} modelUpdateOperations
 * @returns {FSM_Model}
 */
function applyJSONpatch(model, modelUpdateOperations) {
  return applyPatch(model, modelUpdateOperations, false, false).newDocument;
}

const default_settings = {
  updateState: applyJSONpatch,
  subject_factory: () => {
    const subject = new Subject();
    // NOTE : this is intended for Rxjs v4-5!! but should work for `most` also
    subject.emit = subject.next || subject.onNext;
    return subject
  },
  merge: function merge(arrayObs) {return merge$(...arrayObs)},
  of: of,
};
const NO_ACTIONS = () => ({ outputs: NO_OUTPUT, updates: NO_STATE_UPDATE });

const { SEARCH_ERROR_MOVIE_RECEIVED, QUERY_RESETTED, USER_NAVIGATED_TO_APP, QUERY_CHANGED, MOVIE_DETAILS_DESELECTED, MOVIE_SELECTED, SEARCH_ERROR_RECEIVED, SEARCH_REQUESTED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_RESULTS_RECEIVED } = events;
const { SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR, SEARCH_RESULTS_WITH_MOVIE_DETAILS, SEARCH_RESULTS_SCREEN, SEARCH_RESULTS_AND_LOADING_SCREEN, SEARCH_ERROR_SCREEN, LOADING_SCREEN, SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN } = screens;

QUnit.module("Testing properties", {});

// Properties
function lastScreenShowsMovieList(outputsSequence){
  let lastOutputs = outputsSequence.slice(-1);
  if (lastOutputs === null) return false;
  lastOutputs = lastOutputs.filter(x => x!== null)[0];
  return lastOutputs.some(output => {
    const {command, params} = output;
    return command === COMMAND_RENDER &&
      params(()=>{}).props.screen === SEARCH_RESULTS_SCREEN
  })
}

// Ad-hoc to copy in the test
function movieSelectedAndBack({ state }) {
  const { results, movieQuery } = state;
  // Always use the first one, we aint got fixtures for nothing else
  const movie = results && results[0];

  return {
    state: state,
    generated: [
      { [events.MOVIE_SELECTED]: { movie } },
      { [events.SEARCH_RESULTS_MOVIE_RECEIVED]: MOVIE_SEARCH_DETAIL_RESULTS[movieQuery ? movieQuery : '_'] },
      { [events.MOVIE_DETAILS_DESELECTED]: void 0 }
    ]
  }
}
function queryChanged({ state }) {
  const query = state.movieQuery || '';
  const nextChar = query ? String.fromCharCode(query.slice(-1).charCodeAt(0) + 1) : 'a'
  const nextQuery = query.length > 2 ? '' : query + nextChar;
  return {
    state: { ...state, movieQuery: nextQuery },
    generated: { [events.QUERY_CHANGED]: nextQuery }
  }
}
function initQuerySucceeded({ state }) {
  return {
    state : {...state, movieQuery: '', results : INITIAL_REQUEST_RESULTS},
    generated : {[events.SEARCH_RESULTS_RECEIVED] : {results: INITIAL_REQUEST_RESULTS, query : ''}}
  }
}
function successLastQuery({ state }) {
  const { movieQuery } = state;
  const results =movieQuery.length === 0 ? INITIAL_REQUEST_RESULTS : MOVIE_SEARCH_RESULTS[movieQuery ? movieQuery : '_'];
  return {
    state : {...state, results},
    generated : {[events.SEARCH_RESULTS_RECEIVED] : {results, query : movieQuery}}
  }
}
const initEvent = { [events.USER_NAVIGATED_TO_APP]: void 0 };
const initialState = { results: [], selectedMovie: void 0, movieQuery: '' };
const incrementallyTypedQuery = chain([oneOrMoreCore(3, queryChanged), successLastQuery]);
const seq1 = chain([init(initEvent, initialState), initQuerySucceeded, noneOrMore(oneOf([movieSelectedAndBack, incrementallyTypedQuery]))]);

QUnit.test("Sequence of input leading to see a list of fetched movies", function (assert){
  range(0, 20).forEach(index => {
    const inputSequence = run(seq1, {});
    const fsm = create_state_machine(movieSearchFsmDef, default_settings);
    const outputsSequence = inputSequence.map(fsm.yield);
    assert.ok(lastScreenShowsMovieList(outputsSequence), formatInputSequence(inputSequence));
  });
});

// TODO : make some checks that the generators has the same shape than the machine!!
// TODO : manage errors : only errors which should transcur are :
// - exceptions while generating the input sequnces : error in the test making
// TODO : article reflect on test :
// - generating expected output uses state but should be easy : only state born from input
// - generating input sequence uses state but born from what we want to test
// - we should not duplicate or reuse code from the implementation!!


// TODO : to test testFsm : that is when you have an oracle (never?)
