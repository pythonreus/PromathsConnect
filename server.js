import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDatabase from "./config/databaseConfig.js";
import initializeFirebase from "./config/firebaseConfig.js";
import { importPreLoadedCSV } from "./utils/loadUsers.js";
import { importMenteeCSV } from "./utils/loadMentees.js"
import { addApprovedMentorsToPreLoaded } from "./utils/addMentorstoPreloaded.js";


const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDatabase();
    initializeFirebase();
    

     // Import preloaded users CSV
    // try {
    //     //await importPreLoadedCSV();
    //     //await importMenteeCSV();
    //     await addApprovedMentorsToPreLoaded();
    // } catch (err) {
    //     console.error("Failed to import preloaded CSV", err);
    // }

    app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    });
};

startServer();


