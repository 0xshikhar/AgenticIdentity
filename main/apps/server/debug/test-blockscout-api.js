const axios = require('axios');

// Test addresses
const WALLET_ADDRESS = '0xb4beF264785fd51D80347f578E0245fCcdF3C055';
const API_KEY = 'f5218b64-fed1-4bad-8246-df760bad1b86'; // Your API key

async function testBlockscoutApi() {
    try {
        console.log('Testing Blockscout API...');
        
        // Format URL like in your curl example
        const url = `https://rootstock-testnet.blockscout.com/api?module=account&action=txlist&address=${WALLET_ADDRESS}&startblock=0&endblock=99999999&apikey=${API_KEY}`;
        
        console.log(`Sending request to: ${url}`);
        const response = await axios.get(url, { timeout: 10000 });
        
        console.log('\nResponse status:', response.status);
        console.log('API status:', response.data.status);
        console.log('Message:', response.data.message);
        console.log(`Found ${response.data.result.length} transactions`);
        
        if (response.data.result.length > 0) {
            console.log('\nFirst transaction:');
            console.log(JSON.stringify(response.data.result[0], null, 2));
        }
        
        console.log('\n✅ Blockscout API test successful!');
    } catch (error) {
        console.error('\n❌ Blockscout API test failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testBlockscoutApi(); 