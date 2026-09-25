<?php
/**
 * Setup Payment Tables
 * Run this script once to create all payment-related database tables
 * 
 * Usage: php database/setup-payment-tables.php
 */

require_once __DIR__ . '/../api/config.php';

try {
    echo "Setting up payment tables...\n\n";
    
    // Read SQL files
    $sqlFiles = [
        'create-payment-transactions-table.sql',
        'create-payment-webhooks-table.sql',
        'create-payment-config-table.sql'
    ];
    
    foreach ($sqlFiles as $file) {
        $filePath = __DIR__ . '/' . $file;
        
        if (!file_exists($filePath)) {
            echo "❌ File not found: $file\n";
            continue;
        }
        
        echo "📄 Processing: $file\n";
        
        $sql = file_get_contents($filePath);
        
        // Split by semicolon to handle multiple statements
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function($stmt) {
                return !empty($stmt) && !preg_match('/^--/', $stmt);
            }
        );
        
        foreach ($statements as $statement) {
            if (empty(trim($statement))) {
                continue;
            }
            
            try {
                $pdo->exec($statement);
                echo "  ✅ Executed successfully\n";
            } catch (PDOException $e) {
                // Check if error is "table already exists"
                if (strpos($e->getMessage(), 'already exists') !== false) {
                    echo "  ⚠️  Table already exists (skipping)\n";
                } else {
                    echo "  ❌ Error: " . $e->getMessage() . "\n";
                }
            }
        }
        
        echo "\n";
    }
    
    echo "✅ Payment tables setup complete!\n";
    echo "\nNext steps:\n";
    echo "1. Go to Admin Portal > Payment Configuration\n";
    echo "2. Add your Stripe API keys (test mode first)\n";
    echo "3. Activate Stripe payment gateway\n";
    
} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

