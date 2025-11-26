import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-primary focus:border-primary transition-colors`}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};
