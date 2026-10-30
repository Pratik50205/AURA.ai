'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const mode = searchParams.get('mode');

  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLightMode, setIsLightMode] = useState(true);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('aura-theme-preference');
      const isDark = storedTheme === 'false' || storedTheme === '"dark"';
      setIsLightMode(!isDark);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } catch {
      setIsLightMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    document.documentElement.setAttribute('data-theme', nextMode ? 'light' : 'dark');
    try {
      localStorage.setItem('aura-theme-preference', JSON.stringify(nextMode));
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setFormError('Invalid email or password. Please try again.');
        } else {
          window.location.href = callbackUrl;
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setFormError(data.error || 'Registration failed');
          return;
        }

        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setFormError('Account created but sign in failed. Please try signing in.');
        } else {
          window.location.href = callbackUrl;
        }
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: 'github' | 'google') => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 font-sans",
      isLightMode ? "bg-[#F8FAFC] text-slate-900" : "bg-[#090A0F] text-white"
    )}>
      {/* Background Ambient Radial Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-[130px] transition-opacity duration-700",
          isLightMode
            ? "bg-gradient-to-tr from-[#D9042B]/10 via-[#FF7B00]/8 to-transparent opacity-80"
            : "bg-gradient-to-tr from-[#D9042B]/22 via-[#FF7B00]/12 to-transparent opacity-100"
        )} />
      </div>

      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm",
            isLightMode
              ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-slate-200/50"
              : "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10"
          )}
          title={`Switch to ${isLightMode ? 'Dark Theme' : 'Light Theme'}`}
        >
          {isLightMode ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Subtitle */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-3.5 group select-none mb-2">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-red-500/25 group-hover:scale-105 transition-all">
              <img src="/aura-icon.svg" alt="AURA Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col line-tight text-left">
              <span className={cn(
                "text-2xl font-black tracking-tight",
                isLightMode ? "text-slate-900" : "text-white"
              )}>
                AURA<span className="text-[#FF3344]">.ai</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-[#FF7B00] uppercase -mt-0.5 whitespace-nowrap">
                AI UTILITY RECOMMENDATION
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className={cn(
          "rounded-3xl p-8 sm:p-9 border shadow-2xl backdrop-blur-2xl transition-all duration-300",
          isLightMode
            ? "bg-white/95 border-slate-200/90 shadow-slate-200/60"
            : "bg-[#12131C]/95 border-white/10 shadow-black/80"
        )}>
          <div className="text-center mb-8">
            <h1 className={cn(
              "text-2xl font-black tracking-tight mb-2",
              isLightMode ? "text-slate-900" : "text-white"
            )}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className={cn("text-xs sm:text-sm", isLightMode ? "text-slate-500" : "text-white/60")}>
              {isLogin ? 'Sign in to access your saved tools & custom stacks' : 'Start exploring 320+ verified AI utilities today'}
            </p>
          </div>

          {(error || formError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-semibold"
            >
              {formError || (error === 'CredentialsSignin' ? 'Invalid credentials' : 'Authentication failed')}
            </motion.div>
          )}

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all shadow-sm',
                isLightMode
                  ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </button>
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all shadow-sm',
                isLightMode
                  ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className={cn('absolute inset-0 flex items-center', isLightMode ? 'border-t border-slate-200' : 'border-t border-white/10')} />
            <div className="relative flex justify-center text-xs">
              <span className={cn('px-3 text-xs font-medium', isLightMode ? 'bg-white text-slate-500' : 'bg-[#12131C] text-white/50')}>
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className={cn("block text-xs font-semibold mb-1.5", isLightMode ? "text-slate-700" : "text-white/70")}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className={cn(
                    "w-full border rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none transition-all shadow-inner",
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500 focus:bg-white"
                      : "bg-white/5 border-white/10 text-white focus:border-red-500/70"
                  )}
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className={cn("block text-xs font-semibold mb-1.5 flex items-center gap-1.5", isLightMode ? "text-slate-700" : "text-white/70")}>
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full border rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none transition-all shadow-inner",
                  isLightMode
                    ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500 focus:bg-white"
                    : "bg-white/5 border-white/10 text-white focus:border-red-500/70"
                )}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className={cn("block text-xs font-semibold mb-1.5 flex items-center gap-1.5", isLightMode ? "text-slate-700" : "text-white/70")}>
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    "w-full border rounded-2xl pl-4 pr-11 py-2.5 text-xs sm:text-sm outline-none transition-all shadow-inner",
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500 focus:bg-white"
                      : "bg-white/5 border-white/10 text-white focus:border-red-500/70"
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    "absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors",
                    isLightMode ? "text-slate-400 hover:text-slate-700" : "text-white/40 hover:text-white"
                  )}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 text-white',
                'bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-md shadow-red-500/25 hover:opacity-95 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                isLogin ? 'Sign In to AURA' : 'Create Account'
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <p className={cn("text-center mt-6 text-xs", isLightMode ? "text-slate-500" : "text-white/60")}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormError('');
              }}
              className="text-[#FF3344] hover:underline font-bold transition-colors ml-1"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Demo Admin Quick Log in Badge */}
          <div className={cn("mt-6 pt-5 border-t text-center", isLightMode ? "border-slate-100" : "border-white/10")}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setEmail('admin@aura.ai');
                setPassword('adminaura');
                setFormError('');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold transition-all"
            >
              <span>👑 Demo Admin:</span>
              <code className="font-mono">admin@aura.ai</code>
              <span className="text-[11px] opacity-75">(pass: adminaura)</span>
            </button>
          </div>
        </div>

        <p className={cn("text-center text-xs mt-6", isLightMode ? "text-slate-400" : "text-white/40")}>
          By continuing, you agree to AURA&apos;s Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-muted">
          <div className="w-6 h-6 border-2 border-aura-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading AURA...</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}