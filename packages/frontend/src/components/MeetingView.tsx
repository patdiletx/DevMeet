import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { TranscriptionPanel } from './TranscriptionPanel';
import { MeetingAnalysis } from './MeetingAnalysis';
import { AIChat } from './AIChat';
import { Mic, Monitor, Square, Play, Pause } from 'lucide-react';

type ViewMode = 'transcription' | 'analysis' | 'chat' | 'notes' | 'controls';

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

  // Timer for meeting duration
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="meeting-view">
      <div className="meeting-header">
        <div className="meeting-info">
          <h2>{meetingTitle}</h2>
          <span className="meeting-id">Meeting #{activeMeetingId}</span>
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
