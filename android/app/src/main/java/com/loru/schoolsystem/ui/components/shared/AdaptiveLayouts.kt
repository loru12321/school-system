package com.loru.schoolsystem.ui.components.shared

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.ui.model.DensityMode

private enum class SpacingTier {
    COMPACT,
    BALANCED,
    COMFORTABLE
}

private fun resolveSpacingTier(screenWidth: Dp, densityMode: DensityMode): SpacingTier {
    return when (densityMode) {
        DensityMode.COMPACT -> SpacingTier.COMPACT
        DensityMode.COMFORTABLE -> SpacingTier.COMFORTABLE
        DensityMode.AUTO -> {
            when {
                screenWidth < 600.dp -> SpacingTier.BALANCED
                screenWidth < 960.dp -> SpacingTier.BALANCED
                else -> SpacingTier.COMFORTABLE
            }
        }
    }
}

fun resolveContentHorizontalPadding(screenWidth: Dp, densityMode: DensityMode): Dp {
    return when (resolveSpacingTier(screenWidth, densityMode)) {
        SpacingTier.COMPACT -> 14.dp
        SpacingTier.BALANCED -> 18.dp
        SpacingTier.COMFORTABLE -> 22.dp
    }
}

fun resolveSectionSpacing(screenWidth: Dp, densityMode: DensityMode): Dp {
    return when (resolveSpacingTier(screenWidth, densityMode)) {
        SpacingTier.COMPACT -> 12.dp
        SpacingTier.BALANCED -> 16.dp
        SpacingTier.COMFORTABLE -> 18.dp
    }
}

fun resolveCardPadding(screenWidth: Dp, densityMode: DensityMode): Dp {
    return when (resolveSpacingTier(screenWidth, densityMode)) {
        SpacingTier.COMPACT -> 16.dp
        SpacingTier.BALANCED -> 20.dp
        SpacingTier.COMFORTABLE -> 24.dp
    }
}

@Composable
fun AdaptiveCardGrid(
    screenWidth: Dp,
    densityMode: DensityMode,
    items: List<@Composable (Modifier) -> Unit>,
    modifier: Modifier = Modifier,
    compactColumns: Int = 1,
    mediumColumns: Int = 2,
    expandedColumns: Int = 3
) {
    val columns = when {
        screenWidth < 680.dp -> compactColumns
        screenWidth < 1120.dp -> mediumColumns
        else -> expandedColumns
    }.coerceAtLeast(1)
    val spacing = resolveSectionSpacing(screenWidth, densityMode)

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(spacing)
    ) {
        items.chunked(columns).forEach { rowItems ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(spacing)
            ) {
                rowItems.forEach { item ->
                    item(Modifier.weight(1f))
                }
                repeat(columns - rowItems.size) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}
