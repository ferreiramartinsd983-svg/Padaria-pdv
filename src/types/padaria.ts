export type ProductCategory = 
  | 'TODOS'
  | 'PAES'
  | 'CONFEITARIA'
  | 'SALGADOS'
  | 'BEBIDAS'
  | 'FRIOS'
  | 'MERCEARIA';

export type PaymentMethod = 
  | 'DINHEIRO' 
  | 'PIX' 
  | 'CARTAO_DEBITO' 
  | 'CARTAO_CREDITO' 
  | 'FIADO'
  | 'MISTO';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  barcode: string;
  salePrice: number;
  costPrice: number;
  isWeighed: boolean; // se vendido por peso (kg) na balança
  stockQuantity: number;
  minStock: number;
  unit: 'KG' | 'UN' | 'PCT';
  batchNumber?: string;
  expirationDate?: string; // YYYY-MM-DD
  imageUrl?: string;
  updatedAt: number;
  isArchived?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number; // Em unidades ou kg
  unitPrice: number;
  totalPrice: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isWeighed: boolean;
}

export interface Sale {
  id: string;
  code: string;
  timestamp: number;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: Partial<Record<Exclude<PaymentMethod, 'MISTO'>, number>>;
  amountPaid: number;
  changeAmount: number;
  customerName?: string;
  cashRegisterId: string;
  isSynced: boolean;
  status?: 'CONCLUIDA' | 'CANCELADA';
  cancelledAt?: number;
  cancellationReason?: string;
  cancelledBy?: string;
}

export interface Ingredient {
  name: string;
  stockProductId?: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'un';
  unitCost: number; // Custo por kg/l/un
  totalCost: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: 'PAES' | 'CONFEITARIA' | 'SALGADOS';
  yieldUnits: number; // Ex: 50 pães ou 1 bolo
  yieldDescription: string;
  preparationTimeMinutes: number;
  ingredients: Ingredient[];
  rawIngredientsCost: number;
  overheadMarkupPercent: number; // 15% para gás de forno, luz, água
  totalBatchCost: number;
  unitCost: number;
  targetMarginPercent: number; // Ex: 65%
  suggestedSalePrice: number;
  actualSalePrice: number;
  instructions: string[];
}

export interface CashMovement {
  id: string;
  type: 'SUPRIMENTO' | 'SANGRIA';
  amount: number;
  reason: string;
  timestamp: number;
  operator: string;
}

export interface CashRegister {
  id: string;
  status: 'OPEN' | 'CLOSED';
  operatorName: string;
  openedAt: number;
  closedAt?: number;
  initialAmount: number; // Fundo de troco inicial
  movements: CashMovement[];
  salesCount: number;
  salesTotal: number;
  salesByMethod: Record<PaymentMethod, number>;
  expectedCashAmount: number;
  actualCashAmount?: number;
  cashDifference?: number; // Quebra de caixa
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'RECEITA' | 'DESPESA';
  category: 
    | 'VENDAS' 
    | 'MATERIA_PRIMA' 
    | 'ENERGIA_ELETRICA' 
    | 'GAS_FORNO' 
    | 'ALUGUEL' 
    | 'FOLHA_PAGAMENTO' 
    | 'MANUTENCAO' 
    | 'OUTROS';
  description: string;
  amount: number;
  timestamp: number;
  paymentMethod: string;
}

export interface BakeryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime: string; // HH:MM
  itemsDescription: string;
  totalAmount: number;
  depositAmount: number; // Sinal pago
  remainingAmount: number;
  status: 'PENDENTE' | 'EM_PRODUCAO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
  notes?: string;
  createdAt: number;
}

export interface SyncState {
  isOnline: boolean;
  firestoreEnabled: boolean;
  lastSyncTimestamp: number | null;
  pendingChangesCount: number;
  syncLog: Array<{
    id: string;
    action: string;
    entity: string;
    timestamp: number;
    status: 'PENDING' | 'SYNCED' | 'FAILED';
  }>;
}


export interface ProductionBatch { id:string; recipeId:string; recipeName:string; quantity:number; productId:string; producedAt:number; operator:string; cost:number; }
export interface Supplier { id:string; name:string; phone:string; document:string; notes:string; }
export interface AuditEntry { id:string; action:string; detail:string; operator:string; timestamp:number; }

export interface PurchaseEntry { id:string; supplierId?:string; supplierName:string; productId:string; productName:string; quantity:number; unit:string; unitCost:number; totalCost:number; receivedAt:number; }

export interface VoiceNote { id:string; title:string; text:string; createdAt:number; updatedAt:number; }
