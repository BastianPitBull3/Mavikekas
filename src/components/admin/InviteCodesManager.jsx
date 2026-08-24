/**
 * InviteCodesManager.jsx
 * Panel de administración del código de invitación para auto-registro.
 * Solo existe UN código activo a la vez: al generar uno nuevo se invalida
 * el anterior, y en cuanto alguien lo usa para crear su cuenta, queda
 * inservible (se limpia a null) y hay que generar otro para la próxima
 * persona.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function InviteCodesManager() {
  const { state, generateInviteCode, revokeInviteCode } = useApp();
  const activeCode = state.appState.inviteCode;

  const [busy,             setBusy]             = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [confirmingAction, setConfirmingAction] = useState(null); // 'revoke' | 'regenerate' | null

  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    setBusy(true);
    setConfirmingAction(null);
    setCopied(false);
    const result = await generateInviteCode();
    setBusy(false);
    // Lo copiamos de una vez — normalmente lo siguiente que se hace es pegarlo en un mensaje
    if (result.success) {
      try {
        await navigator.clipboard.writeText(result.code);
        flashCopied();
      } catch {
        // Sin acceso al portapapeles: el código igual queda visible para copiarlo a mano
      }
    }
  };

  const handleRevoke = async () => {
    setBusy(true);
    await revokeInviteCode();
    setBusy(false);
    setConfirmingAction(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      flashCopied();
    } catch {
      // Sin acceso al portapapeles: el código igual queda visible para copiarlo a mano
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🔑</span> Código de invitación
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Compártelo para que alguien cree su cuenta desde el login. Se usa una sola vez.
          </p>
        </div>
        {activeCode && <span className="badge-active text-xs flex-shrink-0">Disponible</span>}
      </div>

      {activeCode ? (
        <div className="mt-4">
          {/* Código grande, clic para copiar */}
          <button
            onClick={handleCopy}
            disabled={busy}
            className="w-full flex items-center justify-between gap-3 bg-blue-50 hover:bg-blue-100
                       border-2 border-dashed border-blue-200 rounded-xl px-5 py-4
                       transition-colors disabled:opacity-60"
            title="Copiar código"
          >
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-blue-900">
              {activeCode}
            </span>
            <span className="text-xs font-semibold text-blue-500 flex-shrink-0">
              {copied ? '✅ Copiado' : '📋 Copiar'}
            </span>
          </button>

          {/* Acciones secundarias, con confirmación antes de invalidar */}
          <div className="flex items-center justify-end gap-4 mt-3 min-h-[1.5rem]">
            {confirmingAction ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">
                  {confirmingAction === 'revoke'
                    ? '¿Revocar el código?'
                    : 'El código actual dejará de servir. ¿Generar uno nuevo?'}
                </span>
                <button
                  onClick={confirmingAction === 'revoke' ? handleRevoke : handleGenerate}
                  disabled={busy}
                  className="btn-danger text-xs px-2.5 py-1"
                >
                  {busy ? '…' : 'Sí, confirmar'}
                </button>
                <button
                  onClick={() => setConfirmingAction(null)}
                  disabled={busy}
                  className="btn-secondary text-xs px-2.5 py-1"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setConfirmingAction('revoke')}
                  disabled={busy}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  🗑 Revocar
                </button>
                <button
                  onClick={() => setConfirmingAction('regenerate')}
                  disabled={busy}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  🔄 Generar uno nuevo
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center gap-3 border-2 border-dashed
                        border-gray-200 rounded-xl py-8 text-center">
          <span className="text-3xl">🔒</span>
          <p className="text-sm text-gray-400">No hay ningún código activo</p>
          <button onClick={handleGenerate} disabled={busy} className="btn-admin text-sm">
            {busy ? 'Generando…' : '+ Generar código'}
          </button>
        </div>
      )}
    </div>
  );
}
