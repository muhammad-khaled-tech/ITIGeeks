import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle, FaEnvelope, FaLock, FaUser, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

const StudentLogin = () => {
    const { login, loginWithEmail, registerWithEmail } = useAuth();
    const navigate = useNavigate();
    
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for registration

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError('');
            await login();
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                if (!name.trim()) throw new Error("Name is required");
                if (password.length < 6) throw new Error("Password must be at least 6 characters");
                await registerWithEmail(email, password, name);
            } else {
                await loginWithEmail(email, password);
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            let msg = "Authentication failed";
            if (err.code === 'auth/invalid-credential') msg = "Invalid email or password";
            if (err.code === 'auth/email-already-in-use') msg = "Email already in use";
            if (err.code === 'auth/weak-password') msg = "Password is too weak";
            if (msg === "Authentication failed" && err.message) msg = `Error: ${err.message}`;
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-leet-bg px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-leet-card p-8 rounded-xl shadow-lg border dark:border-leet-border">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to ITIGeeks to track your progress
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded flex items-center gap-2">
                        <FaExclamationCircle /> {error}
                    </div>
                )}

                {/* Google Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-leet-input text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-screen-dark font-medium transition-colors"
                >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaGoogle className="text-red-500" />}
                    Continue with Google
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-leet-card text-gray-500">Or continue with email</span>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        {isRegistering && (
                            <div className="relative">
                                <FaUser className="absolute top-3 left-3 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-brand focus:border-brand dark:bg-leet-input sm:text-sm"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="relative">
                            <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
                            <input
                                type="email"
                                required
                                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-brand focus:border-brand dark:bg-leet-input sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <FaLock className="absolute top-3 left-3 text-gray-400" />
                            <input
                                type="password"
                                required
                                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-brand focus:border-brand dark:bg-leet-input sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : (isRegistering ? 'Sign Up' : 'Login')}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-sm font-medium text-brand hover:text-brand-hover"
                    >
                        {isRegistering 
                            ? "Already have an account? Login" 
                            : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
