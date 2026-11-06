import { downloadBlob } from '../services/download';
import React, { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  Database, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { SyncState } from '../types/padaria';
import { storage } from '../services/storage';

interface SyncModuleProps {
  onDatabaseRestored: () => void;
}

export const SyncModule: React.FC<SyncModuleProps> = ({ onDatabaseRestored }) => {
  const [syncState, setSyncState] = useState<SyncState>(() => storage.getSyncState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  const handleToggleFirestore = () => {
    const updated: SyncState = {
      ...syncState,
      firestoreEnabled: !syncState.firestoreEnabled,
      pendingChangesCount: !syncState.firestoreEnabled ? 0 : syncState.pendingChangesCount,
      lastSyncTimestamp: !syncState.firestoreEnabled ? Date.now() : syncState.lastSyncTimestamp
    };
    setSyncState(updated);
    storage.saveSyncState(updated);
  };

  const handleManualSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updated: SyncState = {
        ...syncState,
        lastSyncTimestamp: Date.now(),
        pendingChangesCount: 0,
        syncLog: [
          {
            id: 'sync_' + Date.now(),
            action: 'MANUAL_SYNC',
            entity: 'ROOM_TO_FIRESTORE',
            timestamp: Date.now(),
            status: 'SYNCED'
          },
          ...syncState.syncLog
        ]
      };
      setSyncState(updated);
      storage.saveSyncState(updated);
      setIsSyncing(false);
    }, 800);
  };

  // Exportar Backup Completo
  const handleExportBackup = async () => {
    const jsonStr = storage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    await downloadBlob(blob, 'PadariaMaster2_Backup.json');
    setBackupMessage('Selecione onde salvar o backup.');
    setTimeout(() => setBackupMessage(null), 3500);
  };

  // Importar Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importFullBackup(content);
      if (success) {
        setBackupMessage('Banco de dados restaurado com sucesso!');
        onDatabaseRestored();
      } else {
        setBackupMessage('Erro ao ler arquivo de backup.');
      }
      setTimeout(() => setBackupMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const saveManagerPin = async () => {
    if (newPin !== confirmPin) { setPinMessage('Os PINs não coincidem.'); return; }
    const ok = await storage.setManagerPin(newPin, currentPin || undefined);
    setPinMessage(ok ? 'PIN do gerente salvo.' : (storage.hasManagerPin() ? 'PIN atual incorreto ou novo PIN inválido.' : 'Use de 4 a 8 números.'));
    if (ok) { setPinOpen(false); setCurrentPin(''); setNewPin(''); setConfirmPin(''); }
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Arquitetura Offline-First */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Arquitetura Offline-First & Sincronização
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Armazenamento local ativo</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
              Os dados de PDV, estoque, vendas, receitas e caixa são guardados neste aparelho. As operações locais continuam disponíveis sem conexão.
            </p>
          </div>
        </div>

        {/* Chaveador de Nuvem */}
        <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="text-right">
            <span className="text-xs font-bold block text-neutral-900 dark:text-neutral-100">
              Sincronização com a nuvem
            </span>
            <span className="text-[11px] text-neutral-400">
              Firebase não configurado nesta instalação
            </span>
          </div>

          <button
            disabled aria-label="Sincronização em nuvem não configurada"
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              syncState.firestoreEnabled ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                syncState.firestoreEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-bold flex items-center gap-2"><KeyRound className="w-5 h-5 text-amber-500"/>PIN do gerente</h3><p className="text-xs text-neutral-500 mt-1">{storage.hasManagerPin() ? 'PIN configurado' : 'Cadastre um PIN para autorizar cancelamento de vendas'}</p>{pinMessage && <p className="text-xs mt-2 text-amber-700">{pinMessage}</p>}</div><button onClick={()=>{setPinMessage('');setPinOpen(true);}} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold">{storage.hasManagerPin() ? 'Alterar PIN' : 'Configurar PIN'}</button></section>
      {pinOpen && <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4"><div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl w-full max-w-sm space-y-3"><h3 className="font-bold">{storage.hasManagerPin() ? 'Alterar PIN do gerente' : 'Configurar PIN do gerente'}</h3>{storage.hasManagerPin() && <input type="password" inputMode="numeric" value={currentPin} onChange={e=>setCurrentPin(e.target.value)} placeholder="PIN atual" className="w-full p-2 rounded border dark:bg-neutral-800"/>}<input type="password" inputMode="numeric" value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="Novo PIN (4 a 8 números)" className="w-full p-2 rounded border dark:bg-neutral-800"/><input type="password" inputMode="numeric" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)} placeholder="Confirme o novo PIN" className="w-full p-2 rounded border dark:bg-neutral-800"/>{pinMessage && <p className="text-sm text-red-600">{pinMessage}</p>}<div className="flex justify-end gap-2"><button onClick={()=>setPinOpen(false)} className="px-3 py-2 rounded border">Cancelar</button><button onClick={saveManagerPin} className="px-3 py-2 rounded bg-amber-500 text-white font-bold">Salvar PIN</button></div></div></div>}
      {/* Grid de Status e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel do Banco Local Room */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-500" />
                <span>Dados locais deste aparelho</span>
              </h3>
              <span className="text-xs font-mono tabular-nums text-neutral-500">
                v2.3.0 (armazenamento local)
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Os dados ficam no armazenamento local do app. Exporte um backup para levar seus registros a outro aparelho.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-sans">Status de Escrita Local:</span>
                <span className="font-bold text-emerald-600">SALVO NESTE DISPOSITIVO</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-sans">Alterações na Fila Offline:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {syncState.pendingChangesCount} pendentes
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-500 font-sans">Última Sincronização:</span>
                <span className="text-neutral-400">
                  {syncState.lastSyncTimestamp
                    ? new Date(syncState.lastSyncTimestamp).toLocaleTimeString('pt-BR')
                    : 'Nunca'}
                </span>
              </div>
            </div>
          </div>

          <button
            disabled
            className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            <span>Sincronização em nuvem indisponível</span>
          </button>
        </div>

        {/* Painel de Backup & Restauração JSON */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-emerald-500" />
              <span>Backup Geral & Restauração</span>
            </h3>

            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Exporte todos os produtos, fichas técnicas, vendas e fechamentos de caixa em um único arquivo de segurança portátil (.JSON) ou restaure dados em outro terminal.
            </p>

            {backupMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{backupMessage}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportBackup}
              className="py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Backup (.JSON)</span>
            </button>

            <label className="py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center">
              <Upload className="w-4 h-4" />
              <span>Restaurar Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
