'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthButtonProps {
    user: SupabaseUser | null;
    className?: string;
}

export function AuthButton({ user, className }: AuthButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        router.refresh();
        setLoading(false);
    };

    if (user) {
        // Extract username from email (format: username@infinite-crossing.local)
        const username = user.email?.split('@')[0] || 'Operative';

        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="flex items-center gap-2 text-green-500/80 text-xs">
                    <User className="w-3 h-3" />
                    <span className="uppercase tracking-wider">{username}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={loading}
                    className="text-green-500/60 hover:text-red-400 hover:bg-red-500/10 text-xs h-7 px-2"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/login')}
            className={`text-green-500/60 hover:text-green-400 hover:bg-green-500/10 text-xs h-7 gap-1 ${className}`}
        >
            <LogIn className="w-3 h-3" />
            LOGIN
        </Button>
    );
}
