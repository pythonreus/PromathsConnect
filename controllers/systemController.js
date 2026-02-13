import admin from "firebase-admin";
import User from "../models/users.js";
import PreLoaded from "../models/preLoaded.js";


/**
 * POST /api/system/client-login
 * Client login - Reuses requirePreloadedUser middleware (just like admin)
 */
export const clientLogin = async (req, res) => {
  try {
    const { uid, email, name } = req.firebaseUser;
    const { role, gender } = req.preloadedUser; // From requirePreloadedUser middleware

    console.log(`Logging in client: ${email} (${gender}) (${role})`);

    // For client login, any role is allowed (unlike admin which requires role="admin")
    // Just log which role is logging in
    console.log(`Client role: ${role}`);

    let user = await User.findOne({ firebaseId: uid });

    if (!user) {
      user = await User.create({
        firebaseId: uid,
        email,
        fullName: name || email.split('@')[0],
        role: role,
        gender,
        dateOfJoining: new Date(),
        lastLogin: new Date(),
      });
      console.log(`New client created: ${email} with role: ${role}`);
    } else {
      user.lastLogin = new Date();
      
      // Sync role and gender with preloaded data if they differ
      if (user.role !== role) {
        console.log(`Updating user role from ${user.role} to ${role}`);
        user.role = role;
      }
      
      if (user.gender !== gender) {
        console.log(`Updating user gender from ${user.gender} to ${gender}`);
        user.gender = gender;
      }
      
      await user.save();
      console.log(`Existing client updated: ${email}`);
    }

    const authHeader = req.headers.authorization;
    const idToken = authHeader && authHeader.startsWith("Bearer ")?authHeader.split(" ")[1]: null;

    if (!idToken) {
      console.error("Token extraction failed for:", email);
      return res.status(401).json({ message: "Authentication token missing" });
    }
    
    // Set expiration time - 7 days for clients (admin uses 1 day)
    const expiresIn = 60 * 60 * 24 * 7 * 1000;

    // Create the Firebase Session Cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    // Set the Cookie Options
    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/"
    };  

    res.cookie("session", sessionCookie, options);


    // 🔥 DEBUG: Log cookie details
    console.log("✅ Session cookie SET in response");
    console.log("   Cookie name: session");
    console.log("   MaxAge:", expiresIn / 1000, "seconds");
    console.log("   Secure:", options.secure);
    console.log("   SameSite:", options.sameSite);
    console.log("   Path:", options.path);
    console.log("   Cookie length:", sessionCookie.length);

    // Determine redirect URL based on role
    let redirectUrl = "/client-dashboard";
    
    if (role === "admin") {
      redirectUrl = "/admin";
    } else if (role === "mentor" || role === "head_mentor") {
      redirectUrl = "/client-dashboard";
    } else if (role === "mentee") {
      redirectUrl = "/client-dashboard";
    }

    return res.status(200).json({
      message: "Client login successful",
      redirectUrl,
      user: {
        firebaseId: user.firebaseId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        gender: user.gender,
      },
    });
  } catch (err) {
    console.error("Client login error:", err);
    return res.status(500).json({
      message: "Failed to complete client login",
    });
  }
};

/**
 * GET /api/system/client/me
 * Get current client user info
 */
export const getCurrentClient = async (req, res) => {
  try {
    const { uid } = req.firebaseUser;
    
    const user = await User.findOne({ firebaseId: uid })
      .select("-__v")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      user: {
        firebaseId: user.firebaseId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        gender: user.gender,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error("Get current client error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch user"
    });
  }
};


/**
 * POST /api/system/admin-login
 * Admin only
 */
