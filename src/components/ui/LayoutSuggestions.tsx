import React from 'react';
import { FrameLayoutAnalysis } from '../../types/index';
import { Button } from './button';
import { ArrowRight, ArrowDown, Grid3X3, Shuffle, Target, AlertTriangle, Lightbulb } from 'lucide-react';

interface LayoutSuggestionsProps {
  frameLayout: FrameLayoutAnalysis;
  selectedFrameCount?: number; // Optional since it's not currently used
  onApplySuggestion?: (suggestionType: string) => void;
  onDismiss?: () => void;
  className?: string;
}

const LayoutSuggestions: React.FC<LayoutSuggestionsProps> = ({
  frameLayout,
  selectedFrameCount, // Keep for future use
  onApplySuggestion,
  onDismiss,
  className = '',
}) => {
  const getPatternIcon = () => {
    switch (frameLayout.pattern.type) {
      case 'horizontal':
        return <ArrowRight className="h-4 w-4" />;
      case 'vertical':
        return <ArrowDown className="h-4 w-4" />;
      case 'grid':
        return <Grid3X3 className="h-4 w-4" />;
      case 'scattered':
        return <Shuffle className="h-4 w-4" />;
      case 'circular':
        return <Target className="h-4 w-4" />;
      default:
        return <Shuffle className="h-4 w-4" />;
    }
  };

  const getPatternDescription = () => {
    switch (frameLayout.pattern.type) {
      case 'horizontal':
        return `Frames arranged horizontally (${frameLayout.pattern.direction || 'left-to-right'})`;
      case 'vertical':
        return `Frames arranged vertically (${frameLayout.pattern.direction || 'top-to-bottom'})`;
      case 'grid':
        return `Frames in grid layout ${frameLayout.pattern.gridDimensions ? 
          `(${frameLayout.pattern.gridDimensions.rows}×${frameLayout.pattern.gridDimensions.cols})` : ''}`;
      case 'scattered':
        return 'Frames appear scattered with no clear pattern';
      case 'circular':
        return 'Frames arranged in circular pattern';
      default:
        return 'Unknown layout pattern';
    }
  };

  const getConfidenceColor = () => {
    if (frameLayout.confidence >= 0.8) return 'text-green-600';
    if (frameLayout.confidence >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = () => {
    if (frameLayout.confidence >= 0.8) return 'High confidence';
    if (frameLayout.confidence >= 0.5) return 'Medium confidence';
    return 'Low confidence';
  };

  const shouldShowWarning = () => {
    return frameLayout.pattern.type === 'scattered' || frameLayout.confidence < 0.5;
  };

  const getSuggestionButtons = () => {
    const suggestions = [];

    if (frameLayout.pattern.type === 'scattered') {
      suggestions.push(
        <Button
          key="sequential"
          variant="outline"
          size="sm"
          onClick={() => onApplySuggestion?.('arrange-sequential')}
          className="text-xs"
        >
          <ArrowRight className="h-3 w-3 mr-1" />
          Arrange Sequential
        </Button>
      );
      
      suggestions.push(
        <Button
          key="hub-spoke"
          variant="outline"
          size="sm"
          onClick={() => onApplySuggestion?.('suggest-hub-spoke')}
          className="text-xs"
        >
          <Target className="h-3 w-3 mr-1" />
          Hub & Spoke
        </Button>
      );
    }

    if (frameLayout.confidence < 0.5 && frameLayout.pattern.type !== 'scattered') {
      suggestions.push(
        <Button
          key="improve-alignment"
          variant="outline"
          size="sm"
          onClick={() => onApplySuggestion?.('improve-alignment')}
          className="text-xs"
        >
          <Grid3X3 className="h-3 w-3 mr-1" />
          Improve Alignment
        </Button>
      );
    }

    return suggestions;
  };

  return (
    <div className={`rounded-lg border bg-white p-3 shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          {shouldShowWarning() ? (
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
          ) : (
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getPatternIcon()}
              <span className="text-sm font-medium">
                Layout Analysis
              </span>
              <span className={`text-xs ${getConfidenceColor()}`}>
                ({getConfidenceLabel()})
              </span>
            </div>
            
            <div className="text-xs text-gray-600 mb-2">
              {getPatternDescription()}
            </div>
            
            {/* Suggestions */}
            {frameLayout.suggestions.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Suggestions:
                </div>
                {frameLayout.suggestions.slice(0, 2).map((suggestion, index) => (
                  <div key={index} className="text-xs text-gray-600 mb-1">
                    • {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            {/* Action buttons */}
            {getSuggestionButtons().length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {getSuggestionButtons()}
              </div>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 ml-2"
            aria-label="Dismiss suggestions"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default LayoutSuggestions;