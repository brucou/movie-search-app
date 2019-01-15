import sinon from "sinon"
import superagent from "superagent"
import {
  IMAGE_TMDB_PREFIX, INITIAL_REQUEST, NETWORK_ERROR, POPULAR_NOW, PROMPT, SEARCH_RESULTS_FOR, testIds
} from "../src/properties"
import ReactDOM from "react-dom"
import h from "react-hyperscript"
import App from "../src/App"
import { fireEvent, getByTestId, getByText, waitForElement } from "dom-testing-library"
import { INITIAL_REQUEST_RESULTS, RESULT_QUERY_a } from "./fixtures"
import { makeQuerySlug, SvcUrl } from "../src/helpers"

const promptContract = {
  dataTestId: testIds.PROMPT_TESTID,
  expected: PROMPT,
  actual: function (el, elHtml, elText) {return elText},
  message: `User is prompted correctly to enter a query`
};
const resultHeaderContract = text => ({
  dataTestId: testIds.RESULTS_HEADER_TESTID,
  expected: text,
  actual: function (el, elHtml, elText) {return elText},
  message: `Results are introduced correctly`
});
const queryFieldContract = {
  dataTestId: testIds.QUERY_FIELD_TESTID,
  expected: true,
  actual: function (el, elHtml, elText) {return true},
  message: `There is a field for the user to enter its query`
};

QUnit.module("Specification S4", {
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

QUnit.test("GIVEN user navigated to [url] AND query field has not changed WHEN query field changes AND query field" +
  " is not empty AND QUERY is successful", function exec_test(assert) {
  const done = assert.async(1);
  const stubbedGet = this.stubbedGet;
  const {
    PROMPT_TESTID, RESULTS_HEADER_TESTID, RESULTS_CONTAINER_TESTID, QUERY_FIELD_TESTID,
    MOVIE_IMG_SRC_TESTID, MOVIE_TITLE_TESTID
  } = testIds;

  stubbedGet
    .withArgs(INITIAL_REQUEST)
    .returns(new Promise(function (resolve, reject) {
      const delay = 100;
      setTimeout(function () {resolve({ body: { results: INITIAL_REQUEST_RESULTS } })}, delay);
    }))
    .withArgs(SvcUrl(makeQuerySlug('a')))
    .returns(new Promise(function (resolve, reject) {
      const delay = 100;
      setTimeout(function () {resolve({ body: { results: RESULT_QUERY_a } })}, delay);
    }));

  // kickoff the app
  ReactDOM.render(h(App), document.getElementById('root'));

  // Wait for the initial results screen to display.
  waitForElement(() => !!getByTestId(root, MOVIE_IMG_SRC_TESTID), { timeout: 1000 })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP] : Failed to display result screen`);
      throw err
    })
    .then(() => {assert.ok(true, `[USER_NAVIGATED_TO_APP] : displayed results screen`)})
    // check that the loading screen is displayed
    .then(() => {
      fireEvent.change(getByTestId(root, QUERY_FIELD_TESTID), { target: { value: 'a' } });
      return waitForElement(() => getByText(root, `Loading...`))
        .then(() => {
          const resultsScreenLoadingContracts = [promptContract, resultHeaderContract(SEARCH_RESULTS_FOR('a')), queryFieldContract];

          resultsScreenLoadingContracts.forEach(contract => {
            const { dataTestId, expected, actual, message } = contract;
            const el = document.querySelector(`[data-testid='${dataTestId}']`);
            const elHtml = el.innerHTML;
            const elText = el.textContent && el.textContent.trim() || '';
            assert.deepEqual(actual(el, elHtml, elText), expected, message);
          });
        })
    })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a'] : Failed to display loading screen`);
      throw err
    })
    .then(() => {assert.ok(true, `[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a'] : displayed results screen for query 'a'`)})
    // check that the results screen is displayed
    .then(() => {
      return waitForElement(() => !!getByTestId(root, MOVIE_IMG_SRC_TESTID), { timeout: 1000 })
        .then(_ => {
          const container = document.querySelector(`[data-testid="${RESULTS_CONTAINER_TESTID}"]`);
          let imgs = [], titles = [];
          container.querySelectorAll(`[data-testid="${MOVIE_IMG_SRC_TESTID}"]`).forEach(el => imgs.push(el.src));
          container.querySelectorAll(`[data-testid="${MOVIE_TITLE_TESTID}"]`).forEach(
            el => titles.push(el.textContent.trim()));
          assert.deepEqual(imgs, RESULT_QUERY_a.map(res => IMAGE_TMDB_PREFIX + res.backdrop_path), `
            Movies results from query have the expected images
            `);
          assert.deepEqual(titles, RESULT_QUERY_a.map(res => res.title), `
            Results from query have the expected titles
            `)
        })
    })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a'] : Failed to display results screen`);
      throw err
    })
    .then(() => {assert.ok(true, `[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a'] : results are the one expected for query 'a'`)})
    // back to empty input field
    .then(() => {
      fireEvent.change(getByTestId(root, QUERY_FIELD_TESTID), { target: { value: '' } });
      return waitForElement(() => getByText(root, `Loading...`))
        .then(() => {
          const resultsScreenLoadingContracts = [promptContract, resultHeaderContract(POPULAR_NOW), queryFieldContract];

          resultsScreenLoadingContracts.forEach(contract => {
            const { dataTestId, expected, actual, message } = contract;
            const el = document.querySelector(`[data-testid='${dataTestId}']`);
            const elHtml = el.innerHTML;
            const elText = el.textContent && el.textContent.trim() || '';
            assert.deepEqual(actual(el, elHtml, elText), expected, message);
          });
        })
    })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a'] : Failed to display loading screen`);
      throw err
    })
    .then(() => {assert.ok(true, `[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a', QUERY_CHANGED:'', ] : displayed loading screen`)})
    .then(() => {
      return waitForElement(() => !!getByTestId(root, MOVIE_IMG_SRC_TESTID), { timeout: 1000 })
        .then(_ => {
          const container = document.querySelector(`[data-testid="${RESULTS_CONTAINER_TESTID}"]`);
          let imgs = [], titles = [];
          container.querySelectorAll(`[data-testid="${MOVIE_IMG_SRC_TESTID}"]`).forEach(el => imgs.push(el.src));
          container.querySelectorAll(`[data-testid="${MOVIE_TITLE_TESTID}"]`).forEach(
            el => titles.push(el.textContent.trim()));
          assert.deepEqual(imgs, INITIAL_REQUEST_RESULTS.map(res => IMAGE_TMDB_PREFIX + res.backdrop_path), `
            Movies results from query have the expected images
            `);
          assert.deepEqual(titles, INITIAL_REQUEST_RESULTS.map(res => res.title), `
            Results from query have the expected titles
            `)
        })
    })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a', QUERY_CHANGED:'' ] : Failed to display results screen`);
      throw err
    })
    .then(() => {assert.ok(true, `[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a', QUERY_CHANGED:''] : results are the one expected for query ''`)})
    .catch(err => {
      console.error(`Error occured while simulating inputs. Check the logs`, err);
      done(err)
    })
    .then(done)
});