export const adminLogin = async (req, res) => {
  try {
    const { uid, email, name } = req.firebaseUser;
    const { role, gender } = req.preloadedUser;

    console.log(`Logging in admin: ${email} (${gender}) (${role})`);

    if (role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    let user = await User.findOne({ firebaseId: uid });

    if (!user) {
      user = await User.create({
        firebaseId: uid,
        email,
        fullName: name,
        role: role,
        gender,
        dateOfJoining: new Date(),
        lastLogin: new Date(),
      });
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    const authHeader = req.headers.authorization;
    const idToken = authHeader && authHeader.startsWith("Bearer ")?authHeader.split(" ")[1]: null;

    if (!idToken) {
      console.error("Token extraction failed for:", email);
      return res.status(401).json({ message: "Authentication token missing" });
    }
    
    // Set expiration time
    const expiresIn = 60 * 60 * 24 * 1 * 1000;

    // Create the Firebase Session Cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    // Set the Cookie Options
    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/"
    };  

    res.cookie("session", sessionCookie, options);

    return res.status(200).json({
      message: "Admin login successful",
      user: {
        firebaseId: user.firebaseId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Admin login DB error:", err);
    return res.status(500).json({
      message: "Failed to complete admin login",
    });
  }
};


/**
 * GET /api/system/users
 * Admin only - Get all registered users with search and pagination
 */
export const getUsersPaginated = async (req, res) => {
  console.log("🟢 Hit /users route", { user: req.user, query: req.query });
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per page
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const role = req.query.role; // Optional role filter
    const gender = req.query.gender; // Optional gender filter
    const status = req.query.status; // Optional status filter (active/inactive)

    // Build search query
    let query = {};
    
    // Add search functionality - search across multiple fields
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firebaseId: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { "academicInfo.studentId": { $regex: search, $options: "i" } },
        { "academicInfo.course": { $regex: search, $options: "i" } },
        { "academicInfo.department": { $regex: search, $options: "i" } },
        { "academicInfo.institution": { $regex: search, $options: "i" } }
      ];
    }

    // Add filters
    if (role) {
      query.role = role;
    }
    
    if (gender) {
      query.gender = gender;
    }

    // Status filter (active = logged in within last 30 days)
    if (status === 'active') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.lastLogin = { $gte: thirtyDaysAgo };
    } else if (status === 'inactive') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.$or = [
        { lastLogin: { $lt: thirtyDaysAgo } },
        { lastLogin: { $exists: false } }
      ];
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get paginated users
    const users = await User.find(query)
      .select("-__v") // Exclude internal fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    // Enhance user data with additional computed fields
    const enhancedUsers = users.map(user => {
      // Calculate account age in days
      const accountAge = user.createdAt 
        ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
        : null;
      
      // Determine if user is active (logged in within last 30 days)
      const isActive = user.lastLogin 
        ? (new Date() - new Date(user.lastLogin)) < (30 * 24 * 60 * 60 * 1000)
        : false;

      return {
        ...user,
        accountAgeInDays: accountAge,
        isActive,
        // Format dates for easier frontend consumption
        formattedCreatedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : null,
        formattedLastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : null,
        formattedDateOfJoining: user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : null
      };
    });

    // Calculate summary statistics for current page
    const stats = {
      totalActive: enhancedUsers.filter(u => u.isActive).length,
      totalInactive: enhancedUsers.filter(u => !u.isActive).length,
      byRole: {},
      byGender: {}
    };

    // Calculate role and gender distribution for current page
    enhancedUsers.forEach(user => {
      // Role stats
      const userRole = user.role || 'unknown';
      stats.byRole[userRole] = (stats.byRole[userRole] || 0) + 1;
      
      // Gender stats
      const userGender = user.gender || 'unspecified';
      stats.byGender[userGender] = (stats.byGender[userGender] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: enhancedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      filters: {
        search: search || null,
        role: role || null,
        gender: gender || null,
        status: status || null
      },
      stats: {
        currentPage: stats,
        global: {
          totalUsers: total
        }
      }
    });
  } catch (error) {
    console.error("❌ getUsersPaginated:", error);
    return res.status(500).json({
      success: false,
      error: "USERS_FETCH_FAILED",
      message: error.message || "Failed to fetch users",
    });
  }
};

/**
 * GET /api/system/users/:id
 * Admin only - Get single user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select("-__v")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    // Check if user is in preloaded list
    const preloadedUser = await PreLoaded.findOne({ email: user.email }).lean();

    // Enhance user data
    const enhancedUser = {
      ...user,
      accountAgeInDays: user.createdAt 
        ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
        : null,
      isActive: user.lastLogin 
        ? (new Date() - new Date(user.lastLogin)) < (30 * 24 * 60 * 60 * 1000)
        : false,
      isPreloaded: !!preloadedUser,
      preloadedDetails: preloadedUser ? {
        role: preloadedUser.role,
        gender: preloadedUser.gender,
        addedAt: preloadedUser.createdAt
      } : null,
      formattedCreatedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : null,
      formattedLastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : null,
      formattedDateOfJoining: user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : null
    };

    return res.status(200).json({
      success: true,
      data: enhancedUser
    });

  } catch (error) {
    console.error("❌ getUserById:", error);
    return res.status(500).json({
      success: false,
      error: "USER_FETCH_FAILED",
      message: error.message || "Failed to fetch user"
    });
  }
};

/**
 * GET /api/system/users/export/all
 * Admin only - Export users data (CSV/JSON)
 */
export const exportUsers = async (req, res) => {
  try {
    const { format = 'json', search, role, gender, status } = req.query;
    
    // Build query (same as getUsersPaginated)
    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firebaseId: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } }
      ];
    }

    if (role) {
      query.role = role;
    }
    
    if (gender) {
      query.gender = gender;
    }

    if (status === 'active') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.lastLogin = { $gte: thirtyDaysAgo };
    } else if (status === 'inactive') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.$or = [
        { lastLogin: { $lt: thirtyDaysAgo } },
        { lastLogin: { $exists: false } }
      ];
    }

    const users = await User.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      // Define CSV fields
      const fields = [
        'fullName', 
        'email', 
        'role', 
        'gender', 
        'phoneNumber', 
        'firebaseId',
        'createdAt', 
        'lastLogin', 
        'dateOfJoining',
        'academicInfo.studentId',
        'academicInfo.course',
        'academicInfo.department',
        'academicInfo.institution',
        'academicInfo.yearOfStudy'
      ];

      // Create CSV header
      const csvHeader = fields.join(',');

      // Create CSV rows
      const csvRows = users.map(user => {
        return fields.map(field => {
          // Handle nested fields (like academicInfo.studentId)
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            const value = user[parent]?.[child] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          }
          
          // Handle regular fields
          let value = user[field] || '';
          
          // Format dates
          if (field.includes('Date') || field.includes('At') || field === 'createdAt' || field === 'lastLogin' || field === 'dateOfJoining') {
            value = value ? new Date(value).toISOString().split('T')[0] : '';
          }
          
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csv = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.csv`);
      return res.status(200).send(csv);
    }

    // Default JSON format
    return res.status(200).json({
      success: true,
      data: users,
      total: users.length,
      exportDate: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ exportUsers:", error);
    return res.status(500).json({
      success: false,
      error: "EXPORT_FAILED",
      message: error.message || "Failed to export users"
    });
  }
};


/**
 * GET /api/system/authorized-emails
 * Admin only - Get all authorized emails (pre-loaded users) with search and pagination
 */
export const getAuthorizedEmails = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const role = req.query.role; // Optional role filter
    const gender = req.query.gender; // Optional gender filter

    // Build search query
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } }
      ];
    }

    // Add filters
    if (role) {
      query.role = role;
    }
    
    if (gender) {
      query.gender = gender;
    }

    const [authorizedEmails, total] = await Promise.all([
      PreLoaded.find(query)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PreLoaded.countDocuments(query),
    ]);

    // Get usage statistics (which emails have registered)
    const emails = authorizedEmails.map(item => item.email);
    const registeredUsers = await User.find({ 
      email: { $in: emails } 
    }).select("email firebaseId lastLogin");

    // Create a map of registered emails
    const registeredMap = {};
    registeredUsers.forEach(user => {
      registeredMap[user.email] = {
        registered: true,
        firebaseId: user.firebaseId,
        lastLogin: user.lastLogin
      };
    });

    // Enhance response with registration status
    const enhancedData = authorizedEmails.map(item => ({
      ...item.toObject(),
      registrationStatus: registeredMap[item.email] || { registered: false }
    }));

    return res.status(200).json({
      success: true,
      data: enhancedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit,
      },
      filters: {
        search,
        role: role || null,
        gender: gender || null
      }
    });
  } catch (error) {
    console.error("❌ getAuthorizedEmails:", error);
    return res.status(500).json({
      success: false,
      error: "AUTHORIZED_EMAILS_FETCH_FAILED",
      message: error.message || "Failed to fetch authorized emails",
    });
  }
};

/**
 * POST /api/system/authorized-emails
 * Admin only - Add new authorized emails
 */
export const addAuthorizedEmail = async (req, res) => {
  try {
    const { emails } = req.body; // Can be single email object or array

    if (!emails) {
      return res.status(400).json({
        success: false,
        error: "MISSING_DATA",
        message: "Please provide email data"
      });
    }

    const emailArray = Array.isArray(emails) ? emails : [emails];
    
    // Validate each email
    const validationErrors = [];
    const validEmails = [];

    for (const item of emailArray) {
      const { email, role, gender } = item;

      // Check required fields
      if (!email || !role || !gender) {
        validationErrors.push({
          email: email || "unknown",
          error: "Missing required fields (email, role, gender)"
        });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push({
          email,
          error: "Invalid email format"
        });
        continue;
      }

      // Validate role
      const validRoles = ["admin", "mentor", "head_mentor", "mentee"];
      if (!validRoles.includes(role)) {
        validationErrors.push({
          email,
          error: `Invalid role. Must be one of: ${validRoles.join(", ")}`
        });
        continue;
      }

      // Validate gender
      const validGenders = ["male", "female"];
      if (!validGenders.includes(gender)) {
        validationErrors.push({
          email,
          error: `Invalid gender. Must be one of: ${validGenders.join(", ")}`
        });
        continue;
      }

      validEmails.push({ email, role, gender });
    }

    // Check for existing emails
    const existingEmails = await PreLoaded.find({
      email: { $in: validEmails.map(v => v.email) }
    }).select("email");

    const existingEmailSet = new Set(existingEmails.map(e => e.email));
    
    const newEmails = validEmails.filter(v => !existingEmailSet.has(v.email));
    const duplicateEmails = validEmails.filter(v => existingEmailSet.has(v.email));

    // Insert new emails
    let created = [];
    if (newEmails.length > 0) {
      created = await PreLoaded.insertMany(newEmails, { ordered: false });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully added ${created.length} authorized email(s)`,
      data: {
        created: created.map(c => ({ email: c.email, role: c.role, gender: c.gender })),
        duplicates: duplicateEmails.map(d => ({ email: d.email, role: d.role, gender: d.gender })),
        errors: validationErrors
      }
    });

  } catch (error) {
    console.error("❌ addAuthorizedEmail:", error);
    return res.status(500).json({
      success: false,
      error: "AUTHORIZED_EMAIL_ADD_FAILED",
      message: error.message || "Failed to add authorized emails",
    });
  }
};

