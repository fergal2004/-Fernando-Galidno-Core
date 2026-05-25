import { useState, useEffect } from 'react';
import api from '../api';

const PRIORITY_COLORS = {
  high: '#F44336',
  medium: '#FF9800',
  low: '#4CAF50',
};

const PRIORITY_LABELS = { high: 'Alta', medium: 'Media', low: 'Baja' };

const STATUS_LABELS = {
  pending: '⏳ Pendiente',
  in_progress: '🔄 En Progreso',
  completed: '✅ Completada',
};

const STATUS_CYCLE = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };

const WORKLOAD_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };

const tdStyle = { border: '1px solid #ddd', padding: '8px 10px', verticalAlign: 'middle' };
const thStyle = { ...tdStyle, background: '#2B579A', color: '#fff', fontWeight: 600 };

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchTasks = async () => {
    const { data } = await api.get('/tasks');
    setTasks(data);
  };

  const fetchTeams = async () => {
    const { data } = await api.get('/teams');
    setTeams(data);
  };

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, []);

  const loadMembers = async (teamId) => {
    if (!teamId) { setMembers([]); return; }
    setMembersLoading(true);
    try {
      const { data } = await api.get(`/teams/${teamId}/members`);
      const sorted = [...data].sort((a, b) => (a.assigned_hours ?? 0) - (b.assigned_hours ?? 0));
      setMembers(sorted);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
    setSelectedMember('');
    setMembers([]);
    loadMembers(value);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium');
    setEstimatedHours(''); setDueDate('');
    setSelectedTeam(''); setSelectedMember('');
    setMembers([]); setEditingId(null); setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      title,
      description,
      priority,
      estimated_hours: estimatedHours || null,
      due_date: dueDate || null,
      team_id: selectedTeam || null,
      assigned_to: selectedMember || null,
    };
    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      resetForm();
      fetchTasks();
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors) {
          setFormError(Object.values(errors).flat().join(' | '));
        } else {
          setFormError(err.response.data.message || 'Error de validación.');
        }
      } else {
        setFormError('Error al guardar la tarea.');
      }
    }
  };

  const handleEdit = async (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setEstimatedHours(task.estimated_hours || '');
    setDueDate(task.due_date || '');
    setFormError(null);

    const teamId = task.team_id || '';
    setSelectedTeam(teamId);
    setSelectedMember(task.assigned_to || '');
    setMembers([]);
    if (teamId) await loadMembers(teamId);
  };

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const toggleStatus = async (task) => {
    const nextStatus = STATUS_CYCLE[task.status] || 'pending';
    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar el estado de la tarea.');
    }
  };

  const memberLabel = (m) => {
    const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.name || 'Sin nombre';
    const hrs = m.assigned_hours ?? 0;
    const nivel = WORKLOAD_LABELS[m.workload_level] || m.workload_level || '-';
    return `${name} - ${hrs}hrs (${nivel})`;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 20px' }}>
      <h2 style={{ color: '#2B579A', marginBottom: 20 }}>Gestión de Tareas</h2>

      {/* Formulario */}
      <div style={{ background: '#f5f7fb', border: '1px solid #dde3f0', borderRadius: 8, padding: 20, marginBottom: 28 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: '#2B579A' }}>
          {editingId ? 'Editar Tarea' : 'Nueva Tarea'}
        </h3>

        {formError && (
          <div style={{ background: '#fff0f0', border: '1px solid #F44336', color: '#c0392b', padding: '10px 14px', borderRadius: 6, marginBottom: 14 }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Título *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Título de la tarea"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Horas Estimadas</label>
                <input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  min={0.5} max={40} step={0.5}
                  placeholder="ej: 4"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Fecha Límite</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Equipo</label>
              <select value={selectedTeam} onChange={(e) => handleTeamChange(e.target.value)} style={inputStyle}>
                <option value="">-- Selecciona un equipo --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Miembro Asignado</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                disabled={!selectedTeam || membersLoading}
                style={{ ...inputStyle, background: !selectedTeam ? '#f0f0f0' : undefined }}
              >
                <option value="">
                  {membersLoading ? 'Cargando...' : !selectedTeam ? '-- Selecciona un equipo primero --' : '-- Sin asignar --'}
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{memberLabel(m)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={btnPrimary}>
              {editingId ? 'Actualizar' : 'Crear Tarea'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={btnSecondary}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Prioridad</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Horas Est.</th>
              <th style={thStyle}>Asignado a</th>
              <th style={thStyle}>Equipo</th>
              <th style={thStyle}>Fecha Límite</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: 24 }}>
                  No hay tareas. Crea una arriba.
                </td>
              </tr>
            )}
            {tasks.map((task) => (
              <tr key={task.id} style={{ background: '#fff' }}>
                <td style={tdStyle}>{task.title}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{
                    background: PRIORITY_COLORS[task.priority] || '#999',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {PRIORITY_LABELS[task.priority] || task.priority}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span
                    onClick={() => toggleStatus(task)}
                    title="Click para cambiar estado"
                    style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                  >
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {task.estimated_hours != null ? `${task.estimated_hours}h` : '-'}
                </td>
                <td style={tdStyle}>
                  {task.assignee
                    ? `${task.assignee.first_name ?? ''} ${task.assignee.last_name ?? ''}`.trim()
                    : '-'}
                </td>
                <td style={tdStyle}>
                  {task.team ? task.team.name : '-'}
                </td>
                <td style={tdStyle}>{task.due_date || '-'}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <button onClick={() => handleEdit(task)} style={btnSmallEdit}>Editar</button>
                  <button onClick={() => handleDelete(task.id)} style={btnSmallDelete}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444' };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ccd0da', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const btnPrimary = { background: '#2B579A', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const btnSecondary = { background: '#e0e0e0', color: '#333', border: 'none', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const btnSmallEdit = { background: '#2B579A', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, marginRight: 6 };
const btnSmallDelete = { background: '#F44336', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 };
