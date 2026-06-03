import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const NAV_LINKS = [
  ['Tareas', '/'],
  ['Proyectos', '/projects'],
  ['Carga de Trabajo', '/workload'],
  ['Equipos', '/teams'],
  ['Usuarios', '/users'],
];

export default function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      <nav style={{
        background: '#2B579A',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {NAV_LINKS.map(([label, to]) => (
            <Link
              key={to}
              to={to}
              style={{
                color: '#fff',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 14,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.55)',
            color: '#fff',
            padding: '5px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Cerrar Sesión
        </button>
      </nav>
      <div>{children}</div>
    </>
  );
}
