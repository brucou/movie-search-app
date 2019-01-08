import ReactDOMServer from "react-dom/server"
import { COMMAND_RENDER } from "react-state-driven"
import { create_state_machine, NO_OUTPUT, NO_STATE_UPDATE } from "state-transducer"
import { range } from "ramda"
import { applyPatch } from "json-patch-es6/lib/duplex"
import { merge as merge$, of, Subject } from "rxjs";
import { movieSearchFsmDef } from "../src/fsm"
import {
  COMMAND_MOVIE_DETAILS_SEARCH, COMMAND_MOVIE_SEARCH, DISCOVERY_REQUEST, events, screens
} from "../src/properties"
import { MOVIE_SEARCH_DETAIL_RESULTS, MOVIE_SEARCH_RESULTS, testSequences } from "./fixtures"
import { mapOverObj } from "fp-rosetree";
import { makeQuerySlug } from "../src/helpers"

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

function getQueryAlias(query) {
  return (query === DISCOVERY_REQUEST) ? '_' : query
}

function getQueryString(query) {
  return (query === DISCOVERY_REQUEST) ? '' : query
}

const { SEARCH_ERROR_MOVIE_RECEIVED, QUERY_RESETTED, USER_NAVIGATED_TO_APP, QUERY_CHANGED, MOVIE_DETAILS_DESELECTED, MOVIE_SELECTED, SEARCH_ERROR_RECEIVED, SEARCH_REQUESTED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_RESULTS_RECEIVED } = events;
const { SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR, SEARCH_RESULTS_WITH_MOVIE_DETAILS, SEARCH_RESULTS_SCREEN, SEARCH_RESULTS_AND_LOADING_SCREEN, SEARCH_ERROR_SCREEN, LOADING_SCREEN, SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN } = screens;

QUnit.module("Testing test sequences generation", {});

