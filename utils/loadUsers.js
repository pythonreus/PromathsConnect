import fs from "fs";
import path from "path";
import csv from "csv-parser";
import PreLoaded from "../models/preLoaded.js"; // adjust path if needed

 export const importPreLoadedCSV = async () => {
  const results = [];
  const csvPath = path.join(process.cwd(), "preloaded.csv");

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const row of results) {
          const email = row.email.toLowerCase().trim();
          const role = row.role.trim();

          // Upsert into PreLoaded
          await PreLoaded.updateOne(
            { email },
            { email, role },
            { upsert: true }
          );
          console.log(`Processed: ${email} (${role})`);
        }

        console.log("CSV import finished!");
      } catch (err) {
        console.error("Error inserting CSV data:", err);
      }
    });
};


