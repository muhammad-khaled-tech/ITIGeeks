import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { findBestMatch } from '../utils/stringUtils';

const META_SHEET_CSV = "https://docs.google.com/spreadsheets/d/1sRWp95wqo3a7lLBbtNd_3KkTyGjx_9sctTOL5JOb6pA/export?format=csv";

export const useProblems = () => {
    const { userData, updateUserData } = useAuth();
    const [metaMap, setMetaMap] = useState(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await fetch(META_SHEET_CSV);
                const text = await res.text();
                Papa.parse(text, {
                    header: false,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const map = new Map();
                        results.data.slice(3).forEach(r => {
                            if (r.length > 6) {
                                const t = r[1]?.trim(), tp = r[5]?.trim(), d = r[6]?.trim();
                                if (t) {
                                    const k = t.toLowerCase().replace(/\s+/g, '-');
                                    const dt = { d: (d && ['Easy', 'Medium', 'Hard'].includes(d)) ? d : null, t: tp || 'Uncategorized' };
                                    map.set(k, dt);
                                    map.set(t.toLowerCase(), dt);
                                }
                            }
                        });
                        setMetaMap(map);
                        setLoading(false);
                    }
                });
            } catch (e) {
                console.error("Failed to fetch metadata", e);
                setLoading(false);
            }
        };

        fetchMetadata();
    }, []);

    // Sync metadata with user problems if needed
    useEffect(() => {
        if (!loading && userData && userData.problems) {
            let updated = false;
            const newProblems = userData.problems.map(p => {
                if (p.difficulty === 'Unknown' || p.difficulty === 'Loading...') {
                    const m = findBestMatch(p.name, metaMap);
                    if (m && m.d) {
                        updated = true;
                        return { ...p, difficulty: m.d, type: m.t };
                    }
                }
                return p;
            });

            if (updated) {
                updateUserData({ ...userData, problems: newProblems });
            }
        }
    }, [loading, userData, metaMap]);

    return {
        problems: userData?.problems || [],
        metaMap,
        loading
    };
};
