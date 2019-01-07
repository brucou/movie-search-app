import sinon from "sinon"
import superagent from "superagent"
import { events, IMAGE_TMDB_PREFIX, INITIAL_REQUEST, POPULAR_NOW, PROMPT, testIds } from "../src/properties"
import ReactDOM from "react-dom"
import h from "react-hyperscript"
import App from "../src/App"
import { getByTestId, wait } from "dom-testing-library"
import { INITIAL_REQUEST_RESULTS } from "./fixtures"

QUnit.module("Specification S2", {
  beforeEach: function () {
    // just in case for some reason a stubbed superagent is reaching there anyways
    superagent && superagent.get && superagent.get.reset && superagent.get.reset();
    this.stubbedGet = sinon.stub(superagent, "get");
    // necessary because of dom-testing-library bug
    window.setImmediate = window.setTimeout;
    // NOTE : triggers a warning from React, the first time, as no component is mounted yet.
    // To avoid the warning, it is possible to dynamically create the root element and append it to the body
    // and remove it after each test
    // We will live with the warning for this demo
    ReactDOM.render(null, document.getElementById('root'));
  },
  afterEach: function () {
    this.stubbedGet.restore()
  },
});

QUnit.test("GIVEN user navigated to [url] AND query field has not changed", function exec_test(assert) {
  const done = assert.async(1);
  const stubbedGet = this.stubbedGet;
  const { SEARCH_RESULTS_RECEIVED, SEARCH_ERROR_RECEIVED, SEARCH_REQUESTED, QUERY_CHANGED, USER_NAVIGATED_TO_APP } = events;
  const {
    PROMPT_TESTID, RESULTS_HEADER_TESTID, RESULTS_CONTAINER_TESTID, QUERY_FIELD_TESTID,
    MOVIE_IMG_SRC_TESTID, MOVIE_TITLE_TESTID
  } = testIds;

  stubbedGet.withArgs(INITIAL_REQUEST)
    .returns(new Promise(function (resolve, reject) {
      const delay = Math.random() * 1000;
      setTimeout(function () {resolve({ body: { results: INITIAL_REQUEST_RESULTS } })}, delay);
    }));

  // kickoff the app
  ReactDOM.render(h(App), document.getElementById('root'));

  // Wait for the results to appear
  wait(() => !!getByTestId(root, MOVIE_IMG_SRC_TESTID), { timeout: 1000 })
    .then(() => {
      const promptContract = {
        dataTestId: PROMPT_TESTID,
        expected: PROMPT,
        actual: function (el, elHtml, elText) {return elText},
        message: `User is prompted correctly to enter a query`
      };
      const resultHeaderContract = {
        dataTestId: RESULTS_HEADER_TESTID,
        expected: POPULAR_NOW,
        actual: function (el, elHtml, elText) {return elText},
        message: `Results are introduced correctly`
      };
      const queryFieldContract = {
        dataTestId: QUERY_FIELD_TESTID,
        expected: true,
        actual: function (el, elHtml, elText) {return true},
        message: `There is a field for the user to enter its query`
      };

      const resultsScreenContracts = [promptContract, resultHeaderContract, queryFieldContract];

      resultsScreenContracts.forEach(contract => {
        const { dataTestId, expected, actual, message } = contract;
        const el = document.querySelector(`[data-testid='${dataTestId}']`);
        const elHtml = el.innerHTML;
        const elText = el.textContent && el.textContent.trim() || '';
        assert.deepEqual(actual(el, elHtml, elText), expected, message);
      });
    })
    .then(resultsEl => {
      const container = document.querySelector(`[data-testid="${RESULTS_CONTAINER_TESTID}"]`);
      let imgs = [], titles = [];
      container.querySelectorAll(`[data-testid="${MOVIE_IMG_SRC_TESTID}"]`).forEach(el => imgs.push(el.src));
      container.querySelectorAll(`[data-testid="${MOVIE_TITLE_TESTID}"]`).forEach(
        el => titles.push(el.textContent.trim()));
      return { imgs, titles }
    })
    .then(({ imgs, titles }) => {
      assert.deepEqual(imgs, INITIAL_REQUEST_RESULTS.map(res => IMAGE_TMDB_PREFIX + res.backdrop_path), `
      Movies results from query have the expected images
      `);
      assert.deepEqual(titles, INITIAL_REQUEST_RESULTS.map(res => res.title), `
      Results from query have the expected titles
      `)
    })
    .then(done)
    .catch(err => {
      console.error(err);
      done(err)
    })
});
