import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDatabase from "./config/databaseConfig.js";
import initializeFirebase from "./config/firebaseConfig.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDatabase();
    initializeFirebase();

    app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    });
};

startServer();
