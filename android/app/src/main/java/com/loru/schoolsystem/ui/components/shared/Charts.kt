package com.loru.schoolsystem.ui.components.shared

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * A professional radar chart component for visualizing multi-dimensional data.
 */
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas

@Composable
fun RadarChart(
    labels: List<String>,
    data: List<Double>,
    modifier: Modifier = Modifier
) {
    val count = labels.size
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = primaryColor.copy(alpha = 0.15f)
    val gridColor = Color.Gray.copy(alpha = 0.3f)
    
    Canvas(modifier = modifier.fillMaxSize().padding(32.dp)) {
        val center = Offset(size.width / 2, size.height / 2)
        val radius = size.width / 2
        
        // Draw grid levels (concentric polygons)
        for (level in 1..4) {
            val r = radius * (level / 4f)
            val path = Path()
            for (i in 0 until count) {
                val angle = i * (2 * PI / count) - PI / 2
                val x = center.x + r * cos(angle).toFloat()
                val y = center.y + r * sin(angle).toFloat()
                if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
            }
            path.close()
            drawPath(path, gridColor, style = Stroke(width = 1.dp.toPx()))
        }
        
        // Draw axes and labels
        for (i in 0 until count) {
            val angle = i * (2 * PI / count) - PI / 2
            val x = center.x + radius * cos(angle).toFloat()
            val y = center.y + radius * sin(angle).toFloat()
            drawLine(gridColor, center, Offset(x, y), strokeWidth = 1.dp.toPx())
            
            // Draw Labels (Simple implementation using nativeCanvas for spacing)
            drawIntoCanvas { canvas ->
                val paint = android.graphics.Paint().apply {
                    color = android.graphics.Color.GRAY
                    textSize = 10.dp.toPx()
                    textAlign = android.graphics.Paint.Align.CENTER
                }
                val labelX = center.x + (radius + 20.dp.toPx()) * cos(angle).toFloat()
                val labelY = center.y + (radius + 20.dp.toPx()) * sin(angle).toFloat()
                canvas.nativeCanvas.drawText(labels[i], labelX, labelY, paint)
            }
        }
        
        // Draw data area
        val dataPath = Path()
        val vertexPoints = mutableListOf<Offset>()
        for (i in 0 until count) {
            val angle = i * (2 * PI / count) - PI / 2
            val r = radius * data[i].toFloat().coerceIn(0f, 1f)
            val x = center.x + r * cos(angle).toFloat()
            val y = center.y + r * sin(angle).toFloat()
            val point = Offset(x, y)
            vertexPoints.add(point)
            if (i == 0) dataPath.moveTo(x, y) else dataPath.lineTo(x, y)
        }
        dataPath.close()
        drawPath(dataPath, secondaryColor, style = Fill)
        drawPath(dataPath, primaryColor, style = Stroke(width = 3.dp.toPx()))
        
        // Draw vertex dots
        vertexPoints.forEach { point ->
            drawCircle(primaryColor, radius = 4.dp.toPx(), center = point)
            drawCircle(Color.White, radius = 2.dp.toPx(), center = point)
        }
    }
}
