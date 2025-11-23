import React from 'react';

interface StatusIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  isConnected,
  className = ""
}) => {
  return (
    <div 
      className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${className}`}
      aria-label={isConnected ? "Wallet Connected" : "Wallet Disconnected"}
    />
  );
};
