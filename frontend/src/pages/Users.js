import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const EMPTY_USER_FORM = { first_name: '', last_name: '', email: '', role: 'member', weekly_hours_capacity: 40 };
const EMPTY_PRACTICE_FORM = { name: '', description: '' };
const EMPTY_SKILL_FORM = { name: '', practice_id: '' };

const cell = { border: '1px solid #ddd', padding: '8px 12px' };
const btn = { padding: '6px 14px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', marginRight: 6 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ccd0da', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444' };
const THEME = '#2B579A';

const sectionStyle = {
  background: '#f5f7fa', border: '1px solid #ddd', borderRadius: 6,
  padding: 20, marginBottom: 28,
};

// ─── Pestaña usuarios ────────────────────────────────────────────────────────
function UsersSection({ practices, skills }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [error, setError] = useState('');

  const [skillsModal, setSkillsModal] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillsError, setSkillsError] = useState('');

  const fetchUsers = async () => {
    const { data } = await api.get('/profiles');
    setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openNew = () => {
    setForm(EMPTY_USER_FORM);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (user) => {
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      weekly_hours_capacity: user.weekly_hours_capacity ?? 40,
    });
    setEditingId(user.id);
    setError('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_USER_FORM);
    setError('');
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/profiles/${editingId}`, form);
      } else {
        await api.post('/profiles', form);
      }
      handleCancel();
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        const msg = data.message || Object.values(data.errors || {})[0]?.[0] || 'Error de validación';
        setError(msg);
      } else {
        setError('Error al guardar el usuario.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    await api.delete(`/profiles/${id}`);
    fetchUsers();
  };

  const openSkillsModal = async (user) => {
    setSkillsModal(user);
    setSkillsError('');
    const { data } = await api.get(`/profiles/${user.id}/skills`);
    setSelectedSkills(data.map(s => s.id));
  };

  const toggleSkill = (skillId) => {
    setSelectedSkills(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const saveSkills = async () => {
    setSkillsError('');
    try {
      await api.post(`/profiles/${skillsModal.id}/skills`, { skill_ids: selectedSkills });
      setSkillsModal(null);
    } catch {
      setSkillsError('Error al guardar habilidades.');
    }
  };

  const skillsByPractice = practices.map(p => ({
    ...p,
    skills: skills.filter(s => s.practice_id === p.id),
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: THEME }}>Usuarios</h3>
        {!showForm && (
          <button onClick={openNew} style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>
            + Nuevo Usuario
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={sectionStyle}>
          <h4 style={{ margin: '0 0 14px' }}>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
          {error && (
            <p style={{ color: '#c00', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
              {error}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Apellido</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rol</label>
              <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Horas semanales disponibles</label>
              <input
                name="weekly_hours_capacity"
                type="number"
                min={1} max={80}
                value={form.weekly_hours_capacity}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>
          <button type="submit" style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>Guardar</button>
          <button type="button" onClick={handleCancel} style={btn}>Cancelar</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            <th style={cell}>Nombre Completo</th>
            <th style={cell}>Email</th>
            <th style={cell}>Rol</th>
            <th style={cell}>Hs/semana</th>
            <th style={cell}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={5} style={{ ...cell, textAlign: 'center', color: '#888' }}>Sin usuarios registrados</td></tr>
          )}
          {users.map((user) => (
            <tr key={user.id}>
              <td style={cell}>{user.first_name} {user.last_name}</td>
              <td style={cell}>{user.email}</td>
              <td style={cell}>{user.role}</td>
              <td style={{ ...cell, textAlign: 'center' }}>{user.weekly_hours_capacity ?? 40}h</td>
              <td style={cell}>
                <button onClick={() => openEdit(user)} style={btn}>Editar</button>
                <button onClick={() => openSkillsModal(user)} style={{ ...btn, background: '#e8f4fd', borderColor: THEME, color: THEME }}>
                  Skills
                </button>
                <button onClick={() => handleDelete(user.id)} style={{ ...btn, color: '#c00', borderColor: '#c00' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de skills del usuario */}
      {skillsModal && (
        <div
          onClick={() => setSkillsModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 10, padding: 28, width: 480, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <h3 style={{ margin: '0 0 4px', color: THEME }}>Habilidades de {skillsModal.first_name}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>Seleccioná las skills del usuario</p>

            {skillsError && (
              <p style={{ color: '#c00', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
                {skillsError}
              </p>
            )}

            {skillsByPractice.filter(p => p.skills.length > 0).map(practice => (
              <div key={practice.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  {practice.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {practice.skills.map(skill => {
                    const selected = selectedSkills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 14,
                          border: `1px solid ${selected ? THEME : '#ccc'}`,
                          background: selected ? THEME : '#f5f7fa',
                          color: selected ? '#fff' : '#444',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={saveSkills} style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>Guardar</button>
              <button onClick={() => setSkillsModal(null)} style={btn}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pestaña catálogo de prácticas ───────────────────────────────────────────
function PracticesSection({ practices, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRACTICE_FORM);
  const [error, setError] = useState('');

  const openNew = () => { setForm(EMPTY_PRACTICE_FORM); setEditingId(null); setError(''); setShowForm(true); };

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '' });
    setEditingId(p.id);
    setError('');
    setShowForm(true);
  };

  const handleCancel = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_PRACTICE_FORM); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/practices/${editingId}`, form);
      } else {
        await api.post('/practices', form);
      }
      handleCancel();
      onRefresh();
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        setError(data.message || Object.values(data.errors || {})[0]?.[0] || 'Error de validación');
      } else {
        setError('Error al guardar.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta práctica?')) return;
    await api.delete(`/practices/${id}`);
    onRefresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: THEME }}>Catálogo de Prácticas</h3>
        {!showForm && (
          <button onClick={openNew} style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>
            + Nueva Práctica
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={sectionStyle}>
          <h4 style={{ margin: '0 0 14px' }}>{editingId ? 'Editar Práctica' : 'Nueva Práctica'}</h4>
          {error && (
            <p style={{ color: '#c00', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
              {error}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="ej: Mobile" />
            </div>
            <div>
              <label style={labelStyle}>Descripción</label>
              <input name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} placeholder="Descripción opcional" />
            </div>
          </div>
          <button type="submit" style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>Guardar</button>
          <button type="button" onClick={handleCancel} style={btn}>Cancelar</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            <th style={cell}>Nombre</th>
            <th style={cell}>Descripción</th>
            <th style={cell}>Skills</th>
            <th style={cell}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {practices.length === 0 && (
            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#888' }}>Sin prácticas registradas</td></tr>
          )}
          {practices.map(p => (
            <tr key={p.id}>
              <td style={cell}><strong>{p.name}</strong></td>
              <td style={cell}>{p.description || '-'}</td>
              <td style={cell}>{p.skills?.length ?? 0}</td>
              <td style={cell}>
                <button onClick={() => openEdit(p)} style={btn}>Editar</button>
                <button onClick={() => handleDelete(p.id)} style={{ ...btn, color: '#c00', borderColor: '#c00' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pestaña catálogo de skills ──────────────────────────────────────────────
function SkillsSection({ practices, skills, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_SKILL_FORM);
  const [error, setError] = useState('');

  const openNew = () => { setForm(EMPTY_SKILL_FORM); setEditingId(null); setError(''); setShowForm(true); };

  const openEdit = (s) => {
    setForm({ name: s.name, practice_id: s.practice_id || '' });
    setEditingId(s.id);
    setError('');
    setShowForm(true);
  };

  const handleCancel = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_SKILL_FORM); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { name: form.name, practice_id: form.practice_id || null };
    try {
      if (editingId) {
        await api.put(`/skills/${editingId}`, payload);
      } else {
        await api.post('/skills', payload);
      }
      handleCancel();
      onRefresh();
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        setError(data.message || Object.values(data.errors || {})[0]?.[0] || 'Error de validación');
      } else {
        setError('Error al guardar.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta skill?')) return;
    await api.delete(`/skills/${id}`);
    onRefresh();
  };

  const practiceMap = Object.fromEntries(practices.map(p => [p.id, p.name]));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: THEME }}>Catálogo de Skills</h3>
        {!showForm && (
          <button onClick={openNew} style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>
            + Nueva Skill
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={sectionStyle}>
          <h4 style={{ margin: '0 0 14px' }}>{editingId ? 'Editar Skill' : 'Nueva Skill'}</h4>
          {error && (
            <p style={{ color: '#c00', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
              {error}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="ej: React Native" />
            </div>
            <div>
              <label style={labelStyle}>Práctica</label>
              <select value={form.practice_id} onChange={e => setForm({ ...form, practice_id: e.target.value })} style={inputStyle}>
                <option value="">-- Sin práctica --</option>
                {practices.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...btn, background: THEME, color: '#fff', border: 'none' }}>Guardar</button>
          <button type="button" onClick={handleCancel} style={btn}>Cancelar</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            <th style={cell}>Skill</th>
            <th style={cell}>Práctica</th>
            <th style={cell}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {skills.length === 0 && (
            <tr><td colSpan={3} style={{ ...cell, textAlign: 'center', color: '#888' }}>Sin skills registradas</td></tr>
          )}
          {skills.map(s => (
            <tr key={s.id}>
              <td style={cell}>{s.name}</td>
              <td style={cell}>{s.practice ? s.practice.name : (practiceMap[s.practice_id] || '—')}</td>
              <td style={cell}>
                <button onClick={() => openEdit(s)} style={btn}>Editar</button>
                <button onClick={() => handleDelete(s.id)} style={{ ...btn, color: '#c00', borderColor: '#c00' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
const TABS = ['Usuarios', 'Prácticas', 'Skills'];

export default function Users() {
  const [activeTab, setActiveTab] = useState('Usuarios');
  const [practices, setPractices] = useState([]);
  const [skills, setSkills] = useState([]);

  const fetchCatalog = useCallback(async () => {
    const [practRes, skillRes] = await Promise.all([
      api.get('/practices'),
      api.get('/skills'),
    ]);
    setPractices(practRes.data);
    setSkills(skillRes.data);
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Gestión de Usuarios</h2>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #dde3f0', marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === tab ? `3px solid ${THEME}` : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? THEME : '#555',
              fontSize: 14,
              marginBottom: -2,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Usuarios' && (
        <UsersSection practices={practices} skills={skills} />
      )}
      {activeTab === 'Prácticas' && (
        <PracticesSection practices={practices} onRefresh={fetchCatalog} />
      )}
      {activeTab === 'Skills' && (
        <SkillsSection practices={practices} skills={skills} onRefresh={fetchCatalog} />
      )}
    </div>
  );
}
