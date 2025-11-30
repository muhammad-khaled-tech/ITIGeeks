import React from 'react';
import { FaCalendarAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AssignmentCard = ({ assignment, progress, isStudent = true }) => {
    const { title, deadline, problems, id } = assignment;

    const total = problems.length;
    const solved = progress || 0;
    const percentage = Math.round((solved / total) * 100) || 0;

    const deadlineDate = new Date(deadline);
    const isOverdue = new Date() > deadlineDate && percentage < 100;

    const timeLeft = () => {
        const now = new Date();
        const diff = deadlineDate - now;
        if (diff < 0) return "Ended";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days} days left`;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours} hours left`;
    };

    return (
        <div className={`bg-white dark:bg-leet-card rounded-lg shadow-md p-4 border-l-4 ${isOverdue ? 'border-red-500' : 'border-brand'} hover:shadow-lg transition-shadow`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg dark:text-white">{title}</h3>
                {isOverdue && <FaExclamationCircle className="text-red-500" title="Overdue" />}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <FaCalendarAlt />
                <span className={isOverdue ? 'text-red-500 font-bold' : ''}>
                    {new Date(deadline).toLocaleDateString()} ({timeLeft()})
                </span>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1 dark:text-gray-300">
                    <span>Progress</span>
                    <span>{solved}/{total} Problems</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-leet-input rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full ${percentage === 100 ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-brand'}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>

            {isStudent ? (
                <Link
                    to={`/assignments/${id}`}
                    className="block w-full text-center bg-gray-100 dark:bg-leet-input hover:bg-gray-200 dark:hover:bg-gray-700 text-brand dark:text-brand-dark font-medium py-2 rounded transition-colors"
                >
                    View Details
                </Link>
            ) : (
                <div className="text-center text-sm text-gray-500">
                    {/* Supervisor specific actions could go here */}
                    Target: {assignment.targetGroup}
                </div>
            )}
        </div>
    );
};

export default AssignmentCard;
