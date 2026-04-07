package com.loru.schoolsystem.data.repository

import android.content.Context
import com.loru.schoolsystem.data.model.SchoolSystemData
import java.io.InputStreamReader
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.serialization.json.Json

class SchoolRepository(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    private fun resolvePrimaryDataAsset(): String {
        val assetNames = context.assets.list("")?.toList().orEmpty()
        val preferredNames = listOf(
            "模拟对比验证明细.json",
            "学生端云对比模拟验证明细.json"
        )

        return preferredNames.firstOrNull(assetNames::contains)
            ?: assetNames.firstOrNull { name ->
                name.endsWith(".json") && !name.startsWith("capacitor")
            }
            ?: throw IllegalStateException("No school data JSON asset found in android assets.")
    }

    fun getSchoolData(): Flow<SchoolSystemData?> = flow {
        try {
            val inputStream = context.assets.open(resolvePrimaryDataAsset())
            val content = InputStreamReader(inputStream, Charsets.UTF_8).use { reader ->
                reader.readText()
            }
            val data = json.decodeFromString<SchoolSystemData>(content)
            emit(data)
        } catch (e: Exception) {
            e.printStackTrace()
            emit(null)
        }
    }.flowOn(Dispatchers.IO)
}
