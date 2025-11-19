/**
 * API Performance Test Script
 * 
 * This script helps test API performance by making requests and measuring response times.
 * Run with: npx tsx scripts/test-api-performance.ts
 */

// Note: This is a template. You'll need to provide actual quizId and teacherId values.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  error?: string;
}

async function testEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));

    return {
      endpoint,
      method,
      duration,
      status: response.status,
      success: response.ok,
      error: response.ok ? undefined : data.error || 'Unknown error',
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      endpoint,
      method,
      duration,
      status: 0,
      success: false,
      error: error.message || 'Network error',
    };
  }
}

async function runPerformanceTests() {
  console.log('\n🚀 API Performance Test Suite\n');
  console.log('=' .repeat(60));
  
  // You'll need to replace these with actual IDs from your database
  const QUIZ_ID = 'YOUR_QUIZ_ID_HERE';
  const TEACHER_ID = 'YOUR_TEACHER_ID_HERE';

  const tests: Array<{ name: string; endpoint: string; method: string; body?: any }> = [
    {
      name: 'Get Teacher Quizzes',
      endpoint: `/api/teacher/quizzes?teacherId=${TEACHER_ID}`,
      method: 'GET',
    },
    {
      name: 'Get Quiz Questions',
      endpoint: `/api/teacher/quiz/${QUIZ_ID}/questions`,
      method: 'GET',
    },
    {
      name: 'Create Single Question',
      endpoint: `/api/teacher/quiz/${QUIZ_ID}/questions`,
      method: 'POST',
      body: {
        text: 'Test question?',
        type: 'SINGLE_CHOICE',
        options: [
          { text: 'Option 1', isCorrect: true },
          { text: 'Option 2', isCorrect: false },
          { text: 'Option 3', isCorrect: false },
          { text: 'Option 4', isCorrect: false },
        ],
      },
    },
    {
      name: 'Batch Create Questions (10 questions)',
      endpoint: `/api/teacher/quiz/${QUIZ_ID}/questions`,
      method: 'POST',
      body: {
        questions: Array.from({ length: 10 }, (_, i) => ({
          text: `Batch test question ${i + 1}?`,
          type: 'SINGLE_CHOICE',
          options: [
            { text: 'Option 1', isCorrect: true },
            { text: 'Option 2', isCorrect: false },
            { text: 'Option 3', isCorrect: false },
            { text: 'Option 4', isCorrect: false },
          ],
        })),
      },
    },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`\n📊 Testing: ${test.name}`);
    const result = await testEndpoint(test.endpoint, test.method, test.body);
    results.push(result);

    if (result.success) {
      const status = result.duration < 200 ? '✅' : result.duration < 500 ? '⚠️' : '❌';
      console.log(`   ${status} ${result.duration}ms - Status: ${result.status}`);
    } else {
      console.log(`   ❌ Failed - ${result.error}`);
    }

    // Wait a bit between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Performance Summary\n');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const minDuration = Math.min(...successful.map((r) => r.duration));
    const maxDuration = Math.max(...successful.map((r) => r.duration));

    console.log(`✅ Successful requests: ${successful.length}/${results.length}`);
    console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Min: ${minDuration}ms`);
    console.log(`   Max: ${maxDuration}ms`);
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed requests: ${failed.length}`);
    failed.forEach((r) => {
      console.log(`   ${r.endpoint}: ${r.error}`);
    });
  }

  // Performance benchmarks
  console.log('\n📊 Performance Benchmarks:');
  console.log('   ✅ Excellent: < 200ms');
  console.log('   ⚠️  Good: 200-500ms');
  console.log('   ⚠️  Acceptable: 500-1000ms');
  console.log('   ❌ Needs improvement: > 1000ms');

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run if executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

export { runPerformanceTests, testEndpoint };

