// controllers/communicationController.js
import Communication from "../models/Communication.js";
import User from "../models/users.js";
import PreLoaded from "../models/preLoaded.js";
import { sendBulkEmails as sendBulkEmailService } from "../services/emailService.js";


// ============ BACKGROUND EMAIL HELPER ============
/**
 * Send email in background (called from createCommunication)
 * This is a separate function that doesn't need req/res
 */
// In sendEmailInBackground function
async function sendEmailInBackground(communication, user) {
  try {
    console.log(`📧 Sending emails in background for: ${communication.title}`);
    
    const targetUsers = await getTargetUsers(communication.audience);
    
    if (targetUsers.length === 0) {
      console.log('⚠️ No recipients found');
      return;
    }

    // FIXED: Pass Gmail-friendly options
    const emailResults = await sendBulkEmailService(targetUsers, communication, {
      batchSize: 100,           // Gmail's limit: 100 recipients per email
      delayBetweenBatches: 30000 // 30 seconds between batches
    });
    
    communication.emailSent = true;
    communication.emailSentAt = new Date();
    await communication.save();
    
    const emailsSent = Math.ceil(targetUsers.length / 100);
    console.log(`✅ Successfully sent to ${emailResults.successful.length} recipients using ${emailsSent} email(s) via BCC`);
  } catch (error) {
    console.error("❌ Background email failed:", error);
  }
}

/**
 * GET /api/communications
 * Get all communications with pagination, search, and filters
 */
// export const getCommunications = async (req, res) => {
//   try {
//     const page = Math.max(parseInt(req.query.page) || 1, 1);
//     const limit = Math.min(parseInt(req.query.limit) || 10, 50);
//     const skip = (page - 1) * limit;
//     const search = req.query.search || "";
//     const status = req.query.status;
//     const priority = req.query.priority;
//     const type = req.query.type;
//     const audience = req.query.audience;

//     // Build query
//     let query = {};

//     // Only show published communications to non-admins
//     if (req.user?.role !== "admin") {
//       query.status = "published";
//     }

//     // Search
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { content: { $regex: search, $options: "i" } },
//         { summary: { $regex: search, $options: "i" } }
//       ];
//     }

//     // Filters
//     if (status) query.status = status;
//     if (priority) query.priority = priority;
//     if (type) query.type = type;
//     if (audience) query["audience.type"] = audience;

//     // Get total count
//     const total = await Communication.countDocuments(query);

//     // Get communications
//     const communications = await Communication.find(query)
//       .populate("createdBy", "fullName email")
//       .populate("updatedBy", "fullName email")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     // Enhance with read status for the current user
//     const enhancedComms = communications.map(comm => ({
//       ...comm,
//       isReadByCurrentUser: comm.readBy?.some(
//         read => read.user?.toString() === req.user?.userId
//       ),
//       readCount: comm.readBy?.length || 0
//     }));

//     return res.status(200).json({
//       success: true,
//       data: enhancedComms,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalRecords: total,
//         perPage: limit,
//         hasNextPage: page < Math.ceil(total / limit),
//         hasPrevPage: page > 1
//       }
//     });
//   } catch (error) {
//     console.error("❌ getCommunications:", error);
//     return res.status(500).json({
//       success: false,
//       error: "COMMUNICATIONS_FETCH_FAILED",
//       message: error.message || "Failed to fetch communications"
//     });
//   }
// };



/**
 * GET /api/communications
 * Get all communications - FILTERS BY USER'S ROLE AND AUDIENCE
 */
export const getCommunications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;
    const priority = req.query.priority;
    const type = req.query.type;
    const audience = req.query.audience;

    // Get the MongoDB user
    const user = await getMongoUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found"
      });
    }

    // Build query
    let query = {};

    // 🔥 CRITICAL FIX: Filter communications based on user role
    if (user.role !== "admin") {
      // Non-admins can only see published communications
      query.status = "published";
      
      // And only communications that target them
      query.$or = [
        { "audience.type": "all" },
        { 
          "audience.type": "specific_roles",
          "audience.roles": user.role 
        }
      ];
    }

    // Search (apply additional search filter if provided)
    if (search) {
      query.$and = [
        query, // Existing filters
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { summary: { $regex: search, $options: "i" } }
          ]
        }
      ];
    }

    // Additional filters
    if (status && user.role === "admin") query.status = status;
    if (priority && user.role === "admin") query.priority = priority;
    if (type && user.role === "admin") query.type = type;
    if (audience && user.role === "admin") query["audience.type"] = audience;

    // Get total count
    const total = await Communication.countDocuments(query);

    // Get communications
    const communications = await Communication.find(query)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enhance with read status for the current user
    const enhancedComms = communications.map(comm => ({
      ...comm,
      isReadByCurrentUser: comm.readBy?.some(
        read => read.user?.toString() === user._id.toString()
      ),
      readCount: comm.readBy?.length || 0
    }));

    return res.status(200).json({
      success: true,
      data: enhancedComms,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("❌ getCommunications:", error);
    return res.status(500).json({
      success: false,
      error: "COMMUNICATIONS_FETCH_FAILED",
      message: error.message || "Failed to fetch communications"
    });
  }
};

