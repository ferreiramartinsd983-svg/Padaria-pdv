package com.padariamaster.app.data.repository

import com.padariamaster.app.data.local.dao.CashRegisterDao
import com.padariamaster.app.data.local.dao.FinancialDao
import com.padariamaster.app.data.local.dao.OrderDao
import com.padariamaster.app.data.local.dao.ProductDao
import com.padariamaster.app.data.local.dao.RecipeDao
import com.padariamaster.app.data.local.dao.SaleDao
import com.padariamaster.app.data.local.dao.SaleWithItems
import com.padariamaster.app.data.local.entity.CashRegisterEntity
import com.padariamaster.app.data.local.entity.FinancialTransactionEntity
import com.padariamaster.app.data.local.entity.OrderEntity
import com.padariamaster.app.data.local.entity.ProductEntity
import com.padariamaster.app.data.local.entity.RecipeEntity
import com.padariamaster.app.data.local.entity.SaleEntity
import com.padariamaster.app.data.local.entity.SaleItemEntity
import kotlinx.coroutines.flow.Flow

class PadariaRepositoryImpl(
    private val productDao: ProductDao,
    private val saleDao: SaleDao,
    private val recipeDao: RecipeDao,
    private val cashRegisterDao: CashRegisterDao,
    private val financialDao: FinancialDao,
    private val orderDao: OrderDao
) {
    fun getAllProducts(): Flow<List<ProductEntity>> = productDao.getAllProducts()
    fun getProductsByCategory(category: String): Flow<List<ProductEntity>> = productDao.getProductsByCategory(category)
    fun getLowStockProducts(): Flow<List<ProductEntity>> = productDao.getLowStockProducts()
    suspend fun getProductByBarcode(barcode: String): ProductEntity? = productDao.getProductByBarcode(barcode)
    suspend fun saveProduct(product: ProductEntity) = productDao.insertProduct(product)
    suspend fun deleteProduct(product: ProductEntity) = productDao.deleteProduct(product)

    fun getAllSales(): Flow<List<SaleWithItems>> = saleDao.getAllSales()
    suspend fun recordSale(sale: SaleEntity, items: List<SaleItemEntity>): Long {
        val saleId = saleDao.insertSale(sale)
        val itemsWithSaleId = items.map { it.copy(saleId = saleId) }
        saleDao.insertSaleItems(itemsWithSaleId)

        // Decrementar estoque local automaticamente
        for (item in items) {
            productDao.decrementStock(item.productId, item.quantity)
        }

        // Registrar entrada no financeiro
        financialDao.insertTransaction(
            FinancialTransactionEntity(
                type = "RECEITA",
                category = "VENDAS",
                description = "Venda PDV #${saleId} (${sale.paymentMethod})",
                amount = sale.netAmount,
                paymentMethod = sale.paymentMethod
            )
        )

        return saleId
    }

    fun getActiveCashRegister(): Flow<CashRegisterEntity?> = cashRegisterDao.getActiveCashRegister()
    suspend fun openCashRegister(initialAmount: Double, operatorName: String) {
        cashRegisterDao.insertCashRegister(
            CashRegisterEntity(
                operatorName = operatorName,
                initialAmount = initialAmount,
                expectedAmount = initialAmount,
                status = "OPEN"
            )
        )
    }
    suspend fun updateCashRegister(cashRegister: CashRegisterEntity) {
        cashRegisterDao.updateCashRegister(cashRegister)
    }

    fun getAllRecipes(): Flow<List<RecipeEntity>> = recipeDao.getAllRecipes()
    suspend fun saveRecipe(recipe: RecipeEntity) = recipeDao.insertRecipe(recipe)

    fun getAllTransactions(): Flow<List<FinancialTransactionEntity>> = financialDao.getAllTransactions()
    suspend fun addTransaction(tx: FinancialTransactionEntity) = financialDao.insertTransaction(tx)

    fun getActiveOrders(): Flow<List<OrderEntity>> = orderDao.getActiveOrders()
    suspend fun saveOrder(order: OrderEntity) = orderDao.insertOrder(order)
    suspend fun updateOrder(order: OrderEntity) = orderDao.updateOrder(order)
}
