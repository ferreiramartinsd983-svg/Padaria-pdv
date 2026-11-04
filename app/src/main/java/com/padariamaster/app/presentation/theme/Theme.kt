package com.padariamaster.app.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = GoldLight,
    onPrimary = BackgroundDark,
    primaryContainer = GoldDark,
    onPrimaryContainer = GoldLight,
    background = BackgroundDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    error = AlertRed,
    errorContainer = AlertRedContainer
)

private val LightColorScheme = lightColorScheme(
    primary = GoldPrimary,
    onPrimary = BackgroundLight,
    primaryContainer = GoldLight,
    onPrimaryContainer = GoldDark,
    background = BackgroundLight,
    onBackground = TextPrimaryLight,
    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    error = AlertRed,
    errorContainer = AlertRedContainer
)

@Composable
fun PadariaMasterTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
