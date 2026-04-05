package com.loru.schoolsystem.ui.components.shared

import android.graphics.Paint
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp

@Composable
fun ScoreTrendChart(
    labels: List<String>,
    values: List<Float>,
    modifier: Modifier = Modifier
) {
    LineChart(
        labels = labels,
        currentValues = values,
        modifier = modifier
    )
}

@Composable
fun ComparisonTrendChart(
    labels: List<String>,
    baselineValues: List<Float>,
    currentValues: List<Float>,
    modifier: Modifier = Modifier
) {
    LineChart(
        labels = labels,
        currentValues = currentValues,
        baselineValues = baselineValues,
        modifier = modifier
    )
}

@Composable
private fun LineChart(
    labels: List<String>,
    currentValues: List<Float>,
    baselineValues: List<Float>? = null,
    modifier: Modifier = Modifier
) {
    val primary = MaterialTheme.colorScheme.primary
    val secondary = MaterialTheme.colorScheme.secondary
    val grid = MaterialTheme.colorScheme.outline.copy(alpha = 0.24f)
    val labelColor = MaterialTheme.colorScheme.onSurfaceVariant
    val maxValue = (currentValues + (baselineValues ?: emptyList())).maxOrNull()?.coerceAtLeast(1f) ?: 1f

    Canvas(modifier = modifier.fillMaxSize().padding(horizontal = 8.dp, vertical = 12.dp)) {
        if (labels.isEmpty() || currentValues.isEmpty()) return@Canvas

        val chartLeft = 20.dp.toPx()
        val chartTop = 16.dp.toPx()
        val chartBottom = size.height - 28.dp.toPx()
        val chartWidth = size.width - chartLeft - 12.dp.toPx()
        val chartHeight = chartBottom - chartTop
        val stepX = if (labels.size > 1) chartWidth / (labels.size - 1) else 0f

        repeat(4) { index ->
            val y = chartTop + chartHeight * (index / 3f)
            drawLine(
                color = grid,
                start = Offset(chartLeft, y),
                end = Offset(chartLeft + chartWidth, y),
                strokeWidth = 1.dp.toPx()
            )
        }

        fun buildPath(values: List<Float>): Pair<Path, List<Offset>> {
            val points = values.mapIndexed { index, value ->
                Offset(
                    x = chartLeft + stepX * index,
                    y = chartBottom - (value / maxValue) * chartHeight
                )
            }
            val path = Path()
            points.forEachIndexed { index, point ->
                if (index == 0) path.moveTo(point.x, point.y) else path.lineTo(point.x, point.y)
            }
            return path to points
        }

        val secondSeries = baselineValues?.let { buildPath(it) }
        secondSeries?.let { (path, points) ->
            drawPath(path = path, color = secondary.copy(alpha = 0.6f), style = Stroke(width = 2.dp.toPx()))
            points.forEach { point ->
                drawCircle(color = secondary, radius = 3.dp.toPx(), center = point)
            }
        }

        val (currentPath, currentPoints) = buildPath(currentValues)
        drawPath(path = currentPath, color = primary, style = Stroke(width = 3.dp.toPx()))
        currentPoints.forEach { point ->
            drawCircle(color = primary, radius = 4.dp.toPx(), center = point)
        }

        drawIntoCanvas { canvas ->
            val paint = Paint().apply {
                color = labelColor.toArgb()
                textSize = 10.dp.toPx()
                textAlign = Paint.Align.CENTER
                isAntiAlias = true
            }
            labels.forEachIndexed { index, label ->
                val x = chartLeft + stepX * index
                canvas.nativeCanvas.drawText(label, x, size.height - 6.dp.toPx(), paint)
            }
        }
    }
}
