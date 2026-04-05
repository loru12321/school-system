package com.loru.schoolsystem.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun CertificateComposable(
    name: String,
    examName: String,
    honorType: String,
    schoolName: String,
    date: String
) {
    val borderColor = Color(0xFFF5A524)
    val paperColor = Color(0xFFFFFBF2)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .aspectRatio(1.414f),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = paperColor),
        border = BorderStroke(12.dp, borderColor)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(2.dp)
                .border(2.dp, borderColor.copy(alpha = 0.5f))
                .padding(24.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .align(Alignment.BottomEnd)
                    .drawBehind {
                        drawCircle(
                            color = Color.Red.copy(alpha = 0.1f),
                            radius = size.width / 2,
                            style = Stroke(width = 2.dp.toPx())
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "ACADEMIC\nHONOR",
                    color = Color.Red.copy(alpha = 0.25f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            }

            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Honor Certificate",
                    fontSize = 42.sp,
                    color = borderColor,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
                Spacer(modifier = Modifier.size(8.dp))
                HorizontalDivider(modifier = Modifier.width(120.dp), thickness = 3.dp, color = borderColor)
                Spacer(modifier = Modifier.size(32.dp))

                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)) {
                    Text(
                        text = name,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E293B)
                    )
                    Spacer(modifier = Modifier.size(16.dp))
                    Text(
                        text = "For outstanding performance in $examName, this certificate recognizes excellence and disciplined academic growth.",
                        fontSize = 18.sp,
                        lineHeight = 28.sp,
                        color = Color(0xFF374151)
                    )
                    Spacer(modifier = Modifier.size(8.dp))
                    Text(
                        text = honorType,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Red,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                    Text(
                        text = "Issued with appreciation for the school's instructional leadership and measurable student progress.",
                        fontSize = 18.sp,
                        lineHeight = 28.sp,
                        color = Color(0xFF374151)
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = schoolName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E293B)
                    )
                    Text(
                        text = date,
                        fontSize = 14.sp,
                        color = Color(0xFF64748B)
                    )
                }
            }
        }
    }
}
