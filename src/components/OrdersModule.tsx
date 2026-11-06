import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  ChevronRight,
  X
} from 'lucide-react';
import { BakeryOrder } from '../types/padaria';
import { storage } from '../services/storage';

export const OrdersModule: React.FC = () => {
  const [orders, setOrders] = useState<BakeryOrder[]>(() => storage.getOrders());
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form para nova encomenda
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState('16:00');
  const [itemsDesc, setItemsDesc] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(180);
  const [depositAmount, setDepositAmount] = useState<number>(90);
  const [notes, setNotes] = useState('');

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter === 'TODOS') return true;
    return ord.status === statusFilter;
  });

  const handleUpdateStatus = (orderId: string, nextStatus: BakeryOrder['status']) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: nextStatus };
      }
      return o;
    });
    setOrders(updated);
    storage.saveOrders(updated);
    storage.logAction('ENCOMENDA', `Status alterado para ${nextStatus} · ${orderId}`, 'Operador');
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !itemsDesc) return;

    const remaining = Math.max(0, totalAmount - depositAmount);

    const newOrder: BakeryOrder = {
      id: 'ord_' + Date.now(),
      customerName,
      customerPhone,
      deliveryDate,
      deliveryTime,
      itemsDescription: itemsDesc,
      totalAmount: Number(totalAmount),
      depositAmount: Number(depositAmount),
      remainingAmount: remaining,
      status: 'PENDENTE',
      notes,
      createdAt: Date.now()
    };

    const all = [newOrder, ...orders];
    setOrders(all);
    storage.saveOrders(all);
    storage.logAction('ENCOMENDA', `Criada para ${customerName} · retirada ${deliveryDate} ${deliveryTime}`, 'Operador');
    setIsAddModalOpen(false);

    // Reset
    setCustomerName('');
    setCustomerPhone('');
    setItemsDesc('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Encomendas */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>Controle de Encomendas & Festas</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Gerencie pedidos personalizados de bolos decorados, salgados e coffee breaks com controle de adiantamento (sinal).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro por status */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold">
            {['TODOS', 'PENDENTE', 'EM_PRODUCAO', 'PRONTO', 'ENTREGUE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Encomenda</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de Encomendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const isPending = order.status === 'PENDENTE';
          const isInProd = order.status === 'EM_PRODUCAO';
          const isReady = order.status === 'PRONTO';
          const isDelivered = order.status === 'ENTREGUE';

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPending
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        : isInProd
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                        : isReady
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>

                  <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{order.deliveryDate} às {order.deliveryTime}</span>
                  </span>
                </div>

                <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  {order.customerName}
                </h4>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  <span>{order.customerPhone}</span>
                </p>

                <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold text-[11px] text-neutral-400 block mb-0.5">ITENS DO PEDIDO:</span>
                  <p>{order.itemsDescription}</p>
                  {order.notes && (
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Obs: {order.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Informações Financeiras e Avanço de Status */}
              <div>
                <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs font-mono tabular-nums mb-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-sans">Sinal Pago</span>
                    <span className="font-bold text-emerald-600">
                      R$ {order.depositAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-sans">Saldo a Pagar</span>
                    <span className={`font-bold ${order.remainingAmount > 0 ? 'text-amber-500' : 'text-neutral-400'}`}>
                      R$ {order.remainingAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block font-sans">Total</span>
                    <span className="font-black text-sm text-neutral-900 dark:text-neutral-100">
                      R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação de Status */}
                <div className="flex items-center gap-1.5">
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'EM_PRODUCAO')}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Iniciar Produção
                    </button>
                  )}
                  {isInProd && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PRONTO')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Marcar como Pronto
                    </button>
                  )}
                  {isReady && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ENTREGUE')}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-bold transition-all"
                    >
                      Confirmar Entrega / Retirada
                    </button>
                  )}
                  {isDelivered && (
                    <span className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 rounded-lg text-xs font-semibold text-center block">
                      Pedido Concluído
                    </span>
                  )}
                </div>
                {isReady && order.customerPhone && <button onClick={() => { const phone=order.customerPhone.replace(/\D/g,''); const text=encodeURIComponent(`Olá, ${order.customerName}! Sua encomenda está pronta para retirada na Padaria Master.`); window.open(`https://wa.me/${phone}?text=${text}`,'_blank','noopener,noreferrer'); }} className="w-full mt-2 rounded-lg border border-emerald-300 text-emerald-700 py-2 text-xs font-bold">Avisar cliente pelo WhatsApp</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Nova Encomenda */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
              Cadastrar Nova Encomenda
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Informe os dados do cliente e os detalhes dos produtos sob encomenda
            </p>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Nome do Cliente:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Albuquerque"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Data da Entrega:</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Horário da Retirada:</label>
                  <input
                    type="time"
                    required
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Descrição Detalhada do Pedido:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: 1 Bolo Red Velvet 2kg com placa Parabéns + 100 mini coxinhas"
                  value={itemsDesc}
                  onChange={(e) => setItemsDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Valor Total (R$):</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Sinal / Adiantamento Pago (R$):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Observações Especiais:</label>
                <input
                  type="text"
                  placeholder="Ex: Sem glúten / Embalagem para viagem"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Salvar Encomenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
