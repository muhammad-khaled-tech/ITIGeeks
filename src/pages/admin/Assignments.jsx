import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaTasks, FaTimes, FaClock, FaUsers, FaCheckCircle, FaExclamationTriangle, FaMagic } from 'react-icons/fa';
import { ProblemSetBuilder } from '../../components/ProblemSetBuilder';

const Assignments = () => {
    const { isDark, adminUser } = useOutletContext() || { isDark: true, adminUser: null };
    const [assignments, setAssignments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'past'
    const [showProblemBuilder, setShowProblemBuilder] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetGroup: 'All',
        deadline: '',
        problems: ['']
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assignmentsSnap, groupsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, 'assignments')),
                getDocs(collection(db, 'groups')),
                getDocs(collection(db, 'users'))
            ]);
            
            setAssignments(assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setStudents(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Error fetching assignments:', e);
        } finally {
            setLoading(false);
        }
    };

    // Get assignment status
    const getStatus = (assignment) => {
        const now = new Date();
        const deadline = new Date(assignment.deadline);
        return now > deadline ? 'past' : 'active';
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const styles = {
            active: isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700',
            past: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
        };
        const labels = { active: 'Active', past: 'Past Due' };
        return { style: styles[status], label: labels[status] };
    };

    // Get group name
    const getGroupName = (groupId) => {
        if (groupId === 'All') return 'All Groups';
        const group = groups.find(g => g.id === groupId);
        return group?.name || groupId;
    };

    // Get target students count
    const getTargetStudentsCount = (targetGroup) => {
        if (targetGroup === 'All') return students.length;
        return students.filter(s => s.groupId === targetGroup).length;
    };

    // Filter assignments
    const filteredAssignments = assignments
        .filter(a => filter === 'all' || getStatus(a) === filter)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create assignment
    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.deadline) return;
        try {
            const docRef = await addDoc(collection(db, 'assignments'), {
                title: formData.title.trim(),
                description: formData.description.trim(),
                creatorId: adminUser?.email || 'admin',
                targetGroup: formData.targetGroup,
                problems: formData.problems.filter(p => p.trim()),
                deadline: new Date(formData.deadline).toISOString(),
                createdAt: new Date().toISOString()
            });
            setAssignments([{ id: docRef.id, ...formData, createdAt: new Date().toISOString() }, ...assignments]);
            resetForm();
        } catch (e) {
            console.error('Error creating assignment:', e);
        }
    };

    // Edit assignment
    const handleEdit = async () => {
        if (!formData.title.trim() || !selectedAssignment) return;
        try {
            await updateDoc(doc(db, 'assignments', selectedAssignment.id), {
                title: formData.title.trim(),
                description: formData.description.trim(),
                targetGroup: formData.targetGroup,
                problems: formData.problems.filter(p => p.trim()),
                deadline: new Date(formData.deadline).toISOString()
            });
            setAssignments(assignments.map(a => a.id === selectedAssignment.id ? { ...a, ...formData } : a));
            resetForm();
        } catch (e) {
            console.error('Error updating assignment:', e);
        }
    };

    // Delete assignment
    const handleDelete = async () => {
        if (!selectedAssignment) return;
        try {
            await deleteDoc(doc(db, 'assignments', selectedAssignment.id));
            setAssignments(assignments.filter(a => a.id !== selectedAssignment.id));
            resetForm();
        } catch (e) {
            console.error('Error deleting assignment:', e);
        }
    };

    const resetForm = () => {
        setShowModal(null);
        setSelectedAssignment(null);
        setFormData({ title: '', description: '', targetGroup: 'All', deadline: '', problems: [''] });
    };

    const openEditModal = (assignment) => {
        setSelectedAssignment(assignment);
        setFormData({
            title: assignment.title,
            description: assignment.description || '',
            targetGroup: assignment.targetGroup || 'All',
            deadline: assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : '',
            problems: assignment.problems?.length ? assignment.problems : ['']
        });
        setShowModal('edit');
    };

    // Problem management
    const addProblem = () => setFormData({ ...formData, problems: [...formData.problems, ''] });
    const removeProblem = (idx) => setFormData({ ...formData, problems: formData.problems.filter((_, i) => i !== idx) });
    const updateProblem = (idx, value) => {
        const updated = [...formData.problems];
        updated[idx] = value;
        setFormData({ ...formData, problems: updated });
    };

    // Days until deadline
    const getDaysUntil = (deadline) => {
        const now = new Date();
        const dl = new Date(deadline);
        const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
        if (diff < 0) return `${Math.abs(diff)} days ago`;
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        return `${diff} days left`;
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
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Assignments</h1>
                    <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>{assignments.length} assignments total</p>
                </div>
                <button
                    onClick={() => { setShowModal('create'); setFormData({ title: '', description: '', targetGroup: 'All', deadline: '', problems: [''] }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors"
                >
                    <FaPlus /> Create Assignment
                </button>
            </div>

            {/* Filters */}
            <div className={`rounded-lg p-4 flex gap-2 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                {['all', 'active', 'past'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                            filter === f
                                ? 'bg-brand text-white'
                                : isDark ? 'bg-leet-input text-leet-text hover:bg-leet-border' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        {f === 'all' ? 'All' : f === 'past' ? 'Past Due' : 'Active'}
                    </button>
                ))}
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                {filteredAssignments.map(assignment => {
                    const status = getStatus(assignment);
                    const badge = getStatusBadge(status);
                    const daysLeft = getDaysUntil(assignment.deadline);
                    
                    return (
                        <div
                            key={assignment.id}
                            className={`rounded-lg p-6 transition-shadow hover:shadow-lg ${
                                isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FaTasks className={status === 'active' ? 'text-blue-500' : isDark ? 'text-leet-sub' : 'text-gray-400'} />
                                        <h3 className={`text-lg font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                            {assignment.title}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${badge.style}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    
                                    {assignment.description && (
                                        <p className={`text-sm mb-3 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                            {assignment.description}
                                        </p>
                                    )}
                                    
                                    <div className={`flex flex-wrap gap-4 text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                        <span className="flex items-center gap-1">
                                            <FaUsers /> {getGroupName(assignment.targetGroup)} ({getTargetStudentsCount(assignment.targetGroup)} students)
                                        </span>
                                        <span className={`flex items-center gap-1 ${status === 'past' ? 'text-red-400' : ''}`}>
                                            {status === 'past' ? <FaExclamationTriangle /> : <FaClock />} 
                                            {daysLeft}
                                        </span>
                                        <span>
                                            {assignment.problems?.length || 0} problems
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(assignment)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedAssignment(assignment); setShowModal('delete'); }}
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

                {filteredAssignments.length === 0 && (
                    <div className={`text-center py-12 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                        No assignments found. Create your first assignment!
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto" onClick={resetForm}>
                    <div 
                        className={`rounded-lg p-6 w-full max-w-2xl my-8 relative max-h-[90vh] overflow-y-auto ${isDark ? 'bg-leet-card' : 'bg-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Create / Edit Modal */}
                        {(showModal === 'create' || showModal === 'edit') && (
                            <>
                                <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    {showModal === 'create' ? 'Create New Assignment' : 'Edit Assignment'}
                                </h3>
                                
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Assignment Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Week 3 - Arrays & Strings"
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description or instructions..."
                                            rows={2}
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        />
                                    </div>

                                    {/* Target Group & Deadline */}
                                    <div className="grid grid-cols-2 gap-4">
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
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                                Deadline *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                                                Problems ({formData.problems.filter(p => p.trim()).length} added)
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
                                                        value={problem}
                                                        onChange={(e) => updateProblem(idx, e.target.value)}
                                                        placeholder="e.g., two-sum"
                                                        className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
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
                                        disabled={!formData.title.trim() || !formData.deadline}
                                        className="flex-1 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white disabled:opacity-50"
                                    >
                                        {showModal === 'create' ? 'Create Assignment' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Delete Modal */}
                        {showModal === 'delete' && selectedAssignment && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Delete Assignment?
                                </h3>
                                <p className={`mb-6 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                    Are you sure you want to delete <strong>{selectedAssignment.title}</strong>? 
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
                    const newSlugs = problems.map(p => p.titleSlug);
                    const existingSlugs = formData.problems.filter(p => p.trim());
                    const mergedSlugs = [...new Set([...existingSlugs, ...newSlugs])];
                    setFormData({ ...formData, problems: mergedSlugs.length > 0 ? mergedSlugs : [''] });
                    setShowProblemBuilder(false);
                }}
            />
        </div>
    );
};

export default Assignments;
