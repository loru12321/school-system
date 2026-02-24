package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.RecordCard

@Composable
fun HomeScreen(screenWidth: Dp, data: SchoolSystemData, onSchoolClick: (String) -> Unit) {
    val columns = when {
        screenWidth < 600.dp -> 1 // Phone
        screenWidth < 840.dp -> 2 // Small tablet
        else -> 3 // Large tablet
    }

    val schools = data.midSchool.keys.toList()

    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item(span = { GridItemSpan(columns) }) {
            Text(
                "School Records Overview",
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(bottom = 16.dp)
            )
        }
        items(schools.size) { index ->
            val schoolName = schools[index]
            val schoolStats = data.midSchool[schoolName]?.get("total")
            RecordCard(schoolName, schoolStats, onClick = { onSchoolClick(schoolName) })
        }
    }
}
