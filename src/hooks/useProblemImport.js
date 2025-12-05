import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// --- 1. Configuration & Maps ---
const META_SHEET_CSV = "https://docs.google.com/spreadsheets/d/1sRWp95wqo3a7lLBbtNd_3KkTyGjx_9sctTOL5JOb6pA/export?format=csv";
let metaMap = new Map();
let isMetadataLoaded = false;

// NeetCode to LeetCode Mapping (Crucial for matching)
const neetCodeMap = {
    "duplicate integer": "contains duplicate",
    "is anagram": "valid anagram",
    "two integer sum": "two sum",
    "anagram groups": "group anagrams",
    "top k elements in list": "top k frequent elements",
    "string encode and decode": "encode and decode strings",
    "products of array discluding self": "product of array except self",
    "valid sudoku": "valid sudoku",
    "longest consecutive sequence": "longest consecutive sequence",
    "valid palindrome": "valid palindrome",
    "three integer sum": "3sum",
    "buy and sell crypto": "best time to buy and sell stock",
    "longest substring without duplicates": "longest substring without repeating characters",
    "longest repeating substring with replacement": "longest repeating character replacement",
    "minimum window with characters": "minimum window substring",
    "validate parentheses": "valid parentheses",
    "valid parentheses": "valid parentheses",
    "reverse a linked list": "reverse linked list",
    "merge two sorted linked lists": "merge two sorted lists",
    "reorder linked list": "reorder list",
    "remove node from end of linked list": "remove nth node from end of list",
    "copy linked list with random pointer": "copy list with random pointer",
    "add two numbers": "add two numbers",
    "linked list cycle detection": "linked list cycle",
    "find the duplicate number": "find the duplicate number",
    "lru cache": "lru cache",
    "merge k sorted linked lists": "merge k sorted lists",
    "reverse nodes in k-group": "reverse nodes in k-group",
    "invert binary tree": "invert binary tree",
    "maximum depth of binary tree": "maximum depth of binary tree",
    "diameter of binary tree": "diameter of binary tree",
    "balanced binary tree": "balanced binary tree",
    "same binary tree": "same tree",
    "subtree of another tree": "subtree of another tree",
    "lowest common ancestor of a binary search tree": "lowest common ancestor of a binary search tree",
    "binary tree level order traversal": "binary tree level order traversal",
    "binary tree right side view": "binary tree right side view",
    "count good nodes in binary tree": "count good nodes in binary tree",
    "validate binary search tree": "validate binary search tree",
    "kth smallest integer in bst": "kth smallest element in a bst",
    "construct binary tree from preorder and inorder traversal": "construct binary tree from preorder and inorder traversal",
    "binary tree maximum path sum": "binary tree maximum path sum",
    "serialize and deserialize binary tree": "serialize and deserialize binary tree"
};

// --- 2. Metadata Fetching (The Database) ---
async function fetchMetadata() {
    if (isMetadataLoaded) return;
    try {
        const res = await fetch(META_SHEET_CSV);
        const text = await res.text();
        // Parse CSV to build the Knowledge Base (metaMap)
        const p = Papa.parse(text, { header: false, skipEmptyLines: true });
        p.data.slice(3).forEach(r => {
            if (r.length > 6) {
                const title = r[1]?.trim();
                const topic = r[5]?.trim();
                const difficulty = r[6]?.trim();

                if (title) {
                    // Store by slug (hyphenated)
                    const slugKey = title.toLowerCase().replace(/\s+/g, '-');
                    const data = {
                        d: (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) ? difficulty : null,
                        t: topic || 'Uncategorized'
                    };
                    metaMap.set(slugKey, data);
                    // Store by full name (lowercase)
                    metaMap.set(title.toLowerCase(), data);
                }
            }
        });
        isMetadataLoaded = true;
        console.log("Metadata Loaded");
    } catch (e) { console.error("Failed to load metadata:", e); }
}

// --- 3. The Smart Matching Algorithm ---
function findBestMatch(name) {
    let cleanName = name.toLowerCase();
    // 1. Check Manual Mapping (NeetCode -> LeetCode)
    if (neetCodeMap[cleanName]) cleanName = neetCodeMap[cleanName];

    // 2. Check Exact Slug Match
    const slug = cleanName.replace(/\s+/g, '-');
    if (metaMap.has(slug)) return metaMap.get(slug);

    // 3. Check Space-Separated Match
    const spaceName = cleanName.replace(/-/g, ' ');
    if (metaMap.has(spaceName)) return metaMap.get(spaceName);

    // 4. Fuzzy / Partial Match
    for (let [key, val] of metaMap) {
        if (key.includes(spaceName) || spaceName.includes(key)) return val;
    }
    return null;
}

