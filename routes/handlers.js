const axios = require("axios");
const adminKey = process.env.ADMIN_KEY;
const appUrl = process.env.APP_URL || "http://localhost:3000";

const resetDatabase = async () => {
  try {
    const response = await axios.delete(`${appUrl}/secret/reset-database`, {
      headers: {
        "Admin-Key": adminKey,
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to reset the database.");
    }
  } catch (error) {
    throw error;
  }
};

module.exports = resetDatabase;
