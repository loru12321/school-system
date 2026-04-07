package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.ui.components.shared.AdaptiveCardGrid
import com.loru.schoolsystem.ui.components.shared.OverviewMetricCard
import com.loru.schoolsystem.ui.components.shared.resolveCardPadding
import com.loru.schoolsystem.ui.components.shared.resolveContentHorizontalPadding
import com.loru.schoolsystem.ui.components.shared.resolveSectionSpacing
import com.loru.schoolsystem.ui.model.DensityMode
import com.loru.schoolsystem.ui.model.ThemeMode

@Composable
fun SettingsScreen(
    screenWidth: Dp,
    densityMode: DensityMode,
    themeMode: ThemeMode,
    reduceMotion: Boolean,
    onThemeModeChange: (ThemeMode) -> Unit,
    onDensityModeChange: (DensityMode) -> Unit,
    onReduceMotionChange: (Boolean) -> Unit
) {
    val configuration = LocalConfiguration.current
    val density = LocalDensity.current
    val width = configuration.screenWidthDp
    val height = configuration.screenHeightDp
    val contentPadding = resolveContentHorizontalPadding(screenWidth, densityMode)
    val sectionSpacing = resolveSectionSpacing(screenWidth, densityMode)
    val cardPadding = resolveCardPadding(screenWidth, densityMode)
    val layoutMode = when {
        width < 600 -> "\u7d27\u51d1"
        width < 960 -> "\u5e73\u8861"
        else -> "\u5c55\u5f00"
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = contentPadding, vertical = sectionSpacing + 6.dp),
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
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("\u663e\u793a\u4e0e\u9002\u914d", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onSurface)
                    Text(
                        "\u4e3b\u9898\u3001\u4fe1\u606f\u5bc6\u5ea6\u548c\u52a8\u6548\u4f1a\u4e00\u8d77\u7ea6\u675f\u5e03\u5c40\uff0c\u907f\u514d\u5728\u4e0d\u540c\u5206\u8fa8\u7387\u3001\u6a2a\u7ad6\u5c4f\u548c\u5b57\u4f53\u7f29\u653e\u4e0b\u51fa\u73b0\u8df3\u52a8\u3002",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
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
                            label = "\u5e03\u5c40\u7ea7\u522b",
                            value = layoutMode,
                            supporting = "\u7cfb\u7edf\u4f1a\u6839\u636e\u7a97\u53e3\u5bbd\u5ea6\u81ea\u52a8\u5207\u6362\u7d27\u51d1\u3001\u5e73\u8861\u548c\u5c55\u5f00\u8282\u594f\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.primary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u5f53\u524d\u5206\u8fa8\u7387",
                            value = "${width} x ${height}",
                            supporting = "\u5b9e\u65f6\u67e5\u770b\u5f53\u524d\u7a97\u53e3\u5c3a\u5bf8\uff0c\u786e\u8ba4\u5361\u7247\u5bbd\u5ea6\u548c\u7559\u767d\u662f\u5426\u7a33\u5b9a\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.tertiary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u5b57\u4f53\u7f29\u653e",
                            value = String.format("%.2fx", density.fontScale),
                            supporting = "\u5373\u4f7f\u7cfb\u7edf\u6587\u5b57\u653e\u5927\uff0c\u5bfc\u822a\u548c\u5361\u7247\u4e5f\u4f1a\u4fdd\u6301\u6e05\u6670\u53ef\u8bfb\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.secondary
                        )
                    },
                    { modifier ->
                        OverviewMetricCard(
                            label = "\u52a8\u6548\u72b6\u6001",
                            value = if (reduceMotion) "\u51cf\u5f31" else "\u6807\u51c6",
                            supporting = "\u51cf\u5c11\u52a8\u6548\u540e\u4f1a\u5173\u95ed\u4e3b\u8981\u8fc7\u6e21\uff0c\u964d\u4f4e\u5207\u9875\u4f4d\u79fb\u611f\u3002",
                            modifier = modifier,
                            accent = MaterialTheme.colorScheme.primary
                        )
                    }
                )
            )
        }

        item {
            Surface(
                shape = RoundedCornerShape(30.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.28f))
            ) {
                Column(
                    modifier = Modifier.padding(cardPadding),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text("\u4e3b\u9898\u6a21\u5f0f", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                    ChoiceChipRow(
                        options = ThemeMode.entries.map { it to it.label() },
                        selected = themeMode,
                        onSelect = onThemeModeChange
                    )
                    Text("\u4fe1\u606f\u5bc6\u5ea6", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                    ChoiceChipRow(
                        options = DensityMode.entries.map { it to it.label() },
                        selected = densityMode,
                        onSelect = onDensityModeChange
                    )
                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text("\u51cf\u5c11\u52a8\u6548", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                                Text(
                                    "\u5173\u95ed\u4e3b\u8981\u5207\u9875\u8fc7\u6e21\uff0c\u51cf\u8f7b\u6a2a\u7ad6\u5c4f\u5207\u6362\u548c\u5bfc\u822a\u5207\u6362\u65f6\u7684\u4f4d\u79fb\u611f\u3002",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = reduceMotion,
                                onCheckedChange = onReduceMotionChange
                            )
                        }
                    }
                }
            }
        }

        item {
            Surface(
                shape = RoundedCornerShape(30.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.92f)
            ) {
                Column(
                    modifier = Modifier.padding(cardPadding - 2.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text("\u517c\u5bb9\u7b56\u7565", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                    SettingsLine("\u81ea\u9002\u5e94\u5bfc\u822a", "\u004e\u0061\u0076\u0069\u0067\u0061\u0074\u0069\u006f\u006e\u0020\u0053\u0075\u0069\u0074\u0065\u0020\u4f1a\u6309\u7a97\u53e3\u5c3a\u5bf8\u5207\u6362\u5e95\u680f\u3001\u4fa7\u680f\u548c\u66f4\u5bbd\u7684\u5bfc\u822a\u5f62\u6001\u3002")
                    SettingsLine("\u5b89\u5168\u533a\u5904\u7406", "\u6839\u5e03\u5c40\u4f7f\u7528\u0020\u0073\u0061\u0066\u0065\u0020\u0064\u0072\u0061\u0077\u0069\u006e\u0067\uff0c\u907f\u514d\u72b6\u6001\u680f\u3001\u624b\u52bf\u6761\u548c\u5218\u6d77\u533a\u57df\u538b\u4f4f\u5185\u5bb9\u3002")
                    SettingsLine("\u7edf\u4e00\u89c6\u89c9", "\u7f51\u9875\u7aef\u4e0e\u0020\u0041\u0050\u004b\u0020\u7aef\u5171\u4eab\u5706\u89d2\u3001\u73bb\u7483\u5c42\u548c\u66f4\u514b\u5236\u7684\u8272\u5f69\u8282\u594f\u3002")
                    SettingsLine("\u7248\u672c", "1.0.0-native-beta")
                }
            }
        }
    }
}

@Composable
private fun <T> ChoiceChipRow(
    options: List<Pair<T, String>>,
    selected: T,
    onSelect: (T) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        options.forEach { (value, label) ->
            FilterChip(
                selected = selected == value,
                onClick = { onSelect(value) },
                label = { Text(label) }
            )
        }
    }
}

@Composable
private fun SettingsLine(title: String, detail: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
        Text(detail, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

private fun ThemeMode.label(): String = when (this) {
    ThemeMode.SYSTEM -> "\u8ddf\u968f\u7cfb\u7edf"
    ThemeMode.LIGHT -> "\u6d45\u8272"
    ThemeMode.DARK -> "\u6df1\u8272"
}

private fun DensityMode.label(): String = when (this) {
    DensityMode.AUTO -> "\u81ea\u52a8"
    DensityMode.COMPACT -> "\u7d27\u51d1"
    DensityMode.COMFORTABLE -> "\u8212\u5c55"
}
