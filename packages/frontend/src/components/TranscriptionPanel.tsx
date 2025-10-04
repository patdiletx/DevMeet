import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { MessageSquare, User } from 'lucide-react';

export function TranscriptionPanel() {
  const { transcriptions } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcriptions arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  };

  return (
    <div className="transcription-panel">
      <div className="panel-header">
        <MessageSquare size={20} />
        <h3>Live Transcription</h3>
        <span className="transcription-count">{transcriptions.length}</span>
      </div>

      <div className="transcription-list">
        {transcriptions.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <p>No transcriptions yet</p>
            <span>Start recording to see live transcriptions appear here</span>
          </div>
        ) : (
          transcriptions.map((transcription, index) => (
            <div key={`${transcription.transcriptionId}-${index}`} className="transcription-item">
              <div className="transcription-header">
                <div className="speaker-info">
                  <User size={16} />
                  <span className="speaker-name">
                    {transcription.speaker || 'Unknown Speaker'}
                  </span>
                </div>
                <div className="transcription-meta">
                  <span className="timestamp">{formatTime(transcription.timestamp)}</span>
                  <span className={`confidence ${getConfidenceColor(transcription.confidence)}`}>
                    {Math.round(transcription.confidence * 100)}%
                  </span>
                </div>
              </div>
              <div className="transcription-content">
                <p>{transcription.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
