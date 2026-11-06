import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Plus, 
  Receipt, 
  Zap, 
  Flame, 
  Home, 
  Users, 
  PackageCheck,
  CheckCircle,
  X,
  PieChart
} from 'lucide-react';
import { FinancialTransaction } from '../types/padaria';
import { storage } from '../services/storage';

export const FinanceModule: React.FC = () => {
  const [finances, setFinances] = useState<FinancialTransaction[]>(() => storage.getFinances());
  const [period, setPeriod] = useState<'HOJE' | 'SEMANA' | 'MES'>('MES');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form para nova despesa
  const [expCategory, setExpCategory] = useState<FinancialTransaction['category']>('MATERIA_PRIMA');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<number>(150);
  const [expPayment, setExpPayment] = useState('PIX');

  const periodStart = (() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (period === 'SEMANA') {
      const daysSinceMonday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - daysSinceMonday);
    } else if (period === 'MES') {
      start.setDate(1);
    }
    return start.getTime();
  })();
  const periodFinances = finances.filter(tx => tx.timestamp >= periodStart);

  // Cálculos do DRE no período selecionado
  const totalIncomes = periodFinances
    .filter((t) => t.type === 'RECEITA')
    .reduce((acc, t) => acc + t.amount, 0);

  const rawMaterialsExpense = periodFinances
    .filter((t) => t.type === 'DESPESA' && t.category === 'MATERIA_PRIMA')
    .reduce((acc, t) => acc + t.amount, 0);

  const gasExpense = periodFinances
    .filter((t) => t.type === 'DESPESA' && t.category === 'GAS_FORNO')
    .reduce((acc, t) => acc + t.amount, 0);

  const electricityExpense = periodFinances
    .filter((t) => t.type === 'DESPESA' && t.category === 'ENERGIA_ELETRICA')
    .reduce((acc, t) => acc + t.amount, 0);

  const otherOperatingExpenses = periodFinances
    .filter((t) => t.type === 'DESPESA' && !['MATERIA_PRIMA', 'GAS_FORNO', 'ENERGIA_ELETRICA'].includes(t.category))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = rawMaterialsExpense + gasExpense + electricityExpense + otherOperatingExpenses;
  
  // Lucro Bruto (Receita - CMV direto)
  const grossProfit = totalIncomes - rawMaterialsExpense;
  // Lucro Líquido Final
  const netProfit = totalIncomes - totalExpenses;
  const totalFlow = totalIncomes + totalExpenses;
  const incomeSharePercent = totalFlow > 0 ? (totalIncomes / totalFlow) * 100 : 0;
  const netMarginPercent = totalIncomes > 0 ? (netProfit / totalIncomes) * 100 : 0;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || expAmount <= 0) return;

    const newTx: FinancialTransaction = {
      id: 'tx_' + Date.now(),
      type: 'DESPESA',
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount),
      timestamp: Date.now(),
      paymentMethod: expPayment
    };

    const updated = [newTx, ...finances];
    setFinances(updated);
    storage.saveFinances(updated);
    setIsExpenseModalOpen(false);
    setExpDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono tabular-nums">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500 font-medium">Receita Bruta Acumulada</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            R$ {totalIncomes.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[11px] font-sans text-neutral-400 mt-0.5 block">Vendas no balcão e encomendas</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500 font-medium">Total de Despesas Operacionais</span>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            R$ {totalExpenses.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[11px] font-sans text-neutral-400 mt-0.5 block">Insumos, gás, luz e custos fixos</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500 font-medium">Lucro Líquido Real</span>
          <p className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            R$ {netProfit.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[11px] font-sans text-neutral-400 mt-0.5 block">
            {netProfit >= 0 ? 'Resultado positivo (superávit)' : 'Alerta de déficit no período'}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-xs font-sans text-neutral-500 font-medium">Margem Líquida da Padaria</span>
          <p className={`text-2xl font-bold mt-1 ${netMarginPercent >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
            {netMarginPercent.toFixed(1)}%
          </p>
          <span className="text-[11px] font-sans text-neutral-400 mt-0.5 block">Alvo recomendado: 22% a 30%</span>
        </div>
      </div>


      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h3 className="flex items-center gap-2 text-base font-extrabold"><PieChart className="h-5 w-5 text-amber-500"/>Receitas e gastos</h3><p className="mt-1 text-xs text-neutral-500">Veja como as movimentações se dividem no período.</p></div>
          <div className="flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">{([{id:'HOJE',label:'Hoje'},{id:'SEMANA',label:'Esta semana'},{id:'MES',label:'Este mês'}] as const).map(option=><button key={option.id} onClick={()=>setPeriod(option.id)} className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${period===option.id?'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white':'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>{option.label}</button>)}</div>
        </div>
        <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto relative h-44 w-44 rounded-full shadow-inner" role="img" aria-label={`Gráfico de pizza: receitas de R$ ${totalIncomes.toFixed(2)} e gastos de R$ ${totalExpenses.toFixed(2)}`} style={{background: totalFlow > 0 ? `conic-gradient(#059669 0deg ${incomeSharePercent * 3.6}deg, #ef4444 ${incomeSharePercent * 3.6}deg 360deg)` : 'conic-gradient(#d6d3d1 0deg 360deg)'}}>
            <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-neutral-900"><span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Movimento</span><strong className="mt-1 max-w-full truncate px-2 text-sm font-black text-neutral-900 dark:text-neutral-100">R$ {totalFlow.toFixed(2).replace('.', ',')}</strong><span className="mt-0.5 text-[10px] text-neutral-400">no período</span></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-600"/><span className="text-sm font-semibold">Receitas</span></div><div className="text-right"><p className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-300">R$ {totalIncomes.toFixed(2).replace('.', ',')}</p><p className="text-[11px] text-neutral-500">{incomeSharePercent.toFixed(1)}% do movimento</p></div></div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-red-50 p-3 dark:bg-red-950/30"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500"/><span className="text-sm font-semibold">Gastos</span></div><div className="text-right"><p className="font-mono text-sm font-extrabold text-red-700 dark:text-red-300">R$ {totalExpenses.toFixed(2).replace('.', ',')}</p><p className="text-[11px] text-neutral-500">{(100-incomeSharePercent).toFixed(1)}% do movimento</p></div></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Demonstrativo do Resultado do Exercício (DRE) - 7 colunas */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                DRE Gerencial Simplificado
              </h3>
              <p className="text-xs text-neutral-400">Estrutura oficial de apuração de lucro contábil e operacional</p>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Despesa</span>
            </button>
          </div>

          {/* Linhas do DRE */}
          <div className="mt-4 space-y-2.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40">
              <span className="font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                (+) Receita Operacional Bruta (Vendas PDV)
              </span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                R$ {totalIncomes.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="flex justify-between py-2 px-3 rounded-lg text-neutral-500 pl-6">
              <span className="font-sans">(-) Deduções e Devoluções de Venda</span>
              <span>R$ 0,00</span>
            </div>

            <div className="flex justify-between py-2 px-3 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/70 font-bold">
              <span className="font-sans">(=) Receita Operacional Líquida</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                R$ {totalIncomes.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="flex justify-between py-2 px-3 rounded-lg text-red-600 dark:text-red-400 pl-6">
              <span className="font-sans">(-) CMV: Custos de Farinhas e Insumos</span>
              <span>- R$ {rawMaterialsExpense.toFixed(2).replace('.', ',')}</span>
            </div>

            <div className="flex justify-between py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
              <span className="font-sans">(=) Lucro Bruto de Produção</span>
              <span>R$ {grossProfit.toFixed(2).replace('.', ',')}</span>
            </div>

            <div className="pt-2">
              <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
                Despesas Operacionais Fixas & Variáveis
              </span>
              <div className="space-y-1.5 pl-6 text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between py-1">
                  <span className="font-sans flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gás GLP de Fornos (P-45)</span>
                  </span>
                  <span>- R$ {gasExpense.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-sans flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Energia Elétrica (Câmaras frias e fornos)</span>
                  </span>
                  <span>- R$ {electricityExpense.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-sans flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>Outras despesas administrativas</span>
                  </span>
                  <span>- R$ {otherOperatingExpenses.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between py-3 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-extrabold text-sm border-t-2 border-amber-500 shadow-sm mt-3">
              <span className="font-sans">(=) LUCRO LÍQUIDO DO PERÍODO</span>
              <span className={netProfit >= 0 ? 'text-emerald-400 dark:text-emerald-600' : 'text-red-400 dark:text-red-600'}>
                R$ {netProfit.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Histórico Recente de Lançamentos - 5 colunas */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col">
          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
            Lançamentos Financeiros Recentes
          </h3>
          <p className="text-xs text-neutral-400 mb-4">Fluxo de caixa de entradas e saídas</p>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[420px] pr-1">
            {periodFinances.map((tx) => {
              const isIncome = tx.type === 'RECEITA';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-600'
                      }`}
                    >
                      {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                        {tx.description}
                      </p>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(tx.timestamp).toLocaleDateString('pt-BR')} {new Date(tx.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {tx.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold tabular-nums text-xs shrink-0 ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Lançar Nova Despesa */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                Lançar Despesa da Padaria
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Categoria de Custo:</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as FinancialTransaction['category'])}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                >
                  <option value="MATERIA_PRIMA">Matéria-Prima & Farinhas (CMV)</option>
                  <option value="GAS_FORNO">Gás do Forno (GLP / GNV)</option>
                  <option value="ENERGIA_ELETRICA">Energia Elétrica (Câmara fria)</option>
                  <option value="ALUGUEL">Aluguel do Ponto</option>
                  <option value="FOLHA_PAGAMENTO">Folha de Pagamento / Diárias</option>
                  <option value="MANUTENCAO">Manutenção de Masseira/Forno</option>
                  <option value="OUTROS">Outros Custos Operacionais</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Descrição:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de 50kg de Queijo Meia Cura"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Valor da Despesa (R$):</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Forma de Pagamento:</label>
                  <select
                    value={expPayment}
                    onChange={(e) => setExpPayment(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="DINHEIRO">Dinheiro do Caixa</option>
                    <option value="CARTAO">Cartão da Empresa</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Registrar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
