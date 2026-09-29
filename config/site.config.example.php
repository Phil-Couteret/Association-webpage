<?php
/**
 * Server-side mirror of the front-end site config.
 * Copy to site.config.php. The API reads this so that a feature turned OFF
 * in the front-end is ALSO refused by the back-end (never trust the client).
 *
 * Generated from the same values as site.config.ts — keep them in sync, or
 * (better) have the build emit this file from site.config.ts automatically.
 */

return [
    'name'        => 'Elektr-Âme',
    'domain'      => 'https://www.elektr-ame.com',
    'allowed_origins' => [
        'https://www.elektr-ame.com',
        'http://localhost:5173',
    ],

    // Must match the front-end `features` block exactly.
    'features' => [
        'events'             => true,
        'artists'            => true,
        'gallery'            => true,
        'memberPortal'       => true,
        'membershipPayments' => true,
        'sponsorDonations'   => true,
        'newsletter'         => true,
        'emailAutomation'    => true,
        'openCall'           => true,
        'taxReceipts'        => false,
        'consultancy'        => false,
    ],

    'payments' => [
        'gateway'  => 'stripe',   // stripe | redsys | paycomet | none
        'currency' => 'EUR',
    ],
];

/**
 * Usage in an endpoint, at the very top after config.php:
 *
 *   require_once __DIR__ . '/feature-guard.php';
 *   require_feature('gallery');          // 403 + exit if disabled for this tenant
 *   require_admin_section('gallery');    // existing auth guard
 */
