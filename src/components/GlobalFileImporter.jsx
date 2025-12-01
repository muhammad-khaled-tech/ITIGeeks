import React from 'react';
import FileImporter from './FileImporter';
import { useProblemImport } from '../hooks/useProblemImport';

const GlobalFileImporter = () => {
    const { importProblems } = useProblemImport();
    return <FileImporter onFileSelect={importProblems} />;
};

export default GlobalFileImporter;
