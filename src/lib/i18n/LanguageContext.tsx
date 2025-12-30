'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import en from './translations/en.json';
import zh from './translations/zh.json';

export type Language = 'en' | 'zh';

type TranslationData = typeof en;

const translations: Record<Language, TranslationData> = { en, zh };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, fallback?: string) => string;
    tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'infinite-crossing-language';

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('zh');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved language preference
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved && (saved === 'en' || saved === 'zh')) {
            setLanguageState(saved);
        }
        setMounted(true);
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
    }, []);

    const t = useCallback((key: string, fallback?: string): string => {
        const value = getNestedValue(translations[language], key);
        if (typeof value === 'string') {
            return value;
        }
        // Fallback to English if not found in current language
        const enValue = getNestedValue(translations.en, key);
        if (typeof enValue === 'string') {
            return enValue;
        }
        return fallback ?? key;
    }, [language]);

    const tArray = useCallback((key: string): string[] => {
        const value = getNestedValue(translations[language], key);
        if (Array.isArray(value)) {
            return value;
        }
        const enValue = getNestedValue(translations.en, key);
        if (Array.isArray(enValue)) {
            return enValue;
        }
        return [];
    }, [language]);

    // Prevent hydration mismatch by rendering nothing until mounted
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export function useTranslation() {
    const { t, tArray } = useLanguage();
    return { t, tArray };
}
