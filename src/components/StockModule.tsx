import React, { useEffect, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Clock, 
  CheckCircle, 
  X,
  Edit2,
  Trash2,
  RotateCcw,
  Image as ImageIcon,
  ScanLine,
  Camera
} from 'lucide-react';
import { Product, ProductCategory } from '../types/padaria';
import { storage } from '../services/storage';

interface StockModuleProps {
  products: Product[];
  onProductsUpdated: () => void;
}

export const StockModule: React.FC<StockModuleProps> = ({
  products,
  onProductsUpdated
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('TODOS');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'ENTRADA' | 'PERDA'>('ENTRADA');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Reposição de fornada fresca');
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [imageSearchMessage, setImageSearchMessage] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('');
  const [scannerCode, setScannerCode] = useState('');

  const lookupBarcode = async (rawCode: string) => {
    const code = rawCode.trim(); if (!code) return;
    setScannerCode(code);
    const existing = products.find((item) => !item.isArchived && item.barcode.trim() === code);
    if (existing) {
      setEditingProduct(existing);
      setFormData({ name: existing.name, category: existing.category, barcode: existing.barcode, salePrice: existing.salePrice, costPrice: existing.costPrice, isWeighed: existing.isWeighed, stockQuantity: existing.stockQuantity, minStock: existing.minStock, unit: existing.unit, batchNumber: existing.batchNumber || '', expirationDate: existing.expirationDate || '', imageUrl: existing.imageUrl || '' });
      setScannerMessage('Produto já cadastrado: ' + existing.name + '. Carreguei os dados para edição.');
      return;
    }
    setFormData((current) => ({ ...current, barcode: code })); setScannerMessage('Código lido. Procurando os dados do produto…');
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_pt,categories_tags,image_front_url`);
      if (!response.ok) throw new Error('Busca indisponível'); const result = await response.json(); const product = result.product;
      if (result.status !== 1 || !product) { setScannerMessage('Código salvo. Não achei o produto na base; complete o nome e os preços para cadastrar.'); return; }
      const name = product.product_name_pt || product.product_name || ''; const tags = (product.categories_tags || []).join(' ').toLowerCase();
      const category: ProductCategory = /beverage|drink|bebida/.test(tags) ? 'BEBIDAS' : /dairy|cheese|meat|cold|latic|queijo|carne/.test(tags) ? 'FRIOS' : 'MERCEARIA';
      setFormData((current) => ({ ...current, barcode: code, name: name || current.name, category, imageUrl: product.image_front_url || current.imageUrl }));
      setScannerMessage(name ? `Produto encontrado: ${name}. Confira os dados e informe seus preços e estoque.` : 'Código encontrado. Complete os dados do produto.');
    } catch { setScannerMessage('Não consegui consultar a base agora. O código ficou preenchido; informe os dados manualmente.'); }
  };

  useEffect(() => {
    if (!scannerOpen) return; let stream: MediaStream | undefined; let frame = 0; let stopped = false;
    const video = document.getElementById('stock-barcode-video') as HTMLVideoElement | null;
    const BarcodeDetectorApi = (window as Window & { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    if (!navigator.mediaDevices?.getUserMedia) { setScannerMessage('A câmera não está disponível. Digite o código no campo abaixo.'); return; }
    if (!BarcodeDetectorApi) { setScannerMessage('Este navegador não oferece leitura pela câmera. Use leitor USB/Bluetooth ou digite o código.'); return; }
    const detector = new BarcodeDetectorApi({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((camera) => {
      if (stopped) { camera.getTracks().forEach((track) => track.stop()); return; } stream = camera; if (video) { video.srcObject = camera; void video.play(); }
      const scan = async () => { if (stopped || !video || video.readyState < 2) { frame = requestAnimationFrame(scan); return; }
        try { const codes = await detector.detect(video); if (codes[0]?.rawValue) { setScannerOpen(false); void lookupBarcode(codes[0].rawValue); return; } } catch { /* aguarda o próximo quadro */ }
        frame = requestAnimationFrame(scan); }; frame = requestAnimationFrame(scan);
    }).catch(() => setScannerMessage('Não foi possível abrir a câmera. Confira a permissão ou digite o código.'));
    return () => { stopped = true; cancelAnimationFrame(frame); stream?.getTracks().forEach((track) => track.stop()); };
  }, [scannerOpen]);

  // Form para novo produto
  const [formData, setFormData] = useState({
    name: '',
    category: 'PAES' as ProductCategory,
    barcode: '',
    salePrice: 15.00,
    costPrice: 5.50,
    isWeighed: false,
    stockQuantity: 20,
    minStock: 5,
    unit: 'UN' as 'UN' | 'KG' | 'PCT',
    batchNumber: 'LT-' + Math.floor(1000 + Math.random() * 9000),
    expirationDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    imageUrl: ''
  });

  useEffect(() => {
    const query = formData.name.trim();
    if (!isAddModalOpen || editingProduct || query.length < 2) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setIsSearchingImage(true);
      setImageSearchMessage('Procurando uma imagem para “' + query + '”…');
      try {
        const response = await fetch('https://api.openverse.org/v1/images/?q=' + encodeURIComponent(query) + '&page_size=1');
        if (!response.ok) throw new Error('Busca indisponível');
        const data = await response.json();
        const imageUrl = data.results?.[0]?.thumbnail || data.results?.[0]?.url;
        if (!active) return;
        if (imageUrl) {
          setFormData((current) => ({ ...current, imageUrl }));
          setImageSearchMessage('Imagem encontrada automaticamente.');
        } else {
          setImageSearchMessage('Nenhuma imagem encontrada para esse nome.');
        }
      } catch {
        if (active) setImageSearchMessage('Não foi possível buscar a imagem. Verifique a conexão.');
      } finally {
        if (active) setIsSearchingImage(false);
      }
    }, 700);
    return () => { active = false; window.clearTimeout(timer); };
  }, [formData.name, isAddModalOpen, editingProduct]);

  const filteredProducts = products.filter((p) => {
    const matchesArchive = Boolean(p.isArchived) === showArchived;
    const matchCategory = filterCategory === 'TODOS' || p.category === filterCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    return matchesArchive && matchCategory && matchSearch;
  });
  const archivedCount = products.filter((product) => product.isArchived).length;

  // Estatísticas
  const activeProducts = products.filter((product) => !product.isArchived);
  const lowStockCount = activeProducts.filter((p) => p.stockQuantity <= p.minStock).length;
  const totalItemsCount = activeProducts.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalStockValue = activeProducts.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);

  const resetProductForm = () => {
    setFormData({
      name: '', category: 'PAES', barcode: '', salePrice: 15.00, costPrice: 5.50,
      isWeighed: false, stockQuantity: 20, minStock: 5, unit: 'UN',
      batchNumber: 'LT-' + Math.floor(1000 + Math.random() * 9000),
      expirationDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      imageUrl: ''
    });
    setImageSearchMessage('');
  };

  const handleSearchProductImage = async () => {
    const query = formData.name.trim();
    if (!query) { setImageSearchMessage('Digite o nome do produto para procurar uma imagem.'); return; }
    setIsSearchingImage(true); setImageSearchMessage('');
    try {
      const response = await fetch('https://api.openverse.org/v1/images/?q=' + encodeURIComponent(query) + '&page_size=1');
      if (!response.ok) throw new Error('Busca indisponível');
      const data = await response.json();
      const imageUrl = data.results?.[0]?.thumbnail || data.results?.[0]?.url;
      if (!imageUrl) { setImageSearchMessage('Nenhuma imagem encontrada. Tente outro nome.'); return; }
      setFormData((current) => ({ ...current, imageUrl }));
      setImageSearchMessage('Imagem encontrada. Você pode salvar o produto.');
    } catch { setImageSearchMessage('Não foi possível buscar agora. Verifique a conexão e tente novamente.'); }
    finally { setIsSearchingImage(false); }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const barcode = formData.barcode.trim();
    const duplicate = barcode && products.find((product) => !product.isArchived && product.barcode.trim() === barcode && product.id !== editingProduct?.id);
    if (duplicate) { setScannerCode(barcode); setScannerMessage('Este código já pertence a ' + duplicate.name + '. Leia outro código ou edite o produto existente.'); return; }

    if (editingProduct) {
      const updated = products.map((product) => product.id === editingProduct.id
        ? { ...product, ...formData, name: formData.name.trim(), updatedAt: Date.now() }
        : product
      );
      storage.saveProducts(updated);
      storage.logAction('ESTOQUE', 'Produto atualizado: '+formData.name.trim());
      onProductsUpdated();
      setEditingProduct(null);
      setIsAddModalOpen(false);
      return;
    }

    const newProd: Product = {
      id: 'prod_' + Date.now(),
      ...formData,
      name: formData.name.trim(),
      barcode,
      salePrice: Number(formData.salePrice),
      costPrice: Number(formData.costPrice),
      stockQuantity: Number(formData.stockQuantity),
      minStock: Number(formData.minStock),
      updatedAt: Date.now()
    };
    storage.saveProducts([newProd, ...products]);
    storage.logAction('ESTOQUE', 'Produto cadastrado: '+newProd.name);
    onProductsUpdated();
    setIsAddModalOpen(false);
  };

  const handleArchiveProduct = () => {
    if (!productToArchive) return;
    storage.saveProducts(products.map((product) => product.id === productToArchive.id
      ? { ...product, isArchived: true, updatedAt: Date.now() }
      : product
    ));
    onProductsUpdated();
    setProductToArchive(null);
  };

  const handleRestoreProduct = (product: Product) => {
    storage.saveProducts(products.map((item) => item.id === product.id
      ? { ...item, isArchived: false, updatedAt: Date.now() }
      : item
    ));
    onProductsUpdated();
  };

  const handleConfirmAdjust = () => {
    if (!selectedProduct || adjustAmount <= 0) return;

    const updated = products.map((p) => {
      if (p.id === selectedProduct.id) {
        const delta = adjustType === 'ENTRADA' ? adjustAmount : -adjustAmount;
        return {
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity + delta),
          updatedAt: Date.now()
        };
      }
      return p;
    });

    storage.saveProducts(updated);
    storage.logAction('ESTOQUE', `${adjustType} ${adjustAmount} ${selectedProduct.unit} · ${selectedProduct.name}`);
    onProductsUpdated();
    setIsAdjustModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de KPIs de Estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">Produtos Cadastrados</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-50 mt-1">
              {activeProducts.length} itens
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">Valor Total em Estoque (Custo)</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              R$ {totalStockValue.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">Itens em Alerta Crítico</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-1">
              {lowStockCount} produtos
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtro e Adição */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome, lote ou código..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200"
          >
            <option value="TODOS">Todas as Categorias</option>
            <option value="PAES">Pães & Fornada</option>
            <option value="CONFEITARIA">Confeitaria</option>
            <option value="SALGADOS">Salgados</option>
            <option value="BEBIDAS">Bebidas</option>
            <option value="FRIOS">Frios</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!showArchived && <button onClick={() => { setEditingProduct(null); resetProductForm(); setIsAddModalOpen(true); setScannerCode(''); setScannerMessage('Aponte a câmera traseira para o código de barras.'); setScannerOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 rounded-lg text-xs font-bold"><Camera className="w-4 h-4"/><span>Cadastro rápido por câmera</span></button>}
          {archivedCount > 0 && (
            <button onClick={() => setShowArchived(!showArchived)} className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
              {showArchived ? 'Voltar ao estoque' : `Removidos (${archivedCount})`}
            </button>
          )}
          {!showArchived && (
            <button onClick={() => { setEditingProduct(null); resetProductForm(); setIsAddModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs">
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Produto</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Produtos & Lotes */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Lote / Validade</th>
                <th className="py-3 px-4 text-right">Qtd Estoque</th>
                <th className="py-3 px-4 text-right">Custo Unit</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono tabular-nums">
              {filteredProducts.map((p) => {
                const isCritical = p.stockQuantity <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-neutral-900 dark:text-neutral-100">
                      <div>
                        <span>{p.name}</span>
                        <p className="text-[11px] text-neutral-400 font-mono">EAN: {p.barcode}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans text-neutral-600 dark:text-neutral-400">
                      {p.category}
                    </td>
                    <td className="py-3 px-4 font-sans text-neutral-600 dark:text-neutral-400">
                      <div>
                        <span>{p.batchNumber || 'LT-PADRÃO'}</span>
                        {p.expirationDate && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Val: {p.expirationDate}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                      {p.isWeighed ? `${p.stockQuantity.toFixed(2)} kg` : `${p.stockQuantity} un`}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-500">
                      R$ {p.costPrice.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {p.salePrice.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      {p.isArchived ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-500">Removido</span>
                      ) : isCritical ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /><span>Crítico ({p.minStock})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" /><span>Normal</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {p.isArchived ? (
                        <button onClick={() => handleRestoreProduct(p)} title="Restaurar produto no estoque" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-700 hover:bg-emerald-50"><RotateCcw className="w-4 h-4" />Restaurar</button>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedProduct(p); setAdjustType('ENTRADA'); setIsAdjustModalOpen(true); }} title="Dar entrada de mercadoria/fornada" className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"><ArrowUpRight className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedProduct(p); setAdjustType('PERDA'); setIsAdjustModalOpen(true); }} title="Registrar perda de fornada / quebra" className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><ArrowDownRight className="w-4 h-4" /></button>
                          <button onClick={() => { setEditingProduct(p); setFormData({ name: p.name, category: p.category, barcode: p.barcode, salePrice: p.salePrice, costPrice: p.costPrice, isWeighed: p.isWeighed, stockQuantity: p.stockQuantity, minStock: p.minStock, unit: p.unit, batchNumber: p.batchNumber || '', expirationDate: p.expirationDate || '', imageUrl: p.imageUrl || '' }); setImageSearchMessage(''); setIsAddModalOpen(true); }} title="Editar produto" className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setProductToArchive(p)} title="Remover do estoque" className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro de Novo Produto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Nome do Produto:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pão de Torresmo Artesanal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, imageUrl: '' })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 space-y-2">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">Imagem de capa (opcional)</label>
                <div className="flex gap-2">
                  <button type="button" disabled={isSearchingImage} onClick={handleSearchProductImage} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 font-semibold disabled:opacity-60">
                    <ImageIcon className="h-4 w-4" />{isSearchingImage ? 'Buscando…' : 'Buscar outra imagem'}
                  </button>
                  {formData.imageUrl && <button type="button" onClick={() => { setFormData({ ...formData, imageUrl: '' }); setImageSearchMessage('Imagem removida.'); }} className="text-red-600">Remover</button>}
                </div>
                {formData.imageUrl && <img src={formData.imageUrl} alt={'Capa de ' + formData.name} className="h-24 w-24 rounded-lg object-cover" />}
                {imageSearchMessage && <p role="status" className="text-neutral-500">{imageSearchMessage}</p>}
                <p className="text-neutral-500">Ao digitar o nome no cadastro, o app procura a imagem automaticamente no Openverse.</p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-2"><div><b className="text-sm">Leitor de código de barras</b><p className="text-[11px] text-neutral-600 dark:text-neutral-300">Leia pela câmera ou use leitor USB/Bluetooth. Tentamos preencher o produto pela base Open Food Facts.</p></div><button type="button" onClick={() => { setScannerMessage(''); setScannerOpen(true); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 font-bold text-white"><ScanLine className="h-4 w-4"/>Ler</button></div>
                <div className="flex gap-2"><input value={scannerCode} onChange={(e) => setScannerCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookupBarcode(scannerCode); } }} placeholder="Digite ou escaneie o EAN" className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"/><button type="button" onClick={() => void lookupBarcode(scannerCode)} className="rounded-lg border px-3 font-semibold dark:border-neutral-700">Buscar</button></div>
                {scannerMessage && <p role="status" className="text-[11px] text-neutral-600 dark:text-neutral-300">{scannerMessage}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Categoria:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  >
                    <option value="PAES">Pães & Fornada</option>
                    <option value="CONFEITARIA">Confeitaria</option>
                    <option value="SALGADOS">Salgados</option>
                    <option value="BEBIDAS">Bebidas</option>
                    <option value="FRIOS">Frios</option>
                    <option value="MERCEARIA">Mercearia</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Código de Barras / EAN:
                  </label>
                  <input
                    type="text"
                    placeholder="7891..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Custo Unitário (R$):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Preço de Venda (R$):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isWeighed"
                  checked={formData.isWeighed}
                  onChange={(e) => setFormData({ ...formData, isWeighed: e.target.checked, unit: e.target.checked ? 'KG' : 'UN' })}
                  className="rounded text-amber-500 accent-amber-500"
                />
                <label htmlFor="isWeighed" className="font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Produto pesado na balança (R$ por Kg)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Estoque Inicial:
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Estoque Mínimo de Alerta:
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Lote:</label>
                  <input type="text" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Validade:</label>
                  <input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scannerOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"><section className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-neutral-900"><div className="flex items-center justify-between"><h3 className="font-bold">Ler código de barras</h3><button type="button" onClick={() => setScannerOpen(false)} aria-label="Fechar leitor"><X className="h-5 w-5"/></button></div><video id="stock-barcode-video" playsInline muted className="mt-3 aspect-video w-full rounded-xl bg-black object-cover"/><p className="mt-2 text-xs text-neutral-500">Aponte a câmera traseira para o código. A leitura preenche o código e tenta localizar o nome e a imagem.</p>{scannerMessage && <p role="status" className="mt-2 text-xs text-amber-700">{scannerMessage}</p>}<button type="button" onClick={() => setScannerOpen(false)} className="mt-4 w-full rounded-lg border py-2 font-semibold dark:border-neutral-700">Fechar</button></section></div>}

      {productToArchive && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold">Remover produto do estoque?</h3>
            <p className="mt-2 text-sm text-neutral-500">{productToArchive.name} sairá do PDV e da lista ativa. O histórico de vendas será preservado e o produto poderá ser restaurado.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setProductToArchive(null)} className="flex-1 rounded-xl border px-3 py-2 font-semibold">Manter</button>
              <button onClick={handleArchiveProduct} className="flex-1 rounded-xl bg-red-600 px-3 py-2 font-bold text-white">Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajuste / Entrada / Perda */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              {adjustType === 'ENTRADA' ? 'Entrada de Mercadoria / Fornada' : 'Registro de Perda / Desperdício'}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">{selectedProduct.name}</p>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Quantidade ({selectedProduct.isWeighed ? 'kg' : 'un'}):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Motivo do Lançamento:
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdjust}
                  className={`flex-1 py-2 px-3 rounded-xl text-white font-bold ${
                    adjustType === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
