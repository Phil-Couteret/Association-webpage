<?php
/**
 * Public endpoint: Open Call (for DJ) — mix link and/or file upload.
 * Max file size: 2 GiB (application limit). Server php.ini upload_max_filesize / post_max_size must allow large uploads on production.
 */

require_once __DIR__ . '/config-helper.php';

header('Content-Type: application/json; charset=utf-8');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

/** @return int bytes (PHP ini size e.g. 128M, 2G) */
function parsePhpIniSize($val) {
    $val = trim((string)$val);
    if ($val === '' || $val === '0') {
        return 0;
    }
    $last = strtolower($val[strlen($val) - 1]);
    $num = (int)$val;
    switch ($last) {
        case 'g':
            $num *= 1024;
            // fall through
        case 'm':
            $num *= 1024;
            // fall through
        case 'k':
            $num *= 1024;
    }
    return $num;
}

define('OPEN_CALL_MAX_BYTES', 2 * 1024 * 1024 * 1024); // 2 GiB
define('OPEN_CALL_PHOTO_MAX_BYTES', 10 * 1024 * 1024); // 10 MiB

$allowedExtensions = ['mp3', 'wav', 'flac', 'm4a', 'aiff', 'aif', 'ogg', 'opus', 'webm', 'aac', 'zip'];
$allowedPhotoExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

