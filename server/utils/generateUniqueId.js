/**
 * Generates a unique random 4-digit ID for a given model
 * @param {Object} Model - Mongoose model constructor
 * @returns {Promise<string>} - Unique random 4-digit ID (1000-9999)
 */
async function generateUniqueId(Model) {
  try {
    const maxAttempts = 100; // Maximum attempts to find a unique ID
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Generate a random 4-digit number between 1000 and 9999
      const randomId = Math.floor(Math.random() * 9000) + 1000; // 1000 to 9999
      const uniqueId = randomId.toString();

      // Check if this ID already exists
      const existingDoc = await Model.findOne({
        uniqueId: uniqueId
      })
        .select('uniqueId')
        .lean()
        .exec();

      // If ID doesn't exist, return it
      if (!existingDoc) {
        return uniqueId;
      }

      attempts++;
    }

    // If we couldn't find a unique ID after max attempts, throw an error
    throw new Error(`Unable to generate unique ID after ${maxAttempts} attempts. Please try again.`);
  } catch (error) {
    throw new Error(`Error generating unique ID: ${error.message}`);
  }
}

module.exports = generateUniqueId;

