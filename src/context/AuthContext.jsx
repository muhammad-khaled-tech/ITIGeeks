import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null); // Additional user data from Firestore
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Fetch user data from Firestore
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Calculate Streak
                    const data = docSnap.data();
                    const today = new Date().toDateString();
                    const lastLogin = data.lastLoginDate;
                    let newStreak = data.streak || 0;

                    if (lastLogin !== today) {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        
                        if (lastLogin === yesterday.toDateString()) {
                            newStreak += 1;
                        } else {
                            newStreak = 1;
                        }
                        
                        // Update Firestore with new streak and login date
                        await setDoc(docRef, { 
                            ...data, 
                            streak: newStreak, 
                            lastLoginDate: today 
                        }, { merge: true });
                        
                        setUserData({ ...data, streak: newStreak, lastLoginDate: today });
                    } else {
                        setUserData(data);
                    }
                } else {
                    // Initialize empty user data if new
                    const today = new Date().toDateString();
                    const initialData = {
                        problems: [],
                        sheets: [],
                        darkMode: true,
                        aiUsage: { date: today, count: 0 },
                        streak: 1,
                        lastLoginDate: today,
                        role: 'student', // Default role
                        trackId: null,
                        groupId: null,
                        leetcodeUsername: '',
                        displayName: '', // For leaderboard display
                        badges: []
                    };
                    await setDoc(docRef, initialData);
                    setUserData(initialData);
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // Try popup first
            const result = await signInWithPopup(auth, provider);
            
            // Block super admins from student portal
            const SUPER_ADMIN_EMAILS = ['phys.mkhaled@gmail.com'];
            if (SUPER_ADMIN_EMAILS.includes(result.user.email)) {
                await signOut(auth);
                // Redirect to admin login
                window.location.href = '/admin/login';
                throw new Error('Super admins must use the admin portal');
            }
            
            return result;
        } catch (error) {
            // If popup is blocked (COOP issue), fall back to redirect
            if (error.code === 'auth/popup-blocked' || 
                error.code === 'auth/popup-closed-by-user' ||
                error.message.includes('Cross-Origin-Opener-Policy')) {
                // Import redirect method dynamically
                const { signInWithRedirect } = await import('firebase/auth');
                return signInWithRedirect(auth, provider);
            }
            throw error;
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    const updateUserData = async (newData) => {
        if (!currentUser) return;
        setUserData(newData);
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, newData, { merge: true });
    };

    const checkAIQuota = async () => {
        if (!currentUser) return false;

        const DAILY_AI_LIMIT = 30;
        const today = new Date().toDateString();

        // CRITICAL FIX: Read from Firestore directly to avoid race condition
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const freshData = docSnap.data();
        let { date, count } = freshData.aiUsage || { date: today, count: 0 };

        console.log("Checking AI Quota. Today:", today, "Stored Date:", date, "Count:", count);

        if (date !== today) {
            console.log("Resetting AI Quota for new day.");
            count = 0;
            date = today;
        }

        // Ensure count is a number
        count = parseInt(count, 10) || 0;

        console.log("Count after parsing:", count, "Limit:", DAILY_AI_LIMIT);

        if (count >= DAILY_AI_LIMIT) {
            alert("Daily AI limit reached (30/30). Come back tomorrow!");
            return false;
        }

        // Increment by 1
        const newCount = count + 1;
        const newUsage = { date, count: newCount };

        console.log("Incrementing to:", newCount);

        // Update Firestore first
        await setDoc(docRef, { aiUsage: newUsage }, { merge: true });

        // Then update local state
        setUserData({ ...freshData, aiUsage: newUsage });

        return true;
    };

    // Current active roles: 'supervisor', 'instructor', 'student'
    // Future roles (frozen): 'admin', 'head_leader'
    const role = userData?.role || 'student';
    const isSupervisorOrAbove = role === 'supervisor' || role === 'instructor';
    
    // DEV mode: allow test email to have admin access
    const devAdminAccess = import.meta.env.DEV && currentUser?.email === 'phys.mkhaled@gmail.com';
    
    const value = {
        currentUser,
        userData,
        login,
        logout,
        updateUserData,
        checkAIQuota,
        loading,
        role,
        isSupervisor: isSupervisorOrAbove,
        isAdmin: isSupervisorOrAbove || devAdminAccess
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
