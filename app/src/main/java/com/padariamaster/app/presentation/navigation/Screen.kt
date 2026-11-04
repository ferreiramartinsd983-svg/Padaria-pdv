package com.padariamaster.app.presentation.navigation

sealed class Screen(val route: String, val title: String) {
    data object Pdv : Screen("pdv", "PDV Caixa Rápido")
    data object Stock : Screen("stock", "Estoque & Lotes")
    data object Recipes : Screen("recipes", "Fichas Técnicas")
    data object Finance : Screen("finance", "Financeiro & DRE")
    data object CashRegister : Screen("cash", "Controle de Caixa")
    data object Orders : Screen("orders", "Encomendas")
    data object Sync : Screen("sync", "Sincronização & Offline")
}
