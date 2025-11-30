import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaIdBadge, FaSave, FaTrophy } from 'react-icons/fa';
import Badge from '../components/Badge';

const Profile = () => {
    const { userData, updateUserData } = useAuth();
    const [username, setUsername] = useState(userData?.leetcodeUsername || '');
    const [saving, setSaving] = useState(false);

    // Gamification Logic: Check for new badges
    useEffect(() => {
        if (!userData) return;
        const currentBadges = new Set(userData.badges || []);
        let newBadges = [];

        // Logic 1: Solved Count
        const solvedCount = userData.problems?.filter(p => p.status === 'Done').length || 0;
        if (solvedCount >= 10 && !currentBadges.has('Bronze Coder')) newBadges.push('Bronze Coder');
        if (solvedCount >= 50 && !currentBadges.has('Silver Coder')) newBadges.push('Silver Coder');
        if (solvedCount >= 100 && !currentBadges.has('Gold Coder')) newBadges.push('Gold Coder');

        // Logic 2: Streak (Mock logic for now, assuming 'streak' field exists or derived)
        // if (userData.streak >= 7 && !currentBadges.has('On Fire')) newBadges.push('On Fire');

        if (newBadges.length > 0) {
            const updatedBadges = [...(userData.badges || []), ...newBadges];
            updateUserData({ ...userData, badges: updatedBadges });
            alert(`Congratulations! You earned new badges: ${newBadges.join(', ')}`);
        }
    }, [userData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Basic validation/extraction
            let cleanUsername = username.trim();
            if (cleanUsername.includes('leetcode.com/u/')) {
                cleanUsername = cleanUsername.split('/u/')[1].split('/')[0];
            }
            await updateUserData({ ...userData, leetcodeUsername: cleanUsername });
            setUsername(cleanUsername);
            alert('Profile updated!');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (!userData) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-leet-card rounded-lg shadow p-6 mt-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                <FaUser className="text-brand dark:text-brand-dark" /> Profile
            </h2>

            <div className="space-y-6">
                {/* Role & Track Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-leet-input p-4 rounded">
                        <label className="text-xs text-gray-500 uppercase font-bold">Role</label>
                        <p className="text-lg font-medium capitalize dark:text-white">{userData.role}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-leet-input p-4 rounded">
                        <label className="text-xs text-gray-500 uppercase font-bold">Track / Group</label>
                        <p className="text-lg font-medium dark:text-white">
                            {userData.trackId || 'No Track'} / {userData.groupId || 'No Group'}
                        </p>
                    </div>
                </div>

                {/* LeetCode Username */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LeetCode Username</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. mohamed"
                            className="flex-grow rounded-md border-gray-300 dark:border-leet-border dark:bg-leet-input dark:text-leet-text shadow-sm focus:border-brand focus:ring-brand sm:text-sm py-2 px-3"
                        />
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                        >
                            <FaSave /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Used for syncing solved problems.</p>
                </div>

                {/* Trophy Case */}
                <div className="border-t dark:border-leet-border pt-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <FaTrophy className="text-yellow-500" /> Trophy Case
                    </h3>
                    <div className="bg-gray-50 dark:bg-leet-input rounded-lg p-6 flex flex-wrap gap-4 justify-center min-h-[100px] items-center">
                        {userData.badges && userData.badges.length > 0 ? (
                            userData.badges.map((b, i) => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <Badge name={b} size="lg" />
                                    <span className="text-xs font-medium dark:text-gray-300">{b}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <FaIdBadge className="text-4xl mx-auto mb-2 opacity-20" />
                                <p>Solve problems to earn badges!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
