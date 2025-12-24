/**
 * ArchiveVideoSearch - Enhanced Version with Recommended Section
 * Version: 1.1.0
 * Fixed: Emoji encoding, Added: Recommended/Staff Picks section
 */

// Configuration
const CONFIG = {
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

// SVG Icons (replacing emojis for consistent rendering)
const ICONS = {
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3V15M12 15L7 10M12 15L17 10M3 17V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.5355 13.5355L20.5355 10.5355C21.4732 9.55821 21.9928 8.25023 21.9785 6.89326C21.9641 5.53629 21.4169 4.23969 20.4586 3.28137C19.5003 2.32306 18.2037 1.77587 16.8467 1.76154C15.4897 1.74721 14.1818 2.26678 13.2045 3.20447L11.6364 4.77259" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60706C11.7643 9.26329 11.0685 9.05888 10.3533 9.00766C9.63816 8.95644 8.92037 9.05966 8.24861 9.3102C7.57685 9.56074 6.96684 9.95296 6.46447 10.4645L3.46447 13.4645C2.52678 14.4418 2.00721 15.7498 2.02154 17.1067C2.03587 18.4637 2.58306 19.7603 3.54137 20.7186C4.49969 21.6769 5.79629 22.2241 7.15326 22.2385C8.51023 22.2528 9.81821 21.7332 10.7955 20.7955L12.3536 19.2274" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bookmark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21L12 17.5L5 21V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bookmarkFilled: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21L12 17.5L5 21V5Z"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6C3 4.89543 3.89543 4 5 4H9L11 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  film: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" stroke-width="2"/><path d="M7 2V22M17 2V22M2 12H22M2 7H7M2 17H7M17 17H22M17 7H22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  storage: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V7" stroke="currentColor" stroke-width="2"/><rect x="2" y="3" width="20" height="4" rx="1" stroke="currentColor" stroke-width="2"/></svg>',
  tv: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" stroke-width="2"/><path d="M17 2L12 7L7 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wifi: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.55C7.86 9.96 11.81 8.81 15.5 9.22C17.89 9.5 20.13 10.45 22 12M8.53 16.11C10.27 14.78 12.54 14.29 14.68 14.76C15.95 15.05 17.12 15.63 18.09 16.47M12 20H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>',
  play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3L19 12L5 21V3Z"/></svg>'
};

// Utility Classes
class VideoProgressTracker {
  constructor() {
    this.progress = this.safeParseJSON(localStorage.getItem('videoProgress')) || {};
    this.cleanupOldProgress();
  }
  
  safeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  
  saveProgress(videoId, currentTime, duration) {
    if (!videoId || !duration) return;
    
    this.progress[videoId] = {
      currentTime,
      duration,
      percentage: (currentTime / duration) * 100,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('videoProgress', JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }
  
  getProgress(videoId) {
    return this.progress[videoId] || null;
  }
  
  cleanupOldProgress() {
    const cutoff = Date.now() - (CONFIG.VIDEO_PROGRESS_CLEANUP_DAYS * 24 * 60 * 60 * 1000);
    let cleaned = false;
    
    Object.keys(this.progress).forEach(id => {
      if (this.progress[id].timestamp < cutoff) {
        delete this.progress[id];
        cleaned = true;
      }
    });
    
    if (cleaned) {
      try {
        localStorage.setItem('videoProgress', JSON.stringify(this.progress));
      } catch (e) {
        console.warn('Failed to cleanup progress:', e);
      }
    }
  }
}

class SearchCache {
  constructor(maxAge = CONFIG.CACHE_DURATION) {
    this.cache = new Map();
    this.maxAge = maxAge;
  }
  
  getCacheKey(query, page, filters) {
    return JSON.stringify({ query, page, ...filters });
  }
  
  get(query, page, filters) {
    const key = this.getCacheKey(query, page, filters);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      console.log('Cache hit for:', key);
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }
  
  set(query, page, filters, data) {
    const key = this.getCacheKey(query, page, filters);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  clear() {
    this.cache.clear();
  }
}

class BookmarkManager {
  constructor() {
    this.bookmarks = this.safeParseJSON(localStorage.getItem('bookmarks')) || [];
  }
  
  safeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  
  add(video) {
    if (this.isBookmarked(video.identifier)) return false;
    
    const bookmark = {
      id: video.identifier,
      title: this.extractValue(video.title),
      creator: this.extractValue(video.creator),
      thumbnail: `https://archive.org/services/img/${video.identifier}`,
      timestamp: Date.now()
    };
    
    this.bookmarks.unshift(bookmark);
    
    if (this.bookmarks.length > CONFIG.MAX_BOOKMARKS) {
      this.bookmarks = this.bookmarks.slice(0, CONFIG.MAX_BOOKMARKS);
    }
    
    this.save();
    return true;
  }
  
  remove(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    this.save();
  }
  
  isBookmarked(id) {
    return this.bookmarks.some(b => b.id === id);
  }
  
  getAll() {
    return this.bookmarks;
  }
  
  save() {
    try {
      localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks:', e);
    }
  }
  
  extractValue(field) {
    return Array.isArray(field) ? field[0] : field;
  }
}

class SearchSuggestions {
  constructor(searchInput, onSelect) {
    this.input = searchInput;
    this.onSelect = onSelect;
    this.suggestions = [];
    this.selectedIndex = -1;
    this.history = this.safeParseJSON(localStorage.getItem('searchHistory')) || [];
    this.createDropdown();
  }
  
  safeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  
  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'search-suggestions';
    this.dropdown.style.display = 'none';
    this.input.parentNode.appendChild(this.dropdown);
    
    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('focus', () => this.show());
    this.input.addEventListener('blur', () => setTimeout(() => this.hide(), 200));
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
  }
  
  handleInput() {
    const value = this.input.value.trim();
    if (value.length < 2) {
      this.showHistory();
      return;
    }
    
    const filtered = this.history.filter(term => 
      term.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);
    
    this.updateSuggestions(filtered);
  }
  
  showHistory() {
    if (this.history.length > 0) {
      this.updateSuggestions(this.history.slice(0, 5), true);
    }
  }
  
  updateSuggestions(suggestions, isHistory = false) {
    this.suggestions = suggestions;
    
    if (suggestions.length === 0) {
      this.hide();
      return;
    }
    
    this.dropdown.innerHTML = `
      ${isHistory ? '<div class="suggestions-header">Recent Searches</div>' : ''}
      ${suggestions.map((s, i) => 
        `<div class="suggestion-item" data-index="${i}">
          <span class="suggestion-icon">${ICONS.search}</span>
          <span class="suggestion-text">${this.escapeHtml(s)}</span>
        </div>`
      ).join('')}
    `;
    
    this.dropdown.style.display = 'block';
    
    this.dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectSuggestion(parseInt(item.dataset.index));
      });
    });
  }
  
  handleKeydown(e) {
    if (!this.suggestions.length) return;
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        this.updateSelection();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
      case 'Enter':
        if (this.selectedIndex >= 0) {
          e.preventDefault();
          this.selectSuggestion(this.selectedIndex);
        }
        break;
      case 'Escape':
        this.hide();
        break;
    }
  }
  
  updateSelection() {
    this.dropdown.querySelectorAll('.suggestion-item').forEach((item, i) => {
      item.classList.toggle('selected', i === this.selectedIndex);
    });
  }
  
  selectSuggestion(index) {
    const suggestion = this.suggestions[index];
    if (suggestion) {
      this.input.value = suggestion;
      this.onSelect(suggestion);
      this.hide();
    }
  }
  
  addToHistory(term) {
    if (!term || term.length < 2) return;
    
    this.history = this.history.filter(h => h !== term);
    this.history.unshift(term);
    this.history = this.history.slice(0, CONFIG.MAX_SEARCH_HISTORY);
    
    try {
      localStorage.setItem('searchHistory', JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  }
  
  hide() {
    this.dropdown.style.display = 'none';
    this.selectedIndex = -1;
  }
  
  show() {
    if (this.input.value.length < 2) {
      this.showHistory();
    } else {
      this.handleInput();
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

class OfflineHandler {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = [];
    
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    if (!this.isOnline) {
      this.showOfflineMessage();
    }
  }
  
  handleOnline() {
    this.isOnline = true;
    this.hideOfflineMessage();
    this.callbacks.forEach(cb => cb(true));
  }
  
  handleOffline() {
    this.isOnline = false;
    this.showOfflineMessage();
    this.callbacks.forEach(cb => cb(false));
  }
  
  showOfflineMessage() {
    if (document.getElementById('offline-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.className = 'offline-banner';
    banner.innerHTML = `
      <span>${ICONS.wifi} You're offline. Some features may be limited.</span>
    `;
    document.body.appendChild(banner);
  }
  
  hideOfflineMessage() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      banner.classList.add('hiding');
      setTimeout(() => banner.remove(), 300);
    }
  }
  
  onStatusChange(callback) {
    this.callbacks.push(callback);
  }
}

// Recommended Videos Manager
class RecommendedManager {
  constructor(app) {
    this.app = app;
    this.config = this.loadConfig();
    this.videos = [];
    this.section = document.getElementById('recommendedSection');
    this.grid = document.getElementById('recommendedGrid');
    this.hideBtn = document.getElementById('hideRecommended');
    
    // Check localStorage - if previously hidden, check if we should reset
    const hiddenVal = localStorage.getItem('hideRecommended');
    this.isHidden = hiddenVal === 'true';
    
    console.log('[Recommended] Constructor:', {
      configFound: !!this.config,
      sectionFound: !!this.section,
      gridFound: !!this.grid,
      isHidden: this.isHidden,
      localStorageValue: hiddenVal
    });
    
    this.setupEventListeners();
  }
  
  safeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  
  loadConfig() {
    const configEl = document.getElementById('recommendedConfig');
    if (configEl) {
      try {
        return JSON.parse(configEl.textContent);
      } catch (e) {
        console.warn('Failed to parse recommended config:', e);
      }
    }
    return { enabled: false, videos: [] };
  }
  
  setupEventListeners() {
    if (this.hideBtn) {
      this.hideBtn.addEventListener('click', () => this.hide());
    }
  }
  
  async init() {
    console.log('RecommendedManager init:', {
      enabled: this.config.enabled,
      videosCount: this.config.videos?.length,
      isHidden: this.isHidden,
      sectionExists: !!this.section,
      gridExists: !!this.grid
    });
    
    if (!this.config.enabled || !this.config.videos?.length || this.isHidden) {
      console.log('Recommended section skipped:', {
        notEnabled: !this.config.enabled,
        noVideos: !this.config.videos?.length,
        hidden: this.isHidden
      });
      return;
    }
    
    await this.loadVideos();
    console.log('Loaded videos:', this.videos.length);
    this.render();
  }
  
  async loadVideos() {
    const videoPromises = this.config.videos.map(async (item) => {
      try {
        const response = await fetch(`https://archive.org/metadata/${item.id}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        if (!data.metadata) return null;
        
        return {
          ...data.metadata,
          identifier: item.id,
          adminNote: item.note
        };
      } catch (e) {
        console.warn(`Failed to load recommended video: ${item.id}`, e);
        return null;
      }
    });
    
    const results = await Promise.all(videoPromises);
    this.videos = results.filter(v => v !== null);
  }
  
  render() {
    console.log('Render called:', {
      sectionExists: !!this.section,
      gridExists: !!this.grid,
      videosCount: this.videos.length
    });
    
    if (!this.section || !this.grid || this.videos.length === 0) {
      console.log('Render aborted - missing elements or no videos');
      return;
    }
    
    this.section.style.display = 'block';
    console.log('Section displayed');
    
    this.grid.innerHTML = this.videos.map(video => this.createCard(video)).join('');
    console.log('Cards rendered:', this.grid.children.length);
    
    // Attach event listeners
    this.grid.querySelectorAll('.recommended-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('a')) return; // Don't intercept archive links
        
        const id = card.dataset.identifier;
        const title = card.querySelector('.recommended-card-title').textContent;
        const creator = card.querySelector('.recommended-card-creator')?.textContent || 'Unknown';
        
        await this.app.playVideo(id, title, creator);
      });
    });
  }
  
  createCard(video) {
    const title = this.extractValue(video.title) || 'Untitled';
    const creator = this.extractValue(video.creator) || 'Unknown';
    const thumbUrl = `https://archive.org/services/img/${video.identifier}`;
    const runtime = this.app.formatRuntime(video.runtime);
    
    return `
      <article class="recommended-card" data-identifier="${video.identifier}">
        <div class="recommended-card-thumb">
          <img src="${thumbUrl}" 
               alt="${this.escapeHtml(title)}" 
               loading="lazy"
               onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=thumb-placeholder>🎬</div>'"/>
          ${runtime ? `<span class="runtime-badge">${runtime}</span>` : ''}
          <div class="recommended-card-overlay">
            <span class="play-btn">${ICONS.play}</span>
          </div>
        </div>
        <div class="recommended-card-content">
          <h3 class="recommended-card-title">${this.escapeHtml(title)}</h3>
          <p class="recommended-card-creator">${this.escapeHtml(creator)}</p>
          ${video.adminNote ? `<span class="recommended-card-note">${ICONS.star} ${this.escapeHtml(video.adminNote)}</span>` : ''}
        </div>
      </article>
    `;
  }
  
  extractValue(field) {
    return Array.isArray(field) ? field[0] : field;
  }
  
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  hide() {
    if (this.section) {
      this.section.style.display = 'none';
    }
    this.isHidden = true;
    try {
      localStorage.setItem('hideRecommended', 'true');
    } catch (e) {
      console.warn('Failed to save preference:', e);
    }
  }
  
  show() {
    this.isHidden = false;
    try {
      localStorage.removeItem('hideRecommended');
    } catch (e) {
      console.warn('Failed to save preference:', e);
    }
    this.init();
  }
}

// Main Application Class
class ArchiveVideoSearch {
  constructor() {
    // Core properties
    this.currentPage = 1;
    this.currentQuery = '';
    this.totalResults = 0;
    this.currentlyPlaying = null;
    this.videoControls = null;
    this.isSeeking = false;
    this.wasPaused = true;
    this.searchDebounceTimer = null;
    this.keyboardHandler = null;
    
    // Feature flags
    this.useInfiniteScroll = false;
    this.enableTheaterMode = true;
    this.enableBookmarks = false;
    
    // Utility instances
    this.progressTracker = new VideoProgressTracker();
    this.searchCache = new SearchCache();
    this.bookmarkManager = new BookmarkManager();
    this.offlineHandler = new OfflineHandler();
    
    // User preferences
    this.userPreferences = this.safeParseJSON(localStorage.getItem('userPrefs')) || {};
    
    // Collections
    this.collections = {
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
    
    this.initializeElements();
    this.setupEventListeners();
    this.populateCollections();
    this.loadUserPreferences();
    this.setupSearchSuggestions();
    
    // Initialize recommended section
    this.recommendedManager = new RecommendedManager(this);
    this.recommendedManager.init().then(() => {
      console.log('Recommended section initialized');
    }).catch(err => {
      console.error('Failed to init recommended:', err);
    });
    
    this.handleUrlParameters();
    
    // Setup offline handler callbacks
    this.offlineHandler.onStatusChange((isOnline) => {
      if (isOnline && this.currentQuery) {
        this.showMessage('Back online! Refreshing results...', 'success');
        this.performSearch();
      }
    });
    
    this.updatePageTitle();
    
    console.log('ArchiveVideoSearch initialized successfully');
  }

  safeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  initializeElements() {
    this.searchForm = document.getElementById('searchForm');
    this.searchInput = document.getElementById('searchInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');
    this.collection = document.getElementById('collection');
    this.sortBy = document.getElementById('sortBy');
    this.clearFilters = document.getElementById('clearFilters');
    this.loading = document.getElementById('loading');
    this.error = document.getElementById('error');
    this.results = document.getElementById('results');
    this.pagination = document.getElementById('pagination');
    this.searchStats = document.getElementById('searchStats');
    this.playerContainer = document.getElementById('playerContainer');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.playerTitle = document.getElementById('playerTitle');
    this.playerMeta = document.getElementById('playerMeta');
    this.playerInfo = document.getElementById('playerInfo');
    this.publicDomain = document.getElementById('publicDomain');
    this.collectionsOnly = document.getElementById('collectionsOnly');
    this.sidebar = document.querySelector('.sidebar');
    this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    this.mobileOverlay = document.querySelector('.mobile-overlay');
    this.mobileCloseBtn = document.querySelector('.mobile-close-btn');
    this.theaterModeBtn = document.getElementById('theaterModeBtn');
    this.surpriseMeBtn = document.getElementById('surpriseMeBtn');
    this.bookmarksBtn = document.getElementById('bookmarksBtn');
    
    const criticalElements = [
      'searchForm', 'searchInput', 'collection', 'results', 'playerContainer'
    ];
    
    for (const elementName of criticalElements) {
      if (!this[elementName]) {
        console.error(`Critical element missing: ${elementName}`);
      }
    }
  }

  setupEventListeners() {
    // Logo click - go home
    const logoSection = document.querySelector('.logo-section');
    if (logoSection) {
      logoSection.addEventListener('click', (e) => {
        e.preventDefault();
        this.goHome();
      });
    }
    
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', e => {
        e.preventDefault();
        this.currentPage = 1;
        this.performSearch();
      });
    }
    
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.debounceSearch(() => {
          const value = this.searchInput.value.trim();
          if (value.length > 2 || value.length === 0) {
            this.currentPage = 1;
            this.performSearch();
          }
        });
        
        if (this.clearSearchBtn) {
          this.clearSearchBtn.style.display = this.searchInput.value ? 'flex' : 'none';
        }
      });
    }
    
    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.clearSearchBtn.style.display = 'none';
        this.searchInput.focus();
        this.currentPage = 1;
        this.performSearch();
      });
    }

    if (this.collection) {
      this.collection.addEventListener('change', () => {
        this.currentPage = 1;
        this.performSearch();
        this.saveUserPreferences();
      });
    }

    if (this.sortBy) {
      this.sortBy.addEventListener('change', () => {
        if (this.hasActiveSearch()) {
          this.currentPage = 1;
          this.performSearch();
          this.saveUserPreferences();
        }
      });
    }

    [this.publicDomain, this.collectionsOnly].forEach(cb => {
      if (cb) cb.addEventListener('change', () => {
        this.currentPage = 1;
        this.performSearch();
      });
    });

    if (this.clearFilters) {
      this.clearFilters.addEventListener('click', () => this.clearAllFilters());
    }
    
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    }
    
    if (this.theaterModeBtn) {
      this.theaterModeBtn.addEventListener('click', () => this.toggleTheaterMode());
    }
    
    if (this.surpriseMeBtn) {
      this.surpriseMeBtn.addEventListener('click', () => this.playRandomVideo());
    }
    
    if (this.bookmarksBtn) {
      this.bookmarksBtn.addEventListener('click', () => this.showBookmarks());
    }
    
    window.addEventListener('popstate', () => {
      this.handleUrlParameters();
    });
    
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.playerContainer) {
        this.playerContainer.classList.remove('is-fullscreen');
      }
    });

    this.setupMobileMenu();
  }

  setupMobileMenu() {
    if (!this.mobileMenuBtn || !this.sidebar || !this.mobileOverlay || !this.mobileCloseBtn) return;
  
    const openMenu = () => {
      this.sidebar.classList.add('open');
      this.mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
  
    this.mobileMenuBtn.addEventListener('click', openMenu);
    this.mobileOverlay.addEventListener('click', () => this.closeMobileMenu());
    this.mobileCloseBtn.addEventListener('click', () => this.closeMobileMenu());
  
    [this.collection, this.sortBy, this.publicDomain, this.collectionsOnly].forEach(el => {
      if (el) {
        el.addEventListener('change', () => {
          if (window.innerWidth <= 768 && this.sidebar.classList.contains('open')) {
            setTimeout(() => this.closeMobileMenu(), 200);
          }
        });
      }
    });
  
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.sidebar.classList.contains('open')) {
        this.closeMobileMenu();
      }
    });
  }

  setupSearchSuggestions() {
    if (this.searchInput) {
      this.searchSuggestions = new SearchSuggestions(
        this.searchInput,
        (suggestion) => {
          this.currentPage = 1;
          this.performSearch();
        }
      );
    }
  }

  debounceSearch(callback, delay = CONFIG.DEBOUNCE_DELAY) {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(callback, delay);
  }

  saveUserPreferences() {
    const prefs = {
      collection: this.collection?.value,
      sortBy: this.sortBy?.value,
      volume: this.videoControls?.video?.volume || 1,
      lastSearch: this.searchInput?.value,
      theaterMode: this.playerContainer?.classList.contains('theater-mode'),
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('userPrefs', JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }

  loadUserPreferences() {
    if (!this.userPreferences) return;
    
    if (this.userPreferences.collection && this.collections[this.userPreferences.collection] && this.collection) {
      this.collection.value = this.userPreferences.collection;
    }
    
    if (this.userPreferences.sortBy && this.sortBy) {
      this.sortBy.value = this.userPreferences.sortBy;
    }
  }

  updatePageTitle(suffix = '') {
    let title = 'Archive Film Club';
    if (suffix) {
      title = `${suffix} - ${title}`;
    } else if (this.totalResults > 0) {
      title = `(${this.totalResults.toLocaleString()}) ${title}`;
    }
    document.title = title;
  }

  closeMobileMenu() {
    if (this.sidebar) this.sidebar.classList.remove('open');
    if (this.mobileOverlay) this.mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hasActiveSearch() {
    return (this.collection?.value !== 'all_videos') || 
           (this.searchInput?.value.trim()) || 
           (this.collectionsOnly?.checked);
  }

  populateCollections() {
    if (!this.collection) return;
    
    this.collection.innerHTML = '';
    const sortedCollections = Object.entries(this.collections).sort((a, b) => {
      if (a[0] === 'all_videos') return -1;
      if (b[0] === 'all_videos') return 1;
      return a[1].localeCompare(b[1]);
    });

    sortedCollections.forEach(([id, label]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = label;
      this.collection.appendChild(opt);
    });
    this.collection.value = 'all_videos';
  }

  handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('video');
    const track = params.get('track');
    const timestamp = params.get('t');
    const searchQ = params.get('search');
    const col = params.get('collection');
    const page = parseInt(params.get('page'), 10);

    if (videoId) {
      const trackIndex = track ? parseInt(track, 10) - 1 : null;
      this.loadVideoFromUrl(videoId, trackIndex, timestamp);
      return;
    }

    if (searchQ || col) {
      if (searchQ && this.searchInput) this.searchInput.value = decodeURIComponent(searchQ);
      if (col && this.collections[col] && this.collection) this.collection.value = col;
      if (page > 0) this.currentPage = page;
      setTimeout(() => this.performSearch(), 100);
    } else {
      this.loadInitialSearch();
    }
  }

  loadInitialSearch() {
    setTimeout(() => {
      if (this.collection) this.collection.value = 'all_videos';
      if (this.sortBy) this.sortBy.value = 'downloads';
      this.performSearch();
    }, 500);
  }

  async loadVideoFromUrl(id, track = null, timestamp = null) {
    try {
      this.showLoading();
      await this.playVideo(id, id, 'Unknown', track);
      
      if (timestamp && this.videoControls?.video) {
        setTimeout(() => {
          this.videoControls.video.currentTime = parseInt(timestamp, 10);
        }, 1000);
      }
    } catch (err) {
      console.error('Deep-link load failed:', err);
      this.showError('Could not load video from link.');
    } finally {
      this.hideLoading();
    }
  }

  async performSearch() {
    if (!this.offlineHandler.isOnline) {
      this.showError('You are offline. Please check your connection.');
      return;
    }
    
    const term = this.searchInput?.value.trim() || '';
    this.currentQuery = term || '*';
    
    if (term && this.searchSuggestions) {
      this.searchSuggestions.addToHistory(term);
    }

    this.updateUrl({
      search: term || undefined,
      collection: (this.collection?.value !== 'all_videos') ? this.collection.value : undefined,
      page: this.currentPage > 1 ? String(this.currentPage) : undefined
    }, true);

    this.hidePlayer();
    this.showLoading();
    this.hideError();

    try {
      const data = await this.searchArchive(this.currentQuery, this.currentPage);
      if (!data || !data.response) throw new Error('Invalid response from Archive.org');

      const resp = data.response;
      this.totalResults = resp.numFound || 0;
      
      this.displayResults(resp.docs || []);
      this.updatePagination(resp.numFound || 0);
      this.updateStats(resp.numFound || 0);
      this.updatePageTitle();
      
    } catch (err) {
      console.error('Search error:', err);
      this.showError(`Search failed: ${err.message}`);
      this.showFallbackMessage();
    } finally {
      this.hideLoading();
    }
  }

  async searchArchive(query, page = 1) {
    const searchQueryParts = [];
    
    const knownVideoCollections = Object.keys(this.collections).filter(id => id !== 'all_videos');

    if (this.collectionsOnly?.checked) {
      searchQueryParts.push('mediatype:collection AND collection:movies');
      
      if (knownVideoCollections.length > 0) {
        searchQueryParts.push(`identifier:(${knownVideoCollections.join(' OR ')})`);
      }
    } else {
      const videoQuery = 'mediatype:(movies OR video OR television)';
      const collectionQuery = knownVideoCollections.length > 0 
        ? `(mediatype:collection AND identifier:(${knownVideoCollections.join(' OR ')}))`
        : '';
      
      if (collectionQuery) {
        searchQueryParts.push(`(${videoQuery} OR ${collectionQuery})`);
      } else {
        searchQueryParts.push(videoQuery);
      }
    }

    if (this.collection?.value && this.collection.value !== 'all_videos') {
      searchQueryParts.push(`collection:(${this.collection.value})`);
    }

    if (query && query !== '*') {
      const clean = query.replace(/[:"()]/g, ' ').trim();
      if (clean) searchQueryParts.push(`(${clean})`);
    }

    if (this.publicDomain?.checked) {
      searchQueryParts.push(`(licenseurl:"http://creativecommons.org/publicdomain/mark/1.0/" OR licenseurl:"https://creativecommons.org/publicdomain/mark/1.0/" OR licenseurl:"http://creativecommons.org/publicdomain/")`);
    }

    const searchQuery = searchQueryParts.join(' AND ');
    
    const params = new URLSearchParams({ 
      q: searchQuery, 
      output: 'json', 
      rows: String(CONFIG.ITEMS_PER_PAGE), 
      page: String(page) 
    });
    
    ['identifier', 'title', 'description', 'date', 'downloads', 'creator', 'runtime', 'licenseurl', 'subject', 'mediatype', 'num_items']
      .forEach(f => params.append('fl[]', f));

    if (this.sortBy?.value && this.sortBy.value !== 'relevance') {
      switch (this.sortBy.value) {
        case 'date': params.append('sort[]', 'publicdate desc'); break;
        case 'downloads': params.append('sort[]', 'downloads desc'); break;
        case 'title': params.append('sort[]', 'titleSorter asc'); break;
        case 'creator': params.append('sort[]', 'creatorSorter asc'); break;
      }
    }

    const url = `https://archive.org/advancedsearch.php?${params}`;
    const response = await this.fetchWithRetry(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }

  async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) return response;
        throw new Error(`HTTP ${response.status}`);
        
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  displayResults(docs) {
    this.hideLoading();
    if (!docs || !docs.length) return this.showNoResults();
    
    if (!this.results) return;

    const resultsHtml = docs.map(d => this.createResultCard(d)).join('');
    this.results.innerHTML = resultsHtml;
    this.attachCardEventListeners();
  }

  attachCardEventListeners() {
    if (!this.results) return;
    
    this.results.querySelectorAll('.result-card').forEach(card => {
      card.addEventListener('click', async e => {
        if (e.target.closest('button, a')) return;
        
        const id = card.dataset.identifier;
        const mediatype = card.dataset.mediatype;
        
        if (mediatype === 'collection') {
          this.openCollection(card, id);
        } else {
          const title = card.querySelector('.result-title').textContent;
          const creatorEl = card.querySelector('.result-creator');
          const creator = creatorEl ? creatorEl.textContent : 'Unknown';
          await this.playVideo(id, title, creator);
        }
      });
    });
    
    this.results.querySelectorAll('.btn-play, .btn-primary-action').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const card = e.target.closest('.result-card');
        const id = card.dataset.identifier;
        const mediatype = card.dataset.mediatype;
        
        if (mediatype === 'collection') {
          this.openCollection(card, id);
        } else {
          const title = card.querySelector('.result-title').textContent;
          const creatorEl = card.querySelector('.result-creator');
          const creator = creatorEl ? creatorEl.textContent : 'Unknown';
          await this.playVideo(id, title, creator);
        }
      });
    });
    
    this.results.querySelectorAll('.btn-share').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = e.target.closest('.result-card');
        const id = card.dataset.identifier;
        const title = card.querySelector('.result-title').textContent;
        this.shareVideo(id, null, title);
      });
    });
    
    this.results.querySelectorAll('.btn-bookmark').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = e.target.closest('.result-card');
        const id = card.dataset.identifier;
        const title = card.querySelector('.result-title').textContent;
        const creatorEl = card.querySelector('.result-creator');
        const creator = creatorEl ? creatorEl.textContent : 'Unknown';
        
        const video = { identifier: id, title, creator };
        
        if (this.bookmarkManager.isBookmarked(id)) {
          this.bookmarkManager.remove(id);
          btn.classList.remove('bookmarked');
          btn.innerHTML = ICONS.bookmark;
          this.showMessage('Removed from bookmarks', 'info');
        } else {
          this.bookmarkManager.add(video);
          btn.classList.add('bookmarked');
          btn.innerHTML = ICONS.bookmarkFilled;
          this.showMessage('Added to bookmarks!', 'success');
        }
      });
    });
  }

  openCollection(card, id) {
    if (!this.collections[id]) {
      const title = card.querySelector('.result-title').textContent;
      this.collections[id] = title.length > 30 ? title.slice(0, 27) + '...' : title;
      this.populateCollections();
    }
    
    if (this.collection) this.collection.value = id;
    if (this.searchInput) this.searchInput.value = '';
    this.currentPage = 1;

    if (this.collectionsOnly) {
      this.collectionsOnly.checked = false;
    }
    
    this.performSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  createResultCard(item) {
    const title = this.extractValue(item.title) || 'Untitled';
    const desc = this.extractValue(item.description) || '';
    const snippet = desc.length > 120 ? desc.slice(0, 120) + '...' : desc;
    const creator = this.extractValue(item.creator) || 'Unknown';
    const date = this.extractValue(item.date) ? new Date(this.extractValue(item.date)).toLocaleDateString() : '';
    const downloads = Number(item.downloads || 0).toLocaleString();
    const runtime = this.formatRuntime(item.runtime);
    const href = `https://archive.org/details/${item.identifier}`;
    const thumbUrl = `https://archive.org/services/img/${item.identifier}`;
    const license = this.extractValue(item.licenseurl) || '';
    const subject = this.extractValue(item.subject) || '';
    const isPD = license.includes('publicdomain') || subject.toLowerCase().includes('public domain');
    const mediatype = this.extractValue(item.mediatype) || 'movies';
    const isBookmarked = this.bookmarkManager.isBookmarked(item.identifier);
    
    const progress = this.progressTracker.getProgress(item.identifier);
    const progressBar = progress ? `
      <div class="progress-indicator" style="width: ${progress.percentage}%"></div>
    ` : '';

    let actionButtonHtml;
    if (mediatype === 'collection') {
      actionButtonHtml = `<button class="btn btn-secondary btn-primary-action"><span class="btn-icon">${ICONS.folder}</span> Open Collection</button>`;
    } else {
      actionButtonHtml = `<button class="btn btn-play btn-primary-action"><span class="btn-icon">${ICONS.play}</span> ${progress ? 'Resume' : 'Play'}</button>`;
    }

    const placeholderIcon = mediatype === 'collection' ? '📁' : '🎬';
    
    return `
      <article class="result-card" data-identifier="${item.identifier}" data-mediatype="${mediatype}">
        <div class="result-thumbnail">
          <img src="${thumbUrl}"
               alt="Thumbnail for ${this.escapeHtml(title)}"
               class="result-thumb"
               loading="lazy"
               onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=thumb-placeholder>${placeholderIcon}</div>'"/>
          ${runtime && mediatype !== 'collection' ? `<span class="runtime-badge">${runtime}</span>` : ''}
          ${isPD ? `<span class="license-badge">Public Domain</span>` : ''}
          ${progressBar}
        </div>
        <div class="result-content">
          <div class="result-header">
            <h3 class="result-title">${this.escapeHtml(title)}</h3>
            <div class="result-meta">
              <span class="result-creator"><span class="meta-icon">${ICONS.user}</span> ${this.escapeHtml(creator)}</span>
              ${date ? `<span><span class="meta-icon">${ICONS.calendar}</span> ${date}</span>` : ''}
              ${downloads ? `<span><span class="meta-icon">${ICONS.download}</span> ${downloads}</span>` : ''}
            </div>
          </div>
          <div class="result-description"></div>
          <div class="result-actions">
            ${actionButtonHtml}
            <a href="${href}" target="_blank" class="btn btn-archive">Archive</a>
            <button class="btn btn-share" title="Share video">${ICONS.link}</button>
            ${this.enableBookmarks && mediatype !== 'collection' ? `
              <button class="btn btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" title="Bookmark">
                ${isBookmarked ? ICONS.bookmarkFilled : ICONS.bookmark}
              </button>
            ` : ''}
          </div>
        </div>
      </article>`;
  }

  async playVideo(id, title, creator, track = null) {
    this.currentlyPlaying = id;
    if (this.playerTitle) this.playerTitle.textContent = title;
    if (this.playerMeta) this.playerMeta.textContent = `by ${creator}`;
    
    this.updateUrl({ video: id }, true);
    this.updatePageTitle(title);

    if (this.playerContainer) {
      this.playerContainer.classList.add('visible');
      this.playerContainer.removeAttribute('aria-hidden');
    }
    
    if (this.userPreferences.theaterMode && this.enableTheaterMode && this.playerContainer) {
      this.playerContainer.classList.add('theater-mode');
    }
    
    this.updatePlayPauseButton(true);
    
    if (this.playerContainer) {
      this.playerContainer.scrollIntoView({ behavior: 'smooth' });
    }

    const playerLoader = this.playerContainer?.querySelector('.player-loader');
    const videoWrapper = this.playerContainer?.querySelector('.video-wrapper');

    try {
      if (playerLoader) playerLoader.style.display = 'flex';
      const existingVideo = videoWrapper?.querySelector('.video-player');
      if (existingVideo) existingVideo.remove();
      
      const metadata = await this.getVideoMetadata(id);
      
      if (metadata.metadata && metadata.metadata.mediatype === 'collection' && !metadata.files) {
        throw new Error('Collection item has no direct playable media.');
      }
      
      const videoData = await this.loadNativeVideo(id, metadata);
      
      const progress = this.progressTracker.getProgress(id);
      if (progress && this.videoControls?.video) {
        setTimeout(() => {
          if (confirm(`Resume from ${this.formatTime(progress.currentTime)}?`)) {
            this.videoControls.video.currentTime = progress.currentTime;
          }
        }, 1000);
      }

      if (videoData.videoFiles.length > 1 && this.hasMultipleUniqueVideos(videoData.videoFiles)) {
        const startIndex = track !== null && track >= 0 && track < videoData.videoFiles.length ? track : 0;
        this.setupPlaylist(id, title, creator, videoData.metadata, videoData.videoFiles, startIndex);
      } else {
        this.displayVideoMetadata(title, creator, videoData.metadata, videoData.videoFiles);
      }
      
    } catch (err) {
      console.log('Native load failed, falling back to iframe:', err.message);
      this.loadIframeVideo(id);
      this.displaySimpleMetadata(title, creator);
    } finally {
      if (playerLoader) playerLoader.style.display = 'none';
    }
  }

  async loadNativeVideo(id, metadata, specificFileName = null) {
    const actual = metadata.metadata ? metadata : { metadata, files: metadata.files };
    const videoFiles = this.getVideoFiles(actual);
    
    if (!videoFiles.length) {
      throw new Error('No playable video files found');
    }
    
    let selected;
    if (specificFileName) {
      selected = videoFiles.find(f => f.name === specificFileName);
      if (!selected) {
        selected = this.selectBestQuality(videoFiles);
      }
    } else {
      selected = this.selectBestQuality(videoFiles);
    }
    
    if (!selected) {
      throw new Error('No suitable video file found');
    }

    const url = `https://archive.org/download/${id}/${encodeURIComponent(selected.name)}`;
    const videoWrapper = this.playerContainer?.querySelector('.video-wrapper');
    
    if (!videoWrapper) {
      throw new Error('Video wrapper not found');
    }
    
    const oldVideo = videoWrapper.querySelector('.video-player, .video-element');
    if (oldVideo) oldVideo.remove();
    
    const oldControls = videoWrapper.querySelector('.video-controls');
    if (oldControls) oldControls.remove();

    videoWrapper.innerHTML = `
      <video class="video-element" id="mainVideo" controls preload="metadata" autoplay>
        <source src="${url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;

    const videoEl = videoWrapper.querySelector('#mainVideo');
    
    if (!videoEl) {
      throw new Error('Failed to create video element');
    }
    
    this.videoControls = { video: videoEl };
    
    if (this.userPreferences.volume !== undefined) {
      videoEl.volume = this.userPreferences.volume;
    }

    videoEl.addEventListener('play', () => {
      this.updatePlayPauseButton(true);
    });
    
    videoEl.addEventListener('pause', () => {
      this.updatePlayPauseButton(false);
    });
    
    videoEl.addEventListener('pause', () => {
      if (this.currentlyPlaying && videoEl.currentTime && videoEl.duration) {
        this.progressTracker.saveProgress(this.currentlyPlaying, videoEl.currentTime, videoEl.duration);
      }
    });

    return { metadata: actual.metadata, selectedFile: selected, videoFiles };
  }

  toggleTheaterMode() {
    if (!this.playerContainer) return;
    
    this.playerContainer.classList.toggle('theater-mode');
    const isTheater = this.playerContainer.classList.contains('theater-mode');
    
    if (this.theaterModeBtn) {
      this.theaterModeBtn.textContent = isTheater ? 'Exit Theater' : 'Theater Mode';
    }
    
    this.saveUserPreferences();
    this.showMessage(isTheater ? 'Theater mode enabled' : 'Theater mode disabled', 'info');
  }

  async playRandomVideo() {
    this.showLoading();
    
    try {
      const collections = Object.keys(this.collections).filter(c => c !== 'all_videos');
      const randomCollection = collections[Math.floor(Math.random() * collections.length)];
      const randomPage = Math.floor(Math.random() * 10) + 1;
      
      const data = await this.searchArchive('*', randomPage);
      const docs = data.response.docs.filter(d => d.mediatype !== 'collection');
      
      if (docs.length > 0) {
        const randomVideo = docs[Math.floor(Math.random() * docs.length)];
        const title = this.extractValue(randomVideo.title);
        const creator = this.extractValue(randomVideo.creator);
        
        await this.playVideo(randomVideo.identifier, title, creator);
        this.showMessage('Random video selected!', 'success');
      } else {
        throw new Error('No videos found');
      }
    } catch (err) {
      console.error('Random video failed:', err);
      this.showError('Could not find a random video. Try again!');
    } finally {
      this.hideLoading();
    }
  }

  showBookmarks() {
    this.showMessage('Bookmarks feature coming soon!', 'info');
  }

  updatePlayPauseButton(isPlaying) {
    if (!this.playPauseBtn) return;
    
    const playIcon = this.playPauseBtn.querySelector('.play-icon');
    const pauseIcon = this.playPauseBtn.querySelector('.pause-icon');
    if (isPlaying) {
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = 'block';
    } else {
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
    }
  }

  hasMultipleUniqueVideos(videoFiles) {
    if (videoFiles.length <= 1) return false;
    const baseNames = new Set();
    videoFiles.forEach(f => {
      let bn = f.name
        .replace(/\.[^.]+$/, '')
        .replace(/\.(mp4|webm|ogv|avi|mov|mkv|flv|wmv)$/i, '')
        .replace(/_\d+p$/i, '')
        .replace(/_archive$/i, '')
        .replace(/_512kb$/i, '')
        .replace(/_h264$/i, '');
      baseNames.add(bn);
    });
    return baseNames.size > 1;
  }

  setupPlaylist(id, title, creator, metadata, videoFiles, startIndex = 0) {
    this.displayPlaylistInterface(id, title, creator, metadata, videoFiles, startIndex);
    
    if (startIndex >= 0 && startIndex < videoFiles.length) {
      this.playPlaylistItem(id, title, creator, metadata, videoFiles, startIndex);
    }
  }

  displayPlaylistInterface(id, title, creator, metadata, videoFiles, currentIndex = 0) {
    if (!this.playerInfo) return;
    
    const itemTitle = this.extractValue(metadata?.title) || title;
    let html = `
      <div class="playlist-container">
        <div class="playlist-header">
          <h3>${this.escapeHtml(itemTitle)}</h3>
          <p><strong>By:</strong> ${this.escapeHtml(creator)}</p>
          <p class="playlist-info">${ICONS.tv} ${videoFiles.length} episodes</p>
        </div>
        <div class="playlist-nav">
          <button class="playlist-nav-btn prev-btn" ${currentIndex === 0 ? 'disabled' : ''}>
            <span>←</span>
            <span>Previous</span>
          </button>
          <span class="playlist-current">Episode ${currentIndex + 1} of ${videoFiles.length}</span>
          <button class="playlist-nav-btn next-btn" ${currentIndex === videoFiles.length - 1 ? 'disabled' : ''}>
            <span>Next</span>
            <span>→</span>
          </button>
        </div>
        <div class="episode-list"><div class="episode-grid">`;

    videoFiles.forEach((f, i) => {
      const epTitle = this.getCleanTitle(f.name, itemTitle);
      const dur = this.formatRuntime(f.length) || '';
      const size = f.size ? this.formatFileSize(f.size) : '';
      const active = i === currentIndex ? 'active' : '';
      html += `
        <div class="episode-item ${active}" data-index="${i}">
          <div class="episode-thumb">
            <div class="episode-number">${i + 1}</div>
            ${active ? `<div class="playing-indicator">${ICONS.play}</div>` : ''}
          </div>
          <div class="episode-info">
            <h5>${this.escapeHtml(epTitle)}</h5>
            <div class="episode-meta">${dur ? `${ICONS.clock} ${dur}` : ''} ${size ? `${ICONS.storage} ${size}` : ''}</div>
          </div>
          ${active ? `<div class="episode-playing">${ICONS.play} Playing</div>` : ''}
        </div>`;
    });

    html += `</div></div>`;
    
    const currentFile = videoFiles[currentIndex];
    if (currentFile) {
      html += `<div class="playlist-downloads">
        <h4>${ICONS.download} Download Current Episode</h4>
        <div class="current-episode-download">
          <h5>Now Playing: ${this.escapeHtml(this.getCleanTitle(currentFile.name, itemTitle))}</h5>
          <div class="download-links"></div>
        </div>
        <div class="all-episodes-download">
          <h5>All Episodes</h5>
          <div class="all-download-links"></div>
        </div>
      </div>`;
    }
    
    if (metadata?.description) {
      const desc = this.extractValue(metadata.description);
      if (desc.length > 10) {
        html += `<div class="playlist-description"><h4>About this collection:</h4><div class="playlist-description-content"></div></div>`;
      }
    }
    
    html += `</div>`;
    this.playerInfo.innerHTML = html;
    
    if (currentFile) {
      const downloadLinksElement = this.playerInfo.querySelector('.download-links');
      if (downloadLinksElement) {
        downloadLinksElement.innerHTML = this.createDownloadLinks(id, [currentFile]);
      }
      
      const allDownloadLinksElement = this.playerInfo.querySelector('.all-download-links');
      if (allDownloadLinksElement) {
        allDownloadLinksElement.innerHTML = this.createAllEpisodesDownloadLink(id, videoFiles);
      }
    }
    
    if (metadata?.description) {
      const desc = this.extractValue(metadata.description);
      if (desc.length > 10) {
        const descElement = this.playerInfo.querySelector('.playlist-description-content');
        if (descElement) {
          descElement.innerHTML = this.sanitizeHtml(desc);
        }
      }
    }
    
    this.setupPlaylistControls(id, title, creator, metadata, videoFiles, currentIndex);
  }

  async playPlaylistItem(id, title, creator, metadata, videoFiles, index) {
    const file = videoFiles[index];
    if (!file) return;
    
    this.updateUrl({ video: id, track: String(index + 1) }, true);
    
    this.displayPlaylistInterface(id, title, creator, metadata, videoFiles, index);
    
    if (this.playerContainer) {
      this.playerContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    try {
      await this.loadNativeVideo(id, { metadata, files: videoFiles }, file.name);
    } catch (err) {
      console.error('Error loading playlist item:', err);
      this.markEpisodeAsUnplayable(index);
      
      const nextPlayableIndex = this.findNextPlayableEpisode(videoFiles, index);
      if (nextPlayableIndex !== -1) {
        setTimeout(() => {
          this.playPlaylistItem(id, title, creator, metadata, videoFiles, nextPlayableIndex);
        }, 1000);
      } else {
        this.showError(`Failed to load episode ${index + 1}: ${err.message}`);
      }
    }
  }

  markEpisodeAsUnplayable(index) {
    const episodeItem = this.playerInfo?.querySelector(`[data-index="${index}"]`);
    if (episodeItem) {
      episodeItem.classList.add('unplayable');
      episodeItem.title = 'This video cannot be played directly';
    }
  }

  findNextPlayableEpisode(videoFiles, currentIndex) {
    for (let i = currentIndex + 1; i < videoFiles.length; i++) {
      const episodeItem = this.playerInfo?.querySelector(`[data-index="${i}"]`);
      if (!episodeItem?.classList.contains('unplayable')) {
        return i;
      }
    }
    return -1;
  }

  setupPlaylistControls(id, title, creator, metadata, videoFiles, currentIndex) {
    if (!this.playerInfo) return;
    
    const prevBtn = this.playerInfo.querySelector('.prev-btn');
    const nextBtn = this.playerInfo.querySelector('.next-btn');
    
    this.playerInfo.querySelectorAll('.episode-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index, 10);
        if (idx !== currentIndex && !item.classList.contains('unplayable')) {
          this.playPlaylistItem(id, title, creator, metadata, videoFiles, idx);
        }
      });
    });
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          this.playPlaylistItem(id, title, creator, metadata, videoFiles, currentIndex - 1);
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentIndex < videoFiles.length - 1) {
          this.playPlaylistItem(id, title, creator, metadata, videoFiles, currentIndex + 1);
        }
      });
    }
  }

  getCleanTitle(filename, itemTitle) {
    if (!filename) return 'Untitled';
    let title = filename.replace(/\.[^/.]+$/, '');
    const id = itemTitle?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    if (id && title.toLowerCase().startsWith(id)) title = title.slice(id.length);
    title = title.replace(/^[-_\s]+|[-_\s]+$/g, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    return title || 'Untitled';
  }

  formatFileSize(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + units[i];
  }

  createDownloadLinks(id, videoFiles) {
    if (!videoFiles.length) return '<p>No download options available</p>';
    
    const mp4Files = videoFiles.filter(f => 
      (f.format || '').toLowerCase().includes('mp4') || 
      (f.name || '').toLowerCase().includes('.mp4')
    );
    const otherFiles = videoFiles.filter(f => 
      !((f.format || '').toLowerCase().includes('mp4') || 
      (f.name || '').toLowerCase().includes('.mp4'))
    );
    
    let html = '';
    
    if (mp4Files.length > 0) {
      html += '<div class="download-group"><h5>MP4 (Recommended)</h5>';
      mp4Files.forEach(file => {
        const url = `https://archive.org/download/${id}/${encodeURIComponent(file.name)}`;
        const size = this.formatFileSize(file.size);
        const quality = this.getQualityLabel(file.name);
        html += `
          <a href="${url}" target="_blank" download="${file.name}" class="download-link" title="Download ${file.name}">
            <span class="download-icon">${ICONS.download}</span>
            <span class="download-info">
              <span class="download-quality">${quality}</span>
              ${size ? `<span class="download-size">${size}</span>` : ''}
            </span>
          </a>`;
      });
      html += '</div>';
    }
    
    if (otherFiles.length > 0) {
      html += '<div class="download-group"><h5>Other Formats</h5>';
      otherFiles.forEach(file => {
        const url = `https://archive.org/download/${id}/${encodeURIComponent(file.name)}`;
        const size = this.formatFileSize(file.size);
        const format = this.getFormatLabel(file);
        html += `
          <a href="${url}" target="_blank" download="${file.name}" class="download-link" title="Download ${file.name}">
            <span class="download-icon">${ICONS.download}</span>
            <span class="download-info">
              <span class="download-quality">${format}</span>
              ${size ? `<span class="download-size">${size}</span>` : ''}
            </span>
          </a>`;
      });
      html += '</div>';
    }
    
    html += `
      <div class="download-group">
        <a href="https://archive.org/download/${id}" target="_blank" class="download-link download-all">
          <span class="download-icon">${ICONS.folder}</span>
          <span class="download-info">
            <span class="download-quality">View All Files</span>
            <span class="download-size">Browse complete archive</span>
          </span>
        </a>
      </div>`;
    
    return html;
  }

  createAllEpisodesDownloadLink(id, videoFiles) {
    return `
      <div class="download-group">
        <a href="https://archive.org/download/${id}" 
           target="_blank" 
           class="download-link download-all">
          <span class="download-icon">${ICONS.folder}</span>
          <span class="download-info">
            <span class="download-quality">Download All Episodes</span>
            <span class="download-size">${videoFiles.length} files • View complete archive</span>
          </span>
        </a>
      </div>`;
  }

  getQualityLabel(filename) {
    const name = filename.toLowerCase();
    if (name.includes('1080p') || name.includes('1920x1080')) return 'HD 1080p';
    if (name.includes('720p') || name.includes('1280x720')) return 'HD 720p';
    if (name.includes('480p') || name.includes('854x480')) return 'SD 480p';
    if (name.includes('360p') || name.includes('640x360')) return 'SD 360p';
    if (name.includes('_h264')) return 'H.264';
    if (name.includes('_512kb')) return 'Medium Quality';
    if (name.includes('_archive')) return 'Archive Quality';
    if (name.includes('.mp4')) return 'MP4';
    return 'Standard';
  }

  getFormatLabel(file) {
    const format = (file.format || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    
    if (format.includes('webm') || name.includes('.webm')) return 'WebM';
    if (format.includes('ogv') || name.includes('.ogv')) return 'OGV';
    if (format.includes('avi') || name.includes('.avi')) return 'AVI';
    if (format.includes('mov') || name.includes('.mov')) return 'MOV';
    if (format.includes('mkv') || name.includes('.mkv')) return 'MKV';
    if (format.includes('flv') || name.includes('.flv')) return 'FLV';
    if (format.includes('wmv') || name.includes('.wmv')) return 'WMV';
    
    return format || 'Video';
  }

  async getVideoMetadata(id) {
    const resp = await fetch(`https://archive.org/metadata/${id}`);
    if (!resp.ok) throw new Error(`Failed to fetch metadata: ${resp.statusText}`);
    return resp.json();
  }

  loadIframeVideo(id) {
    const videoWrapper = this.playerContainer?.querySelector('.video-wrapper');
    if (!videoWrapper) return;
    
    videoWrapper.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.className = 'video-player';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.title = 'Video player';
    iframe.src = `https://archive.org/embed/${id}?autoplay=1`;
    videoWrapper.appendChild(iframe);
  }

  getVideoFiles(metadata) {
    const files = metadata.files || (metadata.metadata && metadata.metadata.files) || [];
    
    if (!files.length) return [];
    
    const videoFiles = files.filter(f => {
      const fmt = (f.format || '').toLowerCase();
      const name = (f.name || '').toLowerCase();
      const size = parseInt(f.size || 0);
      
      if (name.includes('thumb') || name.includes('_meta') || 
          name.includes('.xml') || name.includes('.txt') || 
          name.includes('.pdf') || name.includes('.doc') ||
          name.includes('_itemimage') || name.includes('_preview') ||
          fmt.includes('metadata') || fmt.includes('text') || 
          fmt.includes('image')) {
        return false;
      }
      
      const isVideoFormat = fmt.includes('mp4') || fmt.includes('mpeg') || 
                            fmt.includes('video') || fmt.includes('h.264') ||
                            fmt.includes('webm') || fmt.includes('ogv') || 
                            fmt.includes('matroska') || fmt.includes('quicktime') ||
                            fmt.includes('avi') || fmt.includes('mov');
      
      const isVideoExt = name.endsWith('.mp4') || name.endsWith('.avi') || 
                         name.endsWith('.mov') || name.endsWith('.webm') || 
                         name.endsWith('.ogv') || name.endsWith('.flv') ||
                         name.endsWith('.mkv') || name.endsWith('.wmv') || 
                         name.endsWith('.mpg') || name.endsWith('.mpeg');
      
      const isDerivative = name.includes('.mp4') || name.includes('.ogv') || 
                           name.includes('.webm') || name.includes('_512kb') || 
                           name.includes('_archive') || name.includes('_h264');
      
      const hasReasonableSize = size > 100 * 1024;
      
      return (isVideoFormat || isVideoExt || isDerivative) && hasReasonableSize;
    });
    
    return videoFiles.sort((a, b) => {
      const aIsMP4 = (a.name || '').toLowerCase().endsWith('.mp4');
      const bIsMP4 = (b.name || '').toLowerCase().endsWith('.mp4');

      if (aIsMP4 && !bIsMP4) return -1;
      if (!aIsMP4 && bIsMP4) return 1;

      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  selectBestQuality(files) {
    if (!files.length) return null;

    const mp4s = files.filter(f => (f.name || '').toLowerCase().endsWith('.mp4'));

    if (mp4s.length > 0) {
        mp4s.sort((a, b) => (parseInt(b.size) || 0) - (parseInt(a.size) || 0));
        return mp4s[0];
    }
    
    return files[0];
  }

  displaySimpleMetadata(title, creator) {
    if (!this.playerInfo) return;
    
    this.playerInfo.innerHTML = `
      <div class="video-metadata">
        <h3 class="video-metadata__title">${this.escapeHtml(title)}</h3>
        <p class="video-metadata__creator"><strong>By:</strong> ${this.escapeHtml(creator)}</p>
      </div>`;
  }

  displayVideoMetadata(title, creator, metadata, videoFiles) {
    if (!this.playerInfo) return;
    
    const metadataElement = document.createElement('div');
    metadataElement.className = 'video-metadata';
    
    let html = `
      <h3 class="video-metadata__title">${this.escapeHtml(title)}</h3>
      <p class="video-metadata__creator"><strong>By:</strong> ${this.escapeHtml(creator)}</p>`;
      
    if (metadata?.description) {
      html += `<div class="video-metadata__description"></div>`;
    }
    
    if (metadata?.date) html += `<p><strong>Date:</strong> ${this.escapeHtml(this.extractValue(metadata.date))}</p>`;
    if (videoFiles.length > 1) html += `<p><strong>Available qualities:</strong> ${videoFiles.length} versions</p>`;
    
    metadataElement.innerHTML = html;
    
    if (metadata?.description) {
      const descElement = metadataElement.querySelector('.video-metadata__description');
      if (descElement) {
        descElement.innerHTML = this.sanitizeHtml(this.extractValue(metadata.description));
      }
    }
    
    this.playerInfo.innerHTML = metadataElement.outerHTML;
  }

  togglePlayPause() {
    const v = this.playerContainer?.querySelector('video');
    if (v && v.src) {
      v.paused ? v.play() : v.pause();
    }
  }

  shareVideo(id, track = null, title = '') {
    let link = `${window.location.origin}${window.location.pathname}?video=${id}`;
    if (track !== null && track !== undefined) {
      link += `&track=${track + 1}`;
    }
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link)
        .then(() => this.showMessage('Link copied to clipboard!', 'success'))
        .catch(() => this.showShareModal(link));
    } else {
      this.showShareModal(link);
    }
  }

  showShareModal(url) {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;`;
    modal.innerHTML = `
      <div style="background:#222;color:#fff;padding:2rem;border-radius:1rem;max-width:90vw;text-align:center;">
        <h3>Share this video</h3>
        <input value="${url}" readonly style="width:100%;padding:0.5rem;margin:1rem 0;border:none;border-radius:0.5rem;" />
        <button onclick="this.closest('div').parentNode.remove()" style="padding:0.5rem 1rem;border:none;border-radius:0.5rem;cursor:pointer;background:var(--color-accent);color:#fff;">Close</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('input').select();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
  }

  showMessage(msg, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  showError(msg) {
    if (!this.error) return;
    this.error.innerHTML = `<strong>Error:</strong> ${this.escapeHtml(msg)}`;
    this.error.hidden = false;
  }

  hideError() {
    if (this.error) this.error.hidden = true;
  }

  showNoResults() {
    if (!this.results) return;
    this.results.innerHTML = `
      <div class="no-results">
        <h3>No results found</h3>
        <p>Try different search terms or a different collection.</p>
        <p><strong>Search:</strong> "${this.escapeHtml(this.currentQuery)}"</p>
        <p><strong>Collection:</strong> ${this.getCollectionDisplayName()}</p>
      </div>`;
  }

  showFallbackMessage() {
    if (!this.results) return;
    this.results.innerHTML = `
      <div class="fallback-message">
        <h3>Search temporarily unavailable</h3>
        <p>Archive.org may be experiencing issues. Please try again shortly.</p>
      </div>`;
  }

  showLoading() {
    if (!this.loading) return;
    this.loading.hidden = false;
    this.loading.style.display = 'flex';
    if (this.searchBtn) {
      this.searchBtn.disabled = true;
      this.searchBtn.innerHTML = `
        <svg class="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Searching...
      `;
    }
  }

  hideLoading() {
    if (!this.loading) return;
    this.loading.hidden = true;
    this.loading.style.display = 'none';
    if (this.searchBtn) {
      this.searchBtn.disabled = false;
      this.searchBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Search
      `;
    }
  }

  hidePlayer() {
    if (!this.playerContainer) return;
    
    this.playerContainer.classList.remove('visible');
    this.playerContainer.setAttribute('aria-hidden', 'true');
    this.currentlyPlaying = null;
    
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    
    const videoWrapper = this.playerContainer.querySelector('.video-wrapper');
    if (videoWrapper) {
      videoWrapper.innerHTML = `<div class="player-loader" style="display: none;"><div class="loading-spinner"><div class="spinner-ring"></div></div></div>`;
    }
    
    if (this.playerInfo) this.playerInfo.innerHTML = '';
    this.updatePlayPauseButton(false);
  }

  updateUrl(params = {}, usePushState = false) {
    const url = new URL(window.location);
    url.search = '';
    Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
    
    if (usePushState) {
      window.history.pushState({}, '', url);
    } else {
      window.history.replaceState({}, '', url);
    }
  }

  clearAllFilters() {
    if (this.collection) this.collection.value = 'all_videos';
    if (this.sortBy) this.sortBy.value = 'downloads';
    if (this.searchInput) this.searchInput.value = '';
    if (this.publicDomain) this.publicDomain.checked = false;
    if (this.collectionsOnly) this.collectionsOnly.checked = false;
    this.currentPage = 1;
    if (this.results) this.results.innerHTML = '';
    if (this.pagination) this.pagination.innerHTML = '';
    if (this.searchStats) this.searchStats.innerHTML = 'Ready to search...';
    window.history.pushState({}, '', window.location.pathname);
  }

  goHome() {
    // Reset all filters
    if (this.collection) this.collection.value = 'all_videos';
    if (this.sortBy) this.sortBy.value = 'downloads';
    if (this.searchInput) {
      this.searchInput.value = '';
      if (this.clearSearchBtn) this.clearSearchBtn.style.display = 'none';
    }
    if (this.publicDomain) this.publicDomain.checked = false;
    if (this.collectionsOnly) this.collectionsOnly.checked = false;
    
    // Reset state
    this.currentPage = 1;
    this.currentQuery = '';
    
    // Hide player if showing
    this.hidePlayer();
    
    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
    
    // Update page title
    this.updatePageTitle();
    
    // Show recommended section if available
    if (this.recommendedManager && !this.recommendedManager.isHidden) {
      this.recommendedManager.show();
    }
    
    // Perform fresh search
    this.performSearch();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Close mobile menu if open
    this.closeMobileMenu();
  }

  updatePagination(numFound) {
    if (!this.pagination) return;
    
    const totalPages = Math.ceil(numFound / 24);
    if (totalPages <= 1) {
      this.pagination.innerHTML = '';
      return;
    }

    let html = '';
    if (this.currentPage > 1) {
      html += `<button data-page="${this.currentPage - 1}">← Previous</button>`;
    }
    
    if (this.currentPage > 3) {
      html += `<button data-page="1">1</button>`;
      if (this.currentPage > 4) html += `<span>...</span>`;
    }
    
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) {
      html += `<button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (this.currentPage < totalPages - 2) {
      if (this.currentPage < totalPages - 3) html += `<span>...</span>`;
      html += `<button data-page="${totalPages}">${totalPages}</button>`;
    }
    
    if (this.currentPage < totalPages) {
      html += `<button data-page="${this.currentPage + 1}">Next →</button>`;
    }
    
    this.pagination.innerHTML = html;
    this.pagination.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page, 10);
        this.performSearch();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  updateStats(numFound) {
    if (!this.searchStats) return;
    
    if (!numFound) {
      this.searchStats.innerHTML = 'No results found';
      return;
    }
    const start = (this.currentPage - 1) * 24 + 1;
    const end = Math.min(this.currentPage * 24, numFound);
    this.searchStats.innerHTML = `
      Results ${start.toLocaleString()}–${end.toLocaleString()} of ${numFound.toLocaleString()}<br>
      Collection: ${this.getCollectionDisplayName()}`;
  }

  getCollectionDisplayName() {
    const value = this.collection?.value || 'all_videos';
    return this.collections[value] || 'Unknown Collection';
  }

  extractValue(field) {
    return Array.isArray(field) ? field[0] : field;
  }

  formatRuntime(runtime) {
    if (!runtime) return '';
    const s = runtime.toString();
    if (s.includes(':')) return s;
    const secs = parseInt(s, 10);
    if (isNaN(secs)) return '';
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    if (mins < 60) {
      return `${mins}:${remSecs.toString().padStart(2, '0')}`;
    } else {
      const hrs = Math.floor(mins / 60);
      const remM = mins % 60;
      return `${hrs}:${remM.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  sanitizeHtml(html) {
    if (!html) return '';
    
    try {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      const scripts = temp.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      const allElements = temp.querySelectorAll('*');
      allElements.forEach(el => {
        const attributes = [...el.attributes];
        attributes.forEach(attr => {
          if (attr.name.startsWith('on') || attr.name === 'javascript:') {
            el.removeAttribute(attr.name);
          }
        });
        
        if (el.tagName === 'A' && el.getAttribute('href')) {
          const href = el.getAttribute('href');
          if (href.startsWith('javascript:') || href.startsWith('data:')) {
            el.removeAttribute('href');
          } else if (!href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#')) {
            if (!href.includes('://')) {
              el.setAttribute('href', `https://archive.org${href.startsWith('/') ? '' : '/'}${href}`);
            }
          }
          if (el.getAttribute('href') && el.getAttribute('href').startsWith('http')) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }
      });
      
      return temp.innerHTML;
    } catch (err) {
      console.error('Error sanitizing HTML:', err);
      return this.escapeHtml(html);
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.archiveSearch = new ArchiveVideoSearch();
    console.log('Application loaded successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
      position: fixed; top: 20px; left: 20px; right: 20px; 
      background: #ff4444; color: white; padding: 1rem; 
      border-radius: 8px; z-index: 10000;
    `;
    errorMessage.innerHTML = `
      <strong>Application Error:</strong> Failed to load. Please refresh the page.
      <button onclick="location.reload()" style="margin-left: 1rem; padding: 0.5rem; background: white; color: #ff4444; border: none; border-radius: 4px; cursor: pointer;">Refresh</button>
    `;
    document.body.appendChild(errorMessage);
  }
});

export default ArchiveVideoSearch;