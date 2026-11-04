package com.padariamaster.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "recipes")
data class RecipeEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val category: String, // PAES, CONFEITARIA, SALGADOS
    val yieldUnits: Double, // Ex: Rende 50 pães ou 1 bolo
    val preparationTimeMinutes: Int = 60,
    val totalCost: Double,
    val unitCost: Double,
    val targetMarginPercent: Double = 60.0,
    val suggestedSellingPrice: Double,
    val actualSellingPrice: Double,
    val ingredientsJson: String, // Lista serializada de ingredientes
    val instructions: String = "",
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "cash_registers")
data class CashRegisterEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val operatorName: String,
    val openedAt: Long = System.currentTimeMillis(),
    val closedAt: Long? = null,
    val initialAmount: Double,
    val totalCashSales: Double = 0.0,
    val totalPixSales: Double = 0.0,
    val totalCardSales: Double = 0.0,
    val totalSupplements: Double = 0.0, // Suprimentos / Entradas extras
    val totalBleeds: Double = 0.0, // Sangrias / Retiradas
    val expectedAmount: Double = initialAmount,
    val actualAmount: Double? = null,
    val differenceAmount: Double? = null, // Quebra de caixa
    val status: String = "OPEN", // OPEN, CLOSED
    val notes: String = ""
)

@Entity(tableName = "financial_transactions")
data class FinancialTransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: String, // RECEITA (Entrada), DESPESA (Saída)
    val category: String, // VENDAS, MATERIA_PRIMA, ENERGIA, GAS, ALUGUEL, SALARIOS, OUTROS
    val description: String,
    val amount: Double,
    val timestamp: Long = System.currentTimeMillis(),
    val paymentMethod: String, // DINHEIRO, PIX, TRANSFERENCIA, BOLETO, CARTAO
    val isPaid: Boolean = true,
    val isSynced: Boolean = false
)

@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val customerName: String,
    val customerPhone: String,
    val deliveryDate: String, // AAAA-MM-DD
    val deliveryTime: String, // HH:MM
    val itemsSummary: String,
    val totalAmount: Double,
    val depositAmount: Double = 0.0, // Sinal / Adiantamento pago
    val remainingAmount: Double = totalAmount,
    val status: String = "PENDING", // PENDING, IN_PRODUCTION, READY, DELIVERED, CANCELLED
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
