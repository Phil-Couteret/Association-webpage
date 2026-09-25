<?php
/**
 * Sitemap Generator
 * Generates XML sitemap for search engines
 */

// Start output buffering to catch any accidental output from includes
ob_start();

// Include config (may have whitespace or output)
require_once __DIR__ . '/config.php';

// Discard any output from config.php or whitespace
ob_end_clean();

// Set headers after cleaning buffer (must be before any output)
header('Content-Type: application/xml; charset=utf-8');

// Base URL
$baseUrl = 'https://www.elektr-ame.com';

// Get current date
$currentDate = date('Y-m-d');

// Start XML output - MUST be first output after headers
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";

// Helper function to output URL
function outputUrl($loc, $lastmod = null, $changefreq = 'monthly', $priority = '0.5') {
    global $currentDate;
    $lastmod = $lastmod ?: $currentDate;
    echo "  <url>\n";
    echo "    <loc>" . htmlspecialchars($loc, ENT_XML1, 'UTF-8') . "</loc>\n";
    echo "    <lastmod>" . htmlspecialchars($lastmod, ENT_XML1, 'UTF-8') . "</lastmod>\n";
    echo "    <changefreq>" . htmlspecialchars($changefreq, ENT_XML1, 'UTF-8') . "</changefreq>\n";
    echo "    <priority>" . htmlspecialchars($priority, ENT_XML1, 'UTF-8') . "</priority>\n";
    
    // Add language alternates
    $languages = ['en', 'es', 'ca'];
    foreach ($languages as $lang) {
        echo "    <xhtml:link rel=\"alternate\" hreflang=\"$lang\" href=\"" . htmlspecialchars($loc, ENT_XML1, 'UTF-8') . "\" />\n";
    }
    
    echo "  </url>\n";
}

try {
    // Homepage
    outputUrl($baseUrl . '/', $currentDate, 'weekly', '1.0');
    
    // Static pages
    outputUrl($baseUrl . '/join-us', $currentDate, 'monthly', '0.8');
    outputUrl($baseUrl . '/contact', $currentDate, 'monthly', '0.7');
    outputUrl($baseUrl . '/initiatives', $currentDate, 'monthly', '0.7');
    
    // Get events from database
    $stmt = $pdo->prepare("
        SELECT id, title, updated_at, created_at 
        FROM events 
        WHERE status = 'published' 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($events as $event) {
        $lastmod = $event['updated_at'] ? date('Y-m-d', strtotime($event['updated_at'])) : date('Y-m-d', strtotime($event['created_at']));
        // Note: Event detail pages would need to be added if they exist
        // For now, events are shown on homepage
    }
    
    // Get artists from database
    $stmt = $pdo->prepare("
        SELECT id, name, updated_at, created_at 
        FROM artists 
        WHERE status = 'active' 
        ORDER BY name ASC
    ");
    $stmt->execute();
    $artists = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($artists as $artist) {
        $lastmod = $artist['updated_at'] ? date('Y-m-d', strtotime($artist['updated_at'])) : date('Y-m-d', strtotime($artist['created_at']));
        outputUrl($baseUrl . '/artist/' . $artist['id'], $lastmod, 'monthly', '0.8');
    }
    
    // Gallery pages (if they exist)
    $stmt = $pdo->prepare("
        SELECT id, title, updated_at, created_at 
        FROM galleries 
        WHERE is_active = 1 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $galleries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($galleries as $gallery) {
        $lastmod = $gallery['updated_at'] ? date('Y-m-d', strtotime($gallery['updated_at'])) : date('Y-m-d', strtotime($gallery['created_at']));
        // Note: Gallery detail pages would need to be added if they exist
    }
    
} catch (PDOException $e) {
    // Log error but continue with static pages
    error_log('Sitemap generation error: ' . $e->getMessage());
}

// Close XML
echo '</urlset>';
