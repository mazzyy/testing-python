import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Search,
    User as UserIcon,
    Shield,
    Mail,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { adminApi, User } from '../../api/admin';
import { Card, Input, Badge, Button } from '../../components/ui';
import UserDetailModal from './UserDetailModal';

type SortField = 'user' | 'role' | 'status' | 'created_at' | 'last_login';
type SortDirection = 'asc' | 'desc';

export default function UsersTab() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const pageSize = 10;

    // Fetch users
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['admin-users', page, search, roleFilter, statusFilter],
        queryFn: () => adminApi.getUsers({
            page,
            page_size: pageSize,
            search: search || undefined,
            role: roleFilter === 'all' ? undefined : roleFilter,
            is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        }),
    });

    // Client-side sorting
    const sortedUsers = useMemo(() => {
        if (!usersData?.users) return [];
        const users = [...usersData.users];

        users.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'user':
                    cmp = (a.full_name || a.username).localeCompare(b.full_name || b.username);
                    break;
                case 'role':
                    cmp = a.role.localeCompare(b.role);
                    break;
                case 'status':
                    cmp = (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1;
                    break;
                case 'created_at':
                    cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                    break;
                case 'last_login':
                    cmp = new Date(a.last_login || 0).getTime() - new Date(b.last_login || 0).getTime();
                    break;
            }
            return sortDirection === 'asc' ? cmp : -cmp;
        });

        return users;
    }, [usersData?.users, sortField, sortDirection]);

    const totalPages = usersData ? Math.ceil(usersData.total / pageSize) : 0;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRoleBadgeVariant = (role: string) => {
        return role === 'admin' ? 'warning' : 'primary';
    };

    const handleUserClick = (user: User) => {
        setSelectedUserId(user.id);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection(field === 'created_at' || field === 'last_login' ? 'desc' : 'asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3 h-3 text-primary-600" />
            : <ArrowDown className="w-3 h-3 text-primary-600" />;
    };

    const thClass = "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors group";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex flex-col gap-3">
                    {/* Search Input */}
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Search by email, username, or name..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>

                    {/* Filters row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Role Filter */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                            <button
                                onClick={() => { setRoleFilter('all'); setPage(1); }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${roleFilter === 'all'
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                All Roles
                            </button>
                            <button
                                onClick={() => { setRoleFilter('admin'); setPage(1); }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${roleFilter === 'admin'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                <Shield className="w-3.5 h-3.5" />
                                Admins
                            </button>
                            <button
                                onClick={() => { setRoleFilter('user'); setPage(1); }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${roleFilter === 'user'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                <UserIcon className="w-3.5 h-3.5" />
                                Users
                            </button>
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                            <button
                                onClick={() => { setStatusFilter('all'); setPage(1); }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === 'all'
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                All Status
                            </button>
                            <button
                                onClick={() => { setStatusFilter('active'); setPage(1); }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Active
                            </button>
                            <button
                                onClick={() => { setStatusFilter('inactive'); setPage(1); }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'inactive'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Inactive
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Users Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-surface-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className={thClass} onClick={() => handleSort('user')}>
                                    <div className="flex items-center gap-1.5">
                                        User
                                        <SortIcon field="user" />
                                    </div>
                                </th>
                                <th className={thClass} onClick={() => handleSort('role')}>
                                    <div className="flex items-center gap-1.5">
                                        Role
                                        <SortIcon field="role" />
                                    </div>
                                </th>
                                <th className={thClass} onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1.5">
                                        Status
                                        <SortIcon field="status" />
                                    </div>
                                </th>
                                <th className={thClass} onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Created
                                        <SortIcon field="created_at" />
                                    </div>
                                </th>
                                <th className={thClass} onClick={() => handleSort('last_login')}>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        Last Login
                                        <SortIcon field="last_login" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-surface-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium">No users found</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 dark:hover:bg-surface-900 cursor-pointer transition-colors"
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {user.full_name || user.username}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                                                        <Mail className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                <div className="flex items-center gap-1">
                                                    {user.role === 'admin' ? (
                                                        <Shield className="w-3 h-3" />
                                                    ) : (
                                                        <UserIcon className="w-3 h-3" />
                                                    )}
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </div>
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_active ? (
                                                <Badge variant="success">
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Active
                                                    </div>
                                                </Badge>
                                            ) : (
                                                <Badge variant="danger">
                                                    <div className="flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" />
                                                        Inactive
                                                    </div>
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(user.last_login)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUserClick(user);
                                                }}
                                                leftIcon={<Eye className="w-4 h-4" />}
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {usersData && usersData.total > pageSize && (
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, usersData.total)} of {usersData.total} users
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                leftIcon={<ChevronLeft className="w-4 h-4" />}
                            >
                                <span className="hidden sm:inline">Previous</span>
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                                    ? 'bg-primary-600 text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                rightIcon={<ChevronRight className="w-4 h-4" />}
                            >
                                <span className="hidden sm:inline">Next</span>
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* User Detail Modal */}
            {selectedUserId && (
                <UserDetailModal
                    userId={selectedUserId}
                    isOpen={selectedUserId !== null}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </motion.div>
    );
}
