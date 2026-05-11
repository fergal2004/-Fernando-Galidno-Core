import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const EMPTY_TEAM_FORM = { name: '', description: '' };

const cell = { border: '1px solid #ddd', padding: '8px 12px' };
const btn = { padding: '6px 14px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', marginRight: 6 };

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  const fetchTeams = async () => {
    const { data } = await api.get('/teams');
    setTeams(data);
  };

  useEffect(() => { fetchTeams(); }, []);

  const fetchMembers = useCallback(async (team) => {
    const [membersRes, profilesRes] = await Promise.all([
      api.get(`/teams/${team.id}/members`),
      api.get('/profiles'),
    ]);
    setMembers(membersRes.data);
    setProfiles(profilesRes.data);
    setSelectedProfileId('');
  }, []);

  const openNew = () => {
    setTeamForm(EMPTY_TEAM_FORM);
    setEditingTeamId(null);
    setShowTeamForm(true);
  };

  const openEdit = (team) => {
    setTeamForm({ name: team.name, description: team.description || '' });
    setEditingTeamId(team.id);
    setShowTeamForm(true);
  };

  const handleCancelTeam = () => {
    setShowTeamForm(false);
    setEditingTeamId(null);
    setTeamForm(EMPTY_TEAM_FORM);
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    if (editingTeamId) {
      await api.put(`/teams/${editingTeamId}`, teamForm);
    } else {
      await api.post('/teams', teamForm);
    }
    handleCancelTeam();
    fetchTeams();
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('¿Eliminar este equipo?')) return;
    await api.delete(`/teams/${id}`);
    if (selectedTeam?.id === id) setSelectedTeam(null);
    fetchTeams();
  };

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    fetchMembers(team);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedProfileId) return;
    await api.post(`/teams/${selectedTeam.id}/members`, { user_id: selectedProfileId });
    fetchMembers(selectedTeam);
  };

  const handleRemoveMember = async (userId) => {
    await api.delete(`/teams/${selectedTeam.id}/members/${userId}`);
    fetchMembers(selectedTeam);
  };

  const memberIds = new Set(members.map((m) => m.id));
  const availableProfiles = profiles.filter((p) => !memberIds.has(p.id));

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Gestión de Equipos</h2>
        {!showTeamForm && (
          <button onClick={openNew} style={{ ...btn, background: '#2B579A', color: '#fff', border: 'none' }}>
            + Nuevo Equipo
          </button>
        )}
      </div>

      {/* ── Formulario equipo ── */}
      {showTeamForm && (
        <form onSubmit={handleTeamSubmit} style={{
          background: '#f5f7fa', border: '1px solid #ddd', borderRadius: 6,
          padding: 20, marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px' }}>{editingTeamId ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Nombre</label>
            <input
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              required
              style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Descripción</label>
            <textarea
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
            />
          </div>
          <button type="submit" style={{ ...btn, background: '#2B579A', color: '#fff', border: 'none' }}>
            Guardar
          </button>
          <button type="button" onClick={handleCancelTeam} style={btn}>
            Cancelar
          </button>
        </form>
      )}

      {/* ── Lista de equipos ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            <th style={cell}>Nombre</th>
            <th style={cell}>Descripción</th>
            <th style={cell}>Miembros</th>
            <th style={cell}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 && (
            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#888' }}>Sin equipos registrados</td></tr>
          )}
          {teams.map((team) => (
            <tr key={team.id} style={selectedTeam?.id === team.id ? { background: '#eef4ff' } : {}}>
              <td style={cell}>{team.name}</td>
              <td style={cell}>{team.description || '—'}</td>
              <td style={cell}>{team.members_count ?? team.members?.length ?? '—'}</td>
              <td style={cell}>
                <button onClick={() => handleSelectTeam(team)} style={{ ...btn, background: '#e8f0fe', borderColor: '#2B579A', color: '#2B579A' }}>
                  Ver Miembros
                </button>
                <button onClick={() => openEdit(team)} style={btn}>Editar</button>
                <button onClick={() => handleDeleteTeam(team.id)} style={{ ...btn, color: '#c00', borderColor: '#c00' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Sección miembros ── */}
      {selectedTeam && (
        <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Miembros de {selectedTeam.name}</h3>
            <button onClick={() => setSelectedTeam(null)} style={{ ...btn, fontSize: 12 }}>✕ Cerrar</button>
          </div>

          {/* Tabla de miembros */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                <th style={cell}>Nombre</th>
                <th style={cell}>Email</th>
                <th style={cell}>Tareas Activas</th>
                <th style={cell}>Horas Asignadas</th>
                <th style={cell}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr><td colSpan={5} style={{ ...cell, textAlign: 'center', color: '#888' }}>Sin miembros en este equipo</td></tr>
              )}
              {members.map((member) => (
                <tr key={member.id}>
                  <td style={cell}>{member.first_name} {member.last_name}</td>
                  <td style={cell}>{member.email}</td>
                  <td style={cell}>{member.active_tasks ?? '—'}</td>
                  <td style={cell}>{member.assigned_hours != null ? `${member.assigned_hours}h` : '—'}</td>
                  <td style={cell}>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      style={{ ...btn, color: '#c00', borderColor: '#c00', marginRight: 0 }}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Formulario agregar miembro */}
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              required
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1 }}
            >
              <option value="">-- Seleccionar usuario --</option>
              {availableProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.email})
                </option>
              ))}
            </select>
            <button type="submit" style={{ ...btn, background: '#2B579A', color: '#fff', border: 'none', marginRight: 0 }}>
              Agregar Miembro
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
