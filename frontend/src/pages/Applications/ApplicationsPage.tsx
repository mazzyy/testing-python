import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Calendar,
  MapPin,
  GraduationCap,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { profileApi, applicationsApi } from '../../api';
import { Card, Button, Badge, EmptyState, Modal } from '../../components/ui';
import type { Application } from '../../types';

const phaseConfig: Record<string, { label: string; color: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'; icon: React.ReactNode }> = {
  Documents: { label: 'Documents', color: 'neutral', icon: <FileText className="w-5 h-5 text-primary-500" /> },
  Application: { label: 'Application', color: 'primary', icon: <GraduationCap className="w-5 h-5 text-purple-500" /> },
  Admission: { label: 'Admission', color: 'success', icon: <CheckCircle className="w-5 h-5 text-success-500" /> },
  Finance: { label: 'Finance', color: 'warning', icon: <Building2 className="w-5 h-5 text-amber-500" /> },
  Visa: { label: 'Visa', color: 'danger', icon: <MapPin className="w-5 h-5 text-red-500" /> },
};

const statusConfig: Record<string, { label: string; color: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'neutral', icon: <FileText className="w-4 h-4" /> },
  submitted: { label: 'Submitted', color: 'primary', icon: <Clock className="w-4 h-4" /> },
  under_review: { label: 'Under Review', color: 'warning', icon: <AlertCircle className="w-4 h-4" /> },
  accepted: { label: 'Accepted', color: 'success', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: 'Rejected', color: 'danger', icon: <XCircle className="w-4 h-4" /> },
  withdrawn: { label: 'Withdrawn', color: 'neutral', icon: <XCircle className="w-4 h-4" /> },
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedProgressApp, setSelectedProgressApp] = useState<Application | null>(null);
  const [filterPhase, setFilterPhase] = useState<string>('all');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: profileApi.getApplications,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileApi.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeleteModalOpen(false);
      setSelectedApp(null);
    },
  });

  const handleDeleteClick = (app: Application) => {
    setSelectedApp(app);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedApp) {
      deleteMutation.mutate(selectedApp.id);
    }
  };

  const filteredApplications = applications?.filter(app =>
    filterPhase === 'all' || (app.current_phase || 'Documents') === filterPhase
  ) || [];

  const phaseCounts = applications?.reduce((acc, app) => {
    const phase = app.current_phase || 'Documents';
    acc[phase] = (acc[phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track and manage your program applications by phase
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => setFilterPhase('all')}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center h-32 ${filterPhase === 'all'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
              : 'border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-gray-300 dark:border-surface-600'
              }`}
          >
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{applications?.length || 0}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">All Applications</div>
          </button>

          {Object.entries(phaseConfig).map(([phase, config]) => (
            <button
              key={phase}
              onClick={() => setFilterPhase(phase)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center h-32 ${filterPhase === phase
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                : 'border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-gray-300 dark:border-surface-600'
                }`}
            >
              <div className="mb-2 p-2 bg-gray-50 dark:bg-surface-700/50 rounded-full">
                {config.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0">{phaseCounts[phase] || 0}</div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{config.label}</div>
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={filterPhase === 'all' ? "No applications yet" : `No applications in ${phaseConfig[filterPhase]?.label} phase`}
            description={filterPhase === 'all'
              ? "Start by browsing programs and saving the ones you're interested in."
              : "Try selecting a different filter to see other applications."
            }
            actionLabel={filterPhase === 'all' ? "Browse Programs" : undefined}
            onAction={filterPhase === 'all' ? () => window.location.href = '/programs' : undefined}
          />
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Program Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <GraduationCap className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {application.program?.program_name || 'Program Name'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {application.program?.university_name || 'University'}
                            </span>
                            {application.program?.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {application.program.city}
                              </span>
                            )}
                            {application.program?.degree_type && (
                              <Badge variant="neutral">
                                {application.program.degree_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {application.user_notes && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-surface-300 bg-gray-50 dark:bg-surface-900/50 p-3 rounded-lg border dark:border-surface-700/50">
                          <strong>Notes:</strong> {application.user_notes}
                        </p>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {new Date(application.created_at!).toLocaleDateString()}
                        </span>
                        {application.submitted_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <Badge
                        variant={statusConfig[application.status]?.color || 'neutral'}
                        className="flex items-center gap-1"
                      >
                        {statusConfig[application.status]?.icon}
                        {statusConfig[application.status]?.label || application.status}
                      </Badge>

                      {application.match_score && (
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Match: </span>
                          <span className={`font-semibold ${application.match_score >= 80 ? 'text-green-600' :
                            application.match_score >= 60 ? 'text-blue-600' :
                              'text-amber-600'
                            }`}>
                            {application.match_score}%
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 w-full mt-2 mb-2">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{application.checklist_progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${application.checklist_progress || 0}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProgressApp(application)}
                          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        >
                          <FileText className="w-4 h-4 mr-1" /> Steps
                        </Button>

                        {application.program?.url && (
                          <a
                            href={application.program.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <Link to={`/programs/${application.program ? application.program.slug : application.program_id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Link to={`/applications/${application.id}`}>
                          <Button size="sm">
                            Track Status
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(application)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Application"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete your application for{' '}
              <strong>{selectedApp?.program?.program_name}</strong>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={deleteMutation.isPending}
              >
                Delete Application
              </Button>
            </div>
          </div>
        </Modal>

        {/* Progress Summary Modal */}
        <ProgressSummaryModal
          application={selectedProgressApp}
          isOpen={!!selectedProgressApp}
          onClose={() => setSelectedProgressApp(null)}
        />
      </div>
    </div>
  );
}

function ProgressSummaryModal({ application, isOpen, onClose }: { application: Application | null, isOpen: boolean, onClose: () => void }) {
  // Uses applicationsApi imported at the top

  // Instead of complex fetching logic here, we'll try to use a query if isOpen is true
  // But since this is a sub-component, we should probably just use the useQuery hook 
  // dependent on application?.id

  // NOTE: To fix potential import issues, ensure applicationsApi is imported at top or passed down.
  // Assuming 'applicationsApi' is available from '../../api' as used in other files.

  const { data: tracker, isLoading } = useQuery({
    queryKey: ['tracker', application?.id],
    queryFn: () => application ? applicationsApi.getTracker(application.id) : null,
    enabled: !!application && isOpen
  });

  if (!application) return null;

  const completedItems = tracker?.checklist.filter((i: any) => i.status === 'completed') || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Progress: ${application.program?.program_name}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Completion</span>
          <span className="text-sm font-bold text-primary-600">{application.checklist_progress || 0}%</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${application.checklist_progress || 0}%` }}></div>
        </div>

        <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Completed Steps</h4>

        {isLoading ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400"><div className="animate-spin inline-block w-4 h-4 border-2 border-primary-600 rounded-full border-t-transparent"></div> Loading details...</div>
        ) : completedItems.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">No steps completed yet.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {completedItems.map((item: any) => (
              <div key={item.id} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{item.item_name}</span>
                  {item.category && <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 lowercase">{item.category.replace('_', ' ')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
