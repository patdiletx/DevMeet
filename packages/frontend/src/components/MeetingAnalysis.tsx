import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Brain, FileText, Users, CheckSquare, AlertCircle, TrendingUp } from 'lucide-react';

interface AnalysisSection {
  title: string;
  content: string;
  items: string[];
}

interface MeetingAnalysisData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  topics: string[];
  participants: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface MeetingAnalysisProps {
  userNotes?: string;
}

export function MeetingAnalysis({ userNotes = '' }: MeetingAnalysisProps = {}) {
  const { transcriptions, activeMeetingId } = useAppStore();
  const [analysis, setAnalysis] = useState<MeetingAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Removed auto-analyze - now on-demand only

  const analyzeTranscriptions = async () => {
    if (!activeMeetingId || transcriptions.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Call backend AI service
      const response = await fetch(`http://localhost:3000/api/v1/ai/analyze/${activeMeetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userNotes: userNotes && userNotes.trim() ? userNotes : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze meeting');
      }

      const result = await response.json();
      setAnalysis(result.data);
    } catch (error) {
      console.error('Failed to analyze transcriptions:', error);
      // Keep previous analysis or show empty state
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  if (!analysis && !isAnalyzing) {
    return (
      <div className="meeting-analysis empty">
        <Brain size={32} className="icon-muted" />
        <p className="empty-text">
          {transcriptions.length === 0
            ? 'Comienza a grabar para generar análisis'
            : 'Haz clic en "Analizar" para generar el análisis de la reunión'}
        </p>
        {transcriptions.length > 0 && (
          <button onClick={analyzeTranscriptions} className="btn-primary btn-analyze">
            <Brain size={18} />
            Analizar Reunión
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="meeting-analysis">
      <div className="analysis-header">
        <h3>
          <Brain size={20} />
          Análisis de Reunión
        </h3>
        <div className="analysis-actions">
          {isAnalyzing ? (
            <div className="analyzing-indicator">
              <div className="spinner-sm" />
              <span>Analizando...</span>
            </div>
          ) : (
            <button onClick={analyzeTranscriptions} className="btn-secondary btn-sm">
              <Brain size={16} />
              Actualizar
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="analysis-section summary">
        <div className="section-header">
          <FileText size={18} />
          <h4>Resumen</h4>
        </div>
        <p>{analysis?.summary}</p>
      </div>

      {/* Sentiment */}
      <div className="analysis-section sentiment">
        <div className="section-header">
          <TrendingUp size={18} />
          <h4>Tono de la Reunión</h4>
        </div>
        <div className={`sentiment-indicator ${getSentimentColor(analysis?.sentiment || 'neutral')}`}>
          <span className="sentiment-emoji">{getSentimentIcon(analysis?.sentiment || 'neutral')}</span>
          <span className="sentiment-text">
            {analysis?.sentiment === 'positive' ? 'Positivo' :
             analysis?.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
          </span>
        </div>
      </div>

      {/* Key Points */}
      {analysis?.keyPoints && analysis.keyPoints.length > 0 && (
        <div className="analysis-section">
          <div className="section-header">
            <CheckSquare size={18} />
            <h4>Puntos Clave</h4>
          </div>
          <ul className="analysis-list">
            {analysis.keyPoints.map((point, idx) => (
              <li key={idx}>
                <span className="bullet">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {analysis?.actionItems && analysis.actionItems.length > 0 && (
        <div className="analysis-section action-items">
          <div className="section-header">
            <AlertCircle size={18} />
            <h4>Tareas Pendientes</h4>
          </div>
          <ul className="analysis-list">
            {analysis.actionItems.map((item, idx) => (
              <li key={idx}>
                <input type="checkbox" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decisions */}
      {analysis?.decisions && analysis.decisions.length > 0 && (
        <div className="analysis-section">
          <div className="section-header">
            <CheckSquare size={18} />
            <h4>Decisiones Tomadas</h4>
          </div>
          <ul className="analysis-list">
            {analysis.decisions.map((decision, idx) => (
              <li key={idx}>
                <span className="bullet">✓</span>
                {decision}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Topics */}
      {analysis?.topics && analysis.topics.length > 0 && (
        <div className="analysis-section topics">
          <div className="section-header">
            <FileText size={18} />
            <h4>Temas Discutidos</h4>
          </div>
          <div className="topic-tags">
            {analysis.topics.map((topic, idx) => (
              <span key={idx} className="topic-tag">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Participants */}
      {analysis?.participants && analysis.participants.length > 0 && (
        <div className="analysis-section">
          <div className="section-header">
            <Users size={18} />
            <h4>Participantes</h4>
          </div>
          <div className="participants-list">
            {analysis.participants.map((participant, idx) => (
              <div key={idx} className="participant-item">
                <div className="participant-avatar">{participant.charAt(0)}</div>
                <span>{participant}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