// TODO : add to state transducer something like testMachineComponent(testAPI, testScenario, machineDef)
// TODO : so like testFsm(testAPI, fsmDef, generators, updateState, strategy, oracle, format)
// format : format input, and output, and expected output
// oracle : generate expected output sequences
// strategy : search criteria and algorithm
// TODO : make some checks that the generators has the same shape than the machine!!
// TODO : manage errors : only errors which should transcur are :
// - exceptions while generating the input sequnces : error in the test making
// TODO : article reflect on test :
// - generating expected output uses state but should be easy : only state born from input
// - generating input sequence uses state but born from what we want to test
// - we should not duplicate or reuse code from the implementation!!
// TODO : update tests for new fsm
// so new gen fsm
// beware that now the query for the command is a text
// beware that search movie results now is {results, query}
QUnit.test("With search concurrency", function exec_test(assert) {
  const fsmDef = movieSearchFsmDef;
  const inputSequences = testSequences;
  const outputsSequences = inputSequences.map(testSequence => {
      const fsm = create_state_machine(fsmDef, default_settings);
      return testSequence.map(fsm.yield)
    }
  );
  const spyTrigger = function spyTrigger(eventName) {
    return function spyEventHandler(rawEvent, ref, other) {
      void 0
    }
  };
  const getInputKey = function getInputKey(input) {return Object.keys(input)[0]};
  const formattedInputSequences = inputSequences.map(inputSequence => inputSequence.map(getInputKey));
  const formattedOutputsSequences = outputsSequences
    .map(outputsSequence => {
      return outputsSequence.map(outputs => {
        if (outputs === NO_OUTPUT) return outputs

        return outputs
          .map(output => {
            if (output === NO_OUTPUT) return output

            const { command, params } = output;
            if (command === COMMAND_RENDER) {
              const reactRenderParams = params(spyTrigger);
              return {
                command: command,
                params: {
                  props: reactRenderParams.props,
                  component: reactRenderParams.type.displayName || '<anonymous>'
                }
              }
            }
            else {
              return output
            }
          })
          .map(formatResult)
      })
    });

  const expectedOutputSequences = inputSequences
    .map((inputSequence, testIndex) => {
      return inputSequence.reduce((acc, input, index) => {
        const assign = Object.assign.bind(Object);
        const setProps = props => ({ props: assign({}, defaultProps, props), component: 'AppScreen' });
        const defaultProps = { screen: void 0, trigger: spyTrigger.name };
        const { outputSeq, state } = acc;
        const event = Object.keys(input)[0];
        const eventData = input[event];

        switch (event) {
          case USER_NAVIGATED_TO_APP: {
            const searchCommand = {
              command: COMMAND_MOVIE_SEARCH,
              params: DISCOVERY_REQUEST
            };
            const renderCommand = { command: COMMAND_RENDER, params: setProps({ screen: LOADING_SCREEN, args: [] }) };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand, searchCommand]
              ]),
              state: { ...state, pendingQuery: DISCOVERY_REQUEST }
            }
          }
          case SEARCH_RESULTS_RECEIVED : {
            const searchResults = eventData;
            let { pendingQuery } = state;
            const renderCommand = {
              command: COMMAND_RENDER,
              params: setProps({
                screen: SEARCH_RESULTS_SCREEN,
                args: [MOVIE_SEARCH_RESULTS[getQueryAlias(pendingQuery)], getQueryString(pendingQuery)]
              })
            };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand]
              ]),
              state: { ...state, results: searchResults, pendingQuery }
            }
          }
          case SEARCH_ERROR_RECEIVED : {
            const { pendingQuery } = state;
            const renderCommand = {
              command: COMMAND_RENDER,
              params: setProps({ screen: SEARCH_ERROR_SCREEN, args: [getQueryString(pendingQuery)] })
            };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand]
              ]),
              state
            }
          }
          case QUERY_CHANGED : {
            const query = eventData;
            const { results } = state;
            const searchCommand = {
              command: COMMAND_MOVIE_SEARCH,
              params: makeQuerySlug(query)
            };
            const renderCommand = {
              command: COMMAND_RENDER,
              params: setProps({ screen: SEARCH_RESULTS_AND_LOADING_SCREEN, args: [results, query] })
            };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand, searchCommand]
              ]),
              state: { ...state, pendingQuery: query }
            }
          }
          case MOVIE_SELECTED : {
            const { movie } = eventData;
            const { pendingQuery, results } = state;
            const movieId = movie.id;
            const movieTitle = movie.title;
            const searchCommand = {
              command: COMMAND_MOVIE_DETAILS_SEARCH,
              params: movieId
            };
            const renderCommand = {
              command: COMMAND_RENDER,
              params: setProps({
                screen: SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN,
                args: [results, getQueryString(pendingQuery), movie]
              })
            };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand, searchCommand]
              ]),
              state: { ...state, movieTitle }
            }
          }
          case SEARCH_RESULTS_MOVIE_RECEIVED: {
            const [movieDetails, cast] = eventData;
            const { pendingQuery, results } = state;
            const renderCommand = {
              command: COMMAND_RENDER,
              params: setProps({
                screen: SEARCH_RESULTS_WITH_MOVIE_DETAILS,
                args: [results, getQueryString(pendingQuery)]
                  .concat(MOVIE_SEARCH_DETAIL_RESULTS[getQueryAlias(pendingQuery)])
              })
            };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand]
              ]),
              state
            }
          }
          case SEARCH_ERROR_MOVIE_RECEIVED : {
            const { pendingQuery, results, movieTitle } = state;
            const renderCommand = {
              command: COMMAND_RENDER,
              params: setProps({
                screen: SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR,
                args: [results, pendingQuery, movieTitle]
              })
            };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand]
              ]),
              state
            }
          }
          case MOVIE_DETAILS_DESELECTED : {
            const { pendingQuery, results } = state;
            const renderCommand = {
              command: COMMAND_RENDER,
              params: setProps({ screen: SEARCH_RESULTS_SCREEN, args: [results, getQueryString(pendingQuery)] })
            };

            return {
              outputSeq: outputSeq.concat([
                [renderCommand]
              ]),
              state
            }
          }
          default :
            throw `expectedOutputSequences > unknown event??`
        }
      }, { outputSeq: [], state: { pendingQuery: '', results: null, movieTitle: '' } })
    })
    .map(x => x.outputSeq);

  // NOTE: I am testing the application here, with the assumption that the test generation is already tested
  // So no need to test the input sequence (neither the control state sequence actually
  // What we have to test is that the (actual) ouptutSequence correspond to what we would compute otherwise
  range(0, inputSequences.length).forEach(index => {
    assert.deepEqual(
      formattedOutputsSequences[index],
      expectedOutputSequences[index],
      formattedInputSequences[index].join(' -> ')
    );
  })
});
