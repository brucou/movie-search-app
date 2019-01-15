// Core
import {Observable, Subject} from 'rxjs/Rx'
import {startWith} from 'rxjs/operators'
import { run } from '@cycle/rxjs-run'
import { App } from './app'
// View library
import ReactDOM from 'react-dom';
import {
  COMMAND_MOVIE_SEARCH, COMMAND_MOVIE_DETAILS_SEARCH, DISCOVERY_REQUEST, events, COMMAND_RENDER, screens, READY,
} from "./properties"
import { makeQuerySlug, runMovieDetailQuery, runMovieSearchQuery } from "./helpers"
import { commandDriverFactory } from "./drivers"

const rootEl = document.getElementById('root');

const {SEARCH_RESULTS_RECEIVED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_ERROR_MOVIE_RECEIVED, SEARCH_ERROR_RECEIVED, USER_NAVIGATED_TO_APP} = events;
const eventHandler = new Subject();

const commandHandlers = {
  [COMMAND_MOVIE_SEARCH]: (trigger, _query, effectHandlers) => {
    const querySlug = _query === '' ? DISCOVERY_REQUEST : makeQuerySlug(_query);

    effectHandlers.runMovieSearchQuery(querySlug)
      .then(data => {
        trigger(SEARCH_RESULTS_RECEIVED)({ results: data.results, query: _query })
      }).catch(error => {
      trigger(SEARCH_ERROR_RECEIVED)({query: _query})
    });
  },
  [COMMAND_MOVIE_DETAILS_SEARCH]: (trigger, movieId, effectHandlers) => {
    effectHandlers.runMovieDetailQuery(movieId)
      .then(([details, cast]) => trigger(SEARCH_RESULTS_MOVIE_RECEIVED)([details, cast]))
      .catch(err => trigger(SEARCH_ERROR_MOVIE_RECEIVED)(err))
  },

  [COMMAND_RENDER]: function renderHandler(trigger, params, effectHandlersWithRender) {
    const reactElement= params(trigger);
    effectHandlersWithRender[COMMAND_RENDER](reactElement);
  }
};

const effectHandlers = {
  runMovieSearchQuery: runMovieSearchQuery,
  runMovieDetailQuery: runMovieDetailQuery,
  // NOTE : Ideally the components should be created lazily the first time they are required
  // In this demo, we cover the simplest scenario : 1 component, anchor already in place
  // In the general case, it is necessary to specify an anchoring element, and that element
  // will often depend on the parent, and may only be known late : late binding will be necessary)
  [COMMAND_RENDER] : function reactRender(reactElement, callback) {
    return ReactDOM.render(reactElement, rootEl, callback);
  }
};

const drivers = {
  commands : commandDriverFactory(eventHandler, commandHandlers, effectHandlers),
  eventHandler : () => eventHandler.startWith([READY, void 0, void 0 ])
};

run(App, drivers);
