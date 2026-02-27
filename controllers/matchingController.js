// // controllers/matchingController.js
import User from "../models/users.js";
import PreLoaded from "../models/preLoaded.js";

// /**
//  * Match mentors with mentees
//  * Prioritizes faculty matching and balances gender
//  */
// export const matchMentorsAndMentees = async (req, res) => {
//   try {
//     console.log("=".repeat(60));
//     console.log("🔍 STARTING MENTOR-MENTEE MATCHING ALGORITHM");
//     console.log("=".repeat(60));

//     // 1. Fetch all mentors and mentees
//     const mentors = await User.find({ role: "mentor" }).lean();
//     const mentees = await User.find({ role: "mentee" }).lean();
    
//     // Also check PreLoaded for users who haven't registered yet
//     const preloadedMentors = await PreLoaded.find({ role: "mentor" }).lean();
//     const preloadedMentees = await PreLoaded.find({ role: "mentee" }).lean();

//     console.log(`📊 Found ${mentors.length} registered mentors`);
//     console.log(`📊 Found ${mentees.length} registered mentees`);
//     console.log(`📊 Found ${preloadedMentors.length} pre-loaded mentors (pending registration)`);
//     console.log(`📊 Found ${preloadedMentees.length} pre-loaded mentees (pending registration)`);

//     // 2. Combine registered and pre-loaded users, removing duplicates
//     console.log("\n🔍 Checking for duplicates...");
    
//     // Use Maps to deduplicate by email
//     const mentorMap = new Map();
//     const menteeMap = new Map();
    
//     // Track duplicate counts
//     let duplicateMentors = 0;
//     let duplicateMentees = 0;

//     // Add registered users first (they take precedence)
//     mentors.forEach(m => {
//       mentorMap.set(m.email, { 
//         ...m, 
//         status: 'registered',
//         source: 'registered'
//       });
//     });

//     mentees.forEach(m => {
//       menteeMap.set(m.email, { 
//         ...m, 
//         status: 'registered',
//         source: 'registered'
//       });
//     });

//     // Add pre-loaded users only if email not already in map
//     preloadedMentors.forEach(m => {
//       if (!mentorMap.has(m.email)) {
//         mentorMap.set(m.email, { 
//           ...m, 
//           fullName: 'Pending Registration',
//           status: 'preloaded',
//           source: 'preloaded',
//           hasCompletedProfile: m.hasCompletedProfile || false
//         });
//       } else {
//         duplicateMentors++;
//         console.log(`⚠️ Duplicate mentor (already registered): ${m.email}`);
//       }
//     });

//     preloadedMentees.forEach(m => {
//       if (!menteeMap.has(m.email)) {
//         menteeMap.set(m.email, { 
//           ...m, 
//           fullName: 'Pending Registration',
//           status: 'preloaded',
//           source: 'preloaded',
//           hasCompletedProfile: m.hasCompletedProfile || false
//         });
//       } else {
//         duplicateMentees++;
//         console.log(`⚠️ Duplicate mentee (already registered): ${m.email}`);
//       }
//     });

//     const allMentors = Array.from(mentorMap.values());
//     const allMentees = Array.from(menteeMap.values());

//     console.log(`\n📊 After deduplication:`);
//     console.log(`   • Mentors: ${allMentors.length} total`);
//     console.log(`     - Registered: ${mentors.length}`);
//     console.log(`     - Pre-loaded: ${preloadedMentors.length}`);
//     console.log(`     - Duplicates skipped: ${duplicateMentors}`);
//     console.log(`   • Mentees: ${allMentees.length} total`);
//     console.log(`     - Registered: ${mentees.length}`);
//     console.log(`     - Pre-loaded: ${preloadedMentees.length}`);
//     console.log(`     - Duplicates skipped: ${duplicateMentees}`);
    
//     if (allMentors.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No mentors available for matching"
//       });
//     }

//     // 3. Calculate target mentees per mentor
//     const targetPerMentor = Math.ceil(allMentees.length / allMentors.length);
//     console.log(`\n🎯 Target: ~${targetPerMentor} mentees per mentor (range: ${targetPerMentor-1}-${targetPerMentor+1})`);

//     // 4. Initialize data structures
//     const matches = [];
//     const unassignedMentees = [];
//     const mentorAssignments = {};
    
//     // Track mentor counts
//     allMentors.forEach(mentor => {
//       mentorAssignments[mentor._id.toString()] = {
//         mentor,
//         assignedMentees: [],
//         faculty: mentor.faculty || null
//       };
//     });

//     // 5. First pass: Match by faculty (prioritize)
//     console.log("\n🔹 PASS 1: Matching by faculty...");
    
//     // Group mentees by faculty
//     const menteesByFaculty = {};
//     allMentees.forEach(mentee => {
//       const faculty = mentee.faculty || 'unspecified';
//       if (!menteesByFaculty[faculty]) {
//         menteesByFaculty[faculty] = [];
//       }
//       menteesByFaculty[faculty].push(mentee);
//     });

//     // Log faculty distribution
//     console.log("\n📊 Mentees by faculty:");
//     Object.keys(menteesByFaculty).sort().forEach(faculty => {
//       console.log(`   ${faculty}: ${menteesByFaculty[faculty].length} mentees`);
//     });

//     // For each faculty, match mentors with mentees in same faculty
//     const facultyKeys = Object.keys(menteesByFaculty).filter(f => f !== 'unspecified');
    
//     for (const faculty of facultyKeys) {
//       const facultyMentees = menteesByFaculty[faculty];
//       const facultyMentors = allMentors.filter(m => m.faculty === faculty);
      
//       console.log(`\n📌 Faculty: ${faculty}`);
//       console.log(`   Mentors: ${facultyMentors.length}, Mentees: ${facultyMentees.length}`);
      
//       if (facultyMentors.length === 0) {
//         // No mentors in this faculty, add to unassigned for now
//         unassignedMentees.push(...facultyMentees);
//         console.log(`   ⚠️ No mentors in this faculty, ${facultyMentees.length} mentees will be assigned later`);
//         continue;
//       }

