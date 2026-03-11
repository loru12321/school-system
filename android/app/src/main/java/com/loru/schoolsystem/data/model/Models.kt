package com.loru.schoolsystem.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SchoolSystemData(
    val midSchool: Map<String, Map<String, SubjectStats>>,
    val finSchool: Map<String, Map<String, SubjectStats>>,
    val midTeacher: Map<String, Map<String, TeacherStats>>,
    val finTeacher: Map<String, Map<String, TeacherStats>>
)

@Serializable
data class SubjectStats(
    val count: Int = 0,
    val avg: Double = 0.0,
    val excRate: Double = 0.0,
    val passRate: Double = 0.0,
    val rankAvg: Int = 0,
    val rankExc: Int = 0,
    val rankPass: Int = 0,
    val score2Rate: Double? = null,
    val rank2Rate: Int? = null
)

@Serializable
data class TeacherStats(
    val classes: String = "",
    val students: List<Student> = emptyList(),
    val avg: Double = 0.0,
    val studentCount: Int = 0,
    val excellentRate: Double = 0.0,
    val passRate: Double = 0.0,
    val lowRate: Double = 0.0,
    val contribution: Double = 0.0,
    val finalScore: Double = 0.0
)

@Serializable
data class Student(
    val name: String,
    val school: String,
    val cls: String,
    val scores: Map<String, Double>
)
