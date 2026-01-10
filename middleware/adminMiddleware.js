import User from "../models/users.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const email = req.user.email?.toLowerCase();

    if (!email) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Admin check error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};
