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
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
  },
  faculty: {
    type: String,
    enum: ["Science", "EBE", "Humanities", "CLM", "Health Sciences"],
    required: false, // Set to false initially since it's being added
  },
  hasCompletedProfile: {
    type: Boolean,
    default: false, // Track if user has completed their profile
  }
}, {
  timestamps: true
});

const PreLoaded = mongoose.model("PreLoaded", preLoadedSchema);

export default PreLoaded;