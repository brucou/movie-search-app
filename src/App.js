import React, { Component } from 'react';
import h from "react-hyperscript"
import hyperscript from "hyperscript-helpers"
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { filter, flatMap, map, shareReplay, startWith } from "rxjs/operators";
import { Machine } from "react-state-driven"
import { create_state_machine, INIT_EVENT } from "state-transducer"
import { applyPatch } from "json-patch-es6";
import emitonoff from "emitonoff"
import {
  DISCOVERY_REQUEST, events, IMAGE_TMDB_PREFIX, LOADING, NETWORK_ERROR, POPULAR_NOW, PROMPT, SEARCH_RESULTS_FOR, testIds
} from "./properties"
import { makeQuerySlug, runSearchQuery } from "./helpers"
import movieSearchFsmDef from "fsm"

const stateTransducerRxAdapter = {
  // NOTE : this is start the machine, by sending the INIT_EVENT immediately prior to any other
  subjectFactory: () => new BehaviorSubject([INIT_EVENT, void 0]),
  create: fn => Observable.create(fn),
  merge, startWith, filter, map, flatMap, shareReplay,
};

/**
 *
 * @param {ExtendedState} extendedState
 * @param {Operation[]} extendedStateUpdateOperations
 * @returns {ExtendedState}
 */
export function applyJSONpatch(extendedState, extendedStateUpdateOperations) {
  return applyPatch(extendedState, extendedStateUpdateOperations || [], false, false).newDocument;
}

const fsm = create_state_machine(movieSearchFsmDef, { updateState: applyJSONpatch });

export const App = h(Machine, {
  // TODO : write it with transducers, and emitonoff emitter, will have to do lots of API surfaceing, and change
  // emit to next in state-transducer -? new version pass it to master
  // TODO : mmm but I must have implementation on th 7.1 though, will that not delay me a lot? should not
  // worse case use rx
  eventHandler: stateTransducerRxAdapter,
  // TODO : use simplest preprocessor i.e. identity
  preprocessor: movieSearchFsmDef.preprocessor,
  fsm: fsm,
  commandHandlers: movieSearchFsmDef.commandHandlers,
  // TODO runSearchQuery to mock
  effectHandlers: movieSearchFsmDef.effectHandlers,
}, []);


const { div, a, ul, li, span, input, h1, h3, legend, img, dl, dt, dd } = hyperscript(h);

const {
  PROMPT_TESTID, RESULTS_HEADER_TESTID, RESULTS_CONTAINER_TESTID, QUERY_FIELD_TESTID,
  LOADING_TESTID, MOVIE_IMG_SRC_TESTID, MOVIE_TITLE_TESTID, NETWORK_ERROR_TESTID
} = testIds;
const { QUERY_RESETTED, USER_NAVIGATED_TO_APP, SEARCH_REQUESTED, SEARCH_ERROR_RECEIVED, SEARCH_RESULTS_RECEIVED, QUERY_CHANGED, MOVIE_SELECTED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_ERROR_MOVIE_RECEIVED, MOVIE_DETAILS_DESELECTED } = events;
const eventEmitter = emitonoff();

