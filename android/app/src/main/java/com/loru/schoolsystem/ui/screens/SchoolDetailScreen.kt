package com.loru.schoolsystem.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SchoolSystemData
import com.loru.schoolsystem.ui.components.shared.CertificateDialog
import com.loru.schoolsystem.ui.components.shared.RadarChart
import com.loru.schoolsystem.ui.components.shared.SubjectDetailCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchoolDetailScreen(schoolName: String, data: SchoolSystemData, onBack: () -> Unit) {
    val midStats = data.midSchool[schoolName] ?: emptyMap()
    val finStats = data.finSchool[schoolName] ?: emptyMap()
    val subjects = midStats.keys.filter { it != "total" }.sorted()
    
    val midTotal = midStats["total"]?.avg ?: 0.0
    val finTotal = finStats["total"]?.avg ?: 0.0
    val isImproving = finTotal > midTotal

    var showCertDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(schoolName) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
            },
            actions = {
                if (isImproving) {
                    IconButton(onClick = { showCertDialog = true }) {
                        Icon(Icons.Default.Star, contentDescription = "Award Certificate", tint = Color(0xFFB45309))
                    }
                }
            }
        )
        
        if (showCertDialog) {
            CertificateDialog(
                schoolName = schoolName,
                onDismiss = { showCertDialog = false }
            )
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("Subject Balance (Final)", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                val chartData = subjects.map { sub ->
                    (finStats[sub]?.avg ?: 0.0) / 100.0 // Normalize to 0-1
                }
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    RadarChart(labels = subjects, data = chartData)
                }
            }
            
            item {
                Text("Subject Comparison (Mid-term vs Final)", style = MaterialTheme.typography.titleMedium)
            }
            
            items(subjects.size) { index ->
                val sub = subjects[index]
                val mid = midStats[sub]
                val fin = finStats[sub]
                SubjectDetailCard(sub, mid, fin)
            }
        }
    }
}
