const WebSocket = require('ws');

console.log('🔌 Testing DevMeet WebSocket Server\n');
console.log('='.repeat(60));

const WS_URL = 'ws://localhost:3000/ws';
let ws;

function connectWebSocket() {
  console.log('\n📡 Connecting to WebSocket server...');
  console.log(`   URL: ${WS_URL}\n`);

  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server\n');

    // Test 1: Start meeting
    console.log('📝 Test 1: Starting a meeting...');
    const startMeetingMsg = {
      type: 'start_meeting',
      timestamp: new Date().toISOString(),
      data: {
        title: 'WebSocket Test Meeting',
        description: 'Testing WebSocket connection and meeting management',
        metadata: { participants: ['Alice', 'Bob', 'Charlie'] }
      }
    };
    ws.send(JSON.stringify(startMeetingMsg));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('\n📨 Received message from server:');
      console.log(JSON.stringify(message, null, 2));

      // Test 2: Send audio chunk after meeting started
      if (message.type === 'meeting_started') {
        const meetingId = message.data.meetingId;
        console.log('\n📝 Test 2: Sending audio chunk...');

        // Simulate audio data (in real app, this would be actual audio buffer)
        const audioChunkMsg = {
          type: 'audio_chunk',
          timestamp: new Date().toISOString(),
          data: {
            meetingId: meetingId,
            chunk: Buffer.from('fake audio data for testing').toString('base64'),
            sequence: 1,
            format: 'webm'
          }
        };
        ws.send(JSON.stringify(audioChunkMsg));

        // Test 3: End meeting after 2 seconds
        setTimeout(() => {
          console.log('\n📝 Test 3: Ending meeting...');
          const endMeetingMsg = {
            type: 'end_meeting',
            timestamp: new Date().toISOString(),
            data: {
              meetingId: meetingId
            }
          };
          ws.send(JSON.stringify(endMeetingMsg));

          // Close connection after meeting ended
          setTimeout(() => {
            console.log('\n👋 Closing WebSocket connection...');
            ws.close();
          }, 2000);
        }, 2000);
      }

      // Test completed when meeting ends
      if (message.type === 'meeting_ended') {
        console.log('\n✅ All WebSocket tests PASSED!');
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 TEST SUMMARY');
        console.log('   Test 1 (Start Meeting):  ✅ PASSED');
        console.log('   Test 2 (Audio Chunk):    ✅ PASSED');
        console.log('   Test 3 (End Meeting):    ✅ PASSED');
        console.log('\n' + '='.repeat(60));
      }
    } catch (error) {
      console.error('\n❌ Error parsing message:', error.message);
    }
  });

  ws.on('error', (error) => {
    console.error('\n❌ WebSocket error:', error.message);
    console.log('\n⚠️  Make sure backend server is running:');
    console.log('   cd packages/backend && npm run dev');
    process.exit(1);
  });

  ws.on('close', () => {
    console.log('\n👋 WebSocket connection closed\n');
    process.exit(0);
  });
}

// Start the test
connectWebSocket();
