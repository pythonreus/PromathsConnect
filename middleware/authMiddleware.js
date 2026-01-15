// middleware/authMiddleware.js
import admin from "firebase-admin";
// import User from "../models/users.js";
// import PreLoaded from "../models/preLoaded.js";

// export const verifyAuthToken =  async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No token provided" });
//     }

//     const idToken = authHeader.split(" ")[1];
//     const decodedToken = await admin.auth().verifyIdToken(idToken);

//     const email = decodedToken.email.toLowerCase();

//     // Check if user email exists in preloaded whitelist
//     const preloadedUser = await PreLoaded.findOne({ email });
//     if (!preloadedUser) {
//       return res.status(403).json({ message: "Email not authorized" });
//     }

//     // Check if user already exists in User collection
//     let user = await User.findOne({ firebaseId: decodedToken.uid });
//     if (!user) {
//       // Create user if not exists
//       user = await User.create({
//         firebaseId: decodedToken.uid,
//         email,
//         fullName: decodedToken.name || "",
//         userRole: preloadedUser.role,
//         dateOfJoining: new Date(),
//         lastLogin: new Date(),
//       });
//     } else {
//       // Update last login
//       user.lastLogin = new Date();
//       await user.save();
//     }

//     req.user = {
//       uid: decodedToken.uid,
//       email: user.email,
//       role: user.userRole,
//     };

//     next();
//   } catch (err) {
//     console.error("Auth verification failed:", err);
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// };


// verifyFirebaseToken
export const verifyAuthToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email?.toLowerCase(),
      name: decodedToken.name || "",
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

