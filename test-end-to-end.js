const Anthropic = require('@anthropic-ai/sdk');
const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config({ path: '.env' });

console.log('🎯 DevMeet AI - End-to-End Integration Test\n');
console.log('='.repeat(70));
console.log('\nThis test validates the complete DevMeet AI workflow:');
console.log('  1. Backend REST API');
console.log('  2. WebSocket real-time communication');
console.log('  3. Claude AI meeting analysis');
console.log('  4. Database integration (Supabase)\n');
console.log('='.repeat(70));

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws';

let testResults = {
  backend: false,
  database: false,
  websocket: false,
  claude: false,
};

// Test 1: Backend Health Check
async function testBackendHealth() {
  console.log('\n\n📡 TEST 1: Backend Health Check');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend is running');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Uptime: ${Math.floor(response.data.uptime)}s`);
    testResults.backend = true;
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    console.error('\n⚠️  Make sure backend is running: npm run dev:backend');
    return false;
  }
}

// Test 2: Database Operations (CRUD)
async function testDatabase() {
  console.log('\n\n💾 TEST 2: Database Operations (Supabase)');
  console.log('-'.repeat(70));

  try {
    // Create a meeting
    console.log('\n   Creating test meeting...');
    const createResponse = await axios.post(`${BASE_URL}/api/v1/meetings`, {
      title: 'E2E Test Meeting',
      description: 'Testing database CRUD operations',
    });

    const meetingId = createResponse.data.data.id;
    console.log(`✅ Meeting created: ID ${meetingId}`);

    // Retrieve the meeting
    console.log('   Retrieving meeting...');
    const getResponse = await axios.get(`${BASE_URL}/api/v1/meetings/${meetingId}`);
    console.log(`✅ Meeting retrieved: "${getResponse.data.data.title}"`);

    // Update the meeting
    console.log('   Updating meeting...');
    await axios.patch(`${BASE_URL}/api/v1/meetings/${meetingId}`, {
      description: 'Updated description for E2E test',
    });
    console.log('✅ Meeting updated');

    // End the meeting
    console.log('   Ending meeting...');
    await axios.post(`${BASE_URL}/api/v1/meetings/${meetingId}/end`);
    console.log('✅ Meeting ended');

    // Delete the meeting
    console.log('   Deleting meeting...');
    await axios.delete(`${BASE_URL}/api/v1/meetings/${meetingId}`);
    console.log('✅ Meeting deleted');

    console.log('\n✅ All database operations PASSED');
    testResults.database = true;
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: WebSocket Communication
function testWebSocket() {
  return new Promise((resolve) => {
    console.log('\n\n🔌 TEST 3: WebSocket Real-time Communication');
    console.log('-'.repeat(70));

    const ws = new WebSocket(WS_URL);
    let meetingId;

    ws.on('open', () => {
      console.log('\n   Connected to WebSocket server');

      // Start meeting
      console.log('   Starting meeting via WebSocket...');
      ws.send(JSON.stringify({
        type: 'start_meeting',
        timestamp: new Date().toISOString(),
        data: {
          title: 'WebSocket E2E Test',
          description: 'Testing real-time communication',
          metadata: { test: true }
        }
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'meeting_started') {
        meetingId = message.data.meetingId;
        console.log(`✅ Meeting started: ID ${meetingId}`);

        // Send audio chunk
        console.log('   Sending audio chunk...');
        ws.send(JSON.stringify({
          type: 'audio_chunk',
          timestamp: new Date().toISOString(),
          data: {
            meetingId,
            chunk: Buffer.from('test audio data').toString('base64'),
            sequence: 1,
            format: 'webm'
          }
        }));

        // End meeting
        setTimeout(() => {
          console.log('   Ending meeting...');
          ws.send(JSON.stringify({
            type: 'end_meeting',
            timestamp: new Date().toISOString(),
            data: { meetingId }
          }));
        }, 500);
      }

      if (message.type === 'meeting_ended') {
        console.log(`✅ Meeting ended: ${meetingId}`);
        console.log(`   Duration: ${message.data.duration}s`);
        console.log('\n✅ WebSocket communication PASSED');
        testResults.websocket = true;
        ws.close();
        resolve(true);
      }

      if (message.type === 'error') {
        console.error('❌ WebSocket error:', message.data);
        ws.close();
        resolve(false);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      resolve(false);
    });
  });
}

// Test 4: Claude AI Analysis
async function testClaudeAI() {
  console.log('\n\n🤖 TEST 4: Claude AI Meeting Analysis');
  console.log('-'.repeat(70));

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const mockTranscript = `
[10:00] Alice: We need to implement user authentication for the new API.
[10:01] Bob: I suggest we use JWT tokens with a 7-day expiration.
[10:02] Alice: Agreed. Bob, can you handle the JWT implementation by Friday?
[10:03] Bob: Sure, I'll get it done.
[10:04] Alice: I'll work on the database schema for user sessions.
[10:05] Bob: Let's also add rate limiting to prevent abuse.
[10:06] Alice: Good idea. We should use Redis for session storage.
`;

  try {
    console.log('\n   Analyzing meeting transcript with Claude...');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Analyze this meeting transcript and extract:

1. **Summary** (2-3 sentences)
2. **Action Items** with assignees and priorities
3. **Technical Decisions** made
4. **Technologies** mentioned

Transcript:
${mockTranscript}

Respond in JSON format:
{
  "summary": "...",
  "actionItems": [{"description": "...", "assignedTo": "...", "priority": "medium"}],
  "decisions": ["..."],
  "technologies": ["..."]
}`
      }],
    });

    const result = JSON.parse(response.content[0].text);

    console.log('\n✅ Claude Analysis Results:\n');
    console.log('   Summary:', result.summary);
    console.log('\n   Action Items:');
    result.actionItems.forEach((item, i) => {
      console.log(`     ${i + 1}. [${item.priority.toUpperCase()}] ${item.description}`);
      console.log(`        Assigned to: ${item.assignedTo || 'Unassigned'}`);
    });
    console.log('\n   Technical Decisions:');
    result.decisions.forEach((decision, i) => {
      console.log(`     ${i + 1}. ${decision}`);
    });
    console.log('\n   Technologies Mentioned:');
    console.log(`     ${result.technologies.join(', ')}`);

    console.log('\n✅ Claude AI analysis PASSED');
    testResults.claude = true;
    return true;
  } catch (error) {
    console.error('❌ Claude AI test failed:', error.message);
    if (error.message.includes('credit balance')) {
      console.error('   ⚠️  Claude API credits are low. Please recharge at:');
      console.error('      https://console.anthropic.com/');
    }
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n\n🚀 Starting End-to-End Integration Tests...\n');

  const test1 = await testBackendHealth();
  if (!test1) {
    console.log('\n❌ Backend is not running. Aborting tests.');
    process.exit(1);
  }

  const test2 = await testDatabase();
  const test3 = await testWebSocket();
  const test4 = await testClaudeAI();

  // Print final summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n   1. Backend Health:        ${testResults.backend ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   2. Database (Supabase):    ${testResults.database ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   3. WebSocket:              ${testResults.websocket ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   4. Claude AI:              ${testResults.claude ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = Object.values(testResults).every(result => result === true);

  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! DevMeet AI is fully operational.\n');
    console.log('✨ Ready for Milestone 2: Desktop App Development\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

runAllTests();
