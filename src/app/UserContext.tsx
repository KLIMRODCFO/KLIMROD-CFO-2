"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export type UserRole =
  | 'HR'
  | 'MANAGER'
  | 'CHEF'
  | 'SOMMELIER'
  | 'ADMINISTRATION'
  | 'ACCOUNTING'
  | 'DEVELOPER'
  | 'OWNER'
  | 'INVESTOR'
  | 'SUPER ADMIN';

export type BusinessUnit =
  | 'TUCCI'
  | "DELMONICO'S"
  | 'SEI LESS'
  | 'HARBOR NYC';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  businessUnits: BusinessUnit[];
  permissions: string[];
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const userId = authData.user.id;
        // Obtener roles del usuario
        const { data: userRoles } = await supabase
          .from('master_user_roles')
          .select('role_id, master_roles(name)')
          .eq('user_id', userId);
        // Obtener business units asignados
        const { data: userBusinessUnits } = await supabase
          .from('master_user_business_units')
          .select('business_unit_id, master_business_units(name)')
          .eq('user_id', userId);
        // Obtener módulos permitidos para el rol principal
        const mainRoleId = userRoles?.[0]?.role_id;
        const { data: allowedModules } = await supabase
          .from('master_role_modules')
          .select('module_id, master_modules(name)')
          .eq('role_id', mainRoleId)
          .eq('access', true);

        // Tipar correctamente los datos recibidos
        type UserRoleData = { role_id: string; master_roles: { name: string } };
        type UserBusinessUnitData = { business_unit_id: string; master_business_units: { name: string } };
        type AllowedModuleData = { module_id: string; master_modules: { name: string } };

        const userRoleArr = (userRoles ?? []) as UserRoleData[];
        const userBusinessUnitArr = (userBusinessUnits ?? []) as UserBusinessUnitData[];
        const allowedModulesArr = (allowedModules ?? []) as AllowedModuleData[];

        setUser({
          id: userId,
          email: authData.user.email ?? '',
          role: userRoleArr[0]?.master_roles?.name || 'USER',
          businessUnits: userBusinessUnitArr.map(bu => bu.master_business_units.name) || [],
          permissions: allowedModulesArr.map(m => m.master_modules.name) || [],
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
