import { useState, useEffect } from 'react';
import api from '../api';

const EMPTY_FORM = { first_name: '', last_name: '', email: '', role: 'member' };

const cell = { border: '1px solid #ddd', padding: '8px 12px' };
const btn = { padding: '6px 14px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', marginRight: 6 };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    const { data } = await api.get('/profiles');
    setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
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
    });
    setEditingId(user.id);
    setError('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  return (
    <div style={{ maxWidth: 860, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
        {!showForm && (
          <button onClick={openNew} style={{ ...btn, background: '#2B579A', color: '#fff', border: 'none' }}>
            + Nuevo Usuario
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#f5f7fa', border: '1px solid #ddd', borderRadius: 6,
          padding: 20, marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>

          {error && (
            <p style={{ color: '#c00', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Nombre</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Apellido</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Rol</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>

          <button type="submit" style={{ ...btn, background: '#2B579A', color: '#fff', border: 'none' }}>
            Guardar
          </button>
          <button type="button" onClick={handleCancel} style={btn}>
            Cancelar
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            <th style={cell}>Nombre Completo</th>
            <th style={cell}>Email</th>
            <th style={cell}>Rol</th>
            <th style={cell}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', color: '#888' }}>Sin usuarios registrados</td></tr>
          )}
          {users.map((user) => (
            <tr key={user.id}>
              <td style={cell}>{user.first_name} {user.last_name}</td>
              <td style={cell}>{user.email}</td>
              <td style={cell}>{user.role}</td>
              <td style={cell}>
                <button onClick={() => openEdit(user)} style={btn}>Editar</button>
                <button onClick={() => handleDelete(user.id)} style={{ ...btn, color: '#c00', borderColor: '#c00' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
