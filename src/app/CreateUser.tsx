"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const CreateUser: React.FC = () => {
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const [businessUnits, setBusinessUnits] = useState<{ id: string, name: string }[]>([]);
  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase.from('master_roles').select('id, name');
      if (!error && data) setRoles(data);
    };
    const fetchBusinessUnits = async () => {
      const { data, error } = await supabase.from('master_business_units').select('id, name');
      if (!error && data) setBusinessUnits(data);
    };
    fetchRoles();
    fetchBusinessUnits();
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUnitChange = (unit: string) => {
    setSelectedUnits(prev =>
      prev.includes(unit)
        ? prev.filter(u => u !== unit)
        : [...prev, unit]
    );
  };

  const handleRoleChange = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // 1. Registrar usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
    });
    if (authError) {
      setError(authError.message);
      return;
    }
    const userId = data.user?.id;
    if (!userId) {
      setError('No se pudo crear el usuario.');
      return;
    }
    // 2. Guardar datos adicionales en master_users
    const { error: dbError } = await supabase.from('master_users').insert([
      {
        id: userId,
        first_name: firstName.toUpperCase(),
        second_name: secondName.toUpperCase(),
        last_name: lastName.toUpperCase(),
        // name: `${firstName.toUpperCase()} ${lastName.toUpperCase()}`,
        email: email.toUpperCase(),
        status: 'ACTIVE',
      },
    ]);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    // 3. Asignar roles (varios)
    for (const role of selectedRoles) {
      const { data: roleData } = await supabase
        .from('master_roles')
        .select('id')
        .eq('name', role.toUpperCase())
        .single();
      if (roleData) {
        await supabase.from('master_user_roles').insert([
          {
            user_id: userId,
            role_id: roleData.id,
          },
        ]);
      }
    }
    // 4. Asignar business units
    for (const bu of selectedUnits) {
      const { data: buData } = await supabase
        .from('master_business_units')
        .select('id')
        .eq('name', bu.toUpperCase())
        .single();
      if (buData) {
        await supabase.from('master_user_business_units').insert([
          {
            user_id: userId,
            business_unit_id: buData.id,
          },
        ]);
      }
    }
    setSuccess('Usuario creado correctamente.');
    setEmail('');
    setPassword('');
    setFirstName('');
    setSecondName('');
    setSelectedUnits([]);
    setSelectedRoles([]);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Crear Usuario</h2>
      <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={e => setFirstName(e.target.value.toUpperCase())}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Second Name"
            value={secondName}
            onChange={e => setSecondName(e.target.value.toUpperCase())}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={e => setLastName(e.target.value.toUpperCase())}
            className="w-full p-2 mb-4 border rounded"
            required
          />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <div className="mb-4">
          <label className="block font-semibold mb-2">Role:</label>
          <select
            className="w-full border rounded p-2"
            value={selectedRoles[0] || ''}
            onChange={e => setSelectedRoles(e.target.value ? [e.target.value] : [])}
            required
          >
            <option value="">Selecciona un rol</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2">Business Units:</label>
          {businessUnits.length === 0 && <div className="text-gray-500">No hay unidades disponibles.</div>}
          {businessUnits.map(bu => (
            <label key={bu.id} className="block">
              <input
                type="checkbox"
                checked={selectedUnits.includes(bu.name)}
                onChange={() => handleUnitChange(bu.name)}
                className="mr-2"
              />
              {bu.name}
            </label>
          ))}
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded font-bold">Crear Usuario</button>
      </form>
    </div>
  );
};

export default CreateUser;
