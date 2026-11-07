import React, { useState, useEffect } from 'react';
import { Header, ViewMode } from './components/Header';
import { PdvModule } from './components/PdvModule';
import { StockModule } from './components/StockModule';
import { RecipesModule } from './components/RecipesModule';
import { FinanceModule } from './components/FinanceModule';
import { CashRegisterModule } from './components/CashRegisterModule';
import { OrdersModule } from './components/OrdersModule';
import { SyncModule } from './components/SyncModule';
import { AndroidProjectExplorer } from './components/AndroidProjectExplorer';
import { OperationsModule } from './components/OperationsModule';
import { VoiceNotesModule } from './components/VoiceNotesModule';
import { AssistantModule } from './components/AssistantModule';
import { ResetDataModal } from './components/ResetDataModal';
import { Product, Sale } from './types/padaria';
import { storage } from './services/storage';
import { ArrowRight, ArrowLeft, Bot, ChefHat, MessageCircle, Package, ShoppingCart, Sparkles, Store, Mic2, X } from 'lucide-react';
import frenchBreadImage from './assets/images/bakery_pao_frances_1793807977222.jpg';
import cheeseBreadImage from './assets/images/bakery_pao_de_queijo_1793807977568.jpg';
import cakeImage from './assets/images/bakery_bolo_artesanal_1793807978147.jpg';
import coffeeImage from './assets/images/bakery_cafe_espresso_1793807978740.jpg';


