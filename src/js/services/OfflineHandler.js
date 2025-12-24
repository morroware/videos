/**
 * OfflineHandler Service
 * Monitors network status and handles offline/online transitions
 */

import { ICONS } from '../utils/icons.js';

export class OfflineHandler {
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

export default OfflineHandler;
