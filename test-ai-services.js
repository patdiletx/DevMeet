const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env' });

console.log('🧪 Testing DevMeet AI Services Integration\n');
console.log('=' .repeat(60));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testClaudeAnalysis() {
  console.log('\n📝 Test 1: Claude Meeting Analysis\n');

  const mockTranscript = `
[2025-10-03 10:00] John: Hey team, let's discuss the new authentication feature.
[2025-10-03 10:01] Sarah: I think we should use JWT tokens for the API.
[2025-10-03 10:02] Mike: Agreed. We also need to implement rate limiting.
[2025-10-03 10:03] John: Sarah, can you handle the JWT implementation by Friday?
[2025-10-03 10:04] Sarah: Sure, I'll get it done.
[2025-10-03 10:05] Mike: I'll work on the rate limiting middleware.
[2025-10-03 10:06] John: Great! Let's also add Redis for session storage.
`;

  try {
    console.log('   Sending transcript to Claude for analysis...');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Analyze this technical meeting transcript and extract:
1. Summary (2-3 sentences)
2. Action items with assignees
3. Key technical decisions

Transcript:
${mockTranscript}

Respond in JSON format:
{
  "summary": "...",
  "actionItems": [
    {"description": "...", "assignedTo": "...", "priority": "medium|high"}
  ],
  "decisions": ["..."]
}`
      }],
    });

    const result = response.content[0].text;
    console.log('\n✅ Claude Analysis Result:\n');
    console.log(result);
    console.log('\n✅ Test 1 PASSED\n');

    return { success: true, result };

  } catch (error) {
    console.error('\n❌ Test 1 FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function testActionItemDetection() {
  console.log('\n📋 Test 2: Action Item Detection\n');

  const mockText = `
We need to update the documentation for the new API endpoints.
John will review the code tomorrow.
Sarah should fix the bug in the user service by end of week.
`;

  try {
    console.log('   Detecting action items with Claude...');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Extract action items from this text. Return JSON array:
${mockText}

Format: [{"description": "...", "assignedTo": "...", "priority": "low|medium|high"}]`
      }],
    });

    const result = response.content[0].text;
    console.log('\n✅ Detected Action Items:\n');
    console.log(result);
    console.log('\n✅ Test 2 PASSED\n');

    return { success: true };

  } catch (error) {
    console.error('\n❌ Test 2 FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\nRunning all AI service tests...\n');

  const results = {
    test1: await testClaudeAnalysis(),
    test2: await testActionItemDetection(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log('   Test 1 (Meeting Analysis):', results.test1.success ? '✅ PASSED' : '❌ FAILED');
  console.log('   Test 2 (Action Items):    ', results.test2.success ? '✅ PASSED' : '❌ FAILED');

  const allPassed = results.test1.success && results.test2.success;

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Claude API is working perfectly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.\n');
    process.exit(1);
  }
}

runAllTests();
