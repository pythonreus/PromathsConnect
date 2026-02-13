import mongoose from "mongoose";

const communicationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [500, "Summary cannot exceed 500 characters"]
  },
  type: {
    type: String,
    enum: ["announcement", "reminder", "alert", "newsletter", "other"],
    default: "announcement"
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },
  status: {
    type: String,
    enum: ["draft", "published", "archived", "scheduled"],
    default: "published"
  },
  audience: {
    type: {
      type: String,
      enum: ["all", "specific_roles", "specific_users"],
      required: true
    },
    roles: [{
      type: String,
      enum: ["admin", "mentor", "head_mentor", "mentee"]
    }],
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    excludeUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  publishedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  views: {
    type: Number,
    default: 0
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
communicationSchema.index({ status: 1, publishedAt: -1 });
communicationSchema.index({ createdBy: 1, createdAt: -1 });
communicationSchema.index({ "audience.roles": 1 });
communicationSchema.index({ scheduledFor: 1 }, { sparse: true });

const Communication = mongoose.model("Communication", communicationSchema);

export default Communication;