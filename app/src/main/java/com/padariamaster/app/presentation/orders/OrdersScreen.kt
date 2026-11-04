package com.padariamaster.app.presentation.orders

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun OrdersScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Controle de Encomendas & Confeitaria", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Pedidos de bolos decorados, salgados para festas e eventos com controle de sinal", color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
