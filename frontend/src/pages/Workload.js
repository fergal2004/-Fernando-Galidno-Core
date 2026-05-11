import { useState, useEffect } from 'react';
import api from '../api';

const LOAD_COLORS = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };
const LOAD_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };

const tdStyle = { border: '1px solid #ddd', padding: '8px 12px', verticalAlign: 'middle' };
const thStyle = { ...tdStyle, background: '#2B579A', color: '#fff', fontWeight: 600 };

export default function Workload() {
  const [teams, setTeams] = useState([]);
  const [filterTeam, setFilterTeam] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/teams').then(({ data }) => setTeams(data));
  }, []);

  const handleSearch = async () => {
    if (!filterTeam) return;
    setLoading(true);
    setError(null);
    try {
      const params = { team_id: filterTeam };
      if (filterStart) params.start_date = filterStart;
      if (filterEnd) params.end_date = filterEnd;
      const { data } = await api.get('/workload', { params });
      setResult(data);
    } catch (err) {
      setError('Error al cargar la carga de trabajo.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 20px' }}>
      <h2 style={{ color: '#2B579A', marginBottom: 20 }}>Carga de Trabajo</h2>

      {/* Filtros */}
      <div style={{ background: '#f5f7fb', border: '1px solid #dde3f0', borderRadius: 8, padding: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Equipo *</label>
            <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} style={inputStyle}>
              <option value="">-- Selecciona un equipo --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>Fecha Inicio</label>
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>Fecha Fin</label>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <button
              onClick={handleSearch}
              disabled={!filterTeam || loading}
              style={{
                background: filterTeam ? '#2B579A' : '#aaa',
                color: '#fff',
                border: 'none',
                padding: '9px 22px',
                borderRadius: 6,
                cursor: filterTeam ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Sin equipo */}
      {!filterTeam && !result && (
        <div style={{ textAlign: 'center', color: '#888', padding: 40, fontSize: 16 }}>
          Selecciona un equipo para ver la carga de trabajo
        </div>
      )}

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #F44336', color: '#c0392b', padding: '10px 14px', borderRadius: 6, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Tarjetas resumen */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
            <SummaryCard label="Total Tareas" value={result.summary?.total_tasks ?? '-'} />
            <SummaryCard label="Horas Totales" value={`${result.summary?.total_hours ?? '-'} hrs`} />
            <SummaryCard label="Promedio por Persona" value={`${result.summary?.average_hours ?? '-'} hrs`} />
          </div>

          {/* Tabla de miembros */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Miembro</th>
                  <th style={thStyle}>Tareas Asignadas</th>
                  <th style={thStyle}>Horas Estimadas</th>
                  <th style={thStyle}>Nivel de Carga</th>
                </tr>
              </thead>
              <tbody>
                {(!result.members || result.members.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: 24 }}>
                      No hay miembros con datos en este rango.
                    </td>
                  </tr>
                )}
                {(result.members ?? []).map((m, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>{m.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{m.tasks_count}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{m.assigned_hours} hrs</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        background: LOAD_COLORS[m.workload_level] || '#999',
                        color: '#fff',
                        padding: '2px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {LOAD_LABELS[m.workload_level] || m.workload_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sugerencia */}
          {result.suggested_assignee && (
            <div style={{
              background: '#FFF8E1',
              border: '1px solid #FFC107',
              borderRadius: 6,
              padding: '12px 16px',
              fontSize: 15,
              color: '#5a4000',
            }}>
              💡 Miembro sugerido:{' '}
              <strong>{result.suggested_assignee.name}</strong>{' '}
              — {result.suggested_assignee.assigned_hours} hrs ({LOAD_LABELS[result.suggested_assignee.workload_level] || result.suggested_assignee.workload_level})
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={{
      flex: 1,
      background: '#F0F7FF',
      border: '1px solid #2B579A',
      borderRadius: 8,
      padding: 20,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, color: '#2B579A', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1a3a6b' }}>{value}</div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444' };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ccd0da', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