/**
 * GET /api/communications/:id
 * Get single communication by ID
 */
/**
 * Fix getCommunicationById to use MongoDB _id
 */
export const getCommunicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const communication = await Communication.findById(id)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .populate("audience.users", "fullName email") // Fixed: was 'specificUsers'
      .populate("audience.excludeUsers", "fullName email")
      .populate("readBy.user", "fullName email")
      .lean();

    if (!communication) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Communication not found"
      });
    }

    // Get the MongoDB user
    const user = await getMongoUserFromRequest(req);
    
    // Check if user has access
    if (user && user.role !== "admin") {
      const hasAccess = await checkUserAccess(communication, user);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: "ACCESS_DENIED",
          message: "You don't have access to this communication"
        });
      }
    }

    // Mark as read if not already
    if (user) {
      const alreadyRead = communication.readBy?.some(
        read => read.user?._id.toString() === user._id.toString()
      );

      if (!alreadyRead) {
        await Communication.findByIdAndUpdate(id, {
          $push: {
            readBy: {
              user: user._id,
              readAt: new Date()
            }
          },
          $inc: { views: 1 }
        });
        
        communication.isReadByCurrentUser = false;
        communication.readCount = (communication.readBy?.length || 0) + 1;
      } else {
        communication.isReadByCurrentUser = true;
        communication.readCount = communication.readBy?.length || 0;
      }
    }

    return res.status(200).json({
      success: true,
      data: communication
    });
  } catch (error) {
    console.error("❌ getCommunicationById:", error);
    return res.status(500).json({
      success: false,
      error: "COMMUNICATION_FETCH_FAILED",
      message: error.message || "Failed to fetch communication"
    });
  }
};
/**
 * POST /api/communications
 * Create a new communication
 */
export const createCommunication = async (req, res) => {
  try {
    const {
      title,
      content,
      summary,
      type,
      priority,
      status,
      audience,
      sendEmail,
      scheduledFor
    } = req.body;

    // Validate required fields
    if (!title || !content || !audience?.type) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Title, content, and audience type are required"
      });
    }

    // Validate audience
    if (audience.type === "specific_roles" && (!audience.roles || audience.roles.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_AUDIENCE",
        message: "Please select at least one role for the audience"
      });
    }

    if (audience.type === "specific_users" && (!audience.users || audience.users.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_AUDIENCE",
        message: "Please select at least one user for the audience"
      });
    }

    // FIX: Get the MongoDB user document, not just the ID
    let user = null;
    
    // Check if we have the user from middleware
    if (req.user && req.user._id) {
      user = req.user;
    } else {
      // Try to find user by Firebase UID
      if (req.firebaseUser?.uid) {
        user = await User.findOne({ firebaseId: req.firebaseUser.uid });
      }
      
      // If not found by Firebase UID, try by email
      if (!user && req.firebaseUser?.email) {
        user = await User.findOne({ email: req.firebaseUser.email });
      }
      
      // If still not found, try by the user object from middleware
      if (!user && req.user && req.user.email) {
        user = await User.findOne({ email: req.user.email });
      }
    }

    if (!user) {
      console.error("❌ User not found in database:", {
        firebaseUid: req.firebaseUser?.uid,
        email: req.firebaseUser?.email || req.user?.email
      });
      
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found in database. Please ensure your account is properly set up."
      });
    }

    console.log("✅ Found user for communication:", {
      userId: user._id,
      email: user.email,
      name: user.fullName
    });

    // Create communication with the MongoDB _id
    const communication = new Communication({
      title,
      content,
      summary,
      type,
      priority,
      status: status || "published",
      audience,
      sendEmail: sendEmail || false,
      scheduledFor: scheduledFor || null,
      createdBy: user._id, // Use MongoDB ObjectId, NOT Firebase UID
      publishedAt: status === "published" && !scheduledFor ? new Date() : null
    });

    await communication.save();

    // Send email if requested and status is published
    if (sendEmail && status === "published" && !scheduledFor) {
    // Don't await - send in background
    sendEmailInBackground(communication, user).catch(console.error);
    }

    // Populate creator info
    await communication.populate("createdBy", "fullName email");

    return res.status(201).json({
      success: true,
      message: "Communication created successfully",
      data: communication
    });
  } catch (error) {
    console.error("❌ createCommunication:", error);
    return res.status(500).json({
      success: false,
      error: "COMMUNICATION_CREATE_FAILED",
      message: error.message || "Failed to create communication"
    });
  }
};

