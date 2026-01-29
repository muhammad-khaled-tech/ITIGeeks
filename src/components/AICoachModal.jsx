import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaRobot, FaPaperPlane, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AICoachModal = ({ isOpen, onClose }) => {
    const { userData, checkAIQuota, currentUser } = useAuth();
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hey! 👋 I'm your coding coach. Ask me anything about DSA, problem-solving, or let me analyze your progress!", status: 'sent' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Reset messages when modal opens
    useEffect(() => {
        if (isOpen) {
            setMessages([
                { role: 'ai', text: "Hey! 👋 I'm your coding coach. Ask me anything about DSA, problem-solving, or type 'analyze' to review your progress!", status: 'sent' }
            ]);
        }
    }, [isOpen]);

    const generateProgressAnalysis = () => {
        if (!userData || !userData.problems || userData.problems.length === 0) {
            return null; // Will trigger API call instead
        }

        const problems = userData.problems;
        const total = problems.length;
        const done = problems.filter(p => p.status === 'Done').length;

        // Topic Analysis
        const topicCounts = {};
        problems.forEach(p => {
            if (p.status === 'Done' && p.type) {
                const types = p.type.split(/,|;|\//).map(t => t.trim());
                types.forEach(t => {
                    if (t) topicCounts[t] = (topicCounts[t] || 0) + 1;
                });
            }
        });

        return {
            total,
            done,
            topicCounts,
            sortedTopics: Object.entries(topicCounts).sort((a, b) => b[1] - a[1])
        };
    };

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userText = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userText, status: 'sent' }]);
        setInput('');
        setIsTyping(true);

        try {
            // Check quota first
            const allowed = await checkAIQuota();
            if (!allowed) {
                setMessages(prev => [...prev, { 
                    role: 'ai', 
                    text: "⚠️ You've hit your daily AI limit (30/30). Come back tomorrow for more coaching!", 
                    status: 'error' 
                }]);
                setIsTyping(false);
                return;
            }

            // Import and call Gemini API
            const { chatWithCoach, analyzeProgress } = await import('../services/geminiService');

            let aiResponse;

            // Special case: progress analysis
            if (userText.toLowerCase().includes('analyze') || 
                userText.toLowerCase().includes('progress') ||
                userText.toLowerCase() === 'yes') {
                
                if (userData) {
                    aiResponse = await analyzeProgress(userData);
                } else {
                    aiResponse = "I don't have enough data about your progress yet. Solve a few problems first, and I'll give you a detailed analysis! 📊";
                }
            } else {
                // Build conversation context from recent messages (excluding error messages)
                const conversationHistory = messages
                    .filter(m => m.status !== 'error')
                    .slice(-10)
                    .map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        text: m.text
                    }));

                // Add user context
                const stats = generateProgressAnalysis();
                let userContext = '';
                if (stats) {
                    userContext = `[Student Context: Solved ${stats.done}/${stats.total} problems. Topics: ${stats.sortedTopics.slice(0, 3).map(([t]) => t).join(', ') || 'None yet'}]`;
                }

                // Call the API with full context
                aiResponse = await chatWithCoach(
                    userContext ? `${userContext}\n\n${userText}` : userText,
                    conversationHistory
                );
            }

            setMessages(prev => [...prev, { role: 'ai', text: aiResponse, status: 'sent' }]);

        } catch (error) {
            console.error('AI Coach Error:', error);
            
            // Show error message but still be helpful
            const errorMessage = `⚠️ Oops! I ran into an issue: ${error.message}

But no worries! Here are some tips:
• Ensure your administrator has configured a valid API key
• Check your internet connection
• Try asking again in a moment

In the meantime, what topic are you working on? I can at least point you to some resources! 🤓`;

            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: errorMessage, 
                status: 'error'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick action buttons
    const quickActions = [
        { label: "📊 Analyze Progress", message: "Analyze my progress" },
        { label: "💡 Study Tips", message: "Give me some study tips for DSA" },
        { label: "🔥 Motivation", message: "I'm feeling stuck, motivate me!" }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[650px]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-gradient-to-r from-brand to-emerald-600">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FaRobot className="text-xl" />
                        AI Coach
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Powered by Gemini</span>
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-leet-bg">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-xl whitespace-pre-line ${
                                m.role === 'user' 
                                    ? 'bg-brand text-white rounded-br-sm' 
                                    : m.status === 'error'
                                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800 rounded-bl-sm'
                                        : 'bg-white dark:bg-leet-card dark:text-gray-200 shadow-md rounded-bl-sm'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-leet-card shadow-md rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">Coach is thinking...</span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions (only show when conversation is fresh) */}
                {messages.length <= 2 && !isTyping && (
                    <div className="px-4 py-2 border-t dark:border-leet-border bg-gray-100 dark:bg-leet-input flex gap-2 overflow-x-auto">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInput(action.message);
                                    setTimeout(handleSend, 100);
                                }}
                                className="whitespace-nowrap text-xs px-3 py-1.5 bg-white dark:bg-leet-card border dark:border-leet-border rounded-full hover:bg-brand hover:text-white hover:border-brand transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t dark:border-leet-border bg-white dark:bg-leet-card flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask your coach anything..."
                        disabled={isTyping}
                        className="flex-grow p-3 border rounded-xl dark:bg-leet-input dark:border-leet-border dark:text-white focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={isTyping || !input.trim()}
                        className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white p-3 px-5 rounded-xl transition-colors flex items-center gap-2"
                    >
                        {isTyping ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AICoachModal;
