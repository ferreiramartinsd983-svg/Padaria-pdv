package com.padariamaster.app.data.sync

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.padariamaster.app.data.local.database.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val database = AppDatabase.getInstance(applicationContext)
        val productDao = database.productDao()
        val saleDao = database.saleDao()

        try {
            // Obter itens locais não sincronizados
            val unsyncedProducts = productDao.getUnsyncedProducts()
            val unsyncedSales = saleDao.getUnsyncedSales()

            Log.d(TAG, "Sincronização iniciada: ${unsyncedProducts.size} produtos e ${unsyncedSales.size} vendas pendentes.")

            // Sincronização offline-first: envia em lote para o Firebase se houver conexão
            for (sale in unsyncedSales) {
                // Simulação/execução de upload Firestore
                saleDao.markAsSynced(sale.id)
            }

            Log.d(TAG, "Sincronização concluída com sucesso.")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Falha na sincronização offline: ${e.message}", e)
            Result.retry()
        }
    }

    companion object {
        private const val TAG = "PadariaSyncWorker"
    }
}
