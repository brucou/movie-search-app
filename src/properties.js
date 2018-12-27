// Test ids
export const testIds = {
  PROMPT_TESTID: 'PROMPT_TESTID',
  RESULTS_HEADER_TESTID: 'RESULTS_HEADER_TESTID',
  QUERY_FIELD_TESTID: 'QUERY_FIELD_TESTID',
  LOADING_TESTID: 'LOADING_TESTID',
  RESULTS_CONTAINER_TESTID: 'RESULTS_CONTAINER_TESTID',
  MOVIE_IMG_SRC_TESTID: 'MOVIE_IMG_SRC_TESTID',
  MOVIE_TITLE_TESTID: 'MOVIE_TITLE_TESTID',
  NETWORK_ERROR_TESTID : 'NETWORK_ERROR_TESTID',
};

// Events
export const events = {
  USER_NAVIGATED_TO_APP : 'USER_NAVIGATED_TO_APP',
  QUERY_CHANGED : 'QUERY_CHANGED',
  SEARCH_RESULTS_RECEIVED : 'SEARCH_RESULTS_RECEIVED',
  SEARCH_ERROR_RECEIVED : 'SEARCH_ERROR_RECEIVED',
  SEARCH_REQUESTED : 'SEARCH_REQUESTED',
  QUERY_RESETTED : 'QUERY_RESETTED',
  MOVIE_SELECTED : 'MOVIE_SELECTED',
  SEARCH_RESULTS_MOVIE_RECEIVED : 'SEARCH_RESULTS_MOVIE_RECEIVED',
  SEARCH_ERROR_MOVIE_RECEIVED : 'SEARCH_ERROR_MOVIE_RECEIVED',
  MOVIE_DETAILS_DESELECTED : 'MOVIE_DETAILS_DESELECTED'
};

export const DISCOVERY_REQUEST = '/movie/popular?language=en-US&page=1';

export const INITIAL_REQUEST = `https://api.themoviedb.org/3/movie/popular?api_key=bf6b860ab05ac2d94054ba9ca96cf1fa&language=en-US&page=1`;
export const PROMPT = 'Search for a Title:'
export const POPULAR_NOW= 'Popular Now';
export const LOADING = 'Loading...';
export const SEARCH_RESULTS_FOR = query => `Search Results for "${query}":`
export const IMAGE_TMDB_PREFIX = 'http://image.tmdb.org/t/p/w300';
export const NETWORK_ERROR='Network error';

// States
export const MOVIE_QUERYING = 'Movie querying';
export const MOVIE_SELECTION = 'Movie selection';
export const MOVIE_SELECTION_ERROR = 'Movie selection error';
export const MOVIE_DETAIL_SELECTION = 'Movie detail selection';
export const MOVIE_DETAIL_QUERYING = 'Movie detail querying';
export const MOVIE_DETAIL_SELECTION_ERROR= 'Movie detail selection error';
