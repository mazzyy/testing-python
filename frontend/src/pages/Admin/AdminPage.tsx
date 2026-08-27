import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import novaToast from '../../components/nova/NovaToast';
import {
  Users,
  GraduationCap,
  Upload,
  Database,
  UserCheck,
  UserX,
  Shield,
  RefreshCw,
  FileJson,
  BarChart3,
  Building2,
  MapPin,
  ClipboardList,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { programsApi, adminApi, scholarshipsApi } from '../../api'; import { Card, Button, Badge, Modal } from '../../components/ui';
import UsersTab from './UsersTab';
import UsageTab from './UsageTab';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'programs' | 'import' | 'usage'>('overview');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importScholarshipFile, setImportScholarshipFile] = useState<File | null>(null);
  const [indexModalOpen, setIndexModalOpen] = useState(false);

  // Fetch program statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['program-stats'],
    queryFn: programsApi.getStatistics,
  });

  // Fetch user statistics
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: adminApi.getUserStats,
  });

  // Index programs mutation
  const indexMutation = useMutation({
    mutationFn: (forceReload: boolean) => programsApi.indexPrograms(forceReload),
    onSuccess: (data) => {
      novaToast.success(`Successfully indexed ${data.indexed_count} programs`);
      setIndexModalOpen(false);
    },
    onError: () => {
      novaToast.error('Failed to index programs');
    },
  });

  // Import programs mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => programsApi.importPrograms(file),
    onSuccess: (data) => {
      novaToast.success(`Imported ${data.imported} programs (${data.skipped} skipped)`);
      queryClient.invalidateQueries({ queryKey: ['program-stats'] });
      setImportFile(null);
    },
    onError: () => {
      novaToast.error('Failed to import programs');
    },
  });

  // Import scholarships mutation
  const importScholarshipMutation = useMutation({
    mutationFn: (file: File) => scholarshipsApi.importScholarships(file),
    onSuccess: (data) => {
      novaToast.success(`Imported ${data.imported} scholarships (${data.skipped} skipped) and indexed ${data.indexed || 0}`);
      setImportScholarshipFile(null);
    },
    onError: () => {
      novaToast.error('Failed to import scholarships');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      setImportFile(file);
    } else {
      novaToast.error('Please select a JSON file');
    }
  };

  const handleScholarshipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      setImportScholarshipFile(file);
    } else {
      novaToast.error('Please select a JSON file');
    }
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  const handleScholarshipImport = () => {
    if (importScholarshipFile) {
      importScholarshipMutation.mutate(importScholarshipFile);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'usage', label: 'API Usage', icon: <Zap className="w-4 h-4" /> },
    { id: 'programs', label: 'Programs', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'import', label: 'Import Data', icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage programs, users, and system settings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap text-sm sm:text-base ${activeTab === tab.id
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:text-gray-300'
                }`}
            >
              {tab.icon}
              <span className="sm:inline hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* User Stats Grid */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {userStatsLoading ? '...' : userStats?.total_users || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {userStatsLoading ? '...' : userStats?.active_users || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <Shield className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Admins</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {userStatsLoading ? '...' : userStats?.admin_count || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <ClipboardList className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">With Applications</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {userStatsLoading ? '...' : userStats?.users_with_applications || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Additional User Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Verified</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {userStatsLoading ? '...' : userStats?.verified_users || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Unverified</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {userStatsLoading ? '...' : userStats?.unverified_users || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">With Profile</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {userStatsLoading ? '...' : userStats?.users_with_profile || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Inactive</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {userStatsLoading ? '...' : userStats?.inactive_users || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Program Stats Grid */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Program Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Programs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? '...' : stats?.total_programs || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Programs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? '...' : stats?.active_programs || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Universities</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? '...' : stats?.unique_universities || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <MapPin className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cities</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? '...' : stats?.unique_cities || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Programs by Degree Type */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Programs by Degree Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats?.by_degree_type && Object.entries(stats.by_degree_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        type === 'Bachelor' ? 'primary' :
                          type === 'Masters' ? 'success' : 'warning'
                      }>
                        {type}
                      </Badge>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button
                  leftIcon={<Database className="w-4 h-4" />}
                  onClick={() => setIndexModalOpen(true)}
                >
                  Index Programs for Search
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['program-stats'] });
                    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
                  }}
                >
                  Refresh Statistics
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && <UsersTab />}

        {/* Usage Tab */}
        {activeTab === 'usage' && <UsageTab />}

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Program Management</h3>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    leftIcon={<Database className="w-4 h-4" />}
                    onClick={() => setIndexModalOpen(true)}
                  >
                    Re-index Programs
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-surface-900 rounded-lg p-8 text-center">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Program List</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  View and manage all programs from the Programs page.
                </p>
                <a href="/programs">
                  <Button>Go to Programs</Button>
                </a>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Programs from JSON</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload a JSON file containing program data. The file should be an array of program objects
                with fields like program_id, program_name, university_name, etc.
              </p>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                <div className="mb-4">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="json-upload"
                  />
                  <label
                    htmlFor="json-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-surface-900 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Select JSON File
                  </label>
                </div>

                {importFile && (
                  <div className="mb-4">
                    <Badge variant="success" className="text-sm">
                      Selected: {importFile.name}
                    </Badge>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!importFile}
                  isLoading={importMutation.isPending}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Import Programs
                </Button>
              </div>

              {/* Import Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg mb-8">
                <h4 className="font-medium text-blue-900 mb-2">Expected JSON Format:</h4>
                <pre className="text-xs text-blue-800 overflow-x-auto">
                  {`[
                          {
                            "program_id": "unique-id",
                            "program_name": "Computer Science",
                            "university_name": "TU Munich",
                            "city": "Munich",
                            "degree": "Master of Science",
                            "teaching_language": ["English"],
                            "description_content": "...",
                            "academic_admission_requirements": "...",
                            "language_requirements": "...",
                            "application_deadline": "...",
                            "url": "https://..."
                          }
                      ]`}
                </pre>
              </div>

              {/* Scholarships Import Section */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-8 border-t pt-8">Import Scholarships from JSON</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload a JSON file containing scholarship data. The AI uses this for RAG index recommendations.
              </p>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-blue-50/50">
                <FileJson className="w-12 h-12 text-blue-400 mx-auto mb-4" />

                <div className="mb-4">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleScholarshipFileChange}
                    className="hidden"
                    id="scholarship-json-upload"
                  />
                  <label
                    htmlFor="scholarship-json-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Select Scholarship JSON
                  </label>
                </div>

                {importScholarshipFile && (
                  <div className="mb-4">
                    <Badge variant="success" className="text-sm">
                      Selected: {importScholarshipFile.name}
                    </Badge>
                  </div>
                )}

                <Button
                  onClick={handleScholarshipImport}
                  disabled={!importScholarshipFile}
                  isLoading={importScholarshipMutation.isPending}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Import Scholarships
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Index Modal */}
        <Modal
          isOpen={indexModalOpen}
          onClose={() => setIndexModalOpen(false)}
          title="Index Programs for Search"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              This will index all programs into the vector database for semantic search capabilities.
            </p>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Force reload will clear existing index and rebuild from scratch.
                This may take a few minutes for large datasets.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIndexModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => indexMutation.mutate(false)}
                isLoading={indexMutation.isPending}
              >
                Quick Index
              </Button>
              <Button
                onClick={() => indexMutation.mutate(true)}
                isLoading={indexMutation.isPending}
              >
                Force Reload
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

