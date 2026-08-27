import { Link } from 'react-router-dom';
import { ExternalLink, Clock, Users, Calendar, CheckCircle } from 'lucide-react';
import type { Scholarship } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface ScholarshipCardProps {
    scholarship: Scholarship;
}

export default function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
    return (
        <Card hover className="p-6 flex flex-col h-full relative group">
            <Link to={`/scholarships/${scholarship.id}`} className="absolute inset-0 z-0">
                <span className="sr-only">View {scholarship.title}</span>
            </Link>

            {/* Title */}
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 line-clamp-2 mb-3 transition-colors z-10 relative pointer-events-none">
                {scholarship.title}
            </h3>

            {/* Quick Info */}
            <div className="space-y-2 text-sm mb-4 flex-1 pointer-events-none">
                {scholarship.duration && (
                    <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
                        <Clock className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{scholarship.duration}</span>
                    </div>
                )}
                {scholarship.deadline && (
                    <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
                        <Calendar className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{scholarship.deadline}</span>
                    </div>
                )}
                {scholarship.value_benefits && (
                    <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
                        <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{scholarship.value_benefits}</span>
                    </div>
                )}
                {scholarship.eligibility && (
                    <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
                        <Users className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{scholarship.eligibility}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-surface-100 dark:border-surface-700 mt-auto z-10 relative">
                <Link to={`/scholarships/${scholarship.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                        View Details
                    </Button>
                </Link>
                {scholarship.link && (
                    <a href={scholarship.link} target="_blank" rel="noopener noreferrer" className="z-20">
                        <Button variant="ghost" size="sm" className="btn-icon">
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </a>
                )}
            </div>
        </Card>
    );
}
