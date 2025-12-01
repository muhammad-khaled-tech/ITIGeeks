import React from 'react';
import { FaTimes, FaDownload, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const DataManagementModal = ({ isOpen, onClose }) => {
    const { userData, updateUserData } = useAuth();

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "itigeeks_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleClearData = async () => {
        if (window.confirm("Are you sure you want to delete all your progress? This cannot be undone.")) {
            await updateUserData({ ...userData, problems: [] });
            alert("All data cleared.");
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-md rounded-lg shadow-xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border">
                    <h3 className="text-lg font-bold dark:text-white">Data Management</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                        <FaTimes />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <button
                        onClick={handleExport}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition"
                    >
                        <FaDownload /> Export Data (JSON)
                    </button>
                    <button
                        onClick={handleClearData}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition"
                    >
                        <FaTrash /> Clear All Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataManagementModal;
