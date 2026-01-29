import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { FaTrophy, FaCalendarAlt, FaClock, FaArrowRight, FaPlus } from 'react-icons/fa';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ContestLobby() {
    const { userData, isAdmin } = useAuth();
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'contests'), orderBy('startTime', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allContests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Filter by group logic (client-side for simplicity, or complex query)
            const filtered = allContests.filter(c =>
                c.targetGroup === 'All' ||
                (userData?.groupId && c.targetGroup === userData.groupId)
            );
            setContests(filtered);
            setLoading(false);
        });
        return unsubscribe;
    }, [userData]);

    const getStatus = (c) => {
        const now = new Date();
        const start = new Date(c.startTime);
        const end = new Date(c.endTime);
        if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
        if (now >= start && now <= end) return { label: 'Active', color: 'bg-green-100 text-green-800 animate-pulse' };
        return { label: 'Ended', color: 'bg-gray-100 text-gray-800' };
    };

    if (loading) return <div className="p-6 text-center">Loading contests...</div>;

    return (
        <div className="max-w-5xl mx-auto py-6 px-4">
            <Breadcrumbs />
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2 dark:text-white">
                    <FaTrophy className="text-yellow-500" /> Contest Lobby
                </h1>
                {isAdmin && (
                    <Link
                        to="/contests/create"
                        className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-2 px-4 rounded transition"
                    >
                        <FaPlus /> Create Contest
                    </Link>
                )}
            </div>

            <div className="bg-white dark:bg-leet-card rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-leet-border">
                        <thead className="bg-gray-50 dark:bg-leet-input">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contest Title</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-leet-border bg-white dark:bg-leet-card">
                            {contests.map((c) => {
                                const status = getStatus(c);
                                return (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-leet-input transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{c.title}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Target: {c.targetGroup}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <FaClock />
                                                <span>{new Date(c.startTime).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {c.problems?.length || 0} Problems
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/contests/${c.id}`}
                                                className="text-brand hover:text-brand-hover font-bold hover:underline"
                                            >
                                                {status.label === 'Ended' ? 'View Results' : 'Enter Arena'} <FaArrowRight className="inline ml-1" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {contests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                        No contests found for your group.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
