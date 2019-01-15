import { destructureEvent } from "./helpers"
import { events, READY } from "./properties"
import { movieSearchFsm } from "./fsm"

export function App(sources) {
  const { USER_NAVIGATED_TO_APP, SEARCH_ERROR_RECEIVED, SEARCH_ERROR_MOVIE_RECEIVED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_RESULTS_RECEIVED, QUERY_CHANGED, QUERY_RESETTED, MOVIE_SELECTED, MOVIE_DETAILS_DESELECTED } = events;
  const { eventHandler } = sources;

  const intents = eventHandler
    .map(ev => {
      const { rawEventName, rawEventData: e, ref } = destructureEvent(ev);

      if (rawEventName === READY) {
        return { [USER_NAVIGATED_TO_APP]: void 0 }
      }
      else if (rawEventName === SEARCH_RESULTS_RECEIVED) {
        const resultsAndQuery = e;
        return { SEARCH_RESULTS_RECEIVED: resultsAndQuery }
      }
      else if (rawEventName === SEARCH_ERROR_RECEIVED) {
        const query = e;
        return { SEARCH_ERROR_RECEIVED: query }
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

      return null
    })
    .filter(x => x !== null)
  ;

  const commands = intents.map(movieSearchFsm.yield)

  return {
    commands
  }
}
