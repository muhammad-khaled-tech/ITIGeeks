import React from 'react';

const Heatmap = ({ problems }) => {
    // Generate last 365 days
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    // Map submissions
    const submissionCounts = {};
    problems.forEach(p => {
        if (p.status === 'Done' && p.completedDate) {
            const date = p.completedDate.split('T')[0];
            submissionCounts[date] = (submissionCounts[date] || 0) + 1;
        }
    });

    return (
        <div className="bg-white dark:bg-leet-card p-4 rounded-lg shadow overflow-x-auto">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">Activity Heatmap</h3>
            <div className="flex justify-center">
                <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                    {days.map(date => {
                        const count = submissionCounts[date] || 0;
                        let colorClass = 'bg-gray-200 dark:bg-gray-700';
                        if (count > 0) colorClass = 'bg-green-200';
                        if (count > 2) colorClass = 'bg-green-400';
                        if (count > 4) colorClass = 'bg-green-600';
                        if (count > 6) colorClass = 'bg-green-800';

                        return (
                            <div
                                key={date}
                                className={`w-3 h-3 rounded-sm ${colorClass}`}
                                title={`${date}: ${count} submissions`}
                            ></div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Heatmap;
