import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  // Type of feedback
  type: {
    type: String,
    enum: ["suggestion", "complaint", "review", "other"],
    required: [true, "Feedback type is required"]
  },
  
  // Category for better organization
  category: {
    type: String,
    enum: [
      "mentorship", 
      "curriculum", 
      "scheduling", 
      "communication", 
      "technical", 
      "facilities", 
      "staff", 
      "other"
    ],
    default: "other"
  },
  
  // The actual feedback content
  content: {
    type: String,
    required: [true, "Feedback content is required"],
    trim: true,
    maxlength: [2000, "Feedback cannot exceed 2000 characters"]
  },
  
  // Optional title/summary
  title: {
    type: String,
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  
  // Rating (for reviews only)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ["pending", "reviewed", "acknowledged", "resolved", "archived"],
    default: "pending"
  },
  
  // Admin notes (only visible to admins)
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, "Admin notes cannot exceed 1000 characters"]
  },
  
  // Who submitted it - tracked but NEVER displayed
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    select: false
  },
  
  // Anonymous ID for grouping (not displayed)
  anonymousId: {
    type: String,
    select: false
  },
  
  // User role at time of submission (for analytics, not display)
  userRole: {
    type: String,
    enum: ["admin", "mentor", "head_mentor", "mentee", "preloaded"],
    select: false
  },
  
  // Timestamps
  acknowledgedAt: Date,
  resolvedAt: Date,
  reviewedAt: Date,
  
  // Who resolved it (admin ID) - tracked but not displayed
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    select: false
  }

}, {
  timestamps: true
});

// Indexes for better query performance
feedbackSchema.index({ type: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ createdAt: -1 });



// Virtual for anonymous display ID
feedbackSchema.virtual('displayId').get(function() {
  return `FB-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Ensure virtuals are included in JSON
feedbackSchema.set('toJSON', { virtuals: true });
feedbackSchema.set('toObject', { virtuals: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;