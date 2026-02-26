import nodemailer from 'nodemailer';
import dns from 'dns';

// Create transporter based on environment
const createTransporter = () => {
  // For development/testing - Ethereal (fake email)
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Using Ethereal for email testing');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'your-ethereal-user',
        pass: process.env.ETHEREAL_PASS || 'your-ethereal-pass'
      }
    });
  }

  // For production - Gmail with IPv4 fix
  if (process.env.EMAIL_PROVIDER === 'gmail') {
    console.log('📧 Configuring Gmail for BCC sending (IPv4 only)');
    console.log(`   User: ${process.env.GMAIL_USER}`);
    
    const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '') || '';
    console.log(`   App Password length: ${appPassword.length} chars`);
    
    // 🔥 FIX: Force IPv4 by using custom lookup function
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: appPassword
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 10,
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,
      socketTimeout: 60000,
      // Force IPv4 only
      lookup: (hostname, options, callback) => {
        dns.resolve4(hostname, (err, addresses) => {
          if (err) {
            console.error('❌ DNS lookup failed:', err);
            return callback(err);
          }
          // Use the first IPv4 address
          console.log(`📧 Resolved ${hostname} to IPv4: ${addresses[0]}`);
          callback(null, addresses[0], 4);
        });
      }
    });
  }

  // For production - SMTP
  console.log('📧 Using SMTP');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// ============ FIXED: Single transporter declaration with lazy loading ============
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    console.log('📧 Creating new email transporter instance...');
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Reset the email transporter (call this when authentication fails)
 */
export const resetTransporter = () => {
  try {
    console.log('📧 Resetting email transporter...');
    transporter = createTransporter(); // Create brand new transporter
    console.log('✅ Email transporter reset successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to reset email transporter:', error);
    return false;
  }
};

/**
 * Send a single email with BCC support - WITH AUTO-RESET
 */
