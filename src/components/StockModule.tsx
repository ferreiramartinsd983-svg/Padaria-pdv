import React, { useState } from 'react';
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
  RotateCcw
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
    expirationDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  });

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
      expirationDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      const updated = products.map((product) => product.id === editingProduct.id
        ? { ...product, ...formData, name: formData.name.trim(), updatedAt: Date.now() }
        : product
      );
      storage.saveProducts(updated);
      onProductsUpdated();
      setEditingProduct(null);
      setIsAddModalOpen(false);
      return;
    }

    const newProd: Product = {
      id: 'prod_' + Date.now(),
      ...formData,
      name: formData.name.trim(),
      barcode: formData.barcode || String(Math.floor(78910000000 + Math.random() * 9999999)),
      salePrice: Number(formData.salePrice),
      costPrice: Number(formData.costPrice),
      stockQuantity: Number(formData.stockQuantity),
      minStock: Number(formData.minStock),
      updatedAt: Date.now()
    };
    storage.saveProducts([newProd, ...products]);
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

        <div className="flex items-center gap-2">
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
                          <button onClick={() => { setEditingProduct(p); setFormData({ name: p.name, category: p.category, barcode: p.barcode, salePrice: p.salePrice, costPrice: p.costPrice, isWeighed: p.isWeighed, stockQuantity: p.stockQuantity, minStock: p.minStock, unit: p.unit, batchNumber: p.batchNumber || '', expirationDate: p.expirationDate || '' }); setIsAddModalOpen(true); }} title="Editar produto" className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"><Edit2 className="w-4 h-4" /></button>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
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
