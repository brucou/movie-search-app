import { INIT_EVENT, INIT_STATE, NO_OUTPUT, NO_STATE_UPDATE } from "state-transducer";
import {
  COMMAND_MOVIE_DETAILS_SEARCH, COMMAND_MOVIE_SEARCH, DISCOVERY_REQUEST, events, IMAGE_TMDB_PREFIX, LOADING,
  MOVIE_DETAIL_QUERYING, MOVIE_DETAIL_SELECTION, MOVIE_DETAIL_SELECTION_ERROR, MOVIE_QUERYING, MOVIE_SELECTION,
  MOVIE_SELECTION_ERROR, NETWORK_ERROR, NO_INTENT, POPULAR_NOW, PROMPT, SEARCH_RESULTS_FOR, START, testIds, screens as screenIds
} from "./properties"
import h from "react-hyperscript"
import hyperscript from "hyperscript-helpers"
import { COMMAND_RENDER, getStateTransducerRxAdapter } from "react-state-driven"
import { Subject } from "rxjs"
import { filter, map, startWith } from "rxjs/operators"
import { destructureEvent, makeQuerySlug, runMovieDetailQuery, runMovieSearchQuery } from "./helpers"

const { div, a, ul, li, input, h1, h3, legend, img, dl, dt, dd } = hyperscript(h);
const stateTransducerRxAdapter = getStateTransducerRxAdapter({ Subject, filter, map })

const NO_ACTIONS = () => ({ outputs: NO_OUTPUT, updates: NO_STATE_UPDATE });

const initialExtendedState = {
  queryFieldHasChanged: false,
  movieQuery: null,
  results: null,
  movieTitle: null,
};
const states = {
  [START]: "",
  [MOVIE_QUERYING]: "",
  [MOVIE_SELECTION]: "",
  [MOVIE_SELECTION_ERROR]: "",
  [MOVIE_DETAIL_QUERYING]: "",
  [MOVIE_DETAIL_SELECTION]: "",
  [MOVIE_DETAIL_SELECTION_ERROR]: ""
};
const { SEARCH_ERROR_MOVIE_RECEIVED, QUERY_RESETTED, USER_NAVIGATED_TO_APP, QUERY_CHANGED, MOVIE_DETAILS_DESELECTED, MOVIE_SELECTED, SEARCH_ERROR_RECEIVED, SEARCH_REQUESTED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_RESULTS_RECEIVED } = events;
const {LOADING_SCREEN, SEARCH_ERROR_SCREEN, SEARCH_RESULTS_AND_LOADING_SCREEN, SEARCH_RESULTS_SCREEN, SEARCH_RESULTS_WITH_MOVIE_DETAILS, SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN, SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR,} = screenIds;
const transitions = [
  { from: INIT_STATE, event: INIT_EVENT, to: START, action: NO_ACTIONS },
  { from: START, event: USER_NAVIGATED_TO_APP, to: MOVIE_QUERYING, action: displayLoadingScreenAndQueryDb },
  {
    from: MOVIE_QUERYING,
    event: SEARCH_RESULTS_RECEIVED,
    to: MOVIE_SELECTION,
    action: displayMovieSearchResultsScreen
  },
  { from: MOVIE_SELECTION, event: QUERY_CHANGED, to: MOVIE_QUERYING, action: displayLoadingScreenAndQueryNonEmpty },
  {
    from: MOVIE_QUERYING,
    event: SEARCH_ERROR_RECEIVED,
    to: MOVIE_SELECTION_ERROR,
    action: displayMovieSearchErrorScreen
  },
  {
    from: MOVIE_SELECTION,
    event: MOVIE_SELECTED,
    to: MOVIE_DETAIL_QUERYING,
    action: displayDetailsLoadingScreenAndQueryDetailsDb
  },
  {
    from: MOVIE_DETAIL_QUERYING,
    event: SEARCH_RESULTS_MOVIE_RECEIVED,
    to: MOVIE_DETAIL_SELECTION,
    action: displayMovieDetailsSearchResultsScreen
  },
  {
    from: MOVIE_DETAIL_QUERYING,
    event: SEARCH_ERROR_MOVIE_RECEIVED,
    to: MOVIE_DETAIL_SELECTION_ERROR,
    action: displayMovieDetailsSearchErrorScreen
  },
  {
    from: MOVIE_DETAIL_SELECTION,
    event: MOVIE_DETAILS_DESELECTED,
    to: MOVIE_SELECTION,
    action: displayMovieSearchResultsScreen2
  },
];
const preprocessor = rawEventSource => rawEventSource.pipe(
  map(ev => {
    const { rawEventName, rawEventData: e, ref } = destructureEvent(ev);

    if (rawEventName === USER_NAVIGATED_TO_APP) {
      return { [USER_NAVIGATED_TO_APP]: void 0 }
    }
    else if (rawEventName === SEARCH_RESULTS_RECEIVED) {
      const results = e;
      return { SEARCH_RESULTS_RECEIVED: results }
    }
    else if (rawEventName === SEARCH_ERROR_RECEIVED) {
      return { SEARCH_ERROR_RECEIVED: void 0 }
    }
    else if (rawEventName === QUERY_RESETTED) {
      return { QUERY_CHANGED: '' }
    }
    else if (rawEventName === QUERY_CHANGED) {
      // NOTE : react trick : avoiding issues with synthetic event reuse by caching the value
      const query = e.target.value;
      return { QUERY_CHANGED: query }
    }
    else if (rawEventName === MOVIE_SELECTED) {
      const movie = ref;
      return { MOVIE_SELECTED: { movie } }
    }
    else if (rawEventName === SEARCH_RESULTS_MOVIE_RECEIVED) {
      const [movieDetails, cast] = e;

      return { SEARCH_RESULTS_MOVIE_RECEIVED: [movieDetails, cast] }
    }
    else if (rawEventName === SEARCH_ERROR_MOVIE_RECEIVED) {
      return { SEARCH_ERROR_MOVIE_RECEIVED: void 0 }
    }
    else if (rawEventName === MOVIE_DETAILS_DESELECTED) {
      return { MOVIE_DETAILS_DESELECTED: void 0 }
    }

    return NO_INTENT
  }),
  filter(x => x !== NO_INTENT),
  startWith({ [USER_NAVIGATED_TO_APP]: void 0 }),
);