//       // Distribute mentees among faculty mentors evenly
//       let menteeIndex = 0;
//       const assignmentsPerMentor = Math.floor(facultyMentees.length / facultyMentors.length);
//       const remainder = facultyMentees.length % facultyMentors.length;
      
//       for (let i = 0; i < facultyMentors.length; i++) {
//         const mentor = facultyMentors[i];
//         const mentorData = mentorAssignments[mentor._id.toString()];
//         const numToAssign = assignmentsPerMentor + (i < remainder ? 1 : 0);
        
//         for (let j = 0; j < numToAssign; j++) {
//           if (menteeIndex < facultyMentees.length) {
//             mentorData.assignedMentees.push(facultyMentees[menteeIndex]);
//             menteeIndex++;
//           }
//         }
//       }

//       // Log assignments for this faculty
//       facultyMentors.forEach(mentor => {
//         const count = mentorAssignments[mentor._id.toString()].assignedMentees.length;
//         console.log(`   👤 Mentor ${mentor.email || mentor._id} (${mentor.faculty}): ${count} mentees`);
//       });
//     }

//     // 6. Second pass: Handle unspecified faculty and leftovers
//     console.log("\n🔹 PASS 2: Handling unspecified faculty and leftovers...");
    
//     // Get all assigned mentees to avoid duplicates
//     const assignedMenteeIds = new Set();
//     Object.values(mentorAssignments).forEach(data => {
//       data.assignedMentees.forEach(mentee => {
//         assignedMenteeIds.add(mentee._id.toString());
//       });
//     });

//     // Collect unassigned mentees (including unspecified faculty)
//     const remainingMentees = allMentees.filter(mentee => 
//       !assignedMenteeIds.has(mentee._id.toString())
//     );

//     console.log(`\n📊 Remaining unassigned mentees: ${remainingMentees.length}`);

//     if (remainingMentees.length > 0) {
//       // Distribute remaining mentees among all mentors (round-robin)
//       let mentorIndex = 0;
//       const availableMentors = allMentors.filter(m => 
//         mentorAssignments[m._id.toString()].assignedMentees.length < targetPerMentor * 1.5 // Allow some overflow
//       );

//       console.log(`\n🔄 Distributing ${remainingMentees.length} remaining mentees among ${availableMentors.length} mentors`);

//       for (const mentee of remainingMentees) {
//         if (availableMentors.length === 0) break;
        
//         const mentor = availableMentors[mentorIndex % availableMentors.length];
//         mentorAssignments[mentor._id.toString()].assignedMentees.push(mentee);
//         mentorIndex++;
//       }
//     }

//     // 7. Gender balancing analysis
//     console.log("\n🔹 PASS 3: Gender distribution analysis...");
    
//     Object.values(mentorAssignments).forEach(data => {
//       const mentor = data.mentor;
//       const mentees = data.assignedMentees;
      
//       if (mentees.length === 0) return;
      
//       // Count genders in current assignment
//       const genderCount = { male: 0, female: 0, unspecified: 0 };
//       mentees.forEach(m => {
//         if (m.gender === 'male') genderCount.male++;
//         else if (m.gender === 'female') genderCount.female++;
//         else genderCount.unspecified++;
//       });
      
//       const total = mentees.length;
//       const malePct = total > 0 ? (genderCount.male / total * 100).toFixed(1) : 0;
//       const femalePct = total > 0 ? (genderCount.female / total * 100).toFixed(1) : 0;
      
//       console.log(`   👤 Mentor ${mentor.email || mentor._id} - ${mentees.length} mentees: ${genderCount.male}M/${genderCount.female}F/${genderCount.unspecified}? (${malePct}%/${femalePct}%)`);
//     });

//     // 8. Prepare results
//     const results = [];
//     Object.values(mentorAssignments).forEach(data => {
//       if (data.assignedMentees.length > 0) {
//         results.push({
//           mentor: {
//             id: data.mentor._id,
//             email: data.mentor.email || 'No email',
//             fullName: data.mentor.fullName || data.mentor.email || 'Unknown',
//             faculty: data.mentor.faculty || 'Not specified',
//             gender: data.mentor.gender || 'Not specified',
//             status: data.mentor.status || 'registered',
//             source: data.mentor.source || 'registered'
//           },
//           mentees: data.assignedMentees.map(m => ({
//             id: m._id,
//             email: m.email || 'No email',
//             fullName: m.fullName || m.email || 'Unknown',
//             faculty: m.faculty || 'Not specified',
//             gender: m.gender || 'Not specified',
//             status: m.status || 'registered',
//             source: m.source || 'registered'
//           }))
//         });
//       }
//     });

//     // Calculate matched count
//     const matchedCount = results.reduce((sum, r) => sum + r.mentees.length, 0);

//     // 9. Calculate statistics
//     const stats = {
//       totalMentors: allMentors.length,
//       totalMentees: allMentees.length,
//       matchedMentees: matchedCount,
//       unassignedMentees: allMentees.length - matchedCount,
//       averagePerMentor: (allMentees.length / allMentors.length).toFixed(2),
//       duplicateMentorsSkipped: duplicateMentors,
//       duplicateMenteesSkipped: duplicateMentees,
//       mentorAssignments: results.map(r => ({
//         mentorEmail: r.mentor.email,
//         mentorFaculty: r.mentor.faculty,
//         menteeCount: r.mentees.length,
//         menteeFaculties: [...new Set(r.mentees.map(m => m.faculty))],
//         genderBreakdown: {
//           male: r.mentees.filter(m => m.gender === 'male').length,
//           female: r.mentees.filter(m => m.gender === 'female').length,
//           unspecified: r.mentees.filter(m => !m.gender || m.gender === 'Not specified').length
//         }
//       }))
//     };

//     console.log("=".repeat(60));
//     console.log("✅ MATCHING COMPLETE");
//     console.log("=".repeat(60));
//     console.log(`📊 Final Statistics:`);
//     console.log(`   • Mentors: ${stats.totalMentors}`);
//     console.log(`   • Mentees: ${stats.totalMentees}`);
//     console.log(`   • Matched: ${stats.matchedMentees}`);
//     console.log(`   • Unassigned: ${stats.unassignedMentees}`);
//     console.log(`   • Average per mentor: ${stats.averagePerMentor}`);
//     console.log(`   • Duplicates skipped: ${stats.duplicateMentorsSkipped} mentors, ${stats.duplicateMenteesSkipped} mentees`);

