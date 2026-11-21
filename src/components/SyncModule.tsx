import { downloadBlob } from '../services/download';
import React, { useEffect, useRef, useState } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  ShieldCheck,
  Database,
  Wifi,
  CheckCircle,
  KeyRound,
  Smartphone
} from 'lucide-react';
import { SyncState } from '../types/padaria';
import { storage } from '../services/storage';

interface SyncModuleProps {
  onDatabaseRestored: () => void;
}

export const SyncModule: React.FC<SyncModuleProps> = ({ onDatabaseRestored }) => {
  const [syncState, setSyncState] = useState<SyncState>(() => storage.getSyncState());
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [shareCode, setShareCode] = useState(() => localStorage.getItem('padaria_share_code') || '');
  const [shareServer, setShareServer] = useState(() => localStorage.getItem('padaria_share_server') || (window.location.hostname === 'appassets.androidplatform.net' ? '' : window.location.origin));
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [onlineDevices, setOnlineDevices] = useState<Array<{ id: string; name: string; lastSeen: number }>>([]);
  const [presenceAvailable, setPresenceAvailable] = useState(false);
  const syncInFlight = useRef(false);
  const [deviceId] = useState(() => {
    const key = 'padaria_share_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = window.crypto?.randomUUID?.() || 'device-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  });
  const deviceName = /Android/i.test(navigator.userAgent) ? 'Celular Android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iPhone/iPad' : 'Computador';

  const startPhoneServer = () => {
    const bridge = (window as Window & { PadariaServerBridge?: { startDataServer: () => string } }).PadariaServerBridge;
    if (!bridge) { setShareMessage('Esta opção funciona no APK Android.'); return; }
    const address = bridge.startDataServer();
    if (address.startsWith('ERROR:')) { setShareMessage(address.slice(6)); return; }
    setShareServer(address);
    localStorage.setItem('padaria_share_server', address);
    setShareMessage('Este celular agora é o servidor. Conecte os outros aparelhos à mesma rede Wi-Fi e informe este endereço neles.');
  };

  const syncSharedData = async () => {
    const code = shareCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,32}$/.test(code)) { setShareMessage('Informe um código com 4 a 32 letras ou números.'); return; }
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    setShareBusy(true); setShareMessage('Conectando ao grupo...');
    try {
      localStorage.setItem('padaria_share_code', code);
      const server = shareServer.trim().replace(/\/$/, '');
      let serverUrl: URL;
      try { serverUrl = new URL(server); } catch { throw new Error('Informe o endereço completo do servidor, incluindo http:// ou https://.'); }
      if (!['http:', 'https:'].includes(serverUrl.protocol)) throw new Error('O endereço do servidor deve começar com http:// ou https://.');
      localStorage.setItem('padaria_share_server', server);
      const endpoint = serverUrl.origin + "/api/share/" + encodeURIComponent(code);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      let response: Response;
      try { response = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: storage.exportFullBackup(), cache: 'no-store', signal: controller.signal }); }
      finally { window.clearTimeout(timeout); }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao sincronizar.');
      if (!storage.importFullBackup(JSON.stringify(data))) throw new Error('Os dados recebidos não puderam ser aplicados.');
      const updated: SyncState = { ...syncState, lastSyncTimestamp: Date.now(), pendingChangesCount: 0 };
      setSyncState(updated); storage.saveSyncState(updated); onDatabaseRestored();
      setShareMessage('Dados sincronizados com sucesso.');
      try {
        const presenceResponse = await fetch(`${endpoint}/presence`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
          body: JSON.stringify({ deviceId, name: deviceName })
        });
        const presence = await presenceResponse.json();
        if (presenceResponse.ok && Array.isArray(presence.devices)) {
          setOnlineDevices(presence.devices);
          setPresenceAvailable(true);
        } else setPresenceAvailable(false);
      } catch { setPresenceAvailable(false); }
    } catch (error) { setPresenceAvailable(false); setShareMessage(error instanceof DOMException && error.name === 'AbortError' ? 'O servidor demorou para responder. Confira se está no Wi-Fi e mantenha o app servidor aberto.' : error instanceof TypeError ? 'Não foi possível alcançar o servidor. Confira o endereço, a rede Wi-Fi e se os aparelhos estão na mesma rede.' : error instanceof Error ? error.message : 'Não foi possível conectar. Confira a rede e o endereço do servidor.'); }
    finally { syncInFlight.current = false; setShareBusy(false); }
  };
  const syncSharedDataRef = useRef(syncSharedData);
  syncSharedDataRef.current = syncSharedData;

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

  useEffect(() => {
    if (!shareCode) { setOnlineDevices([]); setPresenceAvailable(false); return; }
    void syncSharedDataRef.current();
    const timer = window.setInterval(() => { void syncSharedDataRef.current(); }, 15000);
    return () => window.clearInterval(timer);
  }, [shareCode]);

  const saveManagerPin = async () => {
    if (newPin !== confirmPin) { setPinMessage('Os PINs não coincidem.'); return; }
    const ok = await storage.setManagerPin(newPin, currentPin || undefined);
    setPinMessage(ok ? 'PIN do gerente salvo.' : (storage.hasManagerPin() ? 'PIN atual incorreto ou novo PIN inválido.' : 'Use de 4 a 8 números.'));
    if (ok) { setPinOpen(false); setCurrentPin(''); setNewPin(''); setConfirmPin(''); }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-3">
        <div><h3 className="font-bold flex items-center gap-2"><Wifi className="w-5 h-5 text-amber-500"/>Sincronizar entre aparelhos</h3><p className="text-xs text-neutral-500 mt-1">Use um celular Android como servidor e conecte o PC e os demais celulares à mesma rede Wi-Fi. A sincronização automática funciona enquanto esta tela estiver aberta.</p></div>
        {(window as Window & { PadariaServerBridge?: unknown }).PadariaServerBridge && <button onClick={startPhoneServer} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-bold">Usar este celular como servidor</button>}
        <input type="url" value={shareServer} onChange={e => setShareServer(e.target.value)} placeholder="Endereço do servidor (ex.: http://192.168.1.20:8787)" className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 text-sm"/>
        <p className="text-[11px] text-neutral-500">No Android, toque em “Usar este celular como servidor”. No PC e nos outros aparelhos, informe o endereço exibido e use o mesmo código. Mantenha o servidor aberto e todos na mesma rede Wi-Fi.</p>
        <div className="flex flex-col sm:flex-row gap-2"><input value={shareCode} onChange={e => setShareCode(e.target.value.toUpperCase())} maxLength={32} placeholder="Código do grupo (ex.: PADARIA-01)" className="flex-1 min-w-0 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 text-sm"/><button onClick={syncSharedData} disabled={shareBusy} className="px-5 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm disabled:opacity-60">{shareBusy ? 'Sincronizando...' : 'Sincronizar agora'}</button></div>
        {shareMessage && <p role="status" className="text-xs text-neutral-600 dark:text-neutral-300">{shareMessage}</p>}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70" aria-live="polite">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${presenceAvailable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'}`}>
            <span className={`h-2 w-2 rounded-full ${presenceAvailable ? 'bg-emerald-500' : 'bg-neutral-400'}`}/>
            {presenceAvailable ? `${onlineDevices.length} ${onlineDevices.length === 1 ? 'aparelho' : 'aparelhos'} online` : 'Aparelhos online: aguardando conexão'}
          </span>
          {presenceAvailable && onlineDevices.map((device) => <span key={device.id} className="text-[11px] text-neutral-500">{device.name}</span>)}
          <span className="ml-auto text-[10px] text-neutral-400">Online = contato nos últimos 45 segundos</span>
        </div>
      </section>
      {/* Banner Principal de Arquitetura Offline-First */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Dados locais e sincronização
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

        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Smartphone className="h-5 w-5" /></div>
          <div><p className="text-sm font-bold">Compartilhamento pela rede local</p><p className="text-xs text-neutral-500">Sem serviço de nuvem configurado. Seus dados continuam salvos neste aparelho.</p></div>
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
                v2.9.0 (armazenamento local)
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

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            A nuvem não está configurada. Para compartilhar dados, use a sincronização pela rede local acima ou exporte um backup.
          </div>
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
