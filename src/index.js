// style files
import './uikit.css';
import './index.css';
// Core
import Rx from 'rxjs/Rx'
import { run } from '@cycle/rxjs-run'
import { App } from './app'
// fixtures
import {h} from 'snabbdom/h';
import hyperscript from 'hyperscript-helpers';
import {init} from 'snabbdom';
import ClassModule from 'snabbdom/modules/class';
import PropsModule from 'snabbdom/modules/props';
import AttrsModule from 'snabbdom/modules/attributes';
import StyleModule from 'snabbdom/modules/style';
import DatasetModule from 'snabbdom/modules/dataset';
import {
  COMMAND_MOVIE_SEARCH, COMMAND_MOVIE_DETAILS_SEARCH, DISCOVERY_REQUEST, events, COMMAND_RENDER, screens,
} from "./properties"
import { makeQuerySlug, runMovieDetailQuery, runMovieSearchQuery } from "./helpers"

const $ = Rx.Observable;
const { div, a, ul, li, input, h1, h3, legend, img, dl, dt, dd } = hyperscript(h);
const modules = [
  StyleModule,
  ClassModule,
  PropsModule,
  AttrsModule,
  DatasetModule,
];
const patch = init(modules);
const rootEl = document.getElementById('root');
const mainEventhandler = new Rx.Subject();

const {SEARCH_RESULTS_RECEIVED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_ERROR_MOVIE_RECEIVED, SEARCH_ERROR_RECEIVED} = events;
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
    // TODO
    const {screen, arrProps} = params;
    const vNodes = screens(trigger)[screen](...arrProps);
    effectHandlersWithRender[COMMAND_RENDER](patch, vNodes);
  }
};

const effectHandlers = {
  runMovieSearchQuery: runMovieSearchQuery,
  runMovieDetailQuery: runMovieDetailQuery,
  [COMMAND_RENDER] : void 0 // TODO
};


const drivers = {
  DOM: makeDOMDriver('#root'),
  // TODO : take from React state driven
  command : commandDriverFactory(commandHandlers, effectHandlers),
  eventHandler : mainEventhandler
};

// TODO : Put a document ready promise here
Promise.resolve()
  .then(() => {
    run(App, drivers);
  })
  .catch(function (err) {
    console.log(`error while starting up the app's shell`, err);
  });
