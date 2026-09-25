<?php
/**
 * Delete an email template
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    $checkStmt = $pdo->prepare("SELECT id, template_key FROM email_templates WHERE id = ?");
    $checkStmt->execute([$templateId]);
    $template = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$template) {
        throw new Exception("Template not found");
    }
    
    // Check if template is used in automation rules
    $ruleCheckStmt = $pdo->prepare("SELECT COUNT(*) as count FROM email_automation_rules WHERE template_id = ?");
    $ruleCheckStmt->execute([$templateId]);
    $ruleCount = $ruleCheckStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($ruleCount > 0) {
        throw new Exception("Cannot delete template: it is used in {$ruleCount} automation rule(s). Please remove the rules first.");
    }
    
    // Delete the template
    $stmt = $pdo->prepare("DELETE FROM email_templates WHERE id = ?");
    $stmt->execute([$templateId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Template deleted successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

