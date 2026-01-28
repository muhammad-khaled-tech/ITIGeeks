import React, { useState } from 'react';
import { FaRocket, FaUser, FaCode, FaCheck, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const LEETCODE_API = 'https://alfa-leetcode-api.onrender.com';

const OnboardingWizard = ({ isOpen, onComplete }) => {
    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState('');
    const [leetcodeUsername, setLeetcodeUsername] = useState('');
    const [validating, setValidating] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [leetcodeValid, setLeetcodeValid] = useState(false);

    const validateLeetCodeUsername = async (username) => {
        if (!username.trim()) {
            setValidationError('Please enter your LeetCode username');
            return false;
        }

        setValidating(true);
        setValidationError('');
        setLeetcodeValid(false);

        try {
            // Extract username if full URL was pasted
            let cleanUsername = username.trim();
            if (cleanUsername.includes('leetcode.com/u/')) {
                cleanUsername = cleanUsername.split('/u/')[1].split('/')[0];
            } else if (cleanUsername.includes('leetcode.com/')) {
                cleanUsername = cleanUsername.split('leetcode.com/')[1].split('/')[0];
            }
            setLeetcodeUsername(cleanUsername);

            // Validate via API
            const res = await fetch(`${LEETCODE_API}/${cleanUsername}`);
            if (!res.ok) {
                throw new Error('User not found');
            }

            const data = await res.json();
            if (!data || data.errors) {
                throw new Error('Invalid username');
            }

            setLeetcodeValid(true);
            setValidationError('');
            return true;
        } catch (error) {
            setValidationError('Could not find this LeetCode user. Please check the username.');
            setLeetcodeValid(false);
            return false;
        } finally {
            setValidating(false);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (!displayName.trim()) {
                return;
            }
            setStep(3);
        } else if (step === 3) {
            const isValid = await validateLeetCodeUsername(leetcodeUsername);
            if (isValid) {
                setStep(4);
            }
        } else if (step === 4) {
            // Complete onboarding
            onComplete({
                displayName: displayName.trim(),
                leetcodeUsername: leetcodeUsername.trim()
            });
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setValidationError('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 dark:bg-leet-border">
                    <div 
                        className="h-full bg-brand transition-all duration-300"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    {/* Step 1: Welcome */}
                    {step === 1 && (
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-brand/10 rounded-full flex items-center justify-center">
                                <FaRocket className="text-4xl text-brand" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">Welcome to ITIGeeks! 🎉</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Let's set up your profile so you can track your progress and compete with your peers.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                This will only take a minute.
                            </p>
                        </div>
                    )}

                    {/* Step 2: Display Name */}
                    {step === 2 && (
                        <div>
                            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <FaUser className="text-2xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-center dark:text-white">What should we call you?</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                This name will appear on the leaderboard.
                            </p>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g. Mohamed Khaled"
                                className="w-full p-4 text-lg border-2 rounded-xl dark:bg-leet-input dark:border-leet-border dark:text-white focus:border-brand focus:outline-none transition-colors"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Step 3: LeetCode Username */}
                    {step === 3 && (
                        <div>
                            <div className="w-16 h-16 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                <FaCode className="text-2xl text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-center dark:text-white">Link your LeetCode account</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                Enter your LeetCode username or profile URL.
                            </p>
                            <input
                                type="text"
                                value={leetcodeUsername}
                                onChange={(e) => {
                                    setLeetcodeUsername(e.target.value);
                                    setValidationError('');
                                    setLeetcodeValid(false);
                                }}
                                placeholder="e.g. tourist or https://leetcode.com/u/tourist"
                                className={`w-full p-4 text-lg border-2 rounded-xl dark:bg-leet-input dark:text-white focus:outline-none transition-colors ${
                                    validationError 
                                        ? 'border-red-500 dark:border-red-500' 
                                        : leetcodeValid 
                                            ? 'border-green-500 dark:border-green-500'
                                            : 'dark:border-leet-border focus:border-brand'
                                }`}
                                autoFocus
                            />
                            {validationError && (
                                <div className="flex items-center gap-2 mt-3 text-red-500">
                                    <FaExclamationTriangle />
                                    <span className="text-sm">{validationError}</span>
                                </div>
                            )}
                            {leetcodeValid && (
                                <div className="flex items-center gap-2 mt-3 text-green-500">
                                    <FaCheck />
                                    <span className="text-sm">LeetCode account found!</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <FaCheck className="text-4xl text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">You're all set! 🚀</h2>
                            <div className="bg-gray-50 dark:bg-leet-input rounded-xl p-4 mb-6 text-left">
                                <div className="flex justify-between py-2 border-b dark:border-leet-border">
                                    <span className="text-gray-500 dark:text-gray-400">Display Name</span>
                                    <span className="font-medium dark:text-white">{displayName}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500 dark:text-gray-400">LeetCode</span>
                                    <span className="font-medium dark:text-white">{leetcodeUsername}</span>
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Ready to start tracking your progress?
                            </p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && step < 4 && (
                            <button
                                onClick={handleBack}
                                className="flex-1 py-3 px-6 border-2 border-gray-300 dark:border-leet-border rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-leet-input transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 2 && !displayName.trim()) ||
                                (step === 3 && !leetcodeUsername.trim()) ||
                                validating
                            }
                            className="flex-1 py-3 px-6 bg-brand hover:bg-brand-hover text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {validating ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    Validating...
                                </>
                            ) : step === 4 ? (
                                "Let's Go!"
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