const {
  PROMPT_TESTID, RESULTS_HEADER_TESTID, RESULTS_CONTAINER_TESTID, QUERY_FIELD_TESTID,
  LOADING_TESTID, MOVIE_IMG_SRC_TESTID, MOVIE_TITLE_TESTID, NETWORK_ERROR_TESTID
} = testIds;
const screens = trigger => ({
  [LOADING_SCREEN]: () =>
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
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
                "onChange": trigger(QUERY_CHANGED),
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
  [SEARCH_RESULTS_SCREEN]: (results, query) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": trigger(QUERY_RESETTED)
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": trigger(QUERY_CHANGED),
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
                        "onClick": ev => trigger(MOVIE_SELECTED)(ev, result),
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
        ])
      ])
    ])
  ),
  [SEARCH_ERROR_SCREEN]: (query) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": trigger(QUERY_RESETTED)
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": trigger(QUERY_CHANGED),
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
  [SEARCH_RESULTS_AND_LOADING_SCREEN]: (results, query) =>
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": trigger(QUERY_RESETTED)
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": trigger(QUERY_CHANGED),
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              query.length === 0 ? POPULAR_NOW : SEARCH_RESULTS_FOR(query)
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              div([`Loading...`])
            ])
          ])
        ])
      ])
    ]),
  [SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN]: (results, query, movieDetail) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "item" }, [
      div(".App__view-container", [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": trigger(QUERY_RESETTED)
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": trigger(QUERY_CHANGED),
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
                      "key": result.id, "onClick": ev => trigger(MOVIE_SELECTED)(ev, result),
                    }, [
                      a(".ResultsContainer__result-item.js-result-click", {
                        "href": null,
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
  [SEARCH_RESULTS_WITH_MOVIE_DETAILS]: (results, query, details, cast) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "item" }, [
      div(".App__view-container", { onClick: trigger(MOVIE_DETAILS_DESELECTED) }, [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": trigger(QUERY_RESETTED)
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": trigger(QUERY_CHANGED),
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
                        "onClick": ev => trigger(MOVIE_SELECTED)(ev, result),
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
  [SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR]: (results, query, title) => (
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "item" }, [
      div(".App__view-container", { onClick: trigger(MOVIE_DETAILS_DESELECTED) }, [
        div(".App__view.uk-margin-top-small.uk-margin-left.uk-margin-right", { "data-page": "home" }, [
          div(".HomePage", [
            h1([`TMDb UI – Home`]),
            legend(".uk-legend", { "data-testid": PROMPT_TESTID }, [PROMPT]),
            div(".SearchBar.uk-inline.uk-margin-bottom", [
              a(".uk-form-icon.uk-form-icon-flip.js-clear", {
                "uk-icon": query.length > 0 ? "icon:close" : "icon:search",
                "onClick": trigger(QUERY_RESETTED)
              }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "value": query,
                "onChange": trigger(QUERY_CHANGED),
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
                        "onClick": ev => trigger(MOVIE_SELECTED)(ev, result),
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
});

const commandHandlers = {
  [COMMAND_MOVIE_SEARCH]: (trigger, query, effectHandlers) => {
    effectHandlers.runMovieSearchQuery(query)
      .then(data => {
        trigger(SEARCH_RESULTS_RECEIVED)(data.results)
      }).catch(error => {
      trigger(SEARCH_ERROR_RECEIVED)(void 0)
    });
  },
  [COMMAND_MOVIE_DETAILS_SEARCH]: (trigger, movieId, effectHandlers) => {
    effectHandlers.runMovieDetailQuery(movieId)
      .then(([details, cast]) => trigger(SEARCH_RESULTS_MOVIE_RECEIVED)([details, cast]))
      .catch(err => trigger(SEARCH_ERROR_MOVIE_RECEIVED)(err))
  },
};

const effectHandlers = {
  runMovieSearchQuery: runMovieSearchQuery,
  runMovieDetailQuery: runMovieDetailQuery
};

function AppScreen(props){
  const {screen, trigger, args} = props;

  return screens(trigger)[screen](...args)
}

function displayLoadingScreenAndQueryDb(extendedState, eventData, fsmSettings) {
  const searchCommand = {
    command: COMMAND_MOVIE_SEARCH,
    params: DISCOVERY_REQUEST
  };
  const renderCommand = {
    command: COMMAND_RENDER,
    params: trigger => h(AppScreen, {trigger, screen : LOADING_SCREEN, args : []})
  };
  return {
    updates: NO_STATE_UPDATE,
    outputs: [renderCommand, searchCommand]
  }
}

function displayLoadingScreenAndQueryNonEmpty(extendedState, eventData, fsmSettings) {
  const { queryFieldHasChanged, movieQuery, results, movieTitle } = extendedState;
  const query = eventData;
  const searchCommand = {
    command: COMMAND_MOVIE_SEARCH,
    params: makeQuerySlug(query)
  };
  const renderCommand = {
    command: COMMAND_RENDER,
    params: trigger => h(AppScreen, {trigger, screen : SEARCH_RESULTS_AND_LOADING_SCREEN, args : [results, query]})
  };
  return {
    updates: [
      { op: 'add', path: '/queryFieldHasChanged', value: true },
      { op: 'add', path: '/movieQuery', value: query },
      ],
    outputs: [renderCommand, searchCommand]
  }
}

function displayMovieSearchResultsScreen(extendedState, eventData, fsmSettings) {
  const searchResults = eventData;
  const {movieQuery} = extendedState;
  const renderCommand = {
    command: COMMAND_RENDER,
    params: trigger => h(AppScreen, {trigger, screen : SEARCH_RESULTS_SCREEN, args : [searchResults, movieQuery || '']})
  };

  return {
    updates: [{ op: 'add', path: '/results', value: searchResults }],
    outputs: [renderCommand]
  }
}

function displayMovieSearchResultsScreen2(extendedState, eventData, fsmSettings) {
  const {movieQuery, results} = extendedState;
  const renderCommand = {
    command: COMMAND_RENDER,
    params: trigger => h(AppScreen, {trigger, screen : SEARCH_RESULTS_SCREEN, args : [results, movieQuery || '']})
  };

  return {
    updates: NO_STATE_UPDATE,
    outputs: [renderCommand]
  }
}

function displayMovieSearchErrorScreen(extendedState, eventData, fsmSettings) {
  const { queryFieldHasChanged, movieQuery, results, movieTitle } = extendedState;
  const renderCommand = {
    command: COMMAND_RENDER,
    params: trigger => h(AppScreen, {trigger, screen : SEARCH_ERROR_SCREEN, args : [queryFieldHasChanged ? movieQuery : '']})
  };

  return {
    updates: NO_STATE_UPDATE,
    outputs: [renderCommand]
  }
}

function displayDetailsLoadingScreenAndQueryDetailsDb(extendedState, eventData, fsmSettings) {
  const { movie } = eventData;
  const movieId = movie.id;
  const { movieQuery, results } = extendedState;

  const searchCommand = {
    command: COMMAND_MOVIE_DETAILS_SEARCH,
    params: movieId
  };
  const renderCommand = {
    command: COMMAND_RENDER,
    params: trigger => h(AppScreen, {trigger, screen : SEARCH_RESULTS_WITH_MOVIE_DETAILS_AND_LOADING_SCREEN, args : [results, movieQuery, movie]})
  };

  return {
    updates: [{ op: 'add', path: '/movieTitle', value: movie.title }],
    outputs: [renderCommand, searchCommand]
  }
}

function displayMovieDetailsSearchResultsScreen(extendedState, eventData, fsmSettings) {
  const [movieDetails, cast] = eventData;
  const { queryFieldHasChanged, movieQuery, results, movieTitle } = extendedState;

  const renderCommand = {
    command: COMMAND_RENDER,
    params: trigger => h(AppScreen, {trigger, screen : SEARCH_RESULTS_WITH_MOVIE_DETAILS, args : [results, movieQuery, movieDetails, cast]})
  };

  return {
    updates: [
      { op: 'add', path: '/movieDetails', value: movieDetails },
      { op: 'add', path: '/cast', value: cast },
    ],
    outputs: [renderCommand]
  }
}

function displayMovieDetailsSearchErrorScreen(extendedState, eventData, fsmSettings) {
  const { queryFieldHasChanged, movieQuery, results, movieTitle } = extendedState;

  const renderCommand = {
    command: COMMAND_RENDER,
    params:
      trigger =>  h(AppScreen, {trigger, screen : SEARCH_RESULTS_WITH_MOVIE_DETAILS_ERROR, args : [results, movieQuery, movieTitle]})
  };

  return {
    updates: NO_STATE_UPDATE,
    outputs: [renderCommand]
  }
}

const movieSearchFsmDef = {
  initialExtendedState,
  states,
  events: Object.values(events),
  transitions,
  eventHandler: stateTransducerRxAdapter,
  preprocessor,
  commandHandlers,
  effectHandlers,
};

export { movieSearchFsmDef }

