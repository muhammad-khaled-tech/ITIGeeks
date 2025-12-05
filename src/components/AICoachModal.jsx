import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaRobot, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AICoachModal = ({ isOpen, onClose }) => {
    const { userData, checkAIQuota } = useAuth();
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Would you like to analyze your progress?" }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateAnalysis = () => {
        if (!userData || !userData.problems) return "I don't have enough data to analyze yet. Start solving problems!";

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

        const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
        const strongest = sortedTopics.length > 0 ? sortedTopics[0][0] : "None";
        const weakest = sortedTopics.length > 0 ? sortedTopics[sortedTopics.length - 1][0] : "None";

        return `Here is your progress report:
        
        📊 **Overview**:
        - Total Problems: ${total}
        - Solved: ${done}
        
        💪 **Strengths**:
        - Strongest Topic: ${strongest} (${topicCounts[strongest] || 0} solved)
        
        🎯 **Areas for Improvement**:
        - You might want to focus more on: ${weakest !== strongest ? weakest : "exploring new topics"}.
        
        Keep pushing! Consistency is key. 🚀`;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input.trim();
        const newMessages = [...messages, { role: 'user', text: userText }];
        setMessages(newMessages);
        setInput('');

        // Special case: Initial analysis
        if (userText.toLowerCase() === 'yes' && messages.length === 1) {
            // Check Quota
            const allowed = await checkAIQuota();
            if (!allowed) return;

            setTimeout(() => {
                const analysis = generateAnalysis();
                setMessages(prev => [...prev, { role: 'ai', text: analysis }]);
            }, 800);
            return;
        }

        // Check Quota for AI responses
        const allowed = await checkAIQuota();
        if (!allowed) return;

        try {
            // Import chatWithCoach dynamically
            const { chatWithCoach } = await import('../services/geminiService');

            // Show loading state
            setMessages(prev => [...prev, { role: 'ai', text: '🤔 Thinking...' }]);

            // Call Gemini API with conversation context
            const aiResponse = await chatWithCoach(userText, messages);

            // Replace loading message with actual response
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'ai', text: aiResponse };
                return updated;
            });
        } catch (error) {
            console.error('AI Coach Error:', error);

            // Fallback to basic response on error
            const fallbackResponse = getFallbackResponse(userText);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'ai', text: `⚠️ API Error. Fallback response:\n\n${fallbackResponse}` };
                return updated;
            });
        }
    };

    // Fallback responses when API fails
    const getFallbackResponse = (userText) => {
        const lowerInput = userText.toLowerCase();

        if (lowerInput.includes('thank')) {
            return "You're welcome! Happy coding! 🚀";
        } else if (lowerInput.includes('array') || lowerInput.includes('vector')) {
            return "Arrays and Vectors are fundamental! 🧱\n\n**Key Techniques:**\n- **Two Pointers**: Great for sorted arrays.\n- **Sliding Window**: Perfect for subarray problems.\n- **Prefix Sum**: Useful for range sum queries.\n\nTry solving 'Two Sum' or 'Maximum Subarray' to practice!";
        } else if (lowerInput.includes('linked list')) {
            return "Linked Lists require careful pointer management. 🔗\n\n**Tips:**\n- Use a **Dummy Node** to simplify edge cases.\n- Master the **Fast & Slow Pointer** technique (Tortoise & Hare) for cycle detection.\n- Practice reversing a list iteratively and recursively.";
        } else if (lowerInput.includes('tree') || lowerInput.includes('dfs') || lowerInput.includes('bfs')) {
            return "Trees and Graphs are all about traversal! 🌳\n\n- **DFS (Recursion)**: Good for exploring all paths.\n- **BFS (Queue)**: Best for shortest path in unweighted graphs.\n\nDon't forget to handle visited nodes in graphs!";
        } else if (lowerInput.includes('dp') || lowerInput.includes('dynamic')) {
            return "Dynamic Programming is tricky but powerful! 💡\n\n1. **Define State**: What defines the subproblem?\n2. **Recurrence**: How does it relate to smaller problems?\n3. **Base Case**: When does it stop?\n\nStart with 'Climbing Stairs' or 'Coin Change'.";
        } else if (lowerInput.includes('hash') || lowerInput.includes('map')) {
            return "Hash Maps are your best friend for O(1) lookups! 🗺️\n\nUse them to count frequencies or track visited elements. They are often the key to optimizing O(N²) solutions to O(N).";
        } else if (lowerInput.includes('help')) {
            return "I can help with specific topics! Try asking about:\n- Arrays & Vectors\n- Linked Lists\n- Trees & Graphs\n- Dynamic Programming\n- Hash Maps";
        } else {
            return "That's an interesting topic! 🤔\n\nI'm specialized in core Data Structures & Algorithms. Try asking me about **Arrays**, **Linked Lists**, **Trees**, or **DP** for specific advice!";
        }
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
