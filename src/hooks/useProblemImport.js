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
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (!jsonData || jsonData.length === 0) {
                alert("No data found in file.");
                setImporting(false);
                return;
            }

            // Map fields to our schema
            // Expected columns: "Problem Name" or "Title", "Link" or "URL", "Difficulty", "Status" (optional)
            const newProblems = jsonData.map(row => {
                // Try to find title
                const title = row['Problem Name'] || row['Title'] || row['name'] || row['title'];
                if (!title) return null;

                // Try to find URL/Slug
                const url = row['Link'] || row['URL'] || row['link'] || row['url'] || '';
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
                let difficulty = row['Difficulty'] || row['difficulty'] || 'Medium';
                // Normalize difficulty
                if (['Easy', 'Medium', 'Hard'].includes(difficulty)) {
                    // ok
                } else {
                    // Try to guess or default
                    difficulty = 'Medium';
                }

                // Status
                let status = 'Todo';
                const rowStatus = row['Status'] || row['status'];
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
