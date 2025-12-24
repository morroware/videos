<?php
/**
 * Save Recommendations Endpoint
 * Saves admin-selected videos to recommendations.json
 */

// Start session to check admin status
session_start();

// Verify admin is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Not authorized']);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

// Validate data structure
if (!isset($data['videos']) || !is_array($data['videos'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing videos array']);
    exit;
}

// Sanitize videos
$videos = [];
foreach ($data['videos'] as $video) {
    if (isset($video['id']) && is_string($video['id'])) {
        $videos[] = [
            'id' => preg_replace('/[^a-zA-Z0-9_-]/', '', $video['id']),
            'title' => isset($video['title']) ? substr(strip_tags($video['title']), 0, 200) : '',
            'creator' => isset($video['creator']) ? substr(strip_tags($video['creator']), 0, 100) : ''
        ];
    }
}

// Build recommendations object
$recommendations = [
    'enabled' => isset($data['enabled']) ? (bool)$data['enabled'] : true,
    'title' => isset($data['title']) ? substr(strip_tags($data['title']), 0, 50) : 'Staff Picks',
    'videos' => $videos,
    'updated' => date('c')
];

// Save to file
$filename = __DIR__ . '/recommendations.json';
$json = json_encode($recommendations, JSON_PRETTY_PRINT);

if (file_put_contents($filename, $json) !== false) {
    // Make sure file is readable
    chmod($filename, 0644);
    
    echo json_encode([
        'success' => true,
        'message' => 'Saved ' . count($videos) . ' videos',
        'data' => $recommendations
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write file']);
}
