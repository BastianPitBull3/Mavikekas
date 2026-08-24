/**
 * CatalogManagement.jsx
 * Gestión de catálogos de tacos y quesadillas.
 * Admin puede agregar, eliminar y activar/desactivar sabores en tiempo real.
 * Los tacos tienen opción de indicar si admiten queso o no.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

// ============================================================
// SUB-COMPONENTE: Editor de un catálogo individual
// ============================================================
function CatalogEditor({ type, label, emoji, items }) {
  const { addCatalogItem, removeCatalogItem, toggleCatalogItem } = useApp();

  const [newName,     setNewName]     = useState('');
  const [admiteQueso, setAdmiteQueso] = useState(true);
  const [error,       setError]       = useState('');

  const isTacos = type === 'tacos';

  const handleAdd = async () => {
    setError('');
    if (!newName.trim()) { setError('Escribe un nombre'); return; }
    const result = await addCatalogItem(type, newName, isTacos ? admiteQueso : true);
    if (!result.success) { setError(result.error); return; }
    setNewName('');
    setAdmiteQueso(true);
  };

  const activeCount   = items.filter((it) => it.activo).length;
  const inactiveCount = items.length - activeCount;

  return (
    <div className="card">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            {emoji} {label}
          </h3>
          <p className="text-xs text-gray-400">
            {activeCount} activos · {inactiveCount} inactivos
          </p>
        </div>
      </div>

      {/* Lista de items */}
      <div className="space-y-2 mb-4">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">
            No hay sabores registrados
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                item.activo
                  ? 'border-gray-100 bg-white'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              {/* Nombre + badges */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {emoji} {item.nombre}
                </span>
                <span className={item.activo ? 'badge-active' : 'badge-inactive'}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </span>
                {isTacos && item.admiteQueso === false && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    sin queso
                  </span>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle activo/inactivo */}
                <button
                  onClick={() => toggleCatalogItem(type, item.id)}
                  className={`
                    relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                    ${item.activo ? 'bg-green-400' : 'bg-gray-300'}
                  `}
                  title={item.activo ? 'Desactivar' : 'Activar'}
                >
                  <span
                    className={`
                      inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                      ${item.activo ? 'translate-x-4' : 'translate-x-0.5'}
                    `}
                  />
                </button>

                {/* Eliminar */}
                <button
                  onClick={() => removeCatalogItem(type, item.id)}
                  className="text-red-400 hover:text-red-600 transition-colors text-sm px-1"
                  title="Eliminar sabor"
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario para agregar */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Agregar nuevo sabor
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1 text-sm"
            placeholder={`Ej. ${isTacos ? 'Suadero' : 'Elote con crema'}`}
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="btn-admin px-4">
            Agregar
          </button>
        </div>

        {/* Checkbox "Admite queso" (solo tacos) */}
        {isTacos && (
          <label className="mt-2.5 flex items-center gap-2 cursor-pointer group w-fit">
            <input
              type="checkbox"
              checked={admiteQueso}
              onChange={(e) => setAdmiteQueso(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 rounded"
            />
            <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">
              🧀 Admite queso
            </span>
          </label>
        )}

        {error && (
          <p className="text-xs text-red-600 mt-1.5">{error}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function CatalogManagement() {
  const { state } = useApp();
  const { catalogs } = state;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900 mb-1">Gestión de Catálogos</h2>
        <p className="text-sm text-gray-500">
          Los cambios se reflejan en tiempo real para todos los usuarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CatalogEditor
          type="tacos"
          label="Menú de Tacos"
          emoji="🌮"
          items={catalogs.tacos}
        />
        <CatalogEditor
          type="quesadillas"
          label="Menú de Quesadillas"
          emoji="🧀"
          items={catalogs.quesadillas}
        />
      </div>
    </div>
  );
}
