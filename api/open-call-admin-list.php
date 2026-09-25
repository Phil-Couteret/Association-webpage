<?php
/**
 * List Open Call submissions with rebooking dates (admin).
 * Works across DB versions: only selects/filters on columns that exist.
 */
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('open_call');

/** @return array<string, true> */
function openCallSubmissionColumnSet(PDO $pdo) {
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $cache = [];
    try {
        $st = $pdo->query('SHOW COLUMNS FROM open_call_submissions');
        if ($st) {
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $row) {
                if (!empty($row['Field'])) {
                    $cache[$row['Field']] = true;
                }
            }
        }
    } catch (PDOException $e) {
        error_log('open-call-admin-list columns: ' . $e->getMessage());
    }
    return $cache;
}

function openCallHasRebookingTable(PDO $pdo) {
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    try {
        $st = $pdo->query("SHOW TABLES LIKE 'open_call_rebooking_dates'");
        $cache = $st && $st->rowCount() > 0;
    } catch (PDOException $e) {
        $cache = false;
    }
    return $cache;
}

try {
    $scope = $_GET['scope'] ?? 'active';
    if (!in_array($scope, ['active', 'archived', 'all'], true)) {
        $scope = 'active';
    }

    $cols = openCallSubmissionColumnSet($pdo);
    $wanted = [
        'id', 'email', 'whatsapp', 'first_name', 'last_name', 'dj_name', 'musical_style',
        'mix_link', 'mix_file_path', 'mix_file_original_name', 'photo_path', 'promo_consent',
        'selected', 'selection_date', 'rebooking_possible', 'future_session', 'archived',
        'promoted_artist_id', 'promoted_member_id',
        'created_at', 'updated_at', 'ip_address',
    ];
    $selectCols = array_values(array_filter($wanted, static function ($c) use ($cols) {
        return isset($cols[$c]);
    }));

    if (!isset($cols['id'])) {
        throw new Exception('open_call_submissions table is missing required columns');
    }

    $sql = 'SELECT ' . implode(', ', $selectCols) . ' FROM open_call_submissions';
    $where = [];

    if (isset($cols['archived'])) {
        if ($scope === 'active') {
            $where[] = 'archived = 0';
        } elseif ($scope === 'archived') {
            $where[] = 'archived = 1';
        }
    } elseif ($scope === 'archived') {
        $where[] = '1=0';
    }

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $orderCol = isset($cols['created_at']) ? 'created_at' : 'id';
    $sql .= ' ORDER BY ' . $orderCol . ' DESC';

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $ids = array_column($rows, 'id');
    $rebookingBySub = [];
    if ($ids && openCallHasRebookingTable($pdo)) {
        $in = implode(',', array_map('intval', $ids));
        $rd = $pdo->query("
            SELECT id, submission_id, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date
            FROM open_call_rebooking_dates
            WHERE submission_id IN ($in)
            ORDER BY booking_date ASC, id ASC
        ");
        if ($rd) {
            foreach ($rd->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $sid = (int)$r['submission_id'];
                if (!isset($rebookingBySub[$sid])) {
                    $rebookingBySub[$sid] = [];
                }
                $rebookingBySub[$sid][] = [
                    'id' => (int)$r['id'],
                    'booking_date' => $r['booking_date'],
                ];
            }
        }
    }

    foreach ($rows as &$row) {
        $id = (int)$row['id'];
        $row['promo_consent'] = isset($row['promo_consent']) ? (bool)(int)$row['promo_consent'] : false;
        $row['selected'] = isset($row['selected']) ? (bool)(int)$row['selected'] : false;
        $row['rebooking_possible'] = isset($row['rebooking_possible']) ? (bool)(int)$row['rebooking_possible'] : false;
        $row['future_session'] = isset($row['future_session']) ? (bool)(int)$row['future_session'] : false;
        $row['archived'] = isset($row['archived']) ? (bool)(int)$row['archived'] : false;
        if (array_key_exists('promoted_artist_id', $row) && $row['promoted_artist_id'] !== null && $row['promoted_artist_id'] !== '') {
            $row['promoted_artist_id'] = (int)$row['promoted_artist_id'];
        } else {
            $row['promoted_artist_id'] = null;
        }
        if (array_key_exists('promoted_member_id', $row) && $row['promoted_member_id'] !== null && $row['promoted_member_id'] !== '') {
            $row['promoted_member_id'] = (int)$row['promoted_member_id'];
        } else {
            $row['promoted_member_id'] = null;
        }
        $row['selection_date'] = !empty($row['selection_date']) ? $row['selection_date'] : null;
        $row['rebooking_dates'] = $rebookingBySub[$id] ?? [];
    }
    unset($row);

    echo json_encode(['success' => true, 'submissions' => $rows]);
} catch (PDOException $e) {
    error_log('open-call-admin-list: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
} catch (Exception $e) {
    error_log('open-call-admin-list: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
