package com.padariamaster.app

import android.app.Application
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.padariamaster.app.data.local.database.AppDatabase
import com.padariamaster.app.data.repository.PadariaRepositoryImpl
import com.padariamaster.app.data.sync.SyncWorker
import java.util.concurrent.TimeUnit

class PadariaMasterApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var repository: PadariaRepositoryImpl
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Inicialização do Banco Room (SQLite Local Offline)
        database = AppDatabase.getInstance(this)
        repository = PadariaRepositoryImpl(
            productDao = database.productDao(),
            saleDao = database.saleDao(),
            recipeDao = database.recipeDao(),
            cashRegisterDao = database.cashRegisterDao(),
            financialDao = database.financialDao(),
            orderDao = database.orderDao()
        )

        setupPeriodicSyncWorker()
    }

    private fun setupPeriodicSyncWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "PadariaOfflineSyncWorker",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }

    companion object {
        lateinit var instance: PadariaMasterApp
            private set
    }
}
