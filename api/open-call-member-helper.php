<?php
/**
 * Create or link a members row from an Open Call submission (complimentary 1-year yearly membership).
 * Used only when an admin explicitly runs open-call-promote-to-member.php (not tied to “Selected”).
 */

/**
 * @return array{ok: bool, skipped?: bool, memberId?: int, createdNew?: bool, alreadyLinked?: bool, linkStored?: bool, message?: string, error?: string}
 */
function open_call_sync_member_from_submission(PDO $pdo, int $submissionId) {
    static $hasCol = null;
    if ($hasCol === null) {
        try {
            $c = $pdo->query("SHOW COLUMNS FROM open_call_submissions LIKE 'promoted_member_id'");
            $hasCol = $c && $c->rowCount() > 0;
        } catch (PDOException $e) {
            $hasCol = false;
        }
    }
    $linkStored = (bool) $hasCol;

    $stmt = $pdo->prepare('SELECT * FROM open_call_submissions WHERE id = ?');
    $stmt->execute([$submissionId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return ['ok' => false, 'error' => 'Submission not found'];
    }

    $existingPid = ($hasCol && isset($row['promoted_member_id'])) ? (int) $row['promoted_member_id'] : 0;
    if ($existingPid > 0) {
        $chk = $pdo->prepare('SELECT id FROM members WHERE id = ?');
        $chk->execute([$existingPid]);
        if ($chk->fetch()) {
            return [
                'ok' => true,
                'skipped' => true,
                'alreadyLinked' => true,
                'memberId' => $existingPid,
                'linkStored' => $linkStored,
                'message' => 'Already linked to a member',
            ];
        }
        if ($hasCol) {
            $pdo->prepare('UPDATE open_call_submissions SET promoted_member_id = NULL WHERE id = ?')->execute([$submissionId]);
        }
    }

    $selectionDate = !empty($row['selection_date']) ? trim((string)$row['selection_date']) : '';

    $email = trim((string)($row['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'error' => 'Invalid submission email'];
    }

    $first = trim((string)($row['first_name'] ?? ''));
    $last = trim((string)($row['last_name'] ?? ''));
    if ($first === '' || $last === '') {
        return ['ok' => false, 'error' => 'First and last name are required'];
    }

    $whatsapp = trim((string)($row['whatsapp'] ?? ''));
    if ($whatsapp === '') {
        $whatsapp = '—';
    }
    $phoneStored = $whatsapp;
    if (strlen($phoneStored) > 20) {
        $phoneStored = substr($phoneStored, 0, 20);
    }

    $djName = trim((string)($row['dj_name'] ?? ''));

    $startDate = $selectionDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectionDate)
        ? $selectionDate
        : date('Y-m-d');
    try {
        $endDt = new DateTime($startDate);
        $endDt->modify('+1 year');
        $endDate = $endDt->format('Y-m-d');
    } catch (Exception $e) {
        $startDate = date('Y-m-d');
        $endDt = new DateTime($startDate);
        $endDt->modify('+1 year');
        $endDate = $endDt->format('Y-m-d');
    }

    $noteLine = 'Open Call DJ — complimentary 1-year membership (submission #' . (int)$submissionId . ', start ' . $startDate . ').';
    if (strlen(trim((string)($row['whatsapp'] ?? ''))) > 20) {
        $noteLine .= ' WhatsApp (full): ' . trim((string)$row['whatsapp']) . '.';
    }

    $colCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'newsletter_subscribe'");
    $hasNewsletterCol = $colCheck && $colCheck->rowCount() > 0;

    $pdo->beginTransaction();
    try {
        $find = $pdo->prepare('SELECT id, membership_end_date, notes FROM members WHERE email = ? LIMIT 1');
        $find->execute([$email]);
        $existing = $find->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $mid = (int)$existing['id'];
            $updNotes = trim((string)($existing['notes'] ?? ''));
            if ($updNotes !== '') {
                $updNotes .= "\n\n";
            }
            $updNotes .= $noteLine;

            $pdo->prepare('
                UPDATE members SET
                    first_name = ?,
                    last_name = ?,
                    phone = ?,
                    artist_name = COALESCE(NULLIF(TRIM(?), \'\'), artist_name),
                    is_dj = 1,
                    status = \'approved\',
                    membership_type = \'yearly\',
                    membership_start_date = ?,
                    membership_end_date = ?,
                    payment_status = \'paid\',
                    last_payment_date = ?,
                    payment_amount = COALESCE(payment_amount, 0),
                    notes = ?,
                    updated_at = NOW()
                WHERE id = ?
            ')->execute([
                $first,
                $last,
                $phoneStored,
                $djName,
                $startDate,
                $endDate,
                $startDate,
                $updNotes,
                $mid,
            ]);

            if ($hasCol) {
                $pdo->prepare('UPDATE open_call_submissions SET promoted_member_id = ? WHERE id = ?')->execute([$mid, $submissionId]);
            }
            $pdo->commit();

            return [
                'ok' => true,
                'createdNew' => false,
                'alreadyLinked' => false,
                'memberId' => $mid,
                'linkStored' => $linkStored,
                'message' => 'Linked to existing member; membership refreshed (1 year from selection).',
            ];
        }

        if ($hasNewsletterCol) {
            $sql = "INSERT INTO members (
                first_name, last_name, second_name, artist_name, email, phone,
                street, zip_code, city, country,
                is_dj, is_producer, is_vj, is_visual_artist, is_fan,
                newsletter_subscribe,
                status, membership_type, membership_start_date, membership_end_date,
                payment_status, last_payment_date, payment_amount, notes,
                created_at, updated_at
            ) VALUES (
                ?, ?, NULL, ?, ?, ?,
                NULL, NULL, 'Barcelona', 'Spain',
                1, 0, 0, 0, 0,
                0,
                'approved', 'yearly', ?, ?, 'paid', ?, 0, ?,
                NOW(), NOW()
            )";
        } else {
            $sql = "INSERT INTO members (
                first_name, last_name, second_name, artist_name, email, phone,
                street, zip_code, city, country,
                is_dj, is_producer, is_vj, is_visual_artist, is_fan,
                status, membership_type, membership_start_date, membership_end_date,
                payment_status, last_payment_date, payment_amount, notes,
                created_at, updated_at
            ) VALUES (
                ?, ?, NULL, ?, ?, ?,
                NULL, NULL, 'Barcelona', 'Spain',
                1, 0, 0, 0, 0,
                'approved', 'yearly', ?, ?, 'paid', ?, 0, ?,
                NOW(), NOW()
            )";
        }

        $ins = $pdo->prepare($sql);
        $params = [
            $first,
            $last,
            $djName !== '' ? $djName : null,
            $email,
            $phoneStored,
            $startDate,
            $endDate,
            $startDate,
            $noteLine,
        ];
        $ins->execute($params);

        $memberId = (int)$pdo->lastInsertId();
        if ($hasCol) {
            $pdo->prepare('UPDATE open_call_submissions SET promoted_member_id = ? WHERE id = ?')->execute([$memberId, $submissionId]);
        }
        $pdo->commit();

        return [
            'ok' => true,
            'createdNew' => true,
            'memberId' => $memberId,
            'linkStored' => $linkStored,
            'message' => 'Member created with complimentary 1-year yearly membership.',
        ];
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}
