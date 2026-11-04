package com.padariamaster.app.core.util

import java.text.NumberFormat
import java.util.Locale

object CurrencyUtils {
    private val ptBrLocale = Locale("pt", "BR")
    private val formatter = NumberFormat.getCurrencyInstance(ptBrLocale)

    fun format(value: Double): String {
        return formatter.format(value)
    }

    fun formatKg(value: Double): String {
        return String.format(ptBrLocale, "%.3f kg", value)
    }

    fun calculateWeightPrice(pricePerKg: Double, weightInKg: Double): Double {
        return pricePerKg * weightInKg
    }
}
