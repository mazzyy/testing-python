import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { Card } from '../ui';
import type { Application } from '../../types';

interface ApplicationProgressChartProps {
    application: Application;
}

export default function ApplicationProgressChart({ application }: ApplicationProgressChartProps) {
    // Determine progress based on status or actual progress
    const getProgress = (status: string) => {
        if (application.checklist_progress !== undefined) {
            return application.checklist_progress;
        }

        switch (status) {
            case 'submitted': return 60;
            case 'accepted': return 100;
            case 'rejected': return 100;
            case 'in_progress': return 30;
            default: return 10; // draft/unknown
        }
    };

    const progress = getProgress(application.status);
    const remaining = 100 - progress;

    const data = [
        { name: 'Completed', value: progress },
        { name: 'Remaining', value: remaining },
    ];

    const COLORS = {
        completed: application.status === 'accepted' ? '#22c55e' : '#3b82f6', // green or blue
        // In dark mode we want slate-700 (#334155) or surface-700, otherwise slate-200
        get remaining() {
            return document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0';
        }
    };

    return (
        <Card className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Application Progress</h3>
            <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="completed" fill={COLORS.completed} />
                            <Cell key="remaining" fill={COLORS.remaining} />
                            <Label
                                value={`${progress}%`}
                                position="center"
                                className="text-3xl font-bold fill-surface-900 dark:fill-white"
                                dy={0}
                            />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {application.program?.program_name || 'Application'}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">
                        Status: {application.status.replace('_', ' ')}
                    </p>
                </div>
            </div>
        </Card>
    );
}
