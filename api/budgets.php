<?php
/**
 * API stockage partagé des budgets (calculateur bar)
 * Appelé depuis calcul budget boisson.html
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/data_budgets';
$dataFile = $dataDir . '/budgets.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

function loadData($file) {
    if (!file_exists($file)) {
        return [];
    }
    $raw = file_get_contents($file);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $name = isset($_GET['name']) ? trim($_GET['name']) : '';
    $data = loadData($dataFile);

    if ($name !== '') {
        $key = 'assoV10_' . $name;
        if (isset($data[$key])) {
            echo json_encode($data[$key]);
        } else {
            echo 'null';
        }
    } else {
        $list = [];
        foreach (array_keys($data) as $k) {
            if (strpos($k, 'assoV10_') === 0) {
                $list[] = substr($k, 8);
            }
        }
        echo json_encode($list);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nom requis']);
        exit;
    }
    $name = trim($input['name']);
    $store = $input['data'] ?? [];
    $key = 'assoV10_' . $name;

    $data = loadData($dataFile);
    $data[$key] = $store;

    if (saveData($dataFile, $data)) {
        echo json_encode(['ok' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur d\'écriture']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée']);
