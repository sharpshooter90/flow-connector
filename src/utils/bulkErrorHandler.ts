import { BulkOperationResult } from '../types/index';

/**
 * Enhanced error handling utilities for bulk operations
 * Requirements: 3.5, 5.4, 5.5 - User-friendly error messages with context
 */

export interface EnhancedBulkError {
  originalError: { frameIds?: string[]; connectionId?: string; error: string };
  userFriendlyMessage: string;
  category: 'validation' | 'permission' | 'network' | 'system' | 'user';
  severity: 'low' | 'medium' | 'high';
  isRetryable: boolean;
  suggestedAction?: string;
  technicalDetails?: string;
}

export class BulkErrorHandler {
  /**
   * Categorize and enhance error messages for better user experience
   */
  static enhanceErrors(errors: Array<{ frameIds?: string[]; connectionId?: string; error: string }>): EnhancedBulkError[] {
    return errors.map(error => this.enhanceError(error));
  }

  /**
   * Enhance a single error with user-friendly context
   */
  static enhanceError(error: { frameIds?: string[]; connectionId?: string; error: string }): EnhancedBulkError {
    const errorMessage = error.error.toLowerCase();
    
    // Determine error category and create user-friendly message
    let category: EnhancedBulkError['category'] = 'system';
    let severity: EnhancedBulkError['severity'] = 'medium';
    let userFriendlyMessage = error.error;
    let isRetryable = true;
    let suggestedAction: string | undefined;
    let technicalDetails: string | undefined;

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('missing')) {
      category = 'validation';
      severity = 'high';
      isRetryable = false;
      
      if (error.frameIds) {
        userFriendlyMessage = `Invalid frame configuration for frames: ${error.frameIds.join(', ')}`;
        suggestedAction = 'Check that the selected frames are valid and accessible';
      } else if (error.connectionId) {
        userFriendlyMessage = `Invalid connection configuration for connection: ${error.connectionId}`;
        suggestedAction = 'Verify the connection exists and has valid properties';
      } else {
        userFriendlyMessage = 'Invalid configuration provided';
        suggestedAction = 'Review your connection settings and try again';
      }
    }
    
    // Permission errors
    else if (errorMessage.includes('permission') || errorMessage.includes('locked') || errorMessage.includes('read-only')) {
      category = 'permission';
      severity = 'high';
      isRetryable = false;
      
      if (error.frameIds) {
        userFriendlyMessage = `Cannot modify frames: ${error.frameIds.join(', ')} (locked or insufficient permissions)`;
        suggestedAction = 'Unlock the frames or check your editing permissions';
      } else if (error.connectionId) {
        userFriendlyMessage = `Cannot modify connection: ${error.connectionId} (locked or insufficient permissions)`;
        suggestedAction = 'Unlock the connection or check your editing permissions';
      } else {
        userFriendlyMessage = 'Insufficient permissions to perform this operation';
        suggestedAction = 'Check your editing permissions and try again';
      }
    }
    
    // Not found errors
    else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      category = 'validation';
      severity = 'medium';
      isRetryable = false;
      
