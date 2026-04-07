package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.AdaptiveCardGrid
import com.loru.schoolsystem.ui.components.shared.CertificateDialog
import com.loru.schoolsystem.ui.components.shared.MetricBadge
import com.loru.schoolsystem.ui.components.shared.OverviewMetricCard
import com.loru.schoolsystem.ui.components.shared.RadarChart
import com.loru.schoolsystem.ui.components.shared.SubjectDetailCard
import com.loru.schoolsystem.ui.components.shared.resolveCardPadding
import com.loru.schoolsystem.ui.components.shared.resolveContentHorizontalPadding
import com.loru.schoolsystem.ui.components.shared.resolveSectionSpacing
import com.loru.schoolsystem.ui.model.DensityMode
import com.loru.schoolsystem.ui.theme.SchoolSuccess

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun SchoolDetailScreen(
    screenWidth: Dp,
    densityMode: DensityMode,
    schoolName: String,
    data: SchoolSystemData,
    reduceMotion: Boolean,
    onBack: () -> Unit
) {
    val midStats = data.midSchool[schoolName] ?: emptyMap()
    val finStats = data.finSchool[schoolName] ?: emptyMap()
    val subjects = (midStats.keys + finStats.keys).filter { it != "total" }.toSet().sorted()
    val contentPadding = resolveContentHorizontalPadding(screenWidth, densityMode)
    val sectionSpacing = resolveSectionSpacing(screenWidth, densityMode)
    val cardPadding = resolveCardPadding(screenWidth, densityMode)

    val midTotal = midStats["total"]?.avg ?: 0.0
    val finTotal = finStats["total"]?.avg ?: 0.0
    val isImproving = finTotal > midTotal
    val delta = finTotal - midTotal

    var showCertDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(schoolName) },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Transparent,
                scrolledContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.88f),
                titleContentColor = MaterialTheme.colorScheme.onSurface
            ),
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "\u8fd4\u56de")
                }
            },
            actions = {
                if (isImproving) {
                    IconButton(onClick = { showCertDialog = true }) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = "\u751f\u6210\u8363\u8a89\u8bc1\u4e66",
                            tint = Color(0xFFB45309)
                        )
                    }
                }
            }
        )

        if (showCertDialog) {
            CertificateDialog(
                schoolName = schoolName,
                onDismiss = { showCertDialog = false }
            )
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = contentPadding, vertical = sectionSpacing + 4.dp),
            verticalArrangement = Arrangement.spacedBy(sectionSpacing)
        ) {
            item {
                Surface(
                    shape = RoundedCornerShape(32.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.32f))
                ) {
                    Column(
                        modifier = Modifier.padding(cardPadding),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Text("School Detail", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(schoolName, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onSurface)
                        Text(
                            "\u628a\u5b66\u6821\u6458\u8981\u3001\u5b66\u79d1\u7ed3\u6784\u548c\u8363\u8a89\u64cd\u4f5c\u6536\u8fdb\u4e00\u6761\u66f4\u5b89\u9759\u7684\u9605\u8bfb\u8def\u5f84\uff0c\u5c0f\u5c4f\u4e0a\u4e5f\u80fd\u7a33\u5b9a\u6d4f\u89c8\u3002",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        AdaptiveCardGrid(
                            screenWidth = screenWidth,
                            densityMode = densityMode,
                            expandedColumns = 3,
                            items = listOf(
                                { modifier ->
                                    MetricBadge(
                                        label = "\u671f\u672b\u5747\u5206",
                                        value = String.format("%.1f", finTotal),
                                        modifier = modifier,
                                        tone = MaterialTheme.colorScheme.primary
                                    )
                                },
                                { modifier ->
                                    MetricBadge(
                                        label = "\u671f\u4e2d\u5747\u5206",
                                        value = String.format("%.1f", midTotal),
                                        modifier = modifier,
                                        tone = MaterialTheme.colorScheme.secondary
                                    )
                                },
                                { modifier ->
                                    MetricBadge(
                                        label = "\u53d8\u5316\u503c",
                                        value = if (delta >= 0) "+${String.format("%.1f", delta)}" else String.format("%.1f", delta),
                                        modifier = modifier,
                                        tone = if (delta >= 0) SchoolSuccess else MaterialTheme.colorScheme.error
                                    )
                                }
                            )
                        )
                    }
                }
            }

            item {
                AdaptiveCardGrid(
                    screenWidth = screenWidth,
                    densityMode = densityMode,
                    expandedColumns = 2,
                    items = listOf(
                        { modifier ->
                            OverviewMetricCard(
                                label = "\u5b66\u79d1\u6570",
                                value = subjects.size.toString(),
                                supporting = "\u6240\u6709\u5b66\u79d1\u6cbf\u7528\u540c\u4e00\u5f20\u8be6\u60c5\u5361\uff0c\u5728\u4e0d\u540c\u5bbd\u5ea6\u4e0b\u90fd\u4e0d\u4f1a\u7834\u7248\u3002",
                                modifier = modifier,
                                accent = MaterialTheme.colorScheme.primary
                            )
                        },
                        { modifier ->
                            OverviewMetricCard(
                                label = "\u8363\u8a89\u72b6\u6001",
                                value = if (isImproving) "\u53ef\u751f\u6210" else "\u7ee7\u7eed\u89c2\u5bdf",
                                supporting = if (isImproving) {
                                    "\u671f\u672b\u8868\u73b0\u9ad8\u4e8e\u671f\u4e2d\uff0c\u53ef\u4ee5\u76f4\u63a5\u89e6\u53d1\u8363\u8a89\u8bc1\u4e66\u64cd\u4f5c\u3002"
                                } else {
                                    "\u5f53\u524d\u4ecd\u5728\u89c2\u5bdf\u533a\u95f4\uff0c\u5efa\u8bae\u7ee7\u7eed\u8ddf\u8fdb\u6574\u4f53\u8d8b\u52bf\u3002"
                                },
                                modifier = modifier,
                                accent = if (isImproving) SchoolSuccess else MaterialTheme.colorScheme.secondary
                            )
                        }
                    )
                )
                }
            if (subjects.isEmpty()) {
                item {
                    Surface(
                        shape = RoundedCornerShape(28.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.92f)
                    ) {
                        Column(
                            modifier = Modifier.padding(cardPadding - 2.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text("\u6682\u65e0\u5b66\u79d1\u6570\u636e", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                            Text(
                                "\u5f53\u524d\u5b66\u6821\u8fd8\u6ca1\u6709\u53ef\u7528\u4e8e\u5bf9\u6bd4\u7684\u5b66\u79d1\u8bb0\u5f55\uff0c\u6570\u636e\u540c\u6b65\u540e\u8fd9\u91cc\u4f1a\u81ea\u52a8\u8865\u9f50\u3002",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                item {
                    Surface(
                        shape = RoundedCornerShape(28.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.92f)
                    ) {
                        Column(
                            modifier = Modifier.padding(cardPadding - 2.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("\u5b66\u79d1\u7ed3\u6784", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                            Text(
                                "\u96f7\u8fbe\u56fe\u4f18\u5148\u5c55\u793a\u671f\u672b\u5747\u5206\uff0c\u8ba9\u4f18\u52bf\u5b66\u79d1\u548c\u77ed\u677f\u5b66\u79d1\u5728\u624b\u673a\u4e0a\u4e5f\u80fd\u88ab\u5feb\u901f\u8bc6\u522b\u3002",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            val chartData = subjects.map { subject ->
                                (finStats[subject]?.avg ?: 0.0) / 100.0
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(if (reduceMotion || screenWidth < 640.dp) 220.dp else 250.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                RadarChart(labels = subjects, data = chartData)
                            }
                        }
                    }
                }

                item {
                    Text("\u5b66\u79d1\u5bf9\u6bd4", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                }

                items(subjects.size) { index ->
                    val subject = subjects[index]
                    SubjectDetailCard(subject, midStats[subject], finStats[subject])
                }
            }
        }
    }
}
