<?php
/**
 * SMTP Configuration Template
 * Copy to smtp-config.php and fill in your credentials
 * NEVER commit smtp-config.php to git
 *
 * OVH: Host ssl0.ovh.net, Port 587 (TLS) or 465 (SSL)
 * Brevo/Sendinblue: smtp-relay.brevo.com, Port 587
 * Gmail: smtp.gmail.com, Port 587 (use App Password)
 */
return [
    'enabled' => true,
    'host' => 'ssl0.ovh.net',
    'port' => 587,
    'encryption' => 'tls',  // 'tls', 'ssl', or ''
    'username' => 'noreply@elektr-ame.com',
    'password' => 'YOUR_MAILBOX_PASSWORD',
    'from_email' => 'noreply@elektr-ame.com',
    'from_name' => 'Elektr-Ame',
    'reply_to' => 'contact@elektr-ame.com',
];