export const useProblemImport = () => {
    const { userData, updateUserData } = useAuth();
    const [importing, setImporting] = useState(false);

    // Load metadata on mount
    useEffect(() => {
        fetchMetadata();
    }, []);

    const importProblems = useCallback(async (file) => {
        if (!file) return;
        setImporting(true);

        // Ensure metadata is loaded before processing
        if (!isMetadataLoaded) {
            await fetchMetadata();
        }

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!jsonData || jsonData.length === 0) {
                alert("No data found in file.");
                setImporting(false);
                return;
            }

            // Find header row
            let headerRowIndex = 0;
            let headers = [];

            for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
                const row = jsonData[i];
                if (row.some(cell => typeof cell === 'string' && ['title', 'problem', 'link', 'url', 'name'].some(k => cell.toLowerCase().includes(k)))) {
                    headerRowIndex = i;
                    headers = row;
                    break;
                }
            }

            if (headers.length === 0) headers = jsonData[0];

            const finalData = jsonData.slice(headerRowIndex + 1).map(row => {
                let obj = {};
                headers.forEach((h, i) => {
                    if (h) obj[h] = row[i];
                });
                return obj;
            });

            const getValue = (row, keys) => {
                const rowKeys = Object.keys(row);
                for (const key of keys) {
                    const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase());
                    if (foundKey) return row[foundKey];
                }
                return null;
            };

            const newProblems = finalData.map(row => {
                // Try to find title
                let title = getValue(row, ['Problem Name', 'Title', 'Name', 'Problem']);

                // Try to find URL
                const url = getValue(row, ['Link', 'URL', 'Url', 'Slug']);

                // If no title but we have URL, use URL to derive title
                if (!title && url) {
                    title = url;
                }

                if (!title && !url) return null;

                // --- 4. URL Cleaning & Import Logic ---
                let rawUrl = url || title; // Fallback if title is actually a URL
                if (rawUrl && rawUrl.includes('http')) {
                    // CLEANING STEP: Remove query params like ?envType=...
                    rawUrl = rawUrl.split('?')[0];
                }

                // Extract Name from URL if possible
                let name = title;
                if (rawUrl && rawUrl.includes('/problems/')) {
                    name = rawUrl.split('/problems/')[1]?.split('/')[0] || rawUrl.split('/').pop();
                } else if (!name && rawUrl) {
                    name = rawUrl.split('/').pop();
                }

                if (!name) return null;

                name = name.replace(/\/$/, '').replace(/-/g, ' ');

                let diff = getValue(row, ['Difficulty', 'Diff', 'Level']) || 'Unknown';
                let type = 'Uncategorized'; // Default

                // Attempt Match
                const match = findBestMatch(name);
                if (match) {
                    if (match.d) diff = match.d;
                    if (match.t) type = match.t;
                }

                // Format Name for Display (Capitalize)
                const displayName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                // Normalize difficulty if it was "Unknown" but we didn't find a match
                if (!['Easy', 'Medium', 'Hard'].includes(diff)) {
                    // Keep 'Unknown' or default to 'Medium'? Reference says "diff = 'Unknown'" initially.
                    // But if match found, it overrides.
                }

                // Status
                let status = 'Todo';
                const rowStatus = getValue(row, ['Status', 'State']);
                if (rowStatus && ['Done', 'Solved', 'ac'].includes(rowStatus.toLowerCase())) {
                    status = 'Done';
                }

                // Generate slug for uniqueness
                const titleSlug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

                return {
                    title: displayName,
                    titleSlug,
                    difficulty: diff,
                    type: type, // Added type
                    status,
                    url: url || `https://leetcode.com/problems/${titleSlug}/`,
                    addedAt: new Date().toISOString()
                };
            }).filter(p => p !== null);

            if (newProblems.length === 0) {
                alert("Could not parse any problems.");
                setImporting(false);
                return;
            }

            // Merge with existing
            const existing = userData?.problems || [];
            const existingMap = new Map(existing.map(p => [p.titleSlug, p]));

            let addedCount = 0;
            newProblems.forEach(p => {
                if (!existingMap.has(p.titleSlug)) {
                    existingMap.set(p.titleSlug, p);
                    addedCount++;
                }
            });

            const mergedProblems = Array.from(existingMap.values());

            await updateUserData({
                ...userData,
                problems: mergedProblems
            });

            alert(`Successfully imported ${addedCount} new problems!`);

        } catch (error) {
            console.error("Import failed:", error);
            alert("Failed to import file. " + error.message);
        } finally {
            setImporting(false);
        }
    }, [userData, updateUserData]);

    return { importProblems, importing };
};
