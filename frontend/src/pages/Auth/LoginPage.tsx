import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import novaToast from '../../components/nova/NovaToast';
import { useQuery } from '@tanstack/react-query';
import { programsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { LoginCredentials } from '../../types';
import { Button, Input } from '../../components/ui';
import SEO from '../../components/common/SEO';
import { LogoMark } from '../../components/common/Logo';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['program-stats'],
    queryFn: programsApi.getStatistics,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
      // Small delay to ensure localStorage is synced by Zustand persist
      await new Promise(resolve => setTimeout(resolve, 100));

      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
        novaToast.success('Welcome back, Admin! Ready to manage things?');
      } else {
        novaToast.success(`Welcome back${user?.full_name ? `, ${user.full_name}` : ''}! Let's continue your journey.`);
        navigate(from, { replace: true });
      }
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEO
        title="Login | CampusConsult"
        description="Log in to your CampusConsult account to access personalized program recommendations and application tracking."
        keywords={['login', 'sign in', 'student portal', 'uniadvisorai login']}
      />
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <LogoMark className="w-10 h-10 rounded-xl shadow-lg shadow-primary-500/20" idSuffix="auth" />
            <span className="font-bold text-xl">
              <span className="text-surface-900 dark:text-white">Campus</span><span className="text-primary-600 dark:text-primary-400">Consult</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-surface-500 dark:text-surface-400">
              Sign in to continue to your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
              <button onClick={clearError} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-600 dark:text-surface-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-surface-500 dark:text-surface-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Decoration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-hero-pattern opacity-10" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">
            Discover Your Path to German Universities
          </h2>
          <p className="text-primary-100 text-lg">
            Join thousands of students who found their perfect program with our AI-powered recommendation system.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {stats?.total_programs || 0}
              </div>
              <div className="text-primary-200 text-sm">Programs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {stats?.unique_universities || 0}
              </div>
              <div className="text-primary-200 text-sm">Universities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {stats?.unique_cities || 0}
              </div>
              <div className="text-primary-200 text-sm">Cities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
