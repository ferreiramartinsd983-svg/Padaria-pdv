package com.padariamaster.app.presentation.finance

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.padariamaster.app.presentation.theme.AlertRed
import com.padariamaster.app.presentation.theme.ProfitGreen

@Composable
fun FinanceScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("DRE & Gestão Financeira da Padaria", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Demonstrativo do Resultado do Exercício com receitas, custos operacionais e lucro real", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(16.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Card(modifier = Modifier.weight(1f)) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Faturamento do Dia", style = MaterialTheme.typography.labelMedium)
                    Text("R$ 2.450,00", fontWeight = FontWeight.ExtraBold, color = ProfitGreen, style = MaterialTheme.typography.titleLarge)
                }
            }
            Card(modifier = Modifier.weight(1f)) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Despesas Operacionais", style = MaterialTheme.typography.labelMedium)
                    Text("R$ 780,00", fontWeight = FontWeight.ExtraBold, color = AlertRed, style = MaterialTheme.typography.titleLarge)
                }
            }
        }
    }
}
