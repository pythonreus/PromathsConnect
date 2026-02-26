// startup/addMentorsToPreLoaded.js
import Application from "../models/applications.js";
import PreLoaded from "../models/preLoaded.js";

export async function addApprovedMentorsToPreLoaded() {
  try {
    console.log("🔄 Checking for approved mentors to add to PreLoaded...");
    
    const approvedApplicants = await Application.find({
      status: 'approved',
      position: { $in: ['Mentor', 'Both'] }
    });

    if (approvedApplicants.length === 0) {
      console.log("📝 No approved mentors found to add");
      return { added: 0, skipped: 0 };
    }

    let added = 0;
    let skipped = 0;

    for (const applicant of approvedApplicants) {
      const existing = await PreLoaded.findOne({ 
        email: applicant.email.toLowerCase() 
      });

      if (!existing) {
        await PreLoaded.create({
          email: applicant.email,
          role: 'mentor',
          gender: 'female'
        });
        added++;
        console.log(`✅ Added: ${applicant.email}`);
      } else {
        skipped++;
      }
    }

    console.log(`📊 Summary: Added ${added} mentors, ${skipped} already existed`);
    return { added, skipped };
    
  } catch (error) {
    console.error("❌ Error in addApprovedMentorsToPreLoaded:", error);
    throw error;
  }
}