//     // Return results
//     res.json({
//       success: true,
//       message: "Matching algorithm completed",
//       stats,
//       matches: results
//     });

//   } catch (error) {
//     console.error("❌ Error in matching algorithm:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Failed to run matching algorithm"
//     });
//   }
// };

// // /**
// //  * Get matching statistics without running the algorithm
// //  */
export const getMatchingStats = async (req, res) => {
  try {
    const mentors = await User.find({ role: "mentor" }).lean();
    const mentees = await User.find({ role: "mentee" }).lean();
    
    const preloadedMentors = await PreLoaded.find({ role: "mentor" }).lean();
    const preloadedMentees = await PreLoaded.find({ role: "mentee" }).lean();

    // Track duplicates for accurate stats
    const mentorEmails = new Set();
    const menteeEmails = new Set();
    
    let uniqueMentors = 0;
    let uniqueMentees = 0;
    let duplicateMentors = 0;
    let duplicateMentees = 0;

    // Count unique mentors
    [...mentors, ...preloadedMentors].forEach(m => {
      if (!mentorEmails.has(m.email)) {
        mentorEmails.add(m.email);
        uniqueMentors++;
      } else {
        duplicateMentors++;
      }
    });

    // Count unique mentees
    [...mentees, ...preloadedMentees].forEach(m => {
      if (!menteeEmails.has(m.email)) {
        menteeEmails.add(m.email);
        uniqueMentees++;
      } else {
        duplicateMentees++;
      }
    });

    // Faculty distribution (using unique users)
    const mentorFaculty = {};
    const menteeFaculty = {};
    
    // Reset sets for faculty counting
    const facultyMentorEmails = new Set();
    const facultyMenteeEmails = new Set();
    
    [...mentors, ...preloadedMentors].forEach(m => {
      if (!facultyMentorEmails.has(m.email)) {
        facultyMentorEmails.add(m.email);
        const fac = m.faculty || 'unspecified';
        mentorFaculty[fac] = (mentorFaculty[fac] || 0) + 1;
      }
    });

    [...mentees, ...preloadedMentees].forEach(m => {
      if (!facultyMenteeEmails.has(m.email)) {
        facultyMenteeEmails.add(m.email);
        const fac = m.faculty || 'unspecified';
        menteeFaculty[fac] = (menteeFaculty[fac] || 0) + 1;
      }
    });

    // Gender distribution (using unique users)
    const mentorGender = { male: 0, female: 0, unspecified: 0 };
    const menteeGender = { male: 0, female: 0, unspecified: 0 };
    
    const genderMentorEmails = new Set();
    const genderMenteeEmails = new Set();

    [...mentors, ...preloadedMentors].forEach(m => {
      if (!genderMentorEmails.has(m.email)) {
        genderMentorEmails.add(m.email);
        if (m.gender === 'male') mentorGender.male++;
        else if (m.gender === 'female') mentorGender.female++;
        else mentorGender.unspecified++;
      }
    });

    [...mentees, ...preloadedMentees].forEach(m => {
      if (!genderMenteeEmails.has(m.email)) {
        genderMenteeEmails.add(m.email);
        if (m.gender === 'male') menteeGender.male++;
        else if (m.gender === 'female') menteeGender.female++;
        else menteeGender.unspecified++;
      }
    });

    res.json({
      success: true,
      data: {
        totals: {
          totalUniqueMentors: uniqueMentors,
          totalUniqueMentees: uniqueMentees,
          registeredMentors: mentors.length,
          registeredMentees: mentees.length,
          preloadedMentors: preloadedMentors.length,
          preloadedMentees: preloadedMentees.length,
          duplicateMentors,
          duplicateMentees
        },
        facultyDistribution: {
          mentors: mentorFaculty,
          mentees: menteeFaculty
        },
        genderDistribution: {
          mentors: mentorGender,
          mentees: menteeGender
        },
        estimatedGroups: Math.ceil(uniqueMentees / uniqueMentors)
      }
    });

  } catch (error) {
    console.error("❌ Error getting matching stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get matching statistics"
    });
  }
};


