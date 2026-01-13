"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from './UserContext';
import { useActiveBU } from './ActiveBUContext';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser } = useUser();
  const { activeBU, setActiveBU } = useActiveBU();
  React.useEffect(() => {
    if (!activeBU && user && user.businessUnits && user.businessUnits.length > 0) {
      setActiveBU(user.businessUnits[0]);
    }
  }, [activeBU, user, setActiveBU]);

  // HeaderUser debe estar aquí dentro para acceder a user y setUser
  const HeaderUser = () => {
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
  );
};

export default AppShell;