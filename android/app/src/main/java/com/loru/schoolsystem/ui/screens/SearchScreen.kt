package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.RecordCard
import com.loru.schoolsystem.ui.components.shared.resolveCardPadding
import com.loru.schoolsystem.ui.components.shared.resolveContentHorizontalPadding
import com.loru.schoolsystem.ui.components.shared.resolveSectionSpacing
import com.loru.schoolsystem.ui.model.DensityMode

@Composable
fun SearchScreen(
    screenWidth: Dp,
    densityMode: DensityMode,
    data: SchoolSystemData,
    onSchoolClick: (String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    val contentPadding = resolveContentHorizontalPadding(screenWidth, densityMode)
    val sectionSpacing = resolveSectionSpacing(screenWidth, densityMode)
    val cardPadding = resolveCardPadding(screenWidth, densityMode)
    val schools = (data.midSchool.keys + data.finSchool.keys).toSet().sorted()
    val filteredSchools = schools.filter { it.contains(searchQuery.trim(), ignoreCase = true) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = contentPadding, vertical = sectionSpacing + 6.dp),
        verticalArrangement = Arrangement.spacedBy(sectionSpacing)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(
                                    MaterialTheme.colorScheme.tertiary.copy(alpha = 0.14f),
                                    MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
                                )
                            ),
                            shape = RoundedCornerShape(32.dp)
                        )
                        .padding(cardPadding)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.78f)
                        ) {
                            Text(
                                "Focused Search",
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            "\u641c\u7d22\u5b66\u6821",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            "\u7528\u66f4\u77ed\u7684\u8def\u5f84\u627e\u5230\u76ee\u6807\u5b66\u6821\u3002\u8f93\u5165\u540d\u79f0\u540e\uff0c\u5217\u8868\u4f1a\u5728\u5f53\u524d\u8bbe\u5907\u5bbd\u5ea6\u4e0b\u4fdd\u6301\u7a33\u5b9a\u91cd\u6392\u3002",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.76f)
                        ) {
                            Text(
                                "\u5df2\u5339\u914d ${filteredSchools.size} \u6240\u5b66\u6821",
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }

        item {
            Surface(
                shape = RoundedCornerShape(28.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.32f))
            ) {
                TextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(28.dp),
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodyLarge,
                    placeholder = { Text("\u8f93\u5165\u5b66\u6821\u540d\u79f0") },
                    label = { Text("\u5feb\u901f\u641c\u7d22") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        disabledContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        disabledIndicatorColor = Color.Transparent
                    )
                )
            }
        }

        if (filteredSchools.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(28.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.28f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(cardPadding),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("\u6ca1\u6709\u5339\u914d\u9879", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                        Text(
                            "\u53ef\u4ee5\u8bd5\u8bd5\u66f4\u77ed\u7684\u5173\u952e\u8bcd\uff0c\u6216\u8005\u56de\u5230\u603b\u89c8\u9875\u76f4\u63a5\u6d4f\u89c8\u5168\u90e8\u5b66\u6821\u5361\u7247\u3002",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(filteredSchools.size) { index ->
                val schoolName = filteredSchools[index]
                RecordCard(
                    name = schoolName,
                    midStats = data.midSchool[schoolName]?.get("total"),
                    finStats = data.finSchool[schoolName]?.get("total"),
                    onClick = { onSchoolClick(schoolName) }
                )
            }
        }
    }
}
