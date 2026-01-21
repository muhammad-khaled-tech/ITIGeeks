import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import mammoth from 'mammoth';

// LeetCode URL pattern - matches both problem URLs and submission URLs
const LEETCODE_URL_PATTERN = /https?:\/\/leetcode\.com\/problems\/([a-z0-9-]+)/gi;

// Extract LeetCode problem slugs from text
function extractLeetCodeSlugs(text) {
    const matches = [];
    let match;
    
    // Reset regex state
    LEETCODE_URL_PATTERN.lastIndex = 0;
    
    while ((match = LEETCODE_URL_PATTERN.exec(text)) !== null) {
        const slug = match[1];
        if (slug && !matches.includes(slug)) {
            matches.push(slug);
        }
    }
    
    return matches;
}

// Generate display title from slug
function slugToTitle(slug) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Parse text-based files (.txt, .md)
async function parseTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
    });
}

// Parse DOCX files using mammoth
async function parseDocxFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('DOCX parsing error:', error);
        throw new Error('Failed to parse DOCX file');
    }
}

// Parse PDF files using pdf.js (lazy loaded)
async function parsePdfFile(file) {
    try {
        // Lazy load pdf.js to reduce initial bundle size
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF file. Make sure pdfjs-dist is installed.');
    }
}

// Get file parser based on extension
function getFileParser(fileName) {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
        case 'txt':
        case 'md':
        case 'markdown':
            return parseTextFile;
        case 'docx':
            return parseDocxFile;
        case 'pdf':
            return parsePdfFile;
        default:
            return null;
    }
}

// Check if file is supported for URL extraction
export function isUrlExtractionSupported(fileName) {
    const supportedExtensions = ['txt', 'md', 'markdown', 'docx', 'pdf'];
    const extension = fileName.toLowerCase().split('.').pop();
    return supportedExtensions.includes(extension);
}

// Main hook for URL extraction from files
export const useUrlExtract = () => {
    const { userData, updateUserData } = useAuth();
    const [extracting, setExtracting] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // Extract URLs from file and return preview data
    const extractUrlsFromFile = useCallback(async (file) => {
        if (!file) return null;
        setExtracting(true);

        try {
            const parser = getFileParser(file.name);
            
            if (!parser) {
                throw new Error(`Unsupported file type: ${file.name.split('.').pop()}`);
            }

            // Parse file content
            const text = await parser(file);
            
            // Extract LeetCode slugs
            const slugs = extractLeetCodeSlugs(text);
            
            if (slugs.length === 0) {
                throw new Error('No LeetCode problem URLs found in this file');
            }

            // Check which are new vs existing
            const existingProblems = userData?.problems || [];
            const existingSlugs = new Set(existingProblems.map(p => p.titleSlug));

            const problems = slugs.map(slug => ({
                title: slugToTitle(slug),
                titleSlug: slug,
                url: `https://leetcode.com/problems/${slug}/`,
                difficulty: 'Unknown',
                status: 'Todo',
                isNew: !existingSlugs.has(slug),
                selected: !existingSlugs.has(slug), // Pre-select new ones
                addedAt: new Date().toISOString()
            }));

            const preview = {
                fileName: file.name,
                totalFound: problems.length,
                newCount: problems.filter(p => p.isNew).length,
                existingCount: problems.filter(p => !p.isNew).length,
                problems
            };

            setPreviewData(preview);
            return preview;

        } catch (error) {
            console.error('URL extraction failed:', error);
            throw error;
        } finally {
            setExtracting(false);
        }
    }, [userData]);

    // Import selected problems from preview
    const importSelectedProblems = useCallback(async (selectedProblems) => {
        if (!selectedProblems || selectedProblems.length === 0) {
            throw new Error('No problems selected');
        }

        try {
            const existing = userData?.problems || [];
            const existingMap = new Map(existing.map(p => [p.titleSlug, p]));

            let addedCount = 0;
            selectedProblems.forEach(p => {
                if (!existingMap.has(p.titleSlug)) {
                    existingMap.set(p.titleSlug, {
                        title: p.title,
                        titleSlug: p.titleSlug,
                        url: p.url,
                        difficulty: p.difficulty,
                        status: p.status,
                        addedAt: p.addedAt
                    });
                    addedCount++;
                }
            });

            const mergedProblems = Array.from(existingMap.values());

            await updateUserData({
                ...userData,
                problems: mergedProblems
            });

            setPreviewData(null);
            return addedCount;

        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }, [userData, updateUserData]);

    // Clear preview
    const clearPreview = useCallback(() => {
        setPreviewData(null);
    }, []);

    return {
        extractUrlsFromFile,
        importSelectedProblems,
        clearPreview,
        extracting,
        previewData
    };
};

export default useUrlExtract;
