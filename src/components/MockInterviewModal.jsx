import React, { useState } from 'react';
import { FaTimes, FaMicrophone, FaStop, FaUserTie } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const MockInterviewModal = ({ isOpen, onClose, problem }) => {
    const { checkAIQuota } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("Click the microphone to start the interview.");

    const toggleRecording = async () => {
        if (!isRecording) {
            // Start Recording
            const allowed = await checkAIQuota();
            if (!allowed) {
                // The checkAIQuota function is expected to handle the alert itself
                // or the user expects no explicit alert here if quota is exceeded.
                // Sticking to the provided code's behavior of just returning.
                return;
            }

            setIsRecording(true);
            setTranscript("Listening... (Speak now)");
        } else {
            // Stop Recording
            setIsRecording(false);
            setTranscript("Great explanation! You correctly identified the time complexity. One improvement: mention the space complexity trade-off.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-lg rounded-lg shadow-xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-purple-600 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FaUserTie /> Mock Interview
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80">
                        <FaTimes />
                    </button>
                </div>
                <div className="p-6 flex flex-col items-center text-center space-y-6">
                    <div className="w-24 h-24 bg-gray-200 dark:bg-leet-input rounded-full flex items-center justify-center relative">
                        <FaUserTie className="text-4xl text-gray-500 dark:text-gray-400" />
                        {status === 'speaking' && (
                            <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-75"></div>
                        )}
                    </div>

                    <div>
                        <h4 className="text-xl font-bold dark:text-white mb-2">Interviewer</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                            "Explain your approach to solving <strong>{problem?.title}</strong>. What is the time complexity?"
                        </p>
                    </div>

                    <div className="w-full bg-gray-100 dark:bg-leet-input p-4 rounded-lg text-left">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Transcript</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            (Listening...)
                        </p>
                    </div>

                    <button
                        onClick={() => setStatus(status === 'listening' ? 'idle' : 'listening')}
                        className={`rounded-full p-4 transition-all ${status === 'listening' ? 'bg-red-500 animate-pulse' : 'bg-brand hover:bg-brand-hover'}`}
                    >
                        <FaMicrophone className="text-white text-xl" />
                    </button>
                    <p className="text-xs text-gray-500">Click microphone to speak</p>
                </div>
            </div>
        </div>
    );
};

export default MockInterviewModal;