// 2.0
export const matchMentorsAndMentees = async (req, res) => {
  try {
    console.log("=".repeat(60));
    console.log("🔍 STARTING MENTOR-MENTEE MATCHING ALGORITHM");
    console.log("=".repeat(60));

    // 1. Fetch all users from both collections
    const users = await User.find({ 
      role: { $in: ["mentor", "mentee"] } 
    }).lean();
    
    const preloaded = await PreLoaded.find({ 
      role: { $in: ["mentor", "mentee"] } 
    }).lean();

    console.log(`📊 Found ${users.length} registered users`);
    console.log(`📊 Found ${preloaded.length} pre-loaded users`);

    // 2. Create maps for easy lookup
    const userMap = new Map(); // Users by email (for names)
    users.forEach(u => {
      userMap.set(u.email, u);
    });

    const preloadedMap = new Map(); // PreLoaded by email (for gender/faculty)
    preloaded.forEach(p => {
      preloadedMap.set(p.email, p);
    });

    // 3. Track unique emails (combine both collections)
    const allEmails = new Set();
    
    // Add all emails from preloaded (since all users should be in preloaded)
    preloaded.forEach(p => allEmails.add(p.email));
    // Also add any users that might not be in preloaded (just in case)
    users.forEach(u => allEmails.add(u.email));

    console.log(`\n📊 Total unique users: ${allEmails.size}`);

    // 4. Separate mentors and mentees
    const mentors = [];
    const mentees = [];

    allEmails.forEach(email => {
      const userData = userMap.get(email);
      const preloadedData = preloadedMap.get(email);
      
      // If no preloaded data, skip (shouldn't happen based on your statement)
      if (!preloadedData) {
        console.log(`⚠️ Warning: ${email} has no preloaded data, skipping`);
        return;
      }

      // Build the user object
      const enrichedUser = {
        _id: preloadedData._id, // Use preloaded ID as primary
        email: email,
        fullName: userData?.fullName || email, // Use name from User, fallback to email
        role: preloadedData.role,
        faculty: preloadedData.faculty || null,
        gender: preloadedData.gender || 'unspecified',
        hasCompletedProfile: preloadedData.hasCompletedProfile || false,
        status: userData ? 'registered' : 'preloaded',
        source: userData ? 'user+preloaded' : 'preloaded-only'
      };

      // Add to appropriate array based on role
      if (preloadedData.role === 'mentor') {
        mentors.push(enrichedUser);
      } else if (preloadedData.role === 'mentee') {
        mentees.push(enrichedUser);
      }
    });

    console.log(`\n📊 After enrichment:`);
    console.log(`   • Mentors: ${mentors.length}`);
    console.log(`   • Mentees: ${mentees.length}`);
    console.log(`   • Registered users: ${users.length}`);
    console.log(`   • Pre-loaded only: ${preloaded.length - users.length}`);
    
    if (mentors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No mentors available for matching"
      });
    }

    // 5. Calculate target mentees per mentor
    const targetPerMentor = Math.ceil(mentees.length / mentors.length);
    console.log(`\n🎯 Target: ~${targetPerMentor} mentees per mentor (range: ${targetPerMentor-1}-${targetPerMentor+1})`);

    // 6. Initialize data structures
    const matches = [];
    const unassignedMentees = [];
    const mentorAssignments = {};
    
    // Track mentor counts
    mentors.forEach(mentor => {
      mentorAssignments[mentor._id.toString()] = {
        mentor,
        assignedMentees: [],
        faculty: mentor.faculty || null
      };
    });

    // 7. First pass: Match by faculty (prioritize)
    console.log("\n🔹 PASS 1: Matching by faculty...");
    
    // Group mentees by faculty
    const menteesByFaculty = {};
    mentees.forEach(mentee => {
      const faculty = mentee.faculty || 'unspecified';
      if (!menteesByFaculty[faculty]) {
        menteesByFaculty[faculty] = [];
      }
      menteesByFaculty[faculty].push(mentee);
    });

    // Log faculty distribution
    console.log("\n📊 Mentees by faculty:");
    Object.keys(menteesByFaculty).sort().forEach(faculty => {
      console.log(`   ${faculty}: ${menteesByFaculty[faculty].length} mentees`);
    });

    // For each faculty, match mentors with mentees in same faculty
    const facultyKeys = Object.keys(menteesByFaculty).filter(f => f !== 'unspecified');
    
    for (const faculty of facultyKeys) {
      const facultyMentees = menteesByFaculty[faculty];
      const facultyMentors = mentors.filter(m => m.faculty === faculty);
      
      console.log(`\n📌 Faculty: ${faculty}`);
      console.log(`   Mentors: ${facultyMentors.length}, Mentees: ${facultyMentees.length}`);
      
      if (facultyMentors.length === 0) {
        // No mentors in this faculty, add to unassigned for now
        unassignedMentees.push(...facultyMentees);
        console.log(`   ⚠️ No mentors in this faculty, ${facultyMentees.length} mentees will be assigned later`);
        continue;
      }

      // Distribute mentees among faculty mentors evenly
      let menteeIndex = 0;
      const assignmentsPerMentor = Math.floor(facultyMentees.length / facultyMentors.length);
      const remainder = facultyMentees.length % facultyMentors.length;
      
      for (let i = 0; i < facultyMentors.length; i++) {
        const mentor = facultyMentors[i];
        const mentorData = mentorAssignments[mentor._id.toString()];
        const numToAssign = assignmentsPerMentor + (i < remainder ? 1 : 0);
        
        for (let j = 0; j < numToAssign; j++) {
          if (menteeIndex < facultyMentees.length) {
            mentorData.assignedMentees.push(facultyMentees[menteeIndex]);
            menteeIndex++;
          }
        }
      }

      // Log assignments for this faculty
      facultyMentors.forEach(mentor => {
        const count = mentorAssignments[mentor._id.toString()].assignedMentees.length;
        console.log(`   👤 Mentor ${mentor.fullName || mentor.email} (${mentor.faculty}): ${count} mentees`);
      });
    }

    // 8. Second pass: Handle unspecified faculty and leftovers
    console.log("\n🔹 PASS 2: Handling unspecified faculty and leftovers...");
    
    // Get all assigned mentees to avoid duplicates
    const assignedMenteeIds = new Set();
    Object.values(mentorAssignments).forEach(data => {
      data.assignedMentees.forEach(mentee => {
        assignedMenteeIds.add(mentee._id.toString());
      });
    });

    // Collect unassigned mentees (including unspecified faculty)
    const remainingMentees = mentees.filter(mentee => 
      !assignedMenteeIds.has(mentee._id.toString())
    );

    console.log(`\n📊 Remaining unassigned mentees: ${remainingMentees.length}`);

    if (remainingMentees.length > 0) {
      // Distribute remaining mentees among all mentors (round-robin)
      let mentorIndex = 0;
      const availableMentors = mentors.filter(m => 
        mentorAssignments[m._id.toString()].assignedMentees.length < targetPerMentor * 1.5 // Allow some overflow
      );

      console.log(`\n🔄 Distributing ${remainingMentees.length} remaining mentees among ${availableMentors.length} mentors`);

      for (const mentee of remainingMentees) {
        if (availableMentors.length === 0) break;
        
        const mentor = availableMentors[mentorIndex % availableMentors.length];
        mentorAssignments[mentor._id.toString()].assignedMentees.push(mentee);
        mentorIndex++;
      }
    }

    // 9. Gender balancing analysis
    console.log("\n🔹 PASS 3: Gender distribution analysis...");
    
    Object.values(mentorAssignments).forEach(data => {
      const mentor = data.mentor;
      const mentees = data.assignedMentees;
      
      if (mentees.length === 0) return;
      
      // Count genders in current assignment
      const genderCount = { male: 0, female: 0, unspecified: 0 };
      mentees.forEach(m => {
        if (m.gender === 'male') genderCount.male++;
        else if (m.gender === 'female') genderCount.female++;
        else genderCount.unspecified++;
      });
      
      const total = mentees.length;
      const malePct = total > 0 ? (genderCount.male / total * 100).toFixed(1) : 0;
      const femalePct = total > 0 ? (genderCount.female / total * 100).toFixed(1) : 0;
      
      console.log(`   👤 Mentor ${mentor.fullName || mentor.email} - ${mentees.length} mentees: ${genderCount.male}M/${genderCount.female}F/${genderCount.unspecified}? (${malePct}%/${femalePct}%)`);
    });

    // 10. Prepare results
    const results = [];
    Object.values(mentorAssignments).forEach(data => {
      if (data.assignedMentees.length > 0) {
        results.push({
          mentor: {
            id: data.mentor._id,
            email: data.mentor.email || 'No email',
            fullName: data.mentor.fullName || data.mentor.email || 'Unknown',
            faculty: data.mentor.faculty || 'Not specified',
            gender: data.mentor.gender || 'Not specified',
            status: data.mentor.status || 'registered',
            source: data.mentor.source || 'unknown'
          },
          mentees: data.assignedMentees.map(m => ({
            id: m._id,
            email: m.email || 'No email',
            fullName: m.fullName || m.email || 'Unknown',
            faculty: m.faculty || 'Not specified',
            gender: m.gender || 'Not specified',
            status: m.status || 'registered',
            source: m.source || 'unknown'
          }))
        });
      }
    });

    // Calculate matched count
    const matchedCount = results.reduce((sum, r) => sum + r.mentees.length, 0);

    // 11. Calculate statistics
    const stats = {
      totalMentors: mentors.length,
      totalMentees: mentees.length,
      matchedMentees: matchedCount,
      unassignedMentees: mentees.length - matchedCount,
      averagePerMentor: (mentees.length / mentors.length).toFixed(2),
      registeredUsers: users.length,
      preloadedOnly: preloaded.length - users.length,
      mentorAssignments: results.map(r => ({
        mentorEmail: r.mentor.email,
        mentorName: r.mentor.fullName,
        mentorFaculty: r.mentor.faculty,
        menteeCount: r.mentees.length,
        menteeFaculties: [...new Set(r.mentees.map(m => m.faculty))],
        genderBreakdown: {
          male: r.mentees.filter(m => m.gender === 'male').length,
          female: r.mentees.filter(m => m.gender === 'female').length,
          unspecified: r.mentees.filter(m => !m.gender || m.gender === 'Not specified').length
        }
      }))
    };

    console.log("=".repeat(60));
    console.log("✅ MATCHING COMPLETE");
    console.log("=".repeat(60));
    console.log(`📊 Final Statistics:`);
    console.log(`   • Mentors: ${stats.totalMentors}`);
    console.log(`   • Mentees: ${stats.totalMentees}`);
    console.log(`   • Matched: ${stats.matchedMentees}`);
    console.log(`   • Unassigned: ${stats.unassignedMentees}`);
    console.log(`   • Average per mentor: ${stats.averagePerMentor}`);
    console.log(`   • Registered users: ${stats.registeredUsers}`);
    console.log(`   • Pre-loaded only: ${stats.preloadedOnly}`);

    // Return results
    res.json({
      success: true,
      message: "Matching algorithm completed",
      stats,
      matches: results
    });

  } catch (error) {
    console.error("❌ Error in matching algorithm:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to run matching algorithm"
    });
  }
};


