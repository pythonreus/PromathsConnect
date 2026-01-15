import User from "../models/users.js";

/**
 * POST /api/system/admin-login
 * Admin only
 */

export const adminLogin = async (req, res) => {
  try {
    const { uid, email, name } = req.firebaseUser;
    const { role } = req.preloadedUser;

    if (role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    let user = await User.findOne({ firebaseId: uid });

    if (!user) {
      user = await User.create({
        firebaseId: uid,
        email,
        fullName: name,
        userRole: role,
        dateOfJoining: new Date(),
        lastLogin: new Date(),
      });
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    return res.status(200).json({
      message: "Admin login successful",
      user: {
        firebaseId: user.firebaseId,
        email: user.email,
        fullName: user.fullName,
        role: user.userRole,
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
 * Admin only
 */
export const getUsersPaginated = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("-__v") // hide internal fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit,
      },
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
