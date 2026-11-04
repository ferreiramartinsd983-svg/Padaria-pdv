package com.padariamaster.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.padariamaster.app.data.local.entity.CashRegisterEntity
import com.padariamaster.app.data.local.entity.FinancialTransactionEntity
import com.padariamaster.app.data.local.entity.OrderEntity
import com.padariamaster.app.data.local.entity.RecipeEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RecipeDao {
    @Query("SELECT * FROM recipes ORDER BY name ASC")
    fun getAllRecipes(): Flow<List<RecipeEntity>>

    @Query("SELECT * FROM recipes WHERE id = :id LIMIT 1")
    suspend fun getRecipeById(id: Long): RecipeEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecipe(recipe: RecipeEntity): Long

    @Update
    suspend fun updateRecipe(recipe: RecipeEntity)

    @Delete
    suspend fun deleteRecipe(recipe: RecipeEntity)
}

@Dao
interface CashRegisterDao {
    @Query("SELECT * FROM cash_registers WHERE status = 'OPEN' ORDER BY openedAt DESC LIMIT 1")
    fun getActiveCashRegister(): Flow<CashRegisterEntity?>

    @Query("SELECT * FROM cash_registers ORDER BY openedAt DESC")
    fun getAllCashRegisters(): Flow<List<CashRegisterEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCashRegister(cashRegister: CashRegisterEntity): Long

    @Update
    suspend fun updateCashRegister(cashRegister: CashRegisterEntity)
}

@Dao
interface FinancialDao {
    @Query("SELECT * FROM financial_transactions ORDER BY timestamp DESC")
    fun getAllTransactions(): Flow<List<FinancialTransactionEntity>>

    @Query("SELECT * FROM financial_transactions WHERE type = 'RECEITA' AND timestamp >= :startTime")
    fun getIncomesSince(startTime: Long): Flow<List<FinancialTransactionEntity>>

    @Query("SELECT * FROM financial_transactions WHERE type = 'DESPESA' AND timestamp >= :startTime")
    fun getExpensesSince(startTime: Long): Flow<List<FinancialTransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: FinancialTransactionEntity): Long

    @Delete
    suspend fun deleteTransaction(transaction: FinancialTransactionEntity)
}

@Dao
interface OrderDao {
    @Query("SELECT * FROM orders ORDER BY deliveryDate ASC, deliveryTime ASC")
    fun getAllOrders(): Flow<List<OrderEntity>>

    @Query("SELECT * FROM orders WHERE status != 'DELIVERED' AND status != 'CANCELLED' ORDER BY deliveryDate ASC")
    fun getActiveOrders(): Flow<List<OrderEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: OrderEntity): Long

    @Update
    suspend fun updateOrder(order: OrderEntity)

    @Delete
    suspend fun deleteOrder(order: OrderEntity)
}
