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
        }
        
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
    </style>
</head>
<body>
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
            <h1>⭐ Staff Picks Manager</h1>
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
                    <input type="text" id="searchInput" placeholder="Search for movies, shows, documentaries...">
                    <button class="btn btn-primary" onclick="searchVideos()">Search</button>
                </div>
                
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
                    <h2>⭐ Selected Videos</h2>
                    <span class="selected-count" id="selectedCount">0</span>
                </div>
                
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
        let currentPage = 1;
        let currentQuery = '';
        let totalPages = 1;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            renderSelectedList();
            
            // Load saved title if exists
            fetch('recommendations.json')
                .then(r => r.json())
                .then(data => {
                    if (data.title) {
                        document.getElementById('sectionTitle').value = data.title;
                    }
                    if (data.enabled !== undefined) {
                        document.getElementById('enabledToggle').checked = data.enabled;
                    }
                })
                .catch(() => {});
            
            // Enter key to search
            document.getElementById('searchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchVideos();
            });
        });
        
        // Search videos
        async function searchVideos(page = 1) {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) return;
            
            currentQuery = query;
            currentPage = page;
            
            const resultsDiv = document.getElementById('searchResults');
            resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Searching...</div>';
            
            try {
                const params = new URLSearchParams({
                    q: `${query} AND mediatype:(movies OR video)`,
                    output: 'json',
                    rows: '24',
                    page: String(page)
                });
                
                ['identifier', 'title', 'creator', 'year', 'downloads'].forEach(f => {
                    params.append('fl[]', f);
                });
                
                params.append('sort[]', 'downloads desc');
                
                const response = await fetch(`https://archive.org/advancedsearch.php?${params}`);
                const data = await response.json();
                
                if (data.response && data.response.docs) {
                    renderResults(data.response.docs);
                    totalPages = Math.ceil((data.response.numFound || 0) / 24);
                    renderPagination();
                }
            } catch (error) {
                resultsDiv.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Search failed: ${error.message}</p></div>`;
            }
        }
        
        // Render search results
        function renderResults(docs) {
            const resultsDiv = document.getElementById('searchResults');
            
            if (!docs.length) {
                resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎬</div><p>No videos found. Try a different search.</p></div>';
                return;
            }
            
            resultsDiv.innerHTML = '<div class="results-grid">' + docs.map(doc => {
                const id = doc.identifier;
                const title = Array.isArray(doc.title) ? doc.title[0] : (doc.title || 'Untitled');
                const creator = Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Unknown');
                const year = doc.year || '';
                const isSelected = selectedVideos.some(v => v.id === id);
                const thumb = `https://archive.org/services/img/${id}`;
                
                return `
                    <div class="video-card ${isSelected ? 'selected' : ''}" onclick="toggleVideo('${id}', '${escapeHtml(title)}', '${escapeHtml(creator)}')">
                        <div class="video-card-thumb">
                            <img src="${thumb}" alt="${escapeHtml(title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22><rect fill=%22%23333%22 width=%2216%22 height=%229%22/><text x=%228%22 y=%225%22 fill=%22%23666%22 text-anchor=%22middle%22 font-size=%222%22>🎬</text></svg>'">
                            ${isSelected ? '<div class="video-card-badge">✓ Added</div>' : ''}
                        </div>
                        <div class="video-card-content">
                            <div class="video-card-title">${escapeHtml(title)}</div>
                            <div class="video-card-meta">${escapeHtml(creator)}${year ? ' • ' + year : ''}</div>
                        </div>
                    </div>
                `;
            }).join('') + '</div>';
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
            } else {
                selectedVideos.push({ id, title, creator });
            }
            
            renderSelectedList();
            
            // Re-render search results to update badges
            if (currentQuery) {
                const cards = document.querySelectorAll('.video-card');
                cards.forEach(card => {
                    const cardId = card.getAttribute('onclick').match(/'([^']+)'/)[1];
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
        }
        
        // Remove video from selection
        function removeVideo(id) {
            selectedVideos = selectedVideos.filter(v => v.id !== id);
            renderSelectedList();
            
            // Update search results if visible
            const card = document.querySelector(`.video-card[onclick*="'${id}'"]`);
            if (card) {
                card.classList.remove('selected');
                const badge = card.querySelector('.video-card-badge');
                if (badge) badge.remove();
            }
        }
        
        // Render selected videos list
        function renderSelectedList() {
            const listDiv = document.getElementById('selectedList');
            const countSpan = document.getElementById('selectedCount');
            
            countSpan.textContent = selectedVideos.length;
            
            if (!selectedVideos.length) {
                listDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No videos selected yet.<br>Search and click videos to add them.</p></div>';
                return;
            }
            
            listDiv.innerHTML = selectedVideos.map(video => `
                <div class="selected-item">
                    <div class="selected-item-thumb">
                        <img src="https://archive.org/services/img/${video.id}" alt="${escapeHtml(video.title)}">
                    </div>
                    <div class="selected-item-info">
                        <div class="selected-item-title">${escapeHtml(video.title)}</div>
                        <div class="selected-item-id">${video.id}</div>
                    </div>
                    <button class="selected-item-remove" onclick="removeVideo('${video.id}')" title="Remove">×</button>
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
                    statusDiv.innerHTML = '<div class="save-status success">✓ Saved successfully!</div>';
                } else {
                    statusDiv.innerHTML = `<div class="save-status error">Error: ${result.error || 'Unknown error'}</div>`;
                }
            } catch (error) {
                statusDiv.innerHTML = `<div class="save-status error">Error: ${error.message}</div>`;
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
