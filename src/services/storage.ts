import { 
  Product, 
  Sale, 
  Recipe, 
  CashRegister, 
  FinancialTransaction, 
  BakeryOrder, 
  SyncState 
} from '../types/padaria';

const STORAGE_KEYS = {
  PRODUCTS: 'padaria_master_products_v2',
  SALES: 'padaria_master_sales_v2',
  RECIPES: 'padaria_master_recipes_v2',
  CASH_REGISTER: 'padaria_master_cash_v2',
  FINANCES: 'padaria_master_finances_v2',
  ORDERS: 'padaria_master_orders_v2',
  SYNC: 'padaria_master_sync_v2',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Pão Francês Quentinho',
    category: 'PAES',
    barcode: '78910001001',
    salePrice: 19.90, // R$ por kg
    costPrice: 7.50,
    isWeighed: true,
    stockQuantity: 48.5,
    minStock: 12.0,
    unit: 'KG',
    batchNumber: 'LT-2401',
    expirationDate: '2026-11-05',
    imageUrl: '/src/assets/images/bakery_pao_frances_1793807977222.jpg',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_2',
    name: 'Pão de Queijo Mineiro',
    category: 'PAES',
    barcode: '78910001002',
    salePrice: 4.50,
    costPrice: 1.60,
    isWeighed: false,
    stockQuantity: 75,
    minStock: 25,
    unit: 'UN',
    batchNumber: 'LT-2402',
    expirationDate: '2026-11-06',
    imageUrl: '/src/assets/images/bakery_pao_de_queijo_1793807977568.jpg',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_3',
    name: 'Bolo Artesanal c/ Brigadeiro',
    category: 'CONFEITARIA',
    barcode: '78910001003',
    salePrice: 9.50,
    costPrice: 3.10,
    isWeighed: false,
    stockQuantity: 14,
    minStock: 6,
    unit: 'UN',
    batchNumber: 'LT-2403',
    expirationDate: '2026-11-07',
    imageUrl: '/src/assets/images/bakery_bolo_artesanal_1793807978147.jpg',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_4',
    name: 'Café Expresso Crema Especial',
    category: 'BEBIDAS',
    barcode: '78910001004',
    salePrice: 6.50,
    costPrice: 1.20,
    isWeighed: false,
    stockQuantity: 240,
    minStock: 40,
    unit: 'UN',
    imageUrl: '/src/assets/images/bakery_cafe_espresso_1793807978740.jpg',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_5',
    name: 'Coxinha de Frango c/ Requeijão',
    category: 'SALGADOS',
    barcode: '78910001005',
    salePrice: 9.00,
    costPrice: 3.25,
    isWeighed: false,
    stockQuantity: 28,
    minStock: 10,
    unit: 'UN',
    batchNumber: 'LT-2405',
    expirationDate: '2026-11-05',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_6',
    name: 'Sonho Recheado de Baunilha',
    category: 'CONFEITARIA',
    barcode: '78910001006',
    salePrice: 7.90,
    costPrice: 2.50,
    isWeighed: false,
    stockQuantity: 18,
    minStock: 8,
    unit: 'UN',
    batchNumber: 'LT-2406',
    expirationDate: '2026-11-05',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_7',
    name: 'Baguete Rústica com Parmesão',
    category: 'PAES',
    barcode: '78910001007',
    salePrice: 14.50,
    costPrice: 4.80,
    isWeighed: false,
    stockQuantity: 12,
    minStock: 5,
    unit: 'UN',
    batchNumber: 'LT-2407',
    expirationDate: '2026-11-06',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_8',
    name: 'Queijo Muçarela Fatiado',
    category: 'FRIOS',
    barcode: '78910001008',
    salePrice: 52.90, // Por kg
    costPrice: 34.00,
    isWeighed: true,
    stockQuantity: 16.4,
    minStock: 5.0,
    unit: 'KG',
    expirationDate: '2026-11-18',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_9',
    name: 'Presunto Cozido Especial',
    category: 'FRIOS',
    barcode: '78910001009',
    salePrice: 38.90, // Por kg
    costPrice: 22.50,
    isWeighed: true,
    stockQuantity: 9.8,
    minStock: 4.0,
    unit: 'KG',
    expirationDate: '2026-11-20',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_10',
    name: 'Suco de Laranja da Fazenda 500ml',
    category: 'BEBIDAS',
    barcode: '78910001010',
    salePrice: 9.50,
    costPrice: 3.80,
    isWeighed: false,
    stockQuantity: 22,
    minStock: 10,
    unit: 'UN',
    expirationDate: '2026-11-09',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_11',
    name: 'Torta Holandesa Fatia Gourmet',
    category: 'CONFEITARIA',
    barcode: '78910001011',
    salePrice: 14.00,
    costPrice: 4.90,
    isWeighed: false,
    stockQuantity: 8,
    minStock: 5,
    unit: 'UN',
    expirationDate: '2026-11-06',
    updatedAt: Date.now(),
  },
  {
    id: 'prod_12',
    name: 'Croissant Francês Amanteigado',
    category: 'PAES',
    barcode: '78910001012',
    salePrice: 12.00,
    costPrice: 3.90,
    isWeighed: false,
    stockQuantity: 16,
    minStock: 8,
    unit: 'UN',
    expirationDate: '2026-11-05',
    updatedAt: Date.now(),
  }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec_1',
    name: 'Fornada Tradicional de Pão Francês',
    category: 'PAES',
    yieldUnits: 50,
    yieldDescription: '50 unidades de pão francês (50g cada assado)',
    preparationTimeMinutes: 120,
    ingredients: [
      { name: 'Farinha de Trigo Especial', quantity: 2.5, unit: 'kg', unitCost: 4.20, totalCost: 10.50 },
      { name: 'Fermento Biológico Fresco', quantity: 0.05, unit: 'kg', unitCost: 18.00, totalCost: 0.90 },
      { name: 'Sal Refinado', quantity: 0.035, unit: 'kg', unitCost: 2.50, totalCost: 0.09 },
      { name: 'Água Filtrada Gelada', quantity: 1.5, unit: 'l', unitCost: 0.10, totalCost: 0.15 },
      { name: 'Melhorador de Farinha', quantity: 0.025, unit: 'kg', unitCost: 35.00, totalCost: 0.88 },
    ],
    rawIngredientsCost: 12.52,
    overheadMarkupPercent: 15, // Custo indireto (forno, gás, energia, mão de obra)
    totalBatchCost: 14.40,
    unitCost: 0.288,
    targetMarginPercent: 66,
    suggestedSalePrice: 0.85,
    actualSalePrice: 0.85,
    instructions: [
      'Misturar a farinha, reforçador e água na masseira rápida por 4 minutos.',
      'Adicionar o sal e o fermento fresco e bater até atingir ponto de véu de glúten.',
      'Dividir em peças de 65g, bolear e descansar por 15 minutos.',
      'Modelar na cilindradora, arrumar nas esteiras e fermentar em câmara por 2 horas.',
      'Golear com lâmina (pestana) e assar em forno turbo a 200°C com vapor por 18 minutos.'
    ]
  },
  {
    id: 'rec_2',
    name: 'Pão de Queijo Mineiro Tradicional',
    category: 'PAES',
    yieldUnits: 40,
    yieldDescription: '40 unidades de 40g',
    preparationTimeMinutes: 45,
    ingredients: [
      { name: 'Polvilho Doce', quantity: 0.5, unit: 'kg', unitCost: 9.50, totalCost: 4.75 },
      { name: 'Polvilho Azedo', quantity: 0.5, unit: 'kg', unitCost: 9.80, totalCost: 4.90 },
      { name: 'Queijo Meia Cura Ralado', quantity: 0.4, unit: 'kg', unitCost: 44.00, totalCost: 17.60 },
      { name: 'Ovos Inteiros', quantity: 4, unit: 'un', unitCost: 0.70, totalCost: 2.80 },
      { name: 'Leite Integral', quantity: 0.3, unit: 'l', unitCost: 4.80, totalCost: 1.44 },
      { name: 'Óleo Vegetal', quantity: 0.15, unit: 'l', unitCost: 7.00, totalCost: 1.05 },
      { name: 'Sal', quantity: 0.015, unit: 'kg', unitCost: 2.50, totalCost: 0.04 },
    ],
    rawIngredientsCost: 32.58,
    overheadMarkupPercent: 15,
    totalBatchCost: 37.47,
    unitCost: 0.94,
    targetMarginPercent: 70,
    suggestedSalePrice: 3.13,
    actualSalePrice: 4.50,
    instructions: [
      'Ferver o leite com óleo e sal, escaldando a mistura dos polvilhos.',
      'Deixar amornar, acrescentar os ovos um a um e misturar bem.',
      'Adicionar o queijo ralado e homogeneizar até massa firme e maleável.',
      'Bolear porções de 40g e assar a 180°C por 25 minutos até dourar uniformemente.'
    ]
  },
  {
    id: 'rec_3',
    name: 'Bolo Caseiro de Cenoura com Calda de Brigadeiro',
    category: 'CONFEITARIA',
    yieldUnits: 12,
    yieldDescription: '12 fatias generosas',
    preparationTimeMinutes: 60,
    ingredients: [
      { name: 'Cenouras Frescas', quantity: 0.3, unit: 'kg', unitCost: 4.00, totalCost: 1.20 },
      { name: 'Ovos Caipiras', quantity: 4, unit: 'un', unitCost: 0.70, totalCost: 2.80 },
      { name: 'Óleo', quantity: 0.2, unit: 'l', unitCost: 7.00, totalCost: 1.40 },
      { name: 'Açúcar Cristal', quantity: 0.4, unit: 'kg', unitCost: 3.90, totalCost: 1.56 },
      { name: 'Farinha de Trigo', quantity: 0.35, unit: 'kg', unitCost: 4.20, totalCost: 1.47 },
      { name: 'Fermento em Pó', quantity: 0.02, unit: 'kg', unitCost: 30.00, totalCost: 0.60 },
      { name: 'Leite Condensado', quantity: 1, unit: 'un', unitCost: 6.50, totalCost: 6.50 },
      { name: 'Chocolate em Pó 50%', quantity: 0.08, unit: 'kg', unitCost: 32.00, totalCost: 2.56 },
      { name: 'Manteiga Extra', quantity: 0.03, unit: 'kg', unitCost: 48.00, totalCost: 1.44 },
    ],
    rawIngredientsCost: 19.53,
    overheadMarkupPercent: 15,
    totalBatchCost: 22.46,
    unitCost: 1.87,
    targetMarginPercent: 75,
    suggestedSalePrice: 7.48,
    actualSalePrice: 9.50,
    instructions: [
      'Bater no liquidificador as cenouras picadas, os ovos e o óleo até textura cremosa.',
      'Despejar em tigela com o açúcar e a farinha peneirada, finalizando com o fermento.',
      'Assar em forma untada a 180°C por 40 minutos.',
      'Preparar o brigadeiro cremoso em fogo brando e despejar generosamente sobre o bolo ainda morno.'
    ]
  }
];

