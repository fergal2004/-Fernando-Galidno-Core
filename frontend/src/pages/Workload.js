import { useState, useEffect, useCallback } from 'react';
import {
  startOfWeek, addDays, addWeeks, subWeeks,
  format, isSameDay, parseISO, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../api';

const PRIORITY_COLORS = {
  high:   { bg: '#FDECEA', border: '#F44336', text: '#c0392b' },
  medium: { bg: '#FFF3E0', border: '#FF9800', text: '#e65100' },
  low:    { bg: '#E8F5E9', border: '#4CAF50', text: '#2e7d32' },
};
const LOAD_COLORS  = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };
const LOAD_LABELS  = { low: 'Baja', medium: 'Media', high: 'Alta' };
const STATUS_LABELS = {
  pending:     'Pendiente',
  in_progress: 'En progreso',
  completed:   'Completado',
};
const THEME = '#2B579A';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ─── Helpers de estilo ───────────────────────────────────────────────────────
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444' };
const inputStyle = { padding: '8px 10px', border: '1px solid #ccd0da', borderRadius: 6, fontSize: 14 };

// ─── Componente principal ────────────────────────────────────────────────────
export default function Workload() {
  const [teams,       setTeams]       = useState([]);
  const [filterTeam,  setFilterTeam]  = useState('');
  const [weekStart,   setWeekStart]   = useState(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [members,     setMembers]     = useState([]);
  const [tasks,       setTasks]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Cargar lista de equipos al montar
  useEffect(() => {
    api.get('/teams').then(({ data }) => setTeams(data)).catch(() => {});
  }, []);

  const fetchData = useCallback(async (teamId, weekStartDate) => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    const start = format(weekStartDate,            'yyyy-MM-dd');
    const end   = format(addDays(weekStartDate, 6), 'yyyy-MM-dd');
    try {
      const [workloadRes, tasksRes] = await Promise.all([
        api.get('/workload', { params: { team_id: teamId, start_date: start, end_date: end } }),
        api.get('/tasks',    { params: { team_id: teamId, start_date: start, end_date: end } }),
      ]);
      setSummary(workloadRes.data.summary);
      setMembers(workloadRes.data.members ?? []);
      setTasks(tasksRes.data ?? []);
    } catch {
      setError('Error al cargar los datos. Intenta de nuevo.');
      setSummary(null);
      setMembers([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetcha al cambiar equipo o semana
  useEffect(() => {
    if (filterTeam) fetchData(filterTeam, weekStart);
  }, [filterTeam, weekStart, fetchData]);

  const prevWeek = () => setWeekStart(w => subWeeks(w, 1));
  const nextWeek = () => setWeekStart(w => addWeeks(w, 1));
  const goToday  = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksForCell = (memberId, day) =>
    tasks.filter(t =>
      t.assigned_to === memberId &&
      t.due_date &&
      isSameDay(parseISO(t.due_date), day),
    );

  const weekLabel =
    format(weekStart, 'd MMM', { locale: es }) +
    ' – ' +
    format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es });

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 20px' }}>
      <h2 style={{ color: THEME, marginBottom: 20 }}>Carga de Trabajo</h2>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#f5f7fb', border: '1px solid #dde3f0',
        borderRadius: 8, padding: '16px 20px', marginBottom: 20,
        display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Equipo *</label>
          <select
            value={filterTeam}
            onChange={e => setFilterTeam(e.target.value)}
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          >
            <option value="">-- Selecciona un equipo --</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Navegación de semana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <NavButton onClick={prevWeek} label="←" />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#333', minWidth: 160, textAlign: 'center' }}>
            {weekLabel}
          </span>
          <NavButton onClick={nextWeek} label="→" />
          <NavButton onClick={goToday} label="Hoy" primary />
          {loading && (
            <span style={{ fontSize: 13, color: '#888', marginLeft: 6 }}>Cargando…</span>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#fff0f0', border: '1px solid #F44336',
          color: '#c0392b', padding: '10px 14px', borderRadius: 6, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* ── Estado vacío ────────────────────────────────────────────────── */}
      {!filterTeam && !summary && (
        <div style={{ textAlign: 'center', color: '#888', padding: 48, fontSize: 16 }}>
          Selecciona un equipo para ver la carga de trabajo
        </div>
      )}

      {summary && (
        <>
          {/* ── Tarjetas resumen ──────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <SummaryCard label="Total Tareas"       value={summary.total_tasks ?? '-'} />
            <SummaryCard label="Horas Totales"      value={`${summary.total_hours ?? '-'} hrs`} />
            <SummaryCard label="Promedio por Persona" value={`${summary.average_hours ?? '-'} hrs`} />
          </div>

          {/* ── Calendario por recurso ────────────────────────────────── */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '200px repeat(7, 1fr)',
              border: '1px solid #dde3f0',
              borderRadius: 8,
              overflow: 'hidden',
              minWidth: 700,
            }}>
              {/* Header: celda vacía + 7 días */}
              <div style={headerCellStyle(false)}>
                <span style={{ fontSize: 12, color: '#aaa' }}>Miembro</span>
              </div>
              {weekDays.map((day, i) => {
                const today = isToday(day);
                return (
                  <div key={i} style={headerCellStyle(today)}>
                    <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75 }}>
                      {DAY_NAMES[i]}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {format(day, 'd', { locale: es })}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>
                      {format(day, 'MMM', { locale: es })}
                    </div>
                  </div>
                );
              })}

              {/* Filas de miembros */}
              {members.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: 32,
                  textAlign: 'center',
                  color: '#888',
                  fontSize: 14,
                }}>
                  No hay miembros en este equipo.
                </div>
              )}
              {members.map((m, rowIdx) => (
                <MemberRow
                  key={m.id ?? rowIdx}
                  member={m}
                  weekDays={weekDays}
                  tasksForCell={tasksForCell}
                  onTaskClick={setSelectedTask}
                  isEven={rowIdx % 2 === 0}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Modal de detalle ─────────────────────────────────────────── */}
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

// ─── Fila de miembro en el grid ──────────────────────────────────────────────
function MemberRow({ member, weekDays, tasksForCell, onTaskClick, isEven }) {
  const rowBg = isEven ? '#fff' : '#fafbfd';
  const cellBase = {
    borderTop: '1px solid #e8ecf4',
    borderRight: '1px solid #e8ecf4',
    padding: 8,
    background: rowBg,
    minHeight: 64,
    verticalAlign: 'top',
  };

  return (
    <>
      {/* Celda de nombre */}
      <div style={{ ...cellBase, borderRight: '2px solid #dde3f0', padding: '10px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#222', marginBottom: 4 }}>
          {member.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: LOAD_COLORS[member.workload_level] || '#999',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 8px',
            borderRadius: 10,
          }}>
            {LOAD_LABELS[member.workload_level] || member.workload_level}
          </span>
          <span style={{ fontSize: 11, color: '#888' }}>
            {member.assigned_hours} hrs
          </span>
        </div>
      </div>

      {/* Celdas de días */}
      {weekDays.map((day, i) => {
        const cellTasks = tasksForCell(member.id, day);
        const todayHighlight = isToday(day);
        return (
          <div
            key={i}
            style={{
              ...cellBase,
              background: todayHighlight ? '#F0F7FF' : rowBg,
            }}
          >
            {cellTasks.map(t => (
              <TaskChip key={t.id} task={t} onClick={onTaskClick} />
            ))}
          </div>
        );
      })}
    </>
  );
}

// ─── Chip de tarea ───────────────────────────────────────────────────────────
function TaskChip({ task, onClick }) {
  const colors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
  const title  = task.title.length > 18 ? task.title.slice(0, 18) + '…' : task.title;
  return (
    <div
      onClick={() => onClick(task)}
      title={task.title}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: 3,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {title}
    </div>
  );
}

// ─── Modal de detalle de tarea ───────────────────────────────────────────────
function TaskModal({ task, onClose }) {
  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
  const dueDateStr = task.due_date
    ? format(parseISO(task.due_date), "d 'de' MMMM yyyy", { locale: es })
    : '—';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 10,
          padding: 28,
          width: 380,
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
      >
        {/* Cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 14,
            background: 'none', border: 'none',
            fontSize: 20, cursor: 'pointer', color: '#888',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <h3 style={{ margin: '0 0 18px', color: THEME, fontSize: 17, paddingRight: 24 }}>
          {task.title}
        </h3>

        <ModalRow label="Estado">
          <span>{STATUS_LABELS[task.status] || task.status}</span>
        </ModalRow>

        <ModalRow label="Prioridad">
          <span style={{
            background: priority.bg,
            color: priority.text,
            border: `1px solid ${priority.border}`,
            borderRadius: 4,
            padding: '1px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
          </span>
        </ModalRow>

        <ModalRow label="Horas estimadas">
          <span>{task.estimated_hours} hrs</span>
        </ModalRow>

        <ModalRow label="Fecha límite">
          <span>{dueDateStr}</span>
        </ModalRow>

        {task.description && (
          <ModalRow label="Descripción">
            <span style={{ color: '#555', fontSize: 13 }}>{task.description}</span>
          </ModalRow>
        )}
      </div>
    </div>
  );
}

// ─── Sub-componentes auxiliares ──────────────────────────────────────────────
function SummaryCard({ label, value }) {
  return (
    <div style={{
      flex: 1,
      background: '#F0F7FF',
      border: `1px solid ${THEME}`,
      borderRadius: 8,
      padding: 20,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, color: THEME, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1a3a6b' }}>{value}</div>
    </div>
  );
}

function NavButton({ onClick, label, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: primary ? THEME : '#f0f4fa',
        color: primary ? '#fff' : '#333',
        border: `1px solid ${primary ? THEME : '#ccd0da'}`,
        borderRadius: 6,
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

function ModalRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#888', minWidth: 110 }}>{label}</span>
      <div style={{ fontSize: 14, color: '#222' }}>{children}</div>
    </div>
  );
}

function headerCellStyle(isHighlighted) {
  return {
    background: isHighlighted ? THEME : '#2B579A',
    color: '#fff',
    padding: '10px 8px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.15)',
    opacity: isHighlighted ? 1 : 0.88,
  };
}
