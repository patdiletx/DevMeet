import { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, X, ArrowLeft, Eye } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  status: string;
  meeting_count?: number;
}

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const { setView, setCurrentProjectId } = useAppStore();
  const API_URL = 'http://localhost:3001/api/v1';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects?withMeetings=true`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Submitting project:', formData);

    try {
      const url = editingProject
        ? `${API_URL}/projects/${editingProject.id}`
        : `${API_URL}/projects`;

      const method = editingProject ? 'PATCH' : 'POST';

      console.log(`📡 Making ${method} request to:`, url);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('📥 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Project saved successfully');
        await loadProjects();
        resetForm();
      } else {
        console.error('❌ Failed to save project:', data.error);
        alert(`Error: ${data.error || 'Failed to save project'}`);
      }
    } catch (error) {
      console.error('💥 Error saving project:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este proyecto? Las meetings asociadas no se eliminarán.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#3b82f6'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3b82f6' });
    setEditingProject(null);
    setShowForm(false);
  };

  const handleViewProject = (projectId: number) => {
    setCurrentProjectId(projectId);
    setView('project-details');
  };

  return (
    <div className="project-manager">
      <div className="project-header">
        <h2>
          <Folder size={24} />
          Proyectos
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setView('dashboard')}
            className="btn-secondary btn-sm"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary btn-sm"
          >
            <Plus size={16} />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {showForm && (
        <div className="project-form-overlay">
          <div className="project-form">
            <div className="form-header">
              <h3>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
              <button onClick={resetForm} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Proyecto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: Proyecto Alpha"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingProject ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <Folder size={48} />
            <p>No hay proyectos creados</p>
            <p className="text-muted">Crea un proyecto para organizar tus meetings</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-color" style={{ backgroundColor: project.color }} />
              <div className="project-info">
                <h4>{project.name}</h4>
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                <span className="meeting-count">
                  {project.meeting_count || 0} meeting{project.meeting_count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="project-actions">
                <button
                  onClick={() => handleViewProject(project.id)}
                  className="btn-icon"
                  title="Ver detalles"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                  className="btn-icon"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id);
                  }}
                  className="btn-icon btn-danger"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
