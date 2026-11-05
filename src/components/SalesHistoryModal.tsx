import React, { useState } from 'react';
import { History, X, Ban, CheckCircle } from 'lucide-react';
import { Sale } from '../types/padaria';
import { storage } from '../services/storage';

interface Props { onClose: () => void; onProductsUpdated: () => void; }
export const SalesHistoryModal: React.FC<Props> = ({ onClose, onProductsUpdated }) => {
  const [sales, setSales] = useState<Sale[]>(() => storage.getSales());
  const [selected, setSelected] = useState<Sale | null>(null);
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const refresh = () => setSales(storage.getSales());
  const cancel = async () => {
    if (!selected) return;
    const result = await storage.cancelSale(selected.id, pin, reason);
    if (!result.ok) { setError(result.error || 'Não foi possível cancelar.'); return; }
    setError(''); setSuccess(`Venda ${selected.code} cancelada; estoque e caixa atualizados.`);
    setPin(''); setReason(''); setSelected(null); refresh(); onProductsUpdated();
  };
  return <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-3">
    <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
      <header className="p-4 border-b dark:border-neutral-800 flex items-center justify-between"><h2 className="font-bold flex gap-2 items-center"><History className="w-5 h-5 text-amber-500"/>Histórico de vendas</h2><button onClick={onClose}><X className="w-5 h-5"/></button></header>
      <div className="p-4 overflow-y-auto space-y-3">
        {!storage.hasManagerPin() && <div className="rounded-lg bg-amber-50 text-amber-800 p-3 text-sm">Configure o PIN do gerente na aba Sincronização antes de cancelar vendas.</div>}
        {success && <div className="rounded-lg bg-emerald-50 text-emerald-700 p-3 text-sm flex gap-2"><CheckCircle className="w-4 h-4"/>{success}</div>}
        {sales.length === 0 && <p className="text-sm text-neutral-500">Nenhuma venda registrada.</p>}
        {sales.map(sale => <article key={sale.id} className="border dark:border-neutral-800 rounded-xl p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><strong>Venda #{sale.code}</strong><p className="text-xs text-neutral-500">{new Date(sale.timestamp).toLocaleString('pt-BR')} · {sale.paymentMethod}</p></div><div className="text-right"><strong>R$ {sale.total.toFixed(2).replace('.', ',')}</strong><p className={`text-xs ${sale.status === 'CANCELADA' ? 'text-red-600' : 'text-emerald-600'}`}>{sale.status === 'CANCELADA' ? 'Cancelada' : 'Concluída'}</p></div></div>
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">{sale.items.map(item => `${item.quantity} × ${item.productName}`).join(' · ')}</p>
          {sale.status === 'CANCELADA' && <p className="mt-1 text-xs text-red-600">Motivo: {sale.cancellationReason}</p>}
          {sale.status !== 'CANCELADA' && <button disabled={!storage.hasManagerPin()} onClick={() => { setSelected(sale); setError(''); }} className="mt-3 px-3 py-2 rounded-lg bg-red-50 text-red-700 disabled:opacity-40 flex items-center gap-2 text-xs font-bold"><Ban className="w-4 h-4"/>Cancelar venda</button>}
        </article>)}
      </div>
      {selected && <div className="border-t dark:border-neutral-800 p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950"><p className="font-semibold text-sm">Autorizar cancelamento de #{selected.code}</p><input aria-label="PIN do gerente" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN do gerente" className="w-full p-2 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700"/><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motivo obrigatório" className="w-full p-2 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700"/>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button onClick={()=>{setSelected(null);setError('');}} className="px-3 py-2 rounded-lg border">Voltar</button><button onClick={cancel} className="px-3 py-2 rounded-lg bg-red-600 text-white font-bold">Confirmar cancelamento</button></div></div>}
    </div>
  </div>;
};
