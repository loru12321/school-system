package com.loru.schoolsystem.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = SchoolPrimaryDark,
    primaryContainer = SchoolPrimaryContainerDark,
    onPrimary = SchoolBackgroundDark,
    onPrimaryContainer = SchoolOnPrimary,
    background = SchoolBackgroundDark,
    surface = SchoolSurfaceDark,
    surfaceVariant = SchoolSurfaceSoftDark,
    onSurface = SchoolOnSurfaceDark,
    onSurfaceVariant = SchoolOnSurfaceMutedDark,
    secondary = SchoolSecondaryDark,
    tertiary = SchoolAccentDark,
    outline = SchoolOutlineDark,
    surfaceTint = SchoolPrimaryDark,
    error = SchoolDanger
)

private val LightColorScheme = lightColorScheme(
    primary = SchoolPrimary,
    primaryContainer = SchoolPrimaryContainer,
    onPrimary = SchoolOnPrimary,
    onPrimaryContainer = SchoolOnPrimaryContainer,
    background = SchoolBackground,
    surface = SchoolSurface,
    surfaceVariant = SchoolSurfaceSoft,
    onSurface = SchoolOnSurface,
    onSurfaceVariant = SchoolOnSurfaceMuted,
    secondary = SchoolSecondary,
    secondaryContainer = SchoolSecondaryContainer,
    tertiary = SchoolAccent,
    tertiaryContainer = SchoolAccentContainer,
    outline = SchoolOutline,
    surfaceTint = SchoolPrimary,
    error = SchoolDanger
)

@Composable
fun SchoolSystemTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
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
        shapes = AppShapes,
        content = content
    )
}
