async function test() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@puces.edu.ec', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Login successful, token received.');

        // 2. Import Schedule
        console.log('Importing schedule...');
        const importRes = await fetch('http://localhost:3000/admin/import-schedule', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!importRes.ok) {
            const text = await importRes.text();
            throw new Error(`Import failed: ${importRes.statusText} - ${text}`);
        }
        console.log('Import successful.');

        // 3. Get Dashboard
        console.log('Fetching dashboard...');
        const dashRes = await fetch('http://localhost:3000/admin/dashboard', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!dashRes.ok) throw new Error(`Dashboard failed: ${dashRes.statusText}`);
        const dashData = await dashRes.json();
        console.log('Dashboard Data (First 3 items):');
        console.log(JSON.stringify(dashData.slice(0, 3), null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
