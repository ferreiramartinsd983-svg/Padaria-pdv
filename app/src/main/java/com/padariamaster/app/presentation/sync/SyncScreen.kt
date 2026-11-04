package com.padariamaster.app.presentation.sync

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.padariamaster.app.presentation.theme.ProfitGreen

@Composable
fun SyncScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Sincronização & Modo Offline", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Arquitetura Offline-First com Room Database e sincronização opcional com Cloud Firestore", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(16.dp))

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Banco Local Room: OPERACIONAL", fontWeight = FontWeight.Bold, color = ProfitGreen)
                Spacer(modifier = Modifier.height(6.dp))
                Text("Todos os dados de vendas, estoque e receitas funcionam 100% offline sem necessidade de sinal de internet.")
            }
        }
    }
}
