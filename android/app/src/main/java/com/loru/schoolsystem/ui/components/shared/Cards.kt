package com.loru.schoolsystem.ui.components.shared

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SubjectStats
import com.loru.schoolsystem.ui.theme.SchoolAccent
import com.loru.schoolsystem.ui.theme.SchoolDanger
import com.loru.schoolsystem.ui.theme.SchoolSuccess

@Composable
fun OverviewMetricCard(
    label: String,
    value: String,
    supporting: String,
    modifier: Modifier = Modifier,
    accent: Color = MaterialTheme.colorScheme.primary
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.36f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.98f),
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.88f)
                        )
                    )
                )
                .padding(horizontal = 18.dp, vertical = 18.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(92.dp)
                    .align(Alignment.TopEnd)
                    .background(accent.copy(alpha = 0.10f), CircleShape)
            )

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = accent.copy(alpha = 0.10f),
                    border = BorderStroke(1.dp, accent.copy(alpha = 0.16f))
                ) {
                    Text(
                        text = label,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = accent
                    )
                }
                Text(
                    text = value,
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = supporting,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun MetricBadge(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    tone: Color = MaterialTheme.colorScheme.primary
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        color = tone.copy(alpha = 0.10f),
        border = BorderStroke(1.dp, tone.copy(alpha = 0.14f))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleMedium, color = tone, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun RecordCard(name: String, midStats: SubjectStats?, finStats: SubjectStats?, onClick: () -> Unit) {
    val displayStats = finStats ?: midStats
    val trend = if (midStats != null && finStats != null) finStats.avg - midStats.avg else null
    val trendTone = when {
        trend == null -> SchoolAccent
        trend >= 0 -> SchoolSuccess
        else -> SchoolDanger
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.38f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.98f),
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.86f)
                        )
                    )
                )
                .padding(20.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .align(Alignment.TopEnd)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f), CircleShape)
            )

            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                        ) {
                            Text(
                                text = "\u5b66\u6821\u5361\u7247",
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Text(name, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                        Text(
                            text = "\u628a\u671f\u4e2d\u3001\u671f\u672b\u548c\u8d8b\u52bf\u538b\u5728\u540c\u4e00\u5f20\u5361\u91cc\uff0c\u9002\u5408\u5148\u5feb\u901f\u7b5b\u9009\uff0c\u518d\u8fdb\u5165\u8be6\u60c5\u9875\u7ee7\u7eed\u67e5\u770b\u3002",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.10f))
                    ) {
                        Box(
                            modifier = Modifier
                                .background(
                                    brush = Brush.linearGradient(
                                        colors = listOf(
                                            MaterialTheme.colorScheme.primary.copy(alpha = 0.18f),
                                            Color.White.copy(alpha = 0.80f)
                                        )
                                    ),
                                    shape = RoundedCornerShape(24.dp)
                                )
                                .padding(horizontal = 16.dp, vertical = 14.dp)
                        ) {
                            Column(horizontalAlignment = Alignment.End) {
                                Text("\u671f\u672b\u603b\u5206", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    text = displayStats?.avg?.let { String.format("%.1f", it) } ?: "--",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricBadge(
                        label = "\u53ca\u683c\u7387",
                        value = displayStats?.let { String.format("%.1f%%", it.passRate * 100) } ?: "--",
                        modifier = Modifier.weight(1f),
                        tone = MaterialTheme.colorScheme.primary
                    )
                    MetricBadge(
                        label = "\u4e24\u7387\u540d\u6b21",
                        value = displayStats?.rank2Rate?.toString() ?: "--",
                        modifier = Modifier.weight(1f),
                        tone = MaterialTheme.colorScheme.tertiary
                    )
                    MetricBadge(
                        label = "\u8d8b\u52bf",
                        value = when {
                            trend == null -> "\u5f85\u6bd4\u8f83"
                            trend >= 0 -> "+${String.format("%.1f", trend)}"
                            else -> String.format("%.1f", trend)
                        },
                        modifier = Modifier.weight(1f),
                        tone = trendTone
                    )
                }

                Surface(
                    shape = RoundedCornerShape(22.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.70f)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("\u67e5\u770b\u5b66\u6821\u8be6\u60c5", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
                        Text("\u8fdb\u5165", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}

@Composable
fun SubjectDetailCard(subject: String, mid: SubjectStats?, fin: SubjectStats?) {
    val delta = if (mid != null && fin != null) fin.avg - mid.avg else null
    val tone = when {
        delta == null -> SchoolAccent
        delta >= 0 -> SchoolSuccess
        else -> SchoolDanger
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.32f))
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(subject, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                    Text(
                        "\u628a\u671f\u4e2d\u548c\u671f\u672b\u653e\u5728\u540c\u4e00\u89c6\u7ebf\u91cc\uff0c\u65b9\u4fbf\u5224\u65ad\u8fd9\u95e8\u5b66\u79d1\u7684\u7a33\u5b9a\u5ea6\u3002",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = tone.copy(alpha = 0.10f)
                ) {
                    Text(
                        text = when {
                            delta == null -> "\u7b49\u5f85\u5bf9\u6bd4"
                            delta >= 0 -> "\u63d0\u5347 ${String.format("%.1f", delta)}"
                            else -> "\u56de\u843d ${String.format("%.1f", delta)}"
                        },
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = tone
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ScorePane(
                    title = "\u671f\u4e2d",
                    stats = mid,
                    tone = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.weight(1f)
                )
                ScorePane(
                    title = "\u671f\u672b",
                    stats = fin,
                    tone = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun ScorePane(
    title: String,
    stats: SubjectStats?,
    tone: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        color = tone.copy(alpha = 0.09f),
        border = BorderStroke(1.dp, tone.copy(alpha = 0.12f))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(title, style = MaterialTheme.typography.labelLarge, color = tone)
            Text(
                text = stats?.avg?.let { String.format("%.1f", it) } ?: "--",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = stats?.let { "\u53ca\u683c ${String.format("%.1f%%", it.passRate * 100)}" } ?: "\u7b49\u5f85\u6570\u636e",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
