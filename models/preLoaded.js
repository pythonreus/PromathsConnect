// models/PreLoaded.js
import mongoose from "mongoose";

const preLoadedSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["admin", "mentor", "head_mentor", "mentee"],
    required: true,
  },
}, {
  timestamps: true
});

const PreLoaded = mongoose.model("PreLoaded", preLoadedSchema);

export default PreLoaded;
