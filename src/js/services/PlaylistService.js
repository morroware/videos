/**
 * PlaylistService
 * Handles multi-episode video collections and playlist navigation
 */

import { ICONS } from '../utils/icons.js';
import { escapeHtml, sanitizeHtml, extractValue, formatRuntime, formatFileSize } from '../utils/helpers.js';

export class PlaylistService {
  constructor(videoService) {
    this.videoService = videoService;
    this.currentPlaylist = null;
    this.currentIndex = 0;
  }

  /**
   * Check if we have a multi-video playlist
   */
  isPlaylist(videoFiles) {
    return this.videoService.hasMultipleUniqueVideos(videoFiles);
  }

  /**
   * Initialize playlist with video files
   */
  initPlaylist(id, title, creator, metadata, videoFiles, startIndex = 0) {
    this.currentPlaylist = {
      id,
      title,
      creator,
      metadata,
      videoFiles,
      currentIndex: startIndex
    };
    this.currentIndex = startIndex;
    return this.currentPlaylist;
  }

  /**
   * Get current playlist state
   */
  getPlaylist() {
    return this.currentPlaylist;
  }

  /**
   * Get current index
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Set current index
   */
  setCurrentIndex(index) {
    this.currentIndex = index;
    if (this.currentPlaylist) {
      this.currentPlaylist.currentIndex = index;
    }
  }

  /**
   * Has previous episode
   */
  hasPrevious() {
    return this.currentIndex > 0;
  }

  /**
   * Has next episode
   */
  hasNext() {
    if (!this.currentPlaylist) return false;
    return this.currentIndex < this.currentPlaylist.videoFiles.length - 1;
  }

  /**
   * Go to previous episode
   */
  previous() {
    if (this.hasPrevious()) {
      this.currentIndex--;
      if (this.currentPlaylist) {
        this.currentPlaylist.currentIndex = this.currentIndex;
      }
      return this.currentIndex;
    }
    return -1;
  }

  /**
   * Go to next episode
   */
  next() {
    if (this.hasNext()) {
      this.currentIndex++;
      if (this.currentPlaylist) {
        this.currentPlaylist.currentIndex = this.currentIndex;
      }
      return this.currentIndex;
    }
    return -1;
  }

  /**
   * Go to specific episode
   */
  goToEpisode(index) {
    if (!this.currentPlaylist) return -1;
    if (index >= 0 && index < this.currentPlaylist.videoFiles.length) {
      this.currentIndex = index;
      this.currentPlaylist.currentIndex = index;
      return this.currentIndex;
    }
    return -1;
  }

  /**
   * Find next playable episode after a failed one
   */
  findNextPlayable(unplayableIndices = new Set()) {
    if (!this.currentPlaylist) return -1;
    for (let i = this.currentIndex + 1; i < this.currentPlaylist.videoFiles.length; i++) {
      if (!unplayableIndices.has(i)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Clear playlist
   */
  clearPlaylist() {
    this.currentPlaylist = null;
    this.currentIndex = 0;
  }

  /**
   * Get current file
   */
  getCurrentFile() {
    if (!this.currentPlaylist) return null;
    return this.currentPlaylist.videoFiles[this.currentIndex];
  }

  /**
   * Generate playlist interface HTML
   */
  generatePlaylistHTML(currentIndex = 0) {
    if (!this.currentPlaylist) return '';

    const { id, title, creator, metadata, videoFiles } = this.currentPlaylist;
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
            <span>&larr;</span>
            <span>Previous</span>
          </button>
          <span class="playlist-current">Episode ${currentIndex + 1} of ${videoFiles.length}</span>
          <button class="playlist-nav-btn next-btn" ${currentIndex === videoFiles.length - 1 ? 'disabled' : ''}>
            <span>Next</span>
            <span>&rarr;</span>
          </button>
        </div>
        <div class="episode-list"><div class="episode-grid">`;

    videoFiles.forEach((f, i) => {
      const epTitle = this.videoService.getCleanTitle(f.name, itemTitle);
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

    // Download section
    const currentFile = videoFiles[currentIndex];
    if (currentFile) {
      html += `<div class="playlist-downloads">
        <h4>${ICONS.download} Download Current Episode</h4>
        <div class="current-episode-download">
          <h5>Now Playing: ${escapeHtml(this.videoService.getCleanTitle(currentFile.name, itemTitle))}</h5>
          <div class="download-links">${this.createDownloadLinks(id, [currentFile])}</div>
        </div>
        <div class="all-episodes-download">
          <h5>All Episodes</h5>
          <div class="all-download-links">${this.createAllEpisodesDownloadLink(id, videoFiles)}</div>
        </div>
      </div>`;
    }

    // Description
    if (metadata?.description) {
      const desc = extractValue(metadata.description);
      if (desc.length > 10) {
        html += `<div class="playlist-description"><h4>About this collection:</h4><div class="playlist-description-content">${sanitizeHtml(desc)}</div></div>`;
      }
    }

    html += `</div>`;
    return html;
  }

  /**
   * Create download links HTML for video files
   */
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
        const quality = this.videoService.getQualityLabel(file.name);
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
        const format = this.videoService.getFormatLabel(file);
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

  /**
   * Create download link for all episodes
   */
  createAllEpisodesDownloadLink(id, videoFiles) {
    return `
      <div class="download-group">
        <a href="https://archive.org/download/${id}"
           target="_blank"
           class="download-link download-all">
          <span class="download-icon">${ICONS.folder}</span>
          <span class="download-info">
            <span class="download-quality">Download All Episodes</span>
            <span class="download-size">${videoFiles.length} files &bull; View complete archive</span>
          </span>
        </a>
      </div>`;
  }
}

export default PlaylistService;
