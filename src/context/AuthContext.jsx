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
                    setUserData(docSnap.data());
                } else {
                    // Initialize empty user data if new
                    const initialData = {
                        problems: [],
                        sheets: [],
                        darkMode: true,
                        aiUsage: { date: new Date().toDateString(), count: 0 },
                        role: 'student', // Default role
                        trackId: null,
                        groupId: null,
                        leetcodeUsername: '',
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

    const login = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
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

    const value = {
        currentUser,
        userData,
        login,
        logout,
        updateUserData,
        loading,
        role: userData?.role || 'student',
        isAdmin: userData?.role === 'admin' || userData?.role === 'head_leader'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
