import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Zap,
    DollarSign,
    Users,
    Activity,
    ChevronDown,
    ChevronUp,
    Search,
    TrendingUp,
    Clock,
    Hash
} from 'lucide-react';
import { adminApi, UserUsageSummary, OperationBreakdown } from '../../api/admin';
import { Card, Badge } from '../../components/ui';

// Format number with commas
const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

// Format currency
const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(4)}`;
};

// Format date
const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
};

// Get operation type badge color
const getOperationColor = (type: string): 'primary' | 'success' | 'warning' | 'neutral' => {
    switch (type) {
        case 'match_score':
            return 'primary';
        case 'scholarship_eligibility':
            return 'success';
        case 'document_parse':
            return 'warning';
        case 'chat':
            return 'neutral';
        default:
            return 'neutral';
    }
};

// User usage row with expandable details
function UserUsageRow({ user }: { user: UserUsageSummary }) {
    const [expanded, setExpanded] = useState(false);

    // Fetch detailed usage when expanded
    const { data: details, isLoading: detailsLoading } = useQuery({
        queryKey: ['user-usage-details', user.user_id],
        queryFn: () => adminApi.getUserUsageDetails(user.user_id),
        enabled: expanded,
    });

    return (
        <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:bg-surface-900 cursor-pointer transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-semibold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{user.full_name || user.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-right flex-1">
                    <div className="hidden sm:block">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Requests</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(user.operation_count)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tokens</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(user.total_tokens)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cost</p>
                        <p className="font-semibold text-green-600">{formatCurrency(user.total_cost_usd)}</p>
                    </div>
                    <div className="flex items-center justify-end">
                        {expanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 dark:bg-surface-900 px-4 pb-4"
                >
                    {detailsLoading ? (
                        <div className="py-4 text-center text-gray-500 dark:text-gray-400">Loading details...</div>
                    ) : details ? (
                        <div className="space-y-4">
                            {/* Usage by operation */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Usage by Operation</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {details.usage_by_operation.map((op: OperationBreakdown) => (
                                        <div key={op.operation_type} className="flex items-center justify-between p-3 bg-white dark:bg-surface-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getOperationColor(op.operation_type)}>
                                                    {op.operation_type.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{op.request_count} requests</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900 dark:text-white">{formatNumber(op.total_tokens)}</p>
                                                <p className="text-xs text-green-600">{formatCurrency(op.total_cost_usd)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent usage */}
                            {details.recent_usage.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Activity</h4>
                                    <div className="space-y-1 max-h-60 overflow-y-auto">
                                        {details.recent_usage.slice(0, 50).map((record) => (
                                            <div key={record.id} className="flex items-center justify-between p-2 bg-white dark:bg-surface-800 rounded border border-gray-100 dark:border-gray-700 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getOperationColor(record.operation_type || 'unknown')} className="text-xs">
                                                        {(record.operation_type || 'unknown').replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-gray-500 dark:text-gray-400">{record.model}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                                                    <span>{formatNumber(record.total_tokens)} tokens</span>
                                                    <span className="text-green-600">{formatCurrency(record.cost_usd)}</span>
                                                    <span className="text-xs text-gray-400">{formatDate(record.created_at)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-gray-500 dark:text-gray-400">No usage data available</div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default function UsageTab() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Fetch overall stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['usage-stats'],
        queryFn: adminApi.getUsageStats,
    });

    // Fetch users usage
    const { data: usersUsage, isLoading: usersLoading } = useQuery({
        queryKey: ['users-usage', page, search],
        queryFn: () => adminApi.getUsersUsage({ page, page_size: 20, search: search || undefined }),
    });

    // Fetch breakdown
    const { data: breakdown, isLoading: breakdownLoading } = useQuery({
        queryKey: ['usage-breakdown'],
        queryFn: adminApi.getUsageBreakdown,
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Hash className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {statsLoading ? '...' : formatNumber(stats?.total_tokens || 0)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
                            <p className="text-2xl font-bold text-green-600">
                                {statsLoading ? '...' : formatCurrency(stats?.total_cost_usd || 0)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {statsLoading ? '...' : stats?.unique_users || 0}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <Activity className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {statsLoading ? '...' : formatNumber(stats?.total_requests || 0)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Usage Breakdown */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Usage by Operation Type
                </h3>
                {breakdownLoading ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading breakdown...</div>
                ) : breakdown?.breakdown && breakdown.breakdown.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {breakdown.breakdown.map((op) => (
                            <div
                                key={op.operation_type}
                                className="p-4 bg-gray-50 dark:bg-surface-900 rounded-lg border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant={getOperationColor(op.operation_type)}>
                                        {op.operation_type.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {op.request_count} requests
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            {formatNumber(op.total_tokens)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">tokens</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(op.total_cost_usd)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">cost</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No usage data yet</p>
                        <p className="text-sm">Token usage will appear here when users interact with AI features</p>
                    </div>
                )}
            </Card>

            {/* Per-User Usage Table */}
            <Card>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Usage by User
                        </h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {usersLoading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
                ) : usersUsage?.users && usersUsage.users.length > 0 ? (
                    <>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {usersUsage.users.map((user) => (
                                <UserUsageRow key={user.user_id} user={user} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {usersUsage.total > 20 && (
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, usersUsage.total)} of {usersUsage.total}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:bg-surface-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page * 20 >= usersUsage.total}
                                        className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:bg-surface-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No users with API usage found</p>
                        {search && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                )}
            </Card>
        </motion.div>
    );
}
