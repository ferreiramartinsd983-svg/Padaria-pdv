import React, { useState } from 'react';
import { 
  Receipt, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Lock, 
  Unlock, 
  Banknote, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';
import { CashRegister, CashMovement } from '../types/padaria';
import { storage } from '../services/storage';

interface CashRegisterModuleProps {
  onCashUpdated: () => void;
}

export const CashRegisterModule: React.FC<CashRegisterModuleProps> = ({ onCashUpdated }) => {
  const [cashRegister, setCashRegister] = useState<CashRegister>(() => storage.getCashRegister());
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'SUPRIMENTO' | 'SANGRIA'>('SANGRIA');
  const [movementAmount, setMovementAmount] = useState<number>(50);
  const [movementReason, setMovementReason] = useState<string>('Retirada para depósito de segurança');

  // Fechamento de Caixa cego
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(cashRegister.expectedCashAmount);

  // Abertura de Novo Caixa
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [initialAmount, setInitialAmount] = useState<number>(150);
  const [operatorName, setOperatorName] = useState<string>('Operador Caixa 01');

  const isOpen = cashRegister.status === 'OPEN';

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (movementAmount <= 0) return;

    const newMov: CashMovement = {
      id: 'mov_' + Date.now(),
      type: movementType,
      amount: Number(movementAmount),
      reason: movementReason,
      timestamp: Date.now(),
      operator: 'Operador Principal'
    };

    const delta = movementType === 'SUPRIMENTO' ? movementAmount : -movementAmount;
    const updated: CashRegister = {
      ...cashRegister,
      expectedCashAmount: Math.max(0, cashRegister.expectedCashAmount + delta),
      movements: [newMov, ...cashRegister.movements]
    };

    setCashRegister(updated);
    storage.saveCashRegister(updated);
    setIsMovementModalOpen(false);
    onCashUpdated();
  };

  const handleCloseRegister = () => {
    const diff = countedCash - cashRegister.expectedCashAmount;
    const updated: CashRegister = {
      ...cashRegister,
      status: 'CLOSED',
      closedAt: Date.now(),
      actualCashAmount: countedCash,
      cashDifference: diff
    };

    setCashRegister(updated);
    storage.saveCashRegister(updated);
    setIsCloseModalOpen(false);
    onCashUpdated();
  };

  const handleOpenNewRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newRegister: CashRegister = {
      id: 'cx_' + Date.now(),
      status: 'OPEN',
      operatorName,
      openedAt: Date.now(),
      initialAmount: Number(initialAmount),
      movements: [],
      salesCount: 0,
      salesTotal: 0,
      salesByMethod: {
        DINHEIRO: 0,
        PIX: 0,
        CARTAO_DEBITO: 0,
        CARTAO_CREDITO: 0,
        FIADO: 0
      },
      expectedCashAmount: Number(initialAmount)
    };

    setCashRegister(newRegister);
    storage.saveCashRegister(newRegister);
    setIsOpenModalOpen(false);
    onCashUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Banner de Status do Caixa */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
              isOpen ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {isOpen ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {isOpen ? 'Caixa Operacional Aberto' : 'Caixa Fechado'}
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isOpen
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                }`}
              >
                {isOpen ? 'EM OPERAÇÃO' : 'ENCERRADO'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Operador: {cashRegister.operatorName} · Aberto em: {new Date(cashRegister.openedAt).toLocaleTimeString('pt-BR')} ({new Date(cashRegister.openedAt).toLocaleDateString('pt-BR')})
            </p>
          </div>
        </div>

        {/* Botões de Abertura / Sangria / Fechamento */}
        <div className="flex items-center gap-2">
          {isOpen ? (
            <>
              <button
                onClick={() => {
                  setMovementType('SUPRIMENTO');
                  setIsMovementModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold transition-all"
              >
                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                <span>Suprimento (Troco)</span>
              </button>

              <button
                onClick={() => {
                  setMovementType('SANGRIA');
                  setIsMovementModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold transition-all"
              >
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                <span>Sangria (Retirada)</span>
              </button>

              <button
                onClick={() => {
                  setCountedCash(cashRegister.expectedCashAmount);
                  setIsCloseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Lock className="w-4 h-4" />
                <span>Fechar Caixa (Turno)</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Novo Caixa</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Resumo Financeiro do Caixa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono tabular-nums">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500">Fundo de Troco Inicial</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
            R$ {cashRegister.initialAmount.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500">Vendas em Dinheiro (Gaveta)</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            R$ {(cashRegister.salesByMethod?.DINHEIRO || 0).toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500">Vendas PIX & Cartões (Eletrônico)</span>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            R$ {(
              (cashRegister.salesByMethod?.PIX || 0) +
              (cashRegister.salesByMethod?.CARTAO_DEBITO || 0) +
              (cashRegister.salesByMethod?.CARTAO_CREDITO || 0)
            ).toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500">Dinheiro Esperado na Gaveta</span>
          <p className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
            R$ {cashRegister.expectedCashAmount.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Histórico de Movimentações (Sangrias e Suprimentos) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
          Movimentações do Turno
        </h3>
        <p className="text-xs text-neutral-400 mb-4">Registro de retiradas (sangria) e reforços de troco (suprimento)</p>

        {cashRegister.movements.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            Nenhuma sangria ou suprimento registrado neste turno de caixa.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs font-mono tabular-nums">
            {cashRegister.movements.map((mov) => {
              const isSup = mov.type === 'SUPRIMENTO';
              return (
                <div key={mov.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isSup
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-600'
                      }`}
                    >
                      {isSup ? '+' : '-'}
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-neutral-800 dark:text-neutral-200">
                        {mov.reason}
                      </p>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(mov.timestamp).toLocaleTimeString('pt-BR')} · Responsável: {mov.operator}
                      </span>
                    </div>
                  </div>

                  <span className={`font-bold text-sm ${isSup ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isSup ? '+' : '-'} R$ {mov.amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Sangria ou Suprimento */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              {movementType === 'SUPRIMENTO' ? 'Lançar Suprimento (Entrada de Troco)' : 'Lançar Sangria (Retirada de Dinheiro)'}
            </h3>

            <form onSubmit={handleConfirmMovement} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Valor (R$):</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Motivo / Justificativa:</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 px-3 rounded-xl text-white font-bold ${
                    movementType === 'SUPRIMENTO' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fechamento de Caixa Cego com Conferência */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              Fechamento de Caixa & Conferência Cega
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Conte as cédulas e moedas físicas na gaveta e digite o valor real encontrado.
            </p>

            <div className="space-y-4 my-4 text-xs font-mono tabular-nums">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/60">
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="font-sans">Saldo Calculado pelo Sistema:</span>
                  <span className="font-bold">R$ {cashRegister.expectedCashAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div>
                <label className="font-sans font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Valor em Dinheiro Contado na Gaveta (R$):
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={countedCash}
                  onChange={(e) => setCountedCash(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border-2 border-amber-500 rounded-lg text-lg font-bold text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {/* Cálculo de Quebra de Caixa */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center font-sans">
                <span className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                  Diferença (Quebra de Caixa):
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    countedCash - cashRegister.expectedCashAmount === 0
                      ? 'text-emerald-600'
                      : countedCash - cashRegister.expectedCashAmount > 0
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }`}
                >
                  {countedCash - cashRegister.expectedCashAmount >= 0 ? '+' : ''}
                  R$ {(countedCash - cashRegister.expectedCashAmount).toFixed(2).replace('.', ',')}
                  {countedCash - cashRegister.expectedCashAmount === 0 && ' (Exato)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCloseRegister}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Abertura de Caixa */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              Abertura de Novo Turno de Caixa
            </h3>

            <form onSubmit={handleOpenNewRegister} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Operador / Caixa:</label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Fundo de Troco Inicial (R$):</label>
                <input
                  type="number"
                  step="5"
                  required
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Abrir Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
