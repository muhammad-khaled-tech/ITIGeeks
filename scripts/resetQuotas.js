/**
 * One-Time Script: Reset AI Quotas for All Users
 * Run this script to reset all users' AI usage quotas to 0/30
 * 
 * Usage: node resetQuotas.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration - use your actual config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetAllQuotas() {
    try {
        console.log('🔄 Starting quota reset for all users...\n');

        // Get all users from the 'users' collection
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);

        const today = new Date().toDateString();
        let count = 0;
        const errors = [];

        // Update each user's aiUsage
        for (const userDoc of usersSnapshot.docs) {
            try {
                const userRef = doc(db, 'users', userDoc.id);
                await updateDoc(userRef, {
                    aiUsage: {
                        date: today,
                        count: 0
                    }
                });
                count++;
                console.log(`✅ Reset quota for user: ${userDoc.id}`);
            } catch (error) {
                errors.push({ id: userDoc.id, error: error.message });
                console.error(`❌ Failed to reset quota for user ${userDoc.id}:`, error.message);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total users: ${usersSnapshot.docs.length}`);
        console.log(`   Successfully reset: ${count}`);
        console.log(`   Errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log(`\n❌ Errors encountered:`);
            errors.forEach(e => console.log(`   - ${e.id}: ${e.error}`));
        }

        console.log(`\n✅ Quota reset complete!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting quotas:', error);
        process.exit(1);
    }
}

resetAllQuotas();
