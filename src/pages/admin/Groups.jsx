import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';

const Groups = () => {
    const { isDark } = useOutletContext() || { isDark: true };
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null); // 'create' | 'edit' | 'delete' | null
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [groupsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, 'groups')),
                getDocs(collection(db, 'users'))
            ]);
            
            setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setStudents(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Error fetching groups:', e);
        } finally {
            setLoading(false);
        }
    };

    // Count students in a group
    const getStudentCount = (groupId) => {
        return students.filter(s => s.groupId === groupId).length;
    };

    // Get students in a group
    const getGroupStudents = (groupId) => {
        return students.filter(s => s.groupId === groupId);
    };

    // Create group
    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        try {
            const docRef = await addDoc(collection(db, 'groups'), {
                name: formData.name.trim(),
                description: formData.description.trim(),
                createdAt: new Date().toISOString()
            });
            setGroups([...groups, { id: docRef.id, name: formData.name.trim(), description: formData.description.trim() }]);
            setShowModal(null);
            setFormData({ name: '', description: '' });
        } catch (e) {
            console.error('Error creating group:', e);
        }
    };

    // Edit group
    const handleEdit = async () => {
        if (!formData.name.trim() || !selectedGroup) return;
        try {
            await updateDoc(doc(db, 'groups', selectedGroup.id), {
                name: formData.name.trim(),
                description: formData.description.trim()
            });
            setGroups(groups.map(g => g.id === selectedGroup.id ? { ...g, name: formData.name.trim(), description: formData.description.trim() } : g));
            setShowModal(null);
            setSelectedGroup(null);
            setFormData({ name: '', description: '' });
        } catch (e) {
            console.error('Error updating group:', e);
        }
    };

    // Delete group
    const handleDelete = async () => {
        if (!selectedGroup) return;
        try {
            // First, remove group from all students
            const groupStudents = getGroupStudents(selectedGroup.id);
            await Promise.all(groupStudents.map(student => 
                updateDoc(doc(db, 'users', student.id), { groupId: null })
            ));
            
            // Then delete the group
            await deleteDoc(doc(db, 'groups', selectedGroup.id));
            setGroups(groups.filter(g => g.id !== selectedGroup.id));
            setStudents(students.map(s => s.groupId === selectedGroup.id ? { ...s, groupId: null } : s));
            setShowModal(null);
            setSelectedGroup(null);
        } catch (e) {
            console.error('Error deleting group:', e);
        }
    };

    // Filter groups
    const filteredGroups = groups.filter(group =>
        group.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Groups</h1>
                    <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>{groups.length} groups total</p>
                </div>
                <button
                    onClick={() => { setShowModal('create'); setFormData({ name: '', description: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors"
                >
                    <FaPlus /> Create Group
                </button>
            </div>

            {/* Search */}
            <div className={`rounded-lg p-4 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                <div className="relative max-w-md">
                    <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-leet-sub' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                        }`}
                    />
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => {
                    const studentCount = getStudentCount(group.id);
                    const groupStudents = getGroupStudents(group.id).slice(0, 3);
                    
                    return (
                        <div
                            key={group.id}
                            className={`rounded-lg p-6 transition-shadow hover:shadow-lg ${
                                isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                        {group.name}
                                    </h3>
                                    {group.description && (
                                        <p className={`text-sm mt-1 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                            {group.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => { setSelectedGroup(group); setFormData({ name: group.name, description: group.description || '' }); setShowModal('edit'); }}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedGroup(group); setShowModal('delete'); }}
                                        className={`p-2 rounded-lg transition-colors text-red-500 ${isDark ? 'hover:bg-leet-input' : 'hover:bg-gray-100'}`}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            {/* Student count */}
                            <div className={`flex items-center gap-2 mb-4 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                <FaUsers />
                                <span className="font-medium">{studentCount} students</span>
                            </div>

                            {/* Student avatars */}
                            {studentCount > 0 && (
                                <div className="flex items-center">
                                    <div className="flex -space-x-2">
                                        {groupStudents.map(student => (
                                            <div
                                                key={student.id}
                                                className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-bold border-2 border-white dark:border-leet-card"
                                                title={student.email}
                                            >
                                                {(student.email || 'U')[0].toUpperCase()}
                                            </div>
                                        ))}
                                    </div>
                                    {studentCount > 3 && (
                                        <span className={`ml-2 text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                            +{studentCount - 3} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Empty state */}
                {filteredGroups.length === 0 && (
                    <div className={`col-span-full text-center py-12 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                        {searchTerm ? 'No groups found matching your search.' : 'No groups yet. Create your first group!'}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
                    <div 
                        className={`rounded-lg p-6 w-full max-w-md relative ${isDark ? 'bg-leet-card' : 'bg-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Create / Edit Modal */}
                        {(showModal === 'create' || showModal === 'edit') && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    {showModal === 'create' ? 'Create New Group' : 'Edit Group'}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Group Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., OSAD 46"
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Description (optional)
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description of this group..."
                                            rows={3}
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowModal(null)}
                                        className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={showModal === 'create' ? handleCreate : handleEdit}
                                        disabled={!formData.name.trim()}
                                        className="flex-1 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white disabled:opacity-50"
                                    >
                                        {showModal === 'create' ? 'Create' : 'Save'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Delete Modal */}
                        {showModal === 'delete' && selectedGroup && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Delete Group?
                                </h3>
                                <p className={`mb-2 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                    Are you sure you want to delete <strong>{selectedGroup.name}</strong>?
                                </p>
                                <p className={`text-sm mb-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                    ⚠️ {getStudentCount(selectedGroup.id)} students will be removed from this group.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(null)}
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
                            onClick={() => setShowModal(null)}
                            className={`absolute top-4 right-4 p-2 rounded-lg ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
