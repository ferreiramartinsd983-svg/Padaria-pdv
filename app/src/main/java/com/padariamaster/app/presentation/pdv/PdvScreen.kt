package com.padariamaster.app.presentation.pdv

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Scale
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.padariamaster.app.core.util.CurrencyUtils
import com.padariamaster.app.data.local.entity.ProductEntity
import com.padariamaster.app.presentation.theme.AlertRed
import com.padariamaster.app.presentation.theme.GoldPrimary
import com.padariamaster.app.presentation.theme.ProfitGreen

data class CartItemUi(
    val product: ProductEntity,
    var quantity: Double = 1.0
) {
    val total: Double get() = quantity * product.salePrice
}

@Composable
fun PdvScreen() {
    var cart by remember { mutableStateOf(listOf<CartItemUi>()) }
    var selectedCategory by remember { mutableStateOf("TODOS") }
    var showCheckoutDialog by remember { mutableStateOf(false) }

    // Mock para visualização composable preview
    val sampleProducts = remember {
        listOf(
            ProductEntity(1, "Pão Francês Quente", "PAES", "7891", 19.90, 7.50, true, 45.0, 10.0, "KG"),
            ProductEntity(2, "Pão de Queijo", "PAES", "7892", 4.50, 1.60, false, 80.0, 20.0, "UN"),
            ProductEntity(3, "Bolo de Cenoura c/ Choc", "CONFEITARIA", "7893", 8.50, 2.90, false, 15.0, 5.0, "UN"),
            ProductEntity(4, "Café Expresso Duplo", "BEBIDAS", "7894", 6.00, 1.10, false, 200.0, 30.0, "UN"),
            ProductEntity(5, "Coxinha de Catupiry", "SALGADOS", "7895", 9.00, 3.20, false, 25.0, 8.0, "UN"),
            ProductEntity(6, "Sonho de Creme", "CONFEITARIA", "7896", 7.50, 2.40, false, 18.0, 6.0, "UN")
        )
    }

    val totalCart = cart.sumOf { it.total }

    Row(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        // Coluna da Esquerda: Catálogo Touch de Produtos
        Column(modifier = Modifier.weight(1.4f).fillMaxHeight()) {
            Text(
                text = "Frente de Caixa Rápido (PDV)",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Categorias em Chips horizontais
            val categories = listOf("TODOS", "PAES", "CONFEITARIA", "SALGADOS", "BEBIDAS")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                categories.forEach { cat ->
                    FilterChip(
                        selected = selectedCategory == cat,
                        onClick = { selectedCategory = cat },
                        label = { Text(cat) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Grid de Botões Grandes de Produtos
            val filteredProducts = if (selectedCategory == "TODOS") sampleProducts else sampleProducts.filter { it.category == selectedCategory }

            LazyVerticalGrid(
                columns = GridCells.Adaptive(130.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredProducts) { product ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp)
                            .clickable {
                                val existing = cart.find { it.product.id == product.id }
                                if (existing != null) {
                                    cart = cart.map {
                                        if (it.product.id == product.id) it.copy(quantity = it.quantity + (if (product.isWeighed) 0.1 else 1.0))
                                        else it
                                    }
                                } else {
                                    cart = cart + CartItemUi(product, if (product.isWeighed) 0.350 else 1.0)
                                }
                            },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier.padding(10.dp).fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = product.name,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 2,
                                fontSize = 14.sp
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = CurrencyUtils.format(product.salePrice) + if (product.isWeighed) "/kg" else "",
                                    fontWeight = FontWeight.Bold,
                                    color = GoldPrimary,
                                    fontSize = 13.sp
                                )
                                if (product.isWeighed) {
                                    Icon(Icons.Default.Scale, contentDescription = "Balança", modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Coluna da Direita: Carrinho e Fechamento
        Card(
            modifier = Modifier.weight(1f).fillMaxHeight(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.fillMaxSize().padding(14.dp)) {
                Text(
                    text = "Carrinho da Venda",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Column(modifier = Modifier.weight(1f)) {
                    if (cart.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Toque nos produtos para adicionar ao carrinho", color = Color.Gray, fontSize = 13.sp)
                        }
                    } else {
                        cart.forEach { item ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.product.name, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                    Text(
                                        "${if (item.product.isWeighed) CurrencyUtils.formatKg(item.quantity) else "${item.quantity.toInt()} un"} x ${CurrencyUtils.format(item.product.salePrice)}",
                                        fontSize = 11.sp,
                                        color = Color.Gray
                                    )
                                }
                                Text(CurrencyUtils.format(item.total), fontWeight = FontWeight.Bold)
                                IconButton(onClick = { cart = cart.filter { it.product.id != item.product.id } }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Remover", tint = AlertRed)
                                }
                            }
                            HorizontalDivider()
                        }
                    }
                }

                // Subtotal e Botão Finalizar
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Total a Pagar:", style = MaterialTheme.typography.titleMedium)
                    Text(
                        CurrencyUtils.format(totalCart),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = ProfitGreen
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { showCheckoutDialog = true },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    enabled = cart.isNotEmpty(),
                    colors = ButtonDefaults.buttonColors(containerColor = ProfitGreen)
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Cobrar Venda (F2)", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
