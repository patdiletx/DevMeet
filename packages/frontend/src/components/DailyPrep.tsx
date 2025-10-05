import { useState, useEffect } from 'react';
import { Calendar, GitCommit, Copy, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useAppStore } from '../store/appStore';

interface DailySummary {
  id: number;
  project_id?: number;
  summary_date: string;
  yesterday_work: string[];
  today_plan: string[];
  blockers: string[];
  standup_script: string;
  git_commits: GitCommit[];
  meetings_summary?: string;
  created_at: string;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files?: string[];
}

export function DailyPrep() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { selectedProjectId } = useAppStore();

  useEffect(() => {
    loadTodaySummary();
  }, [selectedProjectId]);

  const loadTodaySummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.DAILY_TODAY(selectedProjectId || undefined));
      if (response.ok) {
        const result = await response.json();
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Failed to load today summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewSummary = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINTS.DAILY_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          projectId: selectedProjectId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSummary(result.data);
      } else {
        alert('Error al generar el resumen. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Error al generar el resumen. Por favor, intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyStandupScript = () => {
    if (summary?.standup_script) {
      navigator.clipboard.writeText(summary.standup_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="daily-prep loading">
        <div className="spinner"></div>
        <p>Cargando resumen del día...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="daily-prep empty">
        <Calendar size={48} />
        <p>No hay resumen disponible para hoy</p>
        <button onClick={generateNewSummary} className="btn-primary" disabled={isGenerating}>
          {isGenerating ? 'Generando...' : 'Generar Resumen'}
        </button>
      </div>
    );
  }

  return (
    <div className="daily-prep">
      <div className="daily-prep-header">
        <h2>
          <Calendar size={24} />
          Daily Standup Prep
        </h2>
        <button
          onClick={generateNewSummary}
          className="btn-secondary btn-sm"
          disabled={isGenerating}
          title="Regenerar resumen"
        >
          <RefreshCw size={16} className={isGenerating ? 'spinning' : ''} />
          Actualizar
        </button>
      </div>

      {/* Standup Script - Highlighted */}
      <div className="standup-script-card">
        <div className="card-header">
          <h3>🎙️ Script para el Daily</h3>
          <button
            onClick={copyStandupScript}
            className="btn-icon btn-sm"
            title="Copiar al portapapeles"
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="script-content">
          <p>{summary.standup_script}</p>
        </div>
      </div>

      {/* Breakdown Sections */}
      <div className="breakdown-sections">
        {/* Yesterday */}
        <div className="breakdown-section">
          <h4>
            <CheckCircle size={18} />
            Ayer ({summary.git_commits.length} commits)
          </h4>
          {summary.yesterday_work.length > 0 ? (
            <ul className="work-list">
              {summary.yesterday_work.map((item, idx) => (
                <li key={idx}>
                  <span className="bullet">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No hay trabajo registrado</p>
          )}

          {/* Git Commits Dropdown */}
          {summary.git_commits.length > 0 && (
            <details className="commits-details">
              <summary>
                <GitCommit size={14} />
                Ver commits ({summary.git_commits.length})
              </summary>
              <ul className="commits-list">
                {summary.git_commits.map((commit, idx) => (
                  <li key={idx} className="commit-item">
                    <span className="commit-hash">{commit.hash}</span>
                    <span className="commit-message">{commit.message}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* Today */}
        <div className="breakdown-section">
          <h4>
            <Calendar size={18} />
            Hoy
          </h4>
          {summary.today_plan.length > 0 ? (
            <ul className="work-list">
              {summary.today_plan.map((item, idx) => (
                <li key={idx}>
                  <span className="bullet">→</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No hay tareas planeadas</p>
          )}
        </div>

        {/* Blockers */}
        <div className="breakdown-section blockers">
          <h4>
            <AlertCircle size={18} />
            Bloqueadores
          </h4>
          {summary.blockers.length > 0 ? (
            <ul className="work-list">
              {summary.blockers.map((item, idx) => (
                <li key={idx} className="blocker-item">
                  <span className="bullet">⚠️</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message success">✅ Sin bloqueadores</p>
          )}
        </div>
      </div>

      {/* Meetings Summary */}
      {summary.meetings_summary && (
        <div className="meetings-summary-section">
          <h4>📅 Reuniones de Ayer</h4>
          <pre>{summary.meetings_summary}</pre>
        </div>
      )}

      {/* Metadata */}
      <div className="summary-metadata">
        <span>Generado: {new Date(summary.created_at).toLocaleString('es-ES')}</span>
      </div>
    </div>
  );
}
