import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaTasks, FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';

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
        return <div className="p-10 text-center dark:text-white">Loading Assignment...</div>;
    }

    if (!assignment) {
        return <div className="p-10 text-center text-red-500">Assignment not found.</div>;
    }

    const solvedProblems = assignment.problems.filter(p =>
        userData?.problems?.some(up => up.title === p.title && up.status === 'Done')
    );

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white dark:bg-leet-card rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <FaTasks className="text-brand" />
                    {assignment.title}
                </h1>

                {assignment.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{assignment.description}</p>
                )}

                <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        <strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        <strong>Progress:</strong> {solvedProblems.length} / {assignment.problems.length} completed
                    </p>
                </div>

                <h2 className="text-xl font-bold mb-4 dark:text-white">Problems</h2>
                <ul className="space-y-3">
                    {assignment.problems.map((problem, index) => {
                        const isSolved = userData?.problems?.some(
                            up => up.title === problem.title && up.status === 'Done'
                        );

                        return (
                            <li key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-leet-input rounded">
                                {isSolved ? (
                                    <FaCheckCircle className="text-green-500 flex-shrink-0" />
                                ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                                )}
                                <span className="flex-grow dark:text-gray-300">{problem.title}</span>
                                <a
                                    href={`https://leetcode.com/problems/${problem.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand hover:text-brand-hover flex items-center gap-1"
                                >
                                    <FaExternalLinkAlt size={12} />
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default AssignmentDetail;
