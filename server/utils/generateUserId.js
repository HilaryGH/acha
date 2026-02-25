const User = require('../models/User');

/**
 * Generates a unique user ID in the format "Acha" + 4 digits
 * Format: "Acha" + [4 digits] e.g., "Acha1234"
 */
async function generateUserId(role) {
  const MAX_RETRIES = 10; // Prevent infinite recursion
  const PREFIX = 'Acha';
  
  try {
    // Find the last user with the "Acha" prefix
    const lastUser = await User.findOne({
      userId: { $regex: `^${PREFIX}` }
    })
      .sort({ userId: -1 })
      .select('userId')
      .lean()
      .exec();

    let newNumber;
    if (lastUser && lastUser.userId) {
      // Extract the number part (after "Acha")
      const numberPart = lastUser.userId.substring(PREFIX.length);
      const lastNumber = parseInt(numberPart, 10);
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
        throw new Error(`Maximum user ID limit reached for prefix ${PREFIX} (9999)`);
      }

      // Combine prefix and number
      const userId = PREFIX + numberPart;

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

    throw new Error(`Unable to generate unique user ID after ${MAX_RETRIES} attempts for prefix ${PREFIX}`);
  } catch (error) {
    throw new Error(`Error generating user ID: ${error.message}`);
  }
}

module.exports = generateUserId;
