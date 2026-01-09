"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { UserProvider, useUser } from './UserContext';
import { ActiveBUProvider } from './ActiveBUContext';
import { supabase } from '../../lib/supabaseClient';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Componente para mostrar el usuario y logout en el header
  // Menú de usuario con dropdown y logout
  const HeaderUser = () => {
    const { user, setUser } = useUser();
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const handleLogout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      setOpen(false);
      router.push('/login');
    };
    return (
      <div className="relative">
        <button
          className="bg-gray-800 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
          onClick={() => setOpen(o => !o)}
        >
          {user ? user.email.split('@')[0].toUpperCase() : ''} <span>▼</span>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded shadow z-50 border">
            <div className="p-4 text-sm text-gray-700">
              <div className="mb-2 font-semibold">Sesión activa</div>
              <div className="font-bold break-all">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-red-600 font-bold hover:bg-gray-100 border-t"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <UserProvider>
      <ActiveBUProvider>
        <div className="min-h-screen bg-gray-100">
          <header className="w-full flex items-center shadow bg-black" style={{ height: '64px' }}>
            <div className="bg-gray-800 text-white font-bold text-lg rounded-r flex items-center justify-center" style={{ width: '16rem', minWidth: '16rem', height: '64px' }}>MENU</div>
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-2xl font-bold text-center text-white">KLIMROD CFO</div>
            </div>
            <div className="flex items-center h-full pr-8">
              <HeaderUser />
            </div>
          </header>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </div>
      </ActiveBUProvider>
    </UserProvider>
  );
};

export default AppShell;