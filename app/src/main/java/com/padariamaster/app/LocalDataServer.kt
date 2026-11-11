package com.padariamaster.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.File
import java.net.Inet4Address
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.nio.charset.StandardCharsets
import java.util.concurrent.Executors

class LocalDataServer(context: Context) {
    private val dataDir = File(context.filesDir, "shared-groups").apply { mkdirs() }
    @Volatile private var running = false
    private var socket: ServerSocket? = null
    private val workers = Executors.newCachedThreadPool()

    @Synchronized fun start(): String {
        if (!running) {
            val server = ServerSocket(8787, 20)
            socket = server
            running = true
            Thread {
                while (running) {
                    try { val client = server.accept(); workers.execute { handle(client) } } catch (_: Exception) { if (!running) break }
                }
            }.apply { name = "padaria-data-server"; isDaemon = true; start() }
        }
        return "http://${localIp()}:8787"
    }

    @Synchronized fun stop() {
        running = false
        runCatching { socket?.close() }
        socket = null
    }

    private fun localIp(): String = runCatching {
        NetworkInterface.getNetworkInterfaces().toList().sortedBy { if (it.name.startsWith("wlan") || it.name.startsWith("ap")) 0 else 1 }.flatMap { it.inetAddresses.toList() }
            .first { it is Inet4Address && !it.isLoopbackAddress && !it.isLinkLocalAddress }.hostAddress
    }.getOrDefault("127.0.0.1")

    private fun handle(client: Socket) {
        client.use { connection ->
            connection.soTimeout = 10000
            val input = BufferedInputStream(connection.getInputStream())
            val headerBytes = ArrayList<Byte>()
            var marker = 0
            while (headerBytes.size < 16384) {
                val byte = input.read(); if (byte < 0) return
                headerBytes.add(byte.toByte())
                marker = when { marker == 0 && byte == 13 -> 1; marker == 1 && byte == 10 -> 2; marker == 2 && byte == 13 -> 3; marker == 3 && byte == 10 -> 4; byte == 13 -> 1; else -> 0 }
                if (marker == 4) break
            }
            val headersText = String(headerBytes.toByteArray(), StandardCharsets.US_ASCII)
            val requestLine = headersText.lineSequence().firstOrNull().orEmpty().split(" ")
            val method = requestLine.getOrNull(0).orEmpty()
            val route = requestLine.getOrNull(1).orEmpty().substringBefore('?')
            val length = Regex("(?im)^Content-Length:\\s*(\\d+)").find(headersText)?.groupValues?.get(1)?.toIntOrNull() ?: 0
            if (length > 10 * 1024 * 1024) { respond(connection, 413, "{\"error\":\"Backup muito grande.\"}"); return }
            val bodyBytes = ByteArray(length)
            var read = 0
            while (read < length) { val count = input.read(bodyBytes, read, length - read); if (count < 0) break; read += count }
            if (method == "OPTIONS") { respond(connection, 204, ""); return }
            val code = route.substringAfterLast('/').uppercase()
            if (!route.startsWith("/api/share/") || !code.matches(Regex("[A-Z0-9-]{4,32}"))) { respond(connection, 404, "{\"error\":\"Rota ou código inválido.\"}"); return }
            val file = File(dataDir, "$code.json")
            if (method == "GET") {
                if (!file.exists()) respond(connection, 404, "{\"error\":\"Grupo ainda sem dados.\"}")
                else respond(connection, 200, file.readText())
            } else if (method == "PUT") {
                val incoming = runCatching { JSONObject(String(bodyBytes, StandardCharsets.UTF_8)) }.getOrNull()
                if (incoming == null || !incoming.has("products")) { respond(connection, 400, "{\"error\":\"Backup inválido.\"}"); return }
                val existing = if (file.exists()) runCatching { JSONObject(file.readText()) }.getOrDefault(JSONObject()) else JSONObject()
                val merged = merge(existing, incoming)
                file.writeText(merged.toString())
                respond(connection, 200, merged.toString())
            } else respond(connection, 405, "{\"error\":\"Método não permitido.\"}")
        }
    }

    private fun merge(old: JSONObject, fresh: JSONObject): JSONObject {
        val result = JSONObject(old.toString())
        val keys = listOf("version", "exportedAt", "cashRegister")
        keys.forEach { key -> if (fresh.has(key)) result.put(key, fresh.get(key)) }
        listOf("products", "sales", "recipes", "finances", "orders", "productions", "suppliers", "audit", "purchases", "voiceNotes", "tasks").forEach { key ->
            val rows = LinkedHashMap<String, JSONObject>()
            fun add(array: JSONArray?) {
                if (array == null) return
                for (i in 0 until array.length()) {
                    val row = array.optJSONObject(i) ?: continue
                    val id = row.optString("id")
                    if (id.isBlank()) continue
                    val previous = rows[id]
                    if (previous == null || rowTime(row) >= rowTime(previous)) rows[id] = row
                }
            }
            add(old.optJSONArray(key)); add(fresh.optJSONArray(key))
            result.put(key, JSONArray(rows.values))
        }
        return result
    }

    private fun rowTime(row: JSONObject): Long = listOf("updatedAt", "timestamp", "createdAt", "producedAt", "receivedAt").firstNotNullOfOrNull { key -> if (row.has(key)) row.optLong(key) else null } ?: 0L

    private fun respond(socket: Socket, status: Int, body: String) {
        val phrase = when (status) { 200 -> "OK"; 204 -> "No Content"; 400 -> "Bad Request"; 404 -> "Not Found"; 405 -> "Method Not Allowed"; 413 -> "Payload Too Large"; else -> "Error" }
        val bytes = body.toByteArray(StandardCharsets.UTF_8)
        val headers = "HTTP/1.1 $status $phrase\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: ${bytes.size}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, PUT, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nConnection: close\r\n\r\n"
        socket.getOutputStream().apply { write(headers.toByteArray(StandardCharsets.US_ASCII)); write(bytes); flush() }
    }
}
