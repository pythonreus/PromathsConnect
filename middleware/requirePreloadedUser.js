import admin from "firebase-admin";
import PreLoaded from "../models/preLoaded.js";

export const requirePreloadedUser = async (req, res, next) => {
  try {
let email;

    // Checking if verifyAuthToken already ran
    if (req.firebaseUser && req.firebaseUser.email) {
      email = req.firebaseUser.email;
    } 
    // Otherwise, extract email from Authorization Header (Initial Login request)
    else {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No authentication provided" });
      }

      const idToken = authHeader.split(" ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      email = decodedToken.email?.toLowerCase();
      
      // Attach to request so adminLogin controller can use it later
      req.firebaseUser = {
        uid: decodedToken.uid,
        email: email,
        name: decodedToken.name || ""
      };
    } 

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
