import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaTrophy, FaTimes, FaClock, FaUsers, FaPlay, FaStop, FaEye, FaMagic } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { ProblemSetBuilder } from '../../components/ProblemSetBuilder';

const Contests = () => {
    const { isDark } = useOutletContext() || { isDark: true };
    const { currentUser } = useAuth();
    const [contests, setContests] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null); // 'create' | 'edit' | 'delete' | null
    const [selectedContest, setSelectedContest] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'active' | 'ended'
    const [showProblemBuilder, setShowProblemBuilder] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        targetGroup: 'All',
        startTime: '',
        endTime: '',
        problems: [{ slug: '', score: 100 }]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [contestsSnap, groupsSnap] = await Promise.all([
                getDocs(collection(db, 'contests')),
                getDocs(collection(db, 'groups'))
            ]);
            
            setContests(contestsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Error fetching contests:', e);
        } finally {
            setLoading(false);
        }
    };

    // Get contest status
    const getContestStatus = (contest) => {
        const now = new Date();
        const start = new Date(contest.startTime);
        const end = new Date(contest.endTime);
        
        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'active';
        return 'ended';
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const styles = {
            upcoming: isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700',
            active: isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700',
            ended: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
        };
        const labels = { upcoming: 'Upcoming', active: 'Live', ended: 'Ended' };
        return { style: styles[status], label: labels[status] };
    };

    // Get group name
    const getGroupName = (groupId) => {
        if (groupId === 'All') return 'All Groups';
        const group = groups.find(g => g.id === groupId);
        return group?.name || groupId;
    };

    // Filter contests
    const filteredContests = contests
        .filter(c => filter === 'all' || getContestStatus(c) === filter)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create contest
    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.startTime || !formData.endTime) return;
        try {
            const docRef = await addDoc(collection(db, 'contests'), {
                title: formData.title.trim(),
                creatorId: currentUser.uid,
                targetGroup: formData.targetGroup,
                problems: formData.problems.filter(p => p.slug.trim()),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                status: 'upcoming',
                createdAt: new Date().toISOString()
            });
            setContests([{ id: docRef.id, ...formData, createdAt: new Date().toISOString() }, ...contests]);
            resetForm();
        } catch (e) {
            console.error('Error creating contest:', e);
        }
    };

    // Edit contest
    const handleEdit = async () => {
        if (!formData.title.trim() || !selectedContest) return;
        try {
            await updateDoc(doc(db, 'contests', selectedContest.id), {
                title: formData.title.trim(),
                targetGroup: formData.targetGroup,
                problems: formData.problems.filter(p => p.slug.trim()),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString()
            });
            setContests(contests.map(c => c.id === selectedContest.id ? { ...c, ...formData } : c));
            resetForm();
        } catch (e) {
            console.error('Error updating contest:', e);
        }
    };

    // Delete contest
    const handleDelete = async () => {
        if (!selectedContest) return;
        try {
            await deleteDoc(doc(db, 'contests', selectedContest.id));
            setContests(contests.filter(c => c.id !== selectedContest.id));
            resetForm();
        } catch (e) {
            console.error('Error deleting contest:', e);
        }
    };

    const resetForm = () => {
        setShowModal(null);
        setSelectedContest(null);
        setFormData({ title: '', targetGroup: 'All', startTime: '', endTime: '', problems: [{ slug: '', score: 100 }] });
    };

    const openEditModal = (contest) => {
        setSelectedContest(contest);
        setFormData({
            title: contest.title,
            targetGroup: contest.targetGroup || 'All',
            startTime: contest.startTime ? new Date(contest.startTime).toISOString().slice(0, 16) : '',
            endTime: contest.endTime ? new Date(contest.endTime).toISOString().slice(0, 16) : '',
            problems: contest.problems?.length ? contest.problems : [{ slug: '', score: 100 }]
        });
        setShowModal('edit');
    };

    // Problem management in form
    const addProblem = () => setFormData({ ...formData, problems: [...formData.problems, { slug: '', score: 100 }] });
    const removeProblem = (idx) => setFormData({ ...formData, problems: formData.problems.filter((_, i) => i !== idx) });
    const updateProblem = (idx, field, value) => {
        const updated = [...formData.problems];
        updated[idx][field] = value;
        setFormData({ ...formData, problems: updated });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Contests</h1>
                    <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>{contests.length} contests total</p>
                </div>
                <button
                    onClick={() => { setShowModal('create'); setFormData({ title: '', targetGroup: 'All', startTime: '', endTime: '', problems: [{ slug: '', score: 100 }] }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors"
                >
                    <FaPlus /> Create Contest
                </button>
            </div>

            {/* Filters */}
            <div className={`rounded-lg p-4 flex gap-2 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                {['all', 'active', 'upcoming', 'ended'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                            filter === f
                                ? 'bg-brand text-white'
                                : isDark ? 'bg-leet-input text-leet-text hover:bg-leet-border' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        {f === 'all' ? 'All' : f}
                    </button>
                ))}
            </div>

            {/* Contests List */}
            <div className="space-y-4">
                {filteredContests.map(contest => {
                    const status = getContestStatus(contest);
                    const badge = getStatusBadge(status);
                    
                    return (
                        <div
                            key={contest.id}
                            className={`rounded-lg p-6 transition-shadow hover:shadow-lg ${
                                isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaTrophy className={status === 'active' ? 'text-yellow-500' : isDark ? 'text-leet-sub' : 'text-gray-400'} />
                                        <h3 className={`text-lg font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                            {contest.title}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${badge.style}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    
                                    <div className={`flex flex-wrap gap-4 text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                        <span className="flex items-center gap-1">
                                            <FaUsers /> {getGroupName(contest.targetGroup)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FaClock /> {new Date(contest.startTime).toLocaleDateString()} - {new Date(contest.endTime).toLocaleDateString()}
                                        </span>
                                        <span>
                                            {contest.problems?.length || 0} problems
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(contest)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedContest(contest); setShowModal('delete'); }}
                                        className={`p-2 rounded-lg transition-colors text-red-500 ${isDark ? 'hover:bg-leet-input' : 'hover:bg-gray-100'}`}
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredContests.length === 0 && (
                    <div className={`text-center py-12 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                        No contests found. Create your first contest!
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto" onClick={resetForm}>
                    <div 
                        className={`rounded-lg p-6 w-full max-w-2xl my-8 relative ${isDark ? 'bg-leet-card' : 'bg-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Create / Edit Modal */}
                        {(showModal === 'create' || showModal === 'edit') && (
                            <>
                                <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    {showModal === 'create' ? 'Create New Contest' : 'Edit Contest'}
                                </h3>
                                
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Contest Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Weekly Contest #5"
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        />
                                    </div>

                                    {/* Target Group */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Target Group
                                        </label>
                                        <select
                                            value={formData.targetGroup}
                                            onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        >
                                            <option value="All">All Groups</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date/Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                                Start Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                    isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                                End Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                    isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Problems */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className={`block text-sm font-medium ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                                Problems ({formData.problems.filter(p => p.slug?.trim()).length} added)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowProblemBuilder(true)}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                                            >
                                                <FaMagic /> Smart Add
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.problems.map((problem, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={problem.slug}
                                                        onChange={(e) => updateProblem(idx, 'slug', e.target.value)}
                                                        placeholder="LeetCode problem slug (e.g., two-sum)"
                                                        className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                                        }`}
                                                    />
                                                    <input
                                                        type="number"
                                                        value={problem.score}
                                                        onChange={(e) => updateProblem(idx, 'score', parseInt(e.target.value) || 0)}
                                                        placeholder="Score"
                                                        className={`w-24 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                                        }`}
                                                    />
                                                    {formData.problems.length > 1 && (
                                                        <button
                                                            onClick={() => removeProblem(idx)}
                                                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={addProblem}
                                            className={`mt-2 text-sm flex items-center gap-1 ${isDark ? 'text-brand' : 'text-brand'} hover:underline`}
                                        >
                                            <FaPlus /> Add Problem Manually
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={resetForm}
                                        className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={showModal === 'create' ? handleCreate : handleEdit}
                                        disabled={!formData.title.trim() || !formData.startTime || !formData.endTime}
                                        className="flex-1 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white disabled:opacity-50"
                                    >
                                        {showModal === 'create' ? 'Create Contest' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Delete Modal */}
                        {showModal === 'delete' && selectedContest && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Delete Contest?
                                </h3>
                                <p className={`mb-6 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                    Are you sure you want to delete <strong>{selectedContest.title}</strong>? 
                                    This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={resetForm}
                                        className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            onClick={resetForm}
                            className={`absolute top-4 right-4 p-2 rounded-lg ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* Problem Set Builder Modal */}
            <ProblemSetBuilder
                isOpen={showProblemBuilder}
                onClose={() => setShowProblemBuilder(false)}
                onConfirm={(problems) => {
                    const newProblems = problems.map(p => ({ slug: p.titleSlug, score: 100 }));
                    const existingProblems = formData.problems.filter(p => p.slug?.trim());
                    const existingSlugs = new Set(existingProblems.map(p => p.slug));
                    const uniqueNew = newProblems.filter(p => !existingSlugs.has(p.slug));
                    const merged = [...existingProblems, ...uniqueNew];
                    setFormData({ ...formData, problems: merged.length > 0 ? merged : [{ slug: '', score: 100 }] });
                    setShowProblemBuilder(false);
                }}
            />
        </div>
    );
};

export default Contests;
