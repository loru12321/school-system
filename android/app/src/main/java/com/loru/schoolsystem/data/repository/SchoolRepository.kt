package com.loru.schoolsystem.data.repository

import android.content.Context
import com.loru.schoolsystem.data.model.SchoolSystemData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.serialization.json.Json
import java.io.InputStreamReader

class SchoolRepository(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    fun getSchoolData(): Flow<SchoolSystemData?> = flow {
        try {
            val assetManager = context.assets
            // Using the specific file identified in mapping
            val inputStream = assetManager.open("模拟对比验证明细.json")
            val reader = InputStreamReader(inputStream)
            val content = reader.readText()
            reader.close()
            
            val data = json.decodeFromString<SchoolSystemData>(content)
            emit(data)
        } catch (e: Exception) {
            e.printStackTrace()
            emit(null)
        }
    }.flowOn(Dispatchers.IO)
}
