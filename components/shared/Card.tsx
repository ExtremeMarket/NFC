import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  headerActions?: ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, icon, className, headerActions }) => {
  return (
    <div className={`bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-5 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon}
          <h2 className="text-xl font-bold text-gray-100">{title}</h2>
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

export default Card;