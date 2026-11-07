import React, { useState } from 'react';
import { CheckCircle2, Download, KeyRound, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { storage } from '../services/storage';
import { downloadBlob } from '../services/download';

type ResetDataModalProps = {
  onClose: () => void;
  onReset: () => void;
  onGoToSync: () => void;
};

export const ResetDataModal: React.FC<ResetDataModalProps> = ({ onClose, onReset, onGoToSync }) => {
  const [backupRequested, setBackupRequested] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSavingBackup, setIsSavingBackup] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const saveBackup = async () => {
    setIsSavingBackup(true);
    setError('');
    try {
      const contents = storage.exportFullBackup();
      const backup = new Blob([contents], { type: 'application/json;charset=utf-8' });
      const date = new Date().toISOString().slice(0, 10);
      await downloadBlob(backup, `PadariaMaster_Backup_${date}.json`);
      setBackupRequested(true);
    } catch {
      setError('Não consegui gerar o backup. Tente novamente antes de resetar.');
    } finally {
      setIsSavingBackup(false);
    }
  };

  const confirmReset = async () => {
    if (!backupRequested || !backupConfirmed) { setError('Salve o backup e confirme que conseguiu localizá-lo.'); return; }
    if (!storage.hasManagerPin()) { setError('Configure o PIN do gerente em Mais → Sistema → Offline / Sync antes de resetar.'); return; }
    setIsResetting(true);
    setError('');
    try {
      if (!(await storage.verifyManagerPin(pin))) { setError('PIN do gerente incorreto.'); return; }
      storage.resetToDefault();
      onReset();
      setResetDone(true);
    } catch {
      setError('Não foi possível validar o PIN. Tente novamente.');
    } finally {
      setIsResetting(false);
    }
  };

  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget && !isResetting) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="reset-data-title" className="w-full max-w-lg space-y-4 rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:rounded-2xl">
      <header className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-950 dark:text-red-300"><ShieldAlert className="h-5 w-5"/></div><div><h2 id="reset-data-title" className="font-extrabold">Resetar informações</h2><p className="mt-1 text-xs text-neutral-500">O backup e o PIN do gerente são obrigatórios.</p></div></div>{!resetDone && <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-5 w-5"/></button>}</header>
      {resetDone ? <><div role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0"/>Informações resetadas. Os dados padrão foram restaurados e o PIN do gerente foi mantido.</div><button onClick={onClose} className="w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-white">Concluir</button></> : <>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">Produtos cadastrados, vendas, tarefas, caixa, pedidos, anotações e demais dados operacionais serão apagados. O PIN do gerente será mantido.</div>
        <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"><div><h3 className="flex items-center gap-2 text-sm font-bold"><Download className="h-4 w-4 text-amber-600"/>1. Salve um backup completo</h3><p className="mt-1 text-xs text-neutral-500">Guarde o arquivo em um local que você consiga encontrar depois.</p></div><button type="button" onClick={() => void saveBackup()} disabled={isSavingBackup} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-bold disabled:opacity-50 dark:border-neutral-600"><Download className="h-4 w-4"/>{isSavingBackup ? 'Preparando backup…' : backupRequested ? 'Baixar backup novamente' : 'Baixar backup'}</button>{backupRequested && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={backupConfirmed} onChange={event => { setBackupConfirmed(event.target.checked); setError(''); }} className="mt-0.5 accent-amber-500"/><span>Salvei o backup e consigo localizá-lo.</span></label>}</div>
        {storage.hasManagerPin() ? <label className="block text-sm font-semibold"><span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-amber-600"/>2. Digite o PIN do gerente</span><input type="password" inputMode="numeric" autoComplete="current-password" maxLength={8} value={pin} onChange={event => { setPin(event.target.value.replace(/\D/g, '')); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') void confirmReset(); }} placeholder="PIN de 4 a 8 números" className="mt-2 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-3 tracking-[0.3em] dark:border-neutral-700 dark:bg-neutral-800"/></label> : <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><p>O PIN do gerente ainda não foi configurado.</p><button onClick={onGoToSync} className="mt-2 font-bold underline">Ir para Offline / Sync e configurar o PIN</button></div>}
        {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
        <footer className="flex gap-2"><button onClick={onClose} disabled={isResetting} className="min-h-11 flex-1 rounded-xl border border-neutral-300 px-3 font-bold dark:border-neutral-700">Cancelar</button><button onClick={() => void confirmReset()} disabled={isResetting || !backupConfirmed || !pin || !storage.hasManagerPin()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"><RotateCcw className="h-4 w-4"/>{isResetting ? 'Validando…' : 'Resetar informações'}</button></footer>
      </>}
    </section>
  </div>;
};