/**
 * Helper function to get MongoDB user from request
 */
async function getMongoUserFromRequest(req) {
  // Check if user is already attached with _id
  if (req.user && req.user._id) {
    return req.user;
  }
  
  // Try to find by Firebase UID
  if (req.firebaseUser?.uid) {
    const user = await User.findOne({ firebaseId: req.firebaseUser.uid });
    if (user) return user;
  }
  
  // Try to find by email
  if (req.firebaseUser?.email) {
    const user = await User.findOne({ email: req.firebaseUser.email });
    if (user) return user;
  }
  
  if (req.user?.email) {
    const user = await User.findOne({ email: req.user.email });
    if (user) return user;
  }
  
  return null;
}

/**
 * PUT /api/communications/:id
 * Update a communication - Only allow updates for drafts
 */
export const updateCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const communication = await Communication.findById(id);
    if (!communication) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Communication not found"
      });
    }

    // Get the MongoDB user
    const user = await getMongoUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found in database"
      });
    }

    // Only admin or creator can update
    if (user.role !== "admin" && communication.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "You don't have permission to update this communication"
      });
    }

    // FIXED: Allow updates for DRAFTS only
    if (communication.status !== "draft") {
      return res.status(400).json({
        success: false,
        error: "CANNOT_UPDATE",
        message: "Only draft communications can be edited. Published or scheduled communications cannot be modified.",
        currentStatus: communication.status
      });
    }

    // Update fields
    const allowedUpdates = [
      "title", "content", "summary", "type", "priority", 
      "status", "audience", "scheduledFor"
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        communication[field] = updateData[field];
      }
    });

    communication.updatedBy = user._id;

    // If changing from draft to published, set published date
    if (updateData.status === "published" && communication.status === "draft") {
      communication.publishedAt = new Date();
    }

    // If changing to scheduled, ensure scheduledFor is set
    if (updateData.status === "scheduled" && !communication.scheduledFor) {
      return res.status(400).json({
        success: false,
        error: "SCHEDULED_DATE_REQUIRED",
        message: "Scheduled date is required when status is 'scheduled'"
      });
    }

    await communication.save();

    // Populate updated info
    await communication.populate("createdBy", "fullName email");
    await communication.populate("updatedBy", "fullName email");

    return res.status(200).json({
      success: true,
      message: "Draft communication updated successfully",
      data: communication
    });
  } catch (error) {
    console.error("❌ updateCommunication:", error);
    return res.status(500).json({
      success: false,
      error: "COMMUNICATION_UPDATE_FAILED",
      message: error.message || "Failed to update communication"
    });
  }
};

/**
 * DELETE /api/communications/:id
 * Delete a communication
 */
export const deleteCommunication = async (req, res) => {
  try {
    const { id } = req.params;

    const communication = await Communication.findById(id);
    if (!communication) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Communication not found"
      });
    }

    // Get the MongoDB user
    const user = await getMongoUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found in database"
      });
    }

    // Only admin or creator can delete
    if (user.role !== "admin" && communication.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "You don't have permission to delete this communication"
      });
    }

    await communication.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Communication deleted successfully"
    });
  } catch (error) {
    console.error("❌ deleteCommunication:", error);
    return res.status(500).json({
      success: false,
      error: "COMMUNICATION_DELETE_FAILED",
      message: error.message || "Failed to delete communication"
    });
  }
};

/**
 * POST /api/communications/:id/send-email
 * Send email for a communication (called from route) - UPDATED FOR BCC
 */
