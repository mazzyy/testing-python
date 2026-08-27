import { Link } from 'react-router-dom';
import { MapPin, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import type { University } from '../../types';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

interface UniversityCardProps {
    university: University;
}

export default function UniversityCard({ university }: UniversityCardProps) {
    const degreeColors: Record<string, 'primary' | 'success' | 'warning' | 'neutral'> = {
        Bachelor: 'primary',
        Masters: 'success',
        PhD: 'warning',
    };
    const universitySlug = encodeURIComponent(university.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));

    return (
        <Link to={`/universities/${universitySlug}`} >
            <Card hover className="p-6 group cursor-pointer transition-all duration-300 h-full">
                <div className="flex flex-col h-full">
                    {/* University Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-6 h-6 text-primary-600" />
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                        {university.name}
                    </h3>

                    {/* Location */}
                    {university.cities && university.cities.length > 0 && (
                        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 text-sm mb-4">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                                {university.cities.length === 1
                                    ? university.cities[0]
                                    : `${university.cities[0]} + ${university.cities.length - 1} more`}
                            </span>
                        </div>
                    )}

                    {/* Program count */}
                    <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400 text-sm mb-4">
                        <BookOpen className="w-4 h-4 text-surface-400" />
                        <span>{university.program_count} {university.program_count === 1 ? 'program' : 'programs'}</span>
                    </div>

                    {/* Degree types */}
                    {university.degree_types.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 flex-1">
                            {university.degree_types.map((type) => (
                                <Badge key={type} variant={degreeColors[type] || 'neutral'}>
                                    {type}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* View programs CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-700 mt-auto">
                        <span className="text-sm font-medium text-primary-600">View programs</span>
                        <ChevronRight className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </Card>
        </Link >
    );
}
