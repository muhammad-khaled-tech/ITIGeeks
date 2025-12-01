import React, { useState } from 'react';
import { FaTimes, FaRobot, FaPaperPlane } from 'react-icons/fa';

const AICoachModal = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hello! I'm your AI Coach. How can I help you with your coding journey today?" }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        const newMessages = [...messages, { role: 'user', text: input }];
        setMessages(newMessages);
        setInput('');

        // Mock AI Response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', text: "That's a great question! Focus on understanding the underlying patterns like Sliding Window or DFS. Keep practicing!" }]);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-2xl rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px]">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-brand text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FaRobot /> AI Coach
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80">
                        <FaTimes />
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-leet-bg">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-brand text-white' : 'bg-white dark:bg-leet-card dark:text-gray-200 shadow'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t dark:border-leet-border bg-white dark:bg-leet-card flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask your coach..."
                        className="flex-grow p-2 border rounded-md dark:bg-leet-input dark:border-leet-border dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button onClick={handleSend} className="bg-brand hover:bg-brand-hover text-white p-2 rounded-md">
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AICoachModal;
