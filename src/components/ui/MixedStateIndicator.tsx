import React from "react";

interface MixedStateIndicatorProps {
  isMixed: boolean;
  children: React.ReactNode;
  className?: string;
}

export const MixedStateIndicator: React.FC<MixedStateIndicatorProps> = ({
  isMixed,
  children,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isMixed && (
        <div className="absolute inset-0 flex items-center justify-center bg-yellow-50 bg-opacity-90 border border-yellow-200 rounded">
          <div className="flex items-center gap-1 text-xs text-yellow-700 font-medium">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM7 3v6h2V3H7zm0 8v2h2v-2H7z"/>
            </svg>
            Mixed
          </div>
        </div>
      )}
    </div>
  );
};

export default MixedStateIndicator;