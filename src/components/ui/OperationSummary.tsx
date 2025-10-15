import React from 'react';
import { OperationSummary } from '../../types/index';
import { Button } from './button';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, X } from 'lucide-react';

interface OperationSummaryProps {
  summary: OperationSummary;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const OperationSummaryComponent: React.FC<OperationSummaryProps> = ({
  summary,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = () => {
    if (summary.failed === 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (summary.successful === 0) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusColor = () => {
    if (summary.failed === 0) {
      return 'border-green-200 bg-green-50';
    } else if (summary.successful === 0) {
      return 'border-red-200 bg-red-50';
    } else {
      return 'border-amber-200 bg-amber-50';
    }
  };

  const getStatusMessage = () => {
    const operationType = summary.type === 'create' ? 'connection creation' : 'connection update';
    
    if (summary.failed === 0) {
      return `${operationType} completed successfully`;
    } else if (summary.successful === 0) {
      return `${operationType} failed`;
    } else {
      return `${operationType} completed with some errors`;
    }
  };

  const hasRetryableErrors = summary.errors.some(error => 
    error.error.includes('(retryable)')
  );

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">
              {getStatusMessage()}
            </h3>
            
            {/* Statistics */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
              <span>Total: {summary.totalItems}</span>
              {summary.successful > 0 && (
                <span className="text-green-700">✓ {summary.successful} successful</span>
              )}
              {summary.failed > 0 && (
                <span className="text-red-700">✗ {summary.failed} failed</span>
              )}
              <span>Duration: {formatDuration(summary.duration)}</span>
            </div>
            
            {/* Created/Updated connections */}
            {summary.createdConnections && summary.createdConnections.length > 0 && (
              <div className="text-xs text-green-700 mb-1">
                Created {summary.createdConnections.length} connection{summary.createdConnections.length !== 1 ? 's' : ''}
              </div>
            )}
            
            {summary.updatedConnections && summary.updatedConnections.length > 0 && (
              <div className="text-xs text-green-700 mb-1">
                Updated {summary.updatedConnections.length} connection{summary.updatedConnections.length !== 1 ? 's' : ''}
              </div>
            )}
            
            {/* Error details */}
            {summary.errors.length > 0 && (
              <div className="mt-2">
                <details className="text-xs">
                  <summary className="cursor-pointer text-red-700 hover:text-red-800">
                    View error details ({summary.errors.length} error{summary.errors.length !== 1 ? 's' : ''})
                  </summary>
                  <div className="mt-1 pl-2 border-l-2 border-red-200">
                    {summary.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-red-600 mb-1">
                        {error.frameIds && (
                          <span className="font-medium">
                            Frames {error.frameIds.join(' → ')}: 
                          </span>
                        )}
                        {error.connectionId && (
                          <span className="font-medium">
                            Connection {error.connectionId}: 
                          </span>
                        )}
                        <span>{error.error.replace(' (retryable)', '').replace(' (not retryable)', '')}</span>
                      </div>
                    ))}
                    {summary.errors.length > 5 && (
                      <div className="text-gray-500">
                        ... and {summary.errors.length - 5} more error{summary.errors.length - 5 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-2">
          {summary.failed > 0 && hasRetryableErrors && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry Failed
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6"
              aria-label="Dismiss summary"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationSummaryComponent;