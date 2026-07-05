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

// Panel que muestra qué habilidades son más demandadas según cuántos proyectos
// tiene cada práctica (Mobile, E-commerce, SMS, etc.)
function SkillDemandPanel({ projects, practices, skills }) {
  // PASO 1: Contar cuántos proyectos pertenecen a cada práctica
  // Resultado: { "id-practica": 3, "otro-id": 1, ... }
  const countByPractice = projects.reduce((acc, p) => {
    if (p.practice_id) {
      acc[p.practice_id] = (acc[p.practice_id] || 0) + 1;
    }
    return acc;
  }, {});

  // PASO 2: Cruzar prácticas con su conteo y sus habilidades asociadas,
  // filtrar las que no tienen proyectos y ordenar de mayor a menor demanda
  const demandList = practices
    .map(p => ({
      ...p,
      count: countByPractice[p.id] || 0,           // cuántos proyectos tiene
      skills: skills.filter(s => s.practice_id === p.id), // habilidades de esa práctica
    }))
    .filter(p => p.count > 0)   // ocultar prácticas sin proyectos
    .sort((a, b) => b.count - a.count); // mayor demanda primero

  // Si ninguna práctica tiene proyectos, no mostrar el panel
  if (demandList.length === 0) return null;

  // El primero de la lista tiene el mayor conteo — se usa para calcular el % de la barra
  const maxCount = demandList[0].count;

  // Un color distinto por práctica para diferenciarlas visualmente
  const DEMAND_COLORS = ['#1565C0', '#0277BD', '#00838F', '#2E7D32', '#6A1B9A'];

  return (
    <div style={{ marginBottom: 24, background: '#f5f7fa', border: '1px solid #ddd', borderRadius: 8, padding: '16px 20px' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#333' }}>
        Demanda de Habilidades por Práctica
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {demandList.map((p, idx) => {
          const color = DEMAND_COLORS[idx % DEMAND_COLORS.length];
          // PASO 3: Calcular el ancho de la barra proporcional al máximo (100% = práctica líder)
          const barWidth = Math.round((p.count / maxCount) * 100);
          return (
            <div key={p.id}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 10 }}>
                <span style={{ minWidth: 110, fontSize: 13, fontWeight: 700, color }}>{p.name}</span>
                <div style={{ flex: 1, background: '#e0e0e0', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${barWidth}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 12, color: '#555', minWidth: 80 }}>
                  {p.count} proyecto{p.count !== 1 ? 's' : ''}
                </span>
              </div>
              {p.skills.length > 0 && (
                <div style={{ paddingLeft: 120, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {p.skills.map(s => (
                    <span key={s.id} style={{
                      background: color + '18',
                      color,
                      border: `1px solid ${color}44`,
                      borderRadius: 12,
                      padding: '2px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [practices, setPractices] = useState([]);
  const [teams, setTeams] = useState([]);
  const [skills, setSkills] = useState([]);
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
    // Se traen prácticas, equipos y habilidades en paralelo
    // Las habilidades son necesarias para el panel de demanda
    const [practRes, teamsRes, skillsRes] = await Promise.all([
      api.get('/practices'),
      api.get('/teams'),
      api.get('/skills'),
    ]);
    setPractices(practRes.data);
    setTeams(teamsRes.data);
    setSkills(skillsRes.data);
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

      {/* Panel de demanda de habilidades */}
      <SkillDemandPanel projects={projects} practices={practices} skills={skills} />

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
