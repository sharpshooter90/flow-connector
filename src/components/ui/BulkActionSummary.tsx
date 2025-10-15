import React from "react";
import { ConnectionConfig } from "../../types";

interface BulkActionSummaryProps {
  connectionCount: number;
  pendingChanges: Partial<ConnectionConfig>;
  onConfirm: () => void;
  onCancel: () => void;
  isApplying?: boolean;
}

export const BulkActionSummary: React.FC<BulkActionSummaryProps> = ({
  connectionCount,
  pendingChanges,
  onConfirm,
  onCancel,
  isApplying = false,
}) => {
  const changeCount = Object.keys(pendingChanges).length;
  
  if (changeCount === 0) {
    return null;
  }

  const formatPropertyName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatPropertyValue = (key: string, value: any): React.ReactNode => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      if (key.includes('Color') || key === 'color') {
        return (
          <div className="inline-flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded border border-gray-300" 
              style={{ backgroundColor: value }}
            />
            {value}
          </div>
        );
      }
      return value;
    }
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Bulk Update
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Apply changes to {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="p-4 max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {Object.entries(pendingChanges).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 font-medium">
                  {formatPropertyName(key)}:
                </span>
                <span className="text-gray-900">
                  {formatPropertyValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isApplying}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isApplying}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? 'Applying...' : `Apply to ${connectionCount} Connection${connectionCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionSummary;