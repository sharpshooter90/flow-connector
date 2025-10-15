import React from "react";
import { BulkOperationResult } from "../../types";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, X, Info, Shield, Wifi, Settings, User } from "lucide-react";
import { Button } from "./button";
import { BulkErrorHandler, EnhancedBulkError } from "../../utils/bulkErrorHandler";

interface BulkOperationResultProps {
  result: BulkOperationResult;
  operationType: 'create' | 'update';
  onRetry?: (failedItems: Array<{ frameIds?: string[]; connectionId?: string; error: string }>) => void;
  onClose: () => void;
  canRetry?: boolean;
}

export const BulkOperationResultComponent: React.FC<BulkOperationResultProps> = ({
  result,
  operationType,
  onRetry,
  onClose,
  canRetry = false,
}) => {
  const { successful, failed, errors } = result;
  const total = successful + failed;
  const hasErrors = failed > 0;
  const hasPartialSuccess = successful > 0 && failed > 0;
  
  // Enhanced error handling (Requirements: 3.5, 5.4, 5.5)
  const enhancedErrors = hasErrors ? BulkErrorHandler.enhanceErrors(errors || []) : [];
  const errorSummary = hasErrors ? BulkErrorHandler.generateErrorSummary(enhancedErrors) : null;
  const userFriendlyMessage = BulkErrorHandler.generateUserFriendlyMessage(result, operationType);

  const getStatusIcon = () => {
    if (failed === 0) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    } else if (successful === 0) {
      return <XCircle className="h-6 w-6 text-red-600" />;
    } else {
      return <AlertTriangle className="h-6 w-6 text-amber-600" />;
    }
  };

  const getStatusColor = () => {
    if (failed === 0) return "text-green-900 bg-green-50 border-green-200";
    if (successful === 0) return "text-red-900 bg-red-50 border-red-200";
    return "text-amber-900 bg-amber-50 border-amber-200";
  };

  const getStatusMessage = () => {
    return userFriendlyMessage;
  };

  const handleRetryClick = () => {
    if (onRetry && retryableErrors.length > 0) {
      onRetry(retryableErrors);
    }
  };

  const retryableErrors = BulkErrorHandler.getRetryableErrors(result);
  const canRetryErrors = canRetry && retryableErrors.length > 0;
  
  const getCategoryIcon = (category: EnhancedBulkError['category']) => {
    switch (category) {
      case 'validation': return <AlertTriangle className="h-3 w-3" />;
      case 'permission': return <Shield className="h-3 w-3" />;
      case 'network': return <Wifi className="h-3 w-3" />;
      case 'system': return <Settings className="h-3 w-3" />;
      case 'user': return <User className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };
  
  const getSeverityColor = (severity: EnhancedBulkError['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-amber-700 bg-amber-100';
      case 'low': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
        {/* Header */}
        <div className={`p-4 border-b border-gray-200 ${getStatusColor()} border rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="text-lg font-semibold">
                  Bulk {operationType === 'create' ? 'Connection Creation' : 'Connection Update'}
                </h3>
                <p className="text-sm opacity-90">
                  {getStatusMessage()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{successful}/{total} completed</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                failed === 0 ? 'bg-green-600' : hasPartialSuccess ? 'bg-amber-600' : 'bg-red-600'
              }`}
              style={{ width: `${(successful / total) * 100}%` }}
            />
          </div>

          {/* Success/Failure Counts */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {successful > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700">
                  {successful} successful
                </span>
              </div>
            )}
            {failed > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-700">
                  {failed} failed
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Details */}
        {hasErrors && (
          <div className="px-4 pb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-red-900">
                  Error Details ({enhancedErrors.length})
                </h4>
                {errorSummary && errorSummary.retryableErrors > 0 && (
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                    {errorSummary.retryableErrors} retryable
                  </span>
                )}
              </div>
              
              {/* Error Summary */}
              {errorSummary && errorSummary.topSuggestions.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <div className="font-medium text-blue-900 mb-1">Suggestions:</div>
                  <ul className="text-blue-800 space-y-1">
                    {errorSummary.topSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-600">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="max-h-32 overflow-y-auto space-y-2">
                {enhancedErrors.map((enhancedError, index) => (
                  <div key={index} className={`text-xs rounded p-2 ${getSeverityColor(enhancedError.severity)}`}>
                    <div className="flex items-center gap-2 font-medium mb-1">
                      {getCategoryIcon(enhancedError.category)}
                      <span className="capitalize">{enhancedError.category}</span>
                      {enhancedError.isRetryable && (
                        <span className="text-xs bg-green-200 text-green-800 px-1 rounded">
                          Retryable
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-1">
                      {enhancedError.originalError.frameIds ? 
                        `Frames: ${enhancedError.originalError.frameIds.join(', ')}` : 
                       enhancedError.originalError.connectionId ? 
                        `Connection: ${enhancedError.originalError.connectionId}` : 
                       'General Error'}
                    </div>
                    
                    <div className="mb-1 font-medium">
                      {enhancedError.userFriendlyMessage}
                    </div>
                    
                    {enhancedError.suggestedAction && (
                      <div className="text-xs opacity-90 italic">
                        💡 {enhancedError.suggestedAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          {canRetryErrors && (
            <Button
              onClick={handleRetryClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Failed ({retryableErrors.length})
            </Button>
          )}
          <Button
            onClick={onClose}
            variant={hasErrors ? "outline" : "default"}
            size="sm"
            className="flex-1"
          >
            {hasErrors ? 'Close' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationResultComponent;