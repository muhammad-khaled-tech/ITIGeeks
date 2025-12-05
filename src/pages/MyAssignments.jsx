import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import AssignmentCard from '../components/AssignmentCard';
import { FaTasks } from 'react-icons/fa';

export default function MyAssignments() {
    const { userData } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssignments = async () => {
            if (!userData) return;
            setLoading(true);
            try {
                // Fetch assignments for user's group or 'All'
                const q = query(
                    collection(db, 'assignments'),
                    where('targetGroup', 'in', [userData.groupId || 'All', 'All'])
                );
                const snap = await getDocs(q);
                const fetchedAssignments = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Sort by deadline (client-side to avoid complex index)
                fetchedAssignments.sort((a, b) => {
                    const dateA = a.deadline?.seconds || 0;
                    const dateB = b.deadline?.seconds || 0;
                    return dateA - dateB;
                });

                setAssignments(fetchedAssignments);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, [userData]);

    // Helper to calculate progress based on local user problems
    const calculateProgress = (assignmentProblems) => {
        if (!userData?.problems) return 0;

        let count = 0;
        assignmentProblems.forEach(p => {
            const isSolved = userData.problems.some(up =>
                (up.title === p.title) && up.status === 'Done'
            );
            if (isSolved) count++;
        });
        return count;
    };

    if (loading) return <div className="p-10 text-center dark:text-white">Loading Assignments...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 dark:text-white">
                <FaTasks className="text-brand" /> My Assignments
            </h1>

            {assignments.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-leet-card rounded shadow">
                    <p className="text-gray-500 dark:text-gray-400">No active assignments.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(a => (
                        <AssignmentCard
                            key={a.id}
                            assignment={a}
                            progress={calculateProgress(a.problems)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
