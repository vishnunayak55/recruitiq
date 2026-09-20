import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({ message = 'Something went wrong.', onRetry }: ErrorStateProps) => (
  <div className="min-h-[300px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center px-4">
      <AlertCircle size={36} className="text-red-400" />
      <p className="text-zinc-400 text-sm max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  </div>
);

export default ErrorState;