try {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/classes/Mailer.php';

    $email = trim($_POST['email'] ?? '');
    $whatsapp = trim($_POST['whatsapp'] ?? '');
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName = trim($_POST['last_name'] ?? '');
    $djName = trim($_POST['dj_name'] ?? '');
    $musicalStyle = trim($_POST['musical_style'] ?? '');
    $mixLink = trim($_POST['mix_link'] ?? '');
    $promoRaw = $_POST['promo_consent'] ?? '';
    $promoConsent = in_array(strtolower((string)$promoRaw), ['1', 'true', 'on', 'yes'], true);

    if (!$promoConsent) {
        throw new Exception('You must accept the promotional use authorization to submit.');
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Please enter a valid email address.');
    }
    if ($whatsapp === '' || strlen($whatsapp) < 6) {
        throw new Exception('Please enter a valid WhatsApp number.');
    }
    if ($firstName === '' || strlen($firstName) < 2) {
        throw new Exception('Please enter your first name (at least 2 characters).');
    }
    if ($lastName === '' || strlen($lastName) < 2) {
        throw new Exception('Please enter your last name (at least 2 characters).');
    }
    if ($djName === '' || strlen($djName) < 2) {
        throw new Exception('Please enter your DJ name (at least 2 characters).');
    }
    if ($musicalStyle === '' || strlen($musicalStyle) < 3) {
        throw new Exception('Please describe your musical style.');
    }

    $hasLink = $mixLink !== '';
    if ($hasLink) {
        if (!preg_match('#^https?://#i', $mixLink)) {
            $mixLink = 'https://' . $mixLink;
        }
        if (!filter_var($mixLink, FILTER_VALIDATE_URL)) {
            throw new Exception('Please enter a valid mix link (URL).');
        }
    }

    $uploadMax = parsePhpIniSize(ini_get('upload_max_filesize'));
    $postMax = parsePhpIniSize(ini_get('post_max_size'));
    $serverFileCap = $uploadMax > 0 ? min($uploadMax, $postMax > 0 ? $postMax : PHP_INT_MAX) : 0;

    $filePathStored = null;
    $originalNameStored = null;
    $photoPathStored = null;

    $hasPhoto = isset($_FILES['photo_file'])
        && is_array($_FILES['photo_file'])
        && ($_FILES['photo_file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;

    if ($hasPhoto) {
        $perr = (int)($_FILES['photo_file']['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($perr !== UPLOAD_ERR_OK) {
            throw new Exception($perr === UPLOAD_ERR_INI_SIZE || $perr === UPLOAD_ERR_FORM_SIZE
                ? 'Photo exceeds server upload limit.'
                : 'Photo upload failed.');
        }
        $ptmp = $_FILES['photo_file']['tmp_name'];
        $pname = $_FILES['photo_file']['name'] ?? 'photo';
        $psize = (int)($_FILES['photo_file']['size'] ?? 0);
        if ($psize <= 0) {
            throw new Exception('Photo file is empty.');
        }
        if ($psize > OPEN_CALL_PHOTO_MAX_BYTES) {
            throw new Exception('Photo is too large. Maximum size is 10 MB.');
        }
        $pext = strtolower(pathinfo($pname, PATHINFO_EXTENSION));
        if (!in_array($pext, $allowedPhotoExtensions, true)) {
            throw new Exception('Invalid photo type. Use JPG, PNG, WebP, or GIF.');
        }
        $photoDir = getUploadDirectory('open-call-photos/');
        if (!file_exists($photoDir)) {
            mkdir($photoDir, 0755, true);
        }
        $photoUnique = uniqid('ocp_', true) . '_' . time() . '.' . $pext;
        $photoDest = $photoDir . $photoUnique;
        if (!move_uploaded_file($ptmp, $photoDest)) {
            throw new Exception('Could not save the photo.');
        }
        $photoPathStored = 'public/open-call-photos/' . $photoUnique;
    }

    $hasFile = isset($_FILES['mix_file'])
        && is_array($_FILES['mix_file'])
        && ($_FILES['mix_file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;

    if (!$hasLink && !$hasFile) {
        throw new Exception('Please provide a mix link or upload an audio file.');
    }

    if ($hasFile) {
        $err = (int)($_FILES['mix_file']['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
            $hint = $serverFileCap > 0
                ? ' Server limit is about ' . round($serverFileCap / (1024 * 1024)) . ' MB; increase upload_max_filesize and post_max_size on the host to allow up to 2 GB.'
                : '';
            throw new Exception('The uploaded file exceeds the server upload limit.' . $hint);
        }
        if ($err !== UPLOAD_ERR_OK) {
            throw new Exception('Upload failed (error code ' . $err . ').');
        }

        $tmp = $_FILES['mix_file']['tmp_name'];
        $origName = $_FILES['mix_file']['name'] ?? 'mix';
        $size = (int)($_FILES['mix_file']['size'] ?? 0);

        if ($size <= 0) {
            throw new Exception('The uploaded file is empty.');
        }
        if ($size > OPEN_CALL_MAX_BYTES) {
            throw new Exception('File is too large. Maximum size is 2 GB.');
        }
        if ($serverFileCap > 0 && $size > $serverFileCap) {
            throw new Exception(
                'This file is larger than the server allows (' . round($serverFileCap / (1024 * 1024)) . ' MB). Contact us with a link instead, or ask the host to raise PHP upload limits.'
            );
        }

        $extension = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions, true)) {
            throw new Exception('Invalid file type. Allowed: ' . implode(', ', $allowedExtensions) . '.');
        }

        $uploadDir = getUploadDirectory('open-call-mixes/');
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $safeBase = preg_replace('/[^a-zA-Z0-9._-]+/', '_', pathinfo($origName, PATHINFO_FILENAME));
        $safeBase = $safeBase !== '' ? $safeBase : 'mix';
        $uniqueFilename = uniqid('oc_', true) . '_' . time() . '.' . $extension;
        $destPath = $uploadDir . $uniqueFilename;

        if (!move_uploaded_file($tmp, $destPath)) {
            throw new Exception('Could not save the uploaded file.');
        }

        $filePathStored = 'public/open-call-mixes/' . $uniqueFilename;
        $originalNameStored = $origName;
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($parts[0]);
    }

    $mixLinkDb = $hasLink ? $mixLink : null;

    $stmt = $pdo->prepare('
        INSERT INTO open_call_submissions
        (email, whatsapp, first_name, last_name, dj_name, musical_style, mix_link, mix_file_path, mix_file_original_name,
         photo_path, promo_consent, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $email,
        $whatsapp,
        $firstName,
        $lastName,
        $djName,
        $musicalStyle,
        $mixLinkDb,
        $filePathStored,
        $originalNameStored,
        $photoPathStored,
        1,
        $ip,
    ]);

    $notifyTo = 'rrpp@elektr-ame.com';
    $subject = '[Open Call DJ] New submission — ' . $djName;
    $body = "New Open Call (DJ) submission\n\n";
    $body .= "Name: {$firstName} {$lastName}\n";
    $body .= "DJ name: {$djName}\n";
    $body .= "Email: {$email}\n";
    $body .= "WhatsApp: {$whatsapp}\n";
    $body .= "Musical style:\n{$musicalStyle}\n\n";
    if ($mixLinkDb) {
        $body .= "Mix link: {$mixLinkDb}\n";
    }
    if ($filePathStored) {
        $body .= "Uploaded file (server path): {$filePathStored}\n";
        $body .= "Original filename: {$originalNameStored}\n";
    }
    if ($photoPathStored) {
        $body .= "Photo/logo (server path): {$photoPathStored}\n";
    }
    $body .= "Promotional use consent: yes\n";
    $body .= "\nSubmitted: " . date('c') . "\n";

    try {
        Mailer::send($notifyTo, $subject, $body, ['toName' => 'Elektr-Âme RRPP']);
    } catch (Throwable $e) {
        error_log('Open call notification email failed: ' . $e->getMessage());
    }

    echo json_encode([
        'success' => true,
        'message' => 'Thank you — your submission was received.',
    ]);
} catch (PDOException $e) {
    error_log('open-call-submit DB: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not save your submission. If this persists, email rrpp@elektr-ame.com.',
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
