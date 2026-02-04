"use client";

// Capitalize first letter, rest lowercase (for display)
function formatDisplayName(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

// Utilidad para generar code automático a partir del nombre
function generateCode(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const TABLES = [
  {
    key: "apps",
    label: "Apps",
    table: "master_klimtab_apps",
    fields: [
      { key: "app_name", label: "Nombre", type: "text", required: true },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "is_active", label: "Activo", type: "boolean" },
    ],
    codeField: "app_code",
    nameField: "app_name",
  },
  {
    key: "modules",
    label: "Modules",
    table: "master_klimtab_modules",
    fields: [
      { key: "app_id", label: "App", type: "select", relation: "master_klimtab_apps", optionLabel: "app_name" },
      { key: "module_name", label: "Nombre", type: "text", required: true },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "is_active", label: "Activo", type: "boolean" },
    ],
    codeField: "module_code",
    nameField: "module_name",
  },
  {
    key: "submodules",
    label: "Submodules",
    table: "master_klimtab_submodules",
    fields: [
      { key: "module_id", label: "Module", type: "select", relation: "master_klimtab_modules", optionLabel: "module_name" },
      { key: "submodule_name", label: "Nombre", type: "text", required: true },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "is_active", label: "Activo", type: "boolean" },
    ],
    codeField: "submodule_code",
    nameField: "submodule_name",
  },
];

