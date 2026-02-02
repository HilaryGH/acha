const crypto = require('crypto');

/**
 * Generate secure random codes for role creation
 * Run this script to generate secure codes for your .env file
 * Usage: node server/utils/generateSecureCodes.js
 */

const generateSecureCode = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

console.log('\n🔐 Secure Role Creation Codes\n');
console.log('Copy these codes to your .env file:\n');
console.log('SUPER_ADMIN_CODE=' + generateSecureCode());
console.log('ADMIN_CODE=' + generateSecureCode());
console.log('CUSTOMER_SUPPORT_CODE=' + generateSecureCode());
console.log('\n⚠️  Keep these codes secure and never commit them to version control!\n');
console.log('💡 Tip: Use different codes for development and production environments.\n');



























