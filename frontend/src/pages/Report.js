import { useState, useEffect } from 'react';
import api from '../api';

const THEME = '#2B579A';
const cell = { border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', fontSize: 14 };

const LEVEL_STYLES = {
  low:    { background: '#E8F5E9', color: '#2E7D32', label: 'Baja' },
  medium: { background: '#FFF8E1', color: '#F57F17', label: 'Media' },
  high:   { background: '#FFEBEE', color: '#C62828', label: 'Alta' },
};

const STATUS_LABELS = { pending: 'Pendientes', in_progress: 'En progreso', completed: 'Completadas' };
const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };

function Card({ label, value }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: THEME }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Report() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    api.get('/teams').then(({ data }) => setTeams(data));
  }, []);

  const loadReport = async (id) => {
    setTeamId(id);
    setReport(null);
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/team/${id}`);
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  const levelBadge = (level) => {
    const s = LEVEL_STYLES[level] || {};
    return (
      <span style={{ ...s, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
        {s.label || level}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 20px' }}>
      <h2 style={{ color: THEME, marginBottom: 20 }}>Reporte de Equipo</h2>

      <select
        value={teamId}
        onChange={(e) => loadReport(e.target.value)}
        style={{ padding: 8, fontSize: 14, minWidth: 260, marginBottom: 24 }}
      >
        <option value="">Seleccione un equipo…</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {loading && <p>Cargando reporte…</p>}

      {report && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <Card label="Tareas Activas" value={report.summary.total_tasks} />
            <Card label="Horas Totales" value={`${report.summary.total_hours} h`} />
            <Card label="Promedio por Miembro" value={`${report.summary.average_hours} h`} />
          </div>

          <div style={{ display: 'flex', gap: 32, marginBottom: 24, fontSize: 14 }}>
            <div>
              <strong>Por estado:</strong>{' '}
              {Object.entries(report.summary.by_status || {}).map(([k, v]) => (
                <span key={k} style={{ marginRight: 12 }}>{STATUS_LABELS[k] || k}: <strong>{v}</strong></span>
              ))}
            </div>
            <div>
              <strong>Por prioridad:</strong>{' '}
              {Object.entries(report.summary.by_priority || {}).map(([k, v]) => (
                <span key={k} style={{ marginRight: 12 }}>{PRIORITY_LABELS[k] || k}: <strong>{v}</strong></span>
              ))}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: THEME, color: '#fff' }}>
                <th style={cell}>Miembro</th>
                <th style={cell}>Email</th>
                <th style={cell}>Tareas</th>
                <th style={cell}>Horas</th>
                <th style={cell}>Capacidad</th>
                <th style={cell}>% Carga</th>
                <th style={cell}>Nivel</th>
              </tr>
            </thead>
            <tbody>
              {report.members.map((m) => (
                <tr key={m.id} style={m.id === report.suggested_assignee?.id ? { background: '#F1F8E9' } : {}}>
                  <td style={cell}>
                    {m.name}
                    {m.id === report.suggested_assignee?.id && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#2E7D32' }}>★ Sugerido</span>
                    )}
                  </td>
                  <td style={cell}>{m.email}</td>
                  <td style={cell}>{m.tasks_count}</td>
                  <td style={cell}>{m.assigned_hours} h</td>
                  <td style={cell}>{m.capacity} h</td>
                  <td style={cell}>{m.workload_pct}%</td>
                  <td style={cell}>{levelBadge(m.workload_level)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => setShowJson(!showJson)}
            style={{ padding: '6px 14px', fontSize: 13, cursor: 'pointer', border: `1px solid ${THEME}`, color: THEME, background: '#fff', borderRadius: 4 }}
          >
            {showJson ? 'Ocultar JSON' : 'Ver objeto JSON del API'}
          </button>
          {showJson && (
            <pre style={{ background: '#263238', color: '#B2FF59', padding: 16, borderRadius: 8, fontSize: 12, overflowX: 'auto', marginTop: 12 }}>
              {JSON.stringify(report, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}