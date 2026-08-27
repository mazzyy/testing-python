import { Shield, Lock, FileText, Globe } from 'lucide-react';
import SEO from '../../components/common/SEO';

const PrivacyPolicyPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Privacy Policy - UniAdvisorAI"
                description="Learn how UniAdvisorAI collects, uses, and protects your personal data in compliance with GDPR."
                keywords={['privacy policy', 'GDPR compliance', 'data protection', 'UniAdvisorAI privacy', 'student data security']}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Privacy Policy",
                    "description": "UniAdvisorAI Privacy Policy and GDPR Compliance",
                    "url": "https://uniadvisorai.com/privacy-policy"
                }}
            />

            <div className="max-w-4xl mx-auto bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-primary-600 px-8 py-10 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-primary-100 font-medium tracking-wide text-sm uppercase">Legal Documentation</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-primary-100 text-lg max-w-2xl">
                        We are committed to transparency and protecting your data. This policy outlines our practices in compliance with GDPR.
                    </p>
                    <div className="mt-6 text-sm text-primary-200">
                        Last Updated: February 2026
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">1</span>
                            Introduction
                        </h2>
                        <p className="mb-4">
                            Welcome to <strong>UniAdvisorAI</strong> ("we," "our," or "us"). We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal data when you use our website and AI-powered university application assistant services (the "Service").
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <p className="text-blue-800 text-sm font-medium">
                                <strong>For users in Germany and the EU:</strong> This policy specifically addresses our obligations under the General Data Protection Regulation (GDPR).
                            </p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">2</span>
                            Data We Collect
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 dark:bg-surface-900 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary-500" /> profile Information
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li><strong>Identity:</strong> Name, Email address, Username.</li>
                                    <li><strong>Academic Profile:</strong> Educational background, GPA/Grades, University names, Degree types.</li>
                                    <li><strong>Preferences:</strong> Target countries, Budget, Funding needs.</li>
                                    <li><strong>Documents:</strong> CVs, Transcripts, SOPs, Cover Letters in your "Vault".</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 dark:bg-surface-900 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-orange-500" /> Credentials (Sensitive)
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li><strong>Portal Credentials:</strong> If you use our "Vault" to store credentials for university portals, we store the URLs, Usernames, and Passwords you provide.</li>
                                    <li className="mt-2 text-xs bg-orange-100 text-orange-800 p-2 rounded">
                                        <strong>Warning:</strong> While we take measures to secure this data, storing passwords for third-party sites carries inherent risks.
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 dark:bg-surface-900 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" /> Technical Data
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li><strong>Usage Data:</strong> Interactions with AI chat, search queries.</li>
                                    <li><strong>Device Data:</strong> IP address, browser type (collected automatically).</li>
                                    <li><strong>Cookies:</strong> We use Local Storage to store your session tokens.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">3</span>
                            How We Use Your Data
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-surface-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Legal Basis (GDPR)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-surface-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Providing the Service</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">Contractual Necessity (Art. 6(1)(b))</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">AI Recommendations</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">Consent (Art. 6(1)(a))</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Customer Support & Security</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">Legitimate Interest (Art. 6(1)(f))</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">4</span>
                            Sharing Your Data
                        </h2>
                        <p className="mb-4">We do not sell your personal data. We share data only with:</p>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="mt-1 min-w-1.5 min-h-1.5 rounded-full bg-primary-500" />
                                <div>
                                    <span className="font-semibold text-gray-900 dark:text-white">Azure OpenAI (Microsoft):</span> We use Azure OpenAI Service for AI features. Microsoft adheres to strict enterprise data privacy standards. Use of AI features implies consent to this processing.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="mt-1 min-w-1.5 min-h-1.5 rounded-full bg-primary-500" />
                                <div>
                                    <span className="font-semibold text-gray-900 dark:text-white">Service Providers:</span> Hosting and database providers (e.g., AWS, Vercel) strictly for operational purposes.
                                </div>
                            </li>
                        </ul>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-surface-900 rounded-lg text-sm">
                            <strong>International Transfers:</strong> Our AI processing via Microsoft Azure may involve data processing in EU or US data centers, protected under standard contractual clauses or data privacy frameworks.
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">5</span>
                            Your Rights & Retention
                        </h2>
                        <p className="mb-4">
                            We retain your data only as long as you have an account. You can request deletion at any time.
                        </p>
                        <h3 className="font-semibold mb-2">Under GDPR, you have the right to:</h3>
                        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Access your data</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Rectify inaccurate data</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Request deletion ("Right to be Forgotten")</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Restrict processing</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Data portability</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div> Object to processing</li>
                        </ul>
                        <p className="text-sm">
                            To exercise these rights, please contact us via the support email provided in the imprint.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
