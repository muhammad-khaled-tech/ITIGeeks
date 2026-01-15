import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FaLayerGroup, FaUsers, FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaShieldAlt, FaChartBar } from 'react-icons/fa';

const AdminDashboard = () => {
    const { isAdmin } = useAuth();
    const [tracks, setTracks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newTrackName, setNewTrackName] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedTrackId, setSelectedTrackId] = useState('');
    const [editingTrack, setEditingTrack] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!isAdmin) return;
            setLoading(true);
            try {
                const tSnap = await getDocs(collection(db, 'tracks'));
                setTracks(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                const gSnap = await getDocs(collection(db, 'groups'));
                setGroups(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error('Error fetching data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isAdmin]);

    const handleAddTrack = async (e) => {
        e.preventDefault();
        if (!newTrackName.trim()) return;
        try {
            const docRef = await addDoc(collection(db, 'tracks'), { name: newTrackName, headLeaderId: '' });
            setTracks([...tracks, { id: docRef.id, name: newTrackName, headLeaderId: '' }]);
            setNewTrackName('');
        } catch (e) { console.error(e); }
    };

    const handleAddGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim() || !selectedTrackId) return;
        try {
            const docRef = await addDoc(collection(db, 'groups'), { name: newGroupName, trackId: selectedTrackId, supervisorId: '' });
            setGroups([...groups, { id: docRef.id, name: newGroupName, trackId: selectedTrackId, supervisorId: '' }]);
            setNewGroupName('');
        } catch (e) { console.error(e); }
    };

    const handleDeleteTrack = async (trackId) => {
        if (!confirm('Delete this track? This cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, 'tracks', trackId));
            setTracks(tracks.filter(t => t.id !== trackId));
        } catch (e) { console.error(e); }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!confirm('Delete this group? This cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, 'groups', groupId));
            setGroups(groups.filter(g => g.id !== groupId));
        } catch (e) { console.error(e); }
    };

    const handleUpdateTrack = async (trackId, newName) => {
        try {
            await updateDoc(doc(db, 'tracks', trackId), { name: newName });
            setTracks(tracks.map(t => t.id === trackId ? { ...t, name: newName } : t));
            setEditingTrack(null);
        } catch (e) { console.error(e); }
    };

    const handleUpdateGroup = async (groupId, newName) => {
        try {
            await updateDoc(doc(db, 'groups', groupId), { name: newName });
            setGroups(groups.map(g => g.id === groupId ? { ...g, name: newName } : g));
            setEditingGroup(null);
        } catch (e) { console.error(e); }
    };

    if (!isAdmin) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <FaShieldAlt className="text-4xl text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400 font-medium">Access Denied</p>
                <p className="text-red-500/70 dark:text-red-400/70 text-sm mt-1">You don't have permission to view this page.</p>
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <FaShieldAlt className="text-brand" /> Admin Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-leet-sub mt-1">Manage tracks and groups</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="bg-white dark:bg-leet-card px-4 py-2 rounded-lg border dark:border-leet-border">
                        <span className="text-gray-500 dark:text-leet-sub">Tracks:</span>
                        <span className="ml-2 font-bold text-gray-800 dark:text-white">{tracks.length}</span>
                    </div>
                    <div className="bg-white dark:bg-leet-card px-4 py-2 rounded-lg border dark:border-leet-border">
                        <span className="text-gray-500 dark:text-leet-sub">Groups:</span>
                        <span className="ml-2 font-bold text-gray-800 dark:text-white">{groups.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tracks Management */}
                <div className="bg-white dark:bg-leet-card rounded-xl shadow-sm border dark:border-leet-border overflow-hidden">
                    <div className="bg-gradient-to-r from-brand/10 to-brand/5 dark:from-brand/20 dark:to-transparent px-6 py-4 border-b dark:border-leet-border">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                            <FaLayerGroup className="text-brand" /> Manage Tracks
                        </h2>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleAddTrack} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={newTrackName}
                                onChange={(e) => setNewTrackName(e.target.value)}
                                placeholder="New Track Name"
                                className="flex-grow rounded-lg border border-gray-200 dark:border-leet-border p-3 bg-gray-50 dark:bg-leet-input dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                            />
                            <button 
                                type="submit" 
                                className="bg-brand hover:bg-brand-hover text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <FaPlus /> Add
                            </button>
                        </form>
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {tracks.length === 0 ? (
                                <li className="text-center py-8 text-gray-400 dark:text-leet-sub">
                                    No tracks yet. Create your first track above.
                                </li>
                            ) : tracks.map(t => (
                                <li key={t.id} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-leet-input rounded-lg hover:bg-gray-100 dark:hover:bg-leet-border transition-colors">
                                    {editingTrack === t.id ? (
                                        <input
                                            type="text"
                                            defaultValue={t.name}
                                            autoFocus
                                            onBlur={(e) => handleUpdateTrack(t.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTrack(t.id, e.target.value)}
                                            className="flex-grow bg-white dark:bg-leet-card border border-brand rounded px-2 py-1 dark:text-white"
                                        />
                                    ) : (
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{t.name}</span>
                                    )}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setEditingTrack(t.id)}
                                            className="p-2 text-gray-400 hover:text-brand transition-colors"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTrack(t.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Groups Management */}
                <div className="bg-white dark:bg-leet-card rounded-xl shadow-sm border dark:border-leet-border overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-transparent px-6 py-4 border-b dark:border-leet-border">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                            <FaUsers className="text-blue-500" /> Manage Groups
                        </h2>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleAddGroup} className="space-y-3 mb-6">
                            <select
                                value={selectedTrackId}
                                onChange={(e) => setSelectedTrackId(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-leet-border p-3 bg-gray-50 dark:bg-leet-input dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">Select Track</option>
                                {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="New Group Name"
                                    className="flex-grow rounded-lg border border-gray-200 dark:border-leet-border p-3 bg-gray-50 dark:bg-leet-input dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <button 
                                    type="submit" 
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <FaPlus /> Add
                                </button>
                            </div>
                        </form>
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {groups.length === 0 ? (
                                <li className="text-center py-8 text-gray-400 dark:text-leet-sub">
                                    No groups yet. Create a track first, then add groups.
                                </li>
                            ) : groups.map(g => (
                                <li key={g.id} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-leet-input rounded-lg hover:bg-gray-100 dark:hover:bg-leet-border transition-colors">
                                    {editingGroup === g.id ? (
                                        <input
                                            type="text"
                                            defaultValue={g.name}
                                            autoFocus
                                            onBlur={(e) => handleUpdateGroup(g.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateGroup(g.id, e.target.value)}
                                            className="flex-grow bg-white dark:bg-leet-card border border-blue-500 rounded px-2 py-1 dark:text-white"
                                        />
                                    ) : (
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-200">{g.name}</span>
                                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-leet-border text-gray-500 dark:text-leet-sub">
                                                {tracks.find(t => t.id === g.trackId)?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setEditingGroup(g.id)}
                                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteGroup(g.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
