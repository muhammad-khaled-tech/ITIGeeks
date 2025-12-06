import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { FaTrophy, FaCalendarAlt, FaClock, FaArrowRight, FaPlus } from 'react-icons/fa';

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
        <div className="max-w-5xl mx-auto p-6">
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contests.map(c => {
                    const status = getStatus(c);
                    return (
                        <div key={c.id} className="bg-white dark:bg-leet-card rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-leet-border hover:shadow-lg transition">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <FaClock /> {new Date(c.startTime).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-2 dark:text-white">{c.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {c.problems.length} Problems • {c.problems.reduce((a, b) => a + b.score, 0)} Points
                                </p>
                                <Link
                                    to={`/contests/${c.id}`}
                                    className="block w-full text-center bg-brand hover:bg-brand-hover text-white font-medium py-2 rounded transition"
                                >
                                    {status.label === 'Ended' ? 'View Results' : 'Enter Arena'}
                                </Link>
                            </div>
                        </div>
                    );
                })}
                {contests.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No contests found for your group.
                    </div>
                )}
            </div>
        </div>
    );
}
