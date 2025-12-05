/**
 * Simple Quota Reset Script
 * This creates a temporary web page to reset all user quotas
 * Run this in browser console while logged in as admin
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Use your existing Firebase config from firebase.js
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig, 'quota-reset-app');
const db = getFirestore(app);

export async function resetAllUserQuotas() {
    try {
        console.log('🔄 Starting quota reset for all users...\n');

        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);

        const today = new Date().toDateString();
        let successCount = 0;
        const errors = [];

        for (const userDoc of usersSnapshot.docs) {
            try {
                const userRef = doc(db, 'users', userDoc.id);
                await updateDoc(userRef, {
                    'aiUsage.date': today,
                    'aiUsage.count': 0
                });
                successCount++;
                console.log(`✅ Reset user: ${userDoc.data().leetcodeUsername || userDoc.id}`);
            } catch (error) {
                errors.push({ id: userDoc.id, error: error.message });
                console.error(`❌ Failed: ${userDoc.id}`, error);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total: ${usersSnapshot.docs.length}`);
        console.log(`   Success: ${successCount}`);
        console.log(`   Errors: ${errors.length}`);

        return { total: usersSnapshot.docs.length, success: successCount, errors };
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// If running as standalone, execute immediately
if (typeof window === 'undefined') {
    resetAllUserQuotas().then(() => process.exit(0)).catch(() => process.exit(1));
}