const WelcomeScreen: React.FC<{ onEnter: () => void }> = ({ onEnter }) => (
  <div className="welcome-screen relative min-h-[100svh] overflow-hidden bg-[#21150f] text-white">
    <div aria-hidden="true" className="welcome-glow pointer-events-none absolute inset-0"/>
    <div aria-hidden="true" className="welcome-orbit welcome-orbit-one pointer-events-none absolute -right-28 -top-40 h-[34rem] w-[34rem] rounded-full border border-amber-100/10"/>
    <div aria-hidden="true" className="welcome-orbit welcome-orbit-two pointer-events-none absolute -bottom-72 -left-24 h-[42rem] w-[42rem] rounded-full border border-amber-100/10"/>
    <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-700 shadow-xl shadow-orange-950/40"><Store className="h-5 w-5"/></div><div><p className="text-sm font-black tracking-[0.17em]">PADARIA<span className="text-amber-300">MASTER</span></p><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Gestão com sabor</p></div></div>
        <span className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 backdrop-blur sm:flex"><Sparkles className="h-4 w-4 text-amber-300"/>Seu negócio, em boas mãos</span>
      </header>

      <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <section className="welcome-copy relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-100"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-300"/>Mais sabor. Menos correria.</div>
          <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">O seu dia começa no forno.<br/><span className="welcome-headline text-amber-300">A gestão decola daqui.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-orange-50/70 sm:text-lg sm:leading-8">Caixa, estoque, encomendas e produção em um só lugar. Feito para a rotina real de quem acorda cedo e faz coisa boa acontecer.</p>
          <button onClick={onEnter} className="welcome-cta group mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 px-7 py-4 text-base font-black text-[#2b180b] shadow-[0_14px_45px_rgba(234,142,47,0.28)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(234,142,47,0.38)] active:translate-y-0 sm:w-auto"><span>Entrar na Padaria Master</span><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1"/></button>
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[{label:'Vendas',Icon:ShoppingCart},{label:'Estoque',Icon:Package},{label:'Produção',Icon:ChefHat},{label:'Assistente',Icon:Bot}].map(({label,Icon})=><div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 text-xs font-semibold text-white/75 backdrop-blur"><Icon className="h-4 w-4 shrink-0 text-amber-300"/>{label}</div>)}
          </div>
        </section>

        <section aria-label="Vitrine da Padaria Master" className="welcome-showcase relative mx-auto w-full max-w-[34rem]">
          <div className="welcome-photo-grid grid grid-cols-2 gap-3 sm:gap-4">
            <figure className="welcome-photo welcome-photo-a relative overflow-hidden rounded-[1.75rem] border border-white/15"><img src={frenchBreadImage} alt="Pães fresquinhos saindo do forno" className="h-full min-h-40 w-full object-cover sm:min-h-56"/><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-12 text-sm font-bold">Feito fresquinho</figcaption></figure>
            <figure className="welcome-photo welcome-photo-b relative mt-8 overflow-hidden rounded-[1.75rem] border border-white/15"><img src={cakeImage} alt="Bolo artesanal da padaria" className="h-full min-h-40 w-full object-cover sm:min-h-56"/><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-12 text-sm font-bold">Cada detalhe conta</figcaption></figure>
            <figure className="welcome-photo welcome-photo-c relative -mt-8 overflow-hidden rounded-[1.75rem] border border-white/15"><img src={cheeseBreadImage} alt="Pão de queijo dourado" className="h-full min-h-40 w-full object-cover sm:min-h-56"/><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-12 text-sm font-bold">O cheirinho que conquista</figcaption></figure>
            <figure className="welcome-photo welcome-photo-d relative overflow-hidden rounded-[1.75rem] border border-white/15"><img src={coffeeImage} alt="Café espresso servido na padaria" className="h-full min-h-40 w-full object-cover sm:min-h-56"/><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-12 text-sm font-bold">Um bom dia em cada xícara</figcaption></figure>
          </div>
          <div className="welcome-float absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl border border-white/25 bg-[#2c1c14]/90 px-4 py-3 shadow-2xl backdrop-blur-xl"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-[#2b180b]"><Mic2 className="h-5 w-5"/></div><div><p className="text-sm font-extrabold">Sua padaria no ritmo</p><p className="text-[11px] text-white/60">Uma equipe inteira no seu bolso</p></div></div>
        </section>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-[11px] font-medium text-white/40"><span>Padaria Master · Gestão que acompanha o seu talento</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>Pronto para começar</span></footer>
    </div>
  </div>
);

export default function App() {
  const isAndroidApp = new URLSearchParams(window.location.search).get('platform') === 'android';
  const [showWelcome, setShowWelcome] = useState(true);
  const [isPdvStandalone, setIsPdvStandalone] = useState(false);
  const [isAttendantOpen, setIsAttendantOpen] = useState(false);
  const [isResetDataOpen, setIsResetDataOpen] = useState(false);
  const [previousTab, setPreviousTab] = useState<string>('pdv');
  const [currentTab, setCurrentTab] = useState<string>('pdv');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());

  // Atualizar tema na tag <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Listener de rede online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefreshProducts = () => {
    setProducts(storage.getProducts());
  };

  const handleSaleCompleted = (sale: Sale) => {
    handleRefreshProducts();
  };

  const handleSelectTab = (tab: string) => {
    if (tab === 'pdv') {
      setPreviousTab(currentTab);
      setCurrentTab('pdv');
      setIsPdvStandalone(true);
      return;
    }
    setCurrentTab(tab);
    setIsPdvStandalone(false);
  };

  const handleExitStandalonePdv = () => {
    setIsPdvStandalone(false);
    if (previousTab !== 'pdv') setCurrentTab(previousTab);
  };

  if (showWelcome) return <WelcomeScreen onEnter={() => setShowWelcome(false)} />;

  if (isPdvStandalone) return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-[#fffaf3]/95 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95 sm:px-6">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 text-white shadow-lg"><Store className="h-5 w-5"/></div><div><p className="flex items-center gap-2 font-extrabold">PDV · Frente de Caixa <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">2.9</span></p><p className="text-[11px] text-neutral-500">Modo de venda dedicado</p></div></div>
        <button onClick={handleExitStandalonePdv} aria-label="Voltar ao sistema" className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 sm:px-4"><ArrowLeft className="h-4 w-4"/><span className="hidden sm:inline">Voltar ao sistema</span></button>
      </div>
      <main className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-6"><PdvModule products={products} onProductsUpdated={handleRefreshProducts} onSaleCompleted={handleSaleCompleted} onExitStandalone={handleExitStandalonePdv} /></main>
      <button onClick={() => setIsAttendantOpen(true)} className="fixed bottom-5 right-4 z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-500 px-4 text-sm font-extrabold text-white shadow-xl shadow-amber-900/30 hover:bg-amber-600 sm:bottom-6 sm:right-6"><MessageCircle className="h-5 w-5"/><span>Falar com atendente</span></button>
      {isAttendantOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) setIsAttendantOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Atendente virtual" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-neutral-900 sm:rounded-3xl"><header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800"><div><h2 className="font-extrabold">Atendente virtual</h2><p className="text-xs text-neutral-500">Fale ou digite um comando</p></div><button onClick={() => setIsAttendantOpen(false)} aria-label="Fechar atendente" className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-5 w-5"/></button></header><div className="overflow-y-auto p-4"><AssistantModule onProductsUpdated={handleRefreshProducts} onSaleCompleted={handleSaleCompleted} /></div></section></div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        isOnline={isOnline}
        isAndroidApp={isAndroidApp}
        onOpenResetData={() => setIsResetDataOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col items-center">
        {/* Device Wrapper baseado no modo selecionado (Desktop, Tablet Horizontal ou Smartphone Android) */}
        {viewMode === 'desktop' && (
          <div className="w-full">
            {currentTab === 'pdv' && (
              <PdvModule
                products={products}
                onProductsUpdated={handleRefreshProducts}
                onSaleCompleted={handleSaleCompleted}
              />
            )}
            {currentTab === 'stock' && (
              <StockModule products={products} onProductsUpdated={handleRefreshProducts} />
            )}
            {currentTab === 'recipes' && <RecipesModule />}
            {currentTab === 'orders' && <OrdersModule />}
            {currentTab === 'cash' && <CashRegisterModule onCashUpdated={handleRefreshProducts} />}
            {currentTab === 'finance' && <FinanceModule />}
            {currentTab === 'sync' && <SyncModule onDatabaseRestored={handleRefreshProducts} />}
            {currentTab === 'operations' && <OperationsModule onProductsUpdated={handleRefreshProducts} />}
            {currentTab === 'voice-notes' && <VoiceNotesModule />}
            {currentTab === 'assistant' && <AssistantModule onProductsUpdated={handleRefreshProducts} onSaleCompleted={handleSaleCompleted} />}
            {!isAndroidApp && currentTab === 'android' && <AndroidProjectExplorer />}
          </div>
        )}

        {viewMode === 'tablet' && (
          <div className="w-full max-w-[1024px] bg-white dark:bg-neutral-900 border-8 border-neutral-800 dark:border-neutral-700 rounded-3xl p-4 shadow-2xl overflow-hidden min-h-[640px]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400">
              <span className="font-bold">Tablet POS Padaria Master 2.9 (10.1" Touch)</span>
              <span>1280 x 800 · Android 15</span>
            </div>
            {currentTab === 'pdv' && (
              <PdvModule
                products={products}
                onProductsUpdated={handleRefreshProducts}
                onSaleCompleted={handleSaleCompleted}
              />
            )}
            {currentTab === 'stock' && (
              <StockModule products={products} onProductsUpdated={handleRefreshProducts} />
            )}
            {currentTab === 'recipes' && <RecipesModule />}
            {currentTab === 'orders' && <OrdersModule />}
            {currentTab === 'cash' && <CashRegisterModule onCashUpdated={handleRefreshProducts} />}
            {currentTab === 'finance' && <FinanceModule />}
            {currentTab === 'sync' && <SyncModule onDatabaseRestored={handleRefreshProducts} />}
            {currentTab === 'operations' && <OperationsModule onProductsUpdated={handleRefreshProducts} />}
            {currentTab === 'voice-notes' && <VoiceNotesModule />}
            {currentTab === 'assistant' && <AssistantModule onProductsUpdated={handleRefreshProducts} onSaleCompleted={handleSaleCompleted} />}
            {!isAndroidApp && currentTab === 'android' && <AndroidProjectExplorer />}
          </div>
        )}

        {viewMode === 'mobile' && (
          <div className="w-full max-w-[420px] bg-white dark:bg-neutral-900 border-[10px] border-neutral-800 dark:border-neutral-700 rounded-[40px] p-4 shadow-2xl overflow-hidden min-h-[720px] relative">
            {/* Notch / Speaker bar simulado */}
            <div className="w-24 h-4 bg-neutral-800 rounded-full mx-auto mb-3" />
            <div className="overflow-y-auto max-h-[680px]">
              {currentTab === 'pdv' && (
                <PdvModule
                  products={products}
                  onProductsUpdated={handleRefreshProducts}
                  onSaleCompleted={handleSaleCompleted}
                />
              )}
              {currentTab === 'stock' && (
                <StockModule products={products} onProductsUpdated={handleRefreshProducts} />
              )}
              {currentTab === 'recipes' && <RecipesModule />}
              {currentTab === 'orders' && <OrdersModule />}
              {currentTab === 'cash' && <CashRegisterModule onCashUpdated={handleRefreshProducts} />}
              {currentTab === 'finance' && <FinanceModule />}
              {currentTab === 'sync' && <SyncModule onDatabaseRestored={handleRefreshProducts} />}
              {currentTab === 'operations' && <OperationsModule onProductsUpdated={handleRefreshProducts} />}
              {currentTab === 'voice-notes' && <VoiceNotesModule />}
              {currentTab === 'assistant' && <AssistantModule onProductsUpdated={handleRefreshProducts} onSaleCompleted={handleSaleCompleted} />}
              {!isAndroidApp && currentTab === 'android' && <AndroidProjectExplorer />}
            </div>
          </div>
        )}
      </main>

      {currentTab !== 'assistant' && <button onClick={() => setIsAttendantOpen(true)} className="fixed bottom-5 right-4 z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-500 px-4 text-sm font-extrabold text-white shadow-xl shadow-amber-900/30 hover:bg-amber-600 sm:bottom-6 sm:right-6"><MessageCircle className="h-5 w-5"/><span>Falar com atendente</span></button>}
      {isAttendantOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) setIsAttendantOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Atendente virtual" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-neutral-900 sm:rounded-3xl"><header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800"><div><h2 className="font-extrabold">Atendente virtual</h2><p className="text-xs text-neutral-500">Fale ou digite um comando</p></div><button onClick={() => setIsAttendantOpen(false)} aria-label="Fechar atendente" className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-5 w-5"/></button></header><div className="overflow-y-auto p-4"><AssistantModule onProductsUpdated={handleRefreshProducts} onSaleCompleted={handleSaleCompleted} /></div></section></div>}
      {isResetDataOpen && <ResetDataModal onClose={() => setIsResetDataOpen(false)} onReset={() => { setProducts(storage.getProducts()); setCurrentTab('pdv'); setIsPdvStandalone(false); }} onGoToSync={() => { setIsResetDataOpen(false); setCurrentTab('sync'); }} />}
      {/* Footer simples e profissional */}
      <footer className="py-4 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 bg-white/50 dark:bg-neutral-900/50">
        <p>Padaria Master 2.9 · Gestão da padaria neste dispositivo</p>
      </footer>
    </div>
  );
}
