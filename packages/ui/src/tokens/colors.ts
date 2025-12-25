/**
 * @trato-hive/ui/tokens/colors
 * 
 * Official "The Intelligent Hive v2.0" Color Palette
 */

export const colors = {
    // Brand
    orange: '#EE8D1D', // Primary CTA, Highlights
    gold: '#D4AF37',   // Accents, Honeycomb elements

    // Backgrounds
    bone: '#E2D9CB',      // Primary Background (Light)
    alabaster: '#F7F7F7', // Surface/Card Background (Light)
    deepGrey: '#313131',  // Primary Background (Dark)
    surfaceDark: '#3A3A3A', // Card Background (Dark)

    // Typography
    charcoal: '#1A1A1A',  // Primary Text (Light)
    culturedWhite: '#F7F7F7', // Primary Text (Dark)

    // Specialized
    tealBlue: '#2F7E8A',  // Citations & AI-Generated Content (Non-negotiable)
    tealLight: '#4A9DAB', // Citation Hover

    // Semantic
    error: '#F44336',
    success: '#4CAF50',
} as const;

export type ColorToken = keyof typeof colors;
