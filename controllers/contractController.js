import Contract from "../models/Contract.js";
import UserAgreement from "../models/UserAgreement.js";
import User from "../models/users.js";

// Helper to get current user
async function getCurrentUser(req) {
  if (req.user) return req.user;
  
  if (req.firebaseUser?.email) {
    return await User.findOne({ email: req.firebaseUser.email });
  }
  
  return null;
}

/**
 * GET /api/contracts/my-contract
 * Get contract based on user's role
 */
export const getMyContract = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Get active contract for user's role
    const contract = await Contract.findOne({ 
      role: user.role, 
      isActive: true 
    });

    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: `No contract found for ${user.role}` 
      });
    }

    // Check if user has already agreed
    const agreement = await UserAgreement.findOne({ 
      user: user._id 
    });

    res.json({
      success: true,
      data: {
        contract: {
          _id: contract._id,
          content: contract.content,
          role: contract.role,
          version: contract.version
        },
        hasAgreed: agreement?.isAgreed || false,
        agreedAt: agreement?.agreedAt || null
      }
    });
  } catch (error) {
    console.error("Error in getMyContract:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

/**
 * POST /api/contracts/agree
 * Submit agreement for current user
 */
export const agreeToContract = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Get active contract for user's role
    const contract = await Contract.findOne({ 
      role: user.role, 
      isActive: true 
    });

    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: `No active contract found for ${user.role}` 
      });
    }

    // Check if user already agreed
    let agreement = await UserAgreement.findOne({ user: user._id });

    if (agreement && agreement.isAgreed) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already agreed to the contract" 
      });
    }

    // Create or update agreement
    if (agreement) {
      agreement.isAgreed = true;
      agreement.agreedAt = new Date();
      agreement.contractVersion = contract.version;
    } else {
      agreement = new UserAgreement({
        user: user._id,
        role: user.role,
        isAgreed: true,
        agreedAt: new Date(),
        contractVersion: contract.version
      });
    }

    await agreement.save();

    res.json({
      success: true,
      message: "Contract agreement submitted successfully",
      data: {
        agreedAt: agreement.agreedAt
      }
    });
  } catch (error) {
    console.error("Error in agreeToContract:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

/**
 * GET /api/contracts/status
 * Check if current user has agreed
 */
export const getAgreementStatus = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const agreement = await UserAgreement.findOne({ 
      user: user._id 
    });

    res.json({
      success: true,
      data: {
        hasAgreed: agreement?.isAgreed || false,
        agreedAt: agreement?.agreedAt || null,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error in getAgreementStatus:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ============ ADMIN ROUTES ============

/**
 * GET /api/contracts/admin/all
 * Get all contracts (admin only)
 */
// export const getAllContracts = async (req, res) => {
//   try {
//     const contracts = await Contract.find().sort({ role: 1 });
    
//     // Get agreement counts for each role
//     const contractsWithStats = await Promise.all(
//       contracts.map(async (contract) => {
//         const count = await UserAgreement.countDocuments({ 
//           role: contract.role,
//           isAgreed: true 
//         });
        
//         const totalUsers = await User.countDocuments({ 
//           role: contract.role 
//         });
        
//         return {
//           ...contract.toObject(),
//           stats: {
//             agreed: count,
//             total: totalUsers,
//             percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
//           }
//         };
//       })
//     );

//     res.json({
//       success: true,
//       data: contractsWithStats
//     });
//   } catch (error) {
//     console.error("Error in getAllContracts:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error" 
//     });
//   }
// };





//2.0
export const getAllContracts = async (req, res) => {
  try {
    const contracts = await Contract.find().sort({ role: 1 });
    
    // Get agreement counts for each role
    const contractsWithStats = await Promise.all(
      contracts.map(async (contract) => {
        const count = await UserAgreement.countDocuments({ 
          role: contract.role,
          isAgreed: true 
        });
        
        const totalUsers = await User.countDocuments({ 
          role: contract.role 
        });
        
        // LOG NON-SIGNERS FOR THIS ROLE
        if (totalUsers > count) {
          const users = await User.find({ role: contract.role }).select("fullName email");
          const signers = await UserAgreement.find({ 
            role: contract.role, 
            isAgreed: true 
          }).distinct("user");
          
          const nonSigners = users.filter(user => 
            !signers.some(signerId => signerId.toString() === user._id.toString())
          );
          
          console.log(`\n=== ${contract.role} NON-SIGNERS (${nonSigners.length}/${totalUsers}) ===`);
          nonSigners.forEach((user, i) => {
            console.log(`${i+1}. ${user.fullName} - ${user.email}`);
          });
        }
        
        return {
          ...contract.toObject(),
          stats: {
            agreed: count,
            total: totalUsers,
            percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: contractsWithStats
    });
  } catch (error) {
    console.error("Error in getAllContracts:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};


/**
 * GET /api/contracts/admin/agreements/:role
 * Get all users who agreed for a specific role
 */
export const getAgreementsByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const agreements = await UserAgreement.find({ 
      role, 
      isAgreed: true 
    })
    .populate("user", "fullName email dateJoined")
    .sort({ agreedAt: -1 });

    res.json({
      success: true,
      data: agreements
    });
  } catch (error) {
    console.error("Error in getAgreementsByRole:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

/**
 * POST /api/contracts/admin/create
 * Create or update contract (admin only)
 */
export const createOrUpdateContract = async (req, res) => {
  try {
    const { role, title, content, version } = req.body;

    console.log("Creating/Updating contract:", { role, title, content, version });

    if (!role || !title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Role, title, and content are required" 
      });
    }

    let contract = await Contract.findOne({ role });

    if (contract) {
      // Update existing
      contract.title = title;
      contract.content = content;
      contract.version = version || contract.version;
    } else {
      // Create new
      contract = new Contract({
        role,
        title,
        content,
        version: version || "1.0.0"
      });
    }

    await contract.save();

    res.json({
      success: true,
      message: contract.isNew ? "Contract created" : "Contract updated",
      data: contract
    });
  } catch (error) {
    console.error("Error in createOrUpdateContract:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};

/**
 * DELETE /api/contracts/admin/:role
 * Deactivate contract (soft delete)
 */
export const deactivateContract = async (req, res) => {
  try {
    const { role } = req.params;
    
    const contract = await Contract.findOne({ role });
    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: "Contract not found" 
      });
    }

    contract.isActive = false;
    await contract.save();

    res.json({ 
      success: true, 
      message: "Contract deactivated successfully" 
    });
  } catch (error) {
    console.error("Error in deactivateContract:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};



/**
 * GET /api/contracts/admin/non-signers/detailed
 * Get mentors and mentees who haven't signed with advanced filtering
 * Query params: 
 *   - search: email or name to search
 *   - role: filter by 'mentor' or 'mentee' (optional)
 *   - daysSinceJoined: filter by users joined in last X days (optional)
 */
export const getNonSignersDetailed = async (req, res) => {
  try {
    const { search, role, daysSinceJoined } = req.query;
    
    // Determine which roles to check
    let rolesToCheck = ['mentor', 'mentee'];
    if (role && (role === 'mentor' || role === 'mentee')) {
      rolesToCheck = [role];
    }
    
    // Build date filter if daysSinceJoined is provided
    let dateFilter = {};
    if (daysSinceJoined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysSinceJoined));
      dateFilter.dateJoined = { $gte: cutoffDate };
    }
    
    let allNonSigners = [];
    
    for (const currentRole of rolesToCheck) {
      // Build user query
      let userQuery = { 
        role: currentRole,
        ...dateFilter
      };
      
      // Add search filter if provided
      if (search) {
        userQuery.$or = [
          { email: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get users
      const users = await User.find(userQuery)
        .select("_id fullName email dateJoined profile lastActive")
        .lean();
      
      if (users.length === 0) continue;
      
      // Get signers
      const signers = await UserAgreement.find({ 
        role: currentRole, 
        isAgreed: true 
      }).distinct("user");
      
      // Filter non-signers
      const nonSignersForRole = users.filter(user => 
        !signers.some(signerId => signerId.toString() === user._id.toString())
      );
      
      // Format with additional info
      const formattedNonSigners = nonSignersForRole.map(user => ({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: currentRole,
        userType: currentRole === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Mentee',
        dateJoined: user.dateJoined,
        daysSinceJoined: user.dateJoined 
          ? Math.floor((new Date() - new Date(user.dateJoined)) / (1000 * 60 * 60 * 24))
          : null,
        lastActive: user.lastActive,
        profile: user.profile || {}
      }));
      
      allNonSigners = [...allNonSigners, ...formattedNonSigners];
    }
    
    // Sort by role then date joined (newest first)
    allNonSigners.sort((a, b) => {
      if (a.role === b.role) {
        return new Date(b.dateJoined) - new Date(a.dateJoined);
      }
      return a.role.localeCompare(b.role);
    });
    
    // Calculate statistics
    const mentorCount = allNonSigners.filter(u => u.role === 'mentor').length;
    const menteeCount = allNonSigners.filter(u => u.role === 'mentee').length;
    
    // Detailed console log
    console.log("\n" + "=".repeat(60));
    console.log("📋 NON-SIGNERS DETAILED REPORT");
    console.log("=".repeat(60));
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log(`Filters: ${search ? `search="${search}" ` : ''}${role ? `role="${role}" ` : ''}${daysSinceJoined ? `last ${daysSinceJoined} days` : ''}`);
    console.log("-".repeat(60));
    console.log(`TOTAL NON-SIGNERS: ${allNonSigners.length}`);
    console.log(`├─ 👨‍🏫 Mentors: ${mentorCount}`);
    console.log(`└─ 👨‍🎓 Mentees: ${menteeCount}`);
    
    if (allNonSigners.length > 0) {
      console.log("\n📋 DETAILED LIST:");
      console.log("-".repeat(60));
      
      allNonSigners.forEach((user, index) => {
        console.log(`${index + 1}. ${user.userType}`);
        console.log(`   Name: ${user.fullName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Joined: ${user.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : 'N/A'} (${user.daysSinceJoined || '?'} days ago)`);
        if (user.lastActive) {
          console.log(`   Last active: ${new Date(user.lastActive).toLocaleDateString()}`);
        }
        console.log("-".repeat(40));
      });
    } else {
      console.log("\n✅ All users have signed the contract!");
    }
    console.log("=".repeat(60) + "\n");
    
    res.json({
      success: true,
      data: {
        summary: {
          total: allNonSigners.length,
          mentors: mentorCount,
          mentees: menteeCount,
          filters: {
            search: search || null,
            role: role || 'all',
            daysSinceJoined: daysSinceJoined || null
          }
        },
        nonSigners: allNonSigners
      }
    });
    
  } catch (error) {
    console.error("Error in getNonSignersDetailed:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};