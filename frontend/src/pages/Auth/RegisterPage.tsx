import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, User, GraduationCap, Check } from 'lucide-react';
import novaToast from '../../components/nova/NovaToast';
import { useAuthStore } from '../../store/authStore';
import type { RegisterData } from '../../types';
import { Button, Input } from '../../components/ui';
import SEO from '../../components/common/SEO';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, acceptTerms, ...registerData } = data;

    try {
      await registerUser(registerData);
      // Small delay to ensure localStorage is synced by Zustand persist
      await new Promise(resolve => setTimeout(resolve, 100));
      novaToast.success(`Account created! Welcome aboard${data.full_name ? `, ${data.full_name}` : ''}!`);
      navigate('/profile');
    } catch {
      // Error is handled by the store
    }
  };

  const benefits = [
    'AI-powered program recommendations',
    'Document parsing and profile building',
    'Application tracking dashboard',
    'Personalized match scores',
  ];

  return (
    <div className="min-h-screen flex">
      <SEO
        title="Create Account | UniAdvisorAI"
        description="Sign up for UniAdvisorAI to get free AI-powered university recommendations for studying in Germany."
        keywords={['register', 'sign up', 'create account', 'study in germany free']}
      />
      {/* Left side - Image/Decoration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-hero-pattern opacity-10" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold text-white mb-6">
            Start Your Journey to Germany
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Create an account to unlock personalized program recommendations and track your applications.
          </p>

          {/* Benefits list */}
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-surface-900 dark:text-white">
              Uni<span className="text-primary-600">Advisor</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              Create your account
            </h1>
            <p className="text-surface-500 dark:text-surface-400">
              Join us to find your perfect German university program
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
              label="Full Name"
              type="text"
              placeholder="John Doe"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            <Input
              label="Username"
              type="text"
              placeholder="johndoe"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Username can only contain letters, numbers, and underscores',
                },
              })}
            />

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
              helperText="At least 6 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                {...register('acceptTerms', {
                  required: 'You must accept the terms and conditions',
                })}
              />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-sm text-red-500 -mt-3">{errors.acceptTerms.message}</p>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <p className="mt-8 text-center text-surface-500 dark:text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
