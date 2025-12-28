'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Convert username to a fake email for Supabase Auth
    // This allows username-based login without actual email verification
    const usernameToEmail = (name: string) => `${name.toLowerCase()}@infinite-crossing.local`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const email = usernameToEmail(username);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        setError('用户名或密码错误');
                    } else {
                        setError(error.message);
                    }
                    return;
                }
            } else {
                // Registration
                if (username.length < 3) {
                    setError('用户名至少需要 3 个字符');
                    return;
                }
                if (password.length < 6) {
                    setError('密码至少需要 6 个字符');
                    return;
                }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // Skip email confirmation
                        emailRedirectTo: undefined,
                        data: {
                            username: username,
                        },
                    },
                });

                if (error) {
                    if (error.message.includes('already registered')) {
                        setError('该用户名已被注册');
                    } else {
                        setError(error.message);
                    }
                    return;
                }
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            setError('发生未知错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,0,0.02)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

            <Card className="w-full max-w-md bg-black/80 border-green-500/30 backdrop-blur z-20">
                <CardHeader className="text-center border-b border-green-500/20">
                    <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
                        <Terminal className="w-5 h-5" />
                        <span className="text-xs tracking-widest uppercase">SYS.AUTH</span>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-wider text-green-400">
                        {isLogin ? '// AUTHENTICATE' : '// REGISTER'}
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-green-500/80 text-xs uppercase tracking-wider">
                                Operative ID
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="输入用户名"
                                className="bg-black/50 border-green-500/30 text-green-400 placeholder:text-green-500/30 focus:border-green-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-green-500/80 text-xs uppercase tracking-wider">
                                Access Key
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="输入密码"
                                className="bg-black/50 border-green-500/30 text-green-400 placeholder:text-green-500/30 focus:border-green-500"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/20 border border-red-500/30 p-3 rounded">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-black hover:bg-green-500 font-bold tracking-wider disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isLogin ? (
                                '[ CONNECT ]'
                            ) : (
                                '[ CREATE PROFILE ]'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-green-500/20 text-center space-y-3">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-green-500/60 hover:text-green-400 text-sm transition-colors"
                        >
                            {isLogin ? '没有账号？注册新用户' : '已有账号？立即登录'}
                        </button>

                        <div className="text-green-500/40 text-xs">— 或 —</div>

                        <Link href="/">
                            <Button
                                variant="ghost"
                                className="text-green-500/50 hover:text-green-400 hover:bg-green-500/10 text-xs"
                            >
                                [ 游客模式 - 数据不保存 ]
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
