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
  WifiOff,
  ShoppingCart,
  Package,
  ClipboardList,
  Bot,
  MoreHorizontal,
  X,
  ChefHat,
  NotebookPen,
  Wallet,
  ChartNoAxesCombined,
  RefreshCw,
  CodeXml,
  Factory,
  Settings2,
  Check,
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
  isAndroidApp: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  viewMode,
  onChangeViewMode,
  isOnline,
  isAndroidApp
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = React.useState(false);
  const [palette, setPalette] = React.useState(() => { const saved = localStorage.getItem('padaria_master_palette'); return ['caramelo', 'oceano', 'floresta', 'ameixa'].includes(saved || '') ? saved! : 'caramelo'; });

  React.useEffect(() => {
    document.documentElement.dataset.palette = palette;
    localStorage.setItem('padaria_master_palette', palette);
  }, [palette]);

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
    { id: 'operations', label: 'Produção & Gestão' },
    { id: 'voice-notes', label: 'Anotações por voz' },
    { id: 'assistant', label: 'Assistente de tarefas' },
    { id: 'orders', label: 'Encomendas' },
    { id: 'cash', label: 'Controle de Caixa' },
    { id: 'finance', label: 'DRE Financeiro' },
    { id: 'sync', label: 'Offline / Sync' },
    { id: 'android', label: 'Código Android' },
  ].filter((link) => !isAndroidApp || link.id !== 'android');

  const paletteOptions = [
    { id: 'caramelo', label: 'Caramelo', colors: ['#f8e8cd', '#d99748', '#c87936', '#884a26'] },
    { id: 'oceano', label: 'Azul oceano', colors: ['#dbeafe', '#60a5fa', '#2563eb', '#1e3a8a'] },
    { id: 'floresta', label: 'Verde floresta', colors: ['#dcfce7', '#4ade80', '#27845a', '#14532d'] },
    { id: 'ameixa', label: 'Ameixa', colors: ['#f3e8ff', '#c084fc', '#9333ea', '#581c87'] },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#fffaf3]/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_8px_28px_rgba(72,46,24,0.07)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => onSelectTab('pdv')}
          className="flex items-center gap-2 cursor-pointer shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-700/25 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-neutral-50 whitespace-nowrap">
              PADARIA<span className="text-amber-500">MASTER</span> <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">2.9</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`px-3 py-2 text-xs xl:text-[13px] font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 border border-transparent ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md shadow-amber-700/20 ring-1 ring-amber-400/40 -translate-y-0.5'
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
            title={isOnline ? "Conexão de rede disponível" : "Modo offline (dados guardados neste aparelho)"}
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
          <div className={isAndroidApp ? 'hidden' : 'hidden sm:flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700'}>
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

          {/* Theme and appearance controls */}
          <button onClick={() => { setIsMoreMenuOpen(false); setIsAppearanceOpen(open => !open); }} aria-label="Configurações de aparência" aria-expanded={isAppearanceOpen} aria-controls="appearance-menu" className={`rounded-xl p-2 transition-colors ${isAppearanceOpen ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}>
            <Settings2 className="h-4 w-4" />
          </button>
          <button onClick={onToggleTheme} aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'} className="rounded-xl p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Download Android Studio Project ZIP */}
          {!isAndroidApp && <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isDownloading ? 'Gerando ZIP...' : 'Baixar Android Studio (.ZIP)'}</span>
            <span className="md:hidden">ZIP</span>
          </button>}
        </div>
      </div>

      {/* Mobile quick navigation and categorized menu */}
      <nav aria-label="Navegação principal móvel" className="lg:hidden flex items-center justify-between gap-1 px-3 py-2 border-t border-neutral-100 dark:border-neutral-800">
        {[
          { id: 'pdv', label: 'PDV', Icon: ShoppingCart },
          { id: 'stock', label: 'Estoque', Icon: Package },
          { id: 'orders', label: 'Pedidos', Icon: ClipboardList },
          { id: 'assistant', label: 'Tarefas', Icon: Bot },
        ].map(({ id, label, Icon }) => {
          const active = currentTab === id;
          return <button key={id} onClick={() => { onSelectTab(id); setIsMoreMenuOpen(false); }} aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${active ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md shadow-amber-800/20 ring-1 ring-amber-400/40' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}><Icon className="h-5 w-5"/><span className="truncate">{label}</span></button>;
        })}
        <button onClick={() => { setIsAppearanceOpen(false); setIsMoreMenuOpen(open => !open); }} aria-expanded={isMoreMenuOpen} aria-controls="mobile-more-menu" aria-label={isMoreMenuOpen ? 'Fechar menu' : 'Abrir mais opções'} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${isMoreMenuOpen || navLinks.some(link => link.id === currentTab && !['pdv', 'stock', 'orders', 'assistant'].includes(link.id)) ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}>
          {isMoreMenuOpen ? <X className="h-5 w-5"/> : <MoreHorizontal className="h-5 w-5"/>}<span>Mais</span>
        </button>
      </nav>
      {isMoreMenuOpen && <div id="mobile-more-menu" className="lg:hidden absolute left-3 right-3 top-full z-50 max-h-[75vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="font-extrabold">Menu</h2><p className="text-xs text-neutral-500">Acesse as outras áreas da padaria</p></div><button onClick={() => setIsMoreMenuOpen(false)} aria-label="Fechar menu" className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-4 w-4"/></button></div>
        {[
          { title: 'Produção', ids: ['recipes', 'operations', 'voice-notes'] },
          { title: 'Gestão', ids: ['cash', 'finance'] },
          { title: 'Sistema', ids: ['sync', 'android'] },
        ].map(group => {
          const links = navLinks.filter(link => group.ids.includes(link.id));
          if (!links.length) return null;
          return <section key={group.title} className="mb-4 last:mb-0"><h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">{group.title}</h3><div className="grid grid-cols-2 gap-2">{links.map(link => {
            const active = currentTab === link.id;
            const Icon = link.id === 'recipes' ? ChefHat : link.id === 'operations' ? Factory : link.id === 'voice-notes' ? NotebookPen : link.id === 'cash' ? Wallet : link.id === 'finance' ? ChartNoAxesCombined : link.id === 'sync' ? RefreshCw : CodeXml;
            return <button key={link.id} onClick={() => { onSelectTab(link.id); setIsMoreMenuOpen(false); }} aria-current={active ? 'page' : undefined} className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition-colors ${active ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200' : 'border-neutral-200 hover:border-amber-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'}`}><Icon className={`h-5 w-5 shrink-0 ${active ? 'text-amber-600' : 'text-neutral-500'}`}/><span>{link.label}</span></button>;
          })}</div></section>;
        })}
      </div>}
      {isAppearanceOpen && <section id="appearance-menu" aria-label="Configurações de aparência" className="absolute right-3 top-full z-50 mt-2 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-extrabold">Aparência</h2><p className="text-xs text-neutral-500">Escolha as cores do seu app</p></div><button onClick={() => setIsAppearanceOpen(false)} aria-label="Fechar configurações" className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">Fechar</button></div>
        <div className="mb-4 flex items-center justify-between rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800"><div><p className="text-sm font-semibold">Tema {isDark ? 'escuro' : 'claro'}</p><p className="text-xs text-neutral-500">Alterne entre claro e escuro</p></div><button onClick={onToggleTheme} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-neutral-100">{isDark ? 'Ativar claro' : 'Ativar escuro'}</button></div>
        <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">Paleta de cores</h3><div className="grid grid-cols-2 gap-2">{paletteOptions.map(option => {const active=palette===option.id;return <button key={option.id} onClick={() => setPalette(option.id)} aria-pressed={active} className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm font-semibold transition-all ${active ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900' : 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-700'}`}><span>{option.label}</span><span className="flex items-center gap-0.5">{option.colors.map(color=><span key={color} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{backgroundColor:color}}/>)}{active&&<Check className="ml-1 h-4 w-4 text-amber-700 dark:text-amber-300"/>}</span></button>})}</div>
      </section>}
    </header>
  );
};
