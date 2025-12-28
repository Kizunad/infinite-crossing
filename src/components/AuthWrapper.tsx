'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthButton } from '@/components/AuthButton';
import { useAtlasStore } from '@/lib/atlas-store';
import { useGeneratedWorldStore } from '@/lib/generated-world-store';
import type { User } from '@supabase/supabase-js';

export function AuthWrapper() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const syncWithUser = useAtlasStore((state) => state.syncWithUser);
    const fetchWorlds = useGeneratedWorldStore((state) => state.fetchWorlds);

    useEffect(() => {
        const supabase = createClient();

        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
            // Sync atlas with user
            syncWithUser(user?.id ?? null);
            // Fetch public worlds
            fetchWorlds();
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                syncWithUser(session?.user?.id ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, [syncWithUser, fetchWorlds]);

    if (loading) {
        return <div className="w-16 h-5 bg-green-900/20 animate-pulse rounded" />;
    }

    return <AuthButton user={user} />;
}
