package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.BuildConfig
import com.loru.schoolsystem.ui.components.shared.DataSourceDialog
import com.loru.schoolsystem.ui.components.shared.MetricCard
import com.loru.schoolsystem.ui.components.shared.SectionHeader

@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    var showDataDialog by remember { mutableStateOf(false) }
    val appFacts = listOf(
        "Package name" to context.packageName,
        "Version" to BuildConfig.VERSION_NAME,
        "Version code" to BuildConfig.VERSION_CODE.toString(),
        "UI stack" to "Kotlin + Jetpack Compose + Android Studio",
        "Data source" to "Bundled JSON analytics snapshot"
    )

    if (showDataDialog) {
        DataSourceDialog(onDismiss = { showDataDialog = false })
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("About This App", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "This Android package turns the school-system analytics data into a native mobile dashboard.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        item {
            SectionHeader(
                title = "Application Facts",
                subtitle = "Build identity and runtime footprint"
            )
        }

        items(appFacts, key = { it.first }) { fact ->
            MetricCard(
                title = fact.first,
                value = fact.second,
                supporting = "Project metadata",
                modifier = Modifier.fillMaxWidth()
            )
        }

        item {
            Button(
                onClick = { showDataDialog = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("View Data Source Notes")
            }
        }
    }
}
