/**
 * Arthsaathi Motion System — §7
 *
 * One easing curve, a handful of durations, and two spring configs.
 * Every animated component imports from here instead of inventing its own timing.
 */

/** Signature soft ease-out — the only curve used across the entire app. */
export const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Duration tiers (seconds) ── */
export const DURATION = {
  micro: 0.15, // button press, toggle, checkbox
  component: 0.35, // card enter, dropdown open
  page: 0.45, // route cross-fade
  data: 0.6, // health-score count-up, Twin glow shift
} as const;

/* ── Spring presets ── */
export const SPRING = {
  /** Snappy — Twin core entrance, interactive elements. */
  snappy: { type: "spring" as const, stiffness: 120, damping: 14 },
  /** Gentle — orbit nodes, chart bar enters. */
  gentle: { type: "spring" as const, stiffness: 100, damping: 12 },
} as const;

/* ── Reusable transition presets ── */
export const TRANSITION = {
  /** Route cross-fade + slight Y offset. */
  page: { duration: DURATION.page, ease: EASE },
  /** Cards / list items entering. */
  component: { duration: DURATION.component, ease: EASE },
  /** Button press, toggles. */
  micro: { duration: DURATION.micro, ease: EASE },
  /** Number count-ups, Twin glow. */
  data: { duration: DURATION.data, ease: EASE },
} as const;

/* ── AnimatePresence page-transition variants ── */
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: TRANSITION.page },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3, ease: EASE } },
} as const;

/* ── Fade-in variant for staggered lists ── */
export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: TRANSITION.component },
} as const;

/* ── Container variant for stagger children ── */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
} as const;