/**
 * PUT /api/system/authorized-emails/:id
 * Admin only - Update an authorized email
 */
export const updateAuthorizedEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, gender } = req.body;

    if (!role && !gender) {
      return res.status(400).json({
        success: false,
        error: "MISSING_DATA",
        message: "Please provide at least one field to update (role or gender)"
      });
    }

    // Build update object
    const updateData = {};
    
    if (role) {
      const validRoles = ["admin", "mentor", "head_mentor", "mentee"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_ROLE",
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`
        });
      }
      updateData.role = role;
    }

    if (gender) {
      const validGenders = ["male", "female"];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_GENDER",
          message: `Invalid gender. Must be one of: ${validGenders.join(", ")}`
        });
      }
      updateData.gender = gender;
    }

    const updated = await PreLoaded.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Authorized email record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Authorized email updated successfully",
      data: updated
    });

  } catch (error) {
    console.error("❌ updateAuthorizedEmail:", error);
    return res.status(500).json({
      success: false,
      error: "AUTHORIZED_EMAIL_UPDATE_FAILED",
      message: error.message || "Failed to update authorized email",
    });
  }
};

/**
 * DELETE /api/system/authorized-emails/:id
 * Admin only - Delete an authorized email
 */
export const deleteAuthorizedEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // Optional query param for hard delete

    const record = await PreLoaded.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Authorized email record not found"
      });
    }

    // Check if user has already registered
    const registeredUser = await User.findOne({ email: record.email });

    if (registeredUser && !hardDelete) {
      return res.status(400).json({
        success: false,
        error: "USER_REGISTERED",
        message: "This user has already registered. Use hardDelete=true to force delete or disable instead.",
        data: {
          email: record.email,
          registeredUser: {
            firebaseId: registeredUser.firebaseId,
            lastLogin: registeredUser.lastLogin
          }
        }
      });
    }

    // Perform delete
    await PreLoaded.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Authorized email deleted successfully",
      data: {
        email: record.email,
        role: record.role,
        gender: record.gender,
        hadRegistered: !!registeredUser
      }
    });

  } catch (error) {
    console.error("❌ deleteAuthorizedEmail:", error);
    return res.status(500).json({
      success: false,
      error: "AUTHORIZED_EMAIL_DELETE_FAILED",
      message: error.message || "Failed to delete authorized email",
    });
  }
};

/**
 * POST /api/system/authorized-emails/bulk
 * Admin only - Bulk import authorized emails
 */
export const bulkImportAuthorizedEmails = async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: "MISSING_DATA",
        message: "Please provide an array of emails to import"
      });
    }

    // Process in batches to avoid memory issues
    const batchSize = 100;
    const results = {
      total: emails.length,
      successful: 0,
      failed: [],
      duplicates: []
    };

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Validate batch
      const validBatch = [];
      for (const item of batch) {
        const { email, role, gender } = item;
        
        // Basic validation
        if (!email || !role || !gender) {
          results.failed.push({
            email: email || "unknown",
            error: "Missing required fields"
          });
          continue;
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed.push({
            email,
            error: "Invalid email format"
          });
          continue;
        }

        validBatch.push({ email, role, gender });
      }

      // Check for existing emails
      const existing = await PreLoaded.find({
        email: { $in: validBatch.map(v => v.email) }
      }).select("email");

      const existingSet = new Set(existing.map(e => e.email));
      
      const newEmails = validBatch.filter(v => !existingSet.has(v.email));
      const duplicateEmails = validBatch.filter(v => existingSet.has(v.email));

      // Insert new emails
      if (newEmails.length > 0) {
        await PreLoaded.insertMany(newEmails, { ordered: false });
        results.successful += newEmails.length;
      }

      results.duplicates.push(...duplicateEmails);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${results.successful} of ${results.total} emails`,
      results
    });

  } catch (error) {
    console.error("❌ bulkImportAuthorizedEmails:", error);
    return res.status(500).json({
      success: false,
      error: "BULK_IMPORT_FAILED",
      message: error.message || "Failed to bulk import authorized emails",
    });
  }
};