export const INITIAL_ORDERS: BakeryOrder[] = [
  {
    id: 'ord_1',
    customerName: 'Mariana Silveira',
    customerPhone: '(11) 98765-4321',
    deliveryDate: '2026-11-05',
    deliveryTime: '15:30',
    itemsDescription: '1x Bolo de Morango c/ Ninho 2.5kg + 100x Coxinhas Festa',
    totalAmount: 240.00,
    depositAmount: 120.00,
    remainingAmount: 120.00,
    status: 'EM_PRODUCAO',
    notes: 'Escrever na placa de chocolate: "Parabéns Sofia 5 Anos"',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'ord_2',
    customerName: 'Carlos Eduardo Mendes (Escritório Silva)',
    customerPhone: '(11) 99123-8877',
    deliveryDate: '2026-11-05',
    deliveryTime: '08:00',
    itemsDescription: 'Coffee Break: 30 Mini Pães de Queijo, 20 Croissants e 2 Garrafas Café',
    totalAmount: 185.00,
    depositAmount: 185.00,
    remainingAmount: 0.00,
    status: 'PRONTO',
    notes: 'Entregar com nota fiscal e copos térmicos descartáveis.',
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'ord_3',
    customerName: 'Renata Albuquerque',
    customerPhone: '(11) 97654-3210',
    deliveryDate: '2026-11-06',
    deliveryTime: '17:00',
    itemsDescription: 'Torta Holandesa Grande (Aro 28cm) para aniversário',
    totalAmount: 135.00,
    depositAmount: 50.00,
    remainingAmount: 85.00,
    status: 'PENDENTE',
    notes: 'Cliente vai retirar na loja física às 17h.',
    createdAt: Date.now() - 3600000,
  }
];

