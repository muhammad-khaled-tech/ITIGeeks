import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaSave, FaCog, FaPalette, FaUserShield, FaCode, FaBell, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const Settings = () => {
    const { isDark } = useOutletContext() || { isDark: true };
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        appName: 'ITIGeeks',
        appTagline: 'LeetCode Tracker for ITI Students',
        defaultTheme: 'dark',
        allowRegistration: true,
        requireApproval: false,
        leetcodeApiEnabled: true,
        contestNotifications: true,
        assignmentReminders: true,
        adminEmails: '',
        maintenanceMode: false,
        maintenanceMessage: 'We are currently performing maintenance. Please check back soon.'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
            if (settingsDoc.exists()) {
                setSettings({ ...settings, ...settingsDoc.data() });
            }
        } catch (e) {
            console.error('Error fetching settings:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'app'), {
                ...settings,
                updatedAt: new Date().toISOString()
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error('Error saving settings:', e);
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Settings</h1>
                    <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>Configure your application</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        saved 
                            ? 'bg-green-600 text-white' 
                            : 'bg-brand hover:bg-brand-hover text-white'
                    } disabled:opacity-50`}
                >
                    {saved ? <><FaCheck /> Saved!</> : saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                </button>
            </div>

            {/* General Settings */}
            <SettingsSection isDark={isDark} icon={<FaCog />} title="General">
                <SettingRow isDark={isDark} label="App Name" description="The name displayed in the header and browser tab">
                    <input
                        type="text"
                        value={settings.appName}
                        onChange={(e) => updateSetting('appName', e.target.value)}
                        className={`w-64 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                        }`}
                    />
                </SettingRow>
                <SettingRow isDark={isDark} label="Tagline" description="Subtitle shown on the landing page">
                    <input
                        type="text"
                        value={settings.appTagline}
                        onChange={(e) => updateSetting('appTagline', e.target.value)}
                        className={`w-64 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                        }`}
                    />
                </SettingRow>
            </SettingsSection>

            {/* Appearance */}
            <SettingsSection isDark={isDark} icon={<FaPalette />} title="Appearance">
                <SettingRow isDark={isDark} label="Default Theme" description="Default theme for new users">
                    <select
                        value={settings.defaultTheme}
                        onChange={(e) => updateSetting('defaultTheme', e.target.value)}
                        className={`w-40 px-4 py-2 rounded-lg focus:outline-none ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                        }`}
                    >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                    </select>
                </SettingRow>
            </SettingsSection>

            {/* Access Control */}
            <SettingsSection isDark={isDark} icon={<FaUserShield />} title="Access Control">
                <SettingRow isDark={isDark} label="Allow Registration" description="Allow new users to sign up">
                    <Toggle isDark={isDark} checked={settings.allowRegistration} onChange={(v) => updateSetting('allowRegistration', v)} />
                </SettingRow>
                <SettingRow isDark={isDark} label="Require Approval" description="New users must be approved by admin">
                    <Toggle isDark={isDark} checked={settings.requireApproval} onChange={(v) => updateSetting('requireApproval', v)} />
                </SettingRow>
                <SettingRow isDark={isDark} label="Admin Emails" description="Comma-separated list of admin emails">
                    <input
                        type="text"
                        value={settings.adminEmails}
                        onChange={(e) => updateSetting('adminEmails', e.target.value)}
                        placeholder="admin@example.com, ..."
                        className={`w-80 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                        }`}
                    />
                </SettingRow>
            </SettingsSection>

            {/* Integrations */}
            <SettingsSection isDark={isDark} icon={<FaCode />} title="Integrations">
                <SettingRow isDark={isDark} label="LeetCode API" description="Enable LeetCode problem syncing">
                    <Toggle isDark={isDark} checked={settings.leetcodeApiEnabled} onChange={(v) => updateSetting('leetcodeApiEnabled', v)} />
                </SettingRow>
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection isDark={isDark} icon={<FaBell />} title="Notifications">
                <SettingRow isDark={isDark} label="Contest Notifications" description="Send notifications for new contests">
                    <Toggle isDark={isDark} checked={settings.contestNotifications} onChange={(v) => updateSetting('contestNotifications', v)} />
                </SettingRow>
                <SettingRow isDark={isDark} label="Assignment Reminders" description="Send reminders before assignment deadlines">
                    <Toggle isDark={isDark} checked={settings.assignmentReminders} onChange={(v) => updateSetting('assignmentReminders', v)} />
                </SettingRow>
            </SettingsSection>

            {/* Maintenance */}
            <SettingsSection isDark={isDark} icon={<FaExclamationTriangle />} title="Maintenance">
                <SettingRow isDark={isDark} label="Maintenance Mode" description="Show maintenance page to users">
                    <Toggle isDark={isDark} checked={settings.maintenanceMode} onChange={(v) => updateSetting('maintenanceMode', v)} />
                </SettingRow>
                {settings.maintenanceMode && (
                    <SettingRow isDark={isDark} label="Maintenance Message" description="Message shown during maintenance">
                        <textarea
                            value={settings.maintenanceMessage}
                            onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                            rows={2}
                            className={`w-80 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                                isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-gray-100'
                            }`}
                        />
                    </SettingRow>
                )}
            </SettingsSection>

            {/* Danger Zone */}
            <div className={`rounded-lg p-6 border-2 border-red-500/30 ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 text-red-500`}>
                    <FaExclamationTriangle /> Danger Zone
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-medium ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Reset All Settings</p>
                            <p className={`text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>Restore all settings to default values</p>
                        </div>
                        <button 
                            onClick={() => {
                                if (confirm('Are you sure you want to reset all settings?')) {
                                    setSettings({
                                        appName: 'ITIGeeks',
                                        appTagline: 'LeetCode Tracker for ITI Students',
                                        defaultTheme: 'dark',
                                        allowRegistration: true,
                                        requireApproval: false,
                                        leetcodeApiEnabled: true,
                                        contestNotifications: true,
                                        assignmentReminders: true,
                                        adminEmails: '',
                                        maintenanceMode: false,
                                        maintenanceMessage: 'We are currently performing maintenance. Please check back soon.'
                                    });
                                }
                            }}
                            className="px-4 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        >
                            Reset Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Settings Section Component
const SettingsSection = ({ isDark, icon, title, children }) => (
    <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-leet-border' : 'border-gray-200'}`}>
            <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                {icon} {title}
            </h3>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

// Setting Row Component
const SettingRow = ({ isDark, label, description, children }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className={`font-medium ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>{label}</p>
            <p className={`text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>{description}</p>
        </div>
        {children}
    </div>
);

// Toggle Component
const Toggle = ({ isDark, checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
            checked ? 'bg-brand' : isDark ? 'bg-leet-input' : 'bg-gray-300'
        }`}
    >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
        }`} />
    </button>
);

export default Settings;
