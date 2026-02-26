import express from "express";
import { 
  getUsersPaginated,
  getUserById,
  exportUsers,
  adminLogin,
  clientLogin,           // ADD THIS
  getCurrentClient,
  getAuthorizedEmails,
  addAuthorizedEmail,
  updateAuthorizedEmail,
  deleteAuthorizedEmail,
  bulkImportAuthorizedEmails,
  getAuthorizedEmailsStats
} from "../../controllers/systemController.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";
import { requirePreloadedUser } from "../../middleware/requirePreloadedUser.js"
import PreLoaded from "../../models/preLoaded.js";

const router = express.Router();



/**
 * ============ CLIENT ROUTES ============
 * Reuses the same requirePreloadedUser middleware as admin
 */

// Client login - uses EXACT same preloaded check as admin
router.post("/client-login", requirePreloadedUser, clientLogin);

// Get current client info
router.get("/client/me", verifyAuthToken, getCurrentClient);

// Client logout
router.post("/client/logout", (req, res) => {
  res.clearCookie("session");
  res.status(200).json({ message: "Logged out successfully" });
});

/**
 * User routes
 */
router.get("/me", verifyAuthToken, (req, res) => {
  if (!req.firebaseUser) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  return res.status(200).json({
    user: req.firebaseUser
  });
});

// Get all registered users with search and pagination
router.get(
  "/users", 
  verifyAuthToken, 
  requireAdmin, 
  getUsersPaginated
);

// Get single user by ID
router.get(
  "/users/:id", 
  verifyAuthToken, 
  requireAdmin, 
  getUserById
);

// Export users data
router.get(
  "/users/export/all", 
  verifyAuthToken, 
  requireAdmin, 
  exportUsers
);



router.post("/admin-login", requirePreloadedUser, adminLogin);
router.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.status(200).json({ message: "Logged out successfully" });
});

/**
 * Authorized Emails Management Routes
 * All routes require admin authentication
 */

// Get statistics about authorized emails
router.get(
  "/authorized-emails/stats", 
  verifyAuthToken, 
  requireAdmin, 
  getAuthorizedEmailsStats
);

// Get all authorized emails with search and pagination
router.get(
  "/authorized-emails", 
  verifyAuthToken, 
  requireAdmin, 
  getAuthorizedEmails
);

// Add new authorized email(s)
router.post(
  "/authorized-emails", 
  verifyAuthToken, 
  requireAdmin, 
  addAuthorizedEmail
);

// Bulk import authorized emails
router.post(
  "/authorized-emails/bulk", 
  verifyAuthToken, 
  requireAdmin, 
  bulkImportAuthorizedEmails
);

// Update an authorized email
router.put(
  "/authorized-emails/:id", 
  verifyAuthToken, 
  requireAdmin, 
  updateAuthorizedEmail
);

// Delete an authorized email
router.delete(
  "/authorized-emails/:id", 
  verifyAuthToken, 
  requireAdmin, 
  deleteAuthorizedEmail
);


// Update user profile endpoint
router.put('/user/update-profile', async (req, res) => {
  try {
    const { email, faculty, gender } = req.body;
    
    // Validate required fields
    if (!email || !faculty || !gender) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, faculty, and gender are required' 
      });
    }

    // Validate faculty enum
    const validFaculties = ["Science", "EBE", "Humanities", "CLM", "Health Sciences"];
    if (!validFaculties.includes(faculty)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid faculty value' 
      });
    }

    // Validate gender enum
    const validGenders = ["male", "female"];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid gender value' 
      });
    }

    // Find and update the user
    const updatedUser = await PreLoaded.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        faculty: faculty,
        gender: gender,
        hasCompletedProfile: true 
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get user profile status
router.get('/user/profile-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await PreLoaded.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      hasCompletedProfile: user.hasCompletedProfile || false,
      user: {
        email: user.email,
        role: user.role,
        gender: user.gender,
        faculty: user.faculty
      }
    });

  } catch (error) {
    console.error('Error checking profile status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

export default router;