export const INITIAL_CASH_REGISTER: CashRegister = {
  id: 'cx_' + Date.now(),
  status: 'OPEN',
  operatorName: 'Caixa Principal (Operador 01)',
  openedAt: Date.now() - 14400000, // Aberto há 4 horas
  initialAmount: 150.00, // Troco inicial
  movements: [
    {
      id: 'mov_1',
      type: 'SUPRIMENTO',
      amount: 50.00,
      reason: 'Reforço de moedas para troco',
      timestamp: Date.now() - 10800000,
      operator: 'Gerente Carlos'
    }
  ],
  salesCount: 14,
  salesTotal: 486.50,
  salesByMethod: {
    DINHEIRO: 145.50,
    PIX: 180.00,
    CARTAO_DEBITO: 92.00,
    CARTAO_CREDITO: 69.00,
    FIADO: 0.00
  },
  expectedCashAmount: 150.00 + 50.00 + 145.50, // 345.50
};

export const INITIAL_FINANCES: FinancialTransaction[] = [
  {
    id: 'tx_1',
    type: 'RECEITA',
    category: 'VENDAS',
    description: 'Vendas acumuladas do turno matutino',
    amount: 1250.00,
    timestamp: Date.now() - 86400000,
    paymentMethod: 'DIVERSOS'
  },
  {
    id: 'tx_2',
    type: 'DESPESA',
    category: 'MATERIA_PRIMA',
    description: 'Compra de 10 sacos de Farinha de Trigo Especial 25kg',
    amount: 850.00,
    timestamp: Date.now() - 86400000,
    paymentMethod: 'PIX'
  },
  {
    id: 'tx_3',
    type: 'DESPESA',
    category: 'GAS_FORNO',
    description: 'Recarga do cilindro de Gás P-45 para forno de panificação',
    amount: 420.00,
    timestamp: Date.now() - (86400000 * 3),
    paymentMethod: 'BOLETO'
  },
  {
    id: 'tx_4',
    type: 'DESPESA',
    category: 'ENERGIA_ELETRICA',
    description: 'Conta de Energia (Câmara fria, fornos e balcões refrigerados)',
    amount: 1180.00,
    timestamp: Date.now() - (86400000 * 5),
    paymentMethod: 'BOLETO'
  }
];

