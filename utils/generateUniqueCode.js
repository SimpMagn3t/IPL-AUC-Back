// utils/generateUniqueCode.js

const generateUniqueCode = (existingCodes) => {
    let code;
    // Loop until a unique code is found
    do {
        code = Math.floor(10000 + Math.random() * 90000).toString(); // Generate a 5-digit code
    } while (existingCodes.has(code)); // Ensure the code is unique
    existingCodes.add(code); // Add the code to the set to track it
    return code;
};

module.exports = generateUniqueCode;
