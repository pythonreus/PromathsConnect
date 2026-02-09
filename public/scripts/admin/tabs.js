const tabContent = document.getElementById("tab-content");
const tabButtons = document.querySelectorAll(".tab-btn");

function updateHeader(user) {
    const adminNameDisplay = document.querySelector(".text-right p.font-medium");
    const adminEmailDisplay = document.querySelector(".text-right p.text-gray-400");

    if (user) {
        adminNameDisplay.textContent = user.name || "Admin User";
        adminEmailDisplay.textContent = user.email;
    }
}

const tabs = {
  dashboard: {
    load: loadDashboard
  },
  users: {
    load: loadUsers
  },
  applications: {
    load: loadApplications
  },
};

const usersState = {
  page: 1,
  loading: false
};

const applicationsState = {
  page: 1,
  loading: false,
  currentView: 'list', // 'list' or 'detail'
  currentApplicationId: null
};

async function loadTab(tabName) {
  tabContent.innerHTML = `
    <div class="text-gray-400">Loading...</div>
  `;

  if (!tabs[tabName]) {
    tabContent.innerHTML = "Unknown tab";
    return;
  }

  await tabs[tabName].load();
}

async function handleLogout() {
  try {
    const response = await fetch("/api/system/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    });

    if (response.ok) {
      window.location.href = "../login";
    }
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

// ============ DASHBOARD TAB ============
async function loadDashboard() {
  tabContent.innerHTML = `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-gray-400">Welcome to the admin dashboard</p>
      </div>
      <p class="text-gray-400">Dashboard content will appear here...</p>
    </div>
  `;
}

// ============ USERS TAB ============
async function fetchUsers(page = 1) {
  const res = await fetch(`/api/system/users?page=${page}`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  return res.json();
}

async function loadUsers() {
  try {
    usersState.loading = true;
    
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-center h-32">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading users...</p>
          </div>
        </div>
      </div>
    `;

    const result = await fetchUsers(usersState.page);
    
    if (!result.success) {
      throw new Error(result.error || "Failed to load users");
    }

    renderUsersTab(result.data, result.pagination);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load users</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <button onclick="loadUsers()" class="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          Try Again
        </button>
      </div>
    `;
  } finally {
    usersState.loading = false;
  }
}

function renderUsersTable(users) {
  if (!users || users.length === 0) {
    return `
      <div class="text-center py-8 text-gray-400">
        <i class="fas fa-users text-4xl mb-3"></i>
        <p>No users found</p>
      </div>
    `;
  }

  return `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="text-gray-400 border-b border-gray-700">
            <th class="py-3 px-4">Name</th>
            <th class="py-3 px-4">Email</th>
            <th class="py-3 px-4">Gender</th>
            <th class="py-3 px-4">Role</th>
            <th class="py-3 px-4">Date Joined</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
              <td class="py-3 px-4 font-medium">${u.fullName || 'N/A'}</td>
              <td class="py-3 px-4">${u.email || 'N/A'}</td>
              <td class="py-3 px-4 capitalize">${u.gender || 'N/A'}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium 
                  ${u.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 
                    u.role === 'mentor' ? 'bg-blue-900/50 text-blue-300' : 
                    u.role === 'head_mentor' ? 'bg-indigo-900/50 text-indigo-300' : 
                    'bg-gray-800 text-gray-300'}">
                  ${u.role || 'N/A'}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-400">
                ${u.dateJoined ? new Date(u.dateJoined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPagination(pagination, state, loadFunction) {
  if (!pagination) return '';
  
  const { currentPage, totalPages } = pagination;

  return `
    <div class="flex justify-between items-center mt-6">
      <p class="text-gray-400 text-sm">
        Page ${currentPage} of ${totalPages}
      </p>

      <div class="flex space-x-2">
        <button 
          ${currentPage === 1 ? "disabled" : ""}
          class="prev-page px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-chevron-left mr-1"></i> Previous
        </button>

        <button 
          ${currentPage === totalPages ? "disabled" : ""}
          class="next-page px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  `;
}

function renderUsersTab(users, pagination) {
  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold">Users</h2>
          <p class="text-gray-400">Manage all system users</p>
        </div>
        <div class="flex items-center space-x-2">
          <div class="relative">
            <input 
              type="text" 
              placeholder="Search users..." 
              class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            >
            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
          <button class="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg flex items-center space-x-2">
            <i class="fas fa-plus"></i>
            <span>Add User</span>
          </button>
        </div>
      </div>

      ${renderUsersTable(users)}
      ${renderPagination(pagination, usersState, loadUsers)}
    </div>
  `;

  // Add event listeners for pagination buttons
  setTimeout(() => {
    const prevBtn = tabContent.querySelector('.prev-page');
    const nextBtn = tabContent.querySelector('.next-page');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (usersState.page > 1 && !usersState.loading) {
          changeUsersPage(usersState.page - 1);
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (!usersState.loading) {
          changeUsersPage(usersState.page + 1);
        }
      });
    }
  }, 0);
}

async function changeUsersPage(newPage) {
  if (usersState.loading || newPage < 1) return;
  
  try {
    const result = await fetchUsers(newPage);
    
    // Check if the page exists
    if (newPage > result.pagination.totalPages) return;
    
    usersState.page = newPage;
    renderUsersTab(result.data, result.pagination);
  } catch (err) {
    console.error("Failed to change page:", err);
    
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load page</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <button onclick="loadUsers()" class="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          Reload Users
        </button>
      </div>
    `;
  }
}

// ============ APPLICATIONS TAB ============
async function fetchApplications(page = 1) {
  const res = await fetch(`/api/applications?page=${page}`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch applications");
  }

  return res.json();
}

async function fetchApplicationById(id) {
  const res = await fetch(`/api/applications/${id}`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch application");
  }

  return res.json();
}

async function loadApplications() {
  try {
    applicationsState.loading = true;
    applicationsState.currentView = 'list';
    
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-center h-32">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading applications...</p>
          </div>
        </div>
      </div>
    `;

    const result = await fetchApplications(applicationsState.page);
    
    if (!result.success) {
      throw new Error(result.error || "Failed to load applications");
    }

    renderApplicationsList(result.data, result.pagination);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load applications</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <button onclick="loadApplications()" class="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          Try Again
        </button>
      </div>
    `;
  } finally {
    applicationsState.loading = false;
  }
}

function renderApplicationsTable(applications) {
  if (!applications || applications.length === 0) {
    return `
      <div class="text-center py-8 text-gray-400">
        <i class="fas fa-file-alt text-4xl mb-3"></i>
        <p>No applications found</p>
      </div>
    `;
  }

  return `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="text-gray-400 border-b border-gray-700">
            <th class="py-3 px-4">Name</th>
            <th class="py-3 px-4">Email</th>
            <th class="py-3 px-4">Phone</th>
            <th class="py-3 px-4">Faculty</th>
            <th class="py-3 px-4">Position</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Applied</th>
          </tr>
        </thead>
        <tbody>
          ${applications.map(app => `
            <tr 
              class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
              data-app-id="${app._id}"
            >
              <td class="py-3 px-4 font-medium">${app.fullName || 'N/A'}</td>
              <td class="py-3 px-4">${app.email || 'N/A'}</td>
              <td class="py-3 px-4">${app.phoneNumber || 'N/A'}</td>
              <td class="py-3 px-4">${app.faculty || 'N/A'}</td>
              <td class="py-3 px-4 capitalize">${app.position || 'N/A'}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium 
                  ${app.status === 'approved' ? 'bg-green-900/50 text-green-300' : 
                    app.status === 'rejected' ? 'bg-red-900/50 text-red-300' : 
                    'bg-yellow-900/50 text-yellow-300'}">
                  ${app.status || 'pending'}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-400">
                ${app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderApplicationsList(applications, pagination) {
  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold">Applications</h2>
          <p class="text-gray-400">Manage mentorship applications</p>
        </div>
        <div class="flex items-center space-x-2">
          <div class="relative">
            <input 
              type="text" 
              id="application-search"
              placeholder="Search applications..." 
              class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 w-64"
            >
            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
          <button class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg flex items-center space-x-2">
            <i class="fas fa-plus"></i>
            <span>New</span>
          </button>
        </div>
      </div>

      ${renderApplicationsTable(applications)}
      ${renderPagination(pagination, applicationsState, loadApplications)}
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    // Application row click listeners
    document.querySelectorAll('tr[data-app-id]').forEach(row => {
      row.addEventListener('click', () => {
        const appId = row.getAttribute('data-app-id');
        viewApplicationDetail(appId);
      });
    });

    // Pagination buttons
    const prevBtn = tabContent.querySelector('.prev-page');
    const nextBtn = tabContent.querySelector('.next-page');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (applicationsState.page > 1 && !applicationsState.loading) {
          changeApplicationsPage(applicationsState.page - 1);
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (!applicationsState.loading) {
          changeApplicationsPage(applicationsState.page + 1);
        }
      });
    }
  }, 0);
}

async function viewApplicationDetail(applicationId) {
  try {
    applicationsState.currentView = 'detail';
    applicationsState.currentApplicationId = applicationId;
    
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-center h-32">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading application details...</p>
          </div>
        </div>
      </div>
    `;

    const result = await fetchApplicationById(applicationId);
    
    if (!result.success) {
      throw new Error(result.message || "Failed to load application");
    }

    renderApplicationDetail(result.application);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load application</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <div class="flex space-x-2 mt-3">
          <button onclick="loadApplications()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
            Back to List
          </button>
          <button onclick="viewApplicationDetail('${applicationId}')" class="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded">
            Try Again
          </button>
        </div>
      </div>
    `;
  }
}

function renderApplicationDetail(application) {
  const statusColor = application.status === 'approved' ? 'text-green-400' : 
                     application.status === 'rejected' ? 'text-red-400' : 
                     'text-yellow-400';
  
  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg border border-gray-700">
      <!-- Header -->
      <div class="p-6 border-b border-gray-700">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center space-x-3">
              <button onclick="loadApplications()" class="p-2 rounded-lg hover:bg-gray-700">
                <i class="fas fa-arrow-left"></i>
              </button>
              <div>
                <h2 class="text-2xl font-bold">Application Details</h2>
                <p class="text-gray-400">ID: ${application._id}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor} bg-gray-700">
              ${application.status.toUpperCase()}
            </span>
            <button onclick="updateApplicationStatus('${application._id}', 'approved')" 
              class="px-3 py-1 bg-green-900/50 hover:bg-green-800/50 text-green-300 rounded">
              Approve
            </button>
            <button onclick="updateApplicationStatus('${application._id}', 'rejected')"
              class="px-3 py-1 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded">
              Reject
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Personal Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-300">Personal Information</h3>
            <div class="space-y-3">
              <div>
                <p class="text-gray-400 text-sm">Full Name</p>
                <p class="font-medium">${application.fullName}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Email</p>
                <p class="font-medium">${application.email}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Phone Number</p>
                <p class="font-medium">${application.phoneNumber}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-300">Academic Information</h3>
            <div class="space-y-3">
              <div>
                <p class="text-gray-400 text-sm">Year of Study</p>
                <p class="font-medium">${application.yearOfStudy}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Faculty</p>
                <p class="font-medium">${application.faculty}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Position Applied For</p>
                <p class="font-medium capitalize">${application.position}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tutor Modules -->
        ${application.tutorModules && application.tutorModules.length > 0 ? `
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-300">Tutor Modules</h3>
            <div class="flex flex-wrap gap-2">
              ${application.tutorModules.map(module => `
                <span class="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm">
                  ${module}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Motivation -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold text-gray-300">Motivation</h3>
          <div class="bg-gray-900 p-4 rounded-lg">
            <p class="text-gray-300 whitespace-pre-wrap">${application.motivation}</p>
          </div>
        </div>

        <!-- Impact Ideas -->
        ${application.impactIdeas ? `
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-300">Impact Ideas</h3>
            <div class="bg-gray-900 p-4 rounded-lg">
              <p class="text-gray-300 whitespace-pre-wrap">${application.impactIdeas}</p>
            </div>
          </div>
        ` : ''}

        <!-- Timestamps -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-700">
          <div>
            <p class="text-gray-400 text-sm">Applied On</p>
            <p class="font-medium">${new Date(application.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Last Updated</p>
            <p class="font-medium">${new Date(application.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-6 border-t border-gray-700 flex justify-between">
        <button onclick="loadApplications()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Back to Applications
        </button>
        <div class="flex space-x-3">
          <button onclick="downloadApplication('${application._id}')" 
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center space-x-2">
            <i class="fas fa-download"></i>
            <span>Download PDF</span>
          </button>
          <button onclick="deleteApplication('${application._id}')" 
            class="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg flex items-center space-x-2">
            <i class="fas fa-trash"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function changeApplicationsPage(newPage) {
  if (applicationsState.loading || newPage < 1) return;
  
  try {
    const result = await fetchApplications(newPage);
    
    if (newPage > result.pagination.totalPages) return;
    
    applicationsState.page = newPage;
    renderApplicationsList(result.data, result.pagination);
  } catch (err) {
    console.error("Failed to change page:", err);
    
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load page</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <button onclick="loadApplications()" class="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          Reload Applications
        </button>
      </div>
    `;
  }
}




// ============ EVENT LISTENERS ============
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;

    tabButtons.forEach(btn => {
      btn.classList.remove("bg-purple-900", "border-purple-700", "text-white");
      btn.classList.add("bg-gray-700", "border-gray-600", "text-gray-300");
    });

    button.classList.add("bg-purple-900", "border-purple-700", "text-white");

    loadTab(tabName);
  });
});

// ============ INITIALIZATION ============
async function InitializeDashboard() {
  try {
    const response = await fetch("/api/system/me", {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      window.location.href = "../login";
      return;
    }

    const data = await response.json();
    updateHeader(data.user);

    // Load the default tab (dashboard)
    loadTab("dashboard");
  } catch (error) {
    console.error("Auth initialization failed:", error);
    window.location.href = "../login";
  }
}

// ============ GLOBAL FUNCTIONS ============
window.loadUsers = loadUsers;
window.handleLogout = handleLogout;
window.changeUsersPage = changeUsersPage;
window.loadApplications = loadApplications;
window.viewApplicationDetail = viewApplicationDetail;
window.changeApplicationsPage = changeApplicationsPage;

// Application action functions (placeholder)
window.updateApplicationStatus = async function(applicationId, status) {
  alert(`Update application ${applicationId} to ${status}`);
  // Implement status update
};

window.downloadApplication = function(applicationId) {
  alert(`Download application ${applicationId}`);
  // Implement PDF download
};

window.deleteApplication = async function(applicationId) {
  if (!confirm('Are you sure you want to delete this application?')) return;
  alert(`Delete application ${applicationId}`);
  // Implement delete functionality
};

// Initialize the dashboard
InitializeDashboard();