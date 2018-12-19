import superagent from "superagent"

// Helpers
export const SvcUrl = relativeUrl => relativeUrl
  .replace(/^/, 'https://api.themoviedb.org/3')
  .replace(/(\?|$)/, '?api_key=bf6b860ab05ac2d94054ba9ca96cf1fa&');

export function runSearchQuery(query) {
  debugger
  return superagent.get(SvcUrl(query))
    .then(res => {
      debugger
      return res.body.results
    })
}

export function makeQuerySlug(query) {
  return `/search/movie?query=${query}`
}
