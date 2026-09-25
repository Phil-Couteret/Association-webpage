<?php
/**
 * Email Automation Cron Job
 * 
 * This script should be run periodically (e.g., every 15 minutes) via cron:
 * */15 * * * * /usr/bin/php /path/to/api/cron-email-automation.php >> /var/log/email-automation.log 2>&1
 * 
 * Or for OVH shared hosting, use OVH's cron job interface with:
 * php ~/www/api/cron-email-automation.php
 */

// Prevent direct browser access
if (php_sapi_name() !== 'cli' && !isset($_GET['manual_trigger'])) {
    http_response_code(403);
    die('This script can only be run via command line or with manual_trigger parameter');
}

// If manual trigger, set JSON header FIRST before any output
$isManualTrigger = isset($_GET['manual_trigger']);
if ($isManualTrigger) {
    header('Content-Type: application/json');
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/EmailAutomation.php';

// Log start time
$startTime = microtime(true);
$timestamp = date('Y-m-d H:i:s');

// Only echo text if not manual trigger (CLI mode)
if (!$isManualTrigger) {
    echo "[$timestamp] Email Automation Cron Job Started\n";
}

try {
    // Initialize email automation
    $emailAutomation = new EmailAutomation($pdo);

    // 1. Check for expiring memberships and queue reminder emails
    if (!$isManualTrigger) echo "Checking for expiring memberships...\n";
    $expiringResults = $emailAutomation->checkExpiringMemberships();
    if (!$isManualTrigger) {
        echo "- 7-day reminders: " . ($expiringResults['7d'] ?? 0) . "\n";
        echo "- 3-day reminders: " . ($expiringResults['3d'] ?? 0) . "\n";
        echo "- 1-day reminders: " . ($expiringResults['1d'] ?? 0) . "\n";
    }

    // 2. Process email queue (send up to 50 emails per run)
    if (!$isManualTrigger) echo "Processing email queue...\n";
    $queueResults = $emailAutomation->processQueue(50);
    if (!$isManualTrigger) {
        echo "- Sent: {$queueResults['sent']}\n";
        echo "- Failed: {$queueResults['failed']}\n";
        echo "- Total processed: {$queueResults['total']}\n";
        if (isset($queueResults['error'])) {
            echo "- Error: {$queueResults['error']}\n";
        }
    }

    // 3. Get queue status
    $stmt = $pdo->query("
        SELECT 
            status, 
            COUNT(*) as count,
            MIN(scheduled_for) as next_scheduled
        FROM email_queue
        GROUP BY status
    ");
    $queueStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!$isManualTrigger) {
        echo "Current queue status:\n";
        foreach ($queueStatus as $status) {
            $scheduled = $status['next_scheduled'] ? " (next: {$status['next_scheduled']})" : '';
            echo "- {$status['status']}: {$status['count']}{$scheduled}\n";
        }
    }

    // Log completion
    $duration = round(microtime(true) - $startTime, 2);
    $endTime = date('Y-m-d H:i:s');
    
    if (!$isManualTrigger) {
        echo "[$endTime] Cron Job Completed in {$duration}s\n";
        echo str_repeat('-', 80) . "\n";
    }

    // Return JSON response for manual triggers
    if ($isManualTrigger) {
        echo json_encode([
            'success' => true,
            'timestamp' => $endTime,
            'duration' => $duration,
            'expiring_memberships' => $expiringResults,
            'queue_processing' => $queueResults,
            'queue_status' => $queueStatus
        ]);
    }

} catch (Exception $e) {
    $error = $e->getMessage();
    error_log("Email automation cron error: $error");
    
    if ($isManualTrigger) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $error]);
    } else {
        echo "ERROR: $error\n";
    }
    
    exit(1);
}

