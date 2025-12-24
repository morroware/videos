/**
 * BookmarkManager Service
 * Manages user's bookmarked/favorite videos
 */

import { CONFIG } from '../config.js';
import { safeParseJSON, extractValue } from '../utils/helpers.js';

export class BookmarkManager {
  constructor() {
    this.bookmarks = safeParseJSON(localStorage.getItem('bookmarks')) || [];
  }

  add(video) {
    if (this.isBookmarked(video.identifier)) return false;

    const bookmark = {
      id: video.identifier,
      title: extractValue(video.title),
      creator: extractValue(video.creator),
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

  clear() {
    this.bookmarks = [];
    this.save();
  }
}

export default BookmarkManager;