/**
 * Match mentors with mentees
 * Prioritizes faculty matching and balances gender
 * Using ONLY PreLoaded data (User model is ignored)
 */
// export const matchMentorsAndMentees = async (req, res) => {
//   try {
//     console.log("=".repeat(60));
//     console.log("🔍 STARTING MENTOR-MENTEE MATCHING ALGORITHM");
//     console.log("=".repeat(60));

//     // 1. Fetch ONLY from PreLoaded - ignore User model completely
//     const preloadedMentors = await PreLoaded.find({ role: "mentor" }).lean();
//     const preloadedMentees = await PreLoaded.find({ role: "mentee" }).lean();

//     console.log(`📊 Found ${preloadedMentors.length} mentors in PreLoaded`);
//     console.log(`📊 Found ${preloadedMentees.length} mentees in PreLoaded`);

//     // 2. Format the data consistently
//     const mentors = preloadedMentors.map(m => ({
//       _id: m._id,
//       email: m.email,
//       fullName: m.email || 'Pending Registration',
//       role: m.role,
//       faculty: m.faculty || null,
//       gender: m.gender || 'unspecified',
//       hasCompletedProfile: m.hasCompletedProfile || false,
//       status: 'preloaded',
//       source: 'preloaded'
//     }));

//     const mentees = preloadedMentees.map(m => ({
//       _id: m._id,
//       email: m.email,
//       fullName: m.email || 'Pending Registration',
//       role: m.role,
//       faculty: m.faculty || null,
//       gender: m.gender || 'unspecified',
//       hasCompletedProfile: m.hasCompletedProfile || false,
//       status: 'preloaded',
//       source: 'preloaded'
//     }));

//     console.log(`\n📊 After formatting:`);
//     console.log(`   • Mentors: ${mentors.length}`);
//     console.log(`   • Mentees: ${mentees.length}`);
    
//     if (mentors.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No mentors available for matching"
//       });
//     }

//     // 3. Calculate ideal distribution
//     const totalMentees = mentees.length;
//     const totalMentors = mentors.length;
//     const basePerMentor = Math.floor(totalMentees / totalMentors);
//     const remainder = totalMentees % totalMentors;
    
//     console.log(`\n🎯 Target distribution:`);
//     console.log(`   • ${totalMentors - remainder} mentors will get ${basePerMentor} mentees`);
//     console.log(`   • ${remainder} mentors will get ${basePerMentor + 1} mentees`);

//     // 4. Initialize mentor assignments with counters
//     const mentorAssignments = {};
//     mentors.forEach(mentor => {
//       mentorAssignments[mentor._id.toString()] = {
//         mentor,
//         assignedMentees: [],
//         faculty: mentor.faculty || null
//       };
//     });

