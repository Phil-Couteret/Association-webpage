<?php
/**
 * SMTP Mailer - sends email via PHPMailer
 * Falls back to mail() if SMTP not configured
 */

require_once __DIR__ . '/../libs/PHPMailer/PHPMailer/Exception.php';
require_once __DIR__ . '/../libs/PHPMailer/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../libs/PHPMailer/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

class Mailer {
    private static $config = null;

    private static function getConfig() {
        if (self::$config === null) {
            $path = __DIR__ . '/../smtp-config.php';
            if (file_exists($path)) {
                self::$config = include $path;
            } else {
                self::$config = ['enabled' => false];
            }
        }
        return self::$config;
    }

    /** Check if SMTP is configured (for diagnostics) */
    public static function isSmtpConfigured() {
        $config = self::getConfig();
        return !empty($config['enabled']);
    }

    /**
     * Send plain text or HTML email
     * @param array $options toName, isHtml
     * @return bool
     */
    public static function send($to, $subject, $body, $options = []) {
        $config = self::getConfig();
        if ($config['enabled'] ?? false) {
            return self::sendViaSmtp($to, $subject, $body, $options);
        }
        return self::sendViaMail($to, $subject, $body, $options);
    }

    /**
     * Send email with PDF attachment
     * @return bool
     */
    public static function sendWithAttachment($to, $subject, $body, $pdfContent, $filename = 'attachment.pdf', $options = []) {
        $config = self::getConfig();
        if ($config['enabled'] ?? false) {
            return self::sendWithAttachmentViaSmtp($to, $subject, $body, $pdfContent, $filename, $options);
        }
        return self::sendViaMail($to, $subject, $body . "\n\n[PDF attachment not sent - SMTP required]", $options);
    }

    private static function sendViaSmtp($to, $subject, $body, $options) {
        $config = self::getConfig();
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $config['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $config['username'];
            $mail->Password = $config['password'];
            $enc = $config['encryption'] ?? 'tls';
            $mail->SMTPSecure = $enc === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : ($enc === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : false);
            $mail->Port = (int)($config['port'] ?? 587);
            $mail->CharSet = PHPMailer::CHARSET_UTF8;

            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addReplyTo($config['reply_to'] ?? $config['from_email']);
            $mail->addAddress($to, $options['toName'] ?? '');
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->isHTML(!empty($options['isHtml']));

            return $mail->send();
        } catch (PHPMailerException $e) {
            error_log("SMTP send error: " . $e->getMessage());
            return false;
        }
    }

    private static function sendWithAttachmentViaSmtp($to, $subject, $body, $pdfContent, $filename, $options) {
        $config = self::getConfig();
        if (empty($pdfContent) || substr($pdfContent, 0, 4) !== '%PDF') {
            error_log("Mailer: invalid PDF content");
            return false;
        }
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $config['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $config['username'];
            $mail->Password = $config['password'];
            $enc = $config['encryption'] ?? 'tls';
            $mail->SMTPSecure = $enc === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : ($enc === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : false);
            $mail->Port = (int)($config['port'] ?? 587);
            $mail->CharSet = PHPMailer::CHARSET_UTF8;

            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addReplyTo($config['reply_to'] ?? $config['from_email']);
            $mail->addAddress($to, $options['toName'] ?? '');
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->isHTML(false);
            $mail->addStringAttachment($pdfContent, $filename, 'base64', 'application/pdf');

            return $mail->send();
        } catch (PHPMailerException $e) {
            error_log("SMTP send with attachment error: " . $e->getMessage());
            return false;
        }
    }

    private static function sendViaMail($to, $subject, $body, $options) {
        $isHtml = !empty($options['isHtml']);
        $headers = [
            'From: Elektr-Ame <noreply@elektr-ame.com>',
            'Reply-To: contact@elektr-ame.com',
            'Content-Type: ' . ($isHtml ? 'text/html' : 'text/plain') . '; charset=UTF-8',
            'MIME-Version: 1.0',
        ];
        return @mail($to, $subject, $body, implode("\r\n", $headers));
    }
}
