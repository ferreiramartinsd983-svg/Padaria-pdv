package com.padariamaster.app.presentation.recipes

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.padariamaster.app.presentation.theme.GoldPrimary
import com.padariamaster.app.presentation.theme.ProfitGreen

@Composable
fun RecipesScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Fichas Técnicas & Custo de Produção (CMV)", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Cálculo exato de rendimento de fornadas, custo por unidade e margem de lucro", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(16.dp))

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Fornada Tradicional de Pão Francês (50 unidades)", fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Text("Ingredientes: 2.5kg Farinha Trigo, 50g Fermento Biológico, 35g Sal, 1.5L Água")
                Spacer(modifier = Modifier.height(6.dp))
                Text("Custo por Pão: R$ 0,28 | Preço Venda: R$ 0,85 | Margem Bruta: 67%", color = ProfitGreen, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
