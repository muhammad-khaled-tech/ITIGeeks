import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaLink, FaSpinner, FaFileAlt } from 'react-icons/fa';
import { useProblemImport } from '../../hooks/useProblemImport';
import { POINTS } from '../../services/leaderboardService';
import { guessCategory, findBestMatch } from '../../utils/problemUtils';
import ImportHistory from './ImportHistory';

// Supported file types
const SUPPORTED_TYPES = {
  'xlsx': 'Excel',
  'xls': 'Excel',
  'csv': 'CSV',
  'pdf': 'PDF',
  'docx': 'Word',
  'md': 'Markdown',
  'txt': 'Text'
};

// LeetCode URL pattern
const LEETCODE_URL_PATTERN = /https?:\/\/leetcode\.com\/problems\/([a-z0-9-]+)/gi;

/**
 * Import Tab Component
 * Allows file upload and URL pasting for problem import
 */
const ImportTab = ({ onImportComplete }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const { importProblems, mergeProblems, importing: hookImporting } = useProblemImport();

  // Extract URLs from text
  const extractUrls = (text) => {
    const matches = [...text.matchAll(LEETCODE_URL_PATTERN)];
    return [...new Set(matches.map(m => m[1]))]; // Unique slugs
  };

  // Handle file upload
  const handleFile = async (file) => {
    if (!file) return;
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_TYPES[ext]) {
      setError(`Unsupported file type: .${ext}`);
      return;
    }

    setImporting(true);
    setError(null);

    try {
      // Use the existing import hook for file processing
      await importProblems(file);
      // Note: The hook handles merging with user data
      // For assignment/contest we'd want to return the extracted problems
      // This is a simplified version - can be enhanced
      onImportComplete({ problems: [], message: 'File processed successfully!' });
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  // Handle URL paste submission
  const handleUrlSubmit = async () => {
    // Check for List/Tag/StudyPlan URL
    const isListUrl = urlInput.match(/leetcode\.com\/(list|tag|study-plan|studyplan)\//i);
    
    setImporting(true);
    setError(null);

    try {
      let problems = [];
      let sheetName = null;

      if (isListUrl) {
        // --- PROXY FETCH FOR LISTS ---
        const res = await fetch(`/api/import-proxy?url=${encodeURIComponent(urlInput.trim())}`);
        
        // Handle local dev (Vite SPA fallback) returning HTML instead of JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            throw new Error("Import API not available locally. To test this, run 'vercel dev' or use the live deployment.");
        }

        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.message || "Failed to fetch list");
        }
        const data = await res.json();
        
        if (!data.slugs || data.slugs.length === 0) {
          throw new Error("No problems found in this list.");
        }

        sheetName = data.title || "Imported List";
        
        problems = data.slugs.map(slug => {
          const match = findBestMatch(slug);
          const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return {
            title,
            titleSlug: slug,
            url: `https://leetcode.com/problems/${slug}/`,
            difficulty: match?.d || 'Unknown',
            score: match?.d === 'Hard' ? POINTS.HARD : (match?.d === 'Medium' ? POINTS.MEDIUM : POINTS.EASY),
            topic: match?.t || guessCategory(slug),
            status: 'Todo',
            addedAt: new Date().toISOString(),
            sourceSheets: [sheetName] // Tag with Sheet Name
          };
        });

      } else {
        // --- STANDARD URL PASTE ---
        const slugs = extractUrls(urlInput);
    
        if (slugs.length === 0) {
          throw new Error('No valid LeetCode URLs found. Please paste URLs in format: https://leetcode.com/problems/problem-name/');
        }

        problems = slugs.map(slug => {
          const match = findBestMatch(slug);
          const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return {
            title,
            titleSlug: slug,
            url: `https://leetcode.com/problems/${slug}/`,
            difficulty: match?.d || 'Unknown',
            score: match?.d === 'Hard' ? POINTS.HARD : (match?.d === 'Medium' ? POINTS.MEDIUM : POINTS.EASY),
            topic: match?.t || guessCategory(slug),
            status: 'Todo',
            addedAt: new Date().toISOString()
            // No sourceSheets for manual paste unless we add an input for it later
          };
        });
      }

      // VITAL: Persist to User Data (merged)
      const importMetadata = {
        type: isListUrl ? 'link' : 'manual',
        name: isListUrl ? sheetName : `Manual Paste (${problems.length} problems)`
      };
      
      const addedCount = await mergeProblems(problems, importMetadata);

      onImportComplete({
        success: true,
        problems, // Pass to preview
        warnings: [],
        stats: { total: problems.length, added: addedCount }
      });
      
      // Clear input
      setUrlInput('');

    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📤 Upload File
        </label>
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${dragActive 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.docx,.md,.txt"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
          
          <FaCloudUploadAlt className={`mx-auto text-5xl mb-4 ${
            dragActive ? 'text-purple-600' : 'text-gray-400'
          }`} />
          
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {dragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Supported: {Object.values(SUPPORTED_TYPES).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">or</span>
        </div>
      </div>

      {/* URL Paste Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FaLink className="inline mr-2" />
          Paste LeetCode URLs
        </label>
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste LeetCode problem URLs here (one per line)&#10;Example:&#10;https://leetcode.com/problems/two-sum/&#10;https://leetcode.com/problems/valid-parentheses/"
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   placeholder-gray-400 dark:placeholder-gray-500
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   resize-none transition-all duration-200"
        />
        
        {/* URL Count */}
        {urlInput && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Found {extractUrls(urlInput).length} valid LeetCode URL(s)
          </p>
        )}
        
        {/* Submit Button */}
        <button
          onClick={handleUrlSubmit}
          disabled={importing || !urlInput.trim() || extractUrls(urlInput).length === 0}
          className="mt-4 w-full py-3 rounded-lg font-medium
                   bg-gradient-to-r from-purple-600 to-blue-600
                   text-white shadow-lg shadow-purple-500/30
                   hover:from-purple-700 hover:to-blue-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200
                   flex items-center justify-center gap-2"
        >
          {importing || hookImporting ? (
            <>
              <FaSpinner className="animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FaFileAlt />
              Import URLs
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Import History */}
      <ImportHistory />
    </div>
  );
};

export default ImportTab;
