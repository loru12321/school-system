package com.loru.schoolsystem.util

object CalculationUtils {
    /**
     * Calculates the performance score based on the legacy system's formula.
     * Formula: 30 + contribution + excRate * 30 + passRate * 30 - lowRate * 20
     */
    fun calculateFinalScore(
        contribution: Double,
        excellentRate: Double,
        passRate: Double,
        lowRate: Double
    ): Double {
        return 30.0 + contribution + (excellentRate * 30.0) + (passRate * 30.0) - (lowRate * 20.0)
    }

    /**
     * Calculates the contribution value.
     * Formula: teacherAvg - gradeAvg
     */
    fun calculateContribution(teacherAvg: Double, gradeAvg: Double): Double {
        return teacherAvg - gradeAvg
    }
    
    /**
     * Formats a rate (0.0 to 1.0) as a percentage string.
     */
    fun formatRate(rate: Double): String {
        return String.format("%.1f%%", rate * 100.0)
    }
}
