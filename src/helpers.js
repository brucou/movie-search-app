import superagent from "superagent"

// Helpers
export const SvcUrl = relativeUrl => relativeUrl
  .replace(/^/, 'https://api.themoviedb.org/3')
  .replace(/(\?|$)/, '?api_key=bf6b860ab05ac2d94054ba9ca96cf1fa&');

export function runSearchQuery(query) {
  console.log(SvcUrl(query))
  return superagent.get(SvcUrl(query))
    .then(res => {
      return res.body.results
    })
}

export function makeQuerySlug(query) {
  return query.length === 0
  ? `/movie/popular?language=en-US&page=1`
  : `/search/movie?query=${query}`
}
