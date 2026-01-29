import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaIdBadge, FaSave, FaTrophy, FaChartLine, FaFire, FaCode, FaTerminal } from 'react-icons/fa';
import Badge from '../components/Badge';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LeetCodeAPI } from '../services/leetcodeAPI';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import Breadcrumbs from '../components/Breadcrumbs';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const Profile = () => {
    const { userData, updateUserData } = useAuth();
    const [username, setUsername] = useState(userData?.leetcodeUsername || '');
    const [saving, setSaving] = useState(false);
    const [groupName, setGroupName] = useState('Loading...');
    const [trackName, setTrackName] = useState('Loading...');
    const [skillData, setSkillData] = useState(null);
    const [languageData, setLanguageData] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Fetch Group and Track Info
    useEffect(() => {
        const fetchDetails = async () => {
            if (userData?.groupId) {
                try {
                    const groupRef = doc(db, 'groups', userData.groupId);
                    const groupSnap = await getDoc(groupRef);
                    
                    if (groupSnap.exists()) {
                        const groupData = groupSnap.data();
                        setGroupName(groupData.name);

                        const trackId = groupData.trackId || userData.trackId;
                        if (trackId) {
                            const trackRef = doc(db, 'tracks', trackId);
                            const trackSnap = await getDoc(trackRef);
                            if (trackSnap.exists()) {
                                setTrackName(trackSnap.data().name);
                            } else {
                                setTrackName('Unknown Track');
                            }
                        } else {
                            setTrackName('No Track');
                        }
                    } else {
                        setGroupName('Unknown Group');
                        setTrackName('Unknown Track');
                    }
                } catch (error) {
                    console.error("Error fetching group/track:", error);
                    setGroupName('Error');
                    setTrackName('Error');
                }
            } else {
                setGroupName('No Group');
                setTrackName('No Track');
            }
        };

        fetchDetails();
    }, [userData]);

    // Fetch LeetCode Stats (Skills & Languages)
    useEffect(() => {
        const fetchStats = async () => {
            if (userData?.leetcodeUsername) {
                setLoadingStats(true);
                try {
                    const [skills, languages] = await Promise.all([
                        LeetCodeAPI.getSkillStats(userData.leetcodeUsername),
                        LeetCodeAPI.getLanguageStats(userData.leetcodeUsername)
                    ]);
                    setSkillData(skills);
                    setLanguageData(languages);
                } catch (err) {
                    console.error("Error fetching LC stats:", err);
                } finally {
                    setLoadingStats(false);
                }
            }
        };
        fetchStats();
    }, [userData?.leetcodeUsername]);

    // Gamification Logic: Check for new badges
    useEffect(() => {
        if (!userData) return;
        const currentBadges = new Set(userData.badges || []);
        let newBadges = [];

        const solvedCount = userData.problems?.filter(p => p.status === 'Done').length || 0;
        if (solvedCount >= 10 && !currentBadges.has('Bronze Coder')) newBadges.push('Bronze Coder');
        if (solvedCount >= 50 && !currentBadges.has('Silver Coder')) newBadges.push('Silver Coder');
        if (solvedCount >= 100 && !currentBadges.has('Gold Coder')) newBadges.push('Gold Coder');

        if (newBadges.length > 0) {
            const updatedBadges = [...(userData.badges || []), ...newBadges];
            updateUserData({ ...userData, badges: updatedBadges });
            alert(`Congratulations! You earned new badges: ${newBadges.join(', ')}`);
        }
    }, [userData]);

    const handleSave = async () => {
        setSaving(true);
        try {
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

    // Prepare Skill Radar Data
    const radarData = skillData ? {
        labels: skillData.data?.matchedUser?.tagProblemCounts?.advanced.slice(0, 6).map(s => s.tagName) || ['Arrays', 'Strings', 'DP', 'Math', 'Trees', 'Graphs'],
        datasets: [
            {
                label: 'Solved Problems',
                data: skillData.data?.matchedUser?.tagProblemCounts?.advanced.slice(0, 6).map(s => s.problemsSolved) || [0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(255, 161, 22, 0.2)',
                borderColor: 'rgba(255, 161, 22, 1)',
                borderWidth: 2,
            },
        ],
    } : null;

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: '#ccc', font: { size: 10 } },
                suggestedMin: 0,
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4 px-4">
            <Breadcrumbs />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-leet-card rounded-2xl shadow-xl p-6 text-center">
                        <div className="w-24 h-24 bg-brand rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                            {userData.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold dark:text-white capitalize">{userData.displayName}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">@{userData.leetcodeUsername || 'notset'}</p>
                        
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase">{userData.role}</span>
                            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold uppercase">{trackName}</span>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t dark:border-leet-border">
                            <label className="block text-xs font-bold text-gray-400 uppercase text-left mb-2">Update LeetCode</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username"
                                    className="flex-grow rounded-lg border-gray-300 dark:border-leet-border dark:bg-leet-input dark:text-leet-text text-sm py-1.5 px-3"
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-brand hover:bg-brand-hover text-white p-2 rounded-lg disabled:opacity-50"
                                >
                                    <FaSave />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Trophy Case */}
                    <div className="bg-white dark:bg-leet-card rounded-2xl shadow-xl p-6">
                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                             <FaTrophy className="text-yellow-500" /> Achievements
                        </h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {userData.badges && userData.badges.length > 0 ? (
                                userData.badges.map((b, i) => (
                                    <div key={i} className="group relative">
                                        <Badge name={b} size="md" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {b}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-4">Solve problems to unlock badges!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Statistics */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Points Hero */}
                    <div className="bg-gradient-to-br from-brand to-brand-hover rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                        <FaChartLine className="absolute bottom-4 right-4 text-7xl opacity-10" />
                        <div className="relative z-10">
                            <p className="text-sm font-bold uppercase opacity-80">Overall Progress Points</p>
                            <h1 className="text-5xl font-black italic mt-1">
                                { (userData.easySolved || 0) * 25 + (userData.mediumSolved || 0) * 50 + (userData.hardSolved || 0) * 100 + (userData.streak || 0) * 10 }
                            </h1>
                            <div className="mt-4 flex items-center gap-4 text-sm">
                                <span className="p-2 bg-white/10 rounded-lg flex items-center gap-1">
                                    <FaFire className="text-orange-300" /> {userData.streak || 0} Day Streak
                                </span>
                                <span className="p-2 bg-white/10 rounded-lg flex items-center gap-1 text-blue-100">
                                     Bonus: +{ (userData.streak || 0) * 10 }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Skill Radar */}
                        <div className="bg-white dark:bg-leet-card rounded-2xl shadow-xl p-6">
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-6 flex items-center gap-2">
                                <FaTerminal className="text-brand" /> Advanced Skills
                            </h3>
                            <div className="h-64 flex items-center justify-center">
                                {loadingStats ? (
                                    <div className="animate-pulse w-full h-full bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                                ) : radarData ? (
                                    <Radar data={radarData} options={radarOptions} />
                                ) : (
                                    <p className="text-gray-500">No data available</p>
                                )}
                            </div>
                        </div>

                        {/* Language Distribution */}
                        <div className="bg-white dark:bg-leet-card rounded-2xl shadow-xl p-6">
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-6 flex items-center gap-2">
                                <FaCode className="text-green-500" /> Languages
                            </h3>
                            <div className="space-y-4">
                                {loadingStats ? (
                                    [1,2,3].map(i => <div key={i} className="h-10 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg"></div>)
                                ) : (
                                    languageData?.data?.matchedUser?.languageProblemCount?.slice(0, 4).map((lang, idx) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-leet-input p-3 rounded-xl flex justify-between items-center transition-transform hover:scale-[1.02]">
                                            <span className="font-bold dark:text-gray-200">{lang.languageName}</span>
                                            <span className="text-brand font-black">{lang.problemsSolved}</span>
                                        </div>
                                    )) || <p className="text-gray-500 text-center py-8 text-sm">No data found</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Difficulty Breakdown */}
                    <div className="bg-white dark:bg-leet-card rounded-2xl shadow-xl p-6">
                         <h3 className="text-sm font-bold uppercase text-gray-400 mb-6">Mastery Breakdown</h3>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                                <p className="text-xs text-green-500 font-bold uppercase mb-1">Easy</p>
                                <p className="text-2xl font-black dark:text-white">{userData.easySolved || 0}</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                                <p className="text-xs text-yellow-500 font-bold uppercase mb-1">Medium</p>
                                <p className="text-2xl font-black dark:text-white">{userData.mediumSolved || 0}</p>
                            </div>
                            <div className="text-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <p className="text-xs text-red-500 font-bold uppercase mb-1">Hard</p>
                                <p className="text-2xl font-black dark:text-white">{userData.hardSolved || 0}</p>
                            </div>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;

