import mongoose from "mongoose";

const contractSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["mentor", "mentee", "head_mentor", "admin"],
    required: true,
    unique: true // One contract per role
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: "1.0.0"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

const Contract = mongoose.model("Contract", contractSchema);
export default Contract;