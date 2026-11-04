package com.padariamaster.app.domain.usecase

data class IngredientCost(
    val name: String,
    val quantity: Double,
    val unit: String,
    val costPerUnit: Double
) {
    val totalCost: Double get() = quantity * costPerUnit
}

data class RecipeCostResult(
    val totalBatchCost: Double,
    val unitCost: Double,
    val suggestedPrice: Double,
    val marginPercent: Double
)

class CalculateRecipeCostUseCase {
    operator fun invoke(
        ingredients: List<IngredientCost>,
        yieldUnits: Double,
        targetMarginPercent: Double = 60.0,
        fixedCostMarkupPercent: Double = 15.0 // Luz, gás, depreciação de forno
    ): RecipeCostResult {
        val rawIngredientsCost = ingredients.sumOf { it.totalCost }
        val totalBatchCost = rawIngredientsCost * (1.0 + (fixedCostMarkupPercent / 100.0))
        val unitCost = if (yieldUnits > 0) totalBatchCost / yieldUnits else 0.0

        // Margem = (Preço - Custo) / Preço  => Preço = Custo / (1 - Margem)
        val marginDecimal = (targetMarginPercent / 100.0).coerceIn(0.0, 0.95)
        val suggestedPrice = if (marginDecimal < 1.0) unitCost / (1.0 - marginDecimal) else unitCost * 2.0

        return RecipeCostResult(
            totalBatchCost = totalBatchCost,
            unitCost = unitCost,
            suggestedPrice = suggestedPrice,
            marginPercent = targetMarginPercent
        )
    }
}
