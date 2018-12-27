import { INIT_EVENT, INIT_STATE, NO_OUTPUT, NO_STATE_UPDATE } from "state-transducer";
import {
  events, MOVIE_DETAIL_QUERYING, MOVIE_DETAIL_SELECTION, MOVIE_DETAIL_SELECTION_ERROR, MOVIE_QUERYING, MOVIE_SELECTION,
  MOVIE_SELECTION_ERROR
} from "./properties"

const NO_ACTIONS = () => ({ outputs: NO_OUTPUT, updates: NO_STATE_UPDATE });

const initialExtendedState = {
  // TODO don't know yet which will be the state
  queryFieldHasChanged: false,
  movieQuery: null,
  results: null,
  movieTitle: null,
  movieDetails: null,
  cast: null
};
const states = {
  [MOVIE_QUERYING]: "",
  [MOVIE_SELECTION]: "",
  [MOVIE_SELECTION_ERROR]: "",
  [MOVIE_DETAIL_QUERYING]: "",
  [MOVIE_DETAIL_SELECTION]: "",
  [MOVIE_DETAIL_SELECTION_ERROR]: ""
};
// TODO
const { USER_NAVIGATED_TO_APP, SEARCH_RESULTS_RECEIVED, SEARCH_ERROR_RECEIVED, QUERY_CHANGED, MOVIE_SELECTED, SEARCH_RESULTS_MOVIE_RECEIVED, MOVIE_DETAILS_DESELECTED, SEARCH_ERROR_MOVIE_RECEIVED } = events;
const transitions = [
// TODO
  { from: INIT_STATE, event: INIT_EVENT, to: MOVIE_QUERYING, action: displayLoadingScreenAndQueryDb },
  { from: MOVIE_QUERYING, event: SEARCH_RESULTS_RECEIVED, to: MOVIE_SELECTION, action: displayMovieSearchResultsScreen },
  // TODO : is that the same function?? think about it, maybe better to have separate function, and refactor later?
  { from: MOVIE_SELECTION, event: QUERY_CHANGED, to: MOVIE_QUERYING, action: displayLoadingScreenAndQueryDb },
  { from: MOVIE_QUERYING, event: SEARCH_ERROR_RECEIVED, to: MOVIE_SELECTION_ERROR, action: displayMovieSearchErrorScreen },
  { from: MOVIE_SELECTION, event: MOVIE_SELECTED, to: MOVIE_DETAIL_QUERYING, action: displayDetailsLoadingScreenAndQueryDetailsDb },
  { from: MOVIE_DETAIL_QUERYING, event: SEARCH_RESULTS_MOVIE_RECEIVED, to: MOVIE_DETAIL_SELECTION, action: displayMovieDetailsSearchResultsScreen },
  { from: MOVIE_DETAIL_QUERYING, event: SEARCH_ERROR_MOVIE_RECEIVED, to: MOVIE_DETAIL_SELECTION_ERROR, action: displayMovieDetailsSearchErrorScreen },
  { from: MOVIE_DETAIL_SELECTION, event: MOVIE_DETAILS_DESELECTED, to: MOVIE_SELECTION, action: displayMovieSearchResultsScreen },
  {
    from: "loading", event: "SEARCH_SUCCESS", to: "gallery", action: (extendedState, eventData, fsmSettings) => {
      const items = eventData;

      return {
        updates: [{ op: "add", path: "/items", value: items }],
        outputs: NO_OUTPUT
      };
    }
  },
];

const movieSearchFsmDef = {
  initialExtendedState,
  states,
  events,
  transitions
};

function displayLoadingScreenAndQueryDb(extendedState, eventData, fsmSettings){
  // TODO
}

function displayMovieSearchResultsScreen(extendedState, eventData, fsmSettings){
  // TODO
}

function displayMovieSearchErrorScreen(extendedState, eventData, fsmSettings){
  // TODO
}

function displayDetailsLoadingScreenAndQueryDetailsDb(extendedState, eventData, fsmSettings){
  // TODO
}

function displayMovieDetailsSearchResultsScreen(extendedState, eventData, fsmSettings){
  // TODO
}

function displayMovieDetailsSearchErrorScreen(extendedState, eventData, fsmSettings){
  // TODO
}


export default {
  // TODO : write it with transducers, and emitonoff emitter, will have to do lots of API surfaceing, and change
  // emit to next in state-transducer -? new version pass it to master
  // TODO : mmm but I must have implementation on th 7.1 though, will that not delay me a lot? should not
  // worse case use rx
  eventHandler: stateTransducerRxAdapter,
  // TODO : use simplest preprocessor i.e. identity
  preprocessor: movieSearchFsmDef.preprocessor,
  commandHandlers: movieSearchFsmDef.commandHandlers,
  // TODO runSearchQuery to mock
  effectHandlers: movieSearchFsmDef.effectHandlers,
  // TODO here the definition of the fsm
  ...movieSearchFsmDef,
}
