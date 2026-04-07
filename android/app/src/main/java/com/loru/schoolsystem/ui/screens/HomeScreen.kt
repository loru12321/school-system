package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.AdaptiveCardGrid
import com.loru.schoolsystem.ui.components.shared.MetricBadge
import com.loru.schoolsystem.ui.components.shared.OverviewMetricCard
import com.loru.schoolsystem.ui.components.shared.RecordCard
import com.loru.schoolsystem.ui.components.shared.resolveCardPadding
import com.loru.schoolsystem.ui.components.shared.resolveContentHorizontalPadding
import com.loru.schoolsystem.ui.components.shared.resolveSectionSpacing
import com.loru.schoolsystem.ui.model.DensityMode

@Composable
fun HomeScreen(
    screenWidth: Dp,
    densityMode: DensityMode,
    data: SchoolSystemData,
    onSchoolClick: (String) -> Unit
) {
    val columns = when {
        screenWidth < 680.dp -> 1
        screenWidth < 1180.dp -> 2
        else -> 3
    }
    val contentPadding = resolveContentHorizontalPadding(screenWidth, densityMode)
    val sectionSpacing = resolveSectionSpacing(screenWidth, densityMode)
    val cardPadding = resolveCardPadding(screenWidth, densityMode)

    val schools = (data.midSchool.keys + data.finSchool.keys).toSet().sorted()
    val finalTotals = schools.mapNotNull { schoolName ->
        data.finSchool[schoolName]?.get("total") ?: data.midSchool[schoolName]?.get("total")
    }
    val finalAverage = finalTotals.map { it.avg }.average().takeIf { !it.isNaN() } ?: 0.0
    val finalPassRate = finalTotals.map { it.passRate }.average().takeIf { !it.isNaN() } ?: 0.0
    val teacherCount = (data.finTeacher.keys + data.midTeacher.keys).toSet().size
    val subjectSet = mutableSetOf<String>()
    schools.forEach { schoolName ->
        data.midSchool[schoolName]?.keys?.filterTo(subjectSet) { it != "total" }
        data.finSchool[schoolName]?.keys?.filterTo(subjectSet) { it != "total" }
    }
    val improvingSchools = schools.count { schoolName ->
        val mid = data.midSchool[schoolName]?.get("total")?.avg ?: 0.0
        val fin = data.finSchool[schoolName]?.get("total")?.avg ?: mid
        fin >= mid
    }
    val bestImprovementSchool = schools.maxByOrNull { schoolName ->
        val mid = data.midSchool[schoolName]?.get("total")?.avg ?: 0.0
        val fin = data.finSchool[schoolName]?.get("total")?.avg ?: mid
        fin - mid
    }.orEmpty()
    val bestImprovementDelta = if (bestImprovementSchool.isNotBlank()) {
        val mid = data.midSchool[bestImprovementSchool]?.get("total")?.avg ?: 0.0
        val fin = data.finSchool[bestImprovementSchool]?.get("total")?.avg ?: mid
        fin - mid
    } else {
        0.0
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        contentPadding = PaddingValues(horizontal = contentPadding, vertical = sectionSpacing + 6.dp),
        horizontalArrangement = Arrangement.spacedBy(sectionSpacing),
        verticalArrangement = Arrangement.spacedBy(sectionSpacing)
    ) {
        item(span = { GridItemSpan(columns) }) {
            Card(
                shape = RoundedCornerShape(34.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.16f),
                                    MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                                    MaterialTheme.colorScheme.tertiary.copy(alpha = 0.12f)
                                )
                            ),
                            shape = RoundedCornerShape(34.dp)
                        )
                        .padding(cardPadding)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.76f)
                        ) {
                            Text(
                                "Glass Dashboard",
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            "\u5b66\u6821\u603b\u89c8\u53f0",
                            style = MaterialTheme.typography.headlineLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            "\u628a\u5b66\u6821\u3001\u6559\u5e08\u3001\u5b66\u79d1\u4e0e\u672b\u8003\u8d8b\u52bf\u6536\u8fdb\u540c\u4e00\u5757\u5de5\u4f5c\u53f0\uff0c\u5148\u770b\u6574\u4f53\uff0c\u518d\u4e0b\u94bb\u5230\u5355\u6821\u3002",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        AdaptiveCardGrid(
                            screenWidth = screenWidth,
                            densityMode = densityMode,
                            mediumColumns = 3,
                            expandedColumns = 3,
                            items = listOf(
                                { modifier ->
                                    MetricBadge(
                                        label = "\u5b66\u6821",
                                        value = schools.size.toString(),
                                        modifier = modifier,
                                        tone = MaterialTheme.colorScheme.primary
                                    )
                                },
                                { modifier ->
                                    MetricBadge(
                                        label = "\u6559\u5e08",
                                        value = teacherCount.toString(),
                                        modifier = modifier,
                                        tone = MaterialTheme.colorScheme.secondary
                                    )
                                },
                                { modifier ->
                                    MetricBadge(
                                        label = "\u5b66\u79d1",
                                        value = subjectSet.size.toString(),
                                        modifier = modifier,
                                        tone = MaterialTheme.colorScheme.tertiary
                                    )
                                }
                            )
                        )
                        Text(
                            if (bestImprovementSchool.isNotBlank()) {
                                "\u5f53\u524d\u6700\u4f73\u8d8b\u52bf\uff1a$bestImprovementSchool  +${String.format("%.1f", bestImprovementDelta)}"
                            } else {
                                "\u5df2\u63a5\u5165\u5b66\u6821\uff1a${schools.size} \u6240"
                            },
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        item(span = { GridItemSpan(columns) }) {
            AdaptiveCardGrid(
                screenWidth = screenWidth,
                densityMode = densityMode,
                expandedColumns = 3,
                items = listOf(
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u5b66\u6821\u6570",
                            value = schools.size.toString(),
                            supporting = "\u9996\u5c4f\u5148\u7ed9\u51fa\u8986\u76d6\u8303\u56f4\uff0c\u8fdb\u5165\u540e\u80fd\u7acb\u523b\u5224\u65ad\u5f53\u524d\u6837\u672c\u91cf\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.primary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u671f\u672b\u5747\u5206",
                            value = String.format("%.1f", finalAverage),
                            supporting = "\u628a\u6700\u5e38\u770b\u7684\u603b\u5206\u6307\u6807\u653e\u5728\u6700\u524d\u9762\uff0c\u51cf\u5c11\u6765\u56de\u5207\u9875\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.tertiary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u5e73\u5747\u53ca\u683c\u7387",
                            value = String.format("%.1f%%", finalPassRate * 100),
                            supporting = "\u624b\u673a\u3001\u5e73\u677f\u548c\u6a2a\u5c4f\u4e0b\u90fd\u6cbf\u7528\u540c\u4e00\u5c42\u7ea7\uff0c\u4e0d\u4f1a\u51fa\u73b0\u62e5\u6324\u65ad\u88c2\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.secondary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u6559\u5e08\u6570",
                            value = teacherCount.toString(),
                            supporting = "\u6559\u5e08\u7edf\u8ba1\u4e0e\u5b66\u6821\u7edf\u8ba1\u4f7f\u7528\u4e00\u81f4\u7684\u89c6\u89c9\u5bc6\u5ea6\uff0c\u9605\u8bfb\u8282\u594f\u66f4\u7a33\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.primary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u5b66\u79d1\u6570",
                            value = subjectSet.size.toString(),
                            supporting = "\u4e0d\u540c\u5206\u8fa8\u7387\u4e0b\u4f1a\u81ea\u52a8\u91cd\u6392\u5361\u7247\u548c\u95f4\u8ddd\uff0c\u907f\u514d\u4fe1\u606f\u6324\u538b\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.tertiary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u7a33\u5b9a\u63d0\u5347\u6821",
                            value = improvingSchools.toString(),
                            supporting = "\u5feb\u901f\u9501\u5b9a\u671f\u672b\u5747\u5206\u4e0d\u4f4e\u4e8e\u671f\u4e2d\u7684\u5b66\u6821\uff0c\u65b9\u4fbf\u7ee7\u7eed\u8ddf\u8fdb\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.secondary
                        )
                    }
                )
            )
        }

        items(schools.size) { index ->
            val schoolName = schools[index]
            RecordCard(
                name = schoolName,
                midStats = data.midSchool[schoolName]?.get("total"),
                finStats = data.finSchool[schoolName]?.get("total"),
                onClick = { onSchoolClick(schoolName) }
            )
        }
    }
}
