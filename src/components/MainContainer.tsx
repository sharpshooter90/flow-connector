import React from 'react';
import { AppState, ConnectionConfig } from '../types';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

interface MainContainerProps {
  appState: AppState;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  updateAppState: (updates: Partial<AppState>) => void;
  createConnection: () => void;
  cancelConnection: () => void;
}

const MainContainer: React.FC<MainContainerProps> = ({
  appState,
  updateConfig,
  updateAppState,
  createConnection,
  cancelConnection
}) => {
  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        <LeftPanel
          appState={appState}
          updateConfig={updateConfig}
          updateAppState={updateAppState}
          createConnection={createConnection}
          cancelConnection={cancelConnection}
        />
        <RightPanel
          config={appState.config}
          updateConfig={updateConfig}
        />
      </div>
    </div>
  );
};

export default MainContainer;