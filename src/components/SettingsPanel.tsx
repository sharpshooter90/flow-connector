import React from "react";
import { AppState } from "../types";
import CheckboxControl from "./ui/CheckboxControl";
import { Button } from "./ui/button";
import { ArrowLeft, X } from "lucide-react";

interface SettingsPanelProps {
  appState: AppState;
  updateAppState: (updates: Partial<AppState>) => void;
  clearCache: () => void;
  onBack: () => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  appState,
  updateAppState,
  clearCache,
  onBack,
  onClose,
}) => {
  return (
    <>
      {/* Header with back button and close button */}
      <div className="flex flex-row items-center justify-between border-b border-gray-200 py-3 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back to properties"
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close panel"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 text-sm text-gray-700">
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Automation
          </h4>
          <CheckboxControl
            checked={appState.autoCreateEnabled}
            onChange={(autoCreateEnabled) =>
              updateAppState({ autoCreateEnabled })
            }
            label="Auto-create on selection"
          />
          <CheckboxControl
            checked={appState.autoUpdateEnabled}
            onChange={(autoUpdateEnabled) =>
              updateAppState({ autoUpdateEnabled })
            }
            label="Auto-update when frames move"
          />
        </section>

        <section className="space-y-2 text-xs text-gray-500">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Current Selection
          </h4>
          <p>{appState.frameCount} frame(s) selected</p>
          <p>{appState.connectionCount} connection(s) selected</p>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <Button variant="outline" onClick={clearCache} className="w-full">
          Clear Cache
        </Button>
      </div>
    </>
  );
};

export default SettingsPanel;
