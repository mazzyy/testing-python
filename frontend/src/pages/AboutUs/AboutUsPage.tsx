import { motion } from 'framer-motion';
import { GraduationCap, Users, Target, Globe, BookOpen, Star, Sparkles } from 'lucide-react';
import SEO from '../../components/common/SEO';

const stats = [
    { label: 'Students Helped', value: '10,000+', icon: Users },
    { label: 'Universities', value: '400+', icon: GraduationCap },
    { label: 'Programs', value: '20,000+', icon: BookOpen },
    { label: 'Success Rate', value: '95%', icon: Star },
];

const values = [
    {
        title: 'Student-First Approach',
        description: 'Every decision we make is guided by what will best serve international students in their journey to Germany.',
        icon: Users,
    },
    {
        title: 'AI-Powered Precision',
        description: 'We leverage cutting-edge AI to match you with programs where you have the highest probability of admission and success.',
        icon: Target,
    },
    {
        title: 'Complete Transparency',
        description: 'No hidden fees or biased recommendations. We provide clear, objective information to help you make informed decisions.',
        icon: Globe,
    },
];

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800">
            <SEO
                title="About UniAdvisorAI — Our Mission to Simplify Studying in Germany"
                description="UniAdvisorAI is a free AI-powered platform helping international students navigate German university applications, scholarships, visas & more. Meet the team behind the tools."
                keywords={['about uniadvisorai', 'study in germany platform', 'AI education consultant', 'AI university match', 'free study abroad tools']}
            />

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] dark:opacity-[0.05]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-surface-900/50 dark:to-surface-900" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-6 border border-indigo-100 dark:border-indigo-500/20">
                            <Sparkles className="w-4 h-4" />
                            <span>Revolutionizing Education Guidance</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                            Your compass for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                studying in Germany
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 dark:text-surface-300 leading-relaxed max-w-2xl mx-auto">
                            We're on a mission to democratize access to global education by making the university application process transparent, data-driven, and accessible to everyone.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-12 bg-white/50 dark:bg-surface-800/50 border-y border-slate-200/50 dark:border-surface-700/50 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm font-medium text-slate-500 dark:text-surface-400">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Our Story */}
            <div className="py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="prose prose-lg dark:prose-invert max-w-none"
                        >
                            <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
                            <p>
                                Navigating the complexities of international university applications can be overwhelming. From understanding minimum GPA requirements to deciphering visa processes and calculating the true cost of living, students often find themselves lost in a sea of fragmented, outdated information.
                            </p>
                            <p>
                                UniAdvisorAI was born out of this frustration. We recognized that while Germany offers some of the world's best tuition-free education, the barrier to entry isn't academic capability—it's informational clarity.
                            </p>
                            <p>
                                By combining advanced artificial intelligence with an exhaustive database of German public and private universities, we've created a platform that doesn't just list programs; it intelligently matches you with the institutions where you're most likely to thrive and get accepted.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Values Section */}
            <div className="py-24 bg-slate-50 dark:bg-surface-800">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Our Core Values</h2>
                        <p className="text-slate-600 dark:text-surface-300">
                            The principles that guide our platform and how we support our international student community.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-surface-900 rounded-2xl p-8 border border-slate-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                        {value.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-surface-300 leading-relaxed">
                                        {value.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 container mx-auto px-4">
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 md:p-12 lg:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative z-10 max-w-2xl mx-auto"
                    >
                        <GraduationCap className="w-16 h-16 mx-auto mb-6 text-indigo-300" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start your journey?</h2>
                        <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                            Join thousands of students who have already found their perfect university program in Germany using our AI platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/register"
                                className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl"
                            >
                                Get Started Free
                            </a>
                            <a
                                href="/programs"
                                className="px-8 py-4 bg-indigo-800/50 text-white rounded-xl font-semibold hover:bg-indigo-800 transition-colors border border-indigo-700"
                            >
                                Browse Programs
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