//     // 5. First pass: Match by faculty (with balanced distribution)
//     console.log("\n🔹 PASS 1: Matching by faculty (balanced)...");
    
//     // Group mentees by faculty
//     const menteesByFaculty = {};
//     mentees.forEach(mentee => {
//       const faculty = mentee.faculty || 'unspecified';
//       if (!menteesByFaculty[faculty]) {
//         menteesByFaculty[faculty] = [];
//       }
//       menteesByFaculty[faculty].push(mentee);
//     });

//     // Log faculty distribution
//     console.log("\n📊 Mentees by faculty:");
//     Object.keys(menteesByFaculty).sort().forEach(faculty => {
//       console.log(`   ${faculty}: ${menteesByFaculty[faculty].length} mentees`);
//     });

//     // Helper function to get mentors sorted by current load
//     const getAvailableMentors = (faculty) => {
//       return mentors
//         .filter(m => m.faculty === faculty)
//         .map(m => ({
//           ...m,
//           currentLoad: mentorAssignments[m._id.toString()].assignedMentees.length
//         }))
//         .sort((a, b) => a.currentLoad - b.currentLoad); // Sort by least loaded first
//     };

//     // Process each faculty
//     const facultyKeys = Object.keys(menteesByFaculty).filter(f => f !== 'unspecified');
    
//     for (const faculty of facultyKeys) {
//       const facultyMentees = menteesByFaculty[faculty];
//       const facultyMentors = mentors.filter(m => m.faculty === faculty);
      
//       console.log(`\n📌 Faculty: ${faculty}`);
//       console.log(`   Mentors: ${facultyMentors.length}, Mentees: ${facultyMentees.length}`);
      
//       if (facultyMentors.length === 0) {
//         // No mentors in this faculty, these mentees will be handled in pass 2
//         console.log(`   ⚠️ No mentors in this faculty, ${facultyMentees.length} mentees will be assigned later`);
//         continue;
//       }

//       // Calculate how many mentees each mentor should ideally get from this faculty
//       const totalFacultyMentees = facultyMentees.length;
//       const totalFacultyMentors = facultyMentors.length;
//       const basePerFacultyMentor = Math.floor(totalFacultyMentees / totalFacultyMentors);
//       const facultyRemainder = totalFacultyMentees % totalFacultyMentors;
      
//       // Assign mentees using round-robin to ensure balance
//       let menteeIndex = 0;
      
//       // Create a rotating list of mentors sorted by current load
//       for (let round = 0; round < basePerFacultyMentor; round++) {
//         const sortedMentors = getAvailableMentors(faculty);
//         for (const mentor of sortedMentors) {
//           if (menteeIndex < facultyMentees.length) {
//             mentorAssignments[mentor._id.toString()].assignedMentees.push(facultyMentees[menteeIndex]);
//             menteeIndex++;
//           }
//         }
//       }
      
//       // Handle remainder - assign to mentors with lowest current load
//       const sortedMentors = getAvailableMentors(faculty);
//       for (let i = 0; i < facultyRemainder && menteeIndex < facultyMentees.length; i++) {
//         const mentor = sortedMentors[i % sortedMentors.length];
//         mentorAssignments[mentor._id.toString()].assignedMentees.push(facultyMentees[menteeIndex]);
//         menteeIndex++;
//       }

//       // Log assignments for this faculty
//       facultyMentors.forEach(mentor => {
//         const count = mentorAssignments[mentor._id.toString()].assignedMentees.length;
//         console.log(`   👤 Mentor ${mentor.email || mentor._id} (${mentor.faculty}): ${count} mentees`);
//       });
//     }

//     // 6. Second pass: Handle unspecified faculty and leftovers with perfect balance
//     console.log("\n🔹 PASS 2: Balanced distribution of remaining mentees...");
    
//     // Get all assigned mentees
//     const assignedMenteeIds = new Set();
//     Object.values(mentorAssignments).forEach(data => {
//       data.assignedMentees.forEach(mentee => {
//         assignedMenteeIds.add(mentee._id.toString());
//       });
//     });

//     // Collect unassigned mentees (including unspecified faculty)
//     const remainingMentees = mentees.filter(mentee => 
//       !assignedMenteeIds.has(mentee._id.toString())
//     );

//     console.log(`\n📊 Remaining unassigned mentees: ${remainingMentees.length}`);

//     if (remainingMentees.length > 0) {
//       // Sort mentors by current load (least loaded first)
//       const mentorLoads = mentors.map(mentor => ({
//         mentor,
//         currentLoad: mentorAssignments[mentor._id.toString()].assignedMentees.length
//       })).sort((a, b) => a.currentLoad - b.currentLoad);

//       console.log(`\n🔄 Current mentor loads before distribution:`);
//       mentorLoads.slice(0, 5).forEach(({ mentor, currentLoad }) => {
//         console.log(`   • ${mentor.email || mentor._id}: ${currentLoad} mentees`);
//       });

//       // Distribute remaining mentees evenly using round-robin
//       let mentorIndex = 0;
//       for (const mentee of remainingMentees) {
//         // Always pick the least loaded mentor
//         const sortedLoads = mentors
//           .map(m => ({
//             mentor: m,
//             load: mentorAssignments[m._id.toString()].assignedMentees.length
//           }))
//           .sort((a, b) => a.load - b.load);
        
//         const leastLoadedMentor = sortedLoads[0].mentor;
//         mentorAssignments[leastLoadedMentor._id.toString()].assignedMentees.push(mentee);
        
//         // Log every 10th assignment to avoid spam
//         if (mentorIndex % 10 === 0) {
//           console.log(`   ➕ Assigned mentee ${mentorIndex + 1} to ${leastLoadedMentor.email || leastLoadedMentor._id} (new load: ${sortedLoads[0].load + 1})`);
//         }
//         mentorIndex++;
//       }
//     }

//     // 7. Final balance check
//     console.log("\n🔹 FINAL DISTRIBUTION:");
//     const finalLoads = mentors.map(mentor => ({
//       name: mentor.email || mentor._id,
//       faculty: mentor.faculty || 'unspecified',
//       count: mentorAssignments[mentor._id.toString()].assignedMentees.length
//     })).sort((a, b) => a.count - b.count);

