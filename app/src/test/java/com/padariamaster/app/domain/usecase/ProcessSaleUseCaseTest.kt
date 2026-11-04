package com.padariamaster.app.domain.usecase

import com.padariamaster.app.data.repository.PadariaRepositoryImpl
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ProcessSaleUseCaseTest {

    private lateinit var repository: PadariaRepositoryImpl
    private lateinit var useCase: ProcessSaleUseCase

    @Before
    fun setUp() {
        repository = mockk(relaxed = true)
        useCase = ProcessSaleUseCase(repository)
    }

    @Test
    fun `when cart has items and exact cash payment is made then sale succeeds`() = runTest {
        val items = listOf(
            CartItem(productId = 1L, productName = "Pão Francês", quantity = 0.5, unitPrice = 20.0), // R$ 10.00
            CartItem(productId = 2L, productName = "Café Expresso", quantity = 2.0, unitPrice = 5.0)  // R$ 10.00
        )

        coEvery { repository.recordSale(any(), any()) } returns 101L

        val result = useCase(
            cashRegisterId = 1L,
            items = items,
            discount = 0.0,
            paymentMethod = "DINHEIRO",
            amountPaid = 20.0
        )

        assertTrue(result.isSuccess)
        assertEquals(101L, result.getOrNull())
    }

    @Test
    fun `when cash payment is less than total amount then sale fails`() = runTest {
        val items = listOf(
            CartItem(productId = 1L, productName = "Pão de Queijo", quantity = 3.0, unitPrice = 5.0) // R$ 15.00
        )

        val result = useCase(
            cashRegisterId = 1L,
            items = items,
            discount = 0.0,
            paymentMethod = "DINHEIRO",
            amountPaid = 10.0 // Insuficiente
        )

        assertTrue(result.isFailure)
        assertEquals("Valor pago em dinheiro é insuficiente.", result.exceptionOrNull()?.message)
    }
}
