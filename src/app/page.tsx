'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitMerge, Users, DollarSign, Activity } from 'lucide-react';
import { createClientForBrowser } from '@/utils/supabase/client';
import AuthForm from '@/components/AuthForm';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientForBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push('/groups');
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-8">
      <main className="flex w-full max-w-md flex-col items-center justify-center gap-8">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <GitMerge className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900">Split</h1>
          <p className="text-lg text-gray-600 max-w-sm">
            Share expenses with friends and settle up easily
          </p>
        </div>

        {/* Sign in Card */}
        <AuthForm />

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 w-full mt-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Split with friends</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-teal-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Track expenses</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">Settle up</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </main>
    </div>
  );
}
