import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FaLayerGroup, FaUsers, FaPlus } from 'react-icons/fa';

const AdminDashboard = () => {
    const { isAdmin } = useAuth();
    const [tracks, setTracks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newTrackName, setNewTrackName] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedTrackId, setSelectedTrackId] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!isAdmin) return;
            const tSnap = await getDocs(collection(db, 'tracks'));
            setTracks(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            const gSnap = await getDocs(collection(db, 'groups'));
            setGroups(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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

    if (!isAdmin) return <div className="text-red-500 p-6">Access Denied</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 dark:text-white">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tracks Management */}
                <div className="bg-white dark:bg-leet-card rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <FaLayerGroup className="text-brand" /> Manage Tracks
                    </h2>
                    <form onSubmit={handleAddTrack} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newTrackName}
                            onChange={(e) => setNewTrackName(e.target.value)}
                            placeholder="New Track Name"
                            className="flex-grow rounded border p-2 dark:bg-leet-input dark:text-white"
                        />
                        <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700"><FaPlus /></button>
                    </form>
                    <ul className="space-y-2">
                        {tracks.map(t => (
                            <li key={t.id} className="p-2 bg-gray-50 dark:bg-leet-input rounded dark:text-gray-300">{t.name}</li>
                        ))}
                    </ul>
                </div>

                {/* Groups Management */}
                <div className="bg-white dark:bg-leet-card rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <FaUsers className="text-blue-500" /> Manage Groups
                    </h2>
                    <form onSubmit={handleAddGroup} className="flex flex-col gap-2 mb-4">
                        <select
                            value={selectedTrackId}
                            onChange={(e) => setSelectedTrackId(e.target.value)}
                            className="rounded border p-2 dark:bg-leet-input dark:text-white"
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
                                className="flex-grow rounded border p-2 dark:bg-leet-input dark:text-white"
                            />
                            <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><FaPlus /></button>
                        </div>
                    </form>
                    <ul className="space-y-2">
                        {groups.map(g => (
                            <li key={g.id} className="p-2 bg-gray-50 dark:bg-leet-input rounded dark:text-gray-300">
                                <span className="font-bold">{g.name}</span> <span className="text-xs text-gray-500">({tracks.find(t => t.id === g.trackId)?.name})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
