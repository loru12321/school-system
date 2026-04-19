
// Mock environment
window = {
    COHORT_DB: {
        exams: {
            "2023_test_1": {
                examId: "2023_test_1",
                examLabel: "期中考试",
                data: [{ name: "Student A", total: 90 }]
            },
            "2022_test_1": {
                examId: "2022_test_1",
                examLabel: "期中考试",
                data: [{ name: "Student B", total: 80 }]
            }
        }
    },
    CloudManager: {
        fetchCohortExamsToLocal: async (cid) => {
            console.log(`Mock: Fetching cohort ${cid}`);
            return { success: true };
        }
    }
};

// Import the engine (assuming it's loaded)
// For this script, we just paste the relevant private function for testing if needed, 
// or run it in a proper environment.

async function test() {
    console.log("Testing comparison-engine-v2 fix...");

    // Test _getCohortExamData (Private but we can test via compareCohorts)
    try {
        const result = await ComparisonEngineV2.compareCohorts("2023级", "2022级", "期中");
        console.log("Result:", JSON.stringify(result, null, 2));

        if (result && result.comparison.avgScore["2023级"] === 90 && result.comparison.avgScore["2022级"] === 80) {
            console.log("✅ Fix verified successfully!");
        } else {
            console.log("❌ Fix verification failed!");
        }
    } catch (e) {
        console.error("Test error:", e);
    }
}

// test();
