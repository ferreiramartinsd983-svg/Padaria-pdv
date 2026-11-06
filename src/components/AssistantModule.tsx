import React, { useRef, useState } from 'react';
import { Bot, Check, CircleStop, Mic, MicOff, Send, Settings2, Sparkles, X } from 'lucide-react';
import { Product, Recipe, Sale, VoiceNote } from '../types/padaria';
import { storage } from '../services/storage';

const ENDPOINT_KEY = 'padaria_master_assistant_endpoint_v1';
type AssistantAction = 'answer' | 'note' | 'sale' | 'stock_adjustment' | 'recipe';
type AssistantResult = {
  action: AssistantAction;
  response: string;
  note?: { title: string; text: string };
  sale?: { items: Array<{ productId: string; quantity: number }>; paymentMethod: string; customerName?: string };
  stockAdjustments?: Array<{ productId: string; operation: 'ENTRADA' | 'PERDA'; quantity: number; reason: string }>;
  recipe?: { name: string; category: Recipe['category']; yieldUnits: number; yieldDescription: string; preparationTimeMinutes: number; ingredients: Array<{ name: string; stockProductId?: string; quantity: number; unit: Recipe['ingredients'][number]['unit']; unitCost: number }>; instructions: string[] };
};
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
type PendingAction = { kind: 'note'; note: VoiceNote } | { kind: 'sale'; sale: NonNullable<AssistantResult['sale']> } | { kind: 'stock_adjustment'; adjustments: NonNullable<AssistantResult['stockAdjustments']> } | { kind: 'recipe'; recipe: NonNullable<AssistantResult['recipe']> };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> };
type RecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: RecognitionEvent) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type SpeechWindow = Window & { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
const money = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export const AssistantModule: React.FC<{ onProductsUpdated: () => void; onSaleCompleted: (sale: Sale) => void }> = ({ onProductsUpdated, onSaleCompleted }) => {
  const isAndroidApp = new URLSearchParams(window.location.search).get('platform') === 'android';
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem(ENDPOINT_KEY) || (isAndroidApp ? '' : window.location.origin));
  const [showSettings, setShowSettings] = useState(false);
  const [command, setCommand] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const recognitionRef = useRef<RecognitionLike | null>(null);

  const addMessage = (role: ChatMessage['role'], text: string) => setMessages(current => [...current, { id: `${Date.now()}_${Math.random()}`, role, text }]);
  const speakIntoCommand = () => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    const SpeechRecognition = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('O reconhecimento de voz não está disponível neste navegador. Você pode digitar o comando.'); return; }
    setError(''); setInterimText('');
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; recognition.continuous = false; recognition.interimResults = true;
    recognition.onresult = event => {
      let finalText = ''; let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInterimText(interim);
      if (finalText.trim()) setCommand(current => `${current}${current ? ' ' : ''}${finalText.trim()}`);
    };
    recognition.onerror = event => { setError(event.error === 'not-allowed' ? 'Permita o uso do microfone para falar com o assistente.' : `Falha no reconhecimento de voz (${event.error}).`); setIsListening(false); };
    recognition.onend = () => { setIsListening(false); setInterimText(''); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); } catch { setError('Não consegui iniciar o microfone. Tente novamente.'); }
  };

  const testConnection = async () => {
    const base = endpoint.trim().replace(/\/$/, '');
    if (!base) { setError('Informe primeiro o endereço do serviço de IA.'); setShowSettings(true); return; }
    setError(''); setConnectionStatus(''); setIsTestingConnection(true);
    try {
      const response = await fetch(`${base}/api/health`);
      let result: { ready?: boolean; error?: string } = {};
      let receivedJson = false;
      try { result = await response.json(); receivedJson = true; } catch { /* Render pode devolver HTML enquanto inicia. */ }
      if (result.ready) setConnectionStatus('Servidor acessível e chave Gemini configurada.');
      else if (response.status === 503 && receivedJson) setError(result.error || 'GEMINI_API_KEY não está configurada nas variáveis do Render.');
      else if (response.status === 503) setError('O Render ainda está iniciando ou indisponível. Aguarde alguns segundos e teste de novo.');
      else setError(result.error || `Não consegui validar o serviço (HTTP ${response.status}).`);
    } catch {
      setError('Não consegui alcançar o servidor. Confira a URL e se o serviço Render está ativo.');
    } finally { setIsTestingConnection(false); }
  };

  const askAssistant = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = command.trim();
    if (!text || isThinking) return;
    if (!endpoint.trim()) { setShowSettings(true); setError('Configure o endereço seguro do serviço de IA antes de enviar comandos.'); return; }
    setError(''); setCommand(''); setPending(null); addMessage('user', text); setIsThinking(true);
    try {
      const base = endpoint.trim().replace(/\/$/, '');
      const response = await fetch(`${base}/api/assistant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text, products: storage.getProducts().filter(p => !p.isArchived), recipes: storage.getRecipes() }),
      });
      let result: Record<string, unknown> = {};
      try { result = await response.json(); } catch { /* Render pode retornar HTML ao serviço indisponível. */ }
      if (!response.ok) {
        const serverMessage = typeof result.error === 'string' ? result.error : '';
        if (response.status === 503 && !serverMessage) throw new Error('Servidor do assistente indisponível (HTTP 503). Confira se o Render está ativo e tente novamente em alguns segundos.');
        throw new Error(serverMessage || `O serviço respondeu com erro HTTP ${response.status}. Abra as configurações e teste a conexão.`);
      }
      const interpreted = result as AssistantResult;
      addMessage('assistant', interpreted.response || 'Entendi.');
      setProducts(storage.getProducts());
      if (interpreted.action === 'note' && interpreted.note?.text?.trim()) {
        setPending({ kind: 'note', note: { id: `note_${Date.now()}`, title: interpreted.note.title?.trim() || 'Anotação por voz', text: interpreted.note.text.trim(), createdAt: Date.now(), updatedAt: Date.now() } });
      } else if (interpreted.action === 'sale' && interpreted.sale?.items?.length) {
        const missing = interpreted.sale.items.some(item => !products.find(product => product.id === item.productId) || !Number.isFinite(item.quantity) || item.quantity <= 0);
        if (missing) addMessage('assistant', 'Não encontrei um dos produtos com segurança. Diga o nome exato ou confira o cadastro no estoque.');
        else if (interpreted.sale.paymentMethod === 'MISTO') addMessage('assistant', 'Para dividir o pagamento, finalize essa venda pelo PDV, onde você pode informar cada valor.');
        else { setPaymentMethod(interpreted.sale.paymentMethod || 'DINHEIRO'); setPending({ kind: 'sale', sale: interpreted.sale }); }
      } else if (interpreted.action === 'stock_adjustment' && interpreted.stockAdjustments?.length) {
        const valid = interpreted.stockAdjustments.every(row => products.some(product => product.id === row.productId) && row.quantity > 0 && Boolean(row.reason?.trim()));
        if (!valid) addMessage('assistant', 'Faltou identificar produto, quantidade ou motivo para o ajuste. Peça novamente com esses dados.');
        else setPending({ kind: 'stock_adjustment', adjustments: interpreted.stockAdjustments });
      } else if (interpreted.action === 'recipe' && interpreted.recipe?.name && interpreted.recipe.yieldUnits > 0 && interpreted.recipe.ingredients?.length) {
        setPending({ kind: 'recipe', recipe: interpreted.recipe });
      } else if (interpreted.action === 'note') addMessage('assistant', 'Não consegui preparar o texto da anotação. Pode repetir?');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Não consegui falar com o assistente. Verifique a conexão e tente novamente.';
      setError(message);
      if (/503|temporariamente indisponível|GEMINI_API_KEY/i.test(message)) setShowSettings(true);
    } finally { setIsThinking(false); }
  };

  const confirmAction = () => {
    if (!pending) return;
    if (pending.kind === 'note') {
      const all = [pending.note, ...storage.getVoiceNotes()]; storage.saveVoiceNotes(all); addMessage('assistant', `Anotação “${pending.note.title}” salva.`);
    }
    if (pending.kind === 'sale') {
      const cash = storage.getCashRegister();
      if (!cash || cash.status !== 'OPEN') { setError('Abra o caixa no PDV antes de confirmar a venda. Nenhuma venda foi registrada.'); return; }
      const items = pending.sale.items.map(item => {
        const product = storage.getProducts().find(p => p.id === item.productId)!;
        return { productId: product.id, productName: product.name, quantity: item.quantity, unitPrice: product.salePrice, totalPrice: product.salePrice * item.quantity, isWeighed: product.isWeighed };
      });
      const unavailable = items.find(item => { const product = storage.getProducts().find(p => p.id === item.productId); return !product || product.stockQuantity < item.quantity; });
      if (unavailable) { setError(`Estoque insuficiente para ${unavailable.productName}. Nenhuma venda foi registrada.`); return; }
      const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const sale: Sale = { id: `sale_${Date.now()}`, code: String(Math.floor(100000 + Math.random() * 900000)), timestamp: Date.now(), items, subtotal: total, discount: 0, total, paymentMethod: paymentMethod as Sale['paymentMethod'], amountPaid: total, changeAmount: 0, customerName: pending.sale.customerName?.trim() || undefined, cashRegisterId: cash.id, isSynced: false };
      storage.saveSale(sale); setProducts(storage.getProducts()); onProductsUpdated(); onSaleCompleted(sale); addMessage('assistant', `Venda #${sale.code} registrada: ${money(total)}.`);
    }
    if (pending.kind === 'stock_adjustment') {
      const updated = storage.getProducts();
      const requestedLosses = new Map<string, number>();
      for (const row of pending.adjustments) if (row.operation === 'PERDA') requestedLosses.set(row.productId, (requestedLosses.get(row.productId) || 0) + row.quantity);
      for (const [productId, loss] of requestedLosses) {
        const product = updated.find(item => item.id === productId);
        if (!product || product.stockQuantity < loss) { setError(`Estoque insuficiente para registrar a perda de ${product?.name || 'um produto'}. Nenhum ajuste foi salvo.`); return; }
      }
      for (const row of pending.adjustments) {
        const product = updated.find(item => item.id === row.productId)!;
        product.stockQuantity += row.operation === 'ENTRADA' ? row.quantity : -row.quantity; product.updatedAt = Date.now();
        storage.logAction(row.operation === 'PERDA' ? 'PERDA' : 'ENTRADA_ESTOQUE', `${row.quantity} ${product.unit} · ${product.name} · ${row.reason}`, 'Assistente confirmado pelo operador');
      }
      storage.saveProducts(updated); setProducts(updated); onProductsUpdated(); addMessage('assistant', 'Ajuste de estoque registrado após sua confirmação.');
    }
    if (pending.kind === 'recipe') {
      const draft = pending.recipe;
      if (!draft.name.trim() || !Number.isFinite(draft.yieldUnits) || draft.yieldUnits <= 0 || draft.ingredients.some(item => !item.name.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitCost) || item.unitCost < 0)) { setError('A ficha técnica tem campos incompletos ou quantidades inválidas. Revise o pedido e tente novamente.'); return; }
      const ingredients = draft.ingredients.map(ingredient => ({ ...ingredient, stockProductId: ingredient.stockProductId || undefined, totalCost: ingredient.quantity * ingredient.unitCost }));
      const rawIngredientsCost = ingredients.reduce((sum, ingredient) => sum + ingredient.totalCost, 0);
      const overheadMarkupPercent = 15; const totalBatchCost = rawIngredientsCost * (1 + overheadMarkupPercent / 100);
      const unitCost = totalBatchCost / draft.yieldUnits; const targetMarginPercent = 65;
      const suggestedSalePrice = unitCost / (1 - targetMarginPercent / 100);
      const recipe: Recipe = { id: `rec_${Date.now()}`, name: draft.name.trim(), category: draft.category, yieldUnits: draft.yieldUnits, yieldDescription: draft.yieldDescription || `${draft.yieldUnits} unidades`, preparationTimeMinutes: Math.max(1, draft.preparationTimeMinutes || 60), ingredients, rawIngredientsCost, overheadMarkupPercent, totalBatchCost, unitCost, targetMarginPercent, suggestedSalePrice, actualSalePrice: Math.ceil(suggestedSalePrice * 10) / 10, instructions: draft.instructions.filter(Boolean) };
      storage.saveRecipes([recipe, ...storage.getRecipes()]); storage.logAction('FICHA TÉCNICA', `Criada pelo assistente: ${recipe.name}`, 'Assistente confirmado pelo operador'); addMessage('assistant', `Ficha técnica “${recipe.name}” salva. Confira os custos e vínculos de estoque antes de produzir.`);
    }
    setPending(null); setError('');
  };

  const cancelPending = () => { setPending(null); setError(''); };
  return <div className="mx-auto w-full max-w-4xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-extrabold"><Bot className="h-6 w-6 text-amber-500"/>Assistente da padaria</h2><p className="mt-1 text-sm text-neutral-500">Fale naturalmente para anotar, vender, ajustar estoque, criar fichas ou tirar dúvidas.</p></div><button onClick={()=>setShowSettings(value=>!value)} aria-label="Configurações do assistente" className="rounded-lg border p-2 dark:border-neutral-700"><Settings2 className="h-4 w-4"/></button></header>
    {showSettings&&<section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><label className="block text-sm font-semibold">Endereço seguro do serviço de IA<input value={endpoint} onChange={event=>{setEndpoint(event.target.value);setConnectionStatus('');}} placeholder="https://seu-servico.onrender.com" className="mt-1 w-full rounded-lg border bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800"/></label><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="max-w-xl text-xs text-neutral-500">Informe a URL base do Render, sem /api/assistant. A chave Gemini fica somente nas variáveis do servidor; nunca cole aqui.</p><div className="flex gap-2"><button onClick={()=>void testConnection()} disabled={isTestingConnection} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">{isTestingConnection?'Testando…':'Testar conexão'}</button><button onClick={()=>{const cleaned=endpoint.trim().replace(/\/$/,'');if(cleaned){try{const url=new URL(cleaned);if(url.protocol!=='https:'&&url.hostname!=='localhost'&&url.hostname!=='127.0.0.1'){setError('Use uma URL HTTPS para proteger a conexão com o serviço.');return;}localStorage.setItem(ENDPOINT_KEY,cleaned);}catch{setError('Informe uma URL válida para o serviço de IA.');return;}}else localStorage.removeItem(ENDPOINT_KEY);setEndpoint(cleaned);setShowSettings(false);setError('');}}>Salvar endereço</button></div></div>{connectionStatus&&<p role="status" className="mt-2 text-sm font-semibold text-emerald-700">{connectionStatus}</p>}</section>}
    <section className="min-h-56 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">{!messages.length&&<div className="flex min-h-48 flex-col items-center justify-center text-center"><Sparkles className="mb-3 h-8 w-8 text-amber-500"/><p className="font-bold">Como posso ajudar sua padaria?</p><p className="mt-1 max-w-lg text-sm text-neutral-500">Exemplos: “Anote que a encomenda da Ana é para sábado”, “venda 2 cafés no Pix”, “deu perda de 3 coxinhas, motivo: queimaram”, “me ajuda a montar uma ficha de pão de queijo” ou “quais produtos estão acabando?”.</p></div>}{messages.map(message=><div key={message.id} className={`flex ${message.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${message.role==='user'?'bg-amber-500 text-white':'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100'}`}>{message.text}</div></div>)}{isThinking&&<p className="text-sm text-neutral-500">Pensando…</p>}</section>
    {pending&&<section className="space-y-3 rounded-2xl border-2 border-amber-400 bg-amber-50/70 p-4 dark:bg-amber-950/20"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">Confira antes de confirmar</h3><p className="text-xs text-neutral-600 dark:text-neutral-400">O assistente só preparou a ação; nada foi gravado ainda.</p></div><button onClick={cancelPending} aria-label="Cancelar ação" className="rounded p-1"><X className="h-4 w-4"/></button></div>
      {pending.kind==='note'&&<div className="rounded-xl bg-white p-3 dark:bg-neutral-900"><strong className="block text-sm">{pending.note.title}</strong><p className="mt-1 whitespace-pre-wrap text-sm">{pending.note.text}</p></div>}
      {pending.kind==='sale'&&<div className="space-y-2 rounded-xl bg-white p-3 dark:bg-neutral-900">{pending.sale.items.map((item,index)=>{const product=products.find(p=>p.id===item.productId)!;return <div key={index} className="flex justify-between text-sm"><span>{item.quantity} {product.unit} · {product.name}</span><b>{money(item.quantity*product.salePrice)}</b></div>})}<label className="mt-2 block text-sm">Pagamento<select value={paymentMethod} onChange={event=>setPaymentMethod(event.target.value)} className="mt-1 block w-full rounded-lg border p-2 dark:bg-neutral-800"><option value="DINHEIRO">Dinheiro</option><option value="PIX">Pix</option><option value="CARTAO_DEBITO">Cartão de débito</option><option value="CARTAO_CREDITO">Cartão de crédito</option><option value="FIADO">Fiado</option></select></label><p className="text-right font-bold">Total: {money(pending.sale.items.reduce((sum,item)=>sum+item.quantity*(products.find(p=>p.id===item.productId)?.salePrice||0),0))}</p></div>}
      {pending.kind==='stock_adjustment'&&<div className="space-y-2 rounded-xl bg-white p-3 dark:bg-neutral-900">{pending.adjustments.map((row,index)=>{const product=products.find(p=>p.id===row.productId);return <div key={index} className="text-sm"><b>{row.operation==='PERDA'?'Perda':'Entrada'}: {row.quantity} {product?.unit} · {product?.name||'Produto'}</b><p className="text-xs text-neutral-500">Motivo: {row.reason}</p></div>})}</div>}
      {pending.kind==='recipe'&&<div className="space-y-2 rounded-xl bg-white p-3 dark:bg-neutral-900"><div><b>{pending.recipe.name}</b><p className="text-xs text-neutral-500">Rendimento: {pending.recipe.yieldDescription} · {pending.recipe.preparationTimeMinutes} min</p></div>{pending.recipe.ingredients.map((ingredient,index)=><div key={index} className="flex justify-between gap-2 text-sm"><span>{ingredient.quantity} {ingredient.unit} · {ingredient.name}</span><span>{ingredient.stockProductId&&products.find(p=>p.id===ingredient.stockProductId)?'Vinculado ao estoque':'Custo '+money(ingredient.unitCost)+' estimado'}</span></div>)}<p className="text-xs text-neutral-500">A ficha será salva com margem alvo de 65%. Confira custos e ingredientes antes de usar.</p></div>}
      <div className="flex justify-end gap-2"><button onClick={cancelPending} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancelar</button><button onClick={confirmAction} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Check className="h-4 w-4"/>Confirmar e salvar</button></div>
    </section>}
    <form onSubmit={askAssistant} className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-end gap-2"><textarea rows={2} maxLength={1600} value={command} onChange={event=>setCommand(event.target.value)} placeholder="Digite ou fale o que você precisa..." className="min-h-14 flex-1 resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"/><button type="button" onClick={speakIntoCommand} aria-label={isListening?'Parar de ouvir':'Falar comando'} className={`rounded-xl p-3 text-white ${isListening?'bg-red-600':'bg-amber-500'}`}>{isListening?<MicOff className="h-5 w-5"/>:<Mic className="h-5 w-5"/>}</button><button type="submit" disabled={!command.trim()||isThinking} aria-label="Enviar comando" className="rounded-xl bg-neutral-900 p-3 text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"><Send className="h-5 w-5"/></button></div>{interimText&&<p className="text-xs text-amber-700">Ouvindo: {interimText}</p>}{isListening&&<button type="button" onClick={()=>recognitionRef.current?.stop()} className="flex items-center gap-1 text-xs font-semibold text-red-600"><CircleStop className="h-4 w-4"/>Parar gravação</button>}</form>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
    <p className="text-xs text-neutral-500">Comandos com escrita no sistema só são executados depois da sua confirmação. A IA precisa de internet; o navegador pode enviar o áudio ao serviço de reconhecimento de voz. Evite ditar dados bancários ou informações pessoais desnecessárias.</p>
  </div>;
};
