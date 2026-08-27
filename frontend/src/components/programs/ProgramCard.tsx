import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, BookOpen, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { Program } from '../../types';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';
import MatchScore from './MatchScore';

interface ProgramCardProps {
  program: Program;
  matchScore?: number;
  matchReasons?: string[];
  onSave?: (program: Program) => void;
  isSaved?: boolean;
  compact?: boolean;
}

export default function ProgramCard({
  program,
  matchScore,
  matchReasons,
  onSave,
  isSaved,
  compact = false,
}: ProgramCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const degreeColors: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    Bachelor: 'primary',
    Masters: 'success',
    PhD: 'warning',
  };

  const getTeachingLanguage = () => {
    if (!program.teaching_language) return null;
    if (Array.isArray(program.teaching_language)) {
      return program.teaching_language.join(', ');
    }
    return program.teaching_language;
  };

  if (compact) {
    return (
      <Card hover className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/programs/${program.slug}`}
              className="font-semibold text-surface-900 dark:text-white hover:text-primary-600 line-clamp-1 transition-colors"
            >
              {program.program_name}
            </Link>
            <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">
              {program.university_name}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-surface-500 dark:text-surface-400">
              {program.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {program.city}
                </span>
              )}
              {program.degree_type && (
                <Badge variant={degreeColors[program.degree_type] || 'neutral'} className="text-xs">
                  {program.degree_type}
                </Badge>
              )}
            </div>
          </div>
          {matchScore !== undefined && (
            <MatchScore score={matchScore} size="sm" />
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      hover
      className={clsx(
        "p-6 group transition-all duration-300 flex flex-col h-full",
        !isExpanded && "min-h-[520px]" // Fixed min height when collapsed
      )}
    >
      <div className="flex flex-col h-full flex-1">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              {program.degree_type && (
                <Badge variant={degreeColors[program.degree_type] || 'neutral'}>
                  {program.degree_type}
                </Badge>
              )}
              {getTeachingLanguage() && (
                <Badge variant="neutral" className="text-xs">
                  {getTeachingLanguage()}
                </Badge>
              )}
            </div>
            <Link
              to={`/programs/${program.slug}`}
              className="text-lg font-semibold text-surface-900 dark:text-white hover:text-primary-600 line-clamp-2 transition-colors"
            >
              {program.program_name}
            </Link>
            <p className="text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {program.university_name}
            </p>
          </div>
          {matchScore !== undefined && (
            <MatchScore score={matchScore} />
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {program.city && (
            <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
              <MapPin className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
              <span className="break-words min-w-0 flex-1">{program.city}</span>
            </div>
          )}
          {program.programme_duration && (
            <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
              <Clock className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
              <span className="break-words min-w-0 flex-1">{program.programme_duration}</span>
            </div>
          )}
          {program.application_deadline && (
            <div className="flex items-start gap-2 text-surface-600 dark:text-surface-400 col-span-2">
              <Calendar className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
              <span className={clsx(
                "break-words min-w-0 flex-1",
                !isExpanded && "line-clamp-3"
              )}>
                <span className="font-medium">Deadline:</span> {program.application_deadline}
              </span>
            </div>
          )}
        </div>

        {/* Match reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-success-50 border border-success-100">
            <p className="text-xs font-medium text-success-700 mb-1">Why this matches:</p>
            <ul className="text-xs text-success-600 space-y-0.5">
              {(isExpanded ? matchReasons : matchReasons.slice(0, 3)).map((reason, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-success-500 shrink-0">•</span>
                  <span className="break-words min-w-0 flex-1">{reason}</span>
                </li>
              ))}
            </ul>
            {matchReasons.length > 3 && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-success-700 font-medium mt-1 hover:underline"
              >
                +{matchReasons.length - 3} more reasons
              </button>
            )}
          </div>
        )}

        {/* Description preview */}
        {program.description_content && (
          <div className="mb-4 flex-1 min-w-0">
            <p className={clsx(
              "text-sm text-surface-500 dark:text-surface-400 transition-all duration-300 break-words",
              !isExpanded && "line-clamp-3" // Show 3 lines when collapsed
            )}>
              {program.description_content}
            </p>
            {program.description_content.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-primary-600 font-medium mt-1 hover:underline flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    See less
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    See more
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-surface-100 dark:border-surface-700 mt-auto">
          <Link 
            to={`/programs/${program.slug}`} 
            className="flex-1 overflow-hidden"
            title={`View ${program.degree_type === 'Bachelor' ? 'BSc ' : program.degree_type === 'Masters' ? 'MSc ' : (program.degree_type ? program.degree_type + ' ' : '')}${program.program_name} at ${program.university_name}`}
          >
            <span className="sr-only">
              View {program.degree_type === 'Bachelor' ? 'BSc ' : program.degree_type === 'Masters' ? 'MSc ' : (program.degree_type ? program.degree_type + ' ' : '')}{program.program_name} at {program.university_name} (English)
            </span>
            <Button variant="primary" size="sm" className="w-full" aria-hidden="true">
              View Details
            </Button>
          </Link>
          {onSave && (
            <Button
              variant={isSaved ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onSave(program)}
              className={clsx(
                'btn-icon',
                isSaved && 'text-red-500'
              )}
            >
              <Heart className={clsx('w-4 h-4', isSaved && 'fill-current')} />
            </Button>
          )}
          {program.url && (
            <a href={program.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="btn-icon">
                {/* <ExternalLink className="w-4 h-4" /> */}
              </Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}