/**
 * GET /api/system/authorized-emails/stats
 * Admin only - Get statistics about authorized emails
 */
export const getAuthorizedEmailsStats = async (req, res) => {
  try {
    const totalAuthorized = await PreLoaded.countDocuments();
    
    // Count by role
    const roleStats = await PreLoaded.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Count by gender
    const genderStats = await PreLoaded.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get registration stats
    const allEmails = await PreLoaded.find().select("email");
    const emailList = allEmails.map(e => e.email);
    
    const registeredUsers = await User.find({
      email: { $in: emailList }
    }).countDocuments();

    const registrationRate = totalAuthorized > 0 
      ? ((registeredUsers / totalAuthorized) * 100).toFixed(2)
      : 0;

    // Recently added
    const recentlyAdded = await PreLoaded.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email role createdAt");

    return res.status(200).json({
      success: true,
      data: {
        total: totalAuthorized,
        registered: registeredUsers,
        registrationRate: `${registrationRate}%`,
        byRole: roleStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        byGender: genderStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        recentlyAdded
      }
    });

  } catch (error) {
    console.error("❌ getAuthorizedEmailsStats:", error);
    return res.status(500).json({
      success: false,
      error: "STATS_FETCH_FAILED",
      message: error.message || "Failed to fetch authorized emails statistics",
    });
  }
};