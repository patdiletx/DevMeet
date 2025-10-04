import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { TranscriptionPanel } from './TranscriptionPanel';
import { MeetingAnalysis } from './MeetingAnalysis';
import { AIChat } from './AIChat';
import { Mic, Monitor, Square, Play, Pause } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

type ViewMode = 'transcription' | 'analysis' | 'chat' | 'notes' | 'controls';

interface Project {
  id: number;
  name: string;
  color?: string;
}

export function MeetingView() {
  const {
    meetingTitle,
    activeMeetingId,
    isRecording,
    audioType,
    startRecording,
    stopRecording,
    endMeeting,
  } = useAppStore();

  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('controls');
  const [notes, setNotes] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load user notes and meeting details when meeting changes
  useEffect(() => {
    if (activeMeetingId) {
      loadUserNotes();
      loadMeetingDetails();
    }
  }, [activeMeetingId]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (!activeMeetingId || !notes) return;

    const timeoutId = setTimeout(() => {
      saveUserNotes();
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timeoutId);
  }, [notes, activeMeetingId]);

  // Timer for meeting duration
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROJECTS);
      const data = await response.json();
      if (data.success) {
        console.log('Proyectos cargados:', data.data);
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadMeetingDetails = async () => {
    if (!activeMeetingId) return;

    try {
      const response = await fetch(API_ENDPOINTS.MEETING_BY_ID(activeMeetingId));
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCurrentProjectId(result.data.project_id);
        }
      }
    } catch (error) {
      console.error('Failed to load meeting details:', error);
    }
  };

  const loadUserNotes = async () => {
    if (!activeMeetingId) return;

    try {
      const response = await fetch(API_ENDPOINTS.AI_NOTES(activeMeetingId));

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setNotes(result.data.content || '');
        }
      }
    } catch (error) {
      console.error('Failed to load user notes:', error);
    }
  };

  const saveUserNotes = async () => {
    if (!activeMeetingId || !notes.trim()) return;

    try {
      await fetch(API_ENDPOINTS.AI_NOTES(activeMeetingId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notes }),
      });
    } catch (error) {
      console.error('Failed to save user notes:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording(audioType);
    }
  };

  const handleEndMeeting = async () => {
    if (window.confirm('Are you sure you want to end this meeting?')) {
      await endMeeting();
    }
  };

  const handleProjectChange = async (projectId: number | null) => {
    if (!activeMeetingId) return;

    console.log('Cambiando proyecto a:', projectId);

    try {
      const response = await fetch(API_ENDPOINTS.MEETING_BY_ID(activeMeetingId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (response.ok) {
        setCurrentProjectId(projectId);
        console.log(`✅ Meeting ${activeMeetingId} asociado al proyecto ${projectId}`);
      } else {
        console.error('❌ Failed to update meeting project');
      }
    } catch (error) {
      console.error('❌ Error updating meeting project:', error);
    }
  };

  return (
    <div className="meeting-view">
      <div className="meeting-header">
        <div className="meeting-info">
          <h2>{meetingTitle}</h2>
          <div className="meeting-meta">
            <span className="meeting-id">Meeting #{activeMeetingId}</span>
            <select
              value={currentProjectId || ''}
              onChange={(e) => handleProjectChange(e.target.value ? parseInt(e.target.value) : null)}
              className="project-select-compact"
              title="Asociar a un proyecto"
            >
              <option value="">Sin proyecto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  📁 {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="meeting-timer">
          <div className="recording-indicator">
            {isRecording && <div className="pulse" />}
          </div>
          <span className="duration">{formatDuration(duration)}</span>
        </div>

        <button onClick={handleEndMeeting} className="btn-danger">
          <Square size={16} />
          End Meeting
        </button>
      </div>

      <div className="meeting-content">
        {/* View Tabs - All sections as tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === 'controls' ? 'active' : ''}`}
            onClick={() => setViewMode('controls')}
          >
            🎙️ Controles
          </button>
          <button
            className={`view-tab ${viewMode === 'transcription' ? 'active' : ''}`}
            onClick={() => setViewMode('transcription')}
          >
            📝 Transcripción
          </button>
          <button
            className={`view-tab ${viewMode === 'analysis' ? 'active' : ''}`}
            onClick={() => setViewMode('analysis')}
          >
            🧠 Análisis
          </button>
          <button
            className={`view-tab ${viewMode === 'chat' ? 'active' : ''}`}
            onClick={() => setViewMode('chat')}
          >
            💬 Chat IA
          </button>
          <button
            className={`view-tab ${viewMode === 'notes' ? 'active' : ''}`}
            onClick={() => setViewMode('notes')}
          >
            📌 Apuntes
          </button>
        </div>

        {/* View Content - Full screen for each section */}
        <div className="view-content">
          {viewMode === 'controls' && (
            <div className="controls-view">
              <div className="controls-center">
                <h2 className="controls-title">Control de Grabación</h2>

                <div className="audio-source-selector">
                  <button
                    className={`source-btn ${audioType === 'microphone' ? 'active' : ''}`}
                    onClick={() => useAppStore.setState({ audioType: 'microphone' })}
                    disabled={isRecording}
                  >
                    <Mic size={32} />
                    <span>Micrófono</span>
                  </button>
                  <button
                    className={`source-btn ${audioType === 'system' ? 'active' : ''}`}
                    onClick={() => useAppStore.setState({ audioType: 'system' })}
                    disabled={isRecording}
                  >
                    <Monitor size={32} />
                    <span>Audio del Sistema</span>
                  </button>
                </div>

                <button
                  onClick={handleToggleRecording}
                  className={`btn-recording-large ${isRecording ? 'recording' : ''}`}
                >
                  {isRecording ? (
                    <>
                      <Pause size={40} />
                      <span>Detener Grabación</span>
                    </>
                  ) : (
                    <>
                      <Play size={40} />
                      <span>Iniciar Grabación</span>
                    </>
                  )}
                </button>

                <div className="stats-large">
                  <div className="stat-item">
                    <span className="stat-label">Transcripciones</span>
                    <span className="stat-value">{useAppStore.getState().transcriptions.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Estado</span>
                    <span className={`stat-value ${isRecording ? 'recording' : ''}`}>
                      {isRecording ? '🔴 Grabando' : '⚫ Detenido'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'transcription' && (
            <div className="transcription-view">
              <TranscriptionPanel />
            </div>
          )}

          {viewMode === 'analysis' && (
            <div className="analysis-view">
              <MeetingAnalysis userNotes={notes} />
            </div>
          )}

          {viewMode === 'chat' && (
            <div className="chat-view">
              <AIChat userNotes={notes} />
            </div>
          )}

          {viewMode === 'notes' && (
            <div className="notes-view">
              <div className="notes-header">
                <h3>📌 Apuntes y Contexto</h3>
                <span className="notes-hint">Agrega información adicional para el análisis y chat IA</span>
              </div>

              <textarea
                className="notes-textarea-large"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe aquí tus apuntes, notas importantes, referencias, o cualquier contexto adicional que quieras que la IA considere...

Ejemplos:
• Objetivos de la reunión
• Decisiones previas
• Enlaces a documentos
• Puntos a recordar
• Preguntas pendientes"
              />

              <div className="notes-footer">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setNotes('')}
                  disabled={!notes}
                >
                  🗑️ Limpiar
                </button>
                <span className="notes-count">{notes.length} caracteres</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
