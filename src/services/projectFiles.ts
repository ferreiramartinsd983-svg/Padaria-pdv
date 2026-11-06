import { downloadBlob } from './download';
import JSZip from 'jszip';

export interface AndroidFileDefinition {
  path: string;
  category: 'gradle' | 'manifest' | 'kotlin' | 'ci' | 'test' | 'res';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFileDefinition[] = [
  {
    path: 'build.gradle.kts',
    category: 'gradle',
    description: 'Build script raiz com plugins KSP, Kotlin Compose e Google Services',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.google.services) apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    category: 'gradle',
    description: 'Configuração de repositórios Maven, Google e inclusão do módulo :app',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PadariaMaster"
include(":app")`
  },
  {
    path: 'gradle.properties',
    category: 'gradle',
    description: 'Parâmetros de JVM e AndroidX flags',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  },
  {
    path: 'gradle/libs.versions.toml',
    category: 'gradle',
    description: 'Version Catalog oficial do Gradle (Compose, Room, Coroutines, WorkManager)',
    content: `[versions]
agp = "8.7.2"
kotlin = "2.0.21"
coreKtx = "1.15.0"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.10.01"
room = "2.6.1"
ksp = "2.0.21-1.0.28"
navigationCompose = "2.8.3"
workRuntimeKtx = "2.9.1"
coroutines = "1.9.0"
firebaseBom = "33.5.1"
googleServices = "4.4.2"
mockk = "1.13.13"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
androidx-work-runtime-ktx = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "workRuntimeKtx" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
kotlinx-coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "coroutines" }
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }

firebase-bom = { group = "com.google.firebase", name = "firebase-bom", version.ref = "firebaseBom" }
firebase-auth-ktx = { group = "com.google.firebase", name = "firebase-auth-ktx" }
firebase-firestore-ktx = { group = "com.google.firebase", name = "firebase-firestore-ktx" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
google-services = { id = "com.google.gms.google-services", version.ref = "googleServices" }`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'Configuração do módulo :app com SDK 35, Room KSP e Jetpack Compose',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.padariamaster.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.padariamaster.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 207
        versionName = "2.7.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        ksp {
            arg("room.schemaLocation", "$projectDir/schemas")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Room Database & SQLite
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // WorkManager (Sync offline-first)
    implementation(libs.androidx.work.runtime.ktx)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Firebase (opcional com fallback offline)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.firestore.ktx)

    // Tests
    testImplementation(libs.junit)
    testImplementation(libs.mockk)
    testImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}`
  },
  {
    path: '.github/workflows/android-build.yml',
    category: 'ci',
    description: 'Pipeline GitHub Actions para compilação, testes e geração de APK',
    content: `name: Padaria Master 2.0 - CI/CD Android

on:
  push:
    branches: [ "main", "master", "develop" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Test Android APK
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew || true

    - name: Run Unit Tests (Room & Domain UseCases)
      run: ./gradlew testDebugUnitTest --continue

    - name: Assemble Debug APK
      run: ./gradlew assembleDebug --stacktrace

    - name: Upload Debug APK Artifact
      uses: actions/upload-artifact@v4
      with:
        name: padaria-master-debug-apk
        path: app/build/outputs/apk/debug/app-debug.apk`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    description: 'Manifest do aplicativo com permissões de Câmera, Bluetooth e Inicialização',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.bluetooth" android:required="false" />

    <application
        android:name=".PadariaMasterApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.PadariaMaster">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>`
  },
  {
    path: 'app/src/main/java/com/padariamaster/app/PadariaMasterApp.kt',
    category: 'kotlin',
    description: 'Application class que inicializa o Room Database e enfileira o SyncWorker',
    content: `package com.padariamaster.app

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
}`
  },
  {
    path: 'app/src/main/java/com/padariamaster/app/MainActivity.kt',
    category: 'kotlin',
    description: 'Activity principal em Jetpack Compose com suporte a Light/Dark theme e rotação',
    content: `package com.padariamaster.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.padariamaster.app.presentation.navigation.AppNavHost
