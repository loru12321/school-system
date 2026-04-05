package com.loru.schoolsystem.ui.components.shared

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowOutward
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SubjectStats
import java.util.Locale

@Composable
fun SectionHeader(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.titleLarge)
        Text(
            subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    supporting: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = supporting,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun RecordCard(
    name: String,
    stats: SubjectStats?,
    supportingStats: SubjectStats? = null,
    onClick: () -> Unit
) {
    val delta = (stats?.avg ?: 0.0) - (supportingStats?.avg ?: 0.0)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(name, style = MaterialTheme.typography.titleLarge)
                Icon(
                    imageVector = Icons.Default.ArrowOutward,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            stats?.let {
                Text("Final average: ${formatScore(it.avg)}", style = MaterialTheme.typography.bodyLarge)
                Text(
                    "Pass rate: ${formatRate(it.passRate)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    "Change vs mid-term: ${formatSignedScore(delta)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = deltaColor(delta)
                )
            }
        }
    }
}

@Composable
fun SchoolOverviewCard(
    name: String,
    midAvg: Double,
    finalAvg: Double,
    passRate: Double,
    onClick: () -> Unit
) {
    val delta = finalAvg - midAvg
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        shape = RoundedCornerShape(22.dp)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(name, style = MaterialTheme.typography.titleLarge)
                Text(
                    text = formatSignedScore(delta),
                    style = MaterialTheme.typography.titleMedium,
                    color = deltaColor(delta)
                )
            }

            Text(
                text = "Final average ${formatScore(finalAvg)}",
                style = MaterialTheme.typography.bodyLarge
            )

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Pass rate ${formatRate(passRate)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                LinearProgressIndicator(
                    progress = { passRate.toFloat().coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun SubjectDetailCard(subject: String, mid: SubjectStats?, fin: SubjectStats?) {
    val scoreDelta = (fin?.avg ?: 0.0) - (mid?.avg ?: 0.0)
    val passDelta = (fin?.passRate ?: 0.0) - (mid?.passRate ?: 0.0)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = subject,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StatColumn(
                    label = "Mid-term",
                    score = mid?.avg ?: 0.0,
                    passRate = mid?.passRate ?: 0.0,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(12.dp))
                StatColumn(
                    label = "Final",
                    score = fin?.avg ?: 0.0,
                    passRate = fin?.passRate ?: 0.0,
                    modifier = Modifier.weight(1f)
                )
            }

            Text(
                text = "Score ${formatSignedScore(scoreDelta)}  |  Pass ${formatSignedRate(passDelta)}",
                style = MaterialTheme.typography.bodyMedium,
                color = deltaColor(scoreDelta)
            )
        }
    }
}

@Composable
private fun StatColumn(
    label: String,
    score: Double,
    passRate: Double,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge)
        Text(formatScore(score), style = MaterialTheme.typography.titleLarge)
        LinearProgressIndicator(
            progress = { (score / 100.0).toFloat().coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            "Pass ${formatRate(passRate)}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun formatScore(value: Double): String = String.format(Locale.getDefault(), "%.1f", value)

private fun formatSignedScore(value: Double): String = String.format(Locale.getDefault(), "%+.1f", value)

private fun formatRate(value: Double): String = String.format(Locale.getDefault(), "%.1f%%", value * 100)

private fun formatSignedRate(value: Double): String = String.format(Locale.getDefault(), "%+.1f%%", value * 100)

@Composable
private fun deltaColor(delta: Double): Color {
    return when {
        delta > 0.01 -> Color(0xFF1F9D66)
        delta < -0.01 -> Color(0xFFD05858)
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
}