export const sendEmail = async ({ to, bcc, subject, html, text, from }) => {
  // Get or create transporter
  let currentTransporter = getTransporter();
  
  if (!currentTransporter) {
    throw new Error('Email transporter not initialized');
  }

  try {
    const fromAddress = from || `"Promaths Admin" <${process.env.GMAIL_USER || process.env.EMAIL_FROM || 'noreply@promaths.edu'}>`;
    
    const mailOptions = {
      from: fromAddress,
      to: to || process.env.GMAIL_USER,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '')
    };

    if (bcc && bcc.length > 0) {
      mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    }

    const info = await currentTransporter.sendMail(mailOptions);
    
    const recipientCount = bcc?.length || 1;
    console.log(`✅ Email sent to ${recipientCount} recipient${recipientCount > 1 ? 's (BCC)' : ''}: ${info.messageId}`);
    
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 Preview URL:', previewUrl);
      return { 
        success: true, 
        messageId: info.messageId,
        previewUrl
      };
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email:`, error.message);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    
    // If network unreachable error, try to reset and maybe switch to backup
    if (error.code === 'ENETUNREACH' || error.message.includes('ENETUNREACH')) {
      console.log('⚠️ Network unreachable error detected, resetting transporter...');
      resetTransporter();
    }
    
    // If authentication failed, reset the transporter
    if (error.message.includes('535') || error.message.includes('Invalid login') || error.message.includes('Application-specific password required')) {
      console.log('⚠️ Authentication failed, resetting transporter...');
      resetTransporter();
    }
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send bulk emails using BCC - ONE EMAIL TO MANY RECIPIENTS
 */
export const sendBulkEmails = async (recipients, communication, options = {}) => {
  const {
    batchSize = 100,           // Gmail limit: 100 recipients per email
    delayBetweenBatches = 30000 // 30 seconds between batches
  } = options;

  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients provided');
  }

  const results = {
    successful: [],
    failed: [],
    total: recipients.length
  };

  // Create email content once
  const emailContent = createEmailContent(communication);
  
  console.log(`📧 Starting BCC email to ${recipients.length} recipients`);
  console.log(`   Batch size: ${batchSize} (Gmail's limit)`);
  
  // Split recipients into batches of 100 (Gmail's limit)
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(recipients.length / batchSize);
    
    console.log(`📧 Batch ${batchNumber}/${totalBatches}: Sending to ${batch.length} recipients in ONE email (BCC)...`);
    
    try {
      // Send ONE email with BCC for the entire batch
      const result = await sendEmail({
        bcc: batch.map(r => r.email),
        subject: communication.title,
        html: emailContent.html,
        text: emailContent.text
      });
      
      // Mark all recipients in this batch as successful
      batch.forEach(recipient => {
        results.successful.push({
          email: recipient.email,
          userId: recipient._id,
          messageId: result.messageId
        });
      });
      
      console.log(`   ✅ Batch ${batchNumber} complete: Sent to ${batch.length} recipients via BCC`);
      
    } catch (error) {
      console.error(`   ❌ Batch ${batchNumber} failed:`, error.message);
      
      // Mark all recipients in this batch as failed
      batch.forEach(recipient => {
        results.failed.push({
          email: recipient.email,
          userId: recipient._id,
          error: error.message,
          attempts: 1
        });
      });
    }
    
    // Delay between batches - important to avoid looking like spam
    if (i + batchSize < recipients.length) {
      console.log(`   Waiting ${delayBetweenBatches/1000} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`✅ Bulk email complete: ${results.successful.length} recipients reached, ${results.failed.length} failed`);
  console.log(`   Total emails sent: ${Math.ceil(recipients.length / batchSize)} (not ${recipients.length}!)`);
  
  return results;
};

/**
 * Create HTML email content from communication
 */
function createEmailContent(communication) {
  const priorityColors = {
    low: '#6B7280',
    normal: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444'
  };

  const priorityColor = priorityColors[communication.priority] || '#3B82F6';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${communication.title}</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { padding: 30px 30px 20px; border-bottom: 1px solid #e5e7eb; }
        .content { padding: 30px; }
        .footer { padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .priority-badge { background-color: ${priorityColor}10; color: ${priorityColor}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        h1 { margin: 0; font-size: 24px; font-weight: 700; color: #1f2937; }
        p { margin: 0 0 15px; line-height: 1.6; color: #374151; }
        .summary { margin: 10px 0 0; font-size: 16px; color: #6b7280; font-style: italic; }
        .type-badge { background-color: #f3f4f6; color: #4b5563; padding: 4px 12px; border-radius: 9999px; font-size: 12px; text-transform: capitalize; }
      </style>
    </head>
    <body>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <span style="font-size: 20px; font-weight: bold; color: #1f2937;">Promaths</span>
                    </td>
                    <td align="right">
                      <span class="priority-badge">${communication.priority}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div class="content">
                <h1>${communication.title}</h1>
                ${communication.summary ? `<p class="summary">${communication.summary}</p>` : ''}
                
                <div style="margin-top: 30px;">
                  ${communication.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                
                <div style="margin-top: 30px;">
                  <span class="type-badge">${communication.type.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div class="footer">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  This is an automated message from Promaths Mentorship Program.<br>
                  Please do not reply to this email.
                </p>
                <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                  © ${new Date().getFullYear()} Promaths Bridge. All rights reserved.
                </p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
    ${communication.title}
    ${communication.summary ? `\n${communication.summary}\n` : ''}
    
    ${communication.content}
    
    ---
    This is an automated message from Promaths Mentorship Program.
    Please do not reply to this email.
    
    © ${new Date().getFullYear()} Promaths Bridge. All rights reserved.
  `;

  return { html, text };
}

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  try {
    const currentTransporter = getTransporter();
    await currentTransporter.verify();
    console.log('✅ Email server connection verified');
    return { 
      success: true, 
      message: 'Email server connection verified',
      provider: process.env.NODE_ENV === 'production' ? 'Gmail' : 'Ethereal'
    };
  } catch (error) {
    console.error('❌ Email server verification failed:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Email configuration failed. Check your credentials.'
    };
  }
};

/**
 * Send test email
 */
export const sendTestEmail = async (to) => {
  return sendEmail({
    to,
    subject: '✅ Test Email from Promaths Admin',
    html: `
      <h1>Test Email</h1>
      <p>If you received this, your email configuration is working!</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Provider:</strong> ${process.env.NODE_ENV === 'production' ? 'Gmail' : 'Ethereal'}</p>
      <p><strong>Connection:</strong> IPv4 only</p>
      <hr>
      <p style="color: #6b7280;">Promaths Mentorship Program</p>
    `
  });
};

// Initialize transporter on first use (not at startup)
console.log('📧 Email service loaded (transporter will be created on first use)');