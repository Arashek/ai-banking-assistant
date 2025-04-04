import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../config/app';
import { translations } from '../translations/es';

interface LanguageContextType {
  t: typeof translations;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  formatDate: (date: Date | string) => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (number: number, precision?: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(AppConfig.defaultLanguage);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && AppConfig.supportedLanguages.includes(savedLanguage)) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: string) => {
    if (!AppConfig.supportedLanguages.includes(lang)) {
      throw new Error('Language not supported');
    }

    try {
      await AsyncStorage.setItem('language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
      throw error;
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: AppConfig.currency,
      minimumFractionDigits: AppConfig.numberFormat.precision,
      maximumFractionDigits: AppConfig.numberFormat.precision,
    }).format(amount);
  };

  const formatNumber = (number: number, precision = AppConfig.numberFormat.precision) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(number);
  };

  const value = {
    t: translations,
    language,
    setLanguage,
    formatDate,
    formatCurrency,
    formatNumber,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
