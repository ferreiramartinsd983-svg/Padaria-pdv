import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Scale, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  QrCode, 
  CreditCard, 
  Banknote, 
  UserCheck, 
  Printer, 
  X,
  Sparkles,
  History,
  Lock,
  Unlock,
  KeyRound
} from 'lucide-react';
import { Product, ProductCategory, CartItem, PaymentMethod, Sale, CashRegister } from '../types/padaria';
import { storage } from '../services/storage';
import { sound } from '../services/sound';
import { SalesHistoryModal } from './SalesHistoryModal';

interface PdvModuleProps {
  products: Product[];
  onProductsUpdated: () => void;
  onSaleCompleted: (sale: Sale) => void;
  onExitStandalone?: () => void;
}

export const PdvModule: React.FC<PdvModuleProps> = ({
  products,
  onProductsUpdated,
  onSaleCompleted,
  onExitStandalone
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'item'; productId: string } | { kind: 'all' } | null>(null);
  const [managerPin, setManagerPin] = useState('');
  const [deletePinError, setDeletePinError] = useState('');
  const [isCheckingManagerPin, setIsCheckingManagerPin] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  
  // Scale Modal (Balança eletrônica touch)
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);
  const [scaleWeight, setScaleWeight] = useState<number>(0.350); // 350g padrão (ex: 6 a 7 pães franceses)

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [mixedPayments, setMixedPayments] = useState({ DINHEIRO: 0, PIX: 0, CARTAO_DEBITO: 0, CARTAO_CREDITO: 0 });
  const mixedTotal = Object.values(mixedPayments).reduce((sum, value) => sum + value, 0);
  const [customerName, setCustomerName] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [cashRegister, setCashRegister] = useState<CashRegister>(() => storage.getCashRegister());
  const [cashModal, setCashModal] = useState<'open' | 'close' | null>(null);
  const [openingAmount, setOpeningAmount] = useState(150);
  const [cashOperator, setCashOperator] = useState('Operador Caixa 01');
  const [countedCash, setCountedCash] = useState(cashRegister.expectedCashAmount);
  const isCashOpen = cashRegister.status === 'OPEN';

  const openCashRegister = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cashOperator.trim() || openingAmount < 0) return;
    const opened: CashRegister = { id: 'cx_' + Date.now(), status: 'OPEN', operatorName: cashOperator.trim(), openedAt: Date.now(), initialAmount: Number(openingAmount), movements: [], salesCount: 0, salesTotal: 0, salesByMethod: { DINHEIRO: 0, PIX: 0, CARTAO_DEBITO: 0, CARTAO_CREDITO: 0, FIADO: 0, MISTO: 0 }, expectedCashAmount: Number(openingAmount) };
    storage.saveCashRegister(opened); setCashRegister(opened); setCashModal(null);
  };

  const closeCashRegister = (event: React.FormEvent) => {
    event.preventDefault();
    const closed: CashRegister = { ...cashRegister, status: 'CLOSED', closedAt: Date.now(), actualCashAmount: Number(countedCash), cashDifference: Number(countedCash) - cashRegister.expectedCashAmount };
    storage.saveCashRegister(closed); setCashRegister(closed); setCashModal(null);
  };

  const categories: { id: ProductCategory; label: string }[] = [
    { id: 'TODOS', label: 'Todos os Itens' },
    { id: 'PAES', label: 'Pães & Fornada' },
    { id: 'CONFEITARIA', label: 'Confeitaria & Bolos' },
    { id: 'SALGADOS', label: 'Salgados & Lanches' },
    { id: 'BEBIDAS', label: 'Café & Bebidas' },
    { id: 'FRIOS', label: 'Frios & Queijos' },
    { id: 'MERCEARIA', label: 'Mercearia' },
  ];

  // Filtro de produtos
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (prod.isArchived) return false;
      const matchCategory = selectedCategory === 'TODOS' || prod.category === selectedCategory;
      const matchSearch = 
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.barcode.includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cálculos do Carrinho
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'DINHEIRO') return 0;
    return Math.max(0, amountPaid - total);
  }, [paymentMethod, amountPaid, total]);

  // Adicionar produto ao carrinho
  const handleProductClick = (product: Product) => {
    if (product.isWeighed) {
      setScaleProduct(product);
      setScaleWeight(0.350);
      return;
    }

    sound.playClick();
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.salePrice,
          totalPrice: product.salePrice,
        },
      ];
    });
  };

  // Confirmar pesagem da balança
  const handleConfirmScale = () => {
    if (!scaleProduct) return;
    sound.playBeep();
    const calculatedTotal = scaleWeight * scaleProduct.salePrice;

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === scaleProduct.id);
      if (existing) return prev.map(item => item.product.id === scaleProduct.id ? { ...item, quantity: item.quantity + scaleWeight, totalPrice: item.totalPrice + calculatedTotal } : item);
      return [...prev, { product: scaleProduct, quantity: scaleWeight, unitPrice: scaleProduct.salePrice, totalPrice: calculatedTotal }];
    });
    setScaleProduct(null);
  };

  // Alterar quantidade
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const selected = cart.find(item => item.product.id === productId);
    if (!selected) return;
    const step = selected.product.isWeighed ? 0.05 : 1;
    const nextQuantity = selected.quantity + delta * step;
    if (nextQuantity <= 0) { setDeleteTarget({ kind: 'item', productId }); setManagerPin(''); setDeletePinError(''); return; }
    setCart(current => current.map(item => item.product.id === productId ? { ...item, quantity: nextQuantity, totalPrice: nextQuantity * item.unitPrice } : item));
  };

  const handleSetQuantity = (productId: string, rawValue: string) => {
    if (!rawValue) return;
    const nextQuantity = Number(rawValue);
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) { setDeleteTarget({ kind: 'item', productId }); setManagerPin(''); setDeletePinError(''); return; }
    setCart(current => current.map(item => item.product.id === productId ? { ...item, quantity: nextQuantity, totalPrice: nextQuantity * item.unitPrice } : item));
  };

  const handleRemoveItem = (productId: string) => {
    setDeleteTarget({ kind: 'item', productId }); setManagerPin(''); setDeletePinError('');
  };

  const handleClearCart = () => {
    if (!cart.length) return;
    setDeleteTarget({ kind: 'all' }); setManagerPin(''); setDeletePinError('');
  };

  const authorizeCartRemoval = async () => {
    if (!deleteTarget) return;
    if (!storage.hasManagerPin()) { setDeletePinError('O PIN do gerente ainda não foi configurado. Saia do PDV e configure-o em Mais → Sistema → Offline / Sync.'); return; }
    setIsCheckingManagerPin(true);
    try {
      if (!(await storage.verifyManagerPin(managerPin))) { setDeletePinError('PIN do gerente incorreto. Confira e tente novamente.'); return; }
      if (deleteTarget.kind === 'all') {
        const removedNames = cart.map(item => item.product.name).join(', ');
        setCart([]); setDiscount(0);
        storage.logAction('PDV · ITENS REMOVIDOS', removedNames, 'Gerente');
      } else {
        const item = cart.find(row => row.product.id === deleteTarget.productId);
        setCart(current => current.filter(row => row.product.id !== deleteTarget.productId));
        if (item) storage.logAction('PDV · ITEM REMOVIDO', item.product.name, 'Gerente');
      }
      setDeleteTarget(null); setManagerPin(''); setDeletePinError('');
    } finally { setIsCheckingManagerPin(false); }
  };

  // Abrir Modal de Pagamento
  const handleOpenCheckout = () => {
    if (!isCashOpen) { setCashModal('open'); return; }
    if (cart.length === 0) return;
    setAmountPaid(Math.ceil(total));
    setIsCheckoutOpen(true);
  };

  // Leitores USB/Bluetooth digitam o código no campo e enviam Enter
  const handleBarcodeEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const code = searchQuery.trim();
    const matchedProduct = products.find(product => !product.isArchived && product.barcode.trim() === code);
    if (!matchedProduct) return;
    event.preventDefault();
    handleProductClick(matchedProduct);
    setSearchQuery('');
  };

  const focusBarcodeReader = () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  // Atalhos de caixa: F2 paga e F3 foca a busca/leitor
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (deleteTarget || isCheckoutOpen || cashModal || completedSale || showSalesHistory) return;
      if (event.key === 'F2') { event.preventDefault(); handleOpenCheckout(); }
      if (event.key === 'F3') { event.preventDefault(); searchInputRef.current?.focus(); }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  });

  // Finalizar Venda
  const handleFinalizeSale = () => {
    if (!isCashOpen) { setIsCheckoutOpen(false); setCashModal('open'); return; }
    if ((paymentMethod === 'DINHEIRO' && amountPaid < total) || (paymentMethod === 'MISTO' && Math.abs(mixedTotal-total) > 0.009)) {
      sound.playAlert();
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const activeCash = storage.getCashRegister();
      const newSale: Sale = {
        id: 'sale_' + Date.now(),
        code: String(Math.floor(100000 + Math.random() * 900000)),
        timestamp: Date.now(),
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          isWeighed: item.product.isWeighed,
        })),
        subtotal,
        discount,
        total,
        paymentMethod,
        paymentBreakdown: paymentMethod === 'MISTO' ? mixedPayments : undefined,
        amountPaid: paymentMethod === 'DINHEIRO' ? amountPaid : total,
        changeAmount: changeDue,
        customerName: customerName.trim() || undefined,
        cashRegisterId: activeCash?.id || 'default_register',
        isSynced: false,
      };

      storage.saveSale(newSale);
      setCashRegister(storage.getCashRegister());
      sound.playSuccess();

      setIsProcessingPayment(false);
      setIsCheckoutOpen(false);
      setCompletedSale(newSale);
      setCart([]);
      setDiscount(0);
      setCustomerName('');

      onProductsUpdated();
      onSaleCompleted(newSale);
    }, 400);
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className={"w-10 h-10 rounded-xl flex items-center justify-center " + (isCashOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{isCashOpen ? <Unlock className="w-5 h-5"/> : <Lock className="w-5 h-5"/>}</div><div><div className="font-bold text-sm">Caixa {isCashOpen ? 'aberto' : 'fechado'}</div><div className="text-xs text-neutral-500">{isCashOpen ? cashRegister.operatorName + ' · Gaveta esperada: R$ ' + cashRegister.expectedCashAmount.toFixed(2).replace('.', ',') : 'Abra o caixa para iniciar vendas'}</div></div></div>
        {isCashOpen ? <button onClick={() => { setCountedCash(cashRegister.expectedCashAmount); setCashModal('close'); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-xs font-bold"><Lock className="w-4 h-4"/>Fechar caixa</button> : <button onClick={() => setCashModal('open')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"><Unlock className="w-4 h-4"/>Abrir caixa</button>}
      </section>
      <div className={"grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-5rem)] " + (!isCashOpen ? 'opacity-75' : '')}>
      {/* Coluna da Esquerda: Catálogo Touch e Busca (8 colunas) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        {/* Barra Superior de Busca & Scanner */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              ref={searchInputRef}
              onKeyDown={handleBarcodeEnter}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nome ou passe o leitor de código de barras..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={focusBarcodeReader}
            title="Focar leitor de código de barras (F3)"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs font-semibold transition-all shrink-0 active:scale-95"
          >
            <Barcode className="w-4 h-4" />
            <span>Leitor</span>
          </button>
          <button onClick={() => setShowSalesHistory(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold shrink-0">
            <History className="w-4 h-4" /><span>Histórico</span>
          </button>
        </div>

        {/* Categorias (Segmented Touch Chips) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {cat.label}
                {cat.id === 'TODOS' && <span className="ml-1 opacity-75">{products.filter(product => !product.isArchived).length}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-1 text-xs text-neutral-500"><span>{searchQuery ? `Resultados para “${searchQuery}”` : selectedCategory === 'TODOS' ? 'Produtos disponíveis' : categories.find(category => category.id === selectedCategory)?.label}</span><span>{filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}</span></div>
        {/* Grade de Produtos Touch-Friendly */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
          {filteredProducts.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center dark:border-neutral-700 dark:bg-neutral-900"><Search className="mx-auto mb-3 h-7 w-7 text-neutral-400"/><p className="font-bold">Nenhum produto encontrado</p><p className="mt-1 text-xs text-neutral-500">Mude a busca ou escolha outra categoria.</p></div>}
          {filteredProducts.map((product) => {
            const isLowStock = product.stockQuantity <= product.minStock;
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 flex flex-col justify-between hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] select-none"
              >
                {/* Imagem do produto ou fallback sofisticado */}
                <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-2.5">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-amber-500/5 to-amber-500/15">
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {product.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {product.isWeighed && (
                    <div className="absolute top-2 right-2 bg-neutral-900/80 backdrop-blur-xs text-white p-1 rounded-md text-[10px] font-bold flex items-center gap-0.5">
                      <Scale className="w-3 h-3 text-amber-400" />
                      <span>kg</span>
                    </div>
                  )}

                  {isLowStock && (
                    <div className="absolute bottom-2 left-2 bg-red-600/90 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Baixo estoque
                    </div>
                  )}
                </div>

                {/* Título e Categoria */}
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Estoque: {product.isWeighed ? `${product.stockQuantity.toFixed(2)} kg` : `${product.stockQuantity} un`}
                  </p>
                </div>

                {/* Preço e Botão Adicionar */}
                <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="font-mono tabular-nums">
                    <span className="text-xs text-neutral-400">R$ </span>
                    <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">
                      {product.salePrice.toFixed(2).replace('.', ',')}
                    </span>
                    {product.isWeighed && <span className="text-[11px] text-neutral-400">/kg</span>}
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-amber-500 group-hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-xs">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coluna da Direita: Carrinho e Checkout (5 colunas) */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-5rem)] sticky top-20">
        {/* Cabeçalho do Carrinho */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              Cupom da Venda
            </h3>
            <p className="text-xs text-neutral-400">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'} no pedido atual
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Lista de Itens do Carrinho */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Barcode className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
                O carrinho está vazio
              </p>
              <p className="text-xs mt-1 max-w-[220px]">
                Toque nos produtos ao lado ou use o leitor de código de barras para iniciar uma venda.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                    {item.product.name}
                  </h5>
                  <p className="text-[11px] text-neutral-400 font-mono tabular-nums mt-0.5">
                    {item.product.isWeighed
                      ? `${item.quantity.toFixed(3)} kg x R$ ${item.unitPrice.toFixed(2).replace('.', ',')}`
                      : `${item.quantity} x R$ ${item.unitPrice.toFixed(2).replace('.', ',')}`}
                  </p>
                </div>

                {/* Controles de Quantidade */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-md bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input type="number" min={item.product.isWeighed ? '0.001' : '1'} step={item.product.isWeighed ? '0.001' : '1'} value={item.product.isWeighed ? Number(item.quantity.toFixed(3)) : item.quantity} aria-label={`Quantidade de ${item.product.name}`} onChange={event => handleSetQuantity(item.product.id, event.target.value)} className="w-14 rounded-md border border-neutral-200 bg-white px-1 py-1 text-center text-xs font-bold tabular-nums dark:border-neutral-600 dark:bg-neutral-700"/>
                  <button
                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-md bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Preço Total do Item */}
                <div className="text-right shrink-0 min-w-[70px]">
                  <span className="font-extrabold text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.product.id)}
                  className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Rodapé do Caixa com Totais e Botão Cobrar */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* Desconto Opcional */}
            <div className="flex justify-between items-center text-neutral-500">
              <span>Desconto</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px]">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0,00"
                  className="w-16 px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-right font-mono tabular-nums text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Total a Pagar
              </span>
              <span className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
              cart.length > 0 && isCashOpen
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isCashOpen ? 'COBRAR VENDA (F2)' : 'ABRA O CAIXA PARA VENDER'}</span>
          </button>
        </div>
      </div>
      </div>

      {cart.length > 0 && <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden"><button onClick={handleOpenCheckout} className={`flex min-h-16 w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-white shadow-2xl transition-all active:scale-[0.99] ${isCashOpen ? 'bg-gradient-to-r from-emerald-700 to-emerald-600' : 'bg-neutral-700'}`}><span><span className="block text-[11px] font-semibold text-white/75">{cart.length} {cart.length === 1 ? 'item' : 'itens'} · conferir venda</span><strong className="font-mono text-lg">R$ {total.toFixed(2).replace('.', ',')}</strong></span><span className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-emerald-800"><CheckCircle className="h-4 w-4"/>Pagar</span></button></div>}

      {deleteTarget && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"><section className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"><header className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><KeyRound className="h-5 w-5"/></div><div><h2 className="font-extrabold">Autorização do gerente</h2><p className="mt-1 text-xs leading-relaxed text-neutral-500">{deleteTarget.kind === 'all' ? 'Para limpar todos os itens desta venda, confirme com o PIN do gerente.' : 'Para excluir este item da venda, confirme com o PIN do gerente.'}</p></div></header>{storage.hasManagerPin() ? <><label className="block text-xs font-semibold">PIN do gerente<input autoFocus type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={managerPin} onChange={event => {setManagerPin(event.target.value.replace(/\D/g, ''));setDeletePinError('');}} onKeyDown={event => {if(event.key==='Enter')void authorizeCartRemoval();}} placeholder="Digite o PIN de 4 a 8 números" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-lg tracking-[0.35em] dark:border-neutral-700 dark:bg-neutral-800"/></label>{deletePinError&&<p role="alert" className="text-xs font-semibold text-red-600">{deletePinError}</p>}</> : <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><p>{deletePinError || 'Configure primeiro o PIN do gerente em Mais → Sistema → Offline / Sync.'}</p>{onExitStandalone&&<button onClick={()=>{setDeleteTarget(null);onExitStandalone();}} className="mt-2 font-extrabold underline">Voltar ao sistema para configurar</button>}</div>}<div className="flex gap-2"><button onClick={()=>{setDeleteTarget(null);setManagerPin('');setDeletePinError('');}} className="min-h-11 flex-1 rounded-xl border border-neutral-200 px-3 text-sm font-bold dark:border-neutral-700">Manter item</button>{storage.hasManagerPin()&&<button disabled={!managerPin||isCheckingManagerPin} onClick={()=>void authorizeCartRemoval()} className="min-h-11 flex-1 rounded-xl bg-red-600 px-3 text-sm font-extrabold text-white disabled:opacity-50">{isCheckingManagerPin?'Verificando…':'Autorizar exclusão'}</button>}</div></section></div>}

      {cashModal && <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4"><form onSubmit={cashModal === 'open' ? openCashRegister : closeCashRegister} className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"><h2 className="text-lg font-bold">{cashModal === 'open' ? 'Abrir caixa' : 'Fechar caixa'}</h2>{cashModal === 'open' ? <><label className="block text-sm">Operador<input required value={cashOperator} onChange={e=>setCashOperator(e.target.value)} className="mt-1 w-full rounded-lg border p-2 dark:bg-neutral-800 dark:border-neutral-700"/></label><label className="block text-sm">Fundo de troco inicial (R$)<input required type="number" min="0" step="0.01" value={openingAmount} onChange={e=>setOpeningAmount(Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2 dark:bg-neutral-800 dark:border-neutral-700"/></label></> : <><div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-sm">Valor esperado na gaveta: <strong>R$ {cashRegister.expectedCashAmount.toFixed(2).replace('.', ',')}</strong></div><label className="block text-sm">Dinheiro contado (R$)<input required type="number" min="0" step="0.01" value={countedCash} onChange={e=>setCountedCash(Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2 dark:bg-neutral-800 dark:border-neutral-700"/></label></>}<div className="flex gap-2 justify-end"><button type="button" onClick={()=>setCashModal(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button type="submit" className={"rounded-lg px-4 py-2 text-sm font-bold text-white " + (cashModal === 'open' ? 'bg-emerald-600' : 'bg-red-600')}>{cashModal === 'open' ? 'Confirmar abertura' : 'Confirmar fechamento'}</button></div></form></div>}

      {/* Modal 1: Balança Eletrônica Touch para Produtos no Peso */}
      {scaleProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    Balança Toledo / Filizola
                  </h3>
                  <p className="text-xs text-neutral-400">{scaleProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setScaleProduct(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display Digital da Balança */}
            <div className="my-5 p-4 rounded-xl bg-neutral-950 text-emerald-400 font-mono border-2 border-neutral-800 shadow-inner">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-neutral-400 tracking-wider">PESO LÍQUIDO</span>
                <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                  {scaleWeight.toFixed(3)} <span className="text-sm font-normal text-neutral-400">kg</span>
                </span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                <span>PREÇO POR KG: R$ {scaleProduct.salePrice.toFixed(2).replace('.', ',')}</span>
                <span className="text-white font-bold">
                  TOTAL: R$ {(scaleWeight * scaleProduct.salePrice).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Presets de Peso Comuns em Padaria */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Atalhos Rápidos de Fornada:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '200g (4 pães)', weight: 0.200 },
                  { label: '350g (6 pães)', weight: 0.350 },
                  { label: '500g (½ kg)', weight: 0.500 },
                  { label: '1,000 kg', weight: 1.000 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setScaleWeight(item.weight)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all ${
                      scaleWeight === item.weight
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-amber-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Slider / Ajuste fino de gramas */}
              <div className="pt-3">
                <input
                  type="range"
                  min="0.05"
                  max="3.00"
                  step="0.01"
                  value={scaleWeight}
                  onChange={(e) => setScaleWeight(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setScaleProduct(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmScale}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar Peso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Finalização de Pagamento (Dinheiro, PIX, Cartão, Fiado) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg max-h-[calc(100dvh-2rem)] w-full overflow-y-auto p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                  Pagamento da Venda
                </h3>
                <p className="text-xs text-neutral-400">Selecione o meio de pagamento do cliente</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total em Destaque */}
            <div className="my-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                  VALOR TOTAL
                </span>
                <p className="text-3xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  R$ {total.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <section className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-extrabold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">Itens da venda</h4><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-neutral-500 dark:bg-neutral-700">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span></div>
              <div className="max-h-36 space-y-2 overflow-y-auto pr-1">{cart.map(item=><div key={item.product.id} className="flex items-center justify-between gap-3 text-xs"><div className="min-w-0"><p className="truncate font-semibold text-neutral-800 dark:text-neutral-100">{item.product.name}</p><p className="text-[10px] text-neutral-500">{item.product.isWeighed ? `${item.quantity.toFixed(3)} kg` : `${item.quantity} un`} × R$ {item.unitPrice.toFixed(2).replace('.', ',')}</p></div><strong className="shrink-0 font-mono">R$ {item.totalPrice.toFixed(2).replace('.', ',')}</strong></div>)}</div>
              <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-xs dark:border-neutral-700"><span>Desconto</span><span>- R$ {discount.toFixed(2).replace('.', ',')}</span></div>
            </section>

            {/* Escolha da forma de pagamento */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
                { id: 'PIX', label: 'PIX', icon: QrCode },
                { id: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard },
                { id: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard },
                { id: 'MISTO', label: 'Dividido', icon: Plus },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id as PaymentMethod);
                      if (method.id === 'DINHEIRO') {
                        setAmountPaid(Math.ceil(total));
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conteúdo Específico do Meio de Pagamento */}
            {paymentMethod === 'MISTO' && <div className="space-y-2 p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl mb-4"><p className="text-xs font-semibold">Informe quanto será pago em cada forma. A soma precisa fechar o total.</p>{(['DINHEIRO','PIX','CARTAO_DEBITO','CARTAO_CREDITO'] as const).map((method)=><label key={method} className="flex items-center justify-between gap-3 text-xs">{method.replace('CARTAO_','Cartão ').replace('_',' ')}<input type="number" min="0" step="0.01" value={mixedPayments[method]||''} onChange={e=>setMixedPayments({...mixedPayments,[method]:Number(e.target.value)})} className="w-32 rounded border p-2 dark:bg-neutral-900"/></label>)}<p className={"text-right font-bold "+(Math.abs(mixedTotal-total)<0.009?'text-emerald-600':'text-red-600')}>Alocado: R$ {mixedTotal.toFixed(2).replace('.',',')} / {total.toFixed(2).replace('.',',')}</p></div>}
            {paymentMethod === 'DINHEIRO' && (
              <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/60 mb-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Valor Recebido (R$):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-right font-mono text-base font-bold text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {/* Cédulas Rápidas de Dinheiro */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[10, 20, 50, 100, 200].map((bill) => (
                    <button
                      key={bill}
                      onClick={() => setAmountPaid(bill)}
                      className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-400"
                    >
                      R$ {bill}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmountPaid(total)}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                  >
                    Exato
                  </button>
                </div>

                {/* Troco a Devolver */}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center font-mono">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                    TROCO A DEVOLVER:
                  </span>
                  <span
                    className={`text-lg font-black tabular-nums ${
                      changeDue >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-500'
                    }`}
                  >
                    R$ {changeDue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'PIX' && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/60 mb-4 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-white p-2 rounded-lg border border-neutral-300 shadow-xs flex items-center justify-center mb-2">
                  <QrCode className="w-28 h-28 text-neutral-900" />
                </div>
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                  Escaneie o QR Code no app do banco
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  QR demonstrativo — configure uma chave Pix válida antes de usar.
                </p>
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirme o recebimento no aplicativo do banco.</span>
                </div>
              </div>
            )}

            {paymentMethod.startsWith('CARTAO') && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/60 mb-4 text-center">
                <CreditCard className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                  Aproxime ou insira o cartão na máquina POS
                </span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Confirme o pagamento diretamente na maquininha; integração automática não está ativa.
                </p>
              </div>
            )}

            {/* Identificação Opcional do Cliente */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                Nome do Cliente (opcional na nota):
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Dona Maria, Sr. Roberto..."
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 font-semibold text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizeSale}
                disabled={isProcessingPayment || (paymentMethod === 'DINHEIRO' && amountPaid < total) || (paymentMethod === 'MISTO' && Math.abs(mixedTotal-total) > 0.009)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <span>Processando...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar Recebimento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Comprovante Térmico de Venda (Impressão 80mm) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Venda Concluída!</span>
              </h3>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recibo Térmico Formatado */}
            <div 
              id="thermal-receipt-print-area"
              className="my-4 p-4 bg-white text-neutral-950 font-mono text-[11px] rounded-lg border border-neutral-300 shadow-inner leading-relaxed"
            >
              <div className="text-center pb-2 border-b border-dashed border-neutral-400">
                <p className="font-bold text-sm">PADARIA MASTER 2.0</p>
                <p className="text-[10px]">PADARIA E CONFEITARIA ARTESANAL</p>
                <p className="text-[10px]">CNPJ: 12.345.678/0001-90</p>
                <p className="text-[10px]">Rua dos Padeiros, 100 - Centro</p>
              </div>

              <div className="py-2 border-b border-dashed border-neutral-400 text-[10px]">
                <p>CUPOM NÃO FISCAL #{completedSale.code}</p>
                <p>DATA: {new Date(completedSale.timestamp).toLocaleDateString('pt-BR')} {new Date(completedSale.timestamp).toLocaleTimeString('pt-BR')}</p>
                {completedSale.customerName && <p>CLIENTE: {completedSale.customerName}</p>}
              </div>

              <div className="py-2 border-b border-dashed border-neutral-400 space-y-1">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate pr-1">
                      {item.quantity} {item.isWeighed ? 'kg' : 'un'} x {item.productName}
                    </span>
                    <span className="shrink-0">
                      R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-0.5">
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span>TOTAL:</span>
                  <span>R$ {completedSale.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>FORMA DE PGTO:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
                {completedSale.paymentMethod === 'MISTO' && completedSale.paymentBreakdown && <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2 space-y-1 text-xs">{Object.entries(completedSale.paymentBreakdown).filter(([,value])=>Number(value)>0).map(([method,value])=><div key={method} className="flex justify-between"><span>{method.replace('CARTAO_','Cartão ').replace('_',' ')}</span><span>R$ {Number(value).toFixed(2).replace('.',',')}</span></div>)}</div>}
                {completedSale.paymentMethod === 'DINHEIRO' && (
                  <>
                    <div className="flex justify-between text-[10px]">
                      <span>VALOR PAGO:</span>
                      <span>R$ {completedSale.amountPaid.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>TROCO:</span>
                      <span>R$ {completedSale.changeAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 mt-3 border-t border-dashed border-neutral-400 text-[9px] text-neutral-500">
                Obrigado pela preferência! Volte sempre!
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 font-semibold text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cupom</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
              >
                Nova Venda (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
      {showSalesHistory && <SalesHistoryModal onClose={() => setShowSalesHistory(false)} onProductsUpdated={onProductsUpdated} />}
    </div>
  );
};
