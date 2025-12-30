'use client';

import { useLanguage, type Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'zh' ? 'en' : 'zh');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="text-xs font-mono text-zinc-400 hover:text-green-400 hover:bg-green-950/20 gap-1.5 px-2"
            title={language === 'zh' ? 'Switch to English' : '切换到中文'}
        >
            <Globe className="w-3 h-3" />
            <span>{language === 'zh' ? 'EN' : '中'}</span>
        </Button>
    );
}
