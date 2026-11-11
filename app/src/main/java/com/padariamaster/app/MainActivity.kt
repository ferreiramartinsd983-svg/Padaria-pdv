package com.padariamaster.app

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebChromeClient.FileChooserParams
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null
    private lateinit var localDataServer: LocalDataServer
    private var pendingUploadCallback: ValueCallback<Array<Uri>>? = null
    private var pendingMicrophoneRequest: PermissionRequest? = null
    private var pendingDownloadName: String = "PadariaMaster-backup.json"
    private var pendingDownloadMime: String = "application/octet-stream"
    private var pendingDownloadBytes: ByteArray? = null

    private val openBackup = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        pendingUploadCallback?.onReceiveValue(uri?.let { arrayOf(it) })
        pendingUploadCallback = null
    }

    private val requestMicrophone = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val request = pendingMicrophoneRequest
        pendingMicrophoneRequest = null
        if (granted && request != null) request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) else request?.deny()
    }

    private val saveDownload = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val uri = result.data?.data
        val bytes = pendingDownloadBytes
        if (result.resultCode == RESULT_OK && uri != null && bytes != null) {
            runCatching {
                contentResolver.openOutputStream(uri)?.use { it.write(bytes) }
            }.onSuccess {
                Toast.makeText(this, "Arquivo salvo em Downloads", Toast.LENGTH_LONG).show()
            }.onFailure {
                Toast.makeText(this, "Não foi possível salvar o arquivo", Toast.LENGTH_LONG).show()
            }
        }
        pendingDownloadBytes = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        localDataServer = LocalDataServer(applicationContext)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val appWebView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = true
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.host == APP_ASSETS_HOST) return false
                    return runCatching {
                        startActivity(Intent(Intent.ACTION_VIEW, request.url))
                        true
                    }.getOrDefault(true)
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    val asksOnlyForAudio = request.resources.isNotEmpty() && request.resources.all { it == PermissionRequest.RESOURCE_AUDIO_CAPTURE }
                    val trustedOrigin = request.origin.scheme == "https" && request.origin.host == APP_ASSETS_HOST
                    if (!trustedOrigin || !asksOnlyForAudio) {
                        request.deny()
                        return
                    }
                    pendingMicrophoneRequest?.deny()
                    pendingMicrophoneRequest = request
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        pendingMicrophoneRequest = null
                        request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                    } else {
                        requestMicrophone.launch(Manifest.permission.RECORD_AUDIO)
                    }
                }

                override fun onPermissionRequestCanceled(request: PermissionRequest) {
                    if (pendingMicrophoneRequest == request) pendingMicrophoneRequest = null
                }

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    pendingUploadCallback?.onReceiveValue(null)
                    pendingUploadCallback = filePathCallback
                    openBackup.launch(arrayOf("*/*"))
                    return true
                }
            }
            addJavascriptInterface(DownloadBridge(), "PadariaDownloads")
            addJavascriptInterface(ServerBridge(), "PadariaServerBridge")
        }

        webView = appWebView
        setContentView(appWebView)
        appWebView.loadUrl("$APP_URL?platform=android")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val currentWebView = webView
                if (currentWebView?.canGoBack() == true) {
                    currentWebView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onDestroy() {
        webView?.apply {
            removeJavascriptInterface("PadariaDownloads")
            removeJavascriptInterface("PadariaServerBridge")
            stopLoading()
            destroy()
        }
        pendingMicrophoneRequest?.deny()
        pendingMicrophoneRequest = null
        webView = null
        super.onDestroy()
    }

    private inner class ServerBridge {
        @JavascriptInterface
        fun startDataServer(): String = runCatching { localDataServer.start() }.getOrElse { "ERROR:${it.message ?: "não foi possível iniciar"}" }
    }

    private inner class DownloadBridge {
        @JavascriptInterface
        fun saveBase64(fileName: String, mimeType: String, base64: String) {
            val bytes = runCatching { Base64.decode(base64, Base64.DEFAULT) }.getOrNull() ?: return
            runOnUiThread {
                pendingDownloadName = fileName.substringAfterLast('/').substringAfterLast('\\').take(120)
                pendingDownloadMime = mimeType.ifBlank { "application/octet-stream" }
                pendingDownloadBytes = bytes
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = pendingDownloadMime
                    putExtra(Intent.EXTRA_TITLE, pendingDownloadName)
                }
                saveDownload.launch(intent)
            }
        }
    }

    private companion object {
        const val APP_ASSETS_HOST = "appassets.androidplatform.net"
        const val APP_URL = "https://appassets.androidplatform.net/assets/www/index.html"
    }
}
