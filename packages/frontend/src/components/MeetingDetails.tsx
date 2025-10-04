import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Clock, FileText, MessageSquare, Brain, StickyNote, Send } from 'lucide-react';
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

interface Transcription {
  id: number;
  content: string;
  speaker?: string;
  timestamp: string;
  confidence?: number;
}

interface ChatMessage {
  id: number;
  role: string;
  content: string;
  created_at: string;
}

interface Analysis {
  summary?: string;
  key_points?: string[];
  action_items?: string[];
  topics?: string[];
}

interface UserNote {
  id: number;
  content: string;
  created_at: string;
}

export function MeetingDetails() {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcription' | 'chat' | 'analysis' | 'notes'>('transcription');
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { currentMeetingId, currentProjectId, setView } = useAppStore();
  const API_URL = 'http://localhost:3001/api/v1';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (currentMeetingId) {
      loadMeetingData();
    }
  }, [currentMeetingId]);

  const loadMeetingData = async () => {
    if (!currentMeetingId) return;

    setLoading(true);
    try {
      // Load meeting details
      const meetingRes = await fetch(`${API_URL}/meetings/${currentMeetingId}`);
      const meetingData = await meetingRes.json();
      if (meetingData.success) {
        setMeeting(meetingData.data);
      }

      // Load transcriptions
      const transcriptionsRes = await fetch(`${API_URL}/transcriptions?meeting_id=${currentMeetingId}`);
      const transcriptionsData = await transcriptionsRes.json();
      if (transcriptionsData.success) {
        setTranscriptions(transcriptionsData.data || []);
      }

      // Load chat messages
      try {
        const chatRes = await fetch(`${API_URL}/ai/chat/${currentMeetingId}/messages`);
        const chatData = await chatRes.json();
        if (chatData.success) {
          setChatMessages(chatData.data || []);
        }
      } catch (error) {
        console.log('No chat messages available');
      }

      // Load analysis
      try {
        const analysisRes = await fetch(`${API_URL}/ai/analysis/${currentMeetingId}`);
        const analysisData = await analysisRes.json();
        if (analysisData.success && analysisData.data) {
          setAnalysis(analysisData.data);
        }
      } catch (error) {
        console.log('No analysis available');
      }

      // Load user notes
      try {
        const notesRes = await fetch(`${API_URL}/ai/notes/${currentMeetingId}`);
        const notesData = await notesRes.json();
        if (notesData.success) {
          setUserNotes(notesData.data || []);
        }
      } catch (error) {
        console.log('No user notes available');
      }

    } catch (error) {
      console.error('Error loading meeting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentProjectId) {
      setView('project-details');
    } else {
      setView('dashboard');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentMeetingId || isSending) return;

    setIsSending(true);
    const userMessage = chatInput.trim();
    setChatInput('');

    try {
      // Add user message to the list immediately
      const tempUserMessage: ChatMessage = {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, tempUserMessage]);

      // Send to API
      const response = await fetch(`${API_URL}/ai/chat/${currentMeetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage })
      });

      const data = await response.json();
      console.log('📦 Chat response:', data);

      if (data.success && data.data) {
        // Add AI response
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.data.answer || data.data.response,
          created_at: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('❌ Chat error:', data.error);
        alert('Error al obtener respuesta de la IA');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="meeting-details loading">
        <div className="spinner"></div>
        <p>Cargando meeting...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="meeting-details error">
        <p>Meeting no encontrada</p>
        <button onClick={handleBack} className="btn-primary">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="meeting-details">
      <div className="meeting-details-header">
        <button onClick={handleBack} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div className="meeting-title-section">
          <h1>{meeting.title}</h1>
          {meeting.description && <p className="meeting-subtitle">{meeting.description}</p>}
          <div className="meeting-meta-header">
            <span className="meta-item">
              <Calendar size={14} />
              {formatDate(meeting.started_at)}
            </span>
            <span className={`status-badge status-${meeting.status}`}>
              {meeting.status}
            </span>
          </div>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={`view-tab ${activeTab === 'transcription' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcription')}
        >
          <FileText size={18} />
          Transcripción ({transcriptions.length})
        </button>
        <button
          className={`view-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={18} />
          Chat ({chatMessages.length})
        </button>
        <button
          className={`view-tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <Brain size={18} />
          Análisis
        </button>
        <button
          className={`view-tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <StickyNote size={18} />
          Notas ({userNotes.length})
        </button>
      </div>

      <div className="view-content">
        {activeTab === 'transcription' && (
          <div className="transcription-list">
            {transcriptions.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <p>No hay transcripciones disponibles</p>
              </div>
            ) : (
              transcriptions.map((trans) => (
                <div key={trans.id} className="transcription-item">
                  <div className="transcription-header">
                    {trans.speaker && <span className="speaker">{trans.speaker}</span>}
                    <span className="timestamp">{formatDate(trans.timestamp)}</span>
                    {trans.confidence && (
                      <span className="confidence">{Math.round(trans.confidence * 100)}%</span>
                    )}
                  </div>
                  <p className="transcription-content">{trans.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-view-container">
            <div className="chat-messages-list">
              {chatMessages.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <p>No hay mensajes de chat</p>
                  <p className="text-muted">Haz una pregunta sobre esta meeting</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'assistant' ? '🤖' : '👤'}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{msg.content}</div>
                      <span className="message-time">{formatDate(msg.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
              {isSending && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="message-text typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta sobre esta meeting..."
                disabled={isSending}
                className="chat-input-field"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isSending}
                className="btn-send"
                title="Enviar mensaje"
              >
                {isSending ? (
                  <div className="spinner-sm"></div>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-content">
            {!analysis ? (
              <div className="empty-state">
                <Brain size={48} />
                <p>No hay análisis disponible</p>
              </div>
            ) : (
              <>
                {analysis.summary && (
                  <div className="analysis-section summary">
                    <div className="section-header">
                      <h4>Resumen</h4>
                    </div>
                    <p>{analysis.summary}</p>
                  </div>
                )}

                {analysis.key_points && analysis.key_points.length > 0 && (
                  <div className="analysis-section">
                    <div className="section-header">
                      <h4>Puntos Clave</h4>
                    </div>
                    <ul className="analysis-list">
                      {analysis.key_points.map((point, idx) => (
                        <li key={idx}>
                          <span className="bullet">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.action_items && analysis.action_items.length > 0 && (
                  <div className="analysis-section action-items">
                    <div className="section-header">
                      <h4>Tareas</h4>
                    </div>
                    <ul className="analysis-list">
                      {analysis.action_items.map((item, idx) => (
                        <li key={idx}>
                          <input type="checkbox" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.topics && analysis.topics.length > 0 && (
                  <div className="analysis-section">
                    <div className="section-header">
                      <h4>Temas Discutidos</h4>
                    </div>
                    <div className="topic-tags">
                      {analysis.topics.map((topic, idx) => (
                        <span key={idx} className="topic-tag">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-list">
            {userNotes.length === 0 ? (
              <div className="empty-state">
                <StickyNote size={48} />
                <p>No hay notas del usuario</p>
              </div>
            ) : (
              userNotes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <span className="note-time">{formatDate(note.created_at)}</span>
                  </div>
                  <p className="note-content">{note.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
