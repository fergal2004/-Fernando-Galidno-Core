import { useState, useEffect } from 'react';
import api from '../api';

const EMPTY_FORM = { name: '', description: '', practice_id: '', team_id: '', status: 'active' };

const cell = { border: '1px solid #ddd', padding: '8px 12px' };
const btn = { padding: '6px 14px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', marginRight: 6 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ccd0da', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444' };
const THEME = '#2B579A';

const STATUS_LABELS = { active: 'Activo', completed: 'Completado', on_hold: 'En pausa' };
const STATUS_COLORS = { active: '#4CAF50', completed: '#2196F3', on_hold: '#FF9800' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [practices, setPractices] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const fetchProjects = async (teamId) => {
    const params = teamId ? { team_id: teamId } : {};
    const { data } = await api.get('/projects', { params });
    setProjects(data);
  };

  const fetchCatalog = async () => {
    const [practRes, teamsRes] = await Promise.all([
      api.get('/practices'),
      api.get('/teams'),
    ]);
    setPractices(practRes.data);
    setTeams(teamsRes.data);
  };

  useEffect(() => {
    fetchProjects();
    fetchCatalog();
  }, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (project) => {
    setForm({
      name: project.name,
      description: project.description || '',
      practice_id: project.practice_id || '',
      team_id: project.team_id || '',
      status: project.status,
    });
    setEditingId(project.id);
    setError('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      practice_id: form.practice_id || null,
      team_id: form.team_id || null,
    };
    try {
      if (editingId) {
        await api.put(`/projects/${editingId}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      handleCancel();
      fetchProjects(filterTeam);
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        const msg = data.message || Object.values(data.errors || {})[0]?.[0] || 'Error de validación';
        setError(msg);
      } else {
        setError('Error al guardar el proyecto.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proyecto?')) return;
    await api.delete(`/projects/${id}`);
    fetchProjects(filterTeam);
  };

  const handleFilterTeam = (value) => {
    setFilterTeam(value);
    fetchProjects(value);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Proyectos</h2>
        {!showForm && (
          <button onClick={openNew} style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>
            + Nuevo Proyecto
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#f5f7fa', border: '1px solid #ddd', borderRadius: 6,
          padding: 20, marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>

          {error && (
            <p style={{ color: '#c00', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre *</label>
              <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="ej: App iOS para cliente X" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descripción opcional" />
            </div>
            <div>
              <label style={labelStyle}>Práctica</label>
              <select name="practice_id" value={form.practice_id} onChange={handleChange} style={inputStyle}>
                <option value="">-- Sin práctica --</option>
                {practices.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Equipo</label>
              <select name="team_id" value={form.team_id} onChange={handleChange} style={inputStyle}>
                <option value="">-- Sin equipo --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                <option value="active">Activo</option>
                <option value="on_hold">En pausa</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>

          <button type="submit" style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>Guardar</button>
          <button type="button" onClick={handleCancel} style={btn}>Cancelar</button>
        </form>
      )}

      {/* Filtro por equipo */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={filterTeam}
          onChange={e => handleFilterTeam(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #ccd0da', borderRadius: 6, fontSize: 14 }}
        >
          <option value="">Todos los equipos</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            <th style={cell}>Nombre</th>
            <th style={cell}>Práctica</th>
            <th style={cell}>Equipo</th>
            <th style={cell}>Estado</th>
            <th style={cell}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 && (
            <tr><td colSpan={5} style={{ ...cell, textAlign: 'center', color: '#888' }}>Sin proyectos registrados</td></tr>
          )}
          {projects.map(project => (
            <tr key={project.id}>
              <td style={cell}><strong>{project.name}</strong>{project.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{project.description}</div>}</td>
              <td style={cell}>{project.practice?.name || '—'}</td>
              <td style={cell}>{project.team?.name || '—'}</td>
              <td style={{ ...cell, textAlign: 'center' }}>
                <span style={{
                  background: STATUS_COLORS[project.status] + '22',
                  color: STATUS_COLORS[project.status],
                  border: `1px solid ${STATUS_COLORS[project.status]}`,
                  padding: '2px 10px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {STATUS_LABELS[project.status] || project.status}
                </span>
              </td>
              <td style={cell}>
                <button onClick={() => openEdit(project)} style={btn}>Editar</button>
                <button onClick={() => handleDelete(project.id)} style={{ ...btn, color: '#c00', borderColor: '#c00' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
