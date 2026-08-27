import { Scale, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import SEO from '../../components/common/SEO';

const TermsOfServicePage = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Terms of Service - CampusConsult"
                description="Terms of service and usage guidelines for CampusConsult."
                keywords={['terms of service', 'user agreement', 'legal', 'CampusConsult terms', 'conditions of use']}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Terms of Service",
                    "description": "CampusConsult Terms of Service and Usage Guidelines",
                    "url": "https://uniadvisorai.com/terms-of-service"
                }}
            />

            <div className="max-w-4xl mx-auto bg-white dark:bg-surface-800 rounded-2xl shadow-sm dark:shadow-surface-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-primary-600 px-8 py-10 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Scale className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-primary-100 font-medium tracking-wide text-sm uppercase">Legal Documentation</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-primary-100 text-lg max-w-2xl">
                        Please read these terms carefully before using CampusConsult. They outline what you can expect from us and what we expect from you.
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
                            Agreement to Terms
                        </h2>
                        <p className="mb-4">
                            By accessing or using <strong>CampusConsult</strong> (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">2</span>
                            Our Service
                        </h2>
                        <div className="bg-gradient-to-r from-primary-50 to-white p-6 rounded-xl border border-primary-100">
                            <p className="text-lg font-medium text-primary-800 mb-2">
                                Your Dedicated Digital Assistant
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                CampusConsult provides an intelligent, AI-powered platform designed to streamline your journey to German universities. We act as your educational coin-pilot, helping you find programs, track applications, and optimize your profile for success.
                            </p>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">3</span>
                            AI & Content Disclaimer
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" /> Commitment to Accuracy
                                </h3>
                                <p className="text-sm text-green-800">
                                    We are dedicated to ensuring our information is up-to-date and accurate to support your application journey. We continuously monitor for changes in university requirements. To ensure the highest level of certainty, we recommend cross-referencing with official sources.
                                </p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" /> Your Pathway to Success
                                </h3>
                                <p className="text-sm text-blue-800">
                                    Our mission is to provide you with the best guidance, tools, and strategic roadmaps to maximize your chances of admission and scholarships. We are here to empower your application process, while the final admission decision rests with the university.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-surface-900 border-l-4 border-gray-400 rounded-r-lg text-sm text-gray-600 dark:text-gray-400 italic">
                            Note: The content generated by our AI is for informational purposes and does not constitute legal or professional advice.
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">4</span>
                            User Responsibilities
                        </h2>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 min-w-1.5 min-h-1.5 rounded-full bg-primary-400"></div>
                                <p>You must provide accurate and complete information when creating an account.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 min-w-1.5 min-h-1.5 rounded-full bg-primary-400"></div>
                                <p>You are responsible for safeguarding your password and account access.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 min-w-1.5 min-h-1.5 rounded-full bg-primary-400"></div>
                                <p>You retain ownership of documents you upload, and grant us a license to process them for the Service.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 min-w-1.5 min-h-1.5 rounded-full bg-primary-400"></div>
                                <p>You agree not to use the Service for any unlawful purpose or reverse engineer our systems.</p>
                            </li>
                        </ul>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">5</span>
                            Limitation of Liability
                        </h2>
                        <div className="bg-gray-50 dark:bg-surface-900 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                To the maximum extent permitted by law, CampusConsult shall not be liable for indirect damages, loss of profits, or data.
                            </p>
                            <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                <p>Specifically, we are not liable for missed application deadlines, rejected applications, or visa refusals. We provide the tools, but the timeline and submission are your responsibility.</p>
                            </div>
                        </div>
                    </section>

                    {/* Footer of Terms */}
                    <section className="pt-6 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Governing Law</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            These Terms shall be governed and construed in accordance with the laws of Germany.
                        </p>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Us</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            If you have any questions about these Terms, please contact our support team.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;
