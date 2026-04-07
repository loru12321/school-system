package com.loru.schoolsystem

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.loru.schoolsystem.ui.components.AdaptiveApp
import com.loru.schoolsystem.ui.model.DensityMode
import com.loru.schoolsystem.ui.model.ThemeMode
import com.loru.schoolsystem.ui.theme.SchoolSystemTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            var themeModeName by rememberSaveable { mutableStateOf(ThemeMode.SYSTEM.name) }
            var densityModeName by rememberSaveable { mutableStateOf(DensityMode.AUTO.name) }
            var reduceMotion by rememberSaveable { mutableStateOf(false) }

            val themeMode = ThemeMode.entries.firstOrNull { it.name == themeModeName } ?: ThemeMode.SYSTEM
            val densityMode = DensityMode.entries.firstOrNull { it.name == densityModeName } ?: DensityMode.AUTO
            val darkTheme = when (themeMode) {
                ThemeMode.SYSTEM -> isSystemInDarkTheme()
                ThemeMode.LIGHT -> false
                ThemeMode.DARK -> true
            }

            SchoolSystemTheme(darkTheme = darkTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AdaptiveApp(
                        themeMode = themeMode,
                        densityMode = densityMode,
                        reduceMotion = reduceMotion,
                        onThemeModeChange = { themeModeName = it.name },
                        onDensityModeChange = { densityModeName = it.name },
                        onReduceMotionChange = { reduceMotion = it }
                    )
                }
            }
        }
    }
}