QUnit.test("GIVEN user navigated to [url] AND query field has not changed WHEN query field changes AND query field" +
  " is not empty AND query is not successful", function exec_test(assert) {
  const done = assert.async(1);
  const stubbedGet = this.stubbedGet;
  const { NETWORK_ERROR_TESTID, QUERY_FIELD_TESTID, MOVIE_IMG_SRC_TESTID } = testIds;

  stubbedGet
    .withArgs(INITIAL_REQUEST)
    .returns(new Promise(function (resolve, reject) {
      const delay = 100;
      setTimeout(function () {resolve({ body: { results: INITIAL_REQUEST_RESULTS } })}, delay);
    }))
    .withArgs(SvcUrl(makeQuerySlug('a')))
    .returns(new Promise(function (resolve, reject) {
      const delay = Math.random() * 100;
      setTimeout(function () {reject(new Error(`no results!!`))}, delay);
    }));

  // kickoff the app
  ReactDOM.render(h(App), document.getElementById('root'));

  // Wait for the initial results screen to display.
  waitForElement(() => !!getByTestId(root, MOVIE_IMG_SRC_TESTID), { timeout: 1000 })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP] : Failed to display result screen`);
      throw err
    })
    .then(() => {assert.ok(true, `[USER_NAVIGATED_TO_APP] : displayed results screen`)})
    // check that the loading screen is displayed
    .then(() => {
      fireEvent.change(getByTestId(root, QUERY_FIELD_TESTID), { target: { value: 'a' } });
      return waitForElement(() => getByText(root, `Loading...`))
        .then(() => {
          const resultsScreenLoadingContracts = [promptContract, resultHeaderContract(SEARCH_RESULTS_FOR('a')), queryFieldContract];

          resultsScreenLoadingContracts.forEach(contract => {
            const { dataTestId, expected, actual, message } = contract;
            const el = document.querySelector(`[data-testid='${dataTestId}']`);
            const elHtml = el.innerHTML;
            const elText = el.textContent && el.textContent.trim() || '';
            assert.deepEqual(actual(el, elHtml, elText), expected, message);
          });
        })
    })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a'] : Failed to display loading screen`);
      throw err
    })
    // check that the error screen is displayed
    .then(() => {
      return waitForElement(() => !!getByTestId(root, NETWORK_ERROR_TESTID), { timeout: 1000 })
        .then(_ => {
          const el = document.querySelector(`[data-testid="${NETWORK_ERROR_TESTID}"]`);
          const elText = el.textContent && el.textContent.trim() || '';
          const message = `Error message correctly displayed`;
          assert.deepEqual(elText, NETWORK_ERROR, message);
        })
    })
    .catch(err => {
      console.error(`[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a', unsuccessful query] : Failed to display error screen`);
      throw err
    })
    .then(() => {assert.ok(true, `[USER_NAVIGATED_TO_APP, QUERY_CHANGED:'a', unsuccessful query] : displayed error screen`)})
    .catch(err => {
      console.error(`Error occured while simulating inputs. Check the logs`, err);
      throw err
    })
    .finally(done)
});
