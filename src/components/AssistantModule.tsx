import React, { useState } from 'react';
import { Bot, Check, Circle, Clock3, ListTodo, PackageMinus, Send, ShoppingCart, Trash2, X } from 'lucide-react';
import { Product, Sale, TaskItem } from '../types/padaria';
import { storage } from '../services/storage';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
type PendingAction =
  | { kind: 'sale'; product: Product; quantity: number; paymentMethod: Sale['paymentMethod'] }
  | { kind: 'stock_exit'; product: Product; quantity: number; reason: string };
type AssistantProps = { onProductsUpdated: () => void; onSaleCompleted: (sale: Sale) => void };

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const money = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const sortedTasks = (tasks: TaskItem[]) => [...tasks].sort((a, b) => (a.completedAt ? 1 : 0) - (b.completedAt ? 1 : 0) || b.createdAt - a.createdAt);
const formatDue = (dueAt?: number) => dueAt ? new Date(dueAt).toLocaleDateString('pt-BR') : '';

export const AssistantModule: React.FC<AssistantProps> = ({ onProductsUpdated, onSaleCompleted }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => sortedTasks(storage.getTasks()));
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts().filter(product => !product.isArchived));
  const [command, setCommand] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const say = (text: string) => setMessages(current => [...current, { id: `${Date.now()}_${Math.random()}`, role: 'assistant', text }]);
  const persistTasks = (updated: TaskItem[]) => {
    const sorted = sortedTasks(updated);
    storage.saveTasks(sorted);
    setTasks(sorted);
  };
  const findProduct = (query: string): Product[] => {
    const wanted = normalize(query);
    const exact = products.filter(product => normalize(product.name) === wanted);
    if (exact.length) return exact;
    return products.filter(product => normalize(product.name).startsWith(wanted) || wanted.startsWith(normalize(product.name)));
  };
  const taskByNumber = (number: number) => tasks.filter(task => !task.completedAt)[number - 1];
  const finishTask = (task: TaskItem) => {
    persistTasks(tasks.map(item => item.id === task.id ? { ...item, completedAt: Date.now() } : item));
    setSuccess(`Tarefa concluída: ${task.title}`);
  };
  const deleteTask = (task: TaskItem) => {
    persistTasks(tasks.filter(item => item.id !== task.id));
    setSuccess(`Tarefa removida: ${task.title}`);
  };

  const runCommand = (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = command.trim();
    if (!text) return;
    setCommand(''); setError(''); setSuccess(''); setPending(null);
    setMessages(current => [...current, { id: `${Date.now()}_user`, role: 'user', text }]);
    const normalized = normalize(text);

    if (/^(ajuda|comandos|como usar|\?)$/.test(normalized)) {
      say('Comandos: “criar tarefa: conferir validade amanhã”, “listar tarefas”, “concluir tarefa 1”, “vender 2 pão francês no Pix” ou “saída 1 bolo, motivo: avariado”.');
      return;
    }

    if (/^(listar|mostrar|ver|minhas)?\s*tarefas?(\s+pendentes)?$/.test(normalized) || normalized === 'pendencias') {
      const pendingTasks = tasks.filter(task => !task.completedAt);
      say(pendingTasks.length ? `Você tem ${pendingTasks.length} tarefa(s) pendente(s). Confira a lista abaixo e use “concluir tarefa 1” para marcar uma como feita.` : 'Você não tem tarefas pendentes.');
      return;
    }
    if (/^(?:criar|adicionar|nova)\s+tarefa\s*(?::|-)?\s*(.+)$/i.test(text) || /^(?:lembrar|lembrete)\s+(?:de\s+)?(.+)$/i.test(text)) {
      const match = text.match(/^(?:criar|adicionar|nova)\s+tarefa\s*(?::|-)?\s*(.+)$/i) || text.match(/^(?:lembrar|lembrete)\s+(?:de\s+)?(.+)$/i);
      let title = match?.[1]?.trim() || '';
      let dueAt: number | undefined;
      const dueMatch = title.match(/\s+(hoje|amanh[aã])\s*$/i);
      if (dueMatch) {
        const dueDate = new Date();
        if (normalize(dueMatch[1]) === 'amanha') dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(23, 59, 59, 999);
        dueAt = dueDate.getTime();
        title = title.slice(0, dueMatch.index).trim();
      }
      if (!title) { say('Escreva o que precisa fazer. Exemplo: “criar tarefa: comprar farinha amanhã”.'); return; }
      const task: TaskItem = { id: `task_${Date.now()}`, title, createdAt: Date.now(), dueAt };
      persistTasks([task, ...tasks]);
      say(`Tarefa criada: ${title}${dueAt ? ` · prazo ${formatDue(dueAt)}` : ''}.`);
      return;
    }
    if (/^(concluir|feito|finalizar)(\s+tarefa)?\s+\d+$/.test(normalized)) {
      const number = Number(normalized.match(/\d+$/)?.[0]);
      const task = taskByNumber(number);
      if (!task) { say(`Não achei a tarefa pendente ${number}. Digite “listar tarefas” para ver os números.`); return; }
      finishTask(task); say(`Marquei “${task.title}” como concluída.`); return;
    }
    if (/^(apagar|excluir|remover)(\s+tarefa)?\s+\d+$/.test(normalized)) {
      const number = Number(normalized.match(/\d+$/)?.[0]);
      const task = taskByNumber(number);
      if (!task) { say(`Não achei a tarefa pendente ${number}. Digite “listar tarefas” para ver os números.`); return; }
      deleteTask(task); say(`Removi “${task.title}”.`); return;
    }
    if (/^(limpar|apagar|excluir) tarefas concluidas$/.test(normalized)) {
      const remaining = tasks.filter(task => !task.completedAt);
      persistTasks(remaining); say('Removi as tarefas concluídas.'); return;
    }

    const saleMatch = text.match(/^(?:vender|venda|registrar venda)\s+(\d+(?:[,.]\d+)?)\s+(.+)$/i);
    if (saleMatch) {
      let query = saleMatch[2].trim();
      let paymentMethod: Sale['paymentMethod'] = 'DINHEIRO';
      const paymentMatch = query.match(/\s+(?:no|na|em|via)\s+(dinheiro|pix|cart[aã]o(?:\s+de)?\s+(?:cr[eé]dito|d[eé]bito)|cr[eé]dito|d[eé]bito|fiado)$/i);
      if (paymentMatch) {
        const payment = normalize(paymentMatch[1]);
        paymentMethod = payment === 'pix' ? 'PIX' : payment === 'fiado' ? 'FIADO' : payment.includes('credito') ? 'CARTAO_CREDITO' : payment.includes('debito') ? 'CARTAO_DEBITO' : 'DINHEIRO';
        query = query.slice(0, paymentMatch.index).trim();
      }
      const quantity = Number(saleMatch[1].replace(',', '.'));
      const matches = findProduct(query);
      if (!Number.isFinite(quantity) || quantity <= 0) { say('Informe uma quantidade maior que zero. Exemplo: “vender 2 pão francês no Pix”.'); return; }
      if (matches.length !== 1) { say(matches.length ? `Encontrei mais de um produto parecido com “${query}”. Digite o nome exato do produto.` : `Não encontrei “${query}” no estoque.`); return; }
      const product = matches[0];
      if (product.stockQuantity < quantity) { say(`Estoque insuficiente de ${product.name}: há ${product.stockQuantity} ${product.unit}.`); return; }
      const cash = storage.getCashRegister();
      if (!cash || cash.status !== 'OPEN') { say('Abra o caixa antes de registrar uma venda pelo assistente.'); return; }
      setPending({ kind: 'sale', product, quantity, paymentMethod });
      say(`Preparei a venda de ${quantity} ${product.unit} de ${product.name}. Confira e confirme abaixo.`);
      return;
    }

    const exitMatch = text.match(/^(?:(?:registrar|dar)\s+)?(?:sa[ií]da|baixa|perda)(?:\s+de)?\s+(\d+(?:[,.]\d+)?)\s+(.+)$/i);
    if (exitMatch) {
      let details = exitMatch[2].trim();
      const reasonMatch = details.match(/\s*(?:[,;]\s*)?(?:motivo|porque|por que)\s*[:\-]?\s*(.+)$/i);
      const reason = reasonMatch?.[1]?.trim() || '';
      if (reasonMatch) details = details.slice(0, reasonMatch.index).trim().replace(/[,;]$/, '').trim();
      const quantity = Number(exitMatch[1].replace(',', '.'));
      if (!reason) { say('Informe o motivo da saída. Exemplo: “saída 2 pão francês, motivo: queimou”.'); return; }
      const matches = findProduct(details);
      if (matches.length !== 1) { say(matches.length ? `Encontrei mais de um produto parecido com “${details}”. Digite o nome exato.` : `Não encontrei “${details}” no estoque.`); return; }
      const product = matches[0];
      if (!Number.isFinite(quantity) || quantity <= 0) { say('Informe uma quantidade maior que zero.'); return; }
      if (product.stockQuantity < quantity) { say(`Estoque insuficiente de ${product.name}: há ${product.stockQuantity} ${product.unit}.`); return; }
      setPending({ kind: 'stock_exit', product, quantity, reason });
      say(`Preparei a saída de ${quantity} ${product.unit} de ${product.name} pelo motivo “${reason}”. Confira e confirme abaixo.`);
      return;
    }

    say('Não reconheci esse comando. Toque em “Ver comandos” para ver exemplos prontos.');
  };

  const confirmAction = () => {
    if (!pending) return;
    const currentProducts = storage.getProducts();
    const product = currentProducts.find(item => item.id === pending.product.id);
    if (!product || product.stockQuantity < pending.quantity) {
      setError(`O estoque de ${pending.product.name} mudou. Confira o estoque e tente novamente.`);
      setPending(null); setProducts(currentProducts.filter(item => !item.isArchived)); return;
    }
    if (pending.kind === 'stock_exit') {
      const updated = currentProducts.map(item => item.id === product.id ? { ...item, stockQuantity: item.stockQuantity - pending.quantity, updatedAt: Date.now() } : item);
      storage.saveProducts(updated);
      storage.logAction('PERDA', `${pending.quantity} ${product.unit} · ${product.name} · ${pending.reason}`, 'Assistente local');
      setProducts(updated.filter(item => !item.isArchived)); onProductsUpdated();
      setSuccess(`Saída registrada: ${pending.quantity} ${product.unit} de ${product.name}.`);
    } else {
      const cash = storage.getCashRegister();
      if (!cash || cash.status !== 'OPEN') { setError('O caixa foi fechado. Abra o caixa e tente registrar a venda novamente.'); setPending(null); return; }
      const total = product.salePrice * pending.quantity;
      const sale: Sale = {
        id: `sale_${Date.now()}`, code: String(Math.floor(100000 + Math.random() * 900000)), timestamp: Date.now(),
        items: [{ productId: product.id, productName: product.name, quantity: pending.quantity, unitPrice: product.salePrice, totalPrice: total, isWeighed: product.isWeighed }],
        subtotal: total, discount: 0, total, paymentMethod: pending.paymentMethod, amountPaid: total, changeAmount: 0,
        cashRegisterId: cash.id, isSynced: false,
      };
      storage.saveSale(sale); setProducts(storage.getProducts().filter(item => !item.isArchived)); onProductsUpdated(); onSaleCompleted(sale);
      setSuccess(`Venda ${sale.code} registrada: ${money(total)}.`);
    }
    setPending(null);
  };

  const examples = [
    { label: 'Criar tarefa', command: 'criar tarefa: conferir validade amanhã' },
    { label: 'Listar tarefas', command: 'listar tarefas' },
    { label: 'Vender produto', command: `vender 2 ${products[0]?.name || 'pão francês'} no Pix` },
    { label: 'Saída de estoque', command: `saída 1 ${products[0]?.name || 'pão francês'}, motivo: avariado` },
  ];

  return <div className="mx-auto w-full max-w-4xl space-y-5">
    <header className="flex items-center gap-3"><div className="rounded-xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Bot className="h-6 w-6"/></div><div><h2 className="text-xl font-extrabold">Assistente de tarefas</h2><p className="mt-1 text-sm text-neutral-500">Comandos simples para tarefas, vendas e saídas de estoque, salvos neste aparelho.</p></div></header>
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center gap-2"><ListTodo className="h-5 w-5 text-amber-500"/><h3 className="font-bold">Comandos rápidos</h3></div>
      <div className="flex flex-wrap gap-2">{examples.map(example => <button key={example.label} type="button" onClick={() => setCommand(example.command)} className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold hover:border-amber-400 hover:bg-amber-50 dark:border-neutral-700 dark:hover:bg-neutral-800">{example.label}</button>)}</div>
      <form onSubmit={runCommand} className="mt-4 flex gap-2"><input value={command} onChange={event => setCommand(event.target.value)} placeholder="Ex.: criar tarefa: comprar farinha amanhã" aria-label="Comando do assistente" className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"/><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600"><Send className="h-4 w-4"/><span className="hidden sm:inline">Enviar</span></button></form>
      <details className="mt-3 text-xs text-neutral-500"><summary className="cursor-pointer font-semibold">Ver comandos</summary><ul className="mt-2 list-inside list-disc space-y-1"><li>criar tarefa: limpar vitrine amanhã</li><li>listar tarefas · concluir tarefa 1 · apagar tarefa 1</li><li>vender 2 pão francês no Pix</li><li>saída 1 bolo, motivo: avariado</li></ul></details>
    </section>
    {(error || success) && <p role="status" className={`rounded-xl p-3 text-sm ${error ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{error || success}</p>}
    {messages.length > 0 && <section aria-live="polite" className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">{messages.slice(-8).map(message => <div key={message.id} className={`rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'ml-8 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100' : 'mr-8 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100'}`}>{message.text}</div>)}</section>}
    {pending && <section className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/20"><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 font-bold">{pending.kind === 'sale' ? <ShoppingCart className="h-5 w-5"/> : <PackageMinus className="h-5 w-5"/>}{pending.kind === 'sale' ? 'Confirmar venda' : 'Confirmar saída de estoque'}</div><button onClick={() => setPending(null)} aria-label="Cancelar" className="rounded p-1"><X className="h-4 w-4"/></button></div><div className="mt-2 text-sm">{pending.quantity} {pending.product.unit} · {pending.product.name}{pending.kind === 'sale' ? <><span> · {pending.paymentMethod === 'PIX' ? 'Pix' : pending.paymentMethod === 'DINHEIRO' ? 'Dinheiro' : pending.paymentMethod.replace('CARTAO_', 'Cartão ').replace('_', ' ')}</span><b className="ml-2">{money(pending.product.salePrice * pending.quantity)}</b></> : <p className="mt-1 text-neutral-600 dark:text-neutral-300">Motivo: {pending.reason}</p>}</div><button onClick={confirmAction} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white"><Check className="h-4 w-4"/>Confirmar e registrar</button></section>}
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><ListTodo className="h-5 w-5 text-amber-500"/>Minhas tarefas</h3><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">{tasks.filter(task => !task.completedAt).length} pendentes</span></div>{tasks.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-center text-sm text-neutral-500">Nenhuma tarefa ainda. Digite “criar tarefa: ...” para começar.</p> : <div className="space-y-2">{tasks.map((task, index) => <article key={task.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800"><button onClick={() => task.completedAt ? setSuccess('Esta tarefa já está concluída.') : finishTask(task)} aria-label={task.completedAt ? 'Tarefa concluída' : 'Concluir tarefa'} className={task.completedAt ? 'text-emerald-600' : 'text-neutral-400 hover:text-emerald-600'}>{task.completedAt ? <Check className="h-5 w-5"/> : <Circle className="h-5 w-5"/>}</button><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${task.completedAt ? 'text-neutral-400 line-through' : ''}`}>{index + 1}. {task.title}</p>{task.dueAt && <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500"><Clock3 className="h-3 w-3"/>Prazo: {formatDue(task.dueAt)}</p>}</div><button onClick={() => deleteTask(task)} aria-label="Apagar tarefa" className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></article>)}</div>}</section>
  </div>;
};
