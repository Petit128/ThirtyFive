export const colors = {
  // Couleurs principales
  primary: '#646cff',
  primaryDark: '#535bf2',
  primaryLight: '#8b90ff',
  secondary: '#10b981',
  secondaryDark: '#059669',
  secondaryLight: '#34d399',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  
  // Neutres
  white: '#ffffff',
  black: '#000000',
  
  // Thème sombre
  dark: {
    background: '#1a1a2e',
    backgroundSecondary: '#16213e',
    surface: '#2d2d3a',
    surfaceLight: 'rgba(255,255,255,0.05)',
    surfaceLighter: 'rgba(255,255,255,0.1)',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#888888',
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.05)',
    icon: '#a1a1aa',
    success: '#10b981',
    error: '#ef4444',
  },
  
  // Thème clair
  light: {
    background: '#f8fafc',
    backgroundSecondary: '#e2e8f0',
    surface: '#ffffff',
    surfaceLight: '#f1f5f9',
    surfaceLighter: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    icon: '#64748b',
    success: '#10b981',
    error: '#ef4444',
  },
};

export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: 'bold', lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h5: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: 'normal', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const getTheme = (isDark) => ({
  colors: colors,
  typography: typography,
  spacing: spacing,
  borderRadius: borderRadius,
  shadows: shadows,
  isDark: isDark,
  theme: isDark ? colors.dark : colors.light,
});

export default getTheme;