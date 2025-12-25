/**
 * ArchiveVideoSearch - Enhanced Version with Modular Architecture
 * Version: 2.0.0
 * Refactored to use ES6 modules
 */

// Import configuration
import { CONFIG, COLLECTIONS } from './src/js/config.js';

// Import utilities
import { ICONS } from './src/js/utils/icons.js';
import {
  safeParseJSON,
  escapeHtml,
  sanitizeHtml,
  extractValue,
  formatRuntime,
  formatTime,
  formatFileSize
} from './src/js/utils/helpers.js';

// Import services
import { SearchCache } from './src/js/services/SearchCache.js';
import { VideoProgressTracker } from './src/js/services/VideoProgressTracker.js';
import { BookmarkManager } from './src/js/services/BookmarkManager.js';
import { OfflineHandler } from './src/js/services/OfflineHandler.js';

// Import components
import { SearchSuggestions } from './src/js/components/SearchSuggestions.js';
import { RecommendedManager } from './src/js/components/RecommendedManager.js';
import { Toast } from './src/js/components/Toast.js';
import { LoadingSkeleton } from './src/js/components/LoadingSkeleton.js';

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

    // Use imported COLLECTIONS
    this.collections = COLLECTIONS;

    // Utility instances
    this.progressTracker = new VideoProgressTracker();
    this.searchCache = new SearchCache();
    this.bookmarkManager = new BookmarkManager();
    this.offlineHandler = new OfflineHandler();
    this.toast = new Toast();
    this.loadingSkeleton = new LoadingSkeleton();

    // User preferences
    this.userPreferences = safeParseJSON(localStorage.getItem('userPrefs')) || {};

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
    const title = extractValue(item.title) || 'Untitled';
    const desc = extractValue(item.description) || '';
    const snippet = desc.length > 120 ? desc.slice(0, 120) + '...' : desc;
    const creator = extractValue(item.creator) || 'Unknown';
    const date = extractValue(item.date) ? new Date(extractValue(item.date)).toLocaleDateString() : '';
    const downloads = Number(item.downloads || 0).toLocaleString();
    const runtime = formatRuntime(item.runtime);
    const href = `https://archive.org/details/${item.identifier}`;
    const thumbUrl = `https://archive.org/services/img/${item.identifier}`;
    const license = extractValue(item.licenseurl) || '';
    const subject = extractValue(item.subject) || '';
    const isPD = license.includes('publicdomain') || subject.toLowerCase().includes('public domain');
    const mediatype = extractValue(item.mediatype) || 'movies';
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
               alt="Thumbnail for ${escapeHtml(title)}"
               class="result-thumb"
               loading="lazy"
               onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=thumb-placeholder>${placeholderIcon}</div>'"/>
          ${runtime && mediatype !== 'collection' ? `<span class="runtime-badge">${runtime}</span>` : ''}
          ${isPD ? `<span class="license-badge">Public Domain</span>` : ''}
          ${progressBar}
        </div>
        <div class="result-content">
          <div class="result-header">
            <h3 class="result-title">${escapeHtml(title)}</h3>
            <div class="result-meta">
              <span class="result-creator"><span class="meta-icon">${ICONS.user}</span> ${escapeHtml(creator)}</span>
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
          if (confirm(`Resume from ${formatTime(progress.currentTime)}?`)) {
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
        const title = extractValue(randomVideo.title);
        const creator = extractValue(randomVideo.creator);

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

    const itemTitle = extractValue(metadata?.title) || title;
    let html = `
      <div class="playlist-container">
        <div class="playlist-header">
          <h3>${escapeHtml(itemTitle)}</h3>
          <p><strong>By:</strong> ${escapeHtml(creator)}</p>
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
      const dur = formatRuntime(f.length) || '';
      const size = f.size ? formatFileSize(f.size) : '';
      const active = i === currentIndex ? 'active' : '';
      html += `
        <div class="episode-item ${active}" data-index="${i}">
          <div class="episode-thumb">
            <div class="episode-number">${i + 1}</div>
            ${active ? `<div class="playing-indicator">${ICONS.play}</div>` : ''}
          </div>
          <div class="episode-info">
            <h5>${escapeHtml(epTitle)}</h5>
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
          <h5>Now Playing: ${escapeHtml(this.getCleanTitle(currentFile.name, itemTitle))}</h5>
          <div class="download-links"></div>
        </div>
        <div class="all-episodes-download">
          <h5>All Episodes</h5>
          <div class="all-download-links"></div>
        </div>
      </div>`;
    }

    if (metadata?.description) {
      const desc = extractValue(metadata.description);
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
      const desc = extractValue(metadata.description);
      if (desc.length > 10) {
        const descElement = this.playerInfo.querySelector('.playlist-description-content');
        if (descElement) {
          descElement.innerHTML = sanitizeHtml(desc);
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
        const size = formatFileSize(file.size);
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
        const size = formatFileSize(file.size);
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
        <h3 class="video-metadata__title">${escapeHtml(title)}</h3>
        <p class="video-metadata__creator"><strong>By:</strong> ${escapeHtml(creator)}</p>
      </div>`;
  }

  displayVideoMetadata(title, creator, metadata, videoFiles) {
    if (!this.playerInfo) return;

    const metadataElement = document.createElement('div');
    metadataElement.className = 'video-metadata';

    let html = `
      <h3 class="video-metadata__title">${escapeHtml(title)}</h3>
      <p class="video-metadata__creator"><strong>By:</strong> ${escapeHtml(creator)}</p>`;

    if (metadata?.description) {
      html += `<div class="video-metadata__description"></div>`;
    }

    if (metadata?.date) html += `<p><strong>Date:</strong> ${escapeHtml(extractValue(metadata.date))}</p>`;
    if (videoFiles.length > 1) html += `<p><strong>Available qualities:</strong> ${videoFiles.length} versions</p>`;

    metadataElement.innerHTML = html;

    if (metadata?.description) {
      const descElement = metadataElement.querySelector('.video-metadata__description');
      if (descElement) {
        descElement.innerHTML = sanitizeHtml(extractValue(metadata.description));
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
    this.toast.show(msg, type, duration);
  }

  showError(msg) {
    if (!this.error) return;
    this.error.innerHTML = `<strong>Error:</strong> ${escapeHtml(msg)}`;
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
        <p><strong>Search:</strong> "${escapeHtml(this.currentQuery)}"</p>
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
    if (this.collection) this.collection.value = 'all_videos';
    if (this.sortBy) this.sortBy.value = 'downloads';
    if (this.searchInput) {
      this.searchInput.value = '';
      if (this.clearSearchBtn) this.clearSearchBtn.style.display = 'none';
    }
    if (this.publicDomain) this.publicDomain.checked = false;
    if (this.collectionsOnly) this.collectionsOnly.checked = false;

    this.currentPage = 1;
    this.currentQuery = '';

    this.hidePlayer();

    window.history.pushState({}, '', window.location.pathname);

    this.updatePageTitle();

    if (this.recommendedManager && !this.recommendedManager.isHidden) {
      this.recommendedManager.show();
    }

    this.performSearch();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.closeMobileMenu();
  }

  updatePagination(numFound) {
    if (!this.pagination) return;

    const totalPages = Math.ceil(numFound / CONFIG.ITEMS_PER_PAGE);
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
    const start = (this.currentPage - 1) * CONFIG.ITEMS_PER_PAGE + 1;
    const end = Math.min(this.currentPage * CONFIG.ITEMS_PER_PAGE, numFound);
    this.searchStats.innerHTML = `
      Results ${start.toLocaleString()}–${end.toLocaleString()} of ${numFound.toLocaleString()}<br>
      Collection: ${this.getCollectionDisplayName()}`;
  }

  getCollectionDisplayName() {
    const value = this.collection?.value || 'all_videos';
    return this.collections[value] || 'Unknown Collection';
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
