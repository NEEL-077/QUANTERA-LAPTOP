require('dotenv').config();
const { verifyConnection } = require('./services/email/emailConfig.js');

async function test() {
    await verifyConnection();
    process.exit(0);
}

test();
