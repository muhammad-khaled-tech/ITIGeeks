import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaCalendarAlt, FaFileAlt, FaLink, FaLayerGroup } from 'react-icons/fa';

const ImportHistory = () => {
  const { userData, updateUserData } = useAuth();
  const [deletingId, setDeletingId] = useState(null);

  const imports = userData?.imports || [];

  const handleDeleteImport = async (importId) => {
    if (!window.confirm("Are you sure you want to delete this import? Problems unique to this import will be permanently removed.")) return;
    
    setDeletingId(importId);
    
    try {
      const existingProblems = userData?.problems || [];
      const updatedProblems = existingProblems.map(p => {
        if (!p.sourceImportIds) return p;
        
        // Remove the specific import ID
        const remainingIds = p.sourceImportIds.filter(id => id !== importId);
        
        return {
          ...p,
          sourceImportIds: remainingIds
        };
      }).filter(p => {
        // Only keep problem if it has other sources
        // Note: Problems added before this feature won't have sourceImportIds
        // We should keep them to avoid accidental data loss for old data.
        return !p.sourceImportIds || p.sourceImportIds.length > 0;
      });

      const updatedImports = imports.filter(i => i.id !== importId);

      await updateUserData({
        ...userData,
        problems: updatedProblems,
        imports: updatedImports
      });
      
      alert("Import deleted successfully.");
    } catch (err) {
      console.error("Failed to delete import:", err);
      alert("Failed to delete import. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (imports.length === 0) return null;

  return (
    <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <FaLayerGroup className="text-purple-500" />
        Import History
      </h3>
      
      <div className="space-y-3">
        {imports.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${item.type === 'link' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                {item.type === 'link' ? <FaLink /> : <FaFileAlt />}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs" title={item.name}>
                  {item.name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt size={10} />
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                    {item.count} problems
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleDeleteImport(item.id)}
              disabled={deletingId === item.id}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Delete this import"
            >
              <FaTrash size={14} className={deletingId === item.id ? 'animate-pulse' : ''} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportHistory;
