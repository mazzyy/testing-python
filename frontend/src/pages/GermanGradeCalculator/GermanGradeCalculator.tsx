import { useState } from 'react';
import { Calculator, RotateCcw, HelpCircle, GraduationCap, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import SEO from '../../components/common/SEO';

const GRADING_SCALES = [
    { id: 'pk-usa-4', name: '4.0 Scale (USA/Pakistan/etc.)', max: 4.0, min: 2.0 },
    { id: 'india-10', name: '10.0 Scale (India)', max: 10.0, min: 4.0 }, // Commonly 4.0 is passing in 10-point
    { id: 'uk-70', name: '70 Scale (UK Honours %)', max: 70.0, min: 40.0 },
    { id: 'percent-100', name: '100% (Percentage)', max: 100, min: 40 }, // Commonly 40% is passing
    { id: 'custom', name: 'Custom Scale', max: null, min: null },
];

export default function GermanGradeCalculator() {
    const [selectedScaleId, setSelectedScaleId] = useState<string>('pk-usa-4');
    const [maxGrade, setMaxGrade] = useState<string>('4.0');
    const [minGrade, setMinGrade] = useState<string>('2.0');
    const [currentGrade, setCurrentGrade] = useState<string>('');
    const [result, setResult] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Schema for AEO (Answer Engine Optimization)
    const calculatorSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "German Grade Calculator (Modified Bavarian Formula)",
        "url": "https://www.uniadvisorai.com/german-grade-calculator",
        "description": "Convert your international GPA or percentage to the German grading system (1.0 - 4.0) using the Modified Bavarian Formula.",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR"
        },
        "featureList": "Convert GPA, Calculate German Grade, Modified Bavarian Formula, University Admission Grading"
    };

    const handleScaleChange = (scaleId: string) => {
        setSelectedScaleId(scaleId);
        const scale = GRADING_SCALES.find(s => s.id === scaleId);
        if (scale && scaleId !== 'custom') {
            setMaxGrade(scale.max!.toString());
            setMinGrade(scale.min!.toString());
            setError(null);
        } else if (scaleId === 'custom') {
            setMaxGrade('');
            setMinGrade('');
        }
    };

    const calculateGrade = () => {
        setError(null);
        const pmax = parseFloat(maxGrade);
        const pmin = parseFloat(minGrade);
        const p = parseFloat(currentGrade);

        if (isNaN(pmax) || isNaN(pmin) || isNaN(p)) {
            setError('Please fill in all fields with valid numbers');
            return;
        }

        if (pmax <= pmin) {
            setError('Maximum grade must be greater than minimum passing grade');
            return;
        }

        if (p > pmax) {
            setError('Your grade cannot be higher than the maximum grade');
            return;
        }

        // Modified Bavarian Formula
        // N = 1 + 3 * (Pmax - P) / (Pmax - Pmin)
        const germanGrade = 1 + 3 * (pmax - p) / (pmax - pmin);

        // Round to 1 decimal place
        setResult(Math.round(germanGrade * 10) / 10);
    };

    const resetCalculator = () => {
        handleScaleChange('pk-usa-4');
        setCurrentGrade('');
        setResult(null);
        setError(null);
    };

    const getGradeDescription = (grade: number) => {
        if (grade <= 1.5) return { text: 'Outstanding (Sehr Gut)', color: 'text-green-600', bg: 'bg-green-100' };
        if (grade <= 2.5) return { text: 'Good (Gut)', color: 'text-emerald-600', bg: 'bg-emerald-100' };
        if (grade <= 3.5) return { text: 'Satisfactory (Befriedigend)', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        if (grade <= 4.0) return { text: 'Sufficient (Ausreichend)', color: 'text-orange-600', bg: 'bg-orange-100' };
        return { text: 'Fail (Mangelhaft/Ungenügend)', color: 'text-red-600', bg: 'bg-red-100' };
    };

    return (
        <>
            <SEO
                title="German Grade Calculator — Convert GPA to German Scale | Free Tool"
                description="Convert your GPA or percentage to the German grading system (1.0–4.0) using the Modified Bavarian Formula. Free instant calculator for university applications in Germany [2025 Updated]."
                keywords={['german grade calculator', 'german gpa calculator', 'german gpa converter', 'german grade conversion', 'german grades converter', 'german grading conversion', 'german grading system to gpa calculator', 'conversion to german grading system', 'german grade', 'bavarian formula', 'gpa conversion germany', 'uni assist grade calculator', 'university admission germany grade']}
                canonical="https://uniadvisor.ai/german-grade-calculator"
                schema={calculatorSchema}
            />

            <div className="min-h-screen bg-gray-50 dark:bg-surface-900 pt-24 pb-12">
                <div className="page-container max-w-6xl">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 font-medium text-sm mb-4">
                            <Info className="w-4 h-4" />
                            <span>Updated for Winter Semester 2025 Applications</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            German Grade Calculator
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            German universities use a descending 1.0 to 4.0 grading scale, where 1.0 is the best possible grade.
                            Use our calculator below to see where you stand.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                        {/* LEFT COLUMN: Calculator */}
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-primary-100 rounded-xl">
                                        <Calculator className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Calculate Your Grade</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Scale Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Select your Grading System
                                        </label>
                                        <select
                                            value={selectedScaleId}
                                            onChange={(e) => handleScaleChange(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                        >
                                            {GRADING_SCALES.map((scale) => (
                                                <option key={scale.id} value={scale.id}>
                                                    {scale.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Input Fields */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Your Obtained Grade/CGPA
                                            </label>
                                            <input
                                                type="number"
                                                value={currentGrade}
                                                onChange={(e) => setCurrentGrade(e.target.value)}
                                                placeholder={selectedScaleId === 'percent-100' ? "e.g. 85" : "e.g. 3.5"}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors font-medium bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {selectedScaleId === 'custom' && (
                                            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Max Grade (Best)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={maxGrade}
                                                        onChange={(e) => setMaxGrade(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Min Passing Grade
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={minGrade}
                                                        onChange={(e) => setMinGrade(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2">
                                            <HelpCircle className="w-5 h-5 shrink-0" />
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={calculateGrade}
                                        className="w-full text-lg font-semibold py-4"
                                        size="lg"
                                    >
                                        Convert Grade
                                    </Button>

                                    <p className="text-center text-xs text-gray-400">
                                        Results are estimates based on the Modified Bavarian Formula.
                                    </p>
                                </div>
                            </div>

                            {/* Result Display */}
                            {result !== null && (
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden text-white animate-scale-in">
                                    <div className="p-8 text-center">
                                        <h3 className="text-gray-300 font-medium mb-2 uppercase tracking-wide text-sm">Your German Grade Equivalent</h3>
                                        <div className="text-7xl font-bold text-white mb-4 tracking-tighter">
                                            {result.toFixed(1)}
                                        </div>
                                        <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-6 ${result <= 1.5 ? 'bg-green-500 text-white' :
                                            result <= 2.5 ? 'bg-emerald-500 text-white' :
                                                result <= 3.5 ? 'bg-yellow-500 text-black' :
                                                    result <= 4.0 ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
                                            }`}>
                                            {getGradeDescription(result).text.split('(')[0]}
                                        </div>

                                        <div className="h-px bg-white/10 my-6" />

                                        <div className="flex justify-center gap-4">
                                            <Button
                                                variant="outline"
                                                className="border-white/20 text-white hover:bg-white/10"
                                                onClick={resetCalculator}
                                                leftIcon={<RotateCcw className="w-4 h-4" />}
                                            >
                                                Calculate Another
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Info & Explanations */}
                        <div className="space-y-6">
                            {/* Grading Table */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 bg-gray-50 dark:bg-surface-900 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        <h3 className="font-bold text-gray-900 dark:text-white">Grading System Explained</h3>
                                    </div>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-surface-900 text-gray-500 dark:text-gray-400">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-medium">German Grade</th>
                                                <th className="px-6 py-3 text-left font-medium">Description</th>
                                                <th className="px-6 py-3 text-left font-medium">Approx. US GPA</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            <tr className="hover:bg-gray-50 dark:bg-surface-900">
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">1.0 - 1.5</td>
                                                <td className="px-6 py-4 text-green-600 font-medium">Sehr Gut (Very Good)</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">3.7 - 4.0</td>
                                            </tr>
                                            <tr className="hover:bg-gray-50 dark:bg-surface-900">
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">1.6 - 2.5</td>
                                                <td className="px-6 py-4 text-emerald-600 font-medium">Gut (Good)</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">3.0 - 3.6</td>
                                            </tr>
                                            <tr className="hover:bg-gray-50 dark:bg-surface-900">
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">2.6 - 3.5</td>
                                                <td className="px-6 py-4 text-yellow-600 font-medium">Befriedigend (Satisfactory)</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">2.3 - 2.9</td>
                                            </tr>
                                            <tr className="hover:bg-gray-50 dark:bg-surface-900">
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">3.6 - 4.0</td>
                                                <td className="px-6 py-4 text-orange-600 font-medium">Ausreichend (Sufficient)</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">2.0 - 2.2</td>
                                            </tr>
                                            <tr className="hover:bg-gray-50 dark:bg-surface-900 bg-red-50/30">
                                                <td className="px-6 py-4 font-bold text-red-600">4.1 - 5.0</td>
                                                <td className="px-6 py-4 text-red-600 font-medium">Nicht Ausreichend (Fail)</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">&lt; 2.0</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* The Formula Section */}
                            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary-500" />
                                    The Modified Bavarian Formula
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                                    The "Bayerische Formel" is the standard used by German universities and uni-assist to convert foreign grades.
                                </p>
                                <div className="bg-gray-100 dark:bg-surface-900 p-4 rounded-lg font-mono text-sm text-center mb-4 text-gray-800 dark:text-gray-100">
                                    Grade = 1 + 3 × <span className="text-primary-600">(Nmax - Nd)</span> / <span className="text-primary-600">(Nmax - Nmin)</span>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li><strong className="text-gray-900 dark:text-white">Nmax:</strong> The highest possible grade in your system.</li>
                                    <li><strong className="text-gray-900 dark:text-white">Nmin:</strong> The lowest passing grade in your system.</li>
                                    <li><strong className="text-gray-900 dark:text-white">Nd:</strong> Your obtained grade.</li>
                                </ul>
                            </div>

                            {/* FAQ Accordion-ish */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white px-2">Frequently Asked Questions</h3>
                                <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm dark:shadow-surface-900/50 border border-gray-100 dark:border-gray-700 p-5">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">What is a "Good" grade in Germany?</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Generally, a grade of <strong>2.5 or lower (numerically)</strong> is considered "Good" and is often the cutoff for Master's program admissions, though competitive programs may require 2.0 or 1.5.
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm dark:shadow-surface-900/50 border border-gray-100 dark:border-gray-700 p-5">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Why is 1.0 the best?</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Germany uses an ascending system for difficulty or "classes," but for grading, 1 is the 1st class (best) and 4 is the last passing class. Everything beyond 4 is a fail.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
