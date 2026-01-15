import User from "../models/users.js";

export const requireAdmin = async (req, res, next) => {
  try {
    // Defensive check: make sure auth middleware ran
    const email = req.firebaseUser?.email?.toLowerCase();
    if (!email) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Auth token missing",
      });
    }

    // Find the user in the database
    const user = await User.findOne({ email });

    // Check if user exists and has admin role
    if (!user || user.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Optionally attach the user object for downstream middlewares/controllers
    req.user = user;

    next();
  } catch (error) {
    console.error("❌ Admin check error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};
