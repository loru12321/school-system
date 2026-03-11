package com.loru.schoolsystem.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
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
    val borderColor = Color(0xFFB45309)
    val goldBackground = Color(0xFFFFFAF0)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .aspectRatio(1.414f), // A4 ratio
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = goldBackground),
        border = BorderStroke(12.dp, borderColor)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(2.dp)
                .border(2.dp, borderColor.copy(alpha = 0.5f))
                .padding(24.dp)
        ) {
            // "教务处核准" Seal effect
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 20.dp, end = 20.dp)
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
                    "教务处核准",
                    color = Color.Red.copy(alpha = 0.2f),
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
                    text = "荣誉证书",
                    fontSize = 42.sp,
                    color = borderColor,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif // Simplified placeholder for STKaiti
                )

                Spacer(modifier = Modifier.height(8.dp))
                Divider(modifier = Modifier.width(120.dp), thickness = 3.dp, color = borderColor)
                Spacer(modifier = Modifier.height(32.dp))

                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)) {
                    Text(
                        text = "$name 同学：",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E293B)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "在本次 ${examName} 中，凭借坚持不懈的努力和出色的表现，获得了",
                        fontSize = 18.sp,
                        lineHeight = 28.sp,
                        color = Color(0xFF374151)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "“$honorType”",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Red,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                    Text(
                        text = "光荣称号，特发此证，以资鼓励！",
                        fontSize = 18.sp,
                        lineHeight = 28.sp,
                        color = Color(0xFF374151)
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                Column(
                    modifier = Modifier.fillMaxWidth().padding(end = 24.dp),
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