const views = {
  HEADER:
    div(".App__header.uk-width-1-1", [
      // ul(".uk-breadcrumb.uk-width-1-1", [
      //   li(".uk-width-1-1", [
      //     a(".js-home.uk-width-1-1.uk-padding-small", [
      //       span(".uk-margin-small-right.uk-icon", { "uk-icon": "icon:chevron-left" }, [
      //         `Back`
      //       ])
      //     ])
      //   ])
      // ])
    ]),
}
const screens = {
  LOADING_SCREEN: () =>
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
      views.HEADER,
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", { "uk-icon": "icon:search" }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": "",
                "onChange": domEventHandlers[QUERY_CHANGED],
                "data-testid": QUERY_FIELD_TESTID
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [POPULAR_NOW]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              div([LOADING])
            ])
          ])
        ])
      ])
    ]),
  SEARCH_RESULTS_SCREEN: (results, query) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
      views.HEADER,
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": domEventHandlers[QUERY_RESETTED]
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": domEventHandlers[QUERY_CHANGED],
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              query.length === 0 ? POPULAR_NOW : SEARCH_RESULTS_FOR(query)
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              ul(".uk-thumbnav", [
                results && results.filter(result => result.backdrop_path)
                  .map(result =>
                    li(".uk-margin-bottom", { "key": result.id, }, [
                      a(".ResultsContainer__result-item.js-result-click", {
                        "href": "#",
                        "onClick": domEventHandlers[MOVIE_SELECTED](result),
                        "data-id": result.id,
                      }, [
                        div(".ResultsContainer__thumbnail-holder", [
                          img({
                            "src": `${IMAGE_TMDB_PREFIX}${result.backdrop_path}`,
                            "alt": "",
                            // "onClick": domEventHandlers[MOVIE_SELECTED](result),
                            "data-testid": MOVIE_IMG_SRC_TESTID
                          })
                        ]),
                        div(".ResultsContainer__caption.uk-text-small.uk-text-muted", { "data-testid": MOVIE_TITLE_TESTID }, [
                          result.title
                        ])
                      ])
                    ]),
                  )
              ])
            ])
          ])
        ])
      ])
    ])
  ),
  SEARCH_ERROR_SCREEN: (query) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
      views.HEADER,
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": domEventHandlers[QUERY_RESETTED]
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": domEventHandlers[QUERY_CHANGED],
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              POPULAR_NOW
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              div({ "data-testid": NETWORK_ERROR_TESTID }, [NETWORK_ERROR])
            ])
          ])
        ])
      ])
    ])
  ),
  SEARCH_RESULTS_AND_LOADING_SCREEN: (results, query) =>
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
      views.HEADER,
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": domEventHandlers[QUERY_RESETTED]
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": domEventHandlers[QUERY_CHANGED],
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              query.length === 0 ? POPULAR_NOW : SEARCH_RESULTS_FOR(query)
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              <div>Loading...</div>
            ])
          ])
        ])
      ])
    ]),
  SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN: (results, query, movieDetail) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "item" }, [
      views.HEADER,
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": domEventHandlers[QUERY_RESETTED]
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": domEventHandlers[QUERY_CHANGED],
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              query.length === 0 ? POPULAR_NOW : SEARCH_RESULTS_FOR(query)
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              ul(".uk-thumbnav", [
                results && results.filter(result => result.backdrop_path)
                  .map(result =>
                    li(".uk-margin-bottom", {
                      "key": result.id, "onClick": domEventHandlers[MOVIE_SELECTED](result),
                    }, [
                      a(".ResultsContainer__result-item.js-result-click", {
                        "href": null,
                        // "onClick": () => false,
                        "data-id": result.id,
                      }, [
                        div(".ResultsContainer__thumbnail-holder", [
                          img({
                            "src": `${IMAGE_TMDB_PREFIX}${result.backdrop_path}`,
                            "alt": "",
                            "data-testid": MOVIE_IMG_SRC_TESTID
                          })
                        ]),
                        div(".ResultsContainer__caption.uk-text-small.uk-text-muted", { "data-testid": MOVIE_TITLE_TESTID }, [
                          result.title
                        ])
                      ])
                    ]),
                  )
              ])
            ])
          ])
        ]),
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "item" }, [
          div([
            h1([movieDetail.title]),
            div(['Loading...']),
          ])
        ])
      ])
    ])),
  SEARCH_RESULTS_WITH_MOVIE_DETAILS: (results, query, details, cast) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "item" }, [
      views.HEADER,
      div(".App__view-container", { onClick: domEventHandlers[MOVIE_DETAILS_DESELECTED] }, [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": domEventHandlers[QUERY_RESETTED]
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": domEventHandlers[QUERY_CHANGED],
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              query.length === 0 ? POPULAR_NOW : SEARCH_RESULTS_FOR(query)
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              ul(".uk-thumbnav", [
                results && results.filter(result => result.backdrop_path)
                  .map(result =>
                    li(".uk-margin-bottom", { "key": result.id, }, [
                      a(".ResultsContainer__result-item.js-result-click", {
                        "href": "#",
                        "onClick": domEventHandlers[MOVIE_SELECTED](result),
                        "data-id": result.id,
                      }, [
                        div(".ResultsContainer__thumbnail-holder", [
                          img({
                            "src": `${IMAGE_TMDB_PREFIX}${result.backdrop_path}`,
                            "alt": "",
                            // "onClick": domEventHandlers[MOVIE_SELECTED](result),
                            "data-testid": MOVIE_IMG_SRC_TESTID
                          })
                        ]),
                        div(".ResultsContainer__caption.uk-text-small.uk-text-muted", { "data-testid": MOVIE_TITLE_TESTID }, [
                          result.title
                        ])
                      ])
                    ]),
                  )
              ])
            ])
          ])
        ]),
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "item" }, [
          div([
            h1([details.title || '']),
            div(".MovieDetailsPage", [
              div(".MovieDetailsPage__img-container.uk-margin-right", {
                "style": { "float": "left" }
              }, [
                img({ "src": `http://image.tmdb.org/t/p/w342${details.poster_path}`, "alt": "" })
              ]),
              dl(".uk-description-list", [
                dt([`Popularity`]),
                dd([details.vote_average]),
                dt([`Overview`]),
                dd([details.overview]),
                dt([`Genres`]),
                dd([details.genres.map(g => g.name).join(', ')]),
                dt([`Starring`]),
                dd([cast.cast.slice(0, 3).map(cast => cast.name).join(', ')]),
                dt([`Languages`]),
                dd([details.spoken_languages.map(g => g.name).join(', ')]),
                dt([`Original Title`]),
                dd([details.original_title]),
                dt([`Release Date`]),
                dd([details.release_date]),
                details.imdb_id && dt([`IMDb URL`]),
                details.imdb_id && dd([
                  a({ "href": `https://www.imdb.com/title/${details.imdb_id}/` }, [`https://www.imdb.com/title/${details.imdb_id}/`])
                ]),
              ])
            ])
          ])
        ])
      ])
    ])
  ),
  // TODO : to update too in S8-11!!
  SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR: (results, query, details, title) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "item" }, [
      views.HEADER,
      div(".App__view-container", { onClick: domEventHandlers[MOVIE_DETAILS_DESELECTED] }, [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": domEventHandlers[QUERY_RESETTED]
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": domEventHandlers[QUERY_CHANGED],
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              query.length === 0 ? POPULAR_NOW : SEARCH_RESULTS_FOR(query)
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              ul(".uk-thumbnav", [
                results && results.filter(result => result.backdrop_path)
                  .map(result =>
                    li(".uk-margin-bottom", { "key": result.id, }, [
                      a(".ResultsContainer__result-item.js-result-click", {
                        "href": "#",
                        "onClick": domEventHandlers[MOVIE_SELECTED](result),
                        "data-id": result.id,
                      }, [
                        div(".ResultsContainer__thumbnail-holder", [
                          img({
                            "src": `${IMAGE_TMDB_PREFIX}${result.backdrop_path}`,
                            "alt": "",
                            "data-testid": MOVIE_IMG_SRC_TESTID
                          })
                        ]),
                        div(".ResultsContainer__caption.uk-text-small.uk-text-muted", { "data-testid": MOVIE_TITLE_TESTID }, [
                          result.title
                        ])
                      ])
                    ]),
                  )
              ])
            ])
          ])
        ]),
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "item" }, [
          div([
            h1([title]),
            div({ "data-testid": NETWORK_ERROR_TESTID }, [NETWORK_ERROR])
          ])
        ])
      ])
    ])
  ),
};