class StorageService {
  getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.addSyncLog('UPDATE', 'PRODUCTS');
  }

  getSales(): Sale[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveSale(sale: Sale): void {
    const sales = this.getSales();
    sales.unshift(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

    // Abate de estoque
    const products = this.getProducts();
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        prod.updatedAt = Date.now();
      }
    });
    this.saveProducts(products);

    // Atualiza o caixa atual
    const cash = this.getCashRegister();
    if (cash && cash.status === 'OPEN') {
      cash.salesCount += 1;
      cash.salesTotal += sale.total;
      cash.salesByMethod[sale.paymentMethod] = (cash.salesByMethod[sale.paymentMethod] || 0) + sale.total;
      if (sale.paymentMethod === 'DINHEIRO') {
        cash.expectedCashAmount += sale.total;
      }
      this.saveCashRegister(cash);
    }

    // Registra transação no financeiro
    this.addFinancialTransaction({
      id: 'tx_' + sale.id,
      type: 'RECEITA',
      category: 'VENDAS',
      description: `Venda #${sale.code} (${sale.paymentMethod})`,
      amount: sale.total,
      timestamp: sale.timestamp,
      paymentMethod: sale.paymentMethod
    });

    this.addSyncLog('INSERT', `SALE_${sale.code}`);
  }

  getRecipes(): Recipe[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (!raw) {
      this.saveRecipes(INITIAL_RECIPES);
      return INITIAL_RECIPES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RECIPES;
    }
  }

  saveRecipes(recipes: Recipe[]): void {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }

  getCashRegister(): CashRegister {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_REGISTER);
    if (!raw) {
      this.saveCashRegister(INITIAL_CASH_REGISTER);
      return INITIAL_CASH_REGISTER;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CASH_REGISTER;
    }
  }

  saveCashRegister(cash: CashRegister): void {
    localStorage.setItem(STORAGE_KEYS.CASH_REGISTER, JSON.stringify(cash));
  }

  getFinances(): FinancialTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCES);
    if (!raw) {
      this.saveFinances(INITIAL_FINANCES);
      return INITIAL_FINANCES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_FINANCES;
    }
  }

  saveFinances(txs: FinancialTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(txs));
  }

  addFinancialTransaction(tx: FinancialTransaction): void {
    const finances = this.getFinances();
    finances.unshift(tx);
    this.saveFinances(finances);
  }

  getOrders(): BakeryOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      this.saveOrders(INITIAL_ORDERS);
      return INITIAL_ORDERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ORDERS;
    }
  }

  saveOrders(orders: BakeryOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  getSyncState(): SyncState {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC);
    if (!raw) {
      const initial: SyncState = {
        isOnline: navigator.onLine,
        firestoreEnabled: false,
        lastSyncTimestamp: Date.now() - 300000,
        pendingChangesCount: 0,
        syncLog: [
          { id: '1', action: 'INIT', entity: 'LOCAL_ROOM_DB', timestamp: Date.now() - 300000, status: 'SYNCED' }
        ]
      };
      this.saveSyncState(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        isOnline: navigator.onLine,
        firestoreEnabled: false,
        lastSyncTimestamp: Date.now(),
        pendingChangesCount: 0,
        syncLog: []
      };
    }
  }

  saveSyncState(state: SyncState): void {
    localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(state));
  }

  addSyncLog(action: string, entity: string): void {
    const sync = this.getSyncState();
    sync.pendingChangesCount += 1;
    sync.syncLog.unshift({
      id: 'log_' + Date.now(),
      action,
      entity,
      timestamp: Date.now(),
      status: sync.firestoreEnabled ? 'SYNCED' : 'PENDING'
    });
    if (sync.firestoreEnabled) {
      sync.lastSyncTimestamp = Date.now();
      sync.pendingChangesCount = 0;
    }
    this.saveSyncState(sync);
  }

  exportFullBackup(): string {
    const backup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      sales: this.getSales(),
      recipes: this.getRecipes(),
      cashRegister: this.getCashRegister(),
      finances: this.getFinances(),
      orders: this.getOrders(),
    };
    return JSON.stringify(backup, null, 2);
  }

  importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) this.saveProducts(data.products);
      if (data.sales) localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data.sales));
      if (data.recipes) this.saveRecipes(data.recipes);
      if (data.cashRegister) this.saveCashRegister(data.cashRegister);
      if (data.finances) this.saveFinances(data.finances);
      if (data.orders) this.saveOrders(data.orders);
      return true;
    } catch {
      return false;
    }
  }

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.RECIPES);
    localStorage.removeItem(STORAGE_KEYS.CASH_REGISTER);
    localStorage.removeItem(STORAGE_KEYS.FINANCES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SYNC);
  }
}

export const storage = new StorageService();
