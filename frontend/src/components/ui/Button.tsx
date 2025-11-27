import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    ...props
}) => {
    const baseStyles = "w-full flex justify-center py-3 px-4 border rounded-lg shadow-sm text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "border-transparent text-white bg-primary hover:bg-blue-600 focus:ring-primary",
        secondary: "border-transparent text-primary bg-blue-50 hover:bg-blue-100 focus:ring-blue-500",
        outline: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary",
        danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : children}
        </button>
    );
};
