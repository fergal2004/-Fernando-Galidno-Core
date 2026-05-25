import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ session, loading, children }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#2B579A', fontSize: 18 }}>
        Cargando...
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" />;
  }
  return children;
}
