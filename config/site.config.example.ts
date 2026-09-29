/**
 * ── SINGLE SOURCE OF TRUTH FOR ONE ASSOCIATION'S SITE ──
 * A contractor spins up a new association by copying this file to
 * `site.config.ts` and editing ONLY the values below. No component,
 * page, or API file should contain a brand name, colour, or URL.
 *
 * The build reads this file to generate:
 *   - CSS variables (colours, radius, fonts)  -> injected at :root
 *   - <title>, meta tags, PWA manifest, favicon
 *   - which features/routes/admin-tabs are mounted (see `features`)
 *   - contact + legal + payment settings
 */

export const siteConfig = {
  // ---- IDENTITY ----
  name: "Elektr-Âme",
  shortName: "Elektr-Âme",            // PWA name, header
  tagline: "Electronic Music Community — Barcelona",
  domain: "https://www.elektr-ame.com",
  defaultLocale: "es",
  locales: ["en", "es", "ca"],        // subset of shipped locales to expose

  // ---- BRAND ASSETS (paths under /public/brand/) ----
  logo: "/brand/logo.png",
  logoHero: "/brand/logo-hero.png",
  favicon: "/brand/favicon.ico",
  ogImage: "/brand/og-image.jpg",

  // ---- THEME (HSL triplets: "H S% L%") ----
  // These map 1:1 to the CSS variables already used by shadcn/ui + Tailwind.
  theme: {
    radius: "0.5rem",
    light: {
      primary: "221 83% 25%",
      primaryForeground: "0 0% 100%",
      accent: "221 83% 25%",
      background: "0 0% 100%",
      foreground: "0 0% 0%",
    },
    dark: {
      primary: "221 83% 25%",
      primaryForeground: "0 0% 100%",
      accent: "195 100% 50%",
      background: "0 0% 0%",
      foreground: "0 0% 100%",
    },
    // Optional brand accent palette (nullable — themes that don't use these just omit them)
    palette: {
      "deep-purple": "272 87% 10%",
      "electric-blue": "195 100% 50%",
      "neon-pink": "328 100% 54%",
    },
  },

  // ---- CONTACT / SOCIAL ----
  contact: {
    email: "hello@elektr-ame.com",
    instagram: "",
    facebook: "",
  },

  // ---- FEATURE TOGGLES ----
  // Every flag gates a route, a nav item, an admin tab, and its API surface.
  // `false` means the code isn't mounted and the endpoints refuse the request.
  features: {
    events: true,
    artists: true,
    gallery: true,
    memberPortal: true,
    membershipPayments: true,   // requires a configured `payments` gateway
    sponsorDonations: true,
    newsletter: true,
    emailAutomation: true,
    openCall: true,
    taxReceipts: false,         // fiscal receipts — off until legally cleared per assoc
    consultancy: false,         // Elektr-Âme-specific portal module — off by default
  },

  // ---- MEMBERSHIP TIERS (data-driven; rendered by MembershipProducts) ----
  membershipTiers: [
    { id: "basic",   priceEur: 20, period: "year", featuresKey: "products.basicFeatures" },
    { id: "support", priceEur: 50, period: "year", featuresKey: "products.supportFeatures" },
  ],

  // ---- PAYMENTS ----
  // Pick ONE active gateway; keys live in server env / config.php, never here.
  payments: {
    gateway: "stripe",          // "stripe" | "redsys" | "paycomet" | "none"
    currency: "EUR",
  },

  // ---- LEGAL ----
  legal: {
    entityName: "Associació Elektr-Âme",
    taxId: "",
    registeredAddress: "Barcelona, Spain",
  },
} as const;

export type SiteConfig = typeof siteConfig;
