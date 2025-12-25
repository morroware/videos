<?php
/**
 * Archive Film Club - Admin Panel
 * Manage recommended/featured videos
 */

// Simple password protection (change this!)
$ADMIN_PASSWORD = 'filmclub2024';

session_start();

// Handle login
if (isset($_POST['password'])) {
    if ($_POST['password'] === $ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
    } else {
        $login_error = 'Invalid password';
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// Check if logged in
$is_logged_in = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

// Load current recommendations
$recommendations_file = __DIR__ . '/recommendations.json';
$current_recommendations = [];
if (file_exists($recommendations_file)) {
    $content = file_get_contents($recommendations_file);
    $data = json_decode($content, true);
    if ($data && isset($data['videos'])) {
        $current_recommendations = $data['videos'];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Archive Film Club</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Toast Notifications */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .toast {
            padding: 14px 20px;
            border-radius: 8px;
            color: #fff;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            min-width: 280px;
        }

        .toast.success { background: #10b981; }
        .toast.error { background: #ef4444; }
        .toast.info { background: #3b82f6; }
        .toast.warning { background: #f59e0b; }

        .toast-close {
            margin-left: auto;
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            opacity: 0.7;
            font-size: 18px;
        }

        .toast-close:hover { opacity: 1; }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        /* Unsaved Changes Indicator */
        .unsaved-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            color: #f59e0b;
            font-size: 13px;
        }

        .unsaved-indicator.visible { display: flex; }

        .unsaved-dot {
            width: 8px;
            height: 8px;
            background: #f59e0b;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        /* Keyboard Shortcuts Help */
        .shortcuts-help {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 12px;
            color: #888;
            z-index: 100;
        }

        .shortcuts-help kbd {
            background: #333;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            margin-right: 4px;
        }

        /* Drag and Drop Styles */
        .selected-item {
            cursor: grab;
        }

        .selected-item.dragging {
            opacity: 0.5;
            cursor: grabbing;
        }

        .selected-item.drag-over {
            border: 2px dashed #3b82f6;
            background: rgba(59, 130, 246, 0.1);
        }

        .drag-handle {
            color: #666;
            cursor: grab;
            padding: 4px;
            font-size: 16px;
        }

        .drag-handle:hover { color: #888; }

        /* Video Preview Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .modal-overlay.visible { display: flex; }

        .modal {
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #333;
        }

        .modal-header h3 { font-size: 18px; }

        .modal-close {
            background: none;
            border: none;
            color: #888;
            font-size: 24px;
            cursor: pointer;
        }

        .modal-close:hover { color: #fff; }

        .modal-body { padding: 20px; }

        .preview-thumb {
            width: 100%;
            aspect-ratio: 16/9;
            background: #272727;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
        }

        .preview-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .preview-info { margin-bottom: 20px; }

        .preview-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .preview-meta {
            color: #888;
            font-size: 14px;
        }

        .preview-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #3b82f6;
            text-decoration: none;
            font-size: 14px;
            margin-top: 12px;
        }

        .preview-link:hover { text-decoration: underline; }

        .modal-actions {
            display: flex;
            gap: 12px;
            padding: 20px;
            border-top: 1px solid #333;
        }

        .modal-actions .btn { flex: 1; justify-content: center; }

        /* Filter Bar */
        .filter-bar {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .filter-bar select {
            padding: 8px 12px;
            background: #272727;
            border: 1px solid #333;
            border-radius: 6px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
        }

        .filter-bar select:focus {
            outline: none;
            border-color: #3b82f6;
        }

        .results-count {
            color: #888;
            font-size: 14px;
            margin-bottom: 12px;
        }
        
        /* Login Form */
        .login-container {
            max-width: 400px;
            margin: 100px auto;
            background: #1a1a1a;
            padding: 40px;
            border-radius: 12px;
            border: 1px solid #333;
        }
        
        .login-container h1 {
            margin-bottom: 30px;
            text-align: center;
            color: #f59e0b;
        }
        
        .login-container input {
            width: 100%;
            padding: 12px 16px;
            margin-bottom: 16px;
            background: #272727;
            border: 1px solid #333;
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
        }
        
        .login-container button {
            width: 100%;
            padding: 12px;
            background: #f59e0b;
            border: none;
            border-radius: 8px;
            color: #000;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .login-container button:hover {
            background: #d97706;
        }
        
        .login-error {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid #ef4444;
            color: #ef4444;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
        }
        
        /* Header */
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
        }
        
        .admin-header h1 {
            color: #f59e0b;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: #3b82f6;
            color: #fff;
        }
        
        .btn-primary:hover {
            background: #2563eb;
        }
        
        .btn-success {
            background: #10b981;
            color: #fff;
        }
        
        .btn-success:hover {
            background: #059669;
        }
        
        .btn-danger {
            background: #ef4444;
            color: #fff;
        }
        
        .btn-danger:hover {
            background: #dc2626;
        }
        
        .btn-secondary {
            background: #374151;
            color: #fff;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
        }
        
        /* Layout */
        .admin-layout {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 30px;
        }
        
        @media (max-width: 1024px) {
            .admin-layout {
                grid-template-columns: 1fr;
            }
        }
        
        /* Search Section */
        .search-section {
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            padding: 20px;
        }
        
        .search-section h2 {
            margin-bottom: 20px;
            font-size: 18px;
            color: #aaa;
        }
        
        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .search-box input {
            flex: 1;
            padding: 12px 16px;
            background: #272727;
            border: 1px solid #333;
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
        }
        
        .search-box input:focus {
            outline: none;
            border-color: #3b82f6;
        }
        
        /* Results Grid */
        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }
        
        .video-card {
            background: #272727;
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        
        .video-card:hover {
            transform: translateY(-4px);
            border-color: #3b82f6;
        }
        
        .video-card.selected {
            border-color: #10b981;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        
        .video-card-thumb {
            position: relative;
            aspect-ratio: 16/9;
            background: #1a1a1a;
        }
        
        .video-card-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .video-card-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #10b981;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .video-card-content {
            padding: 12px;
        }
        
        .video-card-title {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .video-card-meta {
            font-size: 12px;
            color: #888;
        }
        
        /* Selected Videos Panel */
        .selected-section {
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            padding: 20px;
            position: sticky;
            top: 20px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
        }
        
        .selected-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .selected-header h2 {
            font-size: 18px;
            color: #10b981;
        }
        
        .selected-count {
            background: #10b981;
            color: #fff;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .selected-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .selected-item {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #272727;
            padding: 10px;
            border-radius: 8px;
            cursor: grab;
            transition: all 0.2s;
            border: 2px solid transparent;
        }

        .selected-item:active { cursor: grabbing; }
        
        .selected-item-thumb {
            width: 80px;
            height: 45px;
            border-radius: 4px;
            overflow: hidden;
            flex-shrink: 0;
        }
        
        .selected-item-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .selected-item-info {
            flex: 1;
            min-width: 0;
        }
        
        .selected-item-title {
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .selected-item-id {
            font-size: 11px;
            color: #666;
        }
        
        .selected-item-remove {
            background: transparent;
            border: none;
            color: #ef4444;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            font-size: 18px;
        }
        
        .selected-item-remove:hover {
            background: rgba(239, 68, 68, 0.2);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #666;
        }
        
        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        /* Save Status */
        .save-status {
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
            text-align: center;
            font-weight: 500;
        }
        
        .save-status.success {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid #10b981;
        }
        
        .save-status.error {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid #ef4444;
        }
        
        /* Loading */
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Pagination */
        .pagination {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
        }
        
        .pagination button {
            padding: 8px 16px;
            background: #272727;
            border: 1px solid #333;
            border-radius: 6px;
            color: #fff;
            cursor: pointer;
        }
        
        .pagination button:hover {
            background: #333;
        }
        
        .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Title Editor */
        .title-editor {
            margin-bottom: 20px;
        }
        
        .title-editor label {
            display: block;
            margin-bottom: 8px;
            color: #888;
            font-size: 14px;
        }
        
        .title-editor input {
            width: 100%;
            padding: 10px 14px;
            background: #272727;
            border: 1px solid #333;
            border-radius: 6px;
            color: #fff;
            font-size: 14px;
        }
        
        /* Toggle */
        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            background: #272727;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        
        .toggle-label {
            font-size: 14px;
        }
        
        .toggle {
            position: relative;
            width: 50px;
            height: 26px;
        }
        
        .toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            inset: 0;
            background: #374151;
            border-radius: 26px;
            transition: 0.3s;
        }
        
        .toggle-slider::before {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background: #fff;
            border-radius: 50%;
            transition: 0.3s;
        }
        
        .toggle input:checked + .toggle-slider {
            background: #10b981;
        }
        
        .toggle input:checked + .toggle-slider::before {
            transform: translateX(24px);
        }

        /* View Site Link */
        .view-site-link {
            color: #3b82f6;
            text-decoration: none;
            font-size: 14px;
        }

        .view-site-link:hover {
            text-decoration: underline;
        }

        /* Video Card Preview Button */
        .video-card-preview {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.8);
            border: none;
            color: #fff;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .video-card:hover .video-card-preview { opacity: 1; }
        .video-card-preview:hover { background: rgba(59, 130, 246, 0.9); }

        /* Selected Header Actions */
        .selected-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
        }

        /* Search Input Container */
        .search-input-container {
            position: relative;
            flex: 1;
        }

        .search-input-container .search-spinner {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            border: 2px solid #333;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: none;
        }

        .search-input-container.loading .search-spinner { display: block; }

        /* Bulk selection */
        .select-all-btn {
            background: transparent;
            border: 1px solid #333;
            color: #888;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .select-all-btn:hover {
            border-color: #3b82f6;
            color: #3b82f6;
        }
    </style>
</head>
<body>
    <!-- Toast Notifications Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Video Preview Modal -->
    <div class="modal-overlay" id="previewModal" onclick="closeModal(event)">
        <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3>Video Preview</h3>
                <button class="modal-close" onclick="closePreviewModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="preview-thumb">
                    <img id="previewThumb" src="" alt="Preview">
                </div>
                <div class="preview-info">
                    <div class="preview-title" id="previewTitle"></div>
                    <div class="preview-meta" id="previewMeta"></div>
                    <a class="preview-link" id="previewLink" href="#" target="_blank">
                        View on Archive.org →
                    </a>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closePreviewModal()">Cancel</button>
                <button class="btn btn-success" id="previewAddBtn" onclick="addFromPreview()">Add to Staff Picks</button>
            </div>
        </div>
    </div>

    <!-- Keyboard Shortcuts Help (shown when logged in) -->
    <?php if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in']): ?>
    <div class="shortcuts-help">
        <kbd>Ctrl</kbd>+<kbd>S</kbd> Save &nbsp;|&nbsp;
        <kbd>/</kbd> Focus search &nbsp;|&nbsp;
        <kbd>Esc</kbd> Close modal
    </div>
    <?php endif; ?>

    <div class="container">
        <?php if (!$is_logged_in): ?>
        <!-- Login Form -->
        <div class="login-container">
            <h1>🎬 Admin Login</h1>
            <?php if (isset($login_error)): ?>
            <div class="login-error"><?= htmlspecialchars($login_error) ?></div>
            <?php endif; ?>
            <form method="POST">
                <input type="password" name="password" placeholder="Enter admin password" required>
                <button type="submit">Login</button>
            </form>
        </div>
        
        <?php else: ?>
        <!-- Admin Panel -->
        <div class="admin-header">
            <div style="display: flex; align-items: center; gap: 16px;">
                <h1>⭐ Staff Picks Manager</h1>
                <div class="unsaved-indicator" id="unsavedIndicator">
                    <span class="unsaved-dot"></span>
                    <span>Unsaved changes</span>
                </div>
            </div>
            <div style="display: flex; gap: 16px; align-items: center;">
                <a href="index.php" target="_blank" class="view-site-link">View Site →</a>
                <a href="?logout=1" class="btn btn-secondary">Logout</a>
            </div>
        </div>
        
        <div class="admin-layout">
            <!-- Search Section -->
            <div class="search-section">
                <h2>Search Archive.org Videos</h2>
                <div class="search-box">
                    <div class="search-input-container" id="searchInputContainer">
                        <input type="text" id="searchInput" placeholder="Search for movies, shows, documentaries...">
                        <div class="search-spinner"></div>
                    </div>
                    <button class="btn btn-primary" onclick="searchVideos()">Search</button>
                </div>

                <div class="filter-bar">
                    <select id="sortFilter" onchange="searchVideos()">
                        <option value="downloads desc">Most Downloaded</option>
                        <option value="downloads asc">Least Downloaded</option>
                        <option value="date desc">Newest First</option>
                        <option value="date asc">Oldest First</option>
                        <option value="titleSorter asc">Title A-Z</option>
                        <option value="titleSorter desc">Title Z-A</option>
                    </select>
                    <select id="yearFilter" onchange="searchVideos()">
                        <option value="">All Years</option>
                        <option value="2020-2029">2020s</option>
                        <option value="2010-2019">2010s</option>
                        <option value="2000-2009">2000s</option>
                        <option value="1990-1999">1990s</option>
                        <option value="1980-1989">1980s</option>
                        <option value="1970-1979">1970s</option>
                        <option value="1960-1969">1960s</option>
                        <option value="1950-1959">1950s</option>
                        <option value="1900-1949">Pre-1950</option>
                    </select>
                </div>

                <div id="resultsCount" class="results-count" style="display: none;"></div>

                <div id="searchResults">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <p>Search for videos to add to your Staff Picks</p>
                    </div>
                </div>

                <div id="pagination" class="pagination" style="display: none;"></div>
            </div>
            
            <!-- Selected Videos Panel -->
            <div class="selected-section">
                <div class="selected-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h2>⭐ Selected Videos</h2>
                        <span class="selected-count" id="selectedCount">0</span>
                    </div>
                    <div class="selected-actions">
                        <button class="btn btn-danger btn-sm" id="clearAllBtn" onclick="clearAllVideos()" style="display: none;">Clear All</button>
                    </div>
                </div>

                <p style="font-size: 12px; color: #666; margin-bottom: 16px;">Drag items to reorder</p>

                <div class="title-editor">
                    <label>Section Title</label>
                    <input type="text" id="sectionTitle" value="Staff Picks" placeholder="Staff Picks">
                </div>
                
                <div class="toggle-row">
                    <span class="toggle-label">Show on site</span>
                    <label class="toggle">
                        <input type="checkbox" id="enabledToggle" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                
                <div id="selectedList" class="selected-list">
                    <!-- Selected videos will appear here -->
                </div>
                
                <button class="btn btn-success" style="width: 100%;" onclick="saveRecommendations()">
                    💾 Save Changes
                </button>
                
                <div id="saveStatus"></div>
            </div>
        </div>
        
        <?php endif; ?>
    </div>
    
    <?php if ($is_logged_in): ?>
    <script>
        // State
        let selectedVideos = <?= json_encode($current_recommendations) ?>;
        let originalVideos = JSON.stringify(selectedVideos);
        let originalTitle = '';
        let originalEnabled = true;
        let currentPage = 1;
        let currentQuery = '';
        let totalPages = 1;
        let totalResults = 0;
        let searchTimeout = null;
        let currentDocs = [];
        let previewVideo = null;
        let draggedItem = null;

        // Toast notification system
        function showToast(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <span>${message}</span>
                <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            `;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), duration);
        }

        // Track unsaved changes
        function hasUnsavedChanges() {
            const currentTitle = document.getElementById('sectionTitle').value.trim() || 'Staff Picks';
            const currentEnabled = document.getElementById('enabledToggle').checked;
            return JSON.stringify(selectedVideos) !== originalVideos ||
                   currentTitle !== originalTitle ||
                   currentEnabled !== originalEnabled;
        }

        function updateUnsavedIndicator() {
            const indicator = document.getElementById('unsavedIndicator');
            const clearBtn = document.getElementById('clearAllBtn');
            if (hasUnsavedChanges()) {
                indicator.classList.add('visible');
            } else {
                indicator.classList.remove('visible');
            }
            // Show/hide clear all button
            if (clearBtn) {
                clearBtn.style.display = selectedVideos.length > 0 ? 'block' : 'none';
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            renderSelectedList();

            // Load saved data
            fetch('recommendations.json')
                .then(r => r.json())
                .then(data => {
                    if (data.title) {
                        document.getElementById('sectionTitle').value = data.title;
                        originalTitle = data.title;
                    }
                    if (data.enabled !== undefined) {
                        document.getElementById('enabledToggle').checked = data.enabled;
                        originalEnabled = data.enabled;
                    }
                })
                .catch(() => {
                    originalTitle = 'Staff Picks';
                    originalEnabled = true;
                });

            // Debounced search on input
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (e.target.value.trim().length >= 2) {
                        searchVideos();
                    }
                }, 500);
            });

            // Enter key to search immediately
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimeout);
                    searchVideos();
                }
            });

            // Track changes on title and toggle
            document.getElementById('sectionTitle').addEventListener('input', updateUnsavedIndicator);
            document.getElementById('enabledToggle').addEventListener('change', updateUnsavedIndicator);

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl+S to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    saveRecommendations();
                }
                // / to focus search
                if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    searchInput.focus();
                }
                // Escape to close modal
                if (e.key === 'Escape') {
                    closePreviewModal();
                }
            });

            // Warn before leaving with unsaved changes
            window.addEventListener('beforeunload', (e) => {
                if (hasUnsavedChanges()) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });

            updateUnsavedIndicator();
        });

        // Search videos
        async function searchVideos(page = 1) {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) {
                showToast('Please enter a search term', 'warning');
                return;
            }

            currentQuery = query;
            currentPage = page;

            const resultsDiv = document.getElementById('searchResults');
            const container = document.getElementById('searchInputContainer');
            container.classList.add('loading');
            resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Searching...</div>';

            try {
                const sortValue = document.getElementById('sortFilter').value;
                const yearFilter = document.getElementById('yearFilter').value;

                let queryStr = `${query} AND mediatype:(movies OR video)`;
                if (yearFilter) {
                    const [startYear, endYear] = yearFilter.split('-');
                    queryStr += ` AND year:[${startYear} TO ${endYear}]`;
                }

                const params = new URLSearchParams({
                    q: queryStr,
                    output: 'json',
                    rows: '24',
                    page: String(page)
                });

                ['identifier', 'title', 'creator', 'year', 'downloads', 'description'].forEach(f => {
                    params.append('fl[]', f);
                });

                params.append('sort[]', sortValue);

                const response = await fetch(`https://archive.org/advancedsearch.php?${params}`);
                const data = await response.json();

                container.classList.remove('loading');

                if (data.response && data.response.docs) {
                    currentDocs = data.response.docs;
                    totalResults = data.response.numFound || 0;
                    renderResults(data.response.docs);
                    totalPages = Math.ceil(totalResults / 24);
                    renderPagination();

                    // Show results count
                    const countDiv = document.getElementById('resultsCount');
                    countDiv.style.display = 'block';
                    countDiv.textContent = `Found ${totalResults.toLocaleString()} videos`;
                }
            } catch (error) {
                container.classList.remove('loading');
                resultsDiv.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Search failed: ${error.message}</p></div>`;
                showToast('Search failed. Please try again.', 'error');
            }
        }

        // Render search results with preview button
        function renderResults(docs) {
            const resultsDiv = document.getElementById('searchResults');

            if (!docs.length) {
                resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎬</div><p>No videos found. Try a different search.</p></div>';
                document.getElementById('resultsCount').style.display = 'none';
                return;
            }

            resultsDiv.innerHTML = '<div class="results-grid">' + docs.map((doc, index) => {
                const id = doc.identifier;
                const title = Array.isArray(doc.title) ? doc.title[0] : (doc.title || 'Untitled');
                const creator = Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Unknown');
                const year = doc.year || '';
                const isSelected = selectedVideos.some(v => v.id === id);
                const thumb = `https://archive.org/services/img/${id}`;

                return `
                    <div class="video-card ${isSelected ? 'selected' : ''}" data-id="${id}" onclick="toggleVideo('${id}', '${escapeHtml(title)}', '${escapeHtml(creator)}')">
                        <div class="video-card-thumb">
                            <img src="${thumb}" alt="${escapeHtml(title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22><rect fill=%22%23333%22 width=%2216%22 height=%229%22/><text x=%228%22 y=%225%22 fill=%22%23666%22 text-anchor=%22middle%22 font-size=%222%22>🎬</text></svg>'">
                            ${isSelected ? '<div class="video-card-badge">✓ Added</div>' : ''}
                            <button class="video-card-preview" onclick="event.stopPropagation(); showPreview(${index})">Preview</button>
                        </div>
                        <div class="video-card-content">
                            <div class="video-card-title">${escapeHtml(title)}</div>
                            <div class="video-card-meta">${escapeHtml(creator)}${year ? ' • ' + year : ''}</div>
                        </div>
                    </div>
                `;
            }).join('') + '</div>';
        }

        // Video preview modal
        function showPreview(index) {
            const doc = currentDocs[index];
            if (!doc) return;

            previewVideo = {
                id: doc.identifier,
                title: Array.isArray(doc.title) ? doc.title[0] : (doc.title || 'Untitled'),
                creator: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Unknown'),
                year: doc.year || '',
                description: doc.description || ''
            };

            const isSelected = selectedVideos.some(v => v.id === previewVideo.id);

            document.getElementById('previewThumb').src = `https://archive.org/services/img/${previewVideo.id}`;
            document.getElementById('previewTitle').textContent = previewVideo.title;
            document.getElementById('previewMeta').textContent = `${previewVideo.creator}${previewVideo.year ? ' • ' + previewVideo.year : ''}`;
            document.getElementById('previewLink').href = `https://archive.org/details/${previewVideo.id}`;

            const addBtn = document.getElementById('previewAddBtn');
            addBtn.textContent = isSelected ? 'Remove from Staff Picks' : 'Add to Staff Picks';
            addBtn.className = isSelected ? 'btn btn-danger' : 'btn btn-success';

            document.getElementById('previewModal').classList.add('visible');
        }

        function closePreviewModal() {
            document.getElementById('previewModal').classList.remove('visible');
            previewVideo = null;
        }

        function closeModal(event) {
            if (event.target.classList.contains('modal-overlay')) {
                closePreviewModal();
            }
        }

        function addFromPreview() {
            if (!previewVideo) return;

            const isSelected = selectedVideos.some(v => v.id === previewVideo.id);
            if (isSelected) {
                removeVideo(previewVideo.id);
                showToast(`Removed "${previewVideo.title}"`, 'info');
            } else {
                selectedVideos.push({
                    id: previewVideo.id,
                    title: previewVideo.title,
                    creator: previewVideo.creator
                });
                renderSelectedList();
                updateSearchCardStates();
                showToast(`Added "${previewVideo.title}"`, 'success');
            }

            closePreviewModal();
        }

        // Render pagination
        function renderPagination() {
            const paginationDiv = document.getElementById('pagination');

            if (totalPages <= 1) {
                paginationDiv.style.display = 'none';
                return;
            }

            paginationDiv.style.display = 'flex';
            paginationDiv.innerHTML = `
                <button onclick="searchVideos(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>← Previous</button>
                <button disabled>Page ${currentPage} of ${totalPages}</button>
                <button onclick="searchVideos(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Next →</button>
            `;
        }

        // Toggle video selection
        function toggleVideo(id, title, creator) {
            const index = selectedVideos.findIndex(v => v.id === id);

            if (index > -1) {
                selectedVideos.splice(index, 1);
                showToast('Video removed', 'info');
            } else {
                selectedVideos.push({ id, title, creator });
                showToast('Video added to Staff Picks', 'success');
            }

            renderSelectedList();
            updateSearchCardStates();
        }

        // Update search card visual states
        function updateSearchCardStates() {
            const cards = document.querySelectorAll('.video-card[data-id]');
            cards.forEach(card => {
                const cardId = card.dataset.id;
                const isSelected = selectedVideos.some(v => v.id === cardId);
                card.classList.toggle('selected', isSelected);

                const badge = card.querySelector('.video-card-badge');
                if (isSelected && !badge) {
                    card.querySelector('.video-card-thumb').insertAdjacentHTML('beforeend', '<div class="video-card-badge">✓ Added</div>');
                } else if (!isSelected && badge) {
                    badge.remove();
                }
            });
        }

        // Remove video from selection
        function removeVideo(id) {
            selectedVideos = selectedVideos.filter(v => v.id !== id);
            renderSelectedList();
            updateSearchCardStates();
        }

        // Clear all videos
        function clearAllVideos() {
            if (selectedVideos.length === 0) return;

            if (confirm(`Remove all ${selectedVideos.length} videos from Staff Picks?`)) {
                selectedVideos = [];
                renderSelectedList();
                updateSearchCardStates();
                showToast('All videos removed', 'info');
            }
        }

        // Drag and drop functionality
        function handleDragStart(e, index) {
            draggedItem = index;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const item = e.target.closest('.selected-item');
            if (item) {
                item.classList.add('drag-over');
            }
        }

        function handleDragLeave(e) {
            const item = e.target.closest('.selected-item');
            if (item) {
                item.classList.remove('drag-over');
            }
        }

        function handleDrop(e, targetIndex) {
            e.preventDefault();
            const items = document.querySelectorAll('.selected-item');
            items.forEach(item => item.classList.remove('drag-over', 'dragging'));

            if (draggedItem === null || draggedItem === targetIndex) return;

            // Reorder the array
            const [movedItem] = selectedVideos.splice(draggedItem, 1);
            selectedVideos.splice(targetIndex, 0, movedItem);

            renderSelectedList();
            updateUnsavedIndicator();
            showToast('Order updated', 'info');
        }

        function handleDragEnd(e) {
            draggedItem = null;
            const items = document.querySelectorAll('.selected-item');
            items.forEach(item => item.classList.remove('drag-over', 'dragging'));
        }

        // Render selected videos list with drag handles
        function renderSelectedList() {
            const listDiv = document.getElementById('selectedList');
            const countSpan = document.getElementById('selectedCount');

            countSpan.textContent = selectedVideos.length;
            updateUnsavedIndicator();

            if (!selectedVideos.length) {
                listDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No videos selected yet.<br>Search and click videos to add them.</p></div>';
                return;
            }

            listDiv.innerHTML = selectedVideos.map((video, index) => `
                <div class="selected-item"
                     draggable="true"
                     ondragstart="handleDragStart(event, ${index})"
                     ondragover="handleDragOver(event)"
                     ondragleave="handleDragLeave(event)"
                     ondrop="handleDrop(event, ${index})"
                     ondragend="handleDragEnd(event)">
                    <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                    <div class="selected-item-thumb">
                        <img src="https://archive.org/services/img/${video.id}" alt="${escapeHtml(video.title)}" onerror="this.style.display='none'">
                    </div>
                    <div class="selected-item-info">
                        <div class="selected-item-title">${escapeHtml(video.title)}</div>
                        <div class="selected-item-id">${video.id}</div>
                    </div>
                    <button class="selected-item-remove" onclick="event.stopPropagation(); removeVideo('${video.id}')" title="Remove">×</button>
                </div>
            `).join('');
        }

        // Save recommendations
        async function saveRecommendations() {
            const statusDiv = document.getElementById('saveStatus');
            const title = document.getElementById('sectionTitle').value.trim() || 'Staff Picks';
            const enabled = document.getElementById('enabledToggle').checked;

            statusDiv.innerHTML = '<div class="save-status" style="background: #374151; color: #fff;">Saving...</div>';

            try {
                const response = await fetch('save-recommendations.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        enabled: enabled,
                        title: title,
                        videos: selectedVideos
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Update original state
                    originalVideos = JSON.stringify(selectedVideos);
                    originalTitle = title;
                    originalEnabled = enabled;
                    updateUnsavedIndicator();

                    statusDiv.innerHTML = '<div class="save-status success">✓ Saved successfully!</div>';
                    showToast(`Saved ${selectedVideos.length} videos`, 'success');
                } else {
                    statusDiv.innerHTML = `<div class="save-status error">Error: ${result.error || 'Unknown error'}</div>`;
                    showToast('Failed to save', 'error');
                }
            } catch (error) {
                statusDiv.innerHTML = `<div class="save-status error">Error: ${error.message}</div>`;
                showToast('Failed to save: ' + error.message, 'error');
            }

            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }

        // Escape HTML
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
    <?php endif; ?>
</body>
</html>
