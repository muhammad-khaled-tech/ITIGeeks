import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaRoad, FaTimes, FaUsers, FaLayerGroup, FaChevronDown, FaChevronRight } from 'react-icons/fa';

const Tracks = () => {
    const { isDark } = useOutletContext() || { isDark: true };
    const [tracks, setTracks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [expandedTracks, setExpandedTracks] = useState({});
    const [formData, setFormData] = useState({ name: '', description: '', color: '#ef4444' });
    const [searchTerm, setSearchTerm] = useState('');

    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
        '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tracksSnap, groupsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, 'tracks')),
                getDocs(collection(db, 'groups')),
                getDocs(collection(db, 'users'))
            ]);
            
            setTracks(tracksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setStudents(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Error fetching tracks:', e);
        } finally {
            setLoading(false);
        }
    };

    // Get groups in a track
    const getTrackGroups = (trackId) => groups.filter(g => g.trackId === trackId);
    
    // Get students in a track (via groups)
    const getTrackStudentCount = (trackId) => {
        const trackGroups = getTrackGroups(trackId);
        const groupIds = trackGroups.map(g => g.id);
        return students.filter(s => groupIds.includes(s.groupId)).length;
    };

    // Get unassigned groups
    const unassignedGroups = groups.filter(g => !g.trackId);

    // Create track
    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        try {
            const docRef = await addDoc(collection(db, 'tracks'), {
                name: formData.name.trim(),
                description: formData.description.trim(),
                color: formData.color,
                createdAt: new Date().toISOString()
            });
            setTracks([...tracks, { id: docRef.id, ...formData }]);
            resetForm();
        } catch (e) {
            console.error('Error creating track:', e);
        }
    };

    // Edit track
    const handleEdit = async () => {
        if (!formData.name.trim() || !selectedTrack) return;
        try {
            await updateDoc(doc(db, 'tracks', selectedTrack.id), {
                name: formData.name.trim(),
                description: formData.description.trim(),
                color: formData.color
            });
            setTracks(tracks.map(t => t.id === selectedTrack.id ? { ...t, ...formData } : t));
            resetForm();
        } catch (e) {
            console.error('Error updating track:', e);
        }
    };

    // Delete track
    const handleDelete = async () => {
        if (!selectedTrack) return;
        try {
            // Remove track from all groups
            const trackGroups = getTrackGroups(selectedTrack.id);
            await Promise.all(trackGroups.map(g => 
                updateDoc(doc(db, 'groups', g.id), { trackId: null })
            ));
            
            await deleteDoc(doc(db, 'tracks', selectedTrack.id));
            setTracks(tracks.filter(t => t.id !== selectedTrack.id));
            setGroups(groups.map(g => g.trackId === selectedTrack.id ? { ...g, trackId: null } : g));
            resetForm();
        } catch (e) {
            console.error('Error deleting track:', e);
        }
    };

    // Assign group to track
    const handleAssignGroup = async (groupId, trackId) => {
        try {
            await updateDoc(doc(db, 'groups', groupId), { trackId });
            setGroups(groups.map(g => g.id === groupId ? { ...g, trackId } : g));
        } catch (e) {
            console.error('Error assigning group:', e);
        }
    };

    // Remove group from track
    const handleRemoveGroup = async (groupId) => {
        try {
            await updateDoc(doc(db, 'groups', groupId), { trackId: null });
            setGroups(groups.map(g => g.id === groupId ? { ...g, trackId: null } : g));
        } catch (e) {
            console.error('Error removing group:', e);
        }
    };

    const resetForm = () => {
        setShowModal(null);
        setSelectedTrack(null);
        setFormData({ name: '', description: '', color: '#ef4444' });
    };

    const toggleExpand = (trackId) => {
        setExpandedTracks(prev => ({ ...prev, [trackId]: !prev[trackId] }));
    };

    // Filter tracks
    const filteredTracks = tracks.filter(t => 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Tracks</h1>
                    <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>Organize groups by educational track</p>
                </div>
                <button
                    onClick={() => { setShowModal('create'); setFormData({ name: '', description: '', color: '#ef4444' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium transition-colors"
                >
                    <FaPlus /> Create Track
                </button>
            </div>

            {/* Search */}
            <div className={`rounded-lg p-4 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                <input
                    type="text"
                    placeholder="Search tracks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full max-w-md px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                        isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                    }`}
                />
            </div>

            {/* Tracks List */}
            <div className="space-y-4">
                {filteredTracks.map(track => {
                    const trackGroups = getTrackGroups(track.id);
                    const studentCount = getTrackStudentCount(track.id);
                    const isExpanded = expandedTracks[track.id];
                    
                    return (
                        <div
                            key={track.id}
                            className={`rounded-lg overflow-hidden ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}
                        >
                            {/* Track Header */}
                            <div 
                                className={`p-4 flex items-center justify-between cursor-pointer ${isDark ? 'hover:bg-leet-input/50' : 'hover:bg-gray-50'}`}
                                onClick={() => toggleExpand(track.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <FaChevronDown className={isDark ? 'text-leet-sub' : 'text-gray-400'} /> : <FaChevronRight className={isDark ? 'text-leet-sub' : 'text-gray-400'} />}
                                    <div 
                                        className="w-4 h-4 rounded-full" 
                                        style={{ backgroundColor: track.color || '#3b82f6' }}
                                    />
                                    <div>
                                        <h3 className={`font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>{track.name}</h3>
                                        {track.description && (
                                            <p className={`text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>{track.description}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                        <span className="flex items-center gap-1"><FaLayerGroup /> {trackGroups.length} groups</span>
                                        <span className="flex items-center gap-1"><FaUsers /> {studentCount} students</span>
                                    </div>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => { setSelectedTrack(track); setFormData({ name: track.name, description: track.description || '', color: track.color || '#ef4444' }); setShowModal('edit'); }}
                                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedTrack(track); setShowModal('delete'); }}
                                            className={`p-2 rounded-lg transition-colors text-red-500 ${isDark ? 'hover:bg-leet-input' : 'hover:bg-gray-100'}`}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expanded Groups */}
                            {isExpanded && (
                                <div className={`border-t p-4 ${isDark ? 'border-leet-border bg-leet-input/30' : 'border-gray-200 bg-gray-50'}`}>
                                    {trackGroups.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {trackGroups.map(group => {
                                                const groupStudents = students.filter(s => s.groupId === group.id).length;
                                                return (
                                                    <div 
                                                        key={group.id} 
                                                        className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-leet-card' : 'bg-white'}`}
                                                    >
                                                        <div>
                                                            <p className={`font-medium ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>{group.name}</p>
                                                            <p className={`text-xs ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>{groupStudents} students</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveGroup(group.id)}
                                                            className="text-red-500 hover:text-red-600 text-xs"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className={`text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>No groups assigned to this track yet.</p>
                                    )}
                                    
                                    {/* Add Group Dropdown */}
                                    {unassignedGroups.length > 0 && (
                                        <div className="mt-3">
                                            <select
                                                onChange={(e) => { if (e.target.value) handleAssignGroup(e.target.value, track.id); e.target.value = ''; }}
                                                className={`px-3 py-2 rounded-lg text-sm focus:outline-none ${
                                                    isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-white border'
                                                }`}
                                            >
                                                <option value="">+ Add group to track...</option>
                                                {unassignedGroups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredTracks.length === 0 && (
                    <div className={`text-center py-12 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                        No tracks found. Create your first track!
                    </div>
                )}
            </div>

            {/* Unassigned Groups Section */}
            {unassignedGroups.length > 0 && (
                <div className={`rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                    <h3 className={`font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                        Unassigned Groups ({unassignedGroups.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unassignedGroups.map(group => (
                            <div 
                                key={group.id} 
                                className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-leet-input' : 'bg-gray-50'}`}
                            >
                                <span className={isDark ? 'text-leet-text' : 'text-gray-900'}>{group.name}</span>
                                {tracks.length > 0 && (
                                    <select
                                        onChange={(e) => { if (e.target.value) handleAssignGroup(group.id, e.target.value); }}
                                        className={`px-2 py-1 rounded text-xs focus:outline-none ${
                                            isDark ? 'bg-leet-card text-leet-text border border-leet-border' : 'bg-white border'
                                        }`}
                                    >
                                        <option value="">Assign to...</option>
                                        {tracks.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={resetForm}>
                    <div 
                        className={`rounded-lg p-6 w-full max-w-md relative ${isDark ? 'bg-leet-card' : 'bg-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Create / Edit Modal */}
                        {(showModal === 'create' || showModal === 'edit') && (
                            <>
                                <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    {showModal === 'create' ? 'Create New Track' : 'Edit Track'}
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Track Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Open Source Applications"
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description..."
                                            rows={2}
                                            className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                                            }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-leet-sub' : 'text-gray-700'}`}>
                                            Color
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setFormData({ ...formData, color })}
                                                    className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
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
                                        disabled={!formData.name.trim()}
                                        className="flex-1 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white disabled:opacity-50"
                                    >
                                        {showModal === 'create' ? 'Create' : 'Save'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Delete Modal */}
                        {showModal === 'delete' && selectedTrack && (
                            <>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    Delete Track?
                                </h3>
                                <p className={`mb-2 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                    Are you sure you want to delete <strong>{selectedTrack.name}</strong>?
                                </p>
                                <p className={`text-sm mb-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                    ⚠️ {getTrackGroups(selectedTrack.id).length} groups will be unassigned from this track.
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
        </div>
    );
};

export default Tracks;
