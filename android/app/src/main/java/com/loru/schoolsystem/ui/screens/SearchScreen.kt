package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.RecordCard

@Composable
fun SearchScreen(data: SchoolSystemData, onSchoolClick: (String) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    val schools = data.midSchool.keys.toList()
    val filteredSchools = schools.filter { it.contains(searchQuery, ignoreCase = true) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            label = { Text("Search Schools") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) }
        )
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(filteredSchools.size) { index ->
                val schoolName = filteredSchools[index]
                RecordCard(schoolName, data.midSchool[schoolName]?.get("total"), onClick = { onSchoolClick(schoolName) })
            }
        }
    }
}
