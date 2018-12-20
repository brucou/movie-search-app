import React, { Component } from 'react';
import {
  DISCOVERY_REQUEST, events, IMAGE_TMDB_PREFIX, LOADING, NETWORK_ERROR, POPULAR_NOW, PROMPT, testIds
} from "./properties"
import emitonoff from "emitonoff"
import h from "react-hyperscript";
import hyperscript from "hyperscript-helpers";
import { runSearchQuery } from "./helpers"

const { div, a, ul, li, span, input, h1, h3, legend, img } = hyperscript(h);

const {
  PROMPT_TESTID, RESULTS_HEADER_TESTID, RESULTS_CONTAINER_TESTID, QUERY_FIELD_TESTID,
  LOADING_TESTID, MOVIE_IMG_SRC_TESTID, MOVIE_TITLE_TESTID, NETWORK_ERROR_TESTID
} = testIds;
const { QUERY_RESETTED, USER_NAVIGATED_TO_APP, SEARCH_REQUESTED, SEARCH_ERROR_RECEIVED, SEARCH_RESULTS_RECEIVED, QUERY_CHANGED } = events;
const eventEmitter = emitonoff();

const views = {
  HEADER:
    div(".App__header.uk-width-1-1", [
      ul(".uk-breadcrumb.uk-width-1-1", [
        li(".uk-width-1-1", [
          a(".js-home.uk-width-1-1.uk-padding-small", [
            span(".uk-margin-small-right.uk-icon", { "uk-icon": "icon:chevron-left" }, [
              `Back`
            ])
          ])
        ])
      ])
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
                "defaultValue": "",
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
              a(".uk-form-icon.uk-form-icon-flip.js-clear", { "uk-icon": "icon:search" }),
              input(".SearchBar__input.uk-input.js-input", {
                "type": "text",
                "defaultValue": "",
                // "oninput": "return ${domEventHandlers[QUERY_CHANGED]}(event)",
                "data-testid": QUERY_FIELD_TESTID,
              })
            ]),
            h3(".uk-heading-bullet.uk-margin-remove-top", { "data-testid": RESULTS_HEADER_TESTID }, [
              // query.length === 0 ? POPULAR_NOW : SEARCH_RESULTS_FOR(query)
              POPULAR_NOW
            ]),
            div(".ResultsContainer", { "data-testid": RESULTS_CONTAINER_TESTID }, [
              ul(".uk-thumbnav", [
                results.filter(result => result.backdrop_path)
                  .map(result =>
                    li(".uk-margin-bottom", { "key": result.id, }, [
                      a(".ResultsContainer__result-item.js-result-click", {
                        "href": "#",
                        // TODO : ev prevent default!!
                        "onClick": () => false,
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
  SEARCH_ERROR_SCREEN: () => (
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
                "defaultValue": "",
                // "oninput": "return ${domEventHandlers[QUERY_CHANGED]}(event)",
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
};

// Now the logic of the app
const domEventHandlers = {};

function handleAppEvents(app, event, args) {
  const { queryFieldHasChanged } = app.state;
  switch (event) {
    case USER_NAVIGATED_TO_APP :
      app.setState({ screen: screens.LOADING_SCREEN() });
      runSearchQuery(DISCOVERY_REQUEST)
        .then(res => eventEmitter.emit(SEARCH_RESULTS_RECEIVED, res))
        .catch(err => eventEmitter.emit(SEARCH_ERROR_RECEIVED, err))
      break;

    case SEARCH_RESULTS_RECEIVED :
      const [results] = args;
      // state.results = results;

      if (queryFieldHasChanged === false) {
        app.setState({ screen: screens.SEARCH_RESULTS_SCREEN(results) });
      }
      break;

    case SEARCH_ERROR_RECEIVED:
      const [err] = args;
      if (queryFieldHasChanged === false) {
        app.setState({ screen: screens.SEARCH_ERROR_SCREEN(err) });
      }
      break;

    default :
      throw `unexpected event received!`
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

// cf. https://frontarm.com/demoboard/????? pending bug fixing with superagent
// cf. https://codesandbox.io/s/qkv1n23464