//     console.log("\n📊 Mentor loads (sorted):");
//     finalLoads.forEach(({ name, faculty, count }) => {
//       console.log(`   • ${name} (${faculty}): ${count} mentees`);
//     });

//     const minLoad = Math.min(...finalLoads.map(l => l.count));
//     const maxLoad = Math.max(...finalLoads.map(l => l.count));
//     const loadDiff = maxLoad - minLoad;
    
//     console.log(`\n📊 Balance check:`);
//     console.log(`   • Min load: ${minLoad}`);
//     console.log(`   • Max load: ${maxLoad}`);
//     console.log(`   • Difference: ${loadDiff}`);
//     console.log(`   • ${loadDiff <= 1 ? '✅ Perfectly balanced!' : '⚠️ Needs improvement'}`);

//     // 8. Prepare results
//     const results = [];
//     Object.values(mentorAssignments).forEach(data => {
//       if (data.assignedMentees.length > 0) {
//         results.push({
//           mentor: {
//             id: data.mentor._id,
//             email: data.mentor.email || 'No email',
//             fullName: data.mentor.fullName || data.mentor.email || 'Unknown',
//             faculty: data.mentor.faculty || 'Not specified',
//             gender: data.mentor.gender || 'Not specified',
//             status: data.mentor.status || 'preloaded',
//             source: data.mentor.source || 'preloaded'
//           },
//           mentees: data.assignedMentees.map(m => ({
//             id: m._id,
//             email: m.email || 'No email',
//             fullName: m.fullName || m.email || 'Unknown',
//             faculty: m.faculty || 'Not specified',
//             gender: m.gender || 'Not specified',
//             status: m.status || 'preloaded',
//             source: m.source || 'preloaded'
//           }))
//         });
//       }
//     });

//     const matchedCount = results.reduce((sum, r) => sum + r.mentees.length, 0);

//     const stats = {
//       totalMentors: mentors.length,
//       totalMentees: mentees.length,
//       matchedMentees: matchedCount,
//       unassignedMentees: mentees.length - matchedCount,
//       averagePerMentor: (mentees.length / mentors.length).toFixed(2),
//       minMentees: minLoad,
//       maxMentees: maxLoad,
//       balanceDifference: loadDiff
//     };

//     console.log("=".repeat(60));
//     console.log("✅ MATCHING COMPLETE");
//     console.log("=".repeat(60));
//     console.log(`📊 Final Statistics:`);
//     console.log(`   • Mentors: ${stats.totalMentors}`);
//     console.log(`   • Mentees: ${stats.totalMentees}`);
//     console.log(`   • Matched: ${stats.matchedMentees}`);
//     console.log(`   • Unassigned: ${stats.unassignedMentees}`);
//     console.log(`   • Average per mentor: ${stats.averagePerMentor}`);
//     console.log(`   • Range: ${stats.minMentees} - ${stats.maxMentees} (diff: ${stats.balanceDifference})`);

//     res.json({
//       success: true,
//       message: "Matching algorithm completed",
//       stats,
//       matches: results
//     });

//   } catch (error) {
//     console.error("❌ Error in matching algorithm:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Failed to run matching algorithm"
//     });
//   }
// };





/**
 * Match mentors with mentees
 * Prioritizes faculty matching and balances gender
 * TEMPORARY: Uses PreLoaded data only for faculty/gender until User model is updated
 */
// export const matchMentorsAndMentees = async (req, res) => {
//   try {
//     console.log("=".repeat(60));
//     console.log("🔍 STARTING MENTOR-MENTEE MATCHING ALGORITHM");
//     console.log("=".repeat(60));

//     // 1. Fetch all mentors and mentees from User model (for emails and IDs)
//     const users = await User.find({ 
//       role: { $in: ["mentor", "mentee"] } 
//     }).lean();
    
//     // Fetch all preloaded users (these have the correct faculty/gender)
//     const preloaded = await PreLoaded.find({}).lean();

//     console.log(`📊 Found ${users.length} registered users`);
//     console.log(`📊 Found ${preloaded.length} pre-loaded users`);

//     // 2. Create maps for easy lookup
//     const preloadedMap = new Map();
//     preloaded.forEach(p => {
//       preloadedMap.set(p.email, p);
//     });

//     // 3. Separate mentors and mentees, using PreLoaded data where available
//     const mentors = [];
//     const mentees = [];

//     users.forEach(user => {
//       const preloadedData = preloadedMap.get(user.email);
      
//       // Use preloaded data if available, otherwise use user data (with fallbacks)
//       const enrichedUser = {
//         ...user,
//         // Use preloaded faculty/gender if available, otherwise use defaults
//         faculty: preloadedData?.faculty || null,
//         gender: preloadedData?.gender || user.gender || 'unspecified',
//         hasCompletedProfile: preloadedData?.hasCompletedProfile || false,
//         source: preloadedData ? 'enriched' : 'user-only'
//       };

//       if (user.role === 'mentor') {
//         mentors.push(enrichedUser);
//       } else if (user.role === 'mentee') {
//         mentees.push(enrichedUser);
//       }
//     });

//     // Also include preloaded users who haven't registered yet
//     preloaded.forEach(p => {
//       const userExists = users.some(u => u.email === p.email);
      
//       if (!userExists) {
//         const pendingUser = {
//           _id: p._id,
//           email: p.email,
//           fullName: 'Pending Registration',
//           role: p.role,
//           faculty: p.faculty || null,
//           gender: p.gender || 'unspecified',
//           hasCompletedProfile: p.hasCompletedProfile || false,
//           status: 'preloaded',
//           source: 'preloaded-only'
//         };

//         if (p.role === 'mentor') {
//           mentors.push(pendingUser);
//         } else if (p.role === 'mentee') {
//           mentees.push(pendingUser);
//         }
//       }
//     });

//     console.log(`\n📊 After enrichment:`);
//     console.log(`   • Mentors: ${mentors.length}`);
//     console.log(`   • Mentees: ${mentees.length}`);
    
//     if (mentors.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No mentors available for matching"
//       });
//     }