      if (error.frameIds) {
        userFriendlyMessage = `Frames not found: ${error.frameIds.join(', ')} (may have been deleted)`;
        suggestedAction = 'Refresh your selection and ensure all frames still exist';
      } else if (error.connectionId) {
        userFriendlyMessage = `Connection not found: ${error.connectionId} (may have been deleted)`;
        suggestedAction = 'Refresh the connection list and try again';
      } else {
        userFriendlyMessage = 'Selected items no longer exist';
        suggestedAction = 'Refresh your selection and try again';
      }
    }
    
    // Network/timeout errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('connection')) {
      category = 'network';
      severity = 'low';
      isRetryable = true;
      
      userFriendlyMessage = 'Operation timed out or network issue occurred';
      suggestedAction = 'Check your connection and try again';
    }
    
    // System errors
    else if (errorMessage.includes('memory') || errorMessage.includes('resource') || errorMessage.includes('limit')) {
      category = 'system';
      severity = 'medium';
      isRetryable = true;
      
      userFriendlyMessage = 'System resource limit reached';
      suggestedAction = 'Try processing fewer items at once or wait a moment before retrying';
    }
    
    // User errors (selection, configuration)
    else if (errorMessage.includes('select') || errorMessage.includes('configuration') || errorMessage.includes('parameter')) {
      category = 'user';
      severity = 'medium';
      isRetryable = false;
      
      userFriendlyMessage = 'Invalid selection or configuration';
      suggestedAction = 'Review your selection and settings, then try again';
    }
    
    // Generic errors - try to make them more user-friendly
    else {
      // Check if it's marked as retryable in the original message
      isRetryable = errorMessage.includes('(retryable)');
      
      if (error.frameIds) {
        userFriendlyMessage = `Failed to process frames: ${error.frameIds.join(', ')}`;
        suggestedAction = isRetryable ? 'Try again or check frame accessibility' : 'Check frame configuration and permissions';
      } else if (error.connectionId) {
        userFriendlyMessage = `Failed to process connection: ${error.connectionId}`;
        suggestedAction = isRetryable ? 'Try again or check connection accessibility' : 'Check connection configuration and permissions';
      } else {
        userFriendlyMessage = 'Operation failed due to an unexpected error';
        suggestedAction = isRetryable ? 'Try again in a moment' : 'Check your configuration and try again';
      }
    }

    // Store technical details for debugging
    technicalDetails = error.error;

    return {
      originalError: error,
      userFriendlyMessage,
      category,
      severity,
      isRetryable,
      suggestedAction,
      technicalDetails,
    };
  }

  /**
   * Generate a summary of errors by category
   */
  static generateErrorSummary(enhancedErrors: EnhancedBulkError[]): {
    totalErrors: number;
    retryableErrors: number;
    nonRetryableErrors: number;
    categorySummary: Record<string, number>;
    severitySummary: Record<string, number>;
    topSuggestions: string[];
  } {
    const categorySummary: Record<string, number> = {};
    const severitySummary: Record<string, number> = {};
    const suggestions = new Set<string>();
    
    let retryableErrors = 0;
    let nonRetryableErrors = 0;

    for (const error of enhancedErrors) {
      // Count categories
      categorySummary[error.category] = (categorySummary[error.category] || 0) + 1;
      
      // Count severities
      severitySummary[error.severity] = (severitySummary[error.severity] || 0) + 1;
      
      // Collect suggestions
      if (error.suggestedAction) {
        suggestions.add(error.suggestedAction);
      }
      
      // Count retryable vs non-retryable
      if (error.isRetryable) {
        retryableErrors++;
      } else {
        nonRetryableErrors++;
      }
    }

    return {
      totalErrors: enhancedErrors.length,
      retryableErrors,
      nonRetryableErrors,
      categorySummary,
      severitySummary,
      topSuggestions: Array.from(suggestions).slice(0, 3), // Top 3 suggestions
    };
  }

  /**
   * Generate user-friendly error message for bulk operation results
   */
  static generateUserFriendlyMessage(result: BulkOperationResult, operationType: 'create' | 'update'): string {
    const { successful, failed } = result;
    const total = successful + failed;
    
    if (failed === 0) {
      return `Successfully ${operationType === 'create' ? 'created' : 'updated'} all ${total} connection${total !== 1 ? 's' : ''}!`;
    }
    
    if (successful === 0) {
      return `Failed to ${operationType} any connections. ${failed} error${failed !== 1 ? 's' : ''} occurred.`;
    }
    
    // Partial success
    const enhancedErrors = this.enhanceErrors(result.errors || []);
    const summary = this.generateErrorSummary(enhancedErrors);
    
    let message = `Partially completed: ${successful} successful, ${failed} failed.`;
    
    if (summary.retryableErrors > 0) {
      message += ` ${summary.retryableErrors} error${summary.retryableErrors !== 1 ? 's' : ''} can be retried.`;
    }
    
    return message;
  }

  /**
   * Filter retryable errors from a bulk operation result
   */
  static getRetryableErrors(result: BulkOperationResult): Array<{ frameIds?: string[]; connectionId?: string; error: string }> {
    if (!result.errors) return [];
    
    const enhancedErrors = this.enhanceErrors(result.errors);
    return enhancedErrors
      .filter(error => error.isRetryable)
      .map(error => error.originalError);
  }

  /**
   * Get error statistics for display
   */
  static getErrorStatistics(result: BulkOperationResult): {
    total: number;
    retryable: number;
    nonRetryable: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    if (!result.errors || result.errors.length === 0) {
      return {
        total: 0,
        retryable: 0,
        nonRetryable: 0,
        byCategory: {},
        bySeverity: {},
      };
    }

    const enhancedErrors = this.enhanceErrors(result.errors);
    const summary = this.generateErrorSummary(enhancedErrors);

    return {
      total: summary.totalErrors,
      retryable: summary.retryableErrors,
      nonRetryable: summary.nonRetryableErrors,
      byCategory: summary.categorySummary,
      bySeverity: summary.severitySummary,
    };
  }
}