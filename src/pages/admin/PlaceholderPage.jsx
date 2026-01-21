import React from 'react';
import Card from '../../components/ui/Card';

const PlaceholderPage = ({ title, icon, description }) => (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500">{description || 'This page is coming soon.'}</p>
        </div>
        <Card className="text-center py-12">
            <div className="text-6xl mb-4">{icon || '🚧'}</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Under Construction</h2>
            <p className="text-gray-500">This feature is being built. Check back soon!</p>
        </Card>
    </div>
);

export default PlaceholderPage;