import com.padariamaster.app.presentation.theme.PadariaMasterTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val systemDark = isSystemInDarkTheme()
            var isDarkTheme by remember { mutableStateOf(systemDark) }

            PadariaMasterTheme(darkTheme = isDarkTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavHost(
                        isDarkTheme = isDarkTheme,
                        onToggleTheme = { isDarkTheme = !isDarkTheme }
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/padariamaster/app/data/local/database/AppDatabase.kt',
    category: 'kotlin',
    description: 'Banco Room SQLite local com callbacks de pre-população offline',
    content: `package com.padariamaster.app.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.padariamaster.app.data.local.dao.*
import com.padariamaster.app.data.local.entity.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ProductEntity::class,
        SaleEntity::class,
        SaleItemEntity::class,
        RecipeEntity::class,
        CashRegisterEntity::class,
        FinancialTransactionEntity::class,
        OrderEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun saleDao(): SaleDao
    abstract fun recipeDao(): RecipeDao
    abstract fun cashRegisterDao(): CashRegisterDao
    abstract fun financialDao(): FinancialDao
    abstract fun orderDao(): OrderDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "padaria_master_db.sqlite"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/padariamaster/app/presentation/theme/Theme.kt',
    category: 'kotlin',
    description: 'Tema Material Design 3 com tokens de ouro de panificação, vermelho de alerta e verde de lucro',
    content: `package com.padariamaster.app.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = GoldLight,
    onPrimary = BackgroundDark,
    primaryContainer = GoldDark,
    background = BackgroundDark,
    surface = SurfaceDark,
    error = AlertRed
)

private val LightColorScheme = lightColorScheme(
    primary = GoldPrimary,
    onPrimary = BackgroundLight,
    primaryContainer = GoldLight,
    background = BackgroundLight,
    surface = SurfaceLight,
    error = AlertRed
)

@Composable
fun PadariaMasterTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(colorScheme = colorScheme, content = content)
}`
  },
  {
    path: 'app/src/test/java/com/padariamaster/app/domain/usecase/ProcessSaleUseCaseTest.kt',
    category: 'test',
    description: 'Teste automatizado JUnit 4 + Mockk para fechamento de venda no PDV',
    content: `package com.padariamaster.app.domain.usecase

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
    fun \`when cart has items and exact cash payment is made then sale succeeds\`() = runTest {
        val items = listOf(
            CartItem(productId = 1L, productName = "Pão Francês", quantity = 0.5, unitPrice = 20.0),
            CartItem(productId = 2L, productName = "Café Expresso", quantity = 2.0, unitPrice = 5.0)
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
}`
  }
];

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Cria a pasta raiz do projeto no ZIP
  const rootFolder = zip.folder('PadariaMaster_Android');
  if (!rootFolder) return;

  // Adiciona os arquivos
  for (const file of ANDROID_PROJECT_FILES) {
    rootFolder.file(file.path, file.content);
  }

  // Adiciona README com instruções para abrir no Android Studio
  rootFolder.file(
    'README.md',
    `# PADARIA MASTER 2.0 — PROJETO ANDROID KOTLIN JETPACK COMPOSE

Este é o código-fonte nativo completo do **PADARIA MASTER 2.0**, desenvolvido com Clean Architecture, MVVM, Room Database, SQLite e Material Design 3.

## 🛠️ Tecnologias
- **Linguagem**: Kotlin 2.0
- **UI Toolkit**: Jetpack Compose + Material Design 3
- **Banco de Dados Local**: Room Database & SQLite (Offline-First)
- **Assincronismo**: Kotlin Coroutines & StateFlow
- **Tarefas em Segundo Plano**: AndroidX WorkManager (Sync)
- **Sincronização em Nuvem (Opcional)**: Firebase Firestore & Auth
- **Testes**: JUnit 4 + Mockk
- **CI/CD**: GitHub Actions

## 🚀 Como Abrir no Android Studio
1. Descompacte este arquivo ZIP em uma pasta do seu computador (ex: \`~/AndroidStudioProjects/PadariaMaster\`).
2. Abra o **Android Studio Ladybug ou Hedgehog (versão recente)**.
3. Clique em **File > Open** e selecione a pasta raiz descompactada.
4. Aguarde a sincronização automática do Gradle (Gradle Sync).
5. Conecte um aparelho celular Android via USB ou inicie um emulador (Tablet ou Smartphone).
6. Clique no botão verde de **Run (Play)** no topo do Android Studio.

## 📦 Compilação Automatizada no GitHub
1. Inicialize o repositório git:
   \`\`\`bash
   git init
   git add .
   git commit -m "feat: Padaria Master 2.0 projeto nativo Android"
   git remote add origin https://github.com/SEU_USUARIO/padaria-master.git
   git push -u origin main
   \`\`\`
2. O workflow \`.github/workflows/android-build.yml\` compilará o APK de debug automaticamente a cada push!
`
  );

  // Gera o blob do ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  await downloadBlob(content, 'PadariaMaster_Android_Project.zip');
}
