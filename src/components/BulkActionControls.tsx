import React, { useState } from "react";
import { AppState, ConnectionStrategy } from "../types";
import { Button } from "./ui/button";
import { 
  ChevronDown, 
  Zap, 
  X, 
  ArrowRight, 
  Network, 
  Target
} from "lucide-react";

interface BulkActionControlsProps {
  appState: AppState;
  updateConnectionStrategy?: (strategy: ConnectionStrategy) => void;
  createBulkConnections?: () => void;
  exitBulkMode?: () => void;
  cancelBulkOperation?: () => void;
  retryBulkOperation?: (operationId: string) => void;
}

const BulkActionControls: React.FC<BulkActionControlsProps> = ({
  appState,
  updateConnectionStrategy,
  createBulkConnections,
  exitBulkMode,
  cancelBulkOperation,
  // retryBulkOperation, // TODO: Implement retry functionality
}) => {
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);

  const connectionStrategies = [
    {
      type: 'sequential' as const,
      label: 'Sequential',
      description: 'Connect frames in order (A→B→C→D)',
      icon: ArrowRight,
      recommended: appState.frameLayout?.pattern.type === 'horizontal' || 
                   appState.frameLayout?.pattern.type === 'vertical'
    },
    {
      type: 'hub-and-spoke' as const,
      label: 'Hub & Spoke',
      description: 'Connect all frames to/from center frame',
      icon: Target,
      recommended: appState.frameLayout?.pattern.type === 'scattered'
    },
    {
      type: 'full-mesh' as const,
      label: 'Full Mesh',
      description: 'Connect every frame to every other frame',
      icon: Network,
      recommended: false
    }
  ];

  const currentStrategy = connectionStrategies.find(
    s => s.type === appState.connectionStrategy.type
  ) || connectionStrategies[0];

  const handleStrategySelect = (strategy: ConnectionStrategy) => {
    updateConnectionStrategy?.(strategy);
    setShowStrategyDropdown(false);
  };

  const canCreateConnections = appState.selectedFrames.length >= 2 && 
                              !appState.bulkOperationInProgress;

  return (
    <div className="flex items-center gap-2">
      {/* Connection Strategy Selector */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStrategyDropdown(!showStrategyDropdown)}
          disabled={appState.bulkOperationInProgress}
          className="flex items-center gap-1.5 text-xs"
        >
          <currentStrategy.icon className="h-3 w-3" />
          {currentStrategy.label}
          <ChevronDown className="h-3 w-3" />
        </Button>

        {showStrategyDropdown && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-700 mb-2">
                Connection Strategy
              </div>
              {connectionStrategies.map((strategy) => (
                <button
                  key={strategy.type}
                  onClick={() => handleStrategySelect({ type: strategy.type })}
                  className={`w-full text-left p-2 rounded text-xs hover:bg-gray-50 flex items-start gap-2 ${
                    strategy.type === appState.connectionStrategy.type
                      ? 'bg-purple-50 border border-purple-200'
                      : ''
                  }`}
                >
                  <strategy.icon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {strategy.label}
                      {strategy.recommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 mt-0.5">
                      {strategy.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Connections Button */}
      <Button
        onClick={createBulkConnections}
        disabled={!canCreateConnections}
        size="sm"
        className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700"
      >
        {appState.bulkOperationInProgress ? (
          <>
            <Zap className="h-3 w-3 animate-pulse" />
            Creating...
          </>
        ) : (
          <>
            <Zap className="h-3 w-3" />
            Create connections ({appState.selectedFrames.length})
          </>
        )}
      </Button>

      {/* Cancel Operation Button (shown during operation) */}
      {appState.bulkOperationInProgress && cancelBulkOperation && (
        <Button
          variant="outline"
          size="sm"
          onClick={cancelBulkOperation}
          className="flex items-center gap-1.5 text-xs"
        >
          <X className="h-3 w-3" />
          Cancel
        </Button>
      )}

      {/* Exit Bulk Mode Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={exitBulkMode}
        disabled={appState.bulkOperationInProgress}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800"
      >
        <X className="h-3 w-3" />
        Exit
      </Button>

      {/* Click outside to close dropdown */}
      {showStrategyDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowStrategyDropdown(false)}
        />
      )}
    </div>
  );
};

export default BulkActionControls;