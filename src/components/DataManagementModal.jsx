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

    const uniqueSheets = React.useMemo(() => {
        if (!userData?.problems) return [];
        const ss = new Set(userData.problems.flatMap(p => p.sourceSheets || []));
        return [...ss].sort();
    }, [userData]);

    const handleDeleteSheet = async (sheetName) => {
        if (window.confirm(`Delete all problems associated with "${sheetName}"?`)) {
            const updatedProblems = userData.problems.filter(p => {
                const sheets = p.sourceSheets || [];
                if (sheets.includes(sheetName)) {
                    // If this is the only sheet, remove the problem (return false)
                    if (sheets.length === 1) return false;
                    // Otherwise, remove the sheet from the list (mutate copy or return true with side effect? Filter is better)
                    // Wait, filter expects boolean. I need to map then filter?
                    // No, I should map to remove the sheet, then filter out problems with no sheets?
                    // Actually, the requirement says "filter out *only* the problems associated with that specific sheet source".
                    // This implies if I delete "Sheet A", problems in "Sheet A" are gone.
                    // But if a problem is in "Sheet A" and "Sheet B", and I delete "Sheet A", 
                    // usually "Delete Sheet" implies removing the *sheet tag*.
                    // Let's stick to: Remove sheet tag. If no tags left, remove problem.
                    return true;
                }
                return true;
            }).map(p => {
                const sheets = p.sourceSheets || [];
                if (sheets.includes(sheetName)) {
                    return { ...p, sourceSheets: sheets.filter(s => s !== sheetName) };
                }
                return p;
            }).filter(p => p.sourceSheets && p.sourceSheets.length > 0);

            await updateUserData({ ...userData, problems: updatedProblems });
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

                    <div className="border-t dark:border-leet-border pt-4 mt-4">
                        <h4 className="text-md font-bold mb-2 dark:text-gray-200">Manage Sheets</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {uniqueSheets.length === 0 ? (
                                <p className="text-sm text-gray-500">No sheets found.</p>
                            ) : (
                                uniqueSheets.map(sheet => (
                                    <div key={sheet} className="flex justify-between items-center bg-gray-50 dark:bg-leet-input p-2 rounded">
                                        <span className="text-sm dark:text-gray-300 truncate" title={sheet}>{sheet}</span>
                                        <button
                                            onClick={() => handleDeleteSheet(sheet)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Delete Sheet"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagementModal;
