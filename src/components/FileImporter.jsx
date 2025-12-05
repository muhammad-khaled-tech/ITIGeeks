import React, { useState, useEffect, useCallback } from 'react';
import { FaCloudUploadAlt, FaFileExcel, FaTimes } from 'react-icons/fa';

const FileImporter = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = React.useRef(0);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        // CRITICAL: Only show overlay if dragging a FILE
        if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            dragCounter.current++;
            if (dragCounter.current === 1) {
                setIsDragging(true);
            }
        }
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            dragCounter.current--;
            if (dragCounter.current === 0) {
                setIsDragging(false);
            }
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (onFileSelect) {
                onFileSelect(file);
            }
        }
    }, [onFileSelect]);

    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    if (!isDragging) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-brand/90 dark:bg-brand-dark/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
            <div className="bg-white/10 p-12 rounded-3xl border-4 border-dashed border-white/50 flex flex-col items-center animate-bounce-slow">
                <FaCloudUploadAlt className="text-9xl mb-6 drop-shadow-lg" />
                <h2 className="text-4xl font-bold mb-2">Drop File Here</h2>
                <p className="text-xl opacity-90">Import Excel or CSV to update data</p>
            </div>
            <button
                onClick={() => setIsDragging(false)}
                className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors"
            >
                <FaTimes size={32} />
            </button>
        </div>
    );
};

export default FileImporter;
