import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="mb-4 text-4xl text-gray-400">{icon}</div>}
    <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
    {description && <p className="mt-2 text-gray-500 text-sm">{description}</p>}
  </div>
); 