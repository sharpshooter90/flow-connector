import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';

import { FeedbackMessage } from '../../types/index';

interface VisualFeedbackProps {
  messages: FeedbackMessage[];
  onDismiss: (messageId: string) => void;
  className?: string;
}

const VisualFeedback: React.FC<VisualFeedbackProps> = ({
  messages,
  onDismiss,
  className = '',
}) => {
  const [visibleMessages, setVisibleMessages] = useState<FeedbackMessage[]>([]);

  useEffect(() => {
    setVisibleMessages(messages);

    // Set up auto-dismiss timers for messages with duration
    const timers: NodeJS.Timeout[] = [];
    
    messages.forEach(message => {
      if (message.duration && message.duration > 0) {
        const timer = setTimeout(() => {
          onDismiss(message.id);
        }, message.duration);
        timers.push(timer);
      }
    });

    // Cleanup timers on unmount or when messages change
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [messages, onDismiss]);

  const getIcon = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'progress':
        return <Zap className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'warning':
        return 'text-amber-900';
      case 'info':
        return 'text-blue-900';
      case 'progress':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {visibleMessages.map(message => (
        <div
          key={message.id}
          className={`
            rounded-lg border p-3 shadow-lg max-w-sm
            ${getBackgroundColor(message.type)}
            animate-in slide-in-from-right-full duration-300
          `}
        >
          <div className="flex items-start gap-2">
            {getIcon(message.type)}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${getTextColor(message.type)}`}>
                {message.title}
              </div>
              {message.message && (
                <div className={`text-xs mt-1 ${getTextColor(message.type)} opacity-80`}>
                  {message.message}
                </div>
              )}
            </div>
            {message.duration === 0 && (
              <button
                onClick={() => onDismiss(message.id)}
                className={`text-xs ${getTextColor(message.type)} opacity-60 hover:opacity-100`}
                aria-label="Dismiss"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VisualFeedback;