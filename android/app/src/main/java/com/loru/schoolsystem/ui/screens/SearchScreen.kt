package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.RecordCard

@Composable
fun SearchScreen(data: SchoolSystemData, onSchoolClick: (String) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    val schoolNames = data.finSchool.keys.sorted()
    val filteredSchools = schoolNames.filter { it.contains(searchQuery.trim(), ignoreCase = true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("School Directory", style = MaterialTheme.typography.headlineMedium)
            Text(
                "Search any school and jump into detailed score diagnostics.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Search by school name") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            singleLine = true
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (filteredSchools.isEmpty()) {
                item {
                    Text(
                        text = "No schools matched \"$searchQuery\".",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(filteredSchools, key = { it }) { schoolName ->
                    RecordCard(
                        name = schoolName,
                        stats = data.finSchool[schoolName]?.get("total"),
                        supportingStats = data.midSchool[schoolName]?.get("total"),
                        onClick = { onSchoolClick(schoolName) }
                    )
                }
            }
        }
    }
}
