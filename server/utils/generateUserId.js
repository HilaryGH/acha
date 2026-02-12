const User = require('../models/User');

/**
 * Maps role to display name for ID generation
 * Returns the appropriate word to extract 3 letters from
 */
function getRolePrefix(role) {
  const roleMap = {
    'super_admin': 'admin', // "Super Admin" -> use "admin"
    'admin': 'admin', // "Admin" -> use "admin"
    'marketing_team': 'team', // "Marketing Team" -> use "team"
    'customer_support': 'support', // "Customer Support" -> use "support"
    'individual': 'individual', // "Individual" -> use "individual"
    'delivery_partner': 'partner', // "Delivery Partner" -> use "partner"
    'acha_sisters_delivery_partner': 'sisters', // "Acha Sisters Delivery Partner" -> skip "Acha", use "sisters"
    'movers_packers': 'movers', // "Acha Movers & Packers" -> skip "Acha", use "movers"
    'gift_delivery_partner': 'gifting' // "Wanaw Gifting Delivery Partner" -> use "gifting"
  };

  return roleMap[role] || 'user';
}

/**
 * Extracts 3 letters from a word
 */
function extractThreeLetters(word) {
  if (!word || word.length === 0) return 'usr';
  
  // Take first 3 letters, convert to lowercase
  const letters = word.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
  
  // If less than 3 letters, pad with 'x'
  return letters.padEnd(3, 'x');
}

/**
 * Generates a unique 4-digit ID for a given role
 * Format: [3 letters][4 digits] e.g., "sur3456"
 */
async function generateUserId(role) {
  const MAX_RETRIES = 10; // Prevent infinite recursion
  
  try {
    // Get the prefix word for the role
    const prefixWord = getRolePrefix(role);
    
    // Extract 3 letters from the prefix word
    const prefix = extractThreeLetters(prefixWord);
    
    // Find the last user with the same prefix
    const lastUser = await User.findOne({
      userId: { $regex: `^${prefix}` }
    })
      .sort({ userId: -1 })
      .select('userId')
      .lean()
      .exec();

    let newNumber;
    if (lastUser && lastUser.userId) {
      // Extract the number part (last 4 digits)
      const lastNumber = parseInt(lastUser.userId.substring(3), 10);
      if (isNaN(lastNumber)) {
        // If parsing fails, start from 1
        newNumber = 1;
      } else {
        newNumber = lastNumber + 1;
      }
    } else {
      // Start from 0001 if no user with this prefix exists
      newNumber = 1;
    }

    // Try to find a unique ID, incrementing if needed
    let retryCount = 0;
    while (retryCount < MAX_RETRIES) {
      // Ensure it's 4 digits with leading zeros
      const numberPart = newNumber.toString().padStart(4, '0');

      // If we've reached 9999, throw an error
      if (newNumber > 9999) {
        throw new Error(`Maximum user ID limit reached for prefix ${prefix} (9999)`);
      }

      // Combine prefix and number
      const userId = prefix + numberPart;

      // Check uniqueness (in case of race condition)
      const existingUser = await User.findOne({ userId });
      if (!existingUser) {
        // Found a unique ID
        return userId;
      }

      // ID exists, increment and try again
      newNumber++;
      retryCount++;
    }

    throw new Error(`Unable to generate unique user ID after ${MAX_RETRIES} attempts for prefix ${prefix}`);
  } catch (error) {
    throw new Error(`Error generating user ID: ${error.message}`);
  }
}

module.exports = generateUserId;
