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
};

export const DISCOVERY_REQUEST = '/movie/popular?language=en-US&page=1';

export const INITIAL_REQUEST = `https://api.themoviedb.org/3/movie/popular?api_key=bf6b860ab05ac2d94054ba9ca96cf1fa&language=en-US&page=1`;
export const PROMPT = 'Search for a Title:'
export const POPULAR_NOW= 'Popular Now';
export const LOADING = 'Loading...';
export const IMAGE_TMDB_PREFIX = 'http://image.tmdb.org/t/p/w300';
export const NETWORK_ERROR='Network error';
