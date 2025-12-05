import React, { useState, useEffect } from 'react';
import { FaTimes, FaKey, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa';

const APIConfigModal = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('VITE_GEMINI_API_KEY');
            if (storedKey) setApiKey(storedKey);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('VITE_GEMINI_API_KEY', apiKey.trim());
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onClose();
            }, 1000);
        } else {
            localStorage.removeItem('VITE_GEMINI_API_KEY');
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onClose();
            }, 1000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-md rounded-lg shadow-xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-purple-600 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FaKey /> AI Settings
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80">
                        <FaTimes />
                    </button>
                </div>
                <div className="p-6 text-gray-700 dark:text-gray-300">
                    <p className="mb-4 text-sm">
                        To enable Gemini 1.5 Pro features, please enter your Google Gemini API Key.
                        <br />
                        <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                            Get a free API key here
                        </a>
                    </p>

                    <div className="relative">
                        <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste your API key here..."
                            className="w-full p-3 pr-10 border rounded-md dark:bg-leet-input dark:border-leet-border dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            {showKey ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Key is stored locally in your browser.
                    </p>
                </div>
                <div className="p-4 border-t dark:border-leet-border flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className={`px-4 py-2 rounded text-white flex items-center gap-2 ${saved ? 'bg-green-500' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        {saved ? <><FaCheck /> Saved</> : 'Save Key'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default APIConfigModal;
