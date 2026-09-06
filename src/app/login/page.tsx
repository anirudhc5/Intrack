'use client';

import Image from 'next/image';
import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { Lock, Zap, Shield } from 'lucide-react';

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-xl p-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.svg" alt="Intrack Logo" width={40} height={40} className="mb-4" />
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#131b2e]">Intrack</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#dbe1ff] text-[#003ea8]">
              Beta
            </span>
          </div>
          <p className="text-[13px] text-[#434655] text-center">
            Track your internship applications in one place.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-[13px] text-center border border-red-100">
            Authentication failed. Please try again.
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl shadow-sm border border-[#c3c6d7] hover:bg-[#f2f3ff] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-[#434655] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-[13px] font-medium text-[#131b2e]">Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#eaedff]"></div>
          </div>
          <div className="relative flex justify-center text-[11px] font-medium tracking-wider uppercase text-[#737686]">
            <span className="bg-white px-3">Fast Access</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-[#434655]">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-[13px]">Auto-Sync</span>
          </div>
          <div className="flex items-center gap-2 text-[#434655]">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-[13px]">Private</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#737686]">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[11px]">Secure, passwordless authentication</span>
          </div>
          <div className="text-[11px] text-[#737686] flex items-center justify-center gap-2">
            <a href="#" className="hover:text-[#131b2e] transition-colors">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-[#131b2e] transition-colors">Privacy</a>
            <span>•</span>
            <span>v1.0.0-beta</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
