import React, { useState } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ManualAddModal = ({ isOpen, onClose }) => {
    const { userData, updateUserData } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        difficulty: 'Easy',
        type: 'Array',
        status: 'Done'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title) return;

        const newProblem = {
            ...formData,
            id: Date.now().toString(), // Simple ID generation
            titleSlug: formData.title.toLowerCase().replace(/\s+/g, '-'),
            completedDate: formData.status === 'Done' ? new Date().toISOString() : null,
            sourceSheets: ['Manual']
        };

        const updatedProblems = [...(userData.problems || []), newProblem];
        await updateUserData({ ...userData, problems: updatedProblems });
        onClose();
        setFormData({ title: '', url: '', difficulty: 'Easy', type: 'Array', status: 'Done' });
        alert("Problem added!");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-md rounded-lg shadow-xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border">
                    <h3 className="text-lg font-bold dark:text-white">Add Problem Manually</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Problem Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:border-leet-border dark:text-white shadow-sm focus:border-brand focus:ring-brand sm:text-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL (Optional)</label>
                        <input
                            type="url"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:border-leet-border dark:text-white shadow-sm focus:border-brand focus:ring-brand sm:text-sm p-2"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:border-leet-border dark:text-white shadow-sm focus:border-brand focus:ring-brand sm:text-sm p-2"
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:bg-leet-input dark:border-leet-border dark:text-white shadow-sm focus:border-brand focus:ring-brand sm:text-sm p-2"
                            >
                                <option>Done</option>
                                <option>In Progress</option>
                                <option>Not Opened</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition"
                    >
                        <FaPlus className="inline mr-2" /> Add Problem
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManualAddModal;
