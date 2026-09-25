<?php
/**
 * Migration: Add payment_intent_id column to payment_transactions
 * Run once: php database/run-migration-payment-intent-id.php
 */

require_once __DIR__ . '/../api/config.php';

try {
    echo "Running migration: add payment_intent_id column...\n";
    
    $pdo->exec("
        ALTER TABLE payment_transactions 
        ADD COLUMN payment_intent_id VARCHAR(255) NULL AFTER transaction_id,
        ADD INDEX idx_payment_intent_id (payment_intent_id)
    ");
    
    echo "✅ Migration completed successfully.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "ℹ️  Column already exists - migration was already applied.\n";
        exit(0);
    }
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
