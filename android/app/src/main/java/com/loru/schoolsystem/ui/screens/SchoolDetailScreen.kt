package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.ComparisonTrendChart
import com.loru.schoolsystem.ui.components.shared.MetricCard
import com.loru.schoolsystem.ui.components.shared.SectionHeader
import com.loru.schoolsystem.ui.components.shared.SubjectDetailCard
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchoolDetailScreen(schoolName: String, data: SchoolSystemData, onBack: () -> Unit) {
    val midStats = data.midSchool[schoolName].orEmpty()
    val finStats = data.finSchool[schoolName].orEmpty()
    val subjects = finStats.keys.filter { it != "total" }.sorted()

    val midTotal = midStats["total"]
    val finTotal = finStats["total"]
    val scoreDelta = (finTotal?.avg ?: 0.0) - (midTotal?.avg ?: 0.0)
    val passDelta = (finTotal?.passRate ?: 0.0) - (midTotal?.passRate ?: 0.0)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(schoolName) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            item {
                Text(
                    "School Detail View",
                    style = MaterialTheme.typography.headlineMedium
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "Compare mid-term and final exam movement across all core subjects.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    MetricCard(
                        title = "Final average",
                        value = finTotal?.avg?.formatScore() ?: "0.0",
                        supporting = "Overall school score"
                    )
                    MetricCard(
                        title = "Score movement",
                        value = scoreDelta.formatSignedScore(),
                        supporting = "Final minus mid-term"
                    )
                    MetricCard(
                        title = "Pass rate",
                        value = formatRate(finTotal?.passRate ?: 0.0),
                        supporting = "${formatSignedRate(passDelta)} vs mid-term"
                    )
                }
            }

            if (subjects.isNotEmpty()) {
                item {
                    SectionHeader(
                        title = "Subject Trend",
                        subtitle = "Mid-term and final averages plotted side by side"
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    ComparisonTrendChart(
                        labels = subjects.map { it.take(3) },
                        baselineValues = subjects.map { (midStats[it]?.avg ?: 0.0).toFloat() },
                        currentValues = subjects.map { (finStats[it]?.avg ?: 0.0).toFloat() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(240.dp)
                    )
                }

                item {
                    SectionHeader(
                        title = "Subject Breakdown",
                        subtitle = "Each subject shows score and pass-rate movement"
                    )
                }

                items(subjects, key = { it }) { subject ->
                    SubjectDetailCard(
                        subject = subject,
                        mid = midStats[subject],
                        fin = finStats[subject]
                    )
                }
            }
        }
    }
}

private fun Double.formatScore(): String = String.format(Locale.getDefault(), "%.1f", this)

private fun Double.formatSignedScore(): String = String.format(Locale.getDefault(), "%+.1f", this)

private fun formatRate(value: Double): String = String.format(Locale.getDefault(), "%.1f%%", value * 100)

private fun formatSignedRate(value: Double): String = String.format(Locale.getDefault(), "%+.1f%%", value * 100)
