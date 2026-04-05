package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.MetricCard
import com.loru.schoolsystem.ui.components.shared.SchoolOverviewCard
import com.loru.schoolsystem.ui.components.shared.ScoreTrendChart
import com.loru.schoolsystem.ui.components.shared.SectionHeader
import java.util.Locale

@Composable
fun HomeScreen(data: SchoolSystemData, onSchoolClick: (String) -> Unit) {
    val schoolSummaries = data.finSchool.keys.sorted().mapNotNull { schoolName ->
        val midTotal = data.midSchool[schoolName]?.get("total")
        val finTotal = data.finSchool[schoolName]?.get("total")
        if (midTotal == null || finTotal == null) {
            null
        } else {
            SchoolSummary(
                name = schoolName,
                midAvg = midTotal.avg,
                finalAvg = finTotal.avg,
                passRate = finTotal.passRate
            )
        }
    }.sortedByDescending { it.finalAvg }

    val overallMid = schoolSummaries.map { it.midAvg }.average().takeIf { !it.isNaN() } ?: 0.0
    val overallFinal = schoolSummaries.map { it.finalAvg }.average().takeIf { !it.isNaN() } ?: 0.0
    val averageGrowth = overallFinal - overallMid
    val topSchool = schoolSummaries.firstOrNull()
    val topSix = schoolSummaries.take(6)

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "School Performance Dashboard",
                    style = MaterialTheme.typography.headlineLarge
                )
                Text(
                    text = "A native Android cockpit for final exam trends, school ranking shifts, and quick drill-down analysis.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        item {
            BoxWithConstraints {
                val stacked = maxWidth < 640.dp
                if (stacked) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        MetricCard(
                            title = "Schools tracked",
                            value = schoolSummaries.size.toString(),
                            supporting = "Current cohort coverage"
                        )
                        MetricCard(
                            title = "Final exam average",
                            value = formatScore(overallFinal),
                            supporting = "Cross-school average score"
                        )
                        MetricCard(
                            title = "Average growth",
                            value = signedScore(averageGrowth),
                            supporting = "Final minus mid-term"
                        )
                        MetricCard(
                            title = "Top performer",
                            value = topSchool?.name ?: "N/A",
                            supporting = topSchool?.let { formatScore(it.finalAvg) } ?: "No data"
                        )
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            MetricCard(
                                title = "Schools tracked",
                                value = schoolSummaries.size.toString(),
                                supporting = "Current cohort coverage",
                                modifier = Modifier.weight(1f)
                            )
                            MetricCard(
                                title = "Final exam average",
                                value = formatScore(overallFinal),
                                supporting = "Cross-school average score",
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            MetricCard(
                                title = "Average growth",
                                value = signedScore(averageGrowth),
                                supporting = "Final minus mid-term",
                                modifier = Modifier.weight(1f)
                            )
                            MetricCard(
                                title = "Top performer",
                                value = topSchool?.name ?: "N/A",
                                supporting = topSchool?.let { formatScore(it.finalAvg) } ?: "No data",
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Final Score Curve",
                subtitle = "Top schools ranked by final exam average"
            )
            Spacer(modifier = Modifier.height(12.dp))
            ScoreTrendChart(
                labels = topSix.map { it.name.take(4) },
                values = topSix.map { it.finalAvg.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp)
            )
        }

        item {
            SectionHeader(
                title = "School Ranking Snapshot",
                subtitle = "Tap a school to inspect subject-by-subject movement"
            )
        }

        items(schoolSummaries.take(10), key = { it.name }) { summary ->
            SchoolOverviewCard(
                name = summary.name,
                midAvg = summary.midAvg,
                finalAvg = summary.finalAvg,
                passRate = summary.passRate,
                onClick = { onSchoolClick(summary.name) }
            )
        }
    }
}

private data class SchoolSummary(
    val name: String,
    val midAvg: Double,
    val finalAvg: Double,
    val passRate: Double
)

private fun formatScore(value: Double): String = String.format(Locale.getDefault(), "%.1f", value)

private fun signedScore(value: Double): String = String.format(Locale.getDefault(), "%+.1f", value)
