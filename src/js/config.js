/**
 * Application Configuration
 * Central configuration for the Archive Film Club application
 */

export const CONFIG = {
  API_TIMEOUT: 10000,
  CACHE_DURATION: 5 * 60 * 1000,
  DEBOUNCE_DELAY: 500,
  MAX_SEARCH_HISTORY: 20,
  MAX_BOOKMARKS: 100,
  VIDEO_PROGRESS_CLEANUP_DAYS: 30,
  ITEMS_PER_PAGE: 24,
  INFINITE_SCROLL_THRESHOLD: 200,
  DOUBLE_TAP_DELAY: 300,
  SKIP_SECONDS: 10
};

export const COLLECTIONS = {
  'all_videos': 'All Videos',
  'feature_films': 'Feature Films',
  'adviews': 'AdViews',
  'academic_films': 'Academic Films',
  'animationandcartoons': 'Animation & Cartoons',
  'artsandmusicvideos': 'Arts & Music',
  'classic_tv': 'Classic TV',
  'Comedy_Films': 'Comedy Films',
  'educationalfilms': 'Educational Films',
  'ephemera': 'Ephemeral Films',
  'FedFlix': 'FedFlix',
  'Film_Noir': 'Film Noir',
  'gamevideos': 'Game Videos',
  'home_movies': 'Home Movies',
  'movie_trailers': 'Movie Trailers',
  'movies': 'Moving Image Archive',
  'nasa': 'NASA Archive',
  'newsandpublicaffairs': 'News & Public Affairs',
  'opensource_movies': 'Open Source Movies',
  'prelinger': 'Prelinger Archives',
  'short_films': 'Short Format Films',
  'silent_films': 'Silent Films',
  'SciFi_Horror': 'Sci-Fi / Horror Films',
  'sports': 'Sports',
  'tvarchive': 'Television Archive',
  'television': 'Television'
};

export default { CONFIG, COLLECTIONS };
