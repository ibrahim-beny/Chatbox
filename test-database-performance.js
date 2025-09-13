/**
 * Performance test voor MVP-005 Database Implementatie
 * Test search performance <200ms requirement
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const TEST_QUERIES = [
    'web development',
    'prijzen',
    'ondersteuning',
    'React',
    'Node.js',
    'packages',
    'tarieven',
    'services',
    'diensten',
    'support'
];

async function makeRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: JSON.parse(data),
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function testSearchPerformance() {
    console.log('🚀 Starting MVP-005 Database Performance Tests...\n');
    
    const results = [];
    let totalTime = 0;
    let successCount = 0;
    
    for (const query of TEST_QUERIES) {
        const startTime = Date.now();
        
        try {
            const response = await makeRequest(
                `${API_BASE}/knowledge/search?q=${encodeURIComponent(query)}&limit=5`,
                { 'X-Tenant-ID': 'demo-tenant' }
            );
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            if (response.statusCode === 200) {
                successCount++;
                totalTime += responseTime;
                
                const result = {
                    query,
                    responseTime,
                    success: true,
                    resultCount: response.data.results?.length || 0,
                    totalFound: response.data.totalFound || 0
                };
                
                results.push(result);
                
                const status = responseTime < 200 ? '✅' : '⚠️';
                console.log(`${status} Query: "${query}" - ${responseTime}ms (${result.resultCount} results)`);
            } else {
                results.push({
                    query,
                    responseTime: endTime - startTime,
                    success: false,
                    error: `HTTP ${response.statusCode}`
                });
                console.log(`❌ Query: "${query}" - HTTP ${response.statusCode}`);
            }
            
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.push({
                query,
                responseTime,
                success: false,
                error: error.message
            });
            console.log(`❌ Query: "${query}" - ${error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate statistics
    const avgResponseTime = successCount > 0 ? totalTime / successCount : 0;
    const maxResponseTime = Math.max(...results.filter(r => r.success).map(r => r.responseTime));
    const minResponseTime = Math.min(...results.filter(r => r.success).map(r => r.responseTime));
    const under200ms = results.filter(r => r.success && r.responseTime < 200).length;
    const successRate = (successCount / TEST_QUERIES.length) * 100;
    
    console.log('\n📊 Performance Test Results:');
    console.log('============================');
    console.log(`Total Queries: ${TEST_QUERIES.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
    console.log(`Min Response Time: ${minResponseTime}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    console.log(`Queries under 200ms: ${under200ms}/${successCount}`);
    
    // Check MVP-005 requirements
    console.log('\n🎯 MVP-005 Requirements Check:');
    console.log('==============================');
    
    const requirementMet = avgResponseTime < 200 && successRate >= 95;
    console.log(`✅ Search <200ms: ${avgResponseTime < 200 ? 'PASS' : 'FAIL'} (${avgResponseTime.toFixed(1)}ms)`);
    console.log(`✅ Success Rate ≥95%: ${successRate >= 95 ? 'PASS' : 'FAIL'} (${successRate.toFixed(1)}%)`);
    console.log(`✅ Overall MVP-005: ${requirementMet ? 'PASS' : 'FAIL'}`);
    
    if (requirementMet) {
        console.log('\n🎉 MVP-005 Database Performance Requirements MET!');
    } else {
        console.log('\n⚠️  MVP-005 Database Performance Requirements NOT MET');
        console.log('Consider database optimization or indexing improvements');
    }
    
    return results;
}

async function testDatabaseEndpoints() {
    console.log('\n🔍 Testing Database Endpoints...\n');
    
    const endpoints = [
        { name: 'Health Check', url: `${API_BASE}/health` },
        { name: 'Tenant Config', url: `${API_BASE}/tenant/demo-tenant/config` },
        { name: 'Knowledge Stats', url: `${API_BASE}/knowledge/status/stats`, headers: { 'X-Tenant-ID': 'demo-tenant' } }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            const response = await makeRequest(endpoint.url, endpoint.headers || {});
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            if (response.statusCode === 200) {
                console.log(`✅ ${endpoint.name}: ${responseTime}ms`);
            } else {
                console.log(`❌ ${endpoint.name}: HTTP ${response.statusCode}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
        }
    }
}

async function runAllTests() {
    try {
        await testDatabaseEndpoints();
        await testSearchPerformance();
        
        console.log('\n🏁 All MVP-005 Database Tests Completed!');
        console.log('📋 Next steps:');
        console.log('1. Open admin.html in browser for admin interface');
        console.log('2. Test document upload and management');
        console.log('3. Verify tenant isolation');
        console.log('4. Test with demo/index.html for end-to-end validation');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests
runAllTests();
