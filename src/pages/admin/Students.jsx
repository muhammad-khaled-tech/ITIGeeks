import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FaSearch, FaFilter, FaUserEdit, FaTrash, FaUserPlus, FaUserMinus, FaEllipsisV, FaTimes, FaCheck } from 'react-icons/fa';

const Students = () => {
    const { isDark } = useOutletContext() || { isDark: true };
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [showModal, setShowModal] = useState(null); // 'role' | 'group' | 'remove' | null
    const [selectedStudents, setSelectedStudents] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersSnap, groupsSnap] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'groups'))
            ]);
            
            const usersData = usersSnap.docs.map(d => {
                const data = d.data();
                const solved = (data.problems || []).filter(p => p.status === 'Done').length;
                return { id: d.id, ...data, solved };
            });
            
            setStudents(usersData);
            setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Error fetching students:', e);
        } finally {
            setLoading(false);
        }
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch = 
            (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.leetcodeUsername?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesGroup = filterGroup === 'all' || student.groupId === filterGroup || (!student.groupId && filterGroup === 'none');
        const matchesRole = filterRole === 'all' || student.role === filterRole;
        return matchesSearch && matchesGroup && matchesRole;
    });

    // Actions
    const handleChangeRole = async (studentId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', studentId), { role: newRole });
            setStudents(students.map(s => s.id === studentId ? { ...s, role: newRole } : s));
            setShowModal(null);
            setSelectedStudent(null);
        } catch (e) {
            console.error('Error updating role:', e);
        }
    };

    const handleAssignGroup = async (studentId, groupId) => {
        try {
            await updateDoc(doc(db, 'users', studentId), { groupId });
            setStudents(students.map(s => s.id === studentId ? { ...s, groupId } : s));
            setShowModal(null);
            setSelectedStudent(null);
        } catch (e) {
            console.error('Error assigning group:', e);
        }
    };

    const handleRemoveFromGroup = async (studentId) => {
        try {
            await updateDoc(doc(db, 'users', studentId), { groupId: null });
            setStudents(students.map(s => s.id === studentId ? { ...s, groupId: null } : s));
            setShowModal(null);
            setSelectedStudent(null);
        } catch (e) {
            console.error('Error removing from group:', e);
        }
    };

    // Delete student
    const handleDeleteStudent = async (studentId) => {
        if (!selectedStudent) return;
        try {
            await deleteDoc(doc(db, 'users', selectedStudent.id));
            setStudents(students.filter(s => s.id !== selectedStudent.id));
            setShowModal(null);
            setSelectedStudent(null);
        } catch (e) {
            console.error('Error deleting student:', e);
        }
    };

    const getGroupName = (groupId) => {
        if (!groupId) return 'No Group';
        const group = groups.find(g => g.id === groupId);
        return group?.name || groupId;
    };

    const getRoleBadge = (role) => {
        const colors = {
            student: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
            instructor: isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700',
            supervisor: isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700',
        };
        return colors[role] || colors.student;
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
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Students</h1>
                    <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>{filteredStudents.length} students found</p>
                </div>
            </div>

            {/* Filters */}
            <div className={`rounded-lg p-4 flex flex-wrap gap-4 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-leet-sub' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Search by email or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                        }`}
                    />
                </div>

                {/* Group Filter */}
                <div className="flex items-center gap-2">
                    <FaFilter className={isDark ? 'text-leet-sub' : 'text-gray-400'} />
                    <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className={`px-3 py-2 rounded-lg text-sm focus:outline-none ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                        }`}
                    >
                        <option value="all">All Groups</option>
                        <option value="none">No Group</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                {/* Role Filter */}
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm focus:outline-none ${
                        isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                    }`}
                >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="instructor">Instructors</option>
                    <option value="supervisor">Supervisors</option>
                </select>
            </div>

            {/* Table */}
            <div className={`rounded-lg ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                <table className="w-full">
                    <thead className={isDark ? 'bg-leet-input' : 'bg-gray-50'}>
                        <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>User</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>Group</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>Role</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>Solved</th>
                            <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-leet-border' : 'divide-gray-200'}`}>
                        {filteredStudents.map(student => (
                            <tr key={student.id} className={isDark ? 'hover:bg-leet-input/50' : 'hover:bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold">
                                            {(student.displayName || student.email || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                                {student.displayName || student.leetcodeUsername || 'No username'}
                                            </p>
                                            <p className={`text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                                {student.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        student.groupId 
                                            ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                                            : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                                    }`}>
                                        {getGroupName(student.groupId)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRoleBadge(student.role)}`}>
                                        {student.role || 'student'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                        {student.solved}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right relative">
                                    <button
                                        onClick={() => setShowActionMenu(showActionMenu === student.id ? null : student.id)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                                    >
                                        <FaEllipsisV />
                                    </button>
                                    
                                    {showActionMenu === student.id && (
                                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 border ${
                                            isDark ? 'bg-leet-card border-leet-border' : 'bg-white border-gray-200'
                                        }`}>
                                            <button
                                                onClick={() => { setSelectedStudent(student); setShowModal('role'); setShowActionMenu(null); }}
                                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left ${isDark ? 'hover:bg-leet-input text-leet-text' : 'hover:bg-gray-50'}`}
                                            >
                                                <FaUserEdit /> Change Role
                                            </button>
                                            <button
                                                onClick={() => { setSelectedStudent(student); setShowModal('group'); setShowActionMenu(null); }}
                                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left ${isDark ? 'hover:bg-leet-input text-leet-text' : 'hover:bg-gray-50'}`}
                                            >
                                                <FaUserPlus /> Assign to Group
                                            </button>
                                            {student.groupId && (
                                                <button
                                                    onClick={() => { setSelectedStudent(student); setShowModal('remove'); setShowActionMenu(null); }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-500 ${isDark ? 'hover:bg-leet-input' : 'hover:bg-gray-50'}`}
                                                >
                                                    <FaUserMinus /> Remove from Group
                                                </button>
                                            )}
                                            <div className={`h-px my-1 ${isDark ? 'bg-leet-border' : 'bg-gray-200'}`}></div>
                                            <button
                                                onClick={() => { setSelectedStudent(student); setShowModal('delete_student'); setShowActionMenu(null); }}
                                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-500 ${isDark ? 'hover:bg-leet-input' : 'hover:bg-gray-50'}`}
                                            >
                                                <FaTrash /> Delete User
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredStudents.length === 0 && (
                    <div className={`text-center py-12 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                        No students found matching your filters.
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
                    <div 
                        className={`rounded-lg p-6 w-full max-w-md ${isDark ? 'bg-leet-card' : 'bg-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {showModal === 'role' && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Change Role for {selectedStudent.email}
                                </h3>
                                <div className="space-y-2">
                                    {['student', 'instructor', 'supervisor'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => handleChangeRole(selectedStudent.id, role)}
                                            className={`w-full px-4 py-3 rounded-lg text-left capitalize flex items-center justify-between ${
                                                selectedStudent.role === role
                                                    ? 'bg-brand text-white'
                                                    : isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        >
                                            {role}
                                            {selectedStudent.role === role && <FaCheck />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {showModal === 'group' && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Assign {selectedStudent.email} to Group
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {groups.map(group => (
                                        <button
                                            key={group.id}
                                            onClick={() => handleAssignGroup(selectedStudent.id, group.id)}
                                            className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between ${
                                                selectedStudent.groupId === group.id
                                                    ? 'bg-brand text-white'
                                                    : isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        >
                                            {group.name}
                                            {selectedStudent.groupId === group.id && <FaCheck />}
                                        </button>
                                    ))}
                                    {groups.length === 0 && (
                                        <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>No groups available. Create groups first.</p>
                                    )}
                                </div>
                            </>
                        )}

                        {showModal === 'remove' && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Remove from Group?
                                </h3>
                                <p className={`mb-6 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                    Are you sure you want to remove <strong>{selectedStudent.email}</strong> from <strong>{getGroupName(selectedStudent.groupId)}</strong>?
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(null)}
                                        className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleRemoveFromGroup(selectedStudent.id)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </>
                        )}

                        {showModal === 'delete_student' && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Delete User?
                                </h3>
                                <p className={`mb-2 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                    Are you sure you want to delete <strong>{selectedStudent.email}</strong>?
                                </p>
                                <p className={`text-sm mb-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                    ⚠️ This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(null)}
                                        className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteStudent(selectedStudent.id)}
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

export default Students;
