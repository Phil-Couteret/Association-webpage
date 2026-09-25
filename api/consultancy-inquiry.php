<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {
    // Get JSON input
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    $requiredFields = ['firstName', 'lastName', 'email', 'phone', 'inquiryType', 'message', 'preferredContactMethod'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Field '$field' is required");
        }
    }
    
    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate phone format (international format)
    if (!preg_match('/^\+\d{1,3}\d{4,14}$/', $input['phone'])) {
        throw new Exception('Invalid phone format. Use international format (e.g., +1234567890)');
    }
    
    // Validate inquiry type
    $validInquiryTypes = ['general', 'strategy', 'legal', 'financial', 'other'];
    if (!in_array($input['inquiryType'], $validInquiryTypes)) {
        throw new Exception('Invalid inquiry type');
    }
    
    // Prepare SQL statement
    $sql = "INSERT INTO consultancy_inquiries (
        first_name,
        last_name,
        email,
        phone,
        company_name,
        inquiry_type,
        message,
        preferred_contact_method,
        status,
        created_at
    ) VALUES (
        :firstName,
        :lastName,
        :email,
        :phone,
        :companyName,
        :inquiryType,
        :message,
        :preferredContactMethod,
        'pending',
        NOW()
    )";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':firstName' => $input['firstName'],
        ':lastName' => $input['lastName'],
        ':email' => $input['email'],
        ':phone' => $input['phone'],
        ':companyName' => $input['companyName'] ?? null,
        ':inquiryType' => $input['inquiryType'],
        ':message' => $input['message'],
        ':preferredContactMethod' => $input['preferredContactMethod']
    ]);
    
    $inquiryId = $pdo->lastInsertId();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Consultancy inquiry submitted successfully',
        'inquiryId' => $inquiryId
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

