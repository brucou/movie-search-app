import React, { Component } from 'react';
import { DISCOVERY_REQUEST, events, LOADING, POPULAR_NOW, PROMPT, testIds } from "./properties"
import emitonoff from "emitonoff"
import h from "react-hyperscript";
import hyperscript from "hyperscript-helpers";
import { runSearchQuery } from "./helpers"

const { div, a, ul, li, span, input, h1, h3, legend } = hyperscript(h);

const {
  PROMPT_TESTID, RESULTS_HEADER_TESTID, RESULTS_CONTAINER_TESTID, QUERY_FIELD_TESTID,
  LOADING_TESTID, MOVIE_IMG_SRC_TESTID, MOVIE_TITLE_TESTID, NETWORK_ERROR_TESTID
} = testIds;
const { QUERY_RESETTED, USER_NAVIGATED_TO_APP, SEARCH_REQUESTED, SEARCH_ERROR_RECEIVED, SEARCH_RESULTS_RECEIVED, QUERY_CHANGED } = events;
const eventEmitter = emitonoff();

const screens = {
  LOADING_SCREEN: () =>
    div(".App.uk-light.uk-background-secondary", { "data-active-page": "home" }, [
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
};

// Now the logic of the app
const domEventHandlers = {};

function handleAppEvents(app, event, args) {
  switch (event) {
    case USER_NAVIGATED_TO_APP :
      app.setState({ screen: screens.LOADING_SCREEN() });
      runSearchQuery(DISCOVERY_REQUEST)
      // .then(res => eventEmitter.emit(SEARCH_RESULTS_RECEIVED, res))
      // .catch(err => eventEmitter.emit(SEARCH_ERROR_RECEIVED, err))
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
      // queryFieldHasChanged: false,
      // currentQuery: null
    };
    Object.keys(events).forEach(ev => eventEmitter.on(ev, (...args) => handleAppEvents(app, ev, args)));
  }

  componentDidMount() {
    // kick off the app
    // connect the state machine to the events
    eventEmitter.emit(USER_NAVIGATED_TO_APP);
  }

  render() {
    return this.state.screen || null;
  }
}

export default App;

// cf. https://frontarm.com/demoboard/?id=0d51aa8a-d5cf-443e-868c-3b8ce106062c
// cf. https://stackblitz.com/edit/react-qxhxdq?file=src%2Findex.js
// cf. https://codesandbox.io/s/yjwpx1wn8j

// Before going into the TDD process, we build an app shell, which reflect
// our first design choices :
// - React as the rendering library
// - we use test ids to reference the DOM elements we will test against
//   so our testing concern is independent of our styling concern
// - We use an extremely simple event emitter library for event handling
//   with the core API : emit, on, off
//   cf. https://github.com/konsumer/emitonoff


