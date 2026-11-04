package com.padariamaster.app.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.padariamaster.app.data.local.dao.CashRegisterDao
import com.padariamaster.app.data.local.dao.FinancialDao
import com.padariamaster.app.data.local.dao.OrderDao
import com.padariamaster.app.data.local.dao.ProductDao
import com.padariamaster.app.data.local.dao.RecipeDao
import com.padariamaster.app.data.local.dao.SaleDao
import com.padariamaster.app.data.local.entity.CashRegisterEntity
import com.padariamaster.app.data.local.entity.FinancialTransactionEntity
import com.padariamaster.app.data.local.entity.OrderEntity
import com.padariamaster.app.data.local.entity.ProductEntity
import com.padariamaster.app.data.local.entity.RecipeEntity
import com.padariamaster.app.data.local.entity.SaleEntity
import com.padariamaster.app.data.local.entity.SaleItemEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ProductEntity::class,
        SaleEntity::class,
        SaleItemEntity::class,
        RecipeEntity::class,
        CashRegisterEntity::class,
        FinancialTransactionEntity::class,
        OrderEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun saleDao(): SaleDao
    abstract fun recipeDao(): RecipeDao
    abstract fun cashRegisterDao(): CashRegisterDao
    abstract fun financialDao(): FinancialDao
    abstract fun orderDao(): OrderDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "padaria_master_db.sqlite"
                )
                    .addCallback(DatabaseCallback())
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback : Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                // Carga inicial dos produtos típicos da Padaria Brasileira no primeiro boot offline
                INSTANCE?.let { database ->
                    CoroutineScope(Dispatchers.IO).launch {
                        populateInitialBakeryData(database)
                    }
                }
            }

            private suspend fun populateInitialBakeryData(database: AppDatabase) {
                val productDao = database.productDao()
                val products = listOf(
                    ProductEntity(
                        name = "Pão Francês Tradicional",
                        category = "PAES",
                        barcode = "78910001",
                        salePrice = 19.90, // Por Kg
                        costPrice = 7.50,
                        isWeighed = true,
                        stockQuantity = 45.0, // kg
                        minStock = 10.0,
                        unit = "KG"
                    ),
                    ProductEntity(
                        name = "Pão de Queijo Mineiro",
                        category = "PAES",
                        barcode = "78910002",
                        salePrice = 4.50,
                        costPrice = 1.60,
                        isWeighed = false,
                        stockQuantity = 80.0,
                        minStock = 20.0,
                        unit = "UN"
                    ),
                    ProductEntity(
                        name = "Bolo de Cenoura c/ Brigadeiro",
                        category = "CONFEITARIA",
                        barcode = "78910003",
                        salePrice = 8.50,
                        costPrice = 2.90,
                        isWeighed = false,
                        stockQuantity = 15.0,
                        minStock = 5.0,
                        unit = "UN"
                    ),
                    ProductEntity(
                        name = "Café Expresso Duplo Crema",
                        category = "BEBIDAS",
                        barcode = "78910004",
                        salePrice = 6.00,
                        costPrice = 1.10,
                        isWeighed = false,
                        stockQuantity = 200.0,
                        minStock = 30.0,
                        unit = "UN"
                    ),
                    ProductEntity(
                        name = "Coxinha de Frango c/ Catupiry",
                        category = "SALGADOS",
                        barcode = "78910005",
                        salePrice = 9.00,
                        costPrice = 3.20,
                        isWeighed = false,
                        stockQuantity = 25.0,
                        minStock = 8.0,
                        unit = "UN"
                    ),
                    ProductEntity(
                        name = "Sonho de Creme de Baunilha",
                        category = "CONFEITARIA",
                        barcode = "78910006",
                        salePrice = 7.50,
                        costPrice = 2.40,
                        isWeighed = false,
                        stockQuantity = 18.0,
                        minStock = 6.0,
                        unit = "UN"
                    ),
                    ProductEntity(
                        name = "Queijo Muçarela Fatiado",
                        category = "FRIOS",
                        barcode = "78910007",
                        salePrice = 49.90,
                        costPrice = 32.00,
                        isWeighed = true,
                        stockQuantity = 12.5,
                        minStock = 3.0,
                        unit = "KG"
                    ),
                    ProductEntity(
                        name = "Suco de Laranja Natural 500ml",
                        category = "BEBIDAS",
                        barcode = "78910008",
                        salePrice = 9.50,
                        costPrice = 3.50,
                        isWeighed = false,
                        stockQuantity = 30.0,
                        minStock = 10.0,
                        unit = "UN"
                    )
                )
                productDao.insertProducts(products)

                // Inicializar um caixa aberto com R$ 150,00 de troco inicial
                val cashDao = database.cashRegisterDao()
                cashDao.insertCashRegister(
                    CashRegisterEntity(
                        operatorName = "Caixa Principal 01",
                        initialAmount = 150.0,
                        expectedAmount = 150.0,
                        status = "OPEN"
                    )
                )
            }
        }
    }
}
