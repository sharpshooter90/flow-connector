import React from 'react';
import { OperationProgress } from '../../types/index';
import { Button } from './button';
import { X, RotateCcw, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: OperationProgress;
  onCancel?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  onCancel,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'in-progress':
        return <Zap className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'pending':
      case 'in-progress':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'cancelled':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  const formatTimeRemaining = (ms?: number) => {
    if (!ms) return '';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s remaining`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m remaining`;
  };

  const getOperationTypeLabel = () => {
    return progress.type === 'create' ? 'Creating connections' : 'Updating connections';
  };

  return (
    <div className={`rounded-lg border p-3 ${getStatusColor()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {getOperationTypeLabel()}
              </span>
              <span className="text-xs text-gray-600">
                {progress.current}/{progress.total}
              </span>
              {progress.status === 'in-progress' && (
                <span className="text-xs text-gray-500">
                  ({getProgressPercentage()}%)
                </span>
              )}
            </div>
            
            {/* Progress bar */}
            {(progress.status === 'in-progress' || progress.status === 'completed') && (
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}
            
            {/* Current item or status message */}
            {progress.currentItem && (
              <div className="text-xs text-gray-600 mt-1 truncate">
                {progress.currentItem}
              </div>
            )}
            
            {/* Time remaining */}
            {progress.estimatedTimeRemaining && progress.status === 'in-progress' && (
              <div className="text-xs text-gray-500 mt-1">
                {formatTimeRemaining(progress.estimatedTimeRemaining)}
              </div>
            )}
            
            {/* Completion message */}
            {progress.status === 'completed' && (
              <div className="text-xs text-green-700 mt-1">
                Operation completed successfully
              </div>
            )}
            
            {progress.status === 'failed' && (
              <div className="text-xs text-red-700 mt-1">
                Operation failed
              </div>
            )}
            
            {progress.status === 'cancelled' && (
              <div className="text-xs text-gray-700 mt-1">
                Operation cancelled
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-2">
          {progress.status === 'in-progress' && progress.canCancel && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-6 w-6"
              aria-label="Cancel operation"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {progress.status === 'failed' && onRetry && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRetry}
              className="h-6 w-6"
              aria-label="Retry operation"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          
          {(progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') && onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6"
              aria-label="Dismiss notification"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;