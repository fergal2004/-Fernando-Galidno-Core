import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workload from './pages/Workload';
import Teams from './pages/Teams';
import Users from './pages/Users';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute session={session}>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/workload" element={
          <ProtectedRoute session={session}>
            <Layout><Workload /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/teams" element={
          <ProtectedRoute session={session}>
            <Layout><Teams /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute session={session}>
            <Layout><Users /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;