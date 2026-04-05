package com.loru.schoolsystem.ui.components

import android.net.Uri
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.loru.schoolsystem.data.repository.SchoolRepository
import com.loru.schoolsystem.ui.screens.HomeScreen
import com.loru.schoolsystem.ui.screens.SchoolDetailScreen
import com.loru.schoolsystem.ui.screens.SearchScreen
import com.loru.schoolsystem.ui.screens.SettingsScreen
import com.loru.schoolsystem.ui.viewmodel.HomeUiState
import com.loru.schoolsystem.ui.viewmodel.HomeViewModel

private enum class AppDestination(
    val label: String,
    val route: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    DASHBOARD("Dashboard", "dashboard", Icons.Default.Dashboard),
    SCHOOLS("Schools", "schools", Icons.Default.School),
    ABOUT("About", "about", Icons.Default.Info)
}

@Composable
fun AdaptiveApp() {
    val context = LocalContext.current
    val viewModel = remember(context) { HomeViewModel(SchoolRepository(context)) }
    val uiState by viewModel.uiState.collectAsState()
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        when (val state = uiState) {
            is HomeUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            is HomeUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(state.message, style = MaterialTheme.typography.titleMedium)
                }
            }

            is HomeUiState.Success -> {
                val data = state.data
                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            AppDestination.entries.forEach { destination ->
                                NavigationBarItem(
                                    selected = currentRoute == destination.route,
                                    onClick = {
                                        navController.navigate(destination.route) {
                                            popUpTo(navController.graph.startDestinationId) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    icon = {
                                        Icon(
                                            imageVector = destination.icon,
                                            contentDescription = destination.label
                                        )
                                    },
                                    label = { Text(destination.label) }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = AppDestination.DASHBOARD.route,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        composable(AppDestination.DASHBOARD.route) {
                            HomeScreen(
                                data = data,
                                onSchoolClick = { schoolName ->
                                    navController.navigate("detail/${Uri.encode(schoolName)}")
                                }
                            )
                        }
                        composable(AppDestination.SCHOOLS.route) {
                            SearchScreen(
                                data = data,
                                onSchoolClick = { schoolName ->
                                    navController.navigate("detail/${Uri.encode(schoolName)}")
                                }
                            )
                        }
                        composable(AppDestination.ABOUT.route) {
                            SettingsScreen()
                        }
                        composable(
                            route = "detail/{schoolName}",
                            arguments = listOf(navArgument("schoolName") { type = NavType.StringType })
                        ) { backStackEntry ->
                            val schoolName = Uri.decode(
                                backStackEntry.arguments?.getString("schoolName").orEmpty()
                            )
                            SchoolDetailScreen(
                                schoolName = schoolName,
                                data = data,
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
