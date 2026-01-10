import User from "../models/users.js";

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
