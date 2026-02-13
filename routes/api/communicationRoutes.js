// routes/communicationRoutes.js
import express from "express";
import nodemailer from "nodemailer";
import {
  getCommunications,
  getCommunicationById,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  sendCommunicationEmail,
  getCommunicationStats,
  getRecipientCount,
  previewRecipients
} from "../../controllers/communicationController.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";
import { sendTestEmail, verifyEmailConfig, resetTransporter, sendEmail } from "../../services/emailService.js";

const router = express.Router();

/**
 * All communication routes require authentication
 */
// // Add to routes/communicationRoutes.js
router.get(
  "/test-gmail-direct",
  verifyAuthToken,
  requireAdmin,
  async (req, res) => {
    try {
      // Create transporter directly for testing
      const testTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') // Remove spaces
        }
      });

      // Verify connection
      await testTransporter.verify();
      
      // Send test email to yourself
      const info = await testTransporter.sendMail({
        from: `"Promaths Admin" <${process.env.GMAIL_USER}>`,
        to: req.user.email,
        subject: '✅ Gmail Test Successful',
        html: '<h1>Gmail is Working!</h1><p>Your Promaths email configuration is correct.</p>'
      });

      res.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: info.messageId,
        to: req.user.email
      });
    } catch (error) {
      console.error('❌ Gmail test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        hint: getGmailErrorHint(error.message)
      });
    }
  }
);

// In communicationRoutes.js - add this temporary route
router.get(
  "/reset-email",
  verifyAuthToken,
  requireAdmin,
  async (req, res) => {
    try {
      const success = resetTransporter();
      if (success) {
        // Test the new transporter
        const testResult = await sendEmail({
          to: req.user.email,
          subject: '✅ Transporter Reset Successful',
          html: '<h1>Success!</h1><p>The email transporter has been reset and is working again.</p>'
        });
        
        res.json({
          success: true,
          message: 'Email transporter reset and tested successfully',
          messageId: testResult.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to reset email transporter'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get recipient count for audience selection
router.get(
  "/recipients/count",
  verifyAuthToken,
  requireAdmin,
  getRecipientCount
);

// Preview recipients
router.get(
  "/recipients/preview",
  verifyAuthToken,
  requireAdmin,
  previewRecipients
);

// Get communication statistics (admin only)
router.get(
  "/stats/dashboard",
  verifyAuthToken,
  requireAdmin,
  getCommunicationStats
);

// Get all communications (with filters)
router.get(
  "/",
  verifyAuthToken,
  getCommunications
);

// Get single communication
router.get(
  "/:id",
  verifyAuthToken,
  getCommunicationById
);

// Create new communication (admin only)
router.post(
  "/",
  verifyAuthToken,
  requireAdmin,
  createCommunication
);

// Update communication (admin or creator)
router.put(
  "/:id",
  verifyAuthToken,
  updateCommunication
);

// Delete communication (admin or creator)
router.delete(
  "/:id",
  verifyAuthToken,
  deleteCommunication
);

// Send email for communication (admin only)
router.post(
  "/:id/send-email",
  verifyAuthToken,
  requireAdmin,
  sendCommunicationEmail
);




// Helper function to provide helpful error messages
function getGmailErrorHint(errorMessage) {
  if (errorMessage.includes('Application-specific password required')) {
    return 'You need to use an App Password. Enable 2-Step Verification and generate an App Password.';
  }
  if (errorMessage.includes('bad credentials')) {
    return 'Invalid email or App Password. Double-check your credentials.';
  }
  if (errorMessage.includes('535')) {
    return 'Authentication failed. Make sure you generated an App Password, not using your regular password.';
  }
  if (errorMessage.includes('rate limited')) {
    return 'Too many failed attempts. Wait 30 minutes and try again with correct credentials.';
  }
  return 'Check your Gmail credentials and ensure 2-Step Verification is enabled.';
}

export default router;