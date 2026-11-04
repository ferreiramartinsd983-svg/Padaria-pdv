package com.padariamaster.app.presentation.stock

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.padariamaster.app.presentation.theme.AlertRed
import com.padariamaster.app.presentation.theme.ProfitGreen

@Composable
fun StockScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Controle de Estoque & Lotes", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Gerenciamento de ingredientes, produtos acabados e alertas de validade", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Alerta de Reposição & Validade Próxima", fontWeight = FontWeight.Bold, color = AlertRed)
                Text("3 produtos atingiram o estoque mínimo de segurança no forno/balcão.", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
