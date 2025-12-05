import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FaPlus, FaTasks, FaTrash, FaUsers } from 'react-icons/fa';

export default function AssignmentManager() {
    const { currentUser, userData, isAdmin } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [targetGroup, setTargetGroup] = useState(userData?.groupId || 'All');
    const [problemInput, setProblemInput] = useState('');
    const [problems, setProblems] = useState([]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            let q = query(collection(db, 'assignments'), orderBy('deadline', 'desc'));
            if (!isAdmin) {
                q = query(collection(db, 'assignments'), where('creatorId', '==', currentUser.uid));
            }
            const snap = await getDocs(q);
            setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) fetchAssignments();
    }, [currentUser]);

    const addProblem = () => {
        if (!problemInput.trim()) return;
        // Simple slug extraction or usage
        const slug = problemInput.trim().toLowerCase().replace(/\s+/g, '-');
        setProblems([...problems, { slug, title: problemInput, required: true }]);
        setProblemInput('');
    };

    const removeProblem = (idx) => {
        setProblems(problems.filter((_, i) => i !== idx));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'assignments'), {
                title,
                description,
                deadline: new Date(deadline).toISOString(),
                targetGroup,
                creatorId: currentUser.uid,
                problems,
                createdAt: new Date().toISOString()
            });
            alert('Assignment Created!');
            setShowForm(false);
            setTitle('');
            setDescription('');
            setDeadline('');
            setProblems([]);
            fetchAssignments();
        } catch (e) {
            console.error(e);
            alert('Error creating assignment');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2 dark:text-white">
                    <FaTasks className="text-brand" /> Assignment Manager
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <FaPlus /> Create Assignment
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-leet-card p-6 rounded-lg shadow mb-8 border border-gray-200 dark:border-leet-border">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">New Assignment</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-leet-input dark:text-white dark:border-leet-border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Deadline</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-leet-input dark:text-white dark:border-leet-border"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-leet-input dark:text-white dark:border-leet-border"
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">Target Group</label>
                            <input
                                type="text"
                                value={targetGroup}
                                onChange={e => setTargetGroup(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-leet-input dark:text-white dark:border-leet-border"
                                placeholder="e.g. Group A or All"
                            />
                        </div>

                        <div className="border-t dark:border-leet-border pt-4">
                            <label className="block text-sm font-bold mb-2 dark:text-gray-300">Problems</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={problemInput}
                                    onChange={e => setProblemInput(e.target.value)}
                                    placeholder="Problem Title or Slug (e.g. Two Sum)"
                                    className="flex-grow p-2 border rounded dark:bg-leet-input dark:text-white dark:border-leet-border"
                                />
                                <button type="button" onClick={addProblem} className="bg-gray-200 dark:bg-gray-700 px-4 rounded">Add</button>
                            </div>
                            <ul className="space-y-2">
                                {problems.map((p, i) => (
                                    <li key={i} className="flex justify-between items-center bg-gray-50 dark:bg-leet-input p-2 rounded">
                                        <span className="dark:text-gray-300">{p.title} ({p.slug})</span>
                                        <button type="button" onClick={() => removeProblem(i)} className="text-red-500"><FaTrash /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold">
                                Publish Assignment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map(a => (
                    <div key={a.id} className="bg-white dark:bg-leet-card p-4 rounded shadow border-l-4 border-blue-500">
                        <h3 className="font-bold text-lg dark:text-white">{a.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">Deadline: {new Date(a.deadline).toLocaleDateString()}</p>
                        <p className="text-sm dark:text-gray-400 mb-4">{a.problems.length} Problems</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Group: {a.targetGroup}</span>
                            <button className="text-blue-500 hover:underline flex items-center gap-1">
                                <FaUsers /> View Progress
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
