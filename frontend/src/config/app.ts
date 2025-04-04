export const AppConfig = {
  defaultLanguage: 'es',
  supportedLanguages: ['es'],
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
  currencySymbol: '€',
  numberFormat: {
    decimal: ',',
    thousand: '.',
    precision: 2,
  },
  api: {
    baseUrl: process.env.API_URL || 'http://localhost:3000',
    timeout: 10000,
  },
  theme: {
    colors: {
      primary: '#2C3E50',
      secondary: '#34495E',
      success: '#27AE60',
      danger: '#E74C3C',
      warning: '#F1C40F',
      info: '#3498DB',
      light: '#F8F9FA',
      dark: '#343A40',
      background: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      border: '#DFE4EA',
    },
    fonts: {
      regular: 'System',
      medium: 'System-Medium',
      bold: 'System-Bold',
    },
  },
  psd2: {
    consentValidityDays: 90,
    syncInterval: 60 * 60 * 1000, // 1 hour in milliseconds
  },
};
