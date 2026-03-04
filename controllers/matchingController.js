// controllers/matchingController.js
import User from "../models/users.js";
import PreLoaded from "../models/preLoaded.js";
import UserAgreement from "../models/UserAgreement.js";

/**
 * Get matching statistics without running the algorithm
 */
export const getMatchingStats = async (req, res) => {
  try {
    // Get all users who have agreed to the contract
    const agreements = await UserAgreement.find({ isAgreed: true }).distinct("user");
    
    // Get registered users who have agreed
    const users = await User.find({ 
      role: { $in: ["mentor", "mentee"] },
      _id: { $in: agreements }
    }).lean();
    
    // Get pre-loaded users
    const preloaded = await PreLoaded.find({ 
      role: { $in: ["mentor", "mentee"] } 
    }).lean();

    // Track unique emails
    const mentorEmails = new Set();
    const menteeEmails = new Set();
    
    let uniqueMentors = 0;
    let uniqueMentees = 0;
    let duplicateMentors = 0;
    let duplicateMentees = 0;

    // Process registered users first (they take precedence)
    users.forEach(user => {
      if (user.role === 'mentor') {
        if (!mentorEmails.has(user.email)) {
          mentorEmails.add(user.email);
          uniqueMentors++;
        } else {
          duplicateMentors++;
        }
      } else if (user.role === 'mentee') {
        if (!menteeEmails.has(user.email)) {
          menteeEmails.add(user.email);
          uniqueMentees++;
        } else {
          duplicateMentees++;
        }
      }
    });

    // Add pre-loaded users only if they're not already counted
    preloaded.forEach(p => {
      if (p.role === 'mentor') {
        if (!mentorEmails.has(p.email)) {
          mentorEmails.add(p.email);
          uniqueMentors++;
        } else {
          duplicateMentors++;
        }
      } else if (p.role === 'mentee') {
        if (!menteeEmails.has(p.email)) {
          menteeEmails.add(p.email);
          uniqueMentees++;
        } else {
          duplicateMentees++;
        }
      }
    });

    // Faculty distribution
    const mentorFaculty = {};
    const menteeFaculty = {};
    
    // Reset sets for faculty counting
    const facultyMentorEmails = new Set();
    const facultyMenteeEmails = new Set();
    
    users.forEach(user => {
      if (user.role === 'mentor' && !facultyMentorEmails.has(user.email)) {
        facultyMentorEmails.add(user.email);
        const fac = user.faculty || 'unspecified';
        mentorFaculty[fac] = (mentorFaculty[fac] || 0) + 1;
      } else if (user.role === 'mentee' && !facultyMenteeEmails.has(user.email)) {
        facultyMenteeEmails.add(user.email);
        const fac = user.faculty || 'unspecified';
        menteeFaculty[fac] = (menteeFaculty[fac] || 0) + 1;
      }
    });

    preloaded.forEach(p => {
      if (p.role === 'mentor' && !facultyMentorEmails.has(p.email)) {
        facultyMentorEmails.add(p.email);
        const fac = p.faculty || 'unspecified';
        mentorFaculty[fac] = (mentorFaculty[fac] || 0) + 1;
      } else if (p.role === 'mentee' && !facultyMenteeEmails.has(p.email)) {
        facultyMenteeEmails.add(p.email);
        const fac = p.faculty || 'unspecified';
        menteeFaculty[fac] = (menteeFaculty[fac] || 0) + 1;
      }
    });

    // Gender distribution
    const mentorGender = { male: 0, female: 0, unspecified: 0 };
    const menteeGender = { male: 0, female: 0, unspecified: 0 };
    
    const genderMentorEmails = new Set();
    const genderMenteeEmails = new Set();

    users.forEach(user => {
      if (user.role === 'mentor' && !genderMentorEmails.has(user.email)) {
        genderMentorEmails.add(user.email);
        if (user.gender === 'male') mentorGender.male++;
        else if (user.gender === 'female') mentorGender.female++;
        else mentorGender.unspecified++;
      } else if (user.role === 'mentee' && !genderMenteeEmails.has(user.email)) {
        genderMenteeEmails.add(user.email);
        if (user.gender === 'male') menteeGender.male++;
        else if (user.gender === 'female') menteeGender.female++;
        else menteeGender.unspecified++;
      }
    });

    preloaded.forEach(p => {
      if (p.role === 'mentor' && !genderMentorEmails.has(p.email)) {
        genderMentorEmails.add(p.email);
        if (p.gender === 'male') mentorGender.male++;
        else if (p.gender === 'female') mentorGender.female++;
        else mentorGender.unspecified++;
      } else if (p.role === 'mentee' && !genderMenteeEmails.has(p.email)) {
        genderMenteeEmails.add(p.email);
        if (p.gender === 'male') menteeGender.male++;
        else if (p.gender === 'female') menteeGender.female++;
        else menteeGender.unspecified++;
      }
    });

    res.json({
      success: true,
      data: {
        totals: {
          totalUniqueMentors: uniqueMentors,
          totalUniqueMentees: uniqueMentees,
          registeredMentors: users.filter(u => u.role === 'mentor').length,
          registeredMentees: users.filter(u => u.role === 'mentee').length,
          preloadedMentors: preloaded.filter(p => p.role === 'mentor').length,
          preloadedMentees: preloaded.filter(p => p.role === 'mentee').length,
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
        estimatedGroups: uniqueMentors > 0 ? Math.ceil(uniqueMentees / uniqueMentors) : 0
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

/**
 * Match mentors with mentees
 * Uses ONLY users who have agreed to the contract (isAgreed: true)
 */
export const matchMentorsAndMentees = async (req, res) => {
  try {
    console.log("=".repeat(60));
    console.log("🔍 STARTING MENTOR-MENTEE MATCHING ALGORITHM");
    console.log("=".repeat(60));

    // 1. Get all users who have agreed to the contract
    const agreements = await UserAgreement.find({ isAgreed: true }).distinct("user");
    
    console.log(`📊 Found ${agreements.length} users who have agreed to the contract`);

    // 2. Fetch registered users who have agreed
    const users = await User.find({ 
      role: { $in: ["mentor", "mentee"] },
      _id: { $in: agreements }
    }).lean();
    
    // 3. Fetch all pre-loaded users
    const preloaded = await PreLoaded.find({ 
      role: { $in: ["mentor", "mentee"] } 
    }).lean();

    console.log(`📊 Found ${users.length} registered users who have agreed`);
    console.log(`📊 Found ${preloaded.length} pre-loaded users`);

    // 4. Create maps for easy lookup
    const userMap = new Map(); // Users by email
    users.forEach(u => {
      userMap.set(u.email, u);
    });

    const preloadedMap = new Map(); // PreLoaded by email
    preloaded.forEach(p => {
      preloadedMap.set(p.email, p);
    });

    // 5. Track unique emails from BOTH sources
    const allEmails = new Set();
    
    // Add all emails from preloaded (all potential users)
    preloaded.forEach(p => allEmails.add(p.email));
    // Also add any users that might not be in preloaded (just in case)
    users.forEach(u => allEmails.add(u.email));

    console.log(`\n📊 Total unique users in system: ${allEmails.size}`);

    // 6. Separate mentors and mentees, ONLY including those who have agreed
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

      // Check if user has agreed (only if they're registered)
      const hasAgreed = userData ? true : false; // User exists in agreements query

      // Build the user object
      const enrichedUser = {
        _id: preloadedData._id, // Use preloaded ID as primary
        email: email,
        fullName: userData?.fullName || email, // Use name from User, fallback to email
        role: preloadedData.role,
        faculty: preloadedData.faculty || null,
        gender: preloadedData.gender || 'unspecified',
        hasCompletedProfile: preloadedData.hasCompletedProfile || false,
        hasAgreed: hasAgreed,
        status: userData ? 'registered' : 'preloaded',
        source: userData ? 'user+preloaded' : 'preloaded-only'
      };

      // Add to appropriate array based on role, ONLY if they have agreed
      if (preloadedData.role === 'mentor') {
        mentors.push(enrichedUser);
      } else if (preloadedData.role === 'mentee') {
        mentees.push(enrichedUser);
      }
    });

    // Filter to ONLY include those who have agreed
    const agreedMentors = mentors.filter(m => m.hasAgreed);
    const agreedMentees = mentees.filter(m => m.hasAgreed);

    console.log(`\n📊 After filtering for agreement:`);
    console.log(`   • Mentors who agreed: ${agreedMentors.length}/${mentors.length}`);
    console.log(`   • Mentees who agreed: ${agreedMentees.length}/${mentees.length}`);
    
    if (agreedMentors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No mentors have agreed to the contract"
      });
    }

    if (agreedMentees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No mentees have agreed to the contract"
      });
    }

    // 7. Calculate target mentees per mentor
    const targetPerMentor = Math.ceil(agreedMentees.length / agreedMentors.length);
    console.log(`\n🎯 Target: ~${targetPerMentor} mentees per mentor (range: ${targetPerMentor-1}-${targetPerMentor+1})`);

    // 8. Initialize data structures
    const matches = [];
    const unassignedMentees = [];
    const mentorAssignments = {};
    
    // Track mentor counts
    agreedMentors.forEach(mentor => {
      mentorAssignments[mentor._id.toString()] = {
        mentor,
        assignedMentees: [],
        faculty: mentor.faculty || null
      };
    });

    // 9. First pass: Match by faculty (prioritize)
    console.log("\n🔹 PASS 1: Matching by faculty...");
    
    // Group mentees by faculty
    const menteesByFaculty = {};
    agreedMentees.forEach(mentee => {
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
      const facultyMentors = agreedMentors.filter(m => m.faculty === faculty);
      
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

    // 10. Second pass: Handle unspecified faculty and leftovers
    console.log("\n🔹 PASS 2: Handling unspecified faculty and leftovers...");
    
    // Get all assigned mentees to avoid duplicates
    const assignedMenteeIds = new Set();
    Object.values(mentorAssignments).forEach(data => {
      data.assignedMentees.forEach(mentee => {
        assignedMenteeIds.add(mentee._id.toString());
      });
    });

    // Collect unassigned mentees (including unspecified faculty)
    const remainingMentees = agreedMentees.filter(mentee => 
      !assignedMenteeIds.has(mentee._id.toString())
    );

    console.log(`\n📊 Remaining unassigned mentees: ${remainingMentees.length}`);

    if (remainingMentees.length > 0) {
      // Sort mentors by current load (least loaded first)
      const mentorLoads = agreedMentors.map(mentor => ({
        mentor,
        currentLoad: mentorAssignments[mentor._id.toString()].assignedMentees.length
      })).sort((a, b) => a.currentLoad - b.currentLoad);

      console.log(`\n🔄 Current mentor loads before distribution:`);
      mentorLoads.slice(0, 5).forEach(({ mentor, currentLoad }) => {
        console.log(`   • ${mentor.fullName || mentor.email}: ${currentLoad} mentees`);
      });

      // Distribute remaining mentees evenly
      let mentorIndex = 0;
      for (const mentee of remainingMentees) {
        // Always pick the least loaded mentor
        const sortedLoads = agreedMentors
          .map(m => ({
            mentor: m,
            load: mentorAssignments[m._id.toString()].assignedMentees.length
          }))
          .sort((a, b) => a.load - b.load);
        
        const leastLoadedMentor = sortedLoads[0].mentor;
        mentorAssignments[leastLoadedMentor._id.toString()].assignedMentees.push(mentee);
        mentorIndex++;
      }

      console.log(`   ✅ Assigned all ${remainingMentees.length} remaining mentees`);
    }

    // 11. Final balance check
    console.log("\n🔹 FINAL DISTRIBUTION:");
    const finalLoads = agreedMentors.map(mentor => ({
      name: mentor.fullName || mentor.email,
      faculty: mentor.faculty || 'unspecified',
      count: mentorAssignments[mentor._id.toString()].assignedMentees.length
    })).sort((a, b) => a.count - b.count);

    console.log("\n📊 Mentor loads (sorted):");
    finalLoads.forEach(({ name, faculty, count }) => {
      console.log(`   • ${name} (${faculty}): ${count} mentees`);
    });

    const minLoad = Math.min(...finalLoads.map(l => l.count));
    const maxLoad = Math.max(...finalLoads.map(l => l.count));
    const loadDiff = maxLoad - minLoad;
    
    console.log(`\n📊 Balance check:`);
    console.log(`   • Min load: ${minLoad}`);
    console.log(`   • Max load: ${maxLoad}`);
    console.log(`   • Difference: ${loadDiff}`);
    console.log(`   • ${loadDiff <= 1 ? '✅ Perfectly balanced!' : '⚠️ Needs improvement'}`);

    // 12. Gender balancing analysis
    console.log("\n🔹 Gender distribution analysis...");
    
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

    // 13. Prepare results
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
            source: data.mentor.source || 'unknown',
            hasAgreed: data.mentor.hasAgreed
          },
          mentees: data.assignedMentees.map(m => ({
            id: m._id,
            email: m.email || 'No email',
            fullName: m.fullName || m.email || 'Unknown',
            faculty: m.faculty || 'Not specified',
            gender: m.gender || 'Not specified',
            status: m.status || 'registered',
            source: m.source || 'unknown',
            hasAgreed: m.hasAgreed
          }))
        });
      }
    });

    // Calculate matched count
    const matchedCount = results.reduce((sum, r) => sum + r.mentees.length, 0);

    // 14. Calculate statistics
    const stats = {
      totalMentors: agreedMentors.length,
      totalMentees: agreedMentees.length,
      matchedMentees: matchedCount,
      unassignedMentees: agreedMentees.length - matchedCount,
      averagePerMentor: (agreedMentees.length / agreedMentors.length).toFixed(2),
      registeredUsers: users.length,
      preloadedOnly: preloaded.length - users.length,
      minMentees: minLoad,
      maxMentees: maxLoad,
      balanceDifference: loadDiff,
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
    console.log(`   • Mentors (agreed): ${stats.totalMentors}`);
    console.log(`   • Mentees (agreed): ${stats.totalMentees}`);
    console.log(`   • Matched: ${stats.matchedMentees}`);
    console.log(`   • Unassigned: ${stats.unassignedMentees}`);
    console.log(`   • Average per mentor: ${stats.averagePerMentor}`);
    console.log(`   • Range: ${stats.minMentees} - ${stats.maxMentees} (diff: ${stats.balanceDifference})`);
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