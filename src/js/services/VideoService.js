/**
 * VideoService
 * Handles video playback, loading, metadata, and file selection
 */

import { CONFIG } from '../config.js';
import { formatFileSize } from '../utils/helpers.js';

export class VideoService {
  constructor() {
    this.currentlyPlaying = null;
    this.videoControls = null;
  }

  /**
   * Get video metadata from Archive.org
   */
  async getVideoMetadata(id) {
    const resp = await fetch(`https://archive.org/metadata/${id}`);
    if (!resp.ok) throw new Error(`Failed to fetch metadata: ${resp.statusText}`);
    return resp.json();
  }

  /**
   * Get video files from metadata, filtering and sorting for playable files
   */
  getVideoFiles(metadata) {
    const files = metadata.files || (metadata.metadata && metadata.metadata.files) || [];

    if (!files.length) return [];

    const videoFiles = files.filter(f => {
      const fmt = (f.format || '').toLowerCase();
      const name = (f.name || '').toLowerCase();
      const size = parseInt(f.size || 0);

      // Skip non-video files
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

  /**
   * Select the best quality video file from available options
   */
  selectBestQuality(files) {
    if (!files.length) return null;

    const mp4s = files.filter(f => (f.name || '').toLowerCase().endsWith('.mp4'));

    if (mp4s.length > 0) {
      mp4s.sort((a, b) => (parseInt(b.size) || 0) - (parseInt(a.size) || 0));
      return mp4s[0];
    }

    return files[0];
  }

  /**
   * Check if there are multiple unique videos (not just quality variants)
   */
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

  /**
   * Load a native HTML5 video element
   */
  async loadNativeVideo(id, metadata, videoWrapper, specificFileName = null, userVolume = 1) {
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

    if (userVolume !== undefined) {
      videoEl.volume = userVolume;
    }

    return { metadata: actual.metadata, selectedFile: selected, videoFiles, videoElement: videoEl };
  }

  /**
   * Load video using Archive.org iframe embed (fallback)
   */
  loadIframeVideo(id, videoWrapper) {
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

  /**
   * Get quality label from filename
   */
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

  /**
   * Get format label from file
   */
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

  /**
   * Get clean title from filename
   */
  getCleanTitle(filename, itemTitle) {
    if (!filename) return 'Untitled';
    let title = filename.replace(/\.[^/.]+$/, '');
    const id = itemTitle?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    if (id && title.toLowerCase().startsWith(id)) title = title.slice(id.length);
    title = title.replace(/^[-_\s]+|[-_\s]+$/g, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    return title || 'Untitled';
  }

  /**
   * Build video URL for a specific file
   */
  getVideoUrl(id, fileName) {
    return `https://archive.org/download/${id}/${encodeURIComponent(fileName)}`;
  }

  /**
   * Get currently playing video ID
   */
  getCurrentlyPlaying() {
    return this.currentlyPlaying;
  }

  /**
   * Set currently playing video ID
   */
  setCurrentlyPlaying(id) {
    this.currentlyPlaying = id;
  }

  /**
   * Get video controls reference
   */
  getVideoControls() {
    return this.videoControls;
  }

  /**
   * Toggle play/pause on current video
   */
  togglePlayPause(playerContainer) {
    const v = playerContainer?.querySelector('video');
    if (v && v.src) {
      v.paused ? v.play() : v.pause();
    }
  }
}

export default VideoService;
