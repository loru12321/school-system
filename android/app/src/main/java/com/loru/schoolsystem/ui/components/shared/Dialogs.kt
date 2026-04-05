package com.loru.schoolsystem.ui.components.shared

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable

@Composable
fun DataSourceDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Data Source Notes") },
        text = {
            Text(
                text = "This Android build reads the bundled school analytics snapshot from the app assets. It is designed for offline viewing, quick demos, and APK delivery through Android Studio.",
                style = MaterialTheme.typography.bodyMedium
            )
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}
