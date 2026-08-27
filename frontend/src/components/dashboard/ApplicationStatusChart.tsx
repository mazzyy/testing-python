import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';
import { Card } from '../ui';
import type { Application } from '../../types';

interface ApplicationStatusChartProps {
    applications: Application[];
}

export default function ApplicationStatusChart({ applications }: ApplicationStatusChartProps) {
    // Count statuses
    const statusCounts = applications.reduce((acc, app) => {
        const status = app.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
        value,
    }));

    const COLORS = {
        submitted: '#3b82f6', // blue
        accepted: '#22c55e',  // green
        rejected: '#ef4444',  // red
        in_progress: '#f59e0b', // amber
        draft: '#64748b',      // slate-500
        unknown: '#cbd5e1',    // slate-300
    };

    const getColor = (status: string) => {
        const key = status.toLowerCase() as keyof typeof COLORS;
        return COLORS[key] || COLORS.unknown;
    };

    if (applications.length === 0) {
        return null;
    }

    const totalApps = applications.length;

    return (
        <Card className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Applications Overview</h3>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                            ))}
                            <Label
                                value={totalApps.toString()}
                                position="center"
                                className="text-3xl font-bold fill-surface-900"
                                dy={-10}
                            />
                            <Label
                                value="Total"
                                position="center"
                                className="text-sm fill-surface-500"
                                dy={15}
                            />
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