export const sendCommunicationEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const communication = await Communication.findById(id);
    if (!communication) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Communication not found"
      });
    }

    if (communication.emailSent) {
      return res.status(400).json({
        success: false,
        error: "EMAIL_ALREADY_SENT",
        message: "Email has already been sent for this communication"
      });
    }

    // Get the MongoDB user (admin)
    const user = await getMongoUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found in database"
      });
    }

    // Get target users based on audience
    const targetUsers = await getTargetUsers(communication.audience);
    
    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "NO_RECIPIENTS",
        message: "No recipients found for this communication"
      });
    }

    // FIXED: Use BCC approach with proper Gmail limits
    const emailResults = await sendBulkEmailService(targetUsers, communication, {
      batchSize: 100,           // Gmail's limit: 100 recipients per email
      delayBetweenBatches: 30000 // 30 seconds between batches
    });

    // Update communication
    communication.emailSent = true;
    communication.emailSentAt = new Date();
    
    // Handle metadata safely
    if (!communication.metadata) {
      communication.metadata = new Map();
    }
    
    if (typeof communication.metadata.set === 'function') {
      communication.metadata.set('emailResults', {
        successful: emailResults.successful.length,
        failed: emailResults.failed.length,
        total: emailResults.total,
        sentAt: new Date()
      });
    } else {
      // If metadata is not a Map, convert it
      const metadataMap = new Map();
      if (communication.metadata && typeof communication.metadata === 'object') {
        Object.entries(communication.metadata).forEach(([key, value]) => {
          metadataMap.set(key, value);
        });
      }
      metadataMap.set('emailResults', {
        successful: emailResults.successful.length,
        failed: emailResults.failed.length,
        total: emailResults.total,
        sentAt: new Date()
      });
      communication.metadata = metadataMap;
    }
    
    await communication.save();

    // Calculate how many actual emails were sent (batches, not recipients)
    const emailsSent = Math.ceil(targetUsers.length / 100);
    
    return res.status(200).json({
      success: true,
      message: `✅ Sent ${targetUsers.length} recipients using ${emailsSent} email(s) via BCC`,
      data: {
        recipientsCount: emailResults.successful.length,
        totalRecipients: emailResults.total,
        emailsSent, // Number of actual SMTP messages
        failedCount: emailResults.failed.length,
        emailSentAt: communication.emailSentAt
      }
    });
  } catch (error) {
    console.error("❌ sendCommunicationEmail:", error);
    return res.status(500).json({
      success: false,
      error: "EMAIL_SEND_FAILED",
      message: error.message || "Failed to send email"
    });
  }
};

/**
 * Fix the checkUserAccess helper
 */
async function checkUserAccess(communication, user) {
  if (user.role === "admin") return true;

  const audience = communication.audience;
  
  switch (audience.type) {
    case "all":
      return true;
    case "specific_roles":
      return audience.roles.includes(user.role);
    case "specific_users":
      // Compare MongoDB ObjectIds
      return audience.users.some(id => id.toString() === user._id.toString());
    default:
      return false;
  }
}



/**
 * GET /api/communications/recipients/count
 * Get recipient count for audience selection
 */
export const getRecipientCount = async (req, res) => {
  try {
    const { type, roles } = req.query;
    
    let count = 0;
    
    if (type === 'all') {
      // Count both registered users AND pre-loaded users
      const [registeredCount, preloadedCount] = await Promise.all([
        User.countDocuments(),
        PreLoaded.countDocuments()
      ]);
      count = registeredCount + preloadedCount;
    } else if (type === 'specific_roles') {
      const roleList = roles ? roles.split(',') : [];
      
      // Count registered users by role
      const registeredCount = await User.countDocuments({
        role: { $in: roleList }
      });
      
      // Count pre-loaded users by role
      const preloadedCount = await PreLoaded.countDocuments({
        role: { $in: roleList }
      });
      
      count = registeredCount + preloadedCount;
    }
    
    return res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error("❌ getRecipientCount:", error);
    return res.status(500).json({
      success: false,
      error: "COUNT_FETCH_FAILED",
      message: error.message || "Failed to get recipient count"
    });
  }
};

/**
 * GET /api/communications/recipients/preview
 * Preview recipients for audience selection
 */
