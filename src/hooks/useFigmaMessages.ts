import { useEffect, useCallback, useRef } from 'react';
import { FigmaMessage, ConnectionConfig } from '../types';

interface UseFigmaMessagesProps {
  onMessage: (message: FigmaMessage) => void;
}

export const useFigmaMessages = ({ onMessage }: UseFigmaMessagesProps) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = event.data.pluginMessage as FigmaMessage;
        if (message) {
          onMessage(message);
        }
      } catch (error) {
        console.error('Failed to parse Figma message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onMessage]);

  const sendMessage = useCallback((message: Partial<FigmaMessage>) => {
    try {
      parent.postMessage({
        pluginMessage: message
      }, '*');
    } catch (error) {
      console.error('Failed to send message to Figma:', error);
    }
  }, []);

  return { sendMessage };
};

// Debounced config save hook
export const useDebouncedSave = (delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback((config: ConnectionConfig, sendMessage: (message: any) => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      sendMessage({
        type: 'save-config',
        config: config
      });
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedSave;
};