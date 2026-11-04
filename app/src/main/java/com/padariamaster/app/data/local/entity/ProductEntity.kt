package com.padariamaster.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val category: String, // PAES, CONFEITARIA, SALGADOS, BEBIDAS, MERCEARIA, FRIOS
    val barcode: String? = null,
    val salePrice: Double,
    val costPrice: Double,
    val isWeighed: Boolean = false, // True se vendido por Quilo (balança)
    val stockQuantity: Double,
    val minStock: Double = 5.0,
    val unit: String = "UN", // UN, KG, PCT
    val batchNumber: String? = null,
    val expirationDate: Long? = null, // Epoch millis
    val imageUri: String? = null,
    val updatedAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)
