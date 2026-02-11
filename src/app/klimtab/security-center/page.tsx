"use client";
import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../../UserContext";
import { supabase } from "../../../../lib/supabaseClient";

// Estructura esperada de la tabla de empleados
// master_employees_directory: id, first_name, last_name, email, business_unit_id, business_unit_name, status

export default function KlimtabSecurityCenter() {
    // ...existing code...
    // Function to fetch all data (for reuse)
    const isEditing = useRef(false);
    const lastPwds = useRef<{ [key: string]: string }>({});
    const fetchAll = async () => {
      setLoading(true);
      const [
        { data: empData, error: empError },
        { data: buData, error: buError },
        { data: secData, error: secError }
      ] = await Promise.all([
        supabase
          .from("master_employees_directory")
          .select("id, first_name, last_name, email, business_unit_id, is_active"),
        supabase
          .from("master_business_units")
          .select("id, name"),
        supabase
          .from("klimtab_employees_security")
          .select("employee_id, business_unit_id, email, password_hash")
      ]);
      if (!empError && empData && !buError && buData) {
        const buMap: { [key: string]: string } = {};
        buData.forEach((bu) => { buMap[bu.id] = bu.name; });
        const employeesWithBU = empData.map((emp) => {
          const key = `${emp.email}__${emp.business_unit_id}`;
          const sec = secData?.find((s) => s.email === emp.email && s.business_unit_id === emp.business_unit_id);
          return {
            ...emp,
            business_unit_name: buMap[emp.business_unit_id] || "",
            password_hash: sec ? sec.password_hash : "",
          };
        });
        setEmployees(employeesWithBU);
        setBuList(buData);
        // Solo actualizar passwords si no está editando y si los datos realmente cambiaron
        if (!isEditing.current) {
          const pwds: { [key: string]: string } = {};
          employeesWithBU.forEach((emp) => {
            const key = `${emp.email}__${emp.business_unit_id}`;
            pwds[key] = emp.password_hash || "";
          });
          // Solo setear si hay diferencia real
          const prev = lastPwds.current;
          const changed = Object.keys(pwds).some(k => pwds[k] !== prev[k]);
          if (changed) {
            setPasswords(pwds);
            lastPwds.current = pwds;
          }
        }
      }
      setLoading(false);
    };
  const [employees, setEmployees] = useState<any[]>([]);
  const [passwords, setPasswords] = useState<{ [email: string]: string }>({});
  const [filters, setFilters] = useState({ bu: "", name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [buList, setBuList] = useState<any[]>([]);
  // Show/hide password per row (key: email + buId)
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  // Edit mode per row
  const [isEditingRow, setIsEditingRow] = useState<{ [key: string]: boolean }>({});
  // Notification state for in-app messages
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  // Get current user from context
  const { user } = useUser();

  // Load employees and BU list
  useEffect(() => {
    fetchAll();
    // Subscribe to realtime changes in klimtab_employees_security
    const channel = supabase
      .channel('public:klimtab_employees_security')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'klimtab_employees_security' }, payload => {
        fetchAll(); // Refresh data automatically
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // Group employees by email, but keep BU and ID for each
  const employeesFlat = employees.map(emp => ({
    bu: emp.business_unit_name,
    buId: emp.business_unit_id,
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    email: emp.email,
    is_active: emp.is_active,
  }));

  // Detect emails in more than one BU
  const emailCount: { [email: string]: number } = {};
  employeesFlat.forEach(emp => {
    if (emp.email) {
      emailCount[emp.email] = (emailCount[emp.email] || 0) + 1;
    }
  });

  // Filters
  const filtered = employeesFlat.filter((emp: any) => {
    const buMatch = !filters.bu || String(emp.buId) === String(filters.bu);
    const nameMatch = !filters.name || (emp.name || "").toLowerCase().includes(filters.name.toLowerCase());
    const emailMatch = !filters.email || (emp.email || "").toLowerCase().includes(filters.email.toLowerCase());
    return buMatch && nameMatch && emailMatch;
  });

  // Only show unique employees per BU selection (local variable, recalculated every render)
  const uniqueRows = (() => {
    const arr = [];
    const seenKeys = new Set();
    for (const emp of filtered) {
      const key = `${emp.email || emp.id}__${emp.buId}`;
      if (!seenKeys.has(key)) {
        arr.push(emp);
        seenKeys.add(key);
      }
    }
    return arr;
  })();

  // Edit password (sync for all BU with same email)
  // Cambiar el password para todos los BUs de un email
  const editTimeout = useRef<NodeJS.Timeout | null>(null);
  const handlePasswordChange = (key: string, value: string) => {
    isEditing.current = true;
    const [email] = key.split("__");
    setPasswords((prev) => {
      const updated = { ...prev };
      Object.keys(prev).forEach(k => {
        if (k.startsWith(email + "__")) {
          updated[k] = value;
        }
      });
      return updated;
    });
    if (editTimeout.current) clearTimeout(editTimeout.current);
    editTimeout.current = setTimeout(() => {
      isEditing.current = false;
    }, 2000);
  };
  // Toggle show/hide password per row
  const handleToggleShowPassword = (key: string) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Save password for a single employee/BU
  // Guardar el password para todos los BUs de un email
  const handleSaveRow = async (emp: any) => {
    setLoading(true);
    const [email] = (emp.email || "").split();
    const password = passwords[`${email}__${emp.buId}`] || "";

    if (!password) {
      setNotification({ type: 'error', message: "Password cannot be empty" });
      setLoading(false);
      return;
    }

    try {
      // 1. Sync with Supabase Auth via API
      const response = await fetch('/api/manage-employee-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const apiData = await response.json();

      if (!response.ok) {
        throw new Error(apiData.error || 'Failed to sync with Auth');
      }

      // 2. Find all BUs for this email (across all employees, not just filtered/visible)
      const allEmpWithEmail = employeesFlat.filter(e => e.email === email);
      
      // Actualiza todas las BUs para este email
      const results = await Promise.all(
        allEmpWithEmail.map(e =>
          supabase.from("klimtab_employees_security").upsert(
            {
              employee_id: e.id,
              business_unit_id: e.buId,
              email: e.email,
              password_hash: password,
              created_by: user?.id ?? null,
              platform_id: 1,
            },
            { onConflict: "employee_id,business_unit_id" }
          )
        )
      );
      const error = results.find(r => r.error);
      if (error) {
        setNotification({ type: 'error', message: "Error saving password locally: " + (error.error?.message || "Unknown error") });
      } else {
        // Check if this was a creation or update (if previous password_hash was empty)
        const wasCreated = allEmpWithEmail.some(e => !("password_hash" in e) || !e.password_hash);
        setNotification({
          type: 'success',
          message: wasCreated ? 'Auth User & Password successfully updated.' : 'Auth User & Password successfully updated.'
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: "Auth Error: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {notification && (
        <div className={`mb-4 px-4 py-3 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-left">KLIMTAB SECURITY CENTER</h1>
      <div className="flex gap-4 mb-6">
        <select
          className="border rounded px-3 py-2 w-48"
          value={filters.bu}
          onChange={e => setFilters(f => ({ ...f, bu: e.target.value }))}
        >
          <option value="">All Business Units</option>
          {buList.map((bu: any) => (
            <option key={bu.id} value={bu.id}>{bu.name}</option>
          ))}
        </select>
        <input
          className="border rounded px-3 py-2 w-48"
          placeholder="Filter by name..."
          value={filters.name}
          onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="border rounded px-3 py-2 w-64"
          placeholder="Filter by email..."
          value={filters.email}
          onChange={e => setFilters(f => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Business Unit</th>
              <th className="px-2 py-1 text-left">Employee ID</th>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Email</th>
              <th className="px-2 py-1 text-left">Password</th>
              <th className="px-2 py-1 text-left">Status</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueRows.map((emp: any, idx: number) => {
              const key = `${emp.email || emp.id}__${emp.buId}`;
              const isMultiBU = emailCount[emp.email] > 1;
              // Find all BUs for this email except the current one
              const otherBUs = employeesFlat.filter(e => e.email === emp.email && e.buId !== emp.buId);
              return (
                <React.Fragment key={key}>
                  <tr className="border-b">
                    <td className="px-2 py-1">{emp.bu}</td>
                    <td className="px-2 py-1 font-mono">{emp.id}</td>
                    <td className="px-2 py-1">{emp.name}</td>
                    <td className="px-2 py-1 font-mono">
                      {emp.email}
                      {isMultiBU && (
                        <span className="ml-2 inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold align-middle" title="This email is associated with multiple business units">
                          Multi-BU
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1 flex items-center gap-2">
                      <input
                        type={showPassword[key] ? "text" : "password"}
                        className={`border rounded px-2 py-1 w-32 ${isEditingRow[key] ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                        value={passwords[key] || ""}
                        onChange={e => isEditingRow[key] && handlePasswordChange(key, e.target.value)}
                        disabled={!isEditingRow[key]}
                        ref={el => {
                          if (el && isEditingRow[key]) {
                            el.focus();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="text-xs px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                        onClick={() => handleToggleShowPassword(key)}
                      >
                        {showPassword[key] ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 border rounded ${isEditingRow[key] ? 'bg-blue-200' : 'bg-blue-100'} hover:bg-blue-300`}
                        onClick={() => setIsEditingRow(prev => {
                          const next = { ...prev, [key]: !prev[key] };
                          return next;
                        })}
                      >
                        {isEditingRow[key] ? 'Cancel' : 'Edit'}
                      </button>
                    </td>
                    <td className="px-2 py-1">
                      <span className={emp.is_active ? "text-green-700 font-bold" : "text-gray-500"}>
                        {emp.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      {emp.password_hash && isEditingRow[key] && (
                        <button
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-xs font-bold"
                          onClick={() => {
                            setIsEditingRow(prev => ({ ...prev, [key]: false }));
                            handleSaveRow(emp);
                          }}
                          disabled={loading}
                        >
                          SAVE PASSWORD
                        </button>
                      )}
                      {!isEditingRow[key] && emp.password_hash && (
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold"
                          onClick={() => handleSaveRow(emp)}
                          disabled={loading}
                        >
                          SAVE CHANGES
                        </button>
                      )}
                      {!emp.password_hash && (
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold"
                          onClick={() => handleSaveRow(emp)}
                          disabled={loading}
                        >
                          GRANT ACCESS
                        </button>
                      )}
                    </td>
                  </tr>
                  {isMultiBU && otherBUs.length > 0 && (
                    <tr className="bg-yellow-50">
                      <td colSpan={7} className="px-2 py-2 text-xs text-yellow-900">
                        <div className="font-semibold mb-1">Other business units associated with this email:</div>
                        <ul className="list-disc ml-6">
                          {otherBUs.map((obu, i) => (
                            <li key={obu.buId + '_' + i}>
                              <span className="font-bold">BU:</span> {obu.bu} &nbsp;|&nbsp; <span className="font-bold">ID:</span> {obu.id} &nbsp;|&nbsp; <span className="font-bold">Name:</span> {obu.name} &nbsp;|&nbsp; <span className="font-bold">Status:</span> {obu.is_active ? "ACTIVE" : "INACTIVE"}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded shadow">Loading...</div>
        </div>
      )}
    </div>
  );
}
