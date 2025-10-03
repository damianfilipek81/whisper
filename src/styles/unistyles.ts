import { StyleSheet } from 'react-native-unistyles';

// Define the theme
const lightTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#F2F2F7',
    cardBackground: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    userMessage: '#007AFF',
    otherMessage: '#E9E9EB',
    userMessageText: '#FFFFFF',
    otherMessageText: '#000000',
    shadow: '#000000',
    online: '#34C759',
    gradient1: '#667eea',
    gradient2: '#764ba2',
    timestamp: '#8E8E93',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 25,
  },
  fontSize: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
} as const;

// Define breakpoints for responsive design
const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;

// Configure the registry
StyleSheet.configure({
  themes: {
    light: lightTheme,
    // We can add dark theme later if needed
  },
  breakpoints,
  settings: {
    adaptiveThemes: false,
    initialTheme: 'light',
  },
});

// Export types for TypeScript
type AppBreakpoints = typeof breakpoints;
type AppThemes = {
  light: typeof lightTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  export interface UnistylesThemes extends AppThemes {}
}
