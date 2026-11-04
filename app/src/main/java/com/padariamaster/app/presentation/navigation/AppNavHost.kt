package com.padariamaster.app.presentation.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.EventNote
import androidx.compose.material.icons.filled.Inventory
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.padariamaster.app.presentation.pdv.PdvScreen
import com.padariamaster.app.presentation.stock.StockScreen
import com.padariamaster.app.presentation.recipes.RecipesScreen
import com.padariamaster.app.presentation.finance.FinanceScreen
import com.padariamaster.app.presentation.cash.CashRegisterScreen
import com.padariamaster.app.presentation.orders.OrdersScreen
import com.padariamaster.app.presentation.sync.SyncScreen

@Composable
fun AppNavHost(
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val navigationItems = listOf(
        Triple(Screen.Pdv, Icons.Default.PointOfSale, "PDV"),
        Triple(Screen.Stock, Icons.Default.Inventory, "Estoque"),
        Triple(Screen.Recipes, Icons.Default.RestaurantMenu, "Receitas"),
        Triple(Screen.Orders, Icons.Default.EventNote, "Encomendas"),
        Triple(Screen.Finance, Icons.Default.Assessment, "DRE"),
        Triple(Screen.CashRegister, Icons.Default.ReceiptLong, "Caixa"),
        Triple(Screen.Sync, Icons.Default.CloudSync, "Sync")
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                navigationItems.forEach { (screen, icon, label) ->
                    NavigationBarItem(
                        icon = { Icon(icon, contentDescription = screen.title) },
                        label = { Text(label) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Pdv.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Pdv.route) { PdvScreen() }
            composable(Screen.Stock.route) { StockScreen() }
            composable(Screen.Recipes.route) { RecipesScreen() }
            composable(Screen.Orders.route) { OrdersScreen() }
            composable(Screen.Finance.route) { FinanceScreen() }
            composable(Screen.CashRegister.route) { CashRegisterScreen() }
            composable(Screen.Sync.route) { SyncScreen() }
        }
    }
}
