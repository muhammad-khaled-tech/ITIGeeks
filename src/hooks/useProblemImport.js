import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

export const useProblemImport = () => {
    const { userData, updateUserData } = useAuth();
    const [importing, setImporting] = useState(false);

    const importProblems = useCallback(async (file) => {
        if (!file) return;
        setImporting(true);

        try {
            const data = await file.arrayBuffer();
            // Fix: Explicitly tell XLSX that we are passing an array buffer
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Read as array of arrays first
            console.log("Raw Sheet Data:", jsonData.slice(0, 5));

            if (!jsonData || jsonData.length === 0) {
                alert("No data found in file.");
                setImporting(false);
                return;
            }

            // Find header row
            let headerRowIndex = 0;
            let headers = [];

            // Simple heuristic: Look for a row that contains "Title" or "Problem" or "Link"
            for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
                const row = jsonData[i];
                if (row.some(cell => typeof cell === 'string' && ['title', 'problem', 'link', 'url', 'name'].some(k => cell.toLowerCase().includes(k)))) {
                    headerRowIndex = i;
                    headers = row;
                    break;
                }
            }

            // If we didn't find a clear header, assume row 0
            if (headers.length === 0) headers = jsonData[0];

            console.log("Detected Headers:", headers);

            // Now parse again or map manually
            const finalData = jsonData.slice(headerRowIndex + 1).map(row => {
                let obj = {};
                headers.forEach((h, i) => {
                    if (h) obj[h] = row[i];
                });
                return obj;
            });

            const jsonDataToUse = finalData;
            console.log("Processed Data Sample:", jsonDataToUse[0]);

            // Map fields to our schema
            // Expected columns: "Problem Name" or "Title", "Link" or "URL", "Difficulty", "Status" (optional)
            // Helper to find value case-insensitively
            const getValue = (row, keys) => {
                const rowKeys = Object.keys(row);
                for (const key of keys) {
                    const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase());
                    if (foundKey) return row[foundKey];
                }
                return null;
            };

            const newProblems = jsonDataToUse.map(row => {
                // Try to find title
                const title = getValue(row, ['Problem Name', 'Title', 'Name', 'Problem']);
                if (!title) return null;

                // Try to find URL/Slug
                const url = getValue(row, ['Link', 'URL', 'Url', 'Slug']);
                let titleSlug = '';
                if (url) {
                    try {
                        const parts = url.split('/problems/');
                        if (parts.length > 1) {
                            titleSlug = parts[1].split('/')[0];
                        }
                    } catch (e) { }
                }
                if (!titleSlug) {
                    titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                }

                // Difficulty
                let difficulty = getValue(row, ['Difficulty', 'Diff', 'Level']) || 'Medium';
                // Normalize difficulty
                if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
                    difficulty = 'Medium';
                }

                // Status
                let status = 'Todo';
                const rowStatus = getValue(row, ['Status', 'State']);
                if (rowStatus && ['Done', 'Solved', 'ac'].includes(rowStatus.toLowerCase())) {
                    status = 'Done';
                }

                return {
                    title,
                    titleSlug,
                    difficulty,
                    status,
                    addedAt: new Date().toISOString()
                };
            }).filter(p => p !== null);

            if (newProblems.length === 0) {
                alert("Could not parse any problems. Check your column names (Title, Link, Difficulty).");
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
                } else {
                    // Optional: Update status if new file says Done?
                    // For now, let's just add new ones.
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
