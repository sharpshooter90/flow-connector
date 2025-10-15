import React, { useState } from "react";
import { Button } from "./button";
import MixedStateIndicator from "./MixedStateIndicator";

interface BulkPropertyControlProps {
  label: string;
  isMixed: boolean;
  onApplyToAll?: () => void;
  showApplyToAll?: boolean;
  children: React.ReactNode;
  className?: string;
  validationError?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export const BulkPropertyControl: React.FC<BulkPropertyControlProps> = ({
  label,
  isMixed,
  onApplyToAll,
  showApplyToAll = true,
  children,
  className = "",
  validationError,
  onValidationChange,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  
  const handleApplyToAll = async () => {
    if (!onApplyToAll) return;
    
    setIsApplying(true);
    try {
      await onApplyToAll();
      onValidationChange?.(true);
    } catch (error) {
      onValidationChange?.(false);
    } finally {
      setIsApplying(false);
    }
  };
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
          {label}
        </label>
        {isMixed && showApplyToAll && onApplyToAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyToAll}
            disabled={isApplying || !!validationError}
            className="text-xs h-6 px-2"
          >
            {isApplying ? "Applying..." : "Apply to All"}
          </Button>
        )}
      </div>
      <MixedStateIndicator isMixed={isMixed}>
        {children}
      </MixedStateIndicator>
      {validationError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM7 3v6h2V3H7zm0 8v2h2v-2H7z"/>
          </svg>
          {validationError}
        </p>
      )}
      {isMixed && !validationError && (
        <p className="text-xs text-yellow-600">
          Multiple values detected. Change to apply to all connections.
        </p>
      )}
    </div>
  );
};

export default BulkPropertyControl;