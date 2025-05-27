// ReTap Web Theme - aggiornato secondo branding Figma
// Font: Fredoka (https://fonts.google.com/specimen/Fredoka)

export const colors = {
  // Brand
  primary: '#ff3131',         // Rosso Retap
  primaryDark: '#E62C2C',     // Rosso scuro (hover/active)
  accent: '#FFD6D6',          // Rosa chiaro (accento, bg decorativo)

  // Grigi
  background: '#FFFFFF',      // Sfondo principale
  surface: '#F8F9FA',         // Card, superfici
  border: '#E6E6E6',          // Bordo input/card
  shadow: 'rgba(0,0,0,0.04)', // Ombra leggera

  // Testo
  textPrimary: '#1A1A1A',     // Testo principale
  textSecondary: '#666666',   // Testo secondario
  textDisabled: '#BDBDBD',    // Testo disabilitato

  // Stato
  success: '#28A745',         // Verde successo
  error: '#FF3B30',           // Rosso errore
  warning: '#FFC107',         // Giallo warning
  info: '#2196F3',            // Blu info
};

export const radii = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '32px',
  pill: '999px',
};

export const font = {
  family: 'Fredoka',
  weights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
};

export const textStyles = {
  displayLarge: {
    fontFamily: font.family,
    fontSize: '3.563rem', // 57px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  displayMedium: {
    fontFamily: font.family,
    fontSize: '2.813rem', // 45px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: font.family,
    fontSize: '2.25rem', // 36px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: font.family,
    fontSize: '2rem', // 32px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: font.family,
    fontSize: '1.75rem', // 28px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: font.family,
    fontSize: '1.5rem', // 24px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: font.family,
    fontSize: '1.375rem', // 22px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: font.family,
    fontSize: '1rem', // 16px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: '0.1px',
  },
  titleSmall: {
    fontFamily: font.family,
    fontSize: '0.875rem', // 14px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: '0.1px',
  },
  bodyLarge: {
    fontFamily: font.family,
    fontSize: '1rem', // 16px
    fontWeight: font.weights.regular,
    color: colors.textPrimary,
    letterSpacing: '0.15px',
  },
  bodyMedium: {
    fontFamily: font.family,
    fontSize: '0.875rem', // 14px
    fontWeight: font.weights.regular,
    color: colors.textPrimary,
    letterSpacing: '0.15px',
  },
  bodySmall: {
    fontFamily: font.family,
    fontSize: '0.75rem', // 12px
    fontWeight: font.weights.regular,
    color: colors.textSecondary,
    letterSpacing: '0.1px',
  },
  labelLarge: {
    fontFamily: font.family,
    fontSize: '0.875rem', // 14px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: '0.1px',
  },
  labelMedium: {
    fontFamily: font.family,
    fontSize: '0.75rem', // 12px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: '0.5px',
  },
  labelSmall: {
    fontFamily: font.family,
    fontSize: '0.688rem', // 11px
    fontWeight: font.weights.bold,
    color: colors.textPrimary,
    letterSpacing: '0.5px',
  },
};

export const buttonStyles = {
  primary: {
    background: colors.primary,
    color: colors.background,
    borderRadius: radii.md,
    fontFamily: font.family,
    fontWeight: font.weights.bold,
    padding: '12px 24px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  primaryDisabled: {
    background: colors.border,
    color: colors.textDisabled,
    borderRadius: radii.md,
    fontFamily: font.family,
    fontWeight: font.weights.bold,
    padding: '12px 24px',
    border: 'none',
    cursor: 'not-allowed',
  },
  outlined: {
    background: 'transparent',
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: radii.md,
    fontFamily: font.family,
    fontWeight: font.weights.bold,
    padding: '12px 24px',
    cursor: 'pointer',
    transition: 'border 0.2s',
  },
}; 