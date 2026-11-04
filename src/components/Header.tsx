import React from 'react';
import { 
  Store, 
  Sun, 
  Moon, 
  Download, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { downloadAndroidProjectZip } from '../services/projectFiles';

export type ViewMode = 'desktop' | 'tablet' | 'mobile';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  viewMode,
  onChangeViewMode,
  isOnline
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadAndroidProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  const navLinks = [
    { id: 'pdv', label: 'PDV Caixa' },
    { id: 'stock', label: 'Estoque & Lotes' },
    { id: 'recipes', label: 'Fichas Técnicas' },
    { id: 'orders', label: 'Encomendas' },
    { id: 'cash', label: 'Controle de Caixa' },
    { id: 'finance', label: 'DRE Financeiro' },
    { id: 'sync', label: 'Offline / Sync' },
    { id: 'android', label: 'Código Android' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => onSelectTab('pdv')}
          className="flex items-center gap-2 cursor-pointer shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-neutral-50 whitespace-nowrap">
              PADARIA<span className="text-amber-500">MASTER</span> <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">2.0</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 overflow-x-auto no-scrollbar py-1">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status Offline/Online */}
          <div 
            title={isOnline ? "Conexão ativa (Sincronizado)" : "Modo Offline (Gravando no SQLite Room local)"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
              isOnline 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* View Mode Switcher (para testar na proporção Tablet Touch ou Smartphone) */}
          <div className="hidden sm:flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => onChangeViewMode('desktop')}
              title="Visão Desktop ERP"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'desktop' ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeViewMode('tablet')}
              title="Modo Tablet PDV Horizontal (Touch)"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'tablet' ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeViewMode('mobile')}
              title="Modo Smartphone Android"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'mobile' ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Alternar tema claro/escuro"
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Download Android Studio Project ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isDownloading ? 'Gerando ZIP...' : 'Baixar Android Studio (.ZIP)'}</span>
            <span className="md:hidden">ZIP</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer strip */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar border-t border-neutral-100 dark:border-neutral-800">
        {navLinks.map((link) => {
          const isActive = currentTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
