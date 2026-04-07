package com.loru.schoolsystem.ui.components

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.ExperimentalMaterial3AdaptiveNavigationSuiteApi
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.loru.schoolsystem.data.repository.SchoolRepository
import com.loru.schoolsystem.ui.model.DensityMode
import com.loru.schoolsystem.ui.model.ThemeMode
import com.loru.schoolsystem.ui.screens.HomeScreen
import com.loru.schoolsystem.ui.screens.SchoolDetailScreen
import com.loru.schoolsystem.ui.screens.SearchScreen
import com.loru.schoolsystem.ui.screens.SettingsScreen
import com.loru.schoolsystem.ui.theme.SchoolGlowBlue
import com.loru.schoolsystem.ui.theme.SchoolGlowBlueDark
import com.loru.schoolsystem.ui.theme.SchoolGlowLilac
import com.loru.schoolsystem.ui.theme.SchoolGlowLilacDark
import com.loru.schoolsystem.ui.theme.SchoolGlowMint
import com.loru.schoolsystem.ui.theme.SchoolGlowMintDark
import com.loru.schoolsystem.ui.viewmodel.HomeUiState
import com.loru.schoolsystem.ui.viewmodel.HomeViewModel

enum class AppDestinations(val label: String, val icon: ImageVector, val route: String) {
    HOME("\u603b\u89c8", Icons.Default.Home, "home"),
    SEARCH("\u641c\u7d22", Icons.Default.Search, "search"),
    SETTINGS("\u8bbe\u7f6e", Icons.Default.Settings, "settings")
}

@Composable
@OptIn(ExperimentalMaterial3AdaptiveNavigationSuiteApi::class)
fun AdaptiveApp(
    themeMode: ThemeMode,
    densityMode: DensityMode,
    reduceMotion: Boolean,
    onThemeModeChange: (ThemeMode) -> Unit,
    onDensityModeChange: (DensityMode) -> Unit,
    onReduceMotionChange: (Boolean) -> Unit,
    navController: NavHostController = rememberNavController()
) {
    val context = LocalContext.current
    val viewModel = remember(context) { HomeViewModel(SchoolRepository(context)) }
    val uiState by viewModel.uiState.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            AppDestinations.entries.forEach { destination ->
                item(
                    selected = currentRoute?.startsWith(destination.route) == true,
                    onClick = {
                        if (currentRoute != destination.route) {
                            navController.navigate(destination.route) {
                                popUpTo(navController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    },
                    icon = { Icon(destination.icon, contentDescription = destination.label) },
                    label = { Text(destination.label) }
                )
            }
        }
    ) {
        val configuration = LocalConfiguration.current
        val screenWidth = configuration.screenWidthDp.dp
        val isDark = MaterialTheme.colorScheme.background.luminance() < 0.5f
        val blueGlow = if (isDark) SchoolGlowBlueDark else SchoolGlowBlue
        val mintGlow = if (isDark) SchoolGlowMintDark else SchoolGlowMint
        val lilacGlow = if (isDark) SchoolGlowLilacDark else SchoolGlowLilac
        val backgroundBrush = Brush.verticalGradient(
            colors = listOf(
                MaterialTheme.colorScheme.background,
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.94f),
                MaterialTheme.colorScheme.background
            )
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(backgroundBrush)
                .safeDrawingPadding()
        ) {
            Box(
                modifier = Modifier
                    .size(280.dp)
                    .align(Alignment.TopEnd)
                    .offset(x = 72.dp, y = (-36).dp)
                    .background(
                        brush = Brush.radialGradient(
                            colors = listOf(blueGlow.copy(alpha = 0.42f), Color.Transparent)
                        ),
                        shape = CircleShape
                    )
            )
            Box(
                modifier = Modifier
                    .size(240.dp)
                    .align(Alignment.TopStart)
                    .offset(x = (-54).dp, y = 64.dp)
                    .background(
                        brush = Brush.radialGradient(
                            colors = listOf(lilacGlow.copy(alpha = 0.28f), Color.Transparent)
                        ),
                        shape = CircleShape
                    )
            )
            Box(
                modifier = Modifier
                    .size(260.dp)
                    .align(Alignment.BottomEnd)
                    .offset(x = 44.dp, y = 56.dp)
                    .background(
                        brush = Brush.radialGradient(
                            colors = listOf(mintGlow.copy(alpha = 0.24f), Color.Transparent)
                        ),
                        shape = CircleShape
                    )
            )

            when (uiState) {
                is HomeUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }

                is HomeUiState.Error -> {
                    Text(
                        text = (uiState as HomeUiState.Error).message,
                        style = MaterialTheme.typography.bodyLarge,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                is HomeUiState.Success -> {
                    val data = (uiState as HomeUiState.Success).data

                    NavHost(
                        navController = navController,
                        startDestination = AppDestinations.HOME.route,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        composable(AppDestinations.HOME.route) {
                            HomeScreen(
                                screenWidth = screenWidth,
                                densityMode = densityMode,
                                data = data,
                                onSchoolClick = { schoolName ->
                                    navController.navigate("detail/$schoolName")
                                }
                            )
                        }
                        composable(
                            route = "detail/{schoolName}",
                            arguments = listOf(navArgument("schoolName") { type = NavType.StringType }),
                            enterTransition = {
                                if (reduceMotion) {
                                    EnterTransition.None
                                } else {
                                    fadeIn() + slideInHorizontally(initialOffsetX = { distance -> distance / 5 })
                                }
                            },
                            exitTransition = {
                                if (reduceMotion) {
                                    ExitTransition.None
                                } else {
                                    fadeOut() + slideOutHorizontally(targetOffsetX = { distance -> -distance / 5 })
                                }
                            }
                        ) { backStackEntry ->
                            val schoolName = backStackEntry.arguments?.getString("schoolName") ?: ""
                            SchoolDetailScreen(
                                screenWidth = screenWidth,
                                densityMode = densityMode,
                                schoolName = schoolName,
                                data = data,
                                reduceMotion = reduceMotion,
                                onBack = { navController.popBackStack() }
                            )
                        }
                        composable(AppDestinations.SEARCH.route) {
                            SearchScreen(
                                screenWidth = screenWidth,
                                densityMode = densityMode,
                                data = data,
                                onSchoolClick = { schoolName ->
                                    navController.navigate("detail/$schoolName")
                                }
                            )
                        }
                        composable(AppDestinations.SETTINGS.route) {
                            SettingsScreen(
                                screenWidth = screenWidth,
                                densityMode = densityMode,
                                themeMode = themeMode,
                                reduceMotion = reduceMotion,
                                onThemeModeChange = onThemeModeChange,
                                onDensityModeChange = onDensityModeChange,
                                onReduceMotionChange = onReduceMotionChange
                            )
                        }
                    }
                }
            }
        }
    }
}