export const previewRecipients = async (req, res) => {
  try {
    const { type, roles, limit = 10 } = req.query;
    
    let recipients = [];
    
    if (type === 'all') {
      // Get mix of registered and pre-loaded users
      const [registered, preloaded] = await Promise.all([
        User.find().limit(limit).select('fullName email role').lean(),
        PreLoaded.find().limit(limit).select('email role').lean()
      ]);
      
      recipients = [
        ...registered.map(u => ({ ...u, status: 'registered' })),
        ...preloaded.map(p => ({ 
          fullName: 'Pending Registration', 
          email: p.email, 
          role: p.role,
          status: 'preloaded' 
        }))
      ].slice(0, limit);
    } else if (type === 'specific_roles') {
      const roleList = roles ? roles.split(',') : [];
      
      const [registered, preloaded] = await Promise.all([
        User.find({ role: { $in: roleList } })
          .limit(limit)
          .select('fullName email role')
          .lean(),
        PreLoaded.find({ role: { $in: roleList } })
          .limit(limit)
          .select('email role')
          .lean()
      ]);
      
      recipients = [
        ...registered.map(u => ({ ...u, status: 'registered' })),
        ...preloaded.map(p => ({ 
          fullName: 'Pending Registration', 
          email: p.email, 
          role: p.role,
          status: 'preloaded' 
        }))
      ].slice(0, limit);
    }
    
    return res.status(200).json({
      success: true,
      data: recipients
    });
  } catch (error) {
    console.error("❌ previewRecipients:", error);
    return res.status(500).json({
      success: false,
      error: "PREVIEW_FAILED",
      message: error.message || "Failed to preview recipients"
    });
  }
};

/**
 * GET /api/communications/stats/dashboard
 * Get communication statistics
 */
export const getCommunicationStats = async (req, res) => {
  try {
    const totalCommunications = await Communication.countDocuments();
    
    const publishedCount = await Communication.countDocuments({ status: "published" });
    const draftCount = await Communication.countDocuments({ status: "draft" });
    const scheduledCount = await Communication.countDocuments({ 
      status: "scheduled",
      scheduledFor: { $gt: new Date() }
    });

    const byType = await Communication.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);

    const byPriority = await Communication.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const byAudience = await Communication.aggregate([
      { $group: { _id: "$audience.type", count: { $sum: 1 } } }
    ]);

    // Get total potential recipients
    const [totalUsers, totalPreloaded] = await Promise.all([
      User.countDocuments(),
      PreLoaded.countDocuments()
    ]);

    const recentCommunications = await Communication.find()
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title type priority status createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        total: totalCommunications,
        byStatus: {
          published: publishedCount,
          draft: draftCount,
          scheduled: scheduledCount
        },
        byType: byType.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        byPriority: byPriority.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        byAudience: byAudience.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        totalRecipients: {
          registered: totalUsers,
          preloaded: totalPreloaded,
          total: totalUsers + totalPreloaded
        },
        recent: recentCommunications
      }
    });
  } catch (error) {
    console.error("❌ getCommunicationStats:", error);
    return res.status(500).json({
      success: false,
      error: "STATS_FETCH_FAILED",
      message: error.message || "Failed to fetch communication statistics"
    });
  }
};

// ============ HELPER FUNCTIONS ============

async function getTargetUsers(audience) {
  let registeredUsers = [];
  let preloadedUsers = [];

  switch (audience.type) {
    case "all":
      // Get all registered users
      registeredUsers = await User.find({}).select("email fullName role").lean();
      // Get all pre-loaded users (mentees, mentors etc who haven't registered yet)
      preloadedUsers = await PreLoaded.find({}).select("email role").lean();
      break;
      
    case "specific_roles":
      // Get registered users with specified roles
      registeredUsers = await User.find({ 
        role: { $in: audience.roles } 
      }).select("email fullName role").lean();
      
      // Get pre-loaded users with specified roles
      preloadedUsers = await PreLoaded.find({ 
        role: { $in: audience.roles } 
      }).select("email role").lean();
      break;
      
    case "specific_users":
      // Only registered users can be specifically selected
      registeredUsers = await User.find({ 
        _id: { $in: audience.users } 
      }).select("email fullName role").lean();
      break;
  }

  // Exclude specified users if any
  if (audience.excludeUsers?.length > 0) {
    registeredUsers = registeredUsers.filter(
      user => !audience.excludeUsers.includes(user._id.toString())
    );
  }

  // Transform preloaded users to match User format
  const formattedPreloaded = preloadedUsers.map(p => ({
    email: p.email,
    fullName: 'Pending Registration',
    role: p.role,
    _id: p._id,
    isPreloaded: true
  }));

  // Combine both lists
  return [...registeredUsers, ...formattedPreloaded];
}

// async function checkUserAccess(communication, user) {
//   if (user.role === "admin") return true;

//   const audience = communication.audience;
  
//   switch (audience.type) {
//     case "all":
//       return true;
//     case "specific_roles":
//       return audience.roles.includes(user.role);
//     case "specific_users":
//       return audience.users.some(id => id.toString() === user.userId);
//     default:
//       return false;
//   }
// }