export default function KlimtabSettingsPage() {
  const [activeTab, setActiveTab] = useState("apps");
  const [data, setData] = useState<any>({});
  const [relations, setRelations] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; tableKey: string; record?: any }>({ open: false, tableKey: "", record: undefined });
  const [form, setForm] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; tableKey: string; id: number | null }>({ open: false, tableKey: "", id: null });
  const [deleteCode, setDeleteCode] = useState("");

  // Cargar datos y relaciones (reutilizable)
  const fetchAll = async () => {
    setLoading(true);
    const newData: any = {};
    const newRelations: any = {};
    for (const t of TABLES) {
      const { data: tableData } = await supabase.from(t.table).select("*");
      newData[t.key] = tableData || [];
      // Cargar relaciones para selects
      for (const f of t.fields) {
        if (f.type === "select" && f.relation) {
          if (!newRelations[f.relation]) {
            let selectFields = "id, " + (f.optionLabel || "name");
            // Para modules, necesitamos también app_id para la relación hacia apps
            if (f.relation === "master_klimtab_modules") {
              selectFields += ", app_id";
            }
            const { data: relData } = await supabase.from(f.relation).select(selectFields);
            newRelations[f.relation] = relData || [];
          }
        }
      }
    }
    setData(newData);
    setRelations(newRelations);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Abrir modal para crear/editar
  const openModal = (tableKey: string, record?: any) => {
    setForm(record ? { ...record } : {});
    setModal({ open: true, tableKey, record });
  };
  const closeModal = () => {
    setModal({ open: false, tableKey: "", record: undefined });
    setForm({});
  };

  // Guardar registro (crear o editar)
  const handleSave = async () => {
    const t = TABLES.find(x => x.key === modal.tableKey)!;
    const isEdit = !!modal.record;
    // Generar code automáticamente
    const code = generateCode(form[t.nameField] || "");
    // Normalizar nombres antes de guardar
    let normalizedForm = { ...form };
    if (t.key === "apps") {
      if (normalizedForm.app_name) {
        normalizedForm.app_name = normalizedForm.app_name.toUpperCase();
      }
      if (normalizedForm.app_code) {
        normalizedForm.app_code = normalizedForm.app_code.toUpperCase();
      }
      if (normalizedForm.description) {
        normalizedForm.description = normalizedForm.description.toLowerCase();
      }
    }
    if (t.key === "modules" && normalizedForm.module_name) {
      normalizedForm.module_name = formatDisplayName(normalizedForm.module_name);
    }
    if (t.key === "submodules" && normalizedForm.submodule_name) {
      normalizedForm.submodule_name = formatDisplayName(normalizedForm.submodule_name);
    }
    const payload = { ...normalizedForm, [t.codeField]: code };
    setLoading(true);
    if (isEdit) {
      await supabase.from(t.table).update(payload).eq("id", modal.record.id);
    } else {
      await supabase.from(t.table).insert([payload]);
    }
    // Refrescar todos los datos y relaciones para actualizar dropdowns
    await fetchAll();
    setLoading(false);
    closeModal();
  };

  // Eliminar registro
  // Mostrar modal de confirmación antes de borrar
  const requestDelete = (tableKey: string, id: number) => {
    setDeleteConfirm({ open: true, tableKey, id });
    setDeleteCode("");
  };

  // Confirmar y ejecutar el borrado
  const handleDelete = async () => {
    if (deleteCode !== "1991" || !deleteConfirm.id) return;
    const t = TABLES.find(x => x.key === deleteConfirm.tableKey)!;
    setLoading(true);
    await supabase.from(t.table).delete().eq("id", deleteConfirm.id);
    await fetchAll();
    setLoading(false);
    setDeleteConfirm({ open: false, tableKey: "", id: null });
    setDeleteCode("");
  };

  // Render
  const t = TABLES.find(x => x.key === activeTab)!;
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">KLIMTAB Settings</h1>
      <div className="flex gap-4 mb-6">
        {TABLES.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-xl font-bold ${activeTab === tab.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">{t.label}</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold" onClick={() => openModal(t.key)}>Agregar {t.label.slice(0, -1)}</button>
        </div>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr>
              <th className="px-2 py-1">ID</th>
              {activeTab === 'modules' && <th className="px-2 py-1 text-left">App</th>}
              {activeTab === 'submodules' && <>
                <th className="px-2 py-1 text-left">App</th>
                <th className="px-2 py-1 text-left">Module</th>
                <th className="px-2 py-1 text-left">Submodule</th>
              </>}
              {t.fields.map(f => {
                // Hide app_id in modules
                if (activeTab === 'modules' && f.key === 'app_id') return null;
                // In submodules, skip module_id and submodule_name, as we show them custom
                if (activeTab === 'submodules' && (f.key === 'module_id' || f.key === 'submodule_name')) return null;
                if (activeTab === 'apps') {
                  if (f.key === 'app_name') return <th key={f.key} className="px-2 py-1 text-left">App</th>;
                  if (f.key === 'is_active') return <th key={f.key} className="px-2 py-1 text-left">Active</th>;
                  return <th key={f.key} className="px-2 py-1 text-left">{f.label === 'Descripción' ? 'Description' : f.label}</th>;
                }
                if (activeTab === 'modules') {
                  if (f.key === 'module_name' || f.label === 'Name') return <th key={f.key} className="px-2 py-1 text-left">Module</th>;
                }
                if (f.key === 'is_active') return <th key={f.key} className="px-2 py-1 text-left">Active</th>;
                if (f.key === 'description' || f.label === 'Descripción') return <th key={f.key} className="px-2 py-1 text-left">Description</th>;
                return <th key={f.key} className="px-2 py-1 text-left">{f.label}</th>;
              })}
              <th className="px-2 py-1 text-left">Active</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data[t.key] || []).map((row: any) => {
              // Para modules y submodules, buscar el nombre del app relacionado
              let appName = '';
              if (activeTab === 'modules') {
                const app = relations['master_klimtab_apps']?.find((a: any) => a.id === row.app_id);
                appName = app?.app_name || '';
              } else if (activeTab === 'submodules') {
                const module = relations['master_klimtab_modules']?.find((m: any) => m.id === row.module_id);
                if (module) {
                  const app = relations['master_klimtab_apps']?.find((a: any) => a.id === module.app_id);
                  appName = app?.app_name || '';
                }
              }
              return (
                <tr key={row.id} className="border-b">
                  <td className="px-2 py-1 text-left">{row.id}</td>
                  {activeTab === 'modules' && <td className="px-2 py-1 text-left">{formatDisplayName(appName)}</td>}
                  {activeTab === 'submodules' && <>
                    <td className="px-2 py-1 text-left">{
                      (() => {
                        const module = relations['master_klimtab_modules']?.find((m: any) => m.id === row.module_id);
                        if (!module) return 'N/A';
                        const app = relations['master_klimtab_apps']?.find((a: any) => a.id === module.app_id);
                        return formatDisplayName(app?.app_name || 'N/A');
                      })()
                    }</td>
                    <td className="px-2 py-1 text-left">{
                      (() => {
                        const module = relations['master_klimtab_modules']?.find((m: any) => m.id === row.module_id);
                        return formatDisplayName(module?.module_name || 'N/A');
                      })()
                    }</td>
                    <td className="px-2 py-1 text-left">{formatDisplayName(row.submodule_name || 'N/A')}</td>
                  </>}
                  {t.fields.map(f => {
                    if (activeTab === 'modules' && f.key === 'app_id') return null;
                    if (activeTab === 'submodules' && (f.key === 'module_id' || f.key === 'submodule_name')) return null;
                    let value = f.type === "select" && f.relation && relations[f.relation]
                      ? (relations[f.relation].find((r: any) => r.id === row[f.key])?.[f.optionLabel] || row[f.key])
                      : row[f.key]?.toString();
                    if (activeTab === 'modules' && f.key === 'module_name') {
                      value = formatDisplayName(value);
                    }
                    if (activeTab === 'apps' && f.key === 'app_name') {
                      value = value?.toUpperCase();
                    }
                    if ((activeTab === 'apps' || activeTab === 'modules' || activeTab === 'submodules') && f.key === 'description') {
                      value = value?.toLowerCase();
                    }
                    return (
                      <td key={f.key} className="px-2 py-1 text-left">{value}</td>
                    );
                  })}
                  <td className="px-2 py-1 text-left">
                    <input type="checkbox" checked={!!row.is_active} readOnly />
                  </td>
                  <td className="px-2 py-1 text-left flex gap-2">
                    <button className="text-blue-600" onClick={() => openModal(t.key, row)}>Editar</button>
                    <button className="text-red-600" onClick={() => requestDelete(t.key, row.id)}>Eliminar</button>
                  </td>
                      {/* Delete confirmation modal */}
                      {deleteConfirm.open && (
                        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[350px] max-w-[90vw]">
                            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
                              <p className="mb-4">Insert code to delete</p>
                            <input
                              className="border rounded px-2 py-1 w-full mb-4"
                              type="text"
                              placeholder="Enter code..."
                              value={deleteCode}
                              onChange={e => setDeleteCode(e.target.value)}
                            />
                            <div className="flex gap-4 mt-2">
                              <button
                                className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold"
                                disabled={deleteCode !== "1991"}
                                onClick={handleDelete}
                              >Confirm</button>
                              <button
                                className="bg-gray-200 text-neutral-700 px-4 py-2 rounded-xl font-bold"
                                onClick={() => setDeleteConfirm({ open: false, tableKey: "", id: null })}
                              >Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[350px] max-w-[90vw]">
            <h3 className="text-lg font-bold mb-4">{modal.record ? "Editar" : "Agregar"} {t.label.slice(0, -1)}</h3>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              {t.fields.map(f => (
                <div key={f.key} className="mb-3">
                  <label className="block text-xs font-bold mb-1">{f.label}</label>
                  {f.type === "text" && (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={form[f.key] || ""}
                      onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                      required={!!f.required}
                    />
                  )}
                  {f.type === "textarea" && (
                    <textarea
                      className="border rounded px-2 py-1 w-full"
                      value={form[f.key] || ""}
                      onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  )}
                  {f.type === "boolean" && (
                    <input
                      type="checkbox"
                      checked={!!form[f.key]}
                      onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: e.target.checked }))}
                    />
                  )}
                  {f.type === "select" && (
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={form[f.key] || ""}
                      onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                      required
                    >
                      <option value="">Selecciona...</option>
                      {(f.relation && relations[f.relation] ? relations[f.relation] : []).map((opt: any) => (
                        <option key={opt.id} value={opt.id}>{f.optionLabel ? opt[f.optionLabel] : opt.id}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              <div className="flex gap-4 mt-4">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold">Guardar</button>
                <button type="button" className="bg-gray-200 text-neutral-700 px-4 py-2 rounded-xl font-bold" onClick={closeModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading && <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"><div className="bg-white px-6 py-4 rounded shadow">Cargando...</div></div>}
    </div>
  );
}
