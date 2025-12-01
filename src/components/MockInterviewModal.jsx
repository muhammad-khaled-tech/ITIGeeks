import React, { useState } from 'react';
import { FaTimes, FaMicrophone, FaStop, FaUserTie } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const MockInterviewModal = ({ isOpen, onClose, problem }) => {
    const { checkAIQuota } = useAuth();
    const [messages, setMessages] = useState([
        { role: 'ai', text: `I'm your interviewer. Explain your approach to solving "${problem?.title || 'this problem'}". What is the time complexity?` }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const allowed = await checkAIQuota();
        if (!allowed) return;

        const userText = input.trim();
        const newMessages = [...messages, { role: 'user', text: userText }];
        setMessages(newMessages);
        setInput('');

        // Mock AI Response
        setTimeout(() => {
            let aiResponse = "That's a good start. Can you optimize the space complexity?";
            if (userText.toLowerCase().includes('time') || userText.toLowerCase().includes('o(')) {
                aiResponse = "Good analysis of the time complexity. Now, what about edge cases?";
            }
            setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-2xl rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px]">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-purple-600 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FaUserTie /> Mock Interview
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80">
                        <FaTimes />
                    </button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-leet-bg">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${m.role === 'user' ? 'bg-brand text-white' : 'bg-white dark:bg-leet-card dark:text-gray-200 shadow'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t dark:border-leet-border bg-white dark:bg-leet-card flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your answer..."
                        className="flex-grow p-2 border rounded-md dark:bg-leet-input dark:border-leet-border dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button onClick={handleSend} className="bg-brand hover:bg-brand-hover text-white p-2 rounded-md">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MockInterviewModal;
