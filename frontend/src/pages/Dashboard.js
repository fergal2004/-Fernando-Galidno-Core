import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import api from '../api';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchTasks = async () => {
    const { data } = await api.get('/tasks');
    setTasks(data);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { title, description, due_date: dueDate || null };

    if (editingId) {
      await api.put(`/tasks/${editingId}`, payload);
      setEditingId(null);
    } else {
      await api.post('/tasks', payload);
    }

    setTitle(''); setDescription(''); setDueDate('');
    fetchTasks();
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.due_date || '');
  };

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const toggleStatus = async (task) => {
    await api.put(`/tasks/${task.id}`, {
      status: task.status === 'pending' ? 'completed' : 'pending'
    });
    fetchTasks();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Mis Tareas</h2>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: 8, marginRight: 10 }}
        />
        <input
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 8, marginRight: 10 }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ padding: 8, marginRight: 10 }}
        />
        <button type="submit" style={{ padding: 8 }}>
          {editingId ? 'Actualizar' : 'Crear'}
        </button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setTitle(''); setDescription(''); setDueDate(''); }}
            style={{ padding: 8, marginLeft: 5 }}>
            Cancelar
          </button>
        )}
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Título</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Descripción</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Estado</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Fecha</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{task.title}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{task.description}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, cursor: 'pointer' }}
                onClick={() => toggleStatus(task)}>
                {task.status === 'pending' ? '⏳ Pendiente' : '✅ Completada'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{task.due_date || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <button onClick={() => handleEdit(task)}>Editar</button>
                <button onClick={() => handleDelete(task.id)} style={{ marginLeft: 5 }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}