package com.loru.schoolsystem.ui.components.shared

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.loru.schoolsystem.data.model.SubjectStats

@Composable
fun RecordCard(name: String, stats: SubjectStats?, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(name, style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))
            stats?.let {
                Text("Avg Score: ${String.format("%.2f", it.avg)}")
                Text("Pass Rate: ${String.format("%.1f%%", it.passRate * 100)}")
                Text("Rank: ${it.rank2Rate ?: "-"}")
            }
        }
    }
}

@Composable
fun SubjectDetailCard(subject: String, mid: SubjectStats?, fin: SubjectStats?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(subject, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Mid-term", style = MaterialTheme.typography.labelMedium)
                    mid?.let {
                        Text("Avg: ${String.format("%.1f", it.avg)}")
                        Text("Pass: ${String.format("%.1f%%", it.passRate * 100)}")
                    }
                }
                Icon(Icons.Default.ChevronRight, contentDescription = null, modifier = Modifier.align(Alignment.CenterVertically))
                Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                    Text("Final", style = MaterialTheme.typography.labelMedium)
                    fin?.let {
                        Text("Avg: ${String.format("%.1f", it.avg)}")
                        Text("Pass: ${String.format("%.1f%%", it.passRate * 100)}")
                    }
                }
            }
        }
    }
}
