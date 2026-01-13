"use client";

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setError('Email o contraseña inválidos.');
      return;
    }
    if (data.user) {
      window.location.href = '/'; // Redirige al home
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ width: 400, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e2a78 60%, #2a3b8f 100%)', padding: '32px 0 16px 0', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, letterSpacing: 2 }}>KLIMROD CFO</div>
        </div>
        <div style={{ padding: '32px 32px 16px 32px' }}>
          <h1 style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center', marginBottom: 8 }}>Welcome</h1>
          <div style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24, fontSize: 15 }}>Sign in to your account</div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 14, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 14, color: '#374151', marginBottom: 4, display: 'block' }}>Contraseña</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 }}
                required
              />
            </div>
            {error && <div style={{ color: '#e11d48', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
            <button
              type="submit"
              style={{ width: '100%', padding: '12px 0', background: '#1e2a78', color: '#fff', fontWeight: 'bold', borderRadius: 8, fontSize: 16, border: 'none', cursor: 'pointer', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          {/* Registro eliminado por política interna */}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', padding: '8px 0 12px 0' }}>KlimRod CFO © 2025 • Sales Management System</div>
      </div>
    </div>
  );
}
