import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaTasks, FaCheckCircle, FaExternalLinkAlt, FaSync, FaChevronRight, FaRegCircle } from 'react-icons/fa';
import Breadcrumbs from '../components/Breadcrumbs';

const AssignmentDetail = () => {
    const { assignmentId } = useParams();
    const { userData } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const docRef = doc(db, 'assignments', assignmentId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setAssignment({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error('Error fetching assignment:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [assignmentId]);

    if (loading) {
        return <div className="p-10 text-center dark:text-white flex flex-col items-center gap-4">
            <FaSync className="animate-spin text-brand text-3xl" />
            <span>Loading Assignment...</span>
        </div>;
    }

    if (!assignment) {
        return <div className="p-10 text-center text-red-500">Assignment not found.</div>;
    }

    const solvedProblems = assignment.problems.filter(p => {
        const slug = typeof p === 'string' ? p : p.slug;
        const title = typeof p === 'string' ? p : p.title;
        return userData?.problems?.some(up => (up.titleSlug === slug || up.title === title) && up.status === 'Done');
    });

    const isFullySolved = solvedProblems.length === assignment.problems.length;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20">
            {/* Breadcrumbs */}
            <Breadcrumbs customLastLabel={assignment.title} />

            <div className="bg-white dark:bg-leet-card rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-leet-border">
                {/* Header Section */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-brand/5 to-transparent border-b dark:border-leet-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black italic mb-2 flex items-center gap-3 dark:text-white uppercase tracking-tight">
                                <FaTasks className="text-brand" />
                                {assignment.title}
                            </h1>
                            {assignment.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl">{assignment.description}</p>
                            )}
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                                isFullySolved ? 'bg-green-500/10 text-green-500' : 'bg-brand/10 text-brand'
                            }`}>
                                {solvedProblems.length} / {assignment.problems.length} COMPLETED
                            </span>
                            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">
                                Deadline: {new Date(assignment.deadline).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Problems List */}
                <div className="p-6 md:p-8">
                    <h2 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                        Assignment Problems
                    </h2>

                    {/* Sync Reminder */}
                    {!isFullySolved && (
                        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-xl flex items-start gap-3">
                            <FaSync className="text-yellow-600 dark:text-yellow-400 mt-1 animate-pulse" />
                            <div>
                                <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Needs Verification?</h4>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400/80 mt-1">
                                    After solving a problem on LeetCode, click the <strong>Sync</strong> button in the top navigation bar to automatically update your progress here.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {assignment.problems.map((problem, index) => {
                            const slug = typeof problem === 'string' ? problem : problem.slug;
                            const title = typeof problem === 'string' ? problem : problem.title;
                            const score = typeof problem === 'object' ? problem.score : null;

                            const isSolved = userData?.problems?.some(
                                up => (up.titleSlug === slug) || (up.title === title && up.status === 'Solved')
                            );

                            return (
                                <div 
                                    key={index} 
                                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                                        isSolved 
                                        ? "bg-green-50/50 dark:bg-green-900/5 border-green-100 dark:border-green-900/20" 
                                        : "bg-gray-50 dark:bg-leet-input border-transparent hover:border-brand/20 dark:hover:border-brand/30"
                                    }`}
                                >
                                    <div className="shrink-0">
                                        {isSolved ? (
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                                <FaCheckCircle size={18} />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-leet-border flex items-center justify-center text-gray-300 dark:text-leet-border group-hover:border-brand group-hover:text-brand transition-colors">
                                                <FaRegCircle size={16} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand transition-colors">
                                            {title}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            {score && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-200 dark:bg-leet-border rounded text-gray-500 dark:text-gray-400">
                                                    {score} POINTS
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                ID: {slug}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {isSolved ? (
                                            <span className="text-xs font-black text-green-600 dark:text-green-500 uppercase tracking-widest">
                                                SOLVED
                                            </span>
                                        ) : (
                                            <a
                                                href={`https://leetcode.com/problems/${slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95"
                                            >
                                                Solve <FaExternalLinkAlt size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetail;

