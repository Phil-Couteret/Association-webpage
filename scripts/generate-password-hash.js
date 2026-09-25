/**
 * Password Hash Generator (Node.js)
 * Generates bcrypt hashes compatible with PHP's password_verify()
 *
 * Usage:
 * 1. Edit the PASSWORD variable below with your desired password
 * 2. Run: npm run generate-hash
 * 3. Copy the hash and use it in your SQL UPDATE
 * 4. Clear the password from this file after use (security)
 */

import bcrypt from 'bcryptjs';

// Change this to your desired password
const PASSWORD = 'password';

const hash = bcrypt.hashSync(PASSWORD, 10);

console.log('Password Hash Generator');
console.log('=======================\n');
console.log('Password:', PASSWORD);
console.log('Hash:', hash);
console.log('\nCopy this hash and use it in your SQL UPDATE statement:');
console.log("UPDATE admin_users SET password_hash = '" + hash + "' WHERE email = 'tech@elektr-ame.com';");
console.log('\nThen clear the password from this file for security!');
