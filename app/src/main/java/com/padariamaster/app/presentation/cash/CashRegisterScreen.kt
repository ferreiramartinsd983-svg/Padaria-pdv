package com.padariamaster.app.presentation.cash

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun CashRegisterScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Controle de Caixa & Sangria", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Abertura, suprimentos, sangrias de segurança e fechamento com conferência cega", color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
