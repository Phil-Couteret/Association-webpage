<?php
/**
 * Create a new email template
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Check authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['template_key', 'name', 'subject_en', 'body_en'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Field '{$field}' is required");
        }
    }
    
    // Check if template_key already exists
    $checkStmt = $pdo->prepare("SELECT id FROM email_templates WHERE template_key = ?");
    $checkStmt->execute([$input['template_key']]);
    if ($checkStmt->fetch()) {
        throw new Exception("Template key '{$input['template_key']}' already exists");
    }
    
    // Insert new template
    $stmt = $pdo->prepare("
        INSERT INTO email_templates (
            template_key, name,
            subject_en, subject_es, subject_ca,
            body_en, body_es, body_ca,
            active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $input['template_key'],
        $input['name'],
        $input['subject_en'],
        $input['subject_es'] ?? $input['subject_en'],
        $input['subject_ca'] ?? $input['subject_en'],
        $input['body_en'],
        $input['body_es'] ?? $input['body_en'],
        $input['body_ca'] ?? $input['body_en'],
        isset($input['active']) ? (int)$input['active'] : 1
    ]);
    
    $templateId = $pdo->lastInsertId();
    
    // Fetch the created template
    $fetchStmt = $pdo->prepare("SELECT * FROM email_templates WHERE id = ?");
    $fetchStmt->execute([$templateId]);
    $template = $fetchStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'template' => $template,
        'message' => 'Template created successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

