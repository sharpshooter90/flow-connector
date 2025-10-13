import React from 'react';
import { AppState, ConnectionConfig } from '../types';
import ArrowTab from './tabs/ArrowTab';
import LabelTab from './tabs/LabelTab';
import CheckboxControl from './ui/CheckboxControl';

interface LeftPanelProps {
  appState: AppState;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  updateAppState: (updates: Partial<AppState>) => void;
  createConnection: () => void;
  cancelConnection: () => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  appState,
  updateConfig,
  updateAppState,
  createConnection,
  cancelConnection
}) => {
  const getStatusClasses = () => {
    switch (appState.status.type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'editing':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto pb-20">
        {/* Header */}
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Flow Connector</h2>

        {/* Status */}
        <div className={`text-xs rounded px-3 py-2 mb-3 border ${getStatusClasses()}`}>
          {appState.status.message}
        </div>

        {/* Global Controls */}
        <div className="space-y-2 mb-4">
          <CheckboxControl
            checked={appState.autoCreateEnabled}
            onChange={(autoCreateEnabled) => updateAppState({ autoCreateEnabled })}
            label="Auto-create on selection"
          />
          <CheckboxControl
            checked={appState.autoUpdateEnabled}
            onChange={(autoUpdateEnabled) => updateAppState({ autoUpdateEnabled })}
            label="Auto-update when frames move"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 px-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${
              appState.activeTab === 'arrow'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
            onClick={() => updateAppState({ activeTab: 'arrow' })}
          >
            Arrow
          </button>
          <button
            className={`flex-1 py-2 px-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${
              appState.activeTab === 'label'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
            onClick={() => updateAppState({ activeTab: 'label' })}
          >
            Label
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {appState.activeTab === 'arrow' ? (
            <ArrowTab config={appState.config} updateConfig={updateConfig} />
          ) : (
            <LabelTab config={appState.config} updateConfig={updateConfig} />
          )}
        </div>
      </div>

      {/* Button Group - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-80 bg-white border-t border-gray-200 p-4 flex gap-2">
        <button
          onClick={createConnection}
          disabled={appState.frameCount !== 2}
          className={`flex-1 py-2 px-3 text-xs font-medium rounded transition-colors ${
            appState.frameCount === 2
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Create Connection
        </button>
        <button
          onClick={cancelConnection}
          className="flex-1 py-2 px-3 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LeftPanel;