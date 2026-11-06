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
import { Product, Sale } from './types/padaria';
import { storage } from './services/storage';

export default function App() {
  const isAndroidApp = new URLSearchParams(window.location.search).get('platform') === 'android';
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

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        isOnline={isOnline}
        isAndroidApp={isAndroidApp}
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
            {!isAndroidApp && currentTab === 'android' && <AndroidProjectExplorer />}
          </div>
        )}

        {viewMode === 'tablet' && (
          <div className="w-full max-w-[1024px] bg-white dark:bg-neutral-900 border-8 border-neutral-800 dark:border-neutral-700 rounded-3xl p-4 shadow-2xl overflow-hidden min-h-[640px]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400">
              <span className="font-bold">Tablet POS Padaria Master 2.1 (10.1" Touch)</span>
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
              {!isAndroidApp && currentTab === 'android' && <AndroidProjectExplorer />}
            </div>
          </div>
        )}
      </main>

      {/* Footer simples e profissional */}
      <footer className="py-4 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 bg-white/50 dark:bg-neutral-900/50">
        <p>Padaria Master 2.1 · Gestão da padaria neste dispositivo</p>
      </footer>
    </div>
  );
}
