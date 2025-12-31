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

const STORAGE_KEY = 'infinite-crossing-language';

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Default context value for SSR
const defaultContextValue: LanguageContextType = {
    language: 'zh',
    setLanguage: () => { },
    t: (key: string, fallback?: string) => {
        const value = getNestedValue(translations.zh, key);
        if (typeof value === 'string') return value;
        const enValue = getNestedValue(translations.en, key);
        if (typeof enValue === 'string') return enValue;
        return fallback ?? key;
    },
    tArray: (key: string) => {
        const value = getNestedValue(translations.zh, key);
        if (Array.isArray(value)) return value;
        const enValue = getNestedValue(translations.en, key);
        if (Array.isArray(enValue)) return enValue;
        return [];
    },
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

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

    // Always provide context, use current state (default 'zh' during SSR)
    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export function useTranslation() {
    const { t, tArray } = useLanguage();
    return { t, tArray };
}

