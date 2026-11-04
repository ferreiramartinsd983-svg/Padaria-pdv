package com.padariamaster.app.domain.usecase

import com.padariamaster.app.data.local.entity.SaleEntity
import com.padariamaster.app.data.local.entity.SaleItemEntity
import com.padariamaster.app.data.repository.PadariaRepositoryImpl

data class CartItem(
    val productId: Long,
    val productName: String,
    val quantity: Double,
    val unitPrice: Double,
    val isWeighed: Boolean = false
) {
    val totalPrice: Double get() = quantity * unitPrice
}

class ProcessSaleUseCase(
    private val repository: PadariaRepositoryImpl
) {
    suspend operator fun invoke(
        cashRegisterId: Long,
        items: List<CartItem>,
        discount: Double,
        paymentMethod: String,
        amountPaid: Double,
        customerName: String? = null
    ): Result<Long> {
        if (items.isEmpty()) {
            return Result.failure(IllegalArgumentException("O carrinho não pode estar vazio."))
        }

        val totalAmount = items.sumOf { it.totalPrice }
        val netAmount = (totalAmount - discount).coerceAtLeast(0.0)

        if (paymentMethod == "DINHEIRO" && amountPaid < netAmount) {
            return Result.failure(IllegalArgumentException("Valor pago em dinheiro é insuficiente."))
        }

        val changeAmount = if (paymentMethod == "DINHEIRO") (amountPaid - netAmount).coerceAtLeast(0.0) else 0.0

        val sale = SaleEntity(
            totalAmount = totalAmount,
            discount = discount,
            netAmount = netAmount,
            paymentMethod = paymentMethod,
            amountPaid = amountPaid,
            changeAmount = changeAmount,
            cashRegisterId = cashRegisterId,
            customerName = customerName
        )

        val saleItems = items.map { item ->
            SaleItemEntity(
                saleId = 0,
                productId = item.productId,
                productName = item.productName,
                quantity = item.quantity,
                unitPrice = item.unitPrice,
                totalPrice = item.totalPrice,
                isWeighed = item.isWeighed
            )
        }

        return try {
            val saleId = repository.recordSale(sale, saleItems)
            Result.success(saleId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