//     // 4. Calculate target mentees per mentor
//     const targetPerMentor = Math.ceil(mentees.length / mentors.length);
//     console.log(`\n🎯 Target: ~${targetPerMentor} mentees per mentor`);

//     // 5. Initialize data structures
//     const mentorAssignments = {};
//     const unassignedMentees = [];
    
//     mentors.forEach(mentor => {
//       mentorAssignments[mentor._id.toString()] = {
//         mentor,
//         assignedMentees: [],
//         faculty: mentor.faculty || null
//       };
//     });

//     // 6. First pass: Match by faculty
//     console.log("\n🔹 PASS 1: Matching by faculty...");
    
//     // Group mentees by faculty
//     const menteesByFaculty = {};
//     mentees.forEach(mentee => {
//       const faculty = mentee.faculty || 'unspecified';
//       if (!menteesByFaculty[faculty]) {
//         menteesByFaculty[faculty] = [];
//       }
//       menteesByFaculty[faculty].push(mentee);
//     });

//     // Log faculty distribution
//     console.log("\n📊 Mentees by faculty:");
//     Object.keys(menteesByFaculty).sort().forEach(faculty => {
//       console.log(`   ${faculty}: ${menteesByFaculty[faculty].length} mentees`);
//     });

//     // Match by faculty
//     const facultyKeys = Object.keys(menteesByFaculty).filter(f => f !== 'unspecified');
    
//     for (const faculty of facultyKeys) {
//       const facultyMentees = menteesByFaculty[faculty];
//       const facultyMentors = mentors.filter(m => m.faculty === faculty);
      
//       console.log(`\n📌 Faculty: ${faculty}`);
//       console.log(`   Mentors: ${facultyMentors.length}, Mentees: ${facultyMentees.length}`);
      
//       if (facultyMentors.length === 0) {
//         unassignedMentees.push(...facultyMentees);
//         console.log(`   ⚠️ No mentors in this faculty, ${facultyMentees.length} mentees will be assigned later`);
//         continue;
//       }

//       // Distribute mentees evenly
//       let menteeIndex = 0;
//       const assignmentsPerMentor = Math.floor(facultyMentees.length / facultyMentors.length);
//       const remainder = facultyMentees.length % facultyMentors.length;
      
//       for (let i = 0; i < facultyMentors.length; i++) {
//         const mentor = facultyMentors[i];
//         const mentorData = mentorAssignments[mentor._id.toString()];
//         const numToAssign = assignmentsPerMentor + (i < remainder ? 1 : 0);
        
//         for (let j = 0; j < numToAssign; j++) {
//           if (menteeIndex < facultyMentees.length) {
//             mentorData.assignedMentees.push(facultyMentees[menteeIndex]);
//             menteeIndex++;
//           }
//         }
//       }
//     }

//     // 7. Second pass: Handle unspecified faculty and leftovers
//     console.log("\n🔹 PASS 2: Handling unspecified faculty and leftovers...");
    
//     const assignedMenteeIds = new Set();
//     Object.values(mentorAssignments).forEach(data => {
//       data.assignedMentees.forEach(mentee => {
//         assignedMenteeIds.add(mentee._id.toString());
//       });
//     });

//     const remainingMentees = mentees.filter(mentee => 
//       !assignedMenteeIds.has(mentee._id.toString())
//     );

//     console.log(`\n📊 Remaining unassigned mentees: ${remainingMentees.length}`);

//     if (remainingMentees.length > 0) {
//       let mentorIndex = 0;
//       const availableMentors = mentors.filter(m => 
//         mentorAssignments[m._id.toString()].assignedMentees.length < targetPerMentor * 1.5
//       );

//       console.log(`\n🔄 Distributing ${remainingMentees.length} remaining mentees among ${availableMentors.length} mentors`);

//       for (const mentee of remainingMentees) {
//         if (availableMentors.length === 0) break;
        
//         const mentor = availableMentors[mentorIndex % availableMentors.length];
//         mentorAssignments[mentor._id.toString()].assignedMentees.push(mentee);
//         mentorIndex++;
//       }
//     }

//     // 8. Prepare results
//     const results = [];
//     Object.values(mentorAssignments).forEach(data => {
//       if (data.assignedMentees.length > 0) {
//         results.push({
//           mentor: {
//             id: data.mentor._id,
//             email: data.mentor.email || 'No email',
//             fullName: data.mentor.fullName || data.mentor.email || 'Unknown',
//             faculty: data.mentor.faculty || 'Not specified',
//             gender: data.mentor.gender || 'Not specified',
//             status: data.mentor.status || 'registered',
//             source: data.mentor.source || 'unknown'
//           },
//           mentees: data.assignedMentees.map(m => ({
//             id: m._id,
//             email: m.email || 'No email',
//             fullName: m.fullName || m.email || 'Unknown',
//             faculty: m.faculty || 'Not specified',
//             gender: m.gender || 'Not specified',
//             status: m.status || 'registered',
//             source: m.source || 'unknown'
//           }))
//         });
//       }
//     });

//     const matchedCount = results.reduce((sum, r) => sum + r.mentees.length, 0);

//     const stats = {
//       totalMentors: mentors.length,
//       totalMentees: mentees.length,
//       matchedMentees: matchedCount,
//       unassignedMentees: mentees.length - matchedCount,
//       averagePerMentor: (mentees.length / mentors.length).toFixed(2),
//     };

//     console.log("=".repeat(60));
//     console.log("✅ MATCHING COMPLETE");
//     console.log("=".repeat(60));
//     console.log(`📊 Final Statistics:`);
//     console.log(`   • Mentors: ${stats.totalMentors}`);
//     console.log(`   • Mentees: ${stats.totalMentees}`);
//     console.log(`   • Matched: ${stats.matchedMentees}`);
//     console.log(`   • Unassigned: ${stats.unassignedMentees}`);
//     console.log(`   • Average per mentor: ${stats.averagePerMentor}`);

//     res.json({
//       success: true,
//       message: "Matching algorithm completed",
//       stats,
//       matches: results
//     });

//   } catch (error) {
//     console.error("❌ Error in matching algorithm:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Failed to run matching algorithm"
//     });
//   }
// };