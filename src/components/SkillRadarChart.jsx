import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const SkillRadarChart = ({ studentStats, groupAverage }) => {
    // Data Structure: [Array, String, Hash Table, DP, Math, Sorting, Greedy, Depth-First Search]
    // We need to extract these from the complicated LeetCode tag structure.
    // For simplicity, let's assume we map the top 6 most common tags.

    const labels = ['Arrays', 'Strings', 'Hash Table', 'DP', 'Math', 'Trees'];

    const extractCount = (stats, tagName) => {
        if (!stats || !stats.advanced) return 0;
        // Search in all categories
        const allTags = [...(stats.advanced || []), ...(stats.intermediate || []), ...(stats.fundamental || [])];
        const tag = allTags.find(t => t.tagName === tagName);
        return tag ? tag.problemsSolved : 0;
    };

    const studentData = labels.map(l => extractCount(studentStats?.skillStats, l));
    // Mock group average for now if not calculated
    const groupData = groupAverage || [10, 15, 8, 5, 7, 6];

    const data = {
        labels,
        datasets: [
            {
                label: studentStats ? studentStats.username : 'Student',
                data: studentData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
            {
                label: 'Group Average',
                data: groupData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(128, 128, 128, 0.2)'
                },
                grid: {
                    color: 'rgba(128, 128, 128, 0.2)'
                },
                pointLabels: {
                    color: '#888' // Dark mode friendly-ish
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#888'
                }
            }
        }
    };

    return <Radar data={data} options={options} />;
};

export default SkillRadarChart;
