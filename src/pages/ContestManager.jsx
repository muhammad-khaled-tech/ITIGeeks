import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FaTrophy, FaPlus, FaTrash } from 'react-icons/fa';

const ContestManager = () => {
    const { isAdmin, currentUser } = useAuth();
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [targetGroup, setTargetGroup] = useState('All');
    const [groups, setGroups] = useState([]);
    const [problems, setProblems] = useState([{ slug: '', score: 100 }]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            const gSnap = await getDocs(collection(db, 'groups'));
            setGroups(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchGroups();
    }, []);

    const handleAddProblem = () => {
        setProblems([...problems, { slug: '', score: 100 }]);
    };

    const handleRemoveProblem = (index) => {
        const newProblems = [...problems];
        newProblems.splice(index, 1);
        setProblems(newProblems);
    };

    const handleProblemChange = (index, field, value) => {
        const newProblems = [...problems];
        newProblems[index][field] = value;
        setProblems(newProblems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !startTime || !endTime) return alert('Please fill all fields');

        setCreating(true);
        try {
            await addDoc(collection(db, 'contests'), {
                title,
                creatorId: currentUser.uid,
                targetGroup,
                problems: problems.filter(p => p.slug.trim() !== ''),
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                status: 'upcoming', // Logic to update this can be done via cloud functions or client-side checks
                createdAt: new Date().toISOString()
            });
            alert('Contest Created!');
            // Reset form
            setTitle('');
            setStartTime('');
            setEndTime('');
            setProblems([{ slug: '', score: 100 }]);
        } catch (error) {
            console.error(error);
            alert('Error creating contest');
        } finally {
            setCreating(false);
        }
    };

    if (!isAdmin) return <div className="text-red-500 p-6">Access Denied</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-leet-card rounded-lg shadow mt-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                <FaTrophy className="text-yellow-500" /> Create Contest
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contest Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:text-white shadow-sm p-2"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:text-white shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:text-white shadow-sm p-2"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Group</label>
                    <select
                        value={targetGroup}
                        onChange={e => setTargetGroup(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:text-white shadow-sm p-2"
                    >
                        <option value="All">All Groups</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Problems</label>
                    {problems.map((p, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="LeetCode Slug (e.g. two-sum)"
                                value={p.slug}
                                onChange={e => handleProblemChange(i, 'slug', e.target.value)}
                                className="flex-grow rounded-md border-gray-300 dark:bg-leet-input dark:text-white shadow-sm p-2"
                            />
                            <input
                                type="number"
                                placeholder="Score"
                                value={p.score}
                                onChange={e => handleProblemChange(i, 'score', parseInt(e.target.value))}
                                className="w-24 rounded-md border-gray-300 dark:bg-leet-input dark:text-white shadow-sm p-2"
                            />
                            <button type="button" onClick={() => handleRemoveProblem(i)} className="text-red-500 p-2 hover:bg-red-50 rounded"><FaTrash /></button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddProblem} className="text-brand dark:text-brand-dark text-sm font-medium flex items-center gap-1 mt-2">
                        <FaPlus /> Add Problem
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                    {creating ? 'Creating...' : 'Create Contest'}
                </button>
            </form>
        </div>
    );
};

export default ContestManager;
