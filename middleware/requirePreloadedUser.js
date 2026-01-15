import PreLoaded from "../models/preLoaded.js";

export const requirePreloadedUser = async (req, res, next) => {
  try {
    const { email } = req.firebaseUser;

    if (!email) {
      return res.status(400).json({ message: "Email missing from token" });
    }

    const preloadedUser = await PreLoaded.findOne({ email });

    if (!preloadedUser) {
      return res.status(403).json({ message: "Email not authorized" });
    }

    req.preloadedUser = preloadedUser;
    next();
  } catch (err) {
    console.error("Preloaded check failed:", err);
    return res.status(500).json({ message: "Authorization failed" });
  }
};
