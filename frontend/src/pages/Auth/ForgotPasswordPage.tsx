import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import novaToast from '../../components/nova/NovaToast';
import { authApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SEO from '../../components/common/SEO';

interface ForgotPasswordForm {
    email: string;
}

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword(data.email);
            setIsSubmitted(true);
            novaToast.success('Reset link sent! Check your inbox.');
        } catch (error) {
            console.error('Forgot password error:', error);
            novaToast.error('Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
            <SEO title="Forgot Password | CampusConsult" description="Reset your password." />
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-surface-800 p-8 rounded-xl shadow-lg">
                <div>
                    <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-primary-600" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Forgot Password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {!isSubmitted ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <Input
                                id="email"
                                type="email"
                                label="Email address"
                                placeholder="Enter your email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                                error={errors.email?.message}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 shadow-sm"
                                isLoading={isLoading}
                                rightIcon={<Send className="w-4 h-4 ml-2 text-white" />}
                            >
                                Send Reset Link
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-8 text-center space-y-6">
                        <div className="bg-green-50 p-4 rounded-md">
                            <p className="text-sm text-green-700">
                                If an account exists for that email, we have sent password reset instructions.
                                Please check your email.
                            </p>
                        </div>
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
