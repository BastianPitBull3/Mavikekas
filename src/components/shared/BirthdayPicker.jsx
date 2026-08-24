/**
 * BirthdayPicker.jsx
 * Selector de día y mes de cumpleaños (sin año — el año no importa para
 * la lógica de la app, solo se usa un año fijo internamente para poder
 * seguir guardando la fecha como 'YYYY-MM-DD' sin tocar el resto del
 * sistema). Se usa al crear un usuario (admin o auto-registro), en el
 * modal post-pedido, y para editar el cumpleaños ya guardado.
 */
import React from 'react';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Año fijo interno (2000 es bisiesto, así que el 29 de febrero es válido)
const FIXED_YEAR = '2000';
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Construye 'YYYY-MM-DD' a partir de día/mes; null si falta alguno */
export const buildBirthdayDate = (day, month) => {
  if (!day || !month) return null;
  return `${FIXED_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** Extrae {day, month} (strings) desde 'YYYY-MM-DD'; vacíos si no hay fecha */
export const parseBirthdayDate = (dateStr) => {
  if (!dateStr) return { day: '', month: '' };
  const [, month, day] = dateStr.split('-');
  return { day: String(Number(day)), month: String(Number(month)) };
};

export default function BirthdayPicker({ day, month, onChange, className = '' }) {
  const maxDay = month ? DAYS_IN_MONTH[Number(month) - 1] : 31;

  const handleMonthChange = (newMonth) => {
    const limit = newMonth ? DAYS_IN_MONTH[Number(newMonth) - 1] : 31;
    const clampedDay = day && Number(day) > limit ? String(limit) : day;
    onChange({ day: clampedDay, month: newMonth });
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        value={day}
        onChange={(e) => onChange({ day: e.target.value, month })}
        className="input-field text-sm flex-1"
      >
        <option value="">Día</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => handleMonthChange(e.target.value)}
        className="input-field text-sm flex-1"
      >
        <option value="">Mes</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
    </div>
  );
}
