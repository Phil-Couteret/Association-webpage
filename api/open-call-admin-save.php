<?php
/**
 * Update admin fields for an Open Call submission (selection, rebooking dates).
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
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('open_call');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['id'])) {
        throw new Exception('Submission id is required');
    }

    $id = (int)$input['id'];
    $check = $pdo->prepare('SELECT id FROM open_call_submissions WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) {
        throw new Exception('Submission not found');
    }

    $futureSession = !empty($input['future_session']);
    $archived = !empty($input['archived']);
    $selected = !empty($input['selected']);
    $rebookingPossible = !empty($input['rebooking_possible']);
    $selectionDate = null;
    if ($selected) {
        if (empty($input['selection_date'])) {
            throw new Exception('Selection date is required when the applicant is marked as selected.');
        }
        $d = trim($input['selection_date']);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
            throw new Exception('Invalid selection date');
        }
        $selectionDate = $d;
    }

    $upd = $pdo->prepare('
        UPDATE open_call_submissions
        SET future_session = ?, archived = ?, selected = ?, selection_date = ?, rebooking_possible = ?
        WHERE id = ?
    ');
    $upd->execute([
        $futureSession ? 1 : 0,
        $archived ? 1 : 0,
        $selected ? 1 : 0,
        $selected ? $selectionDate : null,
        $rebookingPossible ? 1 : 0,
        $id,
    ]);

    $pdo->prepare('DELETE FROM open_call_rebooking_dates WHERE submission_id = ?')->execute([$id]);

    if ($rebookingPossible && !empty($input['rebooking_dates']) && is_array($input['rebooking_dates'])) {
        $ins = $pdo->prepare('INSERT INTO open_call_rebooking_dates (submission_id, booking_date) VALUES (?, ?)');
        foreach ($input['rebooking_dates'] as $entry) {
            $dateStr = is_array($entry) ? ($entry['booking_date'] ?? '') : $entry;
            $dateStr = trim((string)$dateStr);
            if ($dateStr === '') {
                continue;
            }
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateStr)) {
                throw new Exception('Invalid rebooking date: ' . $dateStr);
            }
            $ins->execute([$id, $dateStr]);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Saved']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (PDOException $e) {
    error_log('open-call-admin-save: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
