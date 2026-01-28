const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/agreements', {
            contractAddress: '0x' + Math.random().toString(16).slice(2, 42),
            landlord: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            tenant: '0xc738e91207e38317f81b74c9d21401b5f6d8976f',
            propertyAddress: 'trichy',
            rentAmount: 1.2,
            securityDeposit: 2.4,
            status: 'Created'
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
