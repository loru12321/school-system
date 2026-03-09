package com.loru.schoolsystem.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.loru.schoolsystem.data.repository.SchoolRepository
import com.loru.schoolsystem.ui.screens.*
import com.loru.schoolsystem.ui.viewmodel.HomeUiState
import com.loru.schoolsystem.ui.viewmodel.HomeViewModel

enum class AppDestinations(val label: String, val icon: ImageVector, val route: String) {
    HOME("Overview", Icons.Default.Home, "home"),
    SEARCH("Search", Icons.Default.Search, "search"),
    SETTINGS("Settings", Icons.Default.Settings, "settings")
}

@Composable
fun AdaptiveApp(
    viewModel: HomeViewModel = HomeViewModel(SchoolRepository(LocalContext.current)),
    navController: NavHostController = rememberNavController()
) {
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
        
        Box(modifier = Modifier.fillMaxSize().safeDrawingPadding()) {
            when (uiState) {
                is HomeUiState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                is HomeUiState.Error -> Text((uiState as HomeUiState.Error).message, modifier = Modifier.align(Alignment.Center))
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
                                data = data,
                                onSchoolClick = { schoolName ->
                                    navController.navigate("detail/$schoolName")
                                }
                            )
                        }
                        composable(
                            route = "detail/{schoolName}",
                            arguments = listOf(navArgument("schoolName") { type = NavType.StringType }),
                            enterTransition = { fadeIn() + slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Start) },
                            exitTransition = { fadeOut() + slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.End) }
                        ) { backStackEntry ->
                            val schoolName = backStackEntry.arguments?.getString("schoolName") ?: ""
                            SchoolDetailScreen(
                                schoolName = schoolName,
                                data = data,
                                onBack = { navController.popBackStack() }
                            )
                        }
                        composable(AppDestinations.SEARCH.route) {
                            SearchScreen(
                                data = data,
                                onSchoolClick = { schoolName ->
                                    navController.navigate("detail/$schoolName")
                                }
                            )
                        }
                        composable(AppDestinations.SETTINGS.route) {
                            SettingsScreen()
                        }
                    }
                }
            }
        }
    }
}
