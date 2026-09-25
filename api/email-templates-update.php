<?php
/**
 * Update an email template
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        throw new Exception("Template ID is required");
    }
    
    $templateId = (int)$input['id'];
    
    // Check if template exists
    $checkStmt = $pdo->prepare("SELECT id FROM email_templates WHERE id = ?");
    $checkStmt->execute([$templateId]);
    if (!$checkStmt->fetch()) {
        throw new Exception("Template not found");
    }
    
    // If template_key is being changed, check for duplicates
    if (isset($input['template_key'])) {
        $keyCheckStmt = $pdo->prepare("SELECT id FROM email_templates WHERE template_key = ? AND id != ?");
        $keyCheckStmt->execute([$input['template_key'], $templateId]);
        if ($keyCheckStmt->fetch()) {
            throw new Exception("Template key '{$input['template_key']}' already exists");
        }
    }
    
    // Build update query dynamically
    $updateFields = [];
    $updateValues = [];
    
    $allowedFields = ['template_key', 'name', 'subject_en', 'subject_es', 'subject_ca', 'body_en', 'body_es', 'body_ca', 'active'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "{$field} = ?";
            if ($field === 'active') {
                $updateValues[] = (int)$input[$field];
            } else {
                $updateValues[] = $input[$field];
            }
        }
    }
    
    if (empty($updateFields)) {
        throw new Exception("No fields to update");
    }
    
    $updateValues[] = $templateId;
    
    $sql = "UPDATE email_templates SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($updateValues);
    
    // Fetch the updated template
    $fetchStmt = $pdo->prepare("SELECT * FROM email_templates WHERE id = ?");
    $fetchStmt->execute([$templateId]);
    $template = $fetchStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'template' => $template,
        'message' => 'Template updated successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

