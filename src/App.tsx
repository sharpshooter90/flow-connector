import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, FigmaMessage, defaultConfig, ConnectionConfig } from './types';
import { useFigmaMessages, useDebouncedSave } from './hooks/useFigmaMessages';
import MainContainer from './components/MainContainer';

function App() {
  const [appState, setAppState] = useState<AppState>({
    config: defaultConfig,
    status: {
      type: 'info',
      message: 'Select 2 frames with Shift+Click to create a connection'
    },
    selectedConnectionId: null,
    isEditingConnection: false,
    frameCount: 0,
    connectionCount: 0,
    autoCreateEnabled: true,
    autoUpdateEnabled: true,
    activeTab: 'arrow'
  });

  const debouncedSave = useDebouncedSave();
  const sendMessageRef = useRef<((msg: any) => void) | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'properties' | 'settings'>('properties');
  const labelInputRef = useRef<HTMLInputElement | null>(null);
  const [lastZoom, setLastZoom] = useState<number | null>(null);

  const handleFigmaMessage = useCallback((message: FigmaMessage) => {
    switch (message.type) {
      case 'selection-changed':
        const frameCount = message.frameCount || 0;
        const connectionCount = message.connectionCount || 0;
        setAppState(prev => ({
          ...prev,
          frameCount,
          connectionCount,
          ...(connectionCount === 0 ? {
            isEditingConnection: false,
            selectedConnectionId: null
          } : {}),
          status: {
            type: 'info',
            message: frameCount === 2 
              ? 'Ready to create connection' 
              : 'Select 2 frames with Shift+Click to create a connection'
          }
        }));
        break;

      case 'connection-selected':
        if (message.config && message.connectionId) {
          setAppState(prev => ({
            ...prev,
            config: message.config!,
            selectedConnectionId: message.connectionId!,
            isEditingConnection: true,
            status: {
              type: 'editing',
              message: `Editing: ${message.connectionName || 'Connection'}`
            }
          }));
        }
        break;

      case 'config-loaded':
        if (message.config) {
          setAppState(prev => ({
            ...prev,
            config: { ...prev.config, ...message.config }
          }));
        }
        break;

      case 'connection-created':
        setAppState(prev => ({
          ...prev,
          status: {
            type: 'success',
            message: 'Connection created successfully!'
          }
        }));
        break;

      case 'get-config':
        console.log('Received get-config request, sending auto-create with config:', appState.config);
        // Send current config back to Figma for auto-creation
        if (sendMessageRef.current) {
          sendMessageRef.current({ 
            type: 'auto-create-connection', 
            config: appState.config 
          });
        }
        break;

      case 'error':
        setAppState(prev => ({
          ...prev,
          status: {
            type: 'error',
            message: 'An error occurred. Please try again.'
          }
        }));
        break;

      default:
        break;
    }
  }, []);

  const { sendMessage } = useFigmaMessages({ onMessage: handleFigmaMessage });

  // Store sendMessage in ref for use in message handler
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const openSidebar = useCallback((target: 'properties' | 'settings') => {
    setSidebarTab(target);
    setSidebarOpen(true);
  }, []);

  // Load initial config and settings when app starts
  useEffect(() => {
    sendMessage({ type: 'load-config' });
    sendMessage({ type: 'toggle-auto-create', enabled: appState.autoCreateEnabled });
    sendMessage({ type: 'toggle-auto-update', enabled: appState.autoUpdateEnabled });
  }, [sendMessage]); // Only run once when component mounts

  const updateConfig = useCallback((updates: Partial<ConnectionConfig>) => {
    const newConfig = { ...appState.config, ...updates };
    
    setAppState(prev => ({
      ...prev,
      config: newConfig
    }));

    // Debounced save to Figma
    debouncedSave(newConfig, sendMessage);

    // Auto-create or update connection if applicable
    if (appState.isEditingConnection && appState.selectedConnectionId) {
      sendMessage({ 
        type: 'update-connection', 
        connectionId: appState.selectedConnectionId,
        config: newConfig 
      });
    } else if (appState.autoCreateEnabled && appState.frameCount === 2) {
      sendMessage({ type: 'auto-create-connection', config: newConfig });
    }
  }, [appState.config, appState.autoCreateEnabled, appState.frameCount, appState.isEditingConnection, appState.selectedConnectionId, debouncedSave, sendMessage]);

  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
    
    // Send auto-create/auto-update settings to backend
    if ('autoCreateEnabled' in updates) {
      console.log('Sending auto-create setting:', updates.autoCreateEnabled);
      sendMessage({ type: 'toggle-auto-create', enabled: updates.autoCreateEnabled });
    }
    if ('autoUpdateEnabled' in updates) {
      console.log('Sending auto-update setting:', updates.autoUpdateEnabled);
      sendMessage({ type: 'toggle-auto-update', enabled: updates.autoUpdateEnabled });
    }
  }, [sendMessage]);

  const handleLabelEditRequest = useCallback(() => {
    openSidebar('properties');
    updateAppState({ activeTab: 'label' });
    requestAnimationFrame(() => {
      const input = labelInputRef.current;
      if (input) {
        input.focus({ preventScroll: true });
        input.select();
      }
    });
  }, [openSidebar, updateAppState]);

  const handleArrowEditRequest = useCallback(() => {
    openSidebar('properties');
    updateAppState({ activeTab: 'arrow' });
  }, [openSidebar, updateAppState]);

  const createConnection = useCallback(() => {
    sendMessage({ type: 'create-connection', config: appState.config });
  }, [sendMessage, appState.config]);

  const cancelConnection = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      selectedConnectionId: null,
      isEditingConnection: false,
      status: {
        type: 'info',
        message: 'Select 2 frames with Shift+Click to create a connection'
      }
    }));
    sendMessage({ type: 'cancel-connection' });
  }, [sendMessage]);

  const clearCache = useCallback(() => {
    sendMessage({ type: 'clear-cache' });
  }, [sendMessage]);

  return (
    <MainContainer
      appState={appState}
      updateConfig={updateConfig}
      updateAppState={updateAppState}
      createConnection={createConnection}
      cancelConnection={cancelConnection}
      clearCache={clearCache}
      isSidebarOpen={isSidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
      sidebarTab={sidebarTab}
      onSidebarTabChange={setSidebarTab}
      onRequestSidebar={openSidebar}
      onRequestLabelEdit={handleLabelEditRequest}
      onRequestArrowEdit={handleArrowEditRequest}
      labelInputRef={labelInputRef}
    />
  );
}

export default App;
