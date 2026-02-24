package com.loru.schoolsystem.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = SchoolPrimaryDark,
    background = SchoolBackgroundDark,
    surface = SchoolSurfaceDark,
    secondary = SchoolSecondary
)

private val LightColorScheme = lightColorScheme(
    primary = SchoolPrimary,
    primaryContainer = SchoolPrimaryContainer,
    onPrimary = SchoolOnPrimary,
    background = SchoolBackground,
    surface = SchoolSurface,
    secondary = SchoolSecondary
)

@Composable
fun SchoolSystemTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Set to false to enforce brand identity
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
