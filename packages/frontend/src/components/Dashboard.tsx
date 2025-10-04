import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Mic, Monitor, Video, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const [meetingTitle, setMeetingTitle] = useState('');
  const { isConnected, startMeeting, error, setError } = useAppStore();

  const handleStartMeeting = async () => {
    if (!meetingTitle.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    await startMeeting(meetingTitle);
    setMeetingTitle('');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>DevMeet AI</h1>
        <div className="status-indicator">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected to backend' : 'Disconnected'}</span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Start a New Meeting</h2>
          <p>Capture, transcribe, and analyze your technical meetings in real-time</p>

          <div className="start-meeting-form">
            <input
              type="text"
              placeholder="Enter meeting title..."
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartMeeting()}
              className="meeting-title-input"
              disabled={!isConnected}
            />
            <button
              onClick={handleStartMeeting}
              disabled={!isConnected || !meetingTitle.trim()}
              className="btn-primary"
            >
              <Video size={20} />
              Start Meeting
            </button>
          </div>

          {!isConnected && (
            <div className="warning-message">
              <AlertCircle size={16} />
              <span>Backend server is not connected. Make sure it's running.</span>
            </div>
          )}
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Mic size={32} />
            </div>
            <h3>Audio Capture</h3>
            <p>Record from microphone or system audio with high quality</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Monitor size={32} />
            </div>
            <h3>Real-time Transcription</h3>
            <p>AI-powered transcription with speaker identification</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Video size={32} />
            </div>
            <h3>Meeting Analysis</h3>
            <p>Automatic action items, summaries, and key decisions</p>
          </div>
        </div>

        <div className="quick-stats">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Meetings</span>
              <span className="stat-value">-</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hours Recorded</span>
              <span className="stat-value">-</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Action Items</span>
              <span className="stat-value">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
