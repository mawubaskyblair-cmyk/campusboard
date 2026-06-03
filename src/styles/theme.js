// src/styles/theme.js
// ============================================
// ALL COLORS IN ONE PLACE
// Change colors here → whole app updates
// ============================================

export const lightTheme = {
  // Primary colors
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#dbeafe',
  primaryDark: '#1e40af',
  
  // Status colors
  success: '#10b981',
  successHover: '#059669',
  successLight: '#d1fae5',
  successDark: '#065f46',
  
  warning: '#f59e0b',
  warningHover: '#d97706',
  warningLight: '#fed7aa',
  warningDark: '#92400e',
  
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerLight: '#fee2e2',
  dangerDark: '#991b1b',
  
  info: '#06b6d4',
  infoHover: '#0891b2',
  infoLight: '#cffafe',
  infoDark: '#155e75',
  
  // Background colors
  bgPrimary: '#f3f4f6',
  bgSecondary: '#ffffff',
  bgCard: '#ffffff',
  bgNav: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textWhite: '#ffffff',
  
  // Border colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Shadow
  shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  
  // Border radius
  radiusSm: '0.375rem',
  radius: '0.5rem',
  radiusLg: '0.75rem',
  radiusXl: '1rem',
  
  // Transitions
  transition: 'all 0.3s ease',
  transitionFast: 'all 0.15s ease',
  transitionSlow: 'all 0.5s ease',
}

export const darkTheme = {
  // Primary colors
  primary: '#60a5fa',
  primaryHover: '#93c5fd',
  primaryLight: '#1e3a5f',
  primaryDark: '#bfdbfe',
  
  // Status colors
  success: '#34d399',
  successHover: '#6ee7b7',
  successLight: '#064e3b',
  successDark: '#a7f3d0',
  
  warning: '#fbbf24',
  warningHover: '#fcd34d',
  warningLight: '#78350f',
  warningDark: '#fde68a',
  
  danger: '#f87171',
  dangerHover: '#fca5a5',
  dangerLight: '#7f1d1d',
  dangerDark: '#fecaca',
  
  info: '#22d3ee',
  infoHover: '#67e8f9',
  infoLight: '#164e63',
  infoDark: '#cffafe',
  
  // Background colors
  bgPrimary: '#111827',
  bgSecondary: '#1f2937',
  bgCard: '#1f2937',
  bgNav: '#1f2937',
  
  // Text colors
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textWhite: '#ffffff',
  
  // Border colors
  border: '#374151',
  borderLight: '#4b5563',
  borderDark: '#1f2937',
  
  // Shadow
  shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  
  // Border radius (same as light)
  radiusSm: '0.375rem',
  radius: '0.5rem',
  radiusLg: '0.75rem',
  radiusXl: '1rem',
  
  // Transitions (same as light)
  transition: 'all 0.3s ease',
  transitionFast: 'all 0.15s ease',
  transitionSlow: 'all 0.5s ease',
}

// Helper function to get current theme
export const getTheme = (isDarkMode) => isDarkMode ? darkTheme : lightTheme