// Now the logic of the app
const domEventHandlers = {
  [QUERY_CHANGED]: ev => eventEmitter.emit(QUERY_CHANGED, ev.target.value),
  [QUERY_RESETTED]: ev => eventEmitter.emit(QUERY_CHANGED, ''),
  [MOVIE_SELECTED]: movieDetail => ev => eventEmitter.emit(MOVIE_SELECTED, movieDetail),
  [MOVIE_DETAILS_DESELECTED]: ev => eventEmitter.emit(MOVIE_DETAILS_DESELECTED)
};

function handleAppEvents(app, event, args) {
  // TODO update S8-11 (title)
  const { queryFieldHasChanged, movieQuery, results, movieTitle, movieDetails, cast } = app.state;

  switch (event) {
    case USER_NAVIGATED_TO_APP :
      app.setState({ screen: screens.LOADING_SCREEN() });
      runSearchQuery(DISCOVERY_REQUEST)
        .then(res => eventEmitter.emit(SEARCH_RESULTS_RECEIVED, res.results))
        .catch(err => eventEmitter.emit(SEARCH_ERROR_RECEIVED, err))
      break;

    case SEARCH_RESULTS_RECEIVED :
      const [searchResults] = args;

      if (queryFieldHasChanged === false) {
        app.setState({ screen: screens.SEARCH_RESULTS_SCREEN(searchResults, ''), results: searchResults });
      }
      else if (queryFieldHasChanged === true) {
        app.setState({ screen: screens.SEARCH_RESULTS_SCREEN(searchResults, movieQuery), results: searchResults });
      }
      break;

    case SEARCH_ERROR_RECEIVED:
      if (queryFieldHasChanged === false) {
        app.setState({ screen: screens.SEARCH_ERROR_SCREEN('') });
      }
      else if (queryFieldHasChanged === true) {
        app.setState({ screen: screens.SEARCH_ERROR_SCREEN(movieQuery) });
      }
      break;

    case QUERY_CHANGED:
      const [query] = args;

      if (queryFieldHasChanged === false) {
        // TODO update S4-7
        app.setState({
          screen: screens.SEARCH_RESULTS_AND_LOADING_SCREEN(results, query),
          queryFieldHasChanged: true,
          movieQuery: query
        });
        runSearchQuery(makeQuerySlug(query))
          .then(res => eventEmitter.emit(SEARCH_RESULTS_RECEIVED, res.results))
          .catch(err => eventEmitter.emit(SEARCH_ERROR_RECEIVED, err))
      }
      else if (queryFieldHasChanged === true) {
        // TODO update S4-7
        app.setState({
          screen: screens.SEARCH_RESULTS_AND_LOADING_SCREEN(results, query),
          queryFieldHasChanged: true,
          movieQuery: query
        });
        runSearchQuery(makeQuerySlug(query))
          .then(res => eventEmitter.emit(SEARCH_RESULTS_RECEIVED, res.results))
          .catch(err => eventEmitter.emit(SEARCH_ERROR_RECEIVED, err))
      }
      break;

    case MOVIE_SELECTED:
      const [movie] = args;
      const movieId = movie.id;

      // TODO update S8-11 (title)
      app.setState({
        screen: screens.SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN(results, movieQuery, movie),
        movieTitle: movie.title
      });
      Promise.all([
        runSearchQuery(`/movie/${movieId}`),
        runSearchQuery(`/movie/${movieId}/credits`)
      ])
        .then(([details, cast]) => eventEmitter.emit(SEARCH_RESULTS_MOVIE_RECEIVED, details, cast))
        .catch(err => eventEmitter.emit(SEARCH_ERROR_MOVIE_RECEIVED, err))
      break;

    case SEARCH_RESULTS_MOVIE_RECEIVED :
      const [movieDetails, cast] = args;

      app.setState({
        screen: screens.SEARCH_RESULTS_WITH_MOVIE_DETAILS(results, movieQuery, movieDetails, cast),
        movieDetails,
        cast
      });
      break;

    case SEARCH_ERROR_MOVIE_RECEIVED :
      app.setState({
        screen: screens.SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR(results, movieQuery, movieDetails, movieTitle),
      });
      break;

    case MOVIE_DETAILS_DESELECTED :
      app.setState({
        screen: screens.SEARCH_RESULTS_SCREEN(results, movieQuery),
      });
      break;

    default :
      throw `unexpected ${event} event received!`
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    const app = this;
    app.state = {
      screen: screens.LOADING_SCREEN(),
      queryFieldHasChanged: false,
      // currentQuery: null
    };
    Object.keys(events).forEach(ev => eventEmitter.on(ev, (...args) => handleAppEvents(app, ev, args)));
  }

  componentDidMount() {
    // kick off the app
    eventEmitter.emit(USER_NAVIGATED_TO_APP);
  }

  render() {
    return this.state.screen || null;
  }
}

export default App;

// cf. https://codesandbox.io/s/jj4vrzq3wy
