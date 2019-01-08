import sinon from "sinon"
import superagent from "superagent"
import { events, INITIAL_REQUEST, LOADING, POPULAR_NOW, PROMPT, testIds } from "../src/properties"
import ReactDOM from "react-dom"
import h from "react-hyperscript"
import App from "../src/App"
import {wait, waitForDomChange, waitForElement, getByTestId, queryByTestId} from "dom-testing-library"

QUnit.module("Specification S1", {
  beforeEach: function () {
    // just in case for some reason a stubbed superagent is reaching there anyways
    superagent && superagent.get && superagent.get.reset && superagent.get.reset();
    debugger
    this.stubbedGet = sinon.stub(superagent, "get");
    // necessary because of dom-testing-library bug
    window.setImmediate = window.setTimeout;
    ReactDOM.render(null, document.getElementById('root'));
  },
  afterEach: function () {
    this.stubbedGet.restore()
  },
});

QUnit.test("WHEN user navigates to [url]", function exec_test(assert) {
  const done = assert.async(1);
  const stubbedGet = this.stubbedGet;
  const {
    PROMPT_TESTID, RESULTS_HEADER_TESTID, RESULTS_CONTAINER_TESTID, QUERY_FIELD_TESTID,
  } = testIds;

  stubbedGet.withArgs(INITIAL_REQUEST)
    .returns(new Promise(function (resolve, reject) {
      const delay = 100;
      setTimeout(function () {resolve({ body: { results: {} } })}, delay);
    }));

  // kickoff the app
  ReactDOM.render(h(App), document.getElementById('root'));

  // Wait for the results to appear
  waitForElement(()=> !!getByTestId(root, RESULTS_CONTAINER_TESTID), {timeout:1000})
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
      const loadingIndicatorContract = {
        dataTestId: RESULTS_CONTAINER_TESTID,
        expected: LOADING,
        actual: function (el, elHtml, elText) {return elText},
        message: `There is a visual indicator for the user that the query results are pending`
      }

      const loadingScreenContracts = [promptContract, resultHeaderContract, queryFieldContract, loadingIndicatorContract];

      loadingScreenContracts.forEach(contract => {
        const { dataTestId, expected, actual, message } = contract;
        const el = document.querySelector(`[data-testid='${dataTestId}']`);
        const elHtml = el.innerHTML;
        const elText = el.textContent && el.textContent.trim() || '';
        assert.deepEqual(actual(el, elHtml, elText), expected, message);
      });
      assert.ok(stubbedGet.calledOnce && stubbedGet.calledWith(INITIAL_REQUEST), `THEN queries for movies in some arbitrary way`);
    })
    .then(done)
    .catch(err => {
      console.error(err);
      done(err)
    })
});
