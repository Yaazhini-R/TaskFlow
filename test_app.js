// test_app.js - Automated tests for TaskFlow REST API and Database persistence
const http = require('http');
const app = require('./server');

const PORT = 3001; // test port
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}...`);
  try {
    await runTests();
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  // Test 1: Frontend root returns HTML
  console.log('Test 1: GET / (serves HTML frontend)');
  const homeRes = await request('GET', '/');
  if (homeRes.status !== 200 || typeof homeRes.data !== 'string' || !homeRes.data.includes('TaskFlow')) {
    throw new Error(`Failed to load index.html: status ${homeRes.status}`);
  }
  console.log('  -> Frontend loaded successfully.');

  // Test 2: GET /api/tasks
  console.log('Test 2: GET /api/tasks');
  const tasksRes = await request('GET', '/api/tasks');
  if (tasksRes.status !== 200 || !tasksRes.data.success || !Array.isArray(tasksRes.data.data)) {
    throw new Error('Failed to get tasks list');
  }
  const initialCount = tasksRes.data.data.length;
  console.log(`  -> Initial tasks count: ${initialCount}`);

  // Test 3: POST /api/tasks (Create a new task)
  console.log('Test 3: POST /api/tasks (Create task)');
  const createRes = await request('POST', '/api/tasks', {
    title: 'Study Data Structures & Algorithms',
    description: 'Solve binary tree and graph traversal problems on LeetCode'
  });
  if (createRes.status !== 201 || !createRes.data.success || !createRes.data.data.id) {
    throw new Error('Failed to create task');
  }
  const newTaskId = createRes.data.data.id;
  console.log(`  -> Task created with ID ${newTaskId}: "${createRes.data.data.title}"`);

  // Test 4: Validation - POST without title
  console.log('Test 4: POST /api/tasks validation (empty title should fail with 400)');
  const badCreate = await request('POST', '/api/tasks', { title: '   ' });
  if (badCreate.status !== 400 || badCreate.data.success !== false) {
    throw new Error('Validation failed: expected 400 Bad Request');
  }
  console.log('  -> Validation correctly rejected empty title.');

  // Test 5: GET /api/tasks/:id
  console.log(`Test 5: GET /api/tasks/${newTaskId}`);
  const getOne = await request('GET', `/api/tasks/${newTaskId}`);
  if (getOne.status !== 200 || getOne.data.data.title !== 'Study Data Structures & Algorithms') {
    throw new Error('Failed to fetch specific task by ID');
  }
  console.log('  -> Task retrieved correctly.');

  // Test 6: PATCH /api/tasks/:id/toggle (Mark as completed)
  console.log(`Test 6: PATCH /api/tasks/${newTaskId}/toggle (Toggle status)`);
  const toggleRes = await request('PATCH', `/api/tasks/${newTaskId}/toggle`);
  if (toggleRes.status !== 200 || toggleRes.data.data.completed !== 1) {
    throw new Error('Toggle failed: expected completed = 1');
  }
  console.log('  -> Task successfully marked completed (1).');

  // Test 7: PUT /api/tasks/:id (Edit existing task)
  console.log(`Test 7: PUT /api/tasks/${newTaskId} (Edit task)`);
  const editRes = await request('PUT', `/api/tasks/${newTaskId}`, {
    title: 'Master Graph Algorithms & Dynamic Programming',
    description: 'Updated comprehensive roadmap for tech interviews'
  });
  if (editRes.status !== 200 || editRes.data.data.title !== 'Master Graph Algorithms & Dynamic Programming') {
    throw new Error('Edit failed: title not updated');
  }
  console.log('  -> Task edited successfully.');

  // Test 8: Filter tasks by completed
  console.log('Test 8: GET /api/tasks?filter=completed');
  const filterCompleted = await request('GET', '/api/tasks?filter=completed');
  if (filterCompleted.status !== 200 || !filterCompleted.data.data.some(t => t.id === newTaskId)) {
    throw new Error('Filter completed failed');
  }
  console.log('  -> Filter completed returned correct tasks.');

  // Test 9: GET /api/stats
  console.log('Test 9: GET /api/stats');
  const statsRes = await request('GET', '/api/stats');
  if (statsRes.status !== 200 || typeof statsRes.data.data.total !== 'number') {
    throw new Error('Failed to fetch stats');
  }
  console.log(`  -> Stats: Total = ${statsRes.data.data.total}, Pending = ${statsRes.data.data.pending}, Completed = ${statsRes.data.data.completed}`);

  // Test 10: DELETE /api/tasks/:id
  console.log(`Test 10: DELETE /api/tasks/${newTaskId}`);
  const deleteRes = await request('DELETE', `/api/tasks/${newTaskId}`);
  if (deleteRes.status !== 200 || !deleteRes.data.success) {
    throw new Error('Failed to delete task');
  }
  console.log('  -> Task deleted successfully.');

  // Verify it is gone
  const verifyDelete = await request('GET', `/api/tasks/${newTaskId}`);
  if (verifyDelete.status !== 404) {
    throw new Error('Deleted task still found');
  }
  console.log('  -> Verified task no longer exists.');
}
