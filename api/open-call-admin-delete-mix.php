<?php
/**
 * Delete uploaded mix file from disk and clear DB columns (admin). Frees server space.
 */
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config-helper.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('open_call');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['id'])) {
        throw new Exception('Submission id is required');
    }

    $id = (int)$input['id'];
    $stmt = $pdo->prepare('SELECT id, mix_file_path FROM open_call_submissions WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        throw new Exception('Submission not found');
    }

    $relativePath = $row['mix_file_path'] ?? null;
    if ($relativePath === null || $relativePath === '') {
        echo json_encode(['success' => true, 'message' => 'No file on record']);
        exit();
    }

    $relativePath = str_replace('\\', '/', (string)$relativePath);
    if (!preg_match('#^public/open-call-mixes/[^/]+$#', $relativePath)) {
        throw new Exception('Invalid stored file path');
    }

    $base = basename($relativePath);
    $dir = getUploadDirectory('open-call-mixes/');
    $fullPath = $dir . $base;
    if (is_file($fullPath)) {
        if (!@unlink($fullPath)) {
            error_log('open-call-admin-delete-mix: unlink failed for ' . $fullPath);
        }
    }

    $upd = $pdo->prepare('UPDATE open_call_submissions SET mix_file_path = NULL, mix_file_original_name = NULL WHERE id = ?');
    $upd->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'File removed']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (PDOException $e) {
    error_log('open-call-admin-delete-mix: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
