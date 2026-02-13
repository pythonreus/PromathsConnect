import fs from "fs";
import path from "path";
import csv from "csv-parser";
import PreLoaded from "../models/preLoaded.js"; // adjust path if needed

 export const importMenteeCSV = async () => {
  const results = [];
  const csvPath = path.join(process.cwd(), "data.csv");

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const row of results) {
          const email = row.Email.toLowerCase().trim();
          const role = "mentee";
          const gender = "female";

          // Upsert into PreLoaded
          await PreLoaded.updateOne(
            { email },
            { email, role, gender },
            { upsert: true }
          );
          console.log(`Processed: ${email} (${role}, ${gender})`);
        }

        console.log("CSV import finished!");
      } catch (err) {
        console.error("Error inserting CSV data:", err);
      }
    });
};


