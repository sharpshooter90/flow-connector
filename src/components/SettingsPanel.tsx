import React from 'react';
import { AppState } from '../types';
import CheckboxControl from './ui/CheckboxControl';
import { SheetBody, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';

interface SettingsPanelProps {
  appState: AppState;
  updateAppState: (updates: Partial<AppState>) => void;
  clearCache: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  appState,
  updateAppState,
  clearCache,
}) => {
  return (
    <>
      <SheetBody className="space-y-6 text-sm text-gray-700">
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Automation</h4>
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
        </section>

        <section className="space-y-2 text-xs text-gray-500">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current Selection</h4>
          <p>{appState.frameCount} frame(s) selected</p>
          <p>{appState.connectionCount} connection(s) selected</p>
        </section>
      </SheetBody>

      <SheetFooter>
        <Button variant="outline" onClick={clearCache} className="w-full">
          Clear Cache
        </Button>
      </SheetFooter>
    </>
  );
};

export default SettingsPanel;
