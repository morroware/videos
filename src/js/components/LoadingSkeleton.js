/**
 * LoadingSkeleton Component
 * Creates placeholder loading states for better UX
 */

export class LoadingSkeleton {
  /**
   * Create a video card skeleton
   */
  static createCardSkeleton() {
    return `
      <article class="result-card skeleton-card">
        <div class="result-thumbnail skeleton-thumbnail">
          <div class="skeleton-shimmer"></div>
        </div>
        <div class="result-content">
          <div class="skeleton-title skeleton-shimmer"></div>
          <div class="skeleton-meta">
            <div class="skeleton-text skeleton-shimmer"></div>
            <div class="skeleton-text skeleton-shimmer" style="width: 60%;"></div>
          </div>
          <div class="skeleton-actions">
            <div class="skeleton-button skeleton-shimmer"></div>
            <div class="skeleton-button skeleton-shimmer" style="width: 25%;"></div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Create multiple card skeletons
   */
  static createGridSkeleton(count = 8) {
    return Array(count).fill(LoadingSkeleton.createCardSkeleton()).join('');
  }

  /**
   * Create a recommended card skeleton
   */
  static createRecommendedSkeleton() {
    return `
      <article class="recommended-card skeleton-card">
        <div class="recommended-card-thumb skeleton-thumbnail">
          <div class="skeleton-shimmer"></div>
        </div>
        <div class="recommended-card-content">
          <div class="skeleton-title-sm skeleton-shimmer"></div>
          <div class="skeleton-text-sm skeleton-shimmer"></div>
        </div>
      </article>
    `;
  }

  /**
   * Create multiple recommended skeletons
   */
  static createRecommendedGridSkeleton(count = 6) {
    return Array(count).fill(LoadingSkeleton.createRecommendedSkeleton()).join('');
  }

  /**
   * Show skeleton in container
   */
  static showIn(container, type = 'grid', count = 8) {
    if (!container) return;

    let skeletonHtml;
    switch (type) {
      case 'recommended':
        skeletonHtml = LoadingSkeleton.createRecommendedGridSkeleton(count);
        break;
      case 'grid':
      default:
        skeletonHtml = LoadingSkeleton.createGridSkeleton(count);
        break;
    }

    container.innerHTML = skeletonHtml;
    container.classList.add('skeleton-loading');
  }

  /**
   * Hide skeleton from container
   */
  static hideFrom(container) {
    if (!container) return;
    container.classList.remove('skeleton-loading');
  }
}

export default LoadingSkeleton;
