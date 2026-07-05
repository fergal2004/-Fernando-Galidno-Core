import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workload from './pages/Workload';
import Teams from './pages/Teams';
import Users from './pages/Users';
import Projects from './pages/Projects';
import Report from './pages/Report';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
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
          <ProtectedRoute session={session} loading={loading}>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/workload" element={
          <ProtectedRoute session={session} loading={loading}>
            <Layout><Workload /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/teams" element={
          <ProtectedRoute session={session} loading={loading}>
            <Layout><Teams /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute session={session} loading={loading}>
            <Layout><Users /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute session={session} loading={loading}>
            <Layout><Projects /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute session={session} loading={loading}>
            <Layout><Report /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;