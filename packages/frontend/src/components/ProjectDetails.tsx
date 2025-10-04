import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, FileText, MessageSquare, Upload, Trash2, Plus } from 'lucide-react';
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

interface ProjectDocument {
  id: number;
  project_id: number;
  title: string;
  content: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export function ProjectDetails() {
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
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

      // Load project documents
      console.log('📡 Fetching documents for project...');
      const docsRes = await fetch(`${API_URL}/projects/${currentProjectId}/documents`);
      const docsData = await docsRes.json();
      console.log('📦 Documents data:', docsData);

      if (docsData.success) {
        console.log(`✅ Found ${docsData.data.length} documents`);
        setDocuments(docsData.data);
      }
    } catch (error) {
      console.error('💥 Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Auto-fill title from filename if empty
    if (!docTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setDocTitle(nameWithoutExt);
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setDocContent(content);
    };

    reader.onerror = () => {
      alert('Error al leer el archivo');
    };

    reader.readAsText(file);
  };

  const handleCreateDocument = async () => {
    if (!docTitle.trim() || !docContent.trim() || !currentProjectId) return;

    setIsSavingDoc(true);
    try {
      const response = await fetch(`${API_URL}/projects/${currentProjectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          content: docContent,
          file_type: selectedFile ? selectedFile.type || 'text/plain' : 'text',
          file_size: selectedFile ? selectedFile.size : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setDocuments(prev => [data.data, ...prev]);
        setDocTitle('');
        setDocContent('');
        setSelectedFile(null);
        setShowDocForm(false);
        console.log('✅ Document created successfully');
      } else {
        alert('Error al crear el documento');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error al crear el documento');
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    try {
      const response = await fetch(`${API_URL}/projects/${currentProjectId}/documents/${docId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        console.log('✅ Document deleted successfully');
      } else {
        alert('Error al eliminar el documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
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

      <div className="documents-section">
        <div className="section-header-with-action">
          <h2>
            <FileText size={20} />
            Documentación del Proyecto
          </h2>
          <button
            onClick={() => setShowDocForm(!showDocForm)}
            className="btn-primary-sm"
          >
            <Plus size={16} />
            {showDocForm ? 'Cancelar' : 'Nuevo Documento'}
          </button>
        </div>

        {showDocForm && (
          <div className="doc-form-card">
            <div className="file-upload-section">
              <label className="file-upload-label">
                <Upload size={20} />
                <span>{selectedFile ? selectedFile.name : 'Seleccionar archivo (opcional)'}</span>
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv,.log"
                  onChange={handleFileSelect}
                  className="file-input-hidden"
                />
              </label>
              {selectedFile && (
                <div className="file-info">
                  <span className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
            </div>

            <div className="divider-text">
              <span>o escribe manualmente</span>
            </div>

            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Título del documento"
              className="doc-title-input"
            />
            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Contenido del documento (información que el AI debe conocer sobre este proyecto...)"
              className="doc-content-textarea"
              rows={8}
            />
            <div className="doc-form-actions">
              <button
                onClick={handleCreateDocument}
                disabled={!docTitle.trim() || !docContent.trim() || isSavingDoc}
                className="btn-primary"
              >
                {isSavingDoc ? 'Guardando...' : 'Guardar Documento'}
              </button>
            </div>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No hay documentación del proyecto</p>
            <p className="text-muted">Agrega documentación para que el AI tenga contexto sobre este proyecto</p>
          </div>
        ) : (
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-header">
                  <div className="document-title-section">
                    <FileText size={18} />
                    <h3>{doc.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="btn-icon-sm delete-btn"
                    title="Eliminar documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="document-content">{doc.content}</p>
                <div className="document-meta">
                  <span className="document-date">
                    Creado: {new Date(doc.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
