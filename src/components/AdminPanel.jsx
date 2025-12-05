import React from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaTools } from 'react-icons/fa';

const AdminPanel = () => {
    const { currentUser, userData, updateUserData } = useAuth();

    if (!currentUser) return null;

    const handleFixAccount = async () => {
        const email = currentUser.email;
        const uid = currentUser.uid;
        const userRef = doc(db, 'users', uid);

        try {
            if (email === 'muhammad.khaled.tech@gmail.com') {
                // Reset Quota, Set Student
                const newData = {
                    ...userData,
                    role: 'student',
                    aiUsage: { date: new Date().toDateString(), count: 0 }
                };
                await setDoc(userRef, newData, { merge: true });
                updateUserData(newData);
                alert(`Fixed ${email}: Role=Student, Quota=0`);
            } else if (email === 'phys.mkhaled@gmail.com') {
                // Set Supervisor
                const newData = {
                    ...userData,
                    role: 'supervisor'
                };
                // Remove student specific data if needed, but merge: true keeps existing.
                // Requirement says "Ensure this user does NOT appear in any Student lists".
                // Student lists usually filter by role=='student', so changing role is enough.
                await setDoc(userRef, newData, { merge: true });
                updateUserData(newData);
                alert(`Fixed ${email}: Role=Supervisor`);
            } else {
                alert("This account is not configured for auto-fix.");
            }
        } catch (error) {
            console.error("Error fixing account:", error);
            alert("Error: " + error.message);
        }
    };

    const handleResetAllQuotas = async () => {
        if (!confirm('Reset AI quotas for ALL users to 0/30? This action affects all students!')) {
            return;
        }

        try {
            const { resetAllUserQuotas } = await import('../utils/resetQuotas');
            const result = await resetAllUserQuotas();
            alert(`✅ Quota Reset Complete!\nTotal: ${result.total}\nSuccess: ${result.success}\nErrors: ${result.errors.length}`);
        } catch (error) {
            console.error('Reset error:', error);
            alert(`❌ Error resetting quotas: ${error.message}`);
        }
    };

    // Only show for the specific emails
    const targetEmails = ['muhammad.khaled.tech@gmail.com', 'phys.mkhaled@gmail.com'];
    if (!targetEmails.includes(currentUser.email)) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <button
                onClick={handleFixAccount}
                className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 border-2 border-red-500 flex items-center gap-2"
                title="Dev Tools: Fix Account Role/Quota"
            >
                <FaTools />
                <span className="text-xs font-bold">Fix Me</span>
            </button>
            {currentUser.email === 'phys.mkhaled@gmail.com' && (
                <button
                    onClick={handleResetAllQuotas}
                    className="bg-purple-600 text-white p-3 rounded-lg shadow-lg hover:bg-purple-700 border-2 border-yellow-400 flex items-center gap-2"
                    title="Admin: Reset ALL User AI Quotas to 0/30"
                >
                    <FaTools />
                    <span className="text-xs font-bold">Reset All Quotas</span>
                </button>
            )}
        </div>
    );
};

export default AdminPanel;
