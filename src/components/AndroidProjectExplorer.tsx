import React, { useState } from 'react';
import { 
  Folder, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  GitBranch, 
  Cpu, 
  Layers, 
  FileText 
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, downloadAndroidProjectZip } from '../services/projectFiles';

export const AndroidProjectExplorer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentFile = ANDROID_PROJECT_FILES[selectedFileIndex] || ANDROID_PROJECT_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAndroidProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner: Download do Projeto Nativo Android Studio */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Android Studio Ready
            </span>
            <span className="text-xs text-neutral-400">Kotlin 2.0 · Jetpack Compose · Room Database</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Projeto Nativo Android Completo
          </h2>

          <p className="text-sm text-neutral-300 leading-relaxed">
            Estrutura profissional em Clean Architecture, MVVM, Room Database com SQLite offline-first, WorkManager, Material Design 3 e pipeline CI/CD pronta para compilação automática no GitHub Actions.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold rounded-xl text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2.5 active:scale-95 shrink-0"
        >
          <Download className="w-5 h-5" />
          <span>{isDownloading ? 'Gerando Arquivo ZIP...' : 'Baixar Projeto Android Studio (.ZIP)'}</span>
        </button>
      </div>

      {/* Instruções Rápidas de Abertura & CI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Cpu className="w-4 h-4" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              1. Abrir no Android Studio
            </h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Baixe o ZIP, descompacte e abra a pasta raiz diretamente no <b>Android Studio</b>. O Gradle 8.7 sincronizará automaticamente.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Layers className="w-4 h-4" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              2. 100% Offline-First (Room)
            </h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            O banco SQLite Room é a fonte primária de verdade. Não depende de internet para vendas ou balança.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <GitBranch className="w-4 h-4" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              3. CI/CD no GitHub Actions
            </h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Arquivo <code className="text-amber-500">.github/workflows/android-build.yml</code> pronto para compilar o APK a cada commit.
          </p>
        </div>
      </div>

      {/* Explorador de Código e Árvore de Arquivos */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Painel Esquerdo: Lista de Arquivos (4 colunas) */}
        <div className="lg:col-span-4 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50/60 dark:bg-neutral-950/40">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-neutral-500">
              Estrutura de Pastas
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {ANDROID_PROJECT_FILES.length} arquivos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {ANDROID_PROJECT_FILES.map((file, idx) => {
              const isSelected = selectedFileIndex === idx;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-xs font-bold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-tight">{file.path}</p>
                    <p className={`text-[10px] truncate mt-0.5 font-sans font-normal ${isSelected ? 'text-amber-100' : 'text-neutral-400'}`}>
                      {file.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel Direito: Visualizador de Código com Syntax Highlighting (8 colunas) */}
        <div className="lg:col-span-8 flex flex-col bg-neutral-950 text-neutral-100">
          {/* Header do Arquivo */}
          <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
            <div className="flex items-center gap-2 text-xs font-mono">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-semibold">{currentFile.path}</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>

          {/* Conteúdo do Código com Numeração de Linhas */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed max-h-[600px] select-text">
            <pre className="text-neutral-300">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
