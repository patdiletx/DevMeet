import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, FileText, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface Meeting {
  id: number;
  title: string;
  description?: string;
  started_at: string;
  ended_at?: string;
  status: string;
  project_id?: number;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  meeting_count?: number;
}

export function ProjectDetails() {
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentProjectId, setView, setCurrentMeetingId } = useAppStore();

  const API_URL = 'http://localhost:3001/api/v1';

  useEffect(() => {
    if (currentProjectId) {
      loadProjectData();
    }
  }, [currentProjectId]);

  const loadProjectData = async () => {
    if (!currentProjectId) {
      console.error('❌ No currentProjectId set');
      return;
    }

    console.log('🔍 Loading project data for ID:', currentProjectId);
    setLoading(true);
    try {
      // Load project details
      console.log('📡 Fetching project details...');
      const projectRes = await fetch(`${API_URL}/projects/${currentProjectId}/with-meetings`);
      const projectData = await projectRes.json();
      console.log('📦 Project data:', projectData);

      if (projectData.success) {
        setProject(projectData.data);
      }

      // Load meetings for this project
      console.log('📡 Fetching meetings for project...');
      const meetingsRes = await fetch(`${API_URL}/meetings?project_id=${currentProjectId}&limit=100`);
      const meetingsData = await meetingsRes.json();
      console.log('📦 Meetings data:', meetingsData);

      if (meetingsData.success) {
        console.log(`✅ Found ${meetingsData.data.length} meetings`);
        setMeetings(meetingsData.data);
      }
    } catch (error) {
      console.error('💥 Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingClick = (meetingId: number) => {
    setCurrentMeetingId(meetingId);
    setView('meeting-details');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (start: string, end?: string) => {
    if (!end) return 'En progreso';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="project-details loading">
        <div className="spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-details error">
        <p>Proyecto no encontrado</p>
        <button onClick={() => setView('settings')} className="btn-primary">
          Volver a Proyectos
        </button>
      </div>
    );
  }

  return (
    <div className="project-details">
      <div className="project-details-header">
        <button onClick={() => setView('settings')} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div className="project-title-section">
          <div className="project-color-indicator" style={{ backgroundColor: project.color }} />
          <div>
            <h1>{project.name}</h1>
            {project.description && <p className="project-subtitle">{project.description}</p>}
          </div>
        </div>
        <div className="project-stats-header">
          <span className="stat-badge">{project.meeting_count || 0} meetings</span>
        </div>
      </div>

      <div className="meetings-section">
        <h2>
          <Calendar size={20} />
          Meetings del Proyecto
        </h2>

        {meetings.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <p>No hay meetings en este proyecto</p>
            <p className="text-muted">Las meetings creadas con este proyecto aparecerán aquí</p>
          </div>
        ) : (
          <div className="meetings-grid">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="meeting-card"
                onClick={() => handleMeetingClick(meeting.id)}
              >
                <div className="meeting-card-header">
                  <h3>{meeting.title}</h3>
                  <span className={`status-badge status-${meeting.status}`}>
                    {meeting.status}
                  </span>
                </div>

                {meeting.description && (
                  <p className="meeting-description">{meeting.description}</p>
                )}

                <div className="meeting-meta">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>{formatDate(meeting.started_at)}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={14} />
                    <span>{formatTime(meeting.started_at)}</span>
                  </div>
                  {meeting.ended_at && (
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>{getDuration(meeting.started_at, meeting.ended_at)}</span>
                    </div>
                  )}
                </div>

                <div className="meeting-actions-preview">
                  <button className="btn-icon-sm" title="Ver transcripción">
                    <FileText size={16} />
                  </button>
                  <button className="btn-icon-sm" title="Ver chat">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
