import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Mic, Monitor, Video, AlertCircle, Folder } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  color?: string;
}

export function Dashboard() {
  const [meetingTitle, setMeetingTitle] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const { isConnected, startMeeting, error, setError, selectedProjectId, setSelectedProjectId, setView } = useAppStore();

  const API_URL = 'http://localhost:3001/api/v1';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleStartMeeting = async () => {
    if (!meetingTitle.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    await startMeeting(meetingTitle, selectedProjectId || undefined);
    setMeetingTitle('');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>DevMeet AI</h1>
        <div className="status-indicator">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected to backend' : 'Disconnected'}</span>
          <button onClick={() => setView('settings')} className="btn-secondary btn-sm" style={{ marginLeft: '1rem' }}>
            <Folder size={16} />
            Proyectos
          </button>
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
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="project-select"
              disabled={!isConnected}
            >
              <option value="">Sin proyecto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
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
