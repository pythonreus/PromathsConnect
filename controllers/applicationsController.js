import Application from "../models/applications.js";


/**
 * Create a new application
 * POST /api/client/application
 */
export const createApplication = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      yearOfStudy,
      faculty,
      position,
      motivation,
      impactIdeas,
      tutorModules
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !phoneNumber ||
      !yearOfStudy ||
      !faculty ||
      !position ||
      !motivation
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if application already exists
    const existingApplication = await Application.findOne({
      email: normalizedEmail,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "An application has already been submitted with this email address",
      });
    }

    // Create a new application
    const application = await Application.create({
      fullName,
      email: normalizedEmail,
      phoneNumber,
      yearOfStudy,
      faculty,
      position,
      motivation,
      impactIdeas: impactIdeas || "",
      tutorModules: tutorModules || [],
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("❌ Error creating application:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while submitting application",
    });
  }
};





export const getApplicationsPaginated = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("❌ getApplicationsPaginated:", error);

    res.status(500).json({
      success: false,
      error: "APPLICATION_FETCH_FAILED",
      message: error.message || "Failed to fetch applications",
    });
  }
};


export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("❌ Error fetching application:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// In applicationsController.js
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    return res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error("❌ Error updating application:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

