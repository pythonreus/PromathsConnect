import mongoose from "mongoose";

const userAgreementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // One agreement per user
  },
  role: {
    type: String,
    enum: ["mentor", "mentee", "head_mentor", "admin"],
    required: true
  },
  isAgreed: {
    type: Boolean,
    default: false
  },
  agreedAt: {
    type: Date
  },
  contractVersion: {
    type: String
  }
}, {
  timestamps: true
});

const UserAgreement = mongoose.model("UserAgreement", userAgreementSchema);
export default UserAgreement;