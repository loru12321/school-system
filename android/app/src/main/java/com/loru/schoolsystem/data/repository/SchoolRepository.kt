package com.loru.schoolsystem.data.repository

import android.content.Context
import com.loru.schoolsystem.data.model.SchoolSystemData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.serialization.json.Json
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

class SchoolRepository(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    fun getSchoolData(): Flow<SchoolSystemData?> = flow {
        try {
            val content = context.assets.open("模拟对比验证明细.json").use { inputStream ->
                InputStreamReader(inputStream, StandardCharsets.UTF_8).use { reader ->
                    reader.readText()
                }
            }
            emit(json.decodeFromString<SchoolSystemData>(content))
        } catch (exception: Exception) {
            exception.printStackTrace()
            emit(null)
        }
    }.flowOn(Dispatchers.IO)
}
