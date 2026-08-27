import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import novaToast from '../../components/nova/NovaToast';
import { authApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SEO from '../../components/common/SEO';

interface ResetPasswordForm {
    password: string;
    confirmPassword: string;
}

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();

    useEffect(() => {
        if (!token) {
            novaToast.error('Invalid password reset link.');
            navigate('/login');
        }
    }, [token, navigate]);

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) return;

        setIsLoading(true);
        try {
            await authApi.resetPassword(token, data.password);
            setIsSuccess(true);
            novaToast.success('Password reset! You can now log in.');

            // Optional: Auto redirect after few seconds
            setTimeout(() => navigate('/login'), 3000);

        } catch (error) {
            console.error('Reset password error:', error);
            novaToast.error('Failed to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
            <SEO title="Reset Password | CampusConsult" description="Create a new password." />
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-surface-800 p-8 rounded-xl shadow-lg">
                <div>
                    <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Lock className="h-6 w-6 text-primary-600" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Create a new strong password for your account.
                    </p>
                </div>

                {!isSuccess ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <Input
                                id="password"
                                type="password"
                                label="New Password"
                                placeholder="Enter new password"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 6,
                                        message: "Password must be at least 6 characters"
                                    }
                                })}
                                error={errors.password?.message}
                            />

                            <Input
                                id="confirmPassword"
                                type="password"
                                label="Confirm Password"
                                placeholder="Confirm new password"
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (val: string) => {
                                        if (watch('password') != val) {
                                            return "Your passwords do no match";
                                        }
                                    }
                                })}
                                error={errors.confirmPassword?.message}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                Reset Password
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-8 text-center space-y-6">
                        <div className="flex flex-col items-center justify-center text-green-600 space-y-2">
                            <CheckCircle className="w-12 h-12" />
                            <p className="text-lg font-medium">Password Reset Successful!</p>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            You can now log in with your new password.
                            Redirecting to login...
                        </p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/login')}
                        >
                            Go to Login
                        </Button>
                    </div>
                )}

                <div className="text-center mt-4">
                    <Link
                        to="/login"
                        className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
