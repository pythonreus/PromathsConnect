// ============ INITIAL STATE ============
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
  "authorized-accounts": {  // Add this line
    load: loadAuthorizedAccounts
  },
  'communications' : {
  load: loadCommunications
},
};

const applicationsState = {
  page: 1,
  loading: false,
  currentView: 'list',
  currentApplicationId: null
};

// ============ AUTHORIZED ACCOUNTS STATE ============
const authorizedAccountsState = {
  page: 1,
  limit: 20,
  loading: false,
  search: '',
  roleFilter: '',
  genderFilter: '',
  showAddModal: false,
  showEditModal: false,
  currentEditId: null
};

// ============ TAB LOADING FUNCTION ============
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

// ============ LOGOUT ============
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
// ============ DASHBOARD TAB WITH FEEDBACK BOX ============
async function loadDashboard() {
  try {
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-center h-64">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    `;

    // Fetch dashboard data
    const [feedbackStats, recentFeedback] = await Promise.all([
      fetchFeedbackStats(),
      fetchRecentFeedback()
    ]);

    renderDashboard(feedbackStats.data, recentFeedback.data);
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    renderDashboard(null, null);
  }
}

async function fetchFeedbackStats() {
  try {
    const res = await fetch(`/api/feedback/admin/stats`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return { data: null };
  }
}

async function fetchRecentFeedback(limit = 10) {
  try {
    const res = await fetch(`/api/feedback/admin?limit=${limit}&status=pending,reviewed,acknowledged`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to fetch feedback");
    return res.json();
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return { data: [] };
  }
}

function renderDashboard(stats, recentFeedback = []) {
  const defaultStats = {
    total: 0,
    byStatus: { pending: 0, reviewed: 0, acknowledged: 0, resolved: 0, archived: 0 },
    byType: { suggestion: 0, complaint: 0, review: 0, other: 0 },
    averageRating: 0,
    responseRate: 0
  };

  const dashboardStats = stats || defaultStats;

  tabContent.innerHTML = `
    <div class="space-y-6">
      <!-- Welcome Section -->
      <div class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-700/50">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">Dashboard</h1>
            <p class="text-gray-300 mt-2">Welcome to the Promaths admin dashboard. Here's what's happening today.</p>
          </div>
          <div class="hidden md:block">
            <i class="fas fa-chart-line text-6xl text-purple-400 opacity-50"></i>
          </div>
        </div>
      </div>

      <!-- Feedback Stats Cards -->
      <div>
        <h2 class="text-xl font-bold mb-4 flex items-center">
          <i class="fas fa-comment-dots text-purple-400 mr-2"></i>
          Feedback & Suggestions Overview
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-purple-500 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm">Total Feedback</p>
                <p class="text-3xl font-bold">${dashboardStats.total}</p>
              </div>
              <div class="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i class="fas fa-comments text-purple-400 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-yellow-500 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm">Pending</p>
                <p class="text-3xl font-bold text-yellow-400">${dashboardStats.byStatus.pending}</p>
              </div>
              <div class="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <i class="fas fa-clock text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-green-500 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm">Resolved</p>
                <p class="text-3xl font-bold text-green-400">${dashboardStats.byStatus.resolved}</p>
              </div>
              <div class="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-400 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-blue-500 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm">Avg Rating</p>
                <p class="text-3xl font-bold text-blue-400">${dashboardStats.averageRating}</p>
              </div>
              <div class="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i class="fas fa-star text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-indigo-500 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-sm">Response Rate</p>
                <p class="text-3xl font-bold text-indigo-400">${dashboardStats.responseRate}%</p>
              </div>
              <div class="w-12 h-12 bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <i class="fas fa-chart-pie text-indigo-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- By Type -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-tag text-purple-400 mr-2"></i>
            Feedback by Type
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span>Suggestions</span>
              </div>
              <span class="font-bold">${dashboardStats.byType.suggestion || 0}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span>Complaints</span>
              </div>
              <span class="font-bold">${dashboardStats.byType.complaint || 0}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>Reviews</span>
              </div>
              <span class="font-bold">${dashboardStats.byType.review || 0}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                <span>Other</span>
              </div>
              <span class="font-bold">${dashboardStats.byType.other || 0}</span>
            </div>
          </div>
        </div>

        <!-- By Status -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 class="text-lg font-bold mb-4 flex items-center">
            <i class="fas fa-chart-pie text-purple-400 mr-2"></i>
            Feedback Status
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span>Pending</span>
              </div>
              <span class="font-bold">${dashboardStats.byStatus.pending}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span>Reviewed</span>
              </div>
              <span class="font-bold">${dashboardStats.byStatus.reviewed}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                <span>Acknowledged</span>
              </div>
              <span class="font-bold">${dashboardStats.byStatus.acknowledged}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>Resolved</span>
              </div>
              <span class="font-bold">${dashboardStats.byStatus.resolved}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Feedback - ANONYMIZED FEEDBACK BOX -->
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i class="fas fa-comment-dots text-purple-400"></i>
              </div>
              <div>
                <h2 class="text-xl font-bold">Recent Feedback & Suggestions</h2>
                <p class="text-gray-400 text-sm">Anonymous submissions from users - view only, no deletion</p>
              </div>
            </div>
            <a href="#" onclick="switchToCommunicationsTab()" class="text-purple-400 hover:text-purple-300 text-sm flex items-center">
              View All <i class="fas fa-arrow-right ml-1"></i>
            </a>
          </div>
        </div>

        <div class="p-6">
          ${renderFeedbackList(recentFeedback)}
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-users text-blue-400 text-xl"></i>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Total Users</p>
              <p class="text-2xl font-bold">Loading...</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-file-alt text-green-400 text-xl"></i>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Applications</p>
              <p class="text-2xl font-bold">Loading...</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-bullhorn text-purple-400 text-xl"></i>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Communications</p>
              <p class="text-2xl font-bold">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Fetch real stats for users, applications, communications
  fetchQuickStats();
}

function renderFeedbackList(feedback) {
  if (!feedback || feedback.length === 0) {
    return `
      <div class="text-center py-8 text-gray-400">
        <i class="fas fa-comment-slash text-4xl mb-3"></i>
        <p>No feedback or suggestions yet</p>
        <p class="text-sm text-gray-500 mt-1">Feedback from users will appear here anonymously</p>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      ${feedback.map(item => `
        <div class="bg-gray-900/30 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="px-2 py-1 rounded-full text-xs font-medium
                  ${item.type === 'suggestion' ? 'bg-blue-900/50 text-blue-300' : 
                    item.type === 'complaint' ? 'bg-yellow-900/50 text-yellow-300' : 
                    item.type === 'review' ? 'bg-green-900/50 text-green-300' : 
                    'bg-gray-800 text-gray-300'}">
                  ${item.type}
                </span>
                <span class="text-xs text-gray-500">${item.displayId}</span>
                <span class="text-xs text-gray-500">•</span>
                <span class="text-xs text-gray-500">${new Date(item.createdAt).toLocaleDateString()}</span>
                ${item.rating ? `
                  <span class="flex items-center space-x-1 text-xs text-yellow-400">
                    <i class="fas fa-star"></i>
                    <span>${item.rating}</span>
                  </span>
                ` : ''}
              </div>
              
              ${item.title ? `
                <h4 class="font-medium mb-1">${item.title}</h4>
              ` : ''}
              
              <p class="text-gray-300 text-sm">${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}</p>
              
              <div class="flex items-center justify-between mt-3">
                <span class="text-xs px-2 py-1 rounded-full
                  ${item.status === 'pending' ? 'bg-yellow-900/30 text-yellow-300' : 
                    item.status === 'reviewed' ? 'bg-blue-900/30 text-blue-300' : 
                    item.status === 'acknowledged' ? 'bg-indigo-900/30 text-indigo-300' : 
                    item.status === 'resolved' ? 'bg-green-900/30 text-green-300' : 
                    'bg-gray-800 text-gray-400'}">
                  <i class="fas fa-circle mr-1 text-xs"></i>
                  ${item.status}
                </span>
                
                <button onclick="viewFeedbackDetail('${item._id}')" 
                  class="text-xs text-purple-400 hover:text-purple-300 flex items-center">
                  View Details <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function fetchQuickStats() {
  try {
    // Fetch user count
    const usersRes = await fetch(`/api/system/users?limit=1`, { credentials: "include" });
    const usersData = await usersRes.json();
    
    // Fetch applications count (adjust endpoint as needed)
    const appsRes = await fetch(`/api/applications?limit=1`, { credentials: "include" });
    const appsData = await appsRes.json();
    
    // Fetch communications count
    const commsRes = await fetch(`/api/communications?limit=1`, { credentials: "include" });
    const commsData = await commsRes.json();
    
    // Update the stats
    const statElements = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 .text-2xl');
    if (statElements.length >= 3) {
      statElements[0].textContent = usersData.pagination?.totalRecords || 0;
      statElements[1].textContent = appsData.pagination?.totalRecords || 0;
      statElements[2].textContent = commsData.pagination?.totalRecords || 0;
    }
  } catch (error) {
    console.error("Failed to fetch quick stats:", error);
  }
}

// Feedback detail view (admin only, anonymized)
async function viewFeedbackDetail(id) {
  try {
    const res = await fetch(`/api/feedback/admin/${id}`, {
      credentials: "include"
    });
    
    if (!res.ok) throw new Error("Failed to fetch feedback");
    
    const result = await res.json();
    
    // Show modal with feedback details
    showFeedbackDetailModal(result.data);
  } catch (error) {
    alert("Failed to load feedback details: " + error.message);
  }
}

function showFeedbackDetailModal(feedback) {
  const statusColors = {
    pending: 'bg-yellow-900/50 text-yellow-300',
    reviewed: 'bg-blue-900/50 text-blue-300',
    acknowledged: 'bg-indigo-900/50 text-indigo-300',
    resolved: 'bg-green-900/50 text-green-300',
    archived: 'bg-gray-700/50 text-gray-400'
  };

  const modalHtml = `
    <div id="feedback-detail-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-start">
          <div>
            <div class="flex items-center space-x-2 mb-2">
              <span class="px-2 py-1 rounded-full text-xs font-medium
                ${feedback.type === 'suggestion' ? 'bg-blue-900/50 text-blue-300' : 
                  feedback.type === 'complaint' ? 'bg-yellow-900/50 text-yellow-300' : 
                  feedback.type === 'review' ? 'bg-green-900/50 text-green-300' : 
                  'bg-gray-800 text-gray-300'}">
                ${feedback.type}
              </span>
              <span class="text-sm text-gray-400">${feedback.displayId}</span>
            </div>
            <h3 class="text-xl font-bold">${feedback.title || 'Untitled'}</h3>
          </div>
          <button onclick="closeModal()" class="p-2 hover:bg-gray-700 rounded-lg">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Status and Rating -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[feedback.status]}">
                <i class="fas fa-circle mr-1 text-xs"></i>
                ${feedback.status}
              </span>
              <span class="text-sm text-gray-400">
                Submitted ${new Date(feedback.createdAt).toLocaleDateString()}
              </span>
            </div>
            ${feedback.rating ? `
              <div class="flex items-center space-x-1">
                <span class="text-sm text-gray-400">Rating:</span>
                <span class="flex items-center space-x-1 text-yellow-400">
                  ${Array.from({ length: 5 }, (_, i) => `
                    <i class="fas fa-star${i < feedback.rating ? '' : '-o'}"></i>
                  `).join('')}
                </span>
                <span class="text-sm font-bold">${feedback.rating}/5</span>
              </div>
            ` : ''}
          </div>

          <!-- Content -->
          <div class="bg-gray-900/50 p-4 rounded-lg">
            <p class="text-gray-300 whitespace-pre-wrap">${feedback.content}</p>
          </div>

          <!-- Category -->
          <div>
            <p class="text-sm text-gray-400 mb-1">Category</p>
            <p class="font-medium capitalize">${feedback.category}</p>
          </div>

          <!-- Admin Notes -->
          ${feedback.adminNotes ? `
            <div class="border-t border-gray-700 pt-4">
              <p class="text-sm text-gray-400 mb-2">Admin Notes</p>
              <div class="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3">
                <p class="text-gray-300">${feedback.adminNotes}</p>
              </div>
            </div>
          ` : ''}

          <!-- Status Update Form (Admin Only) -->
          <div class="border-t border-gray-700 pt-4">
            <h4 class="font-medium mb-3">Update Status</h4>
            <div class="flex space-x-2">
              <select id="feedback-status-select" class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                <option value="pending" ${feedback.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="reviewed" ${feedback.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                <option value="acknowledged" ${feedback.status === 'acknowledged' ? 'selected' : ''}>Acknowledged</option>
                <option value="resolved" ${feedback.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                <option value="archived" ${feedback.status === 'archived' ? 'selected' : ''}>Archived</option>
              </select>
              <button onclick="updateFeedbackStatus('${feedback._id}')" 
                class="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Update feedback status
window.updateFeedbackStatus = async function(id) {
  const select = document.getElementById('feedback-status-select');
  const status = select.value;
  
  try {
    const res = await fetch(`/api/feedback/admin/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include"
    });
    
    if (!res.ok) throw new Error("Failed to update status");
    
    const result = await res.json();
    alert(`Feedback marked as ${status}`);
    closeModal();
    loadDashboard(); // Refresh dashboard
  } catch (error) {
    alert("Failed to update status: " + error.message);
  }
};

// Switch to communications tab
window.switchToCommunicationsTab = function() {
  // Find and click the communications tab button
  const commsTab = Array.from(tabButtons).find(btn => btn.dataset.tab === 'communications');
  if (commsTab) {
    commsTab.click();
  }
};

// Add to global functions
window.viewFeedbackDetail = viewFeedbackDetail;

// ============ USERS TAB WITH SEARCH ============
const usersState = {
  page: 1,
  limit: 10,
  loading: false,
  search: '',
  roleFilter: '',
  genderFilter: '',
  statusFilter: ''
};

async function fetchUsers(params = {}) {
  const {
    page = usersState.page,
    limit = usersState.limit,
    search = usersState.search,
    role = usersState.roleFilter,
    gender = usersState.genderFilter,
    status = usersState.statusFilter
  } = params;

  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(role && { role }),
    ...(gender && { gender }),
    ...(status && { status })
  });

  const res = await fetch(`/api/system/users?${queryParams}`, {
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

    const result = await fetchUsers();
    
    if (!result.success) {
      throw new Error(result.error || "Failed to load users");
    }

    renderUsersTab(result.data, result.pagination, result.filters, result.stats);
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

function renderUsersTab(users, pagination, filters, stats) {
  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold">Users</h2>
          <p class="text-gray-400">Manage all system users</p>
        </div>
        
        <div class="flex items-center gap-2">
          <button onclick="exportUsers()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center space-x-2">
            <i class="fas fa-download"></i>
            <span>Export</span>
          </button>
          <button class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg flex items-center space-x-2">
            <i class="fas fa-plus"></i>
            <span>Add User</span>
          </button>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gray-900/50 rounded-lg p-4">
          <p class="text-gray-400 text-sm">Total Users</p>
          <p class="text-2xl font-bold">${pagination?.totalRecords || 0}</p>
        </div>
        <div class="bg-gray-900/50 rounded-lg p-4">
          <p class="text-gray-400 text-sm">Active (30d)</p>
          <p class="text-2xl font-bold text-green-400">${stats?.global?.activeUsers || 0}</p>
        </div>
        <div class="bg-gray-900/50 rounded-lg p-4">
          <p class="text-gray-400 text-sm">Admins</p>
          <p class="text-2xl font-bold text-purple-400">${stats?.global?.byRole?.admin || 0}</p>
        </div>
        <div class="bg-gray-900/50 rounded-lg p-4">
          <p class="text-gray-400 text-sm">Mentors</p>
          <p class="text-2xl font-bold text-blue-400">${stats?.global?.byRole?.mentor || 0}</p>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search Bar -->
        <div class="relative flex-1">
          <input 
            type="text" 
            id="user-search"
            placeholder="Search by name, email, ID, course, institution..." 
            value="${filters?.search || ''}"
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          >
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
        </div>
        
        <!-- Filters -->
        <div class="flex flex-wrap gap-2">
          <select id="user-role-filter" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
            <option value="">All Roles</option>
            <option value="admin" ${filters?.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="mentor" ${filters?.role === 'mentor' ? 'selected' : ''}>Mentor</option>
            <option value="head_mentor" ${filters?.role === 'head_mentor' ? 'selected' : ''}>Head Mentor</option>
            <option value="mentee" ${filters?.role === 'mentee' ? 'selected' : ''}>Mentee</option>
          </select>
          
          <select id="user-gender-filter" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
            <option value="">All Genders</option>
            <option value="male" ${filters?.gender === 'male' ? 'selected' : ''}>Male</option>
            <option value="female" ${filters?.gender === 'female' ? 'selected' : ''}>Female</option>
          </select>
          
          <select id="user-status-filter" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
            <option value="">All Status</option>
            <option value="active" ${filters?.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${filters?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
          
          <button onclick="applyUserFilters()" class="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg">
            Apply
          </button>
          <button onclick="resetUserFilters()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
            Reset
          </button>
        </div>
      </div>

      <!-- Users Table -->
      ${renderUsersTable(users)}
      
      <!-- Pagination -->
      ${renderUsersPagination(pagination)}
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    // Search input with debounce
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          usersState.search = e.target.value;
          usersState.page = 1;
          loadUsers();
        }, 500);
      });
    }

    // Filter change listeners
    const roleFilter = document.getElementById('user-role-filter');
    const genderFilter = document.getElementById('user-gender-filter');
    const statusFilter = document.getElementById('user-status-filter');
    
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        usersState.roleFilter = roleFilter.value;
      });
    }
    
    if (genderFilter) {
      genderFilter.addEventListener('change', () => {
        usersState.genderFilter = genderFilter.value;
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        usersState.statusFilter = statusFilter.value;
      });
    }

    // Row click listeners for user details
    document.querySelectorAll('tr[data-user-id]').forEach(row => {
      row.addEventListener('click', () => {
        const userId = row.getAttribute('data-user-id');
        viewUserDetails(userId);
      });
    });
  }, 0);
}

function renderUsersTable(users) {
  if (!users || users.length === 0) {
    return `
      <div class="text-center py-12 text-gray-400">
        <div class="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-users text-4xl text-gray-600"></i>
        </div>
        <h3 class="text-lg font-medium mb-2">No users found</h3>
        <p class="text-gray-500">Try adjusting your search or filters</p>
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
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Account Age</th>
            <th class="py-3 px-4">Last Login</th>
            <th class="py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr 
              class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
              data-user-id="${u._id}"
            >
              <td class="py-3 px-4 font-medium">
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-xs font-bold">${u.fullName?.charAt(0) || 'U'}</span>
                  </div>
                  <span>${u.fullName || 'N/A'}</span>
                </div>
              </td>
              <td class="py-3 px-4">${u.email || 'N/A'}</td>
              <td class="py-3 px-4 capitalize">${u.gender || 'N/A'}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium 
                  ${u.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 
                    u.role === 'mentor' ? 'bg-blue-900/50 text-blue-300' : 
                    u.role === 'head_mentor' ? 'bg-indigo-900/50 text-indigo-300' : 
                    u.role === 'mentee' ? 'bg-green-900/50 text-green-300' : 
                    'bg-gray-800 text-gray-300'}">
                  ${u.role ? u.role.replace('_', ' ') : 'N/A'}
                </span>
              </td>
              <td class="py-3 px-4">
                ${u.isActive ? `
                  <span class="flex items-center space-x-1">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-green-400 text-sm">Active</span>
                  </span>
                ` : `
                  <span class="flex items-center space-x-1">
                    <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span class="text-gray-400 text-sm">Inactive</span>
                  </span>
                `}
              </td>
              <td class="py-3 px-4 text-gray-400">
                ${u.accountAgeInDays !== null ? `${u.accountAgeInDays} days` : 'N/A'}
              </td>
              <td class="py-3 px-4 text-gray-400">
                ${u.formattedLastLogin || 'Never'}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center space-x-2" onclick="event.stopPropagation()">
                  <button onclick="editUser('${u._id}')" class="p-1 hover:bg-gray-600 rounded transition-colors" title="Edit">
                    <i class="fas fa-edit text-gray-400 hover:text-white"></i>
                  </button>
                  <button onclick="toggleUserStatus('${u._id}', ${u.isActive})" class="p-1 hover:bg-gray-600 rounded transition-colors" title="${u.isActive ? 'Deactivate' : 'Activate'}">
                    <i class="fas ${u.isActive ? 'fa-ban' : 'fa-check-circle'} text-gray-400 hover:text-white"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderUsersPagination(pagination) {
  if (!pagination) return '';
  
  const { currentPage, totalPages, totalRecords, perPage } = pagination;
  const startRecord = ((currentPage - 1) * perPage) + 1;
  const endRecord = Math.min(currentPage * perPage, totalRecords);

  return `
    <div class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <p class="text-gray-400 text-sm">
        Showing ${startRecord} to ${endRecord} of ${totalRecords} users
      </p>

      <div class="flex space-x-2">
        <button 
          ${currentPage === 1 ? "disabled" : ""}
          onclick="changeUsersPage(${currentPage - 1})"
          class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-chevron-left mr-1"></i> Previous
        </button>

        <div class="flex items-center space-x-1">
          ${renderUsersPageNumbers(currentPage, totalPages)}
        </div>

        <button 
          ${currentPage === totalPages ? "disabled" : ""}
          onclick="changeUsersPage(${currentPage + 1})"
          class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  `;
}

function renderUsersPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(`
      <button onclick="changeUsersPage(1)" class="w-8 h-8 rounded hover:bg-gray-700">
        1
      </button>
    `);
    if (start > 2) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(`
      <button 
        onclick="changeUsersPage(${i})"
        class="w-8 h-8 rounded ${i === currentPage ? 'bg-purple-700 text-white' : 'hover:bg-gray-700'}"
      >
        ${i}
      </button>
    `);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
    pages.push(`
      <button onclick="changeUsersPage(${totalPages})" class="w-8 h-8 rounded hover:bg-gray-700">
        ${totalPages}
      </button>
    `);
  }

  return pages.join('');
}

async function changeUsersPage(newPage) {
  if (usersState.loading || newPage < 1) return;
  
  try {
    const result = await fetchUsers({ page: newPage });
    
    if (newPage > result.pagination.totalPages) return;
    
    usersState.page = newPage;
    renderUsersTab(result.data, result.pagination, result.filters, result.stats);
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

// User detail view function
async function viewUserDetails(userId) {
  try {
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-center h-32">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading user details...</p>
          </div>
        </div>
      </div>
    `;

    const res = await fetch(`/api/system/users/${userId}`, {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user details");
    }

    const result = await res.json();
    
    if (!result.success) {
      throw new Error(result.message || "Failed to load user details");
    }

    renderUserDetails(result.data);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load user details</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <div class="flex space-x-2 mt-3">
          <button onclick="loadUsers()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
            Back to Users
          </button>
        </div>
      </div>
    `;
  }
}

function renderUserDetails(user) {
  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg border border-gray-700">
      <!-- Header -->
      <div class="p-6 border-b border-gray-700">
        <div class="flex justify-between items-start">
          <div class="flex items-center space-x-4">
            <button onclick="loadUsers()" class="p-2 rounded-lg hover:bg-gray-700">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div class="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <span class="text-2xl font-bold">${user.fullName?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">${user.fullName || 'N/A'}</h2>
              <p class="text-gray-400">${user.email}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-sm font-medium 
              ${user.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 
                user.role === 'mentor' ? 'bg-blue-900/50 text-blue-300' : 
                user.role === 'head_mentor' ? 'bg-indigo-900/50 text-indigo-300' : 
                'bg-green-900/50 text-green-300'}">
              ${user.role?.replace('_', ' ') || 'N/A'}
            </span>
            ${user.isActive ? `
              <span class="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-medium">
                Active
              </span>
            ` : `
              <span class="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-medium">
                Inactive
              </span>
            `}
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Personal Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-300">Personal Information</h3>
            <div class="space-y-3">
              <div>
                <p class="text-gray-400 text-sm">Full Name</p>
                <p class="font-medium">${user.fullName || 'N/A'}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Email</p>
                <p class="font-medium">${user.email || 'N/A'}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Phone Number</p>
                <p class="font-medium">${user.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Gender</p>
                <p class="font-medium capitalize">${user.gender || 'N/A'}</p>
              </div>
            </div>
          </div>

          <!-- Account Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-300">Account Information</h3>
            <div class="space-y-3">
              <div>
                <p class="text-gray-400 text-sm">Firebase ID</p>
                <p class="font-mono text-sm">${user.firebaseId || 'N/A'}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Account Created</p>
                <p class="font-medium">${user.formattedCreatedAt || 'N/A'}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Last Login</p>
                <p class="font-medium">${user.formattedLastLogin || 'Never'}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Date of Joining</p>
                <p class="font-medium">${user.formattedDateOfJoining || 'N/A'}</p>
              </div>
              <div>
                <p class="text-gray-400 text-sm">Account Age</p>
                <p class="font-medium">${user.accountAgeInDays ? `${user.accountAgeInDays} days` : 'N/A'}</p>
              </div>
            </div>
          </div>

          <!-- Preloaded Status -->
          ${user.isPreloaded ? `
            <div class="space-y-4 md:col-span-2">
              <h3 class="text-lg font-bold text-gray-300">Authorized Account Details</h3>
              <div class="bg-gray-900/50 p-4 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-gray-400 text-sm">Authorized Role</p>
                    <p class="font-medium capitalize">${user.preloadedDetails?.role?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 text-sm">Authorized Gender</p>
                    <p class="font-medium capitalize">${user.preloadedDetails?.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 text-sm">Added On</p>
                    <p class="font-medium">${user.preloadedDetails?.addedAt ? new Date(user.preloadedDetails.addedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-6 border-t border-gray-700 flex justify-between">
        <button onclick="loadUsers()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Back to Users
        </button>
        <div class="flex space-x-3">
          <button onclick="editUser('${user._id}')" 
            class="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg flex items-center space-x-2">
            <i class="fas fa-edit"></i>
            <span>Edit User</span>
          </button>
          <button onclick="toggleUserStatus('${user._id}', ${user.isActive})" 
            class="px-4 py-2 ${user.isActive ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-green-700 hover:bg-green-600'} rounded-lg flex items-center space-x-2">
            <i class="fas ${user.isActive ? 'fa-ban' : 'fa-check-circle'}"></i>
            <span>${user.isActive ? 'Deactivate' : 'Activate'}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Filter functions
async function applyUserFilters() {
  usersState.page = 1;
  await loadUsers();
}

async function resetUserFilters() {
  usersState.search = '';
  usersState.roleFilter = '';
  usersState.genderFilter = '';
  usersState.statusFilter = '';
  usersState.page = 1;
  await loadUsers();
}

// Export users
async function exportUsers() {
  try {
    const queryParams = new URLSearchParams({
      format: 'csv',
      ...(usersState.search && { search: usersState.search }),
      ...(usersState.roleFilter && { role: usersState.roleFilter }),
      ...(usersState.genderFilter && { gender: usersState.genderFilter }),
      ...(usersState.statusFilter && { status: usersState.statusFilter })
    });

    window.location.href = `/api/system/users/export/all?${queryParams}`;
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export users");
  }
}

// Placeholder functions for user actions
window.editUser = function(userId) {
  alert(`Edit user ${userId}`);
};

window.toggleUserStatus = function(userId, isActive) {
  alert(`${isActive ? 'Deactivate' : 'Activate'} user ${userId}`);
};



// ============ APPLICATIONS TAB ============
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

// ADD THIS NEW FUNCTION HERE - Applications Pagination
function renderApplicationsPagination(pagination) {
  if (!pagination) return '';
  
  const { currentPage, totalPages, totalRecords, perPage } = pagination;
  const startRecord = ((currentPage - 1) * perPage) + 1;
  const endRecord = Math.min(currentPage * perPage, totalRecords);

  return `
    <div class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <p class="text-gray-400 text-sm">
        Showing ${startRecord} to ${endRecord} of ${totalRecords} applications
      </p>

      <div class="flex space-x-2">
        <button 
          ${currentPage === 1 ? "disabled" : ""}
          onclick="changeApplicationsPage(${currentPage - 1})"
          class="prev-page px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-chevron-left mr-1"></i> Previous
        </button>

        <div class="flex items-center space-x-1">
          ${renderApplicationsPageNumbers(currentPage, totalPages)}
        </div>

        <button 
          ${currentPage === totalPages ? "disabled" : ""}
          onclick="changeApplicationsPage(${currentPage + 1})"
          class="next-page px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  `;
}

// ADD THIS NEW FUNCTION HERE - Applications Page Numbers
function renderApplicationsPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(`
      <button onclick="changeApplicationsPage(1)" class="w-8 h-8 rounded hover:bg-gray-700">
        1
      </button>
    `);
    if (start > 2) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(`
      <button 
        onclick="changeApplicationsPage(${i})"
        class="w-8 h-8 rounded ${i === currentPage ? 'bg-purple-700 text-white' : 'hover:bg-gray-700'}"
      >
        ${i}
      </button>
    `);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
    pages.push(`
      <button onclick="changeApplicationsPage(${totalPages})" class="w-8 h-8 rounded hover:bg-gray-700">
        ${totalPages}
      </button>
    `);
  }

  return pages.join('');
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
      ${renderApplicationsPagination(pagination)} <!-- FIXED: Changed from renderPagination to renderApplicationsPagination -->
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll('tr[data-app-id]').forEach(row => {
      row.addEventListener('click', () => {
        const appId = row.getAttribute('data-app-id');
        viewApplicationDetail(appId);
      });
    });

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

      <div class="p-6 space-y-6">
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

        <div class="space-y-4">
          <h3 class="text-lg font-bold text-gray-300">Motivation</h3>
          <div class="bg-gray-900 p-4 rounded-lg">
            <p class="text-gray-300 whitespace-pre-wrap">${application.motivation}</p>
          </div>
        </div>

        ${application.impactIdeas ? `
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-300">Impact Ideas</h3>
            <div class="bg-gray-900 p-4 rounded-lg">
              <p class="text-gray-300 whitespace-pre-wrap">${application.impactIdeas}</p>
            </div>
          </div>
        ` : ''}

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

// ============ AUTHORIZED ACCOUNTS API FUNCTIONS ============
async function fetchAuthorizedAccounts(params = {}) {
  const {
    page = authorizedAccountsState.page,
    limit = authorizedAccountsState.limit,
    search = authorizedAccountsState.search,
    role = authorizedAccountsState.roleFilter,
    gender = authorizedAccountsState.genderFilter
  } = params;

  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(role && { role }),
    ...(gender && { gender })
  });

  const res = await fetch(`/api/system/authorized-emails?${queryParams}`, {
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch authorized accounts");
  }

  return res.json();
}

async function fetchAuthorizedStats() {
  const res = await fetch(`/api/system/authorized-emails/stats`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch statistics");
  }

  return res.json();
}

async function addAuthorizedEmail(emailData) {
  const res = await fetch(`/api/system/authorized-emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ emails: emailData }),
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to add authorized email");
  }

  return res.json();
}

async function updateAuthorizedEmail(id, updateData) {
  const res = await fetch(`/api/system/authorized-emails/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updateData),
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update authorized email");
  }

  return res.json();
}

async function deleteAuthorizedEmail(id, hardDelete = false) {
  const url = `/api/system/authorized-emails/${id}${hardDelete ? '?hardDelete=true' : ''}`;
  
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete authorized email");
  }

  return res.json();
}

async function bulkImportAuthorizedEmails(emails) {
  const res = await fetch(`/api/system/authorized-emails/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ emails }),
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to bulk import emails");
  }

  return res.json();
}

// ============ AUTHORIZED ACCOUNTS MAIN LOAD FUNCTION ============
async function loadAuthorizedAccounts() {
  try {
    authorizedAccountsState.loading = true;
    
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-center h-32">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading authorized accounts...</p>
          </div>
        </div>
      </div>
    `;

    const [accountsResult, statsResult] = await Promise.all([
      fetchAuthorizedAccounts(),
      fetchAuthorizedStats()
    ]);
    
    if (!accountsResult.success) {
      throw new Error(accountsResult.error || "Failed to load authorized accounts");
    }

    renderAuthorizedAccountsTab(accountsResult.data, accountsResult.pagination, accountsResult.filters, statsResult.data);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load authorized accounts</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <button onclick="loadAuthorizedAccounts()" class="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          Try Again
        </button>
      </div>
    `;
  } finally {
    authorizedAccountsState.loading = false;
  }
}

// ============ AUTHORIZED ACCOUNTS RENDER FUNCTIONS ============
function renderAuthorizedAccountsTab(accounts, pagination, filters, stats) {
  tabContent.innerHTML = `
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Total Authorized</p>
              <p class="text-2xl font-bold">${stats?.total || 0}</p>
            </div>
            <div class="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-envelope text-purple-400"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Registered</p>
              <p class="text-2xl font-bold">${stats?.registered || 0}</p>
            </div>
            <div class="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-check-circle text-green-400"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Pending Registration</p>
              <p class="text-2xl font-bold">${(stats?.total || 0) - (stats?.registered || 0)}</p>
            </div>
            <div class="w-10 h-10 bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-clock text-yellow-400"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Registration Rate</p>
              <p class="text-2xl font-bold">${stats?.registrationRate || '0%'}</p>
            </div>
            <div class="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-line text-blue-400"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
        <!-- Header with Actions -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 class="text-2xl font-bold">Authorized Accounts</h2>
            <p class="text-gray-400">Manage pre-approved email addresses</p>
          </div>
          
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="showBulkImportModal()" 
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center space-x-2">
              <i class="fas fa-upload"></i>
              <span>Bulk Import</span>
            </button>
            <button onclick="showAddAccountModal()" 
              class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg flex items-center space-x-2">
              <i class="fas fa-plus"></i>
              <span>Add Account</span>
            </button>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="authorized-search"
              placeholder="Search by email or role..." 
              value="${filters?.search || ''}"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            >
            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
          
          <div class="flex gap-2">
            <select id="role-filter" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
              <option value="">All Roles</option>
              <option value="admin" ${filters?.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="mentor" ${filters?.role === 'mentor' ? 'selected' : ''}>Mentor</option>
              <option value="head_mentor" ${filters?.role === 'head_mentor' ? 'selected' : ''}>Head Mentor</option>
              <option value="mentee" ${filters?.role === 'mentee' ? 'selected' : ''}>Mentee</option>
            </select>
            
            <select id="gender-filter" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
              <option value="">All Genders</option>
              <option value="male" ${filters?.gender === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${filters?.gender === 'female' ? 'selected' : ''}>Female</option>
            </select>
            
            <button onclick="applyAuthorizedFilters()" class="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg">
              Apply
            </button>
            <button onclick="resetAuthorizedFilters()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              Reset
            </button>
          </div>
        </div>

        <!-- Recently Added -->
        ${!filters?.search && !filters?.role && !filters?.gender && pagination?.currentPage === 1 && stats?.recentlyAdded?.length > 0 ? `
          <div class="bg-gray-900/50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-300">
                <i class="fas fa-clock mr-2 text-purple-400"></i>
                Recently Added
              </h3>
            </div>
            <div class="flex flex-wrap gap-2">
              ${stats.recentlyAdded.map(item => `
                <span class="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  ${item.email} 
                  <span class="text-gray-400 text-xs ml-1">(${item.role})</span>
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Accounts Table -->
        ${renderAuthorizedAccountsTable(accounts)}
        
        <!-- Pagination -->
        ${renderAuthorizedPagination(pagination)}
      </div>
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    const searchInput = document.getElementById('authorized-search');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          authorizedAccountsState.search = e.target.value;
          authorizedAccountsState.page = 1;
          loadAuthorizedAccounts();
        }, 500);
      });
    }

    const roleFilter = document.getElementById('role-filter');
    const genderFilter = document.getElementById('gender-filter');
    
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        authorizedAccountsState.roleFilter = roleFilter.value;
      });
    }
    
    if (genderFilter) {
      genderFilter.addEventListener('change', () => {
        authorizedAccountsState.genderFilter = genderFilter.value;
      });
    }
  }, 0);
}

function renderAuthorizedAccountsTable(accounts) {
  if (!accounts || accounts.length === 0) {
    return `
      <div class="text-center py-12 text-gray-400">
        <div class="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-envelope text-4xl text-gray-600"></i>
        </div>
        <h3 class="text-lg font-medium mb-2">No authorized accounts found</h3>
        <p class="text-gray-500">Add your first authorized email to get started</p>
        <button onclick="showAddAccountModal()" 
          class="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg inline-flex items-center space-x-2">
          <i class="fas fa-plus"></i>
          <span>Add Account</span>
        </button>
      </div>
    `;
  }

  return `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="text-gray-400 border-b border-gray-700">
            <th class="py-3 px-4">Email</th>
            <th class="py-3 px-4">Role</th>
            <th class="py-3 px-4">Gender</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Added On</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${accounts.map(account => `
            <tr class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
              <td class="py-3 px-4 font-mono text-sm">${account.email}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium 
                  ${account.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 
                    account.role === 'mentor' ? 'bg-blue-900/50 text-blue-300' : 
                    account.role === 'head_mentor' ? 'bg-indigo-900/50 text-indigo-300' : 
                    'bg-green-900/50 text-green-300'}">
                  ${account.role.replace('_', ' ')}
                </span>
              </td>
              <td class="py-3 px-4 capitalize">${account.gender}</td>
              <td class="py-3 px-4">
                ${account.registrationStatus?.registered ? `
                  <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-green-400 text-sm">Registered</span>
                    ${account.registrationStatus.lastLogin ? `
                      <span class="text-xs text-gray-500">
                        (${new Date(account.registrationStatus.lastLogin).toLocaleDateString()})
                      </span>
                    ` : ''}
                  </div>
                ` : `
                  <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span class="text-yellow-400 text-sm">Pending</span>
                  </div>
                `}
              </td>
              <td class="py-3 px-4 text-gray-400 text-sm">
                ${account.createdAt ? new Date(account.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end space-x-2">
                  <button onclick="editAuthorizedAccount('${account._id}', '${account.role}', '${account.gender}')" 
                    class="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit">
                    <i class="fas fa-edit text-gray-400 hover:text-white"></i>
                  </button>
                  <button onclick="confirmDeleteAuthorizedAccount('${account._id}', '${account.email}', ${account.registrationStatus?.registered})" 
                    class="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete">
                    <i class="fas fa-trash text-gray-400 hover:text-red-400"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAuthorizedPagination(pagination) {
  if (!pagination) return '';
  
  const { currentPage, totalPages, totalRecords, perPage } = pagination;
  const startRecord = ((currentPage - 1) * perPage) + 1;
  const endRecord = Math.min(currentPage * perPage, totalRecords);

  return `
    <div class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <p class="text-gray-400 text-sm">
        Showing ${startRecord} to ${endRecord} of ${totalRecords} accounts
      </p>

      <div class="flex space-x-2">
        <button 
          ${currentPage === 1 ? "disabled" : ""}
          onclick="changeAuthorizedPage(${currentPage - 1})"
          class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-chevron-left mr-1"></i> Previous
        </button>

        <div class="flex items-center space-x-1">
          ${renderAuthorizedPageNumbers(currentPage, totalPages)}
        </div>

        <button 
          ${currentPage === totalPages ? "disabled" : ""}
          onclick="changeAuthorizedPage(${currentPage + 1})"
          class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  `;
}

function renderAuthorizedPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(`
      <button onclick="changeAuthorizedPage(1)" class="w-8 h-8 rounded hover:bg-gray-700">
        1
      </button>
    `);
    if (start > 2) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(`
      <button 
        onclick="changeAuthorizedPage(${i})"
        class="w-8 h-8 rounded ${i === currentPage ? 'bg-purple-700 text-white' : 'hover:bg-gray-700'}"
      >
        ${i}
      </button>
    `);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
    pages.push(`
      <button onclick="changeAuthorizedPage(${totalPages})" class="w-8 h-8 rounded hover:bg-gray-700">
        ${totalPages}
      </button>
    `);
  }

  return pages.join('');
}

// ============ AUTHORIZED ACCOUNTS MODAL FUNCTIONS ============
function showAddAccountModal() {
  const modalHtml = `
    <div id="add-account-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Add Authorized Account</h3>
          <button onclick="closeModal()" class="p-2 hover:bg-gray-700 rounded-lg">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="add-account-form" class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm mb-2">Email Address</label>
            <input 
              type="email" 
              id="add-email"
              required
              placeholder="user@example.com"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
            >
          </div>
          
          <div>
            <label class="block text-gray-300 text-sm mb-2">Role</label>
            <select 
              id="add-role"
              required
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="mentor">Mentor</option>
              <option value="head_mentor">Head Mentor</option>
              <option value="mentee">Mentee</option>
            </select>
          </div>
          
          <div>
            <label class="block text-gray-300 text-sm mb-2">Gender</label>
            <select 
              id="add-gender"
              required
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg">
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const existingModal = document.getElementById('add-account-modal');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('add-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('add-email').value;
    const role = document.getElementById('add-role').value;
    const gender = document.getElementById('add-gender').value;

    try {
      const result = await addAuthorizedEmail([{ email, role, gender }]);
      
      if (result.success) {
        closeModal();
        loadAuthorizedAccounts();
        alert(`Successfully added ${email}`);
      }
    } catch (error) {
      alert(error.message);
    }
  });
}

function showBulkImportModal() {
  const modalHtml = `
    <div id="bulk-import-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-xl font-bold">Bulk Import Authorized Accounts</h3>
            <p class="text-gray-400 text-sm mt-1">Upload a CSV file or paste JSON data</p>
          </div>
          <button onclick="closeModal()" class="p-2 hover:bg-gray-700 rounded-lg">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="bg-gray-900/50 p-4 rounded-lg">
            <p class="text-sm text-gray-300 mb-2">Download template:</p>
            <button onclick="downloadCSVTemplate()" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center space-x-2">
              <i class="fas fa-download"></i>
              <span>template.csv</span>
            </button>
          </div>
          
          <div>
            <label class="block text-gray-300 text-sm mb-2">Upload CSV File</label>
            <input 
              type="file" 
              id="csv-upload"
              accept=".csv"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-700 file:text-white hover:file:bg-purple-600"
            >
          </div>
          
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-800 text-gray-400">Or</span>
            </div>
          </div>
          
          <div>
            <label class="block text-gray-300 text-sm mb-2">Paste JSON Data</label>
            <textarea 
              id="json-input"
              rows="6"
              placeholder='[
  {"email": "user1@example.com", "role": "mentor", "gender": "male"},
  {"email": "user2@example.com", "role": "mentee", "gender": "female"}
]'
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-purple-600"
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              Cancel
            </button>
            <button onclick="processBulkImport()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg">
              Import Accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function processBulkImport() {
  const fileInput = document.getElementById('csv-upload');
  const jsonInput = document.getElementById('json-input');
  
  try {
    let emails = [];

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const text = await file.text();
      emails = parseCSV(text);
    }
    else if (jsonInput.value.trim()) {
      emails = JSON.parse(jsonInput.value.trim());
    } else {
      alert('Please upload a CSV file or paste JSON data');
      return;
    }

    if (emails.length === 0) {
      alert('No valid email data found');
      return;
    }

    const result = await bulkImportAuthorizedEmails(emails);
    
    closeModal();
    loadAuthorizedAccounts();
    showBulkImportResults(result);
    
  } catch (error) {
    alert(`Bulk import failed: ${error.message}`);
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const emails = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    if (row.email && row.role && row.gender) {
      emails.push(row);
    }
  }
  
  return emails;
}

function showBulkImportResults(result) {
  const { successful, total, duplicates, failed } = result.results;
  
  const modalHtml = `
    <div id="import-results-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Import Results</h3>
          <button onclick="closeModal()" class="p-2 hover:bg-gray-700 rounded-lg">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-gray-900/50 p-3 rounded-lg text-center">
              <p class="text-2xl font-bold ${successful === total ? 'text-green-400' : ''}">${successful}</p>
              <p class="text-xs text-gray-400">Successful</p>
            </div>
            <div class="bg-gray-900/50 p-3 rounded-lg text-center">
              <p class="text-2xl font-bold text-yellow-400">${duplicates.length}</p>
              <p class="text-xs text-gray-400">Duplicates</p>
            </div>
            <div class="bg-gray-900/50 p-3 rounded-lg text-center">
              <p class="text-2xl font-bold text-red-400">${failed.length}</p>
              <p class="text-xs text-gray-400">Failed</p>
            </div>
          </div>
          
          ${failed.length > 0 ? `
            <div>
              <h4 class="font-medium mb-2 text-red-400">Failed Imports</h4>
              <div class="max-h-32 overflow-y-auto bg-gray-900/30 p-3 rounded-lg">
                ${failed.map(f => `
                  <div class="text-sm py-1">
                    <span class="font-mono">${f.email || 'Unknown'}</span>
                    <span class="text-red-400 text-xs ml-2">${f.error}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="flex justify-end mt-4">
            <button onclick="closeModal()" class="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function editAuthorizedAccount(id, currentRole, currentGender) {
  const modalHtml = `
    <div id="edit-account-modal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Edit Authorized Account</h3>
          <button onclick="closeModal()" class="p-2 hover:bg-gray-700 rounded-lg">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="edit-account-form" class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm mb-2">Role</label>
            <select 
              id="edit-role"
              required
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
            >
              <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="mentor" ${currentRole === 'mentor' ? 'selected' : ''}>Mentor</option>
              <option value="head_mentor" ${currentRole === 'head_mentor' ? 'selected' : ''}>Head Mentor</option>
              <option value="mentee" ${currentRole === 'mentee' ? 'selected' : ''}>Mentee</option>
            </select>
          </div>
          
          <div>
            <label class="block text-gray-300 text-sm mb-2">Gender</label>
            <select 
              id="edit-gender"
              required
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
            >
              <option value="male" ${currentGender === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${currentGender === 'female' ? 'selected' : ''}>Female</option>
            </select>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg">
              Update Account
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('edit-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const role = document.getElementById('edit-role').value;
    const gender = document.getElementById('edit-gender').value;

    try {
      const result = await updateAuthorizedEmail(id, { role, gender });
      
      if (result.success) {
        closeModal();
        loadAuthorizedAccounts();
        alert('Account updated successfully');
      }
    } catch (error) {
      alert(error.message);
    }
  });
}

async function confirmDeleteAuthorizedAccount(id, email, isRegistered) {
  const message = isRegistered 
    ? `This user (${email}) has already registered. Delete anyway? This will NOT remove their user account.`
    : `Are you sure you want to remove ${email} from authorized accounts?`;

  if (!confirm(message)) return;

  try {
    const hardDelete = isRegistered ? confirm('Force delete? This will remove them from authorized list but keep their user account. Click OK to force delete.') : false;
    
    const result = await deleteAuthorizedEmail(id, hardDelete);
    
    if (result.success) {
      loadAuthorizedAccounts();
      alert(`Successfully removed ${email}`);
    }
  } catch (error) {
    alert(error.message);
  }
}

// ============ AUTHORIZED ACCOUNTS UTILITY FUNCTIONS ============
function closeModal() {
  const modals = document.querySelectorAll('[id$="-modal"]');
  modals.forEach(modal => modal.remove());
}

function downloadCSVTemplate() {
  const headers = ['email', 'role', 'gender'];
  const exampleRows = [
    ['mentor1@example.com', 'mentor', 'male'],
    ['mentee1@example.com', 'mentee', 'female'],
    ['admin@example.com', 'admin', 'male']
  ];
  
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'authorized-accounts-template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

async function applyAuthorizedFilters() {
  authorizedAccountsState.page = 1;
  await loadAuthorizedAccounts();
}

async function resetAuthorizedFilters() {
  authorizedAccountsState.search = '';
  authorizedAccountsState.roleFilter = '';
  authorizedAccountsState.genderFilter = '';
  authorizedAccountsState.page = 1;
  await loadAuthorizedAccounts();
}

async function changeAuthorizedPage(newPage) {
  if (authorizedAccountsState.loading || newPage < 1) return;
  
  authorizedAccountsState.page = newPage;
  await loadAuthorizedAccounts();
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

    loadTab("dashboard");
  } catch (error) {
    console.error("Auth initialization failed:", error);
    window.location.href = "../login";
  }
}


// ============ COMMUNICATIONS TAB ============
const communicationsState = {
  page: 1,
  limit: 10,
  loading: false,
  search: '',
  statusFilter: '',
  priorityFilter: '',
  typeFilter: '',
  currentView: 'list', // 'list', 'create', 'edit', 'detail'
  currentCommunicationId: null
};

// ============ API FUNCTIONS ============
async function fetchCommunications(params = {}) {
  const {
    page = communicationsState.page,
    limit = communicationsState.limit,
    search = communicationsState.search,
    status = communicationsState.statusFilter,
    priority = communicationsState.priorityFilter,
    type = communicationsState.typeFilter
  } = params;

  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(type && { type })
  });

  const res = await fetch(`/api/communications?${queryParams}`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch communications");
  }

  return res.json();
}

async function fetchCommunicationById(id) {
  const res = await fetch(`/api/communications/${id}`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch communication");
  }

  return res.json();
}

async function fetchCommunicationStats() {
  const res = await fetch(`/api/communications/stats/dashboard`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch statistics");
  }

  return res.json();
}

async function createCommunication(data) {
  const res = await fetch(`/api/communications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data),
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create communication");
  }

  return res.json();
}

async function updateCommunication(id, data) {
  const res = await fetch(`/api/communications/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data),
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update communication");
  }

  return res.json();
}

async function deleteCommunication(id) {
  const res = await fetch(`/api/communications/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete communication");
  }

  return res.json();
}

async function sendCommunicationEmail(id) {
  const res = await fetch(`/api/communications/${id}/send-email`, {
    method: "POST",
    credentials: "include"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send email");
  }

  return res.json();
}

// ============ MAIN LOAD FUNCTION ============
async function loadCommunications() {
  try {
    communicationsState.loading = true;
    communicationsState.currentView = 'list';
    
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-center h-32">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading communications...</p>
          </div>
        </div>
      </div>
    `;

    const [commsResult, statsResult] = await Promise.all([
      fetchCommunications(),
      fetchCommunicationStats()
    ]);
    
    if (!commsResult.success) {
      throw new Error(commsResult.error || "Failed to load communications");
    }

    renderCommunicationsList(commsResult.data, commsResult.pagination, statsResult.data);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load communications</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <button onclick="loadCommunications()" class="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
          Try Again
        </button>
      </div>
    `;
  } finally {
    communicationsState.loading = false;
  }
}

// ============ RENDER FUNCTIONS ============
function renderCommunicationsList(communications, pagination, stats) {
  tabContent.innerHTML = `
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Total</p>
              <p class="text-2xl font-bold">${stats?.total || 0}</p>
            </div>
            <div class="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-bullhorn text-purple-400"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Published</p>
              <p class="text-2xl font-bold text-green-400">${stats?.byStatus?.published || 0}</p>
            </div>
            <div class="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-check-circle text-green-400"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Drafts</p>
              <p class="text-2xl font-bold text-yellow-400">${stats?.byStatus?.draft || 0}</p>
            </div>
            <div class="w-10 h-10 bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-pen text-yellow-400"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Scheduled</p>
              <p class="text-2xl font-bold text-blue-400">${stats?.byStatus?.scheduled || 0}</p>
            </div>
            <div class="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-calendar text-blue-400"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm">Urgent</p>
              <p class="text-2xl font-bold text-red-400">${stats?.byPriority?.urgent || 0}</p>
            </div>
            <div class="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center">
              <i class="fas fa-exclamation-triangle text-red-400"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 class="text-2xl font-bold">Communications</h2>
            <p class="text-gray-400">Manage and send announcements to users</p>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="showCreateCommunication()" 
              class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg flex items-center space-x-2">
              <i class="fas fa-plus"></i>
              <span>New Communication</span>
            </button>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="communication-search"
              placeholder="Search by title or content..." 
              value="${communicationsState.search || ''}"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            >
            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <select id="communication-status-filter" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
              <option value="">All Status</option>
              <option value="published" ${communicationsState.statusFilter === 'published' ? 'selected' : ''}>Published</option>
              <option value="draft" ${communicationsState.statusFilter === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="scheduled" ${communicationsState.statusFilter === 'scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="archived" ${communicationsState.statusFilter === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
            
            <select id="communication-priority-filter" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
              <option value="">All Priorities</option>
              <option value="low" ${communicationsState.priorityFilter === 'low' ? 'selected' : ''}>Low</option>
              <option value="normal" ${communicationsState.priorityFilter === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="high" ${communicationsState.priorityFilter === 'high' ? 'selected' : ''}>High</option>
              <option value="urgent" ${communicationsState.priorityFilter === 'urgent' ? 'selected' : ''}>Urgent</option>
            </select>
            
            <button onclick="applyCommunicationFilters()" class="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg">
              Apply
            </button>
            <button onclick="resetCommunicationFilters()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              Reset
            </button>
          </div>
        </div>

        <!-- Communications Table -->
        ${renderCommunicationsTable(communications)}
        
        <!-- Pagination -->
        ${renderCommunicationsPagination(pagination)}
      </div>
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    const searchInput = document.getElementById('communication-search');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          communicationsState.search = e.target.value;
          communicationsState.page = 1;
          loadCommunications();
        }, 500);
      });
    }

    const statusFilter = document.getElementById('communication-status-filter');
    const priorityFilter = document.getElementById('communication-priority-filter');
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        communicationsState.statusFilter = statusFilter.value;
      });
    }
    
    if (priorityFilter) {
      priorityFilter.addEventListener('change', () => {
        communicationsState.priorityFilter = priorityFilter.value;
      });
    }
  }, 0);
}

function renderCommunicationsTable(communications) {
  if (!communications || communications.length === 0) {
    return `
      <div class="text-center py-12 text-gray-400">
        <div class="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-bullhorn text-4xl text-gray-600"></i>
        </div>
        <h3 class="text-lg font-medium mb-2">No communications found</h3>
        <p class="text-gray-500">Create your first announcement to get started</p>
        <button onclick="showCreateCommunication()" 
          class="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg inline-flex items-center space-x-2">
          <i class="fas fa-plus"></i>
          <span>Create Communication</span>
        </button>
      </div>
    `;
  }

  return `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="text-gray-400 border-b border-gray-700">
            <th class="py-3 px-4">Title</th>
            <th class="py-3 px-4">Type</th>
            <th class="py-3 px-4">Priority</th>
            <th class="py-3 px-4">Audience</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Email</th>
            <th class="py-3 px-4">Views</th>
            <th class="py-3 px-4">Created</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${communications.map(comm => {
            const priorityColors = {
              low: 'bg-gray-900/50 text-gray-300',
              normal: 'bg-blue-900/50 text-blue-300',
              high: 'bg-yellow-900/50 text-yellow-300',
              urgent: 'bg-red-900/50 text-red-300'
            };
            
            const statusColors = {
              draft: 'bg-gray-900/50 text-gray-300',
              published: 'bg-green-900/50 text-green-300',
              scheduled: 'bg-blue-900/50 text-blue-300',
              archived: 'bg-gray-700/50 text-gray-400'
            };

            const typeIcons = {
              announcement: 'fa-bullhorn',
              reminder: 'fa-bell',
              alert: 'fa-exclamation-triangle',
              newsletter: 'fa-newspaper',
              other: 'fa-file-alt'
            };

            return `
              <tr class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer" onclick="viewCommunicationDetail('${comm._id}')">
                <td class="py-3 px-4">
                  <div class="flex items-center space-x-2">
                    <i class="fas ${typeIcons[comm.type] || 'fa-bullhorn'} text-gray-400"></i>
                    <div>
                      <p class="font-medium">${comm.title}</p>
                      ${comm.summary ? `<p class="text-xs text-gray-500">${comm.summary.substring(0, 50)}${comm.summary.length > 50 ? '...' : ''}</p>` : ''}
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 capitalize">${comm.type}</td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityColors[comm.priority] || 'bg-gray-900/50'}">
                    ${comm.priority}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 bg-gray-800 rounded-full text-xs">
                    ${comm.audience?.type === 'all' ? 'All Users' : 
                      comm.audience?.type === 'specific_roles' ? comm.audience.roles.join(', ') : 
                      `${comm.audience?.users?.length || 0} users`}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[comm.status] || 'bg-gray-900/50'}">
                    ${comm.status}
                  </span>
                </td>
                <td class="py-3 px-4">
                  ${comm.sendEmail ? `
                    <div class="flex items-center space-x-1">
                      <i class="fas fa-envelope ${comm.emailSent ? 'text-green-400' : 'text-yellow-400'}"></i>
                      <span class="text-xs ${comm.emailSent ? 'text-green-400' : 'text-yellow-400'}">
                        ${comm.emailSent ? 'Sent' : 'Pending'}
                      </span>
                    </div>
                  ` : `
                    <span class="text-gray-500 text-xs">No email</span>
                  `}
                </td>
                <td class="py-3 px-4 text-gray-400">
                  <div class="flex items-center space-x-1">
                    <i class="fas fa-eye text-xs"></i>
                    <span>${comm.views || 0}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-gray-400 text-sm">
                  ${new Date(comm.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                  <span class="text-xs text-gray-500">
                    by ${comm.createdBy?.fullName?.split(' ')[0] || 'Admin'}
                  </span>
                </td>
                <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
                  <div class="flex items-center justify-end space-x-2">
                    <button onclick="editCommunication('${comm._id}')" class="p-1 hover:bg-gray-600 rounded transition-colors" title="Edit">
                      <i class="fas fa-edit text-gray-400 hover:text-white"></i>
                    </button>
                    ${comm.status === 'published' && !comm.emailSent ? `
                      <button onclick="sendCommunicationEmailNow('${comm._id}')" class="p-1 hover:bg-gray-600 rounded transition-colors" title="Send Email">
                        <i class="fas fa-envelope text-gray-400 hover:text-white"></i>
                      </button>
                    ` : ''}
                    <button onclick="deleteCommunicationPrompt('${comm._id}', '${comm.title.replace(/'/g, "\\'")}')" class="p-1 hover:bg-gray-600 rounded transition-colors" title="Delete">
                      <i class="fas fa-trash text-gray-400 hover:text-red-400"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderCommunicationsPagination(pagination) {
  if (!pagination) return '';
  
  const { currentPage, totalPages, totalRecords, perPage } = pagination;
  const startRecord = ((currentPage - 1) * perPage) + 1;
  const endRecord = Math.min(currentPage * perPage, totalRecords);

  return `
    <div class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <p class="text-gray-400 text-sm">
        Showing ${startRecord} to ${endRecord} of ${totalRecords} communications
      </p>

      <div class="flex space-x-2">
        <button 
          ${currentPage === 1 ? "disabled" : ""}
          onclick="changeCommunicationsPage(${currentPage - 1})"
          class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fas fa-chevron-left mr-1"></i> Previous
        </button>

        <div class="flex items-center space-x-1">
          ${renderCommunicationsPageNumbers(currentPage, totalPages)}
        </div>

        <button 
          ${currentPage === totalPages ? "disabled" : ""}
          onclick="changeCommunicationsPage(${currentPage + 1})"
          class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  `;
}

function renderCommunicationsPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(`
      <button onclick="changeCommunicationsPage(1)" class="w-8 h-8 rounded hover:bg-gray-700">
        1
      </button>
    `);
    if (start > 2) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(`
      <button 
        onclick="changeCommunicationsPage(${i})"
        class="w-8 h-8 rounded ${i === currentPage ? 'bg-purple-700 text-white' : 'hover:bg-gray-700'}"
      >
        ${i}
      </button>
    `);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push(`<span class="w-8 h-8 flex items-center justify-center">...</span>`);
    }
    pages.push(`
      <button onclick="changeCommunicationsPage(${totalPages})" class="w-8 h-8 rounded hover:bg-gray-700">
        ${totalPages}
      </button>
    `);
  }

  return pages.join('');
}

// ============ CREATE/EDIT COMMUNICATION ============
function showCreateCommunication() {
  communicationsState.currentView = 'create';
  
  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div class="flex items-center space-x-3 mb-6">
        <button onclick="loadCommunications()" class="p-2 rounded-lg hover:bg-gray-700">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h2 class="text-2xl font-bold">Create New Communication</h2>
      </div>
      
      ${renderCommunicationForm()}
    </div>
  `;

  initializeCommunicationForm();
}

function editCommunication(id) {
  communicationsState.currentView = 'edit';
  communicationsState.currentCommunicationId = id;
  
  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div class="flex items-center space-x-3 mb-6">
        <button onclick="loadCommunications()" class="p-2 rounded-lg hover:bg-gray-700">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h2 class="text-2xl font-bold">Edit Communication</h2>
      </div>
      
      <div id="communication-form-container">
        <div class="flex justify-center py-8">
          <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  `;

  loadCommunicationForEdit(id);
}

async function loadCommunicationForEdit(id) {
  try {
    const result = await fetchCommunicationById(id);
    
    if (result.success) {
      const container = document.getElementById('communication-form-container');
      container.innerHTML = renderCommunicationForm(result.data);
      initializeCommunicationForm(result.data);
    }
  } catch (error) {
    alert('Failed to load communication: ' + error.message);
    loadCommunications();
  }
}

function renderCommunicationForm(communication = null) {
  const isEdit = !!communication;
  
  return `
    <form id="communication-form" class="space-y-6">
      <!-- Title -->
      <div>
        <label class="block text-gray-300 text-sm mb-2">
          Title <span class="text-red-400">*</span>
        </label>
        <input 
          type="text" 
          id="comm-title"
          value="${communication?.title || ''}"
          required
          maxlength="200"
          placeholder="Enter communication title"
          class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
        >
      </div>

      <!-- Summary -->
      <div>
        <label class="block text-gray-300 text-sm mb-2">
          Summary (Optional)
        </label>
        <input 
          type="text" 
          id="comm-summary"
          value="${communication?.summary || ''}"
          maxlength="500"
          placeholder="Brief summary of the communication"
          class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
        >
      </div>

      <!-- Content -->
      <div>
        <label class="block text-gray-300 text-sm mb-2">
          Content <span class="text-red-400">*</span>
        </label>
        <textarea 
          id="comm-content"
          required
          rows="8"
          placeholder="Write your communication content here..."
          class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
        >${communication?.content || ''}</textarea>
      </div>

      <!-- Type and Priority -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-300 text-sm mb-2">Type</label>
          <select id="comm-type" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
            <option value="announcement" ${communication?.type === 'announcement' ? 'selected' : ''}>Announcement</option>
            <option value="reminder" ${communication?.type === 'reminder' ? 'selected' : ''}>Reminder</option>
            <option value="alert" ${communication?.type === 'alert' ? 'selected' : ''}>Alert</option>
            <option value="newsletter" ${communication?.type === 'newsletter' ? 'selected' : ''}>Newsletter</option>
            <option value="other" ${communication?.type === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        
        <div>
          <label class="block text-gray-300 text-sm mb-2">Priority</label>
          <select id="comm-priority" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
            <option value="low" ${communication?.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="normal" ${communication?.priority === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="high" ${communication?.priority === 'high' ? 'selected' : ''}>High</option>
            <option value="urgent" ${communication?.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
          </select>
        </div>
      </div>

      <!-- Audience -->
      <div>
        <label class="block text-gray-300 text-sm mb-2">
          Audience <span class="text-red-400">*</span>
        </label>
        <div class="space-y-4">
          <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2">
              <input type="radio" name="audience-type" value="all" 
                ${!communication?.audience?.type || communication?.audience?.type === 'all' ? 'checked' : ''}>
              <span>All Users</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="radio" name="audience-type" value="specific_roles"
                ${communication?.audience?.type === 'specific_roles' ? 'checked' : ''}>
              <span>Specific Roles</span>
            </label>
            <label class="flex items-center space-x-2">
              <input type="radio" name="audience-type" value="specific_users"
                ${communication?.audience?.type === 'specific_users' ? 'checked' : ''}>
              <span>Specific Users</span>
            </label>
          </div>

          <!-- Role Selection -->
          <div id="role-selection" class="pl-6 ${communication?.audience?.type === 'specific_roles' ? '' : 'hidden'}">
            <p class="text-sm text-gray-400 mb-2">Select Roles:</p>
            <div class="flex flex-wrap gap-3">
              <label class="flex items-center space-x-2">
                <input type="checkbox" value="admin" ${communication?.audience?.roles?.includes('admin') ? 'checked' : ''}>
                <span>Admin</span>
              </label>
              <label class="flex items-center space-x-2">
                <input type="checkbox" value="head_mentor" ${communication?.audience?.roles?.includes('head_mentor') ? 'checked' : ''}>
                <span>Head Mentor</span>
              </label>
              <label class="flex items-center space-x-2">
                <input type="checkbox" value="mentor" ${communication?.audience?.roles?.includes('mentor') ? 'checked' : ''}>
                <span>Mentor</span>
              </label>
              <label class="flex items-center space-x-2">
                <input type="checkbox" value="mentee" ${communication?.audience?.roles?.includes('mentee') ? 'checked' : ''}>
                <span>Mentee</span>
              </label>
            </div>
          </div>

          <!-- User Selection (simplified - you can enhance this with a user picker) -->
          <div id="user-selection" class="pl-6 ${communication?.audience?.type === 'specific_users' ? '' : 'hidden'}">
            <p class="text-sm text-gray-400 mb-2">User Selection (Coming Soon):</p>
            <p class="text-xs text-yellow-400">For now, please use role-based selection</p>
          </div>
        </div>
      </div>

      <!-- Email and Status Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-300 text-sm mb-2">Status</label>
          <select id="comm-status" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600">
            <option value="draft" ${communication?.status === 'draft' || !communication ? 'selected' : ''}>Draft</option>
            <option value="published" ${communication?.status === 'published' ? 'selected' : ''}>Publish Now</option>
            <option value="scheduled" ${communication?.status === 'scheduled' ? 'selected' : ''}>Schedule</option>
          </select>
        </div>
        
        <div id="schedule-field" class="${communication?.status === 'scheduled' ? '' : 'hidden'}">
          <label class="block text-gray-300 text-sm mb-2">Schedule Date</label>
          <input 
            type="datetime-local" 
            id="comm-scheduled"
            value="${communication?.scheduledFor ? new Date(communication.scheduledFor).toISOString().slice(0, 16) : ''}"
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-600"
          >
        </div>
      </div>

      <!-- Email Option -->
      <div class="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="comm-send-email"
          ${communication?.sendEmail ? 'checked' : ''}
          class="w-4 h-4 text-purple-600 rounded bg-gray-900 border-gray-700"
        >
        <label for="comm-send-email" class="text-gray-300">
          Send email notification to recipients
        </label>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-700">
        <button type="button" onclick="loadCommunications()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Cancel
        </button>
        <button type="submit" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg">
          ${isEdit ? 'Update' : 'Create'} Communication
        </button>
      </div>
    </form>
  `;
}

function initializeCommunicationForm(communication = null) {
  // Audience type toggle
  const audienceRadios = document.querySelectorAll('input[name="audience-type"]');
  const roleSelection = document.getElementById('role-selection');
  const userSelection = document.getElementById('user-selection');
  
  audienceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'specific_roles') {
        roleSelection.classList.remove('hidden');
        userSelection.classList.add('hidden');
      } else if (e.target.value === 'specific_users') {
        roleSelection.classList.add('hidden');
        userSelection.classList.remove('hidden');
      } else {
        roleSelection.classList.add('hidden');
        userSelection.classList.add('hidden');
      }
    });
  });

  // Status toggle for schedule field
  const statusSelect = document.getElementById('comm-status');
  const scheduleField = document.getElementById('schedule-field');
  
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      if (e.target.value === 'scheduled') {
        scheduleField.classList.remove('hidden');
      } else {
        scheduleField.classList.add('hidden');
      }
    });
  }

  // Form submission
  const form = document.getElementById('communication-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('comm-title').value;
    const content = document.getElementById('comm-content').value;
    const summary = document.getElementById('comm-summary')?.value;
    const type = document.getElementById('comm-type').value;
    const priority = document.getElementById('comm-priority').value;
    const status = document.getElementById('comm-status').value;
    const sendEmail = document.getElementById('comm-send-email').checked;
    const scheduledFor = document.getElementById('comm-scheduled')?.value;
    
    // Get audience
    const audienceType = document.querySelector('input[name="audience-type"]:checked')?.value;
    let audience = { type: audienceType };
    
    if (audienceType === 'specific_roles') {
      const roleCheckboxes = document.querySelectorAll('#role-selection input[type="checkbox"]:checked');
      audience.roles = Array.from(roleCheckboxes).map(cb => cb.value);
      if (audience.roles.length === 0) {
        alert('Please select at least one role');
        return;
      }
    }

    const data = {
      title,
      content,
      summary,
      type,
      priority,
      status,
      audience,
      sendEmail,
      ...(scheduledFor && { scheduledFor: new Date(scheduledFor).toISOString() })
    };

    try {
      let result;
      if (communication) {
        // Update existing
        result = await updateCommunication(communication._id, data);
      } else {
        // Create new
        result = await createCommunication(data);
      }
      
      if (result.success) {
        loadCommunications();
      }
    } catch (error) {
      alert(error.message);
    }
  });
}

// ============ COMMUNICATION DETAIL VIEW ============
async function viewCommunicationDetail(id) {
  try {
    communicationsState.currentView = 'detail';
    communicationsState.currentCommunicationId = id;
    
    tabContent.innerHTML = `
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="flex items-center justify-center h-64">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400">Loading communication...</p>
          </div>
        </div>
      </div>
    `;

    const result = await fetchCommunicationById(id);
    
    if (!result.success) {
      throw new Error(result.message || "Failed to load communication");
    }

    renderCommunicationDetail(result.data);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900/50 border border-red-700 p-4 rounded-lg">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-circle text-red-400"></i>
          <h3 class="font-bold">Failed to load communication</h3>
        </div>
        <p class="text-gray-300 mt-2">${err.message}</p>
        <div class="flex space-x-2 mt-3">
          <button onclick="loadCommunications()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
            Back to List
          </button>
        </div>
      </div>
    `;
  }
}

function renderCommunicationDetail(communication) {
  const priorityColors = {
    low: 'bg-gray-900/50 text-gray-300',
    normal: 'bg-blue-900/50 text-blue-300',
    high: 'bg-yellow-900/50 text-yellow-300',
    urgent: 'bg-red-900/50 text-red-300'
  };
  
  const statusColors = {
    draft: 'bg-gray-900/50 text-gray-300',
    published: 'bg-green-900/50 text-green-300',
    scheduled: 'bg-blue-900/50 text-blue-300',
    archived: 'bg-gray-700/50 text-gray-400'
  };

  tabContent.innerHTML = `
    <div class="bg-gray-800 rounded-lg border border-gray-700">
      <!-- Header -->
      <div class="p-6 border-b border-gray-700">
        <div class="flex justify-between items-start">
          <div class="flex items-center space-x-3">
            <button onclick="loadCommunications()" class="p-2 rounded-lg hover:bg-gray-700">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div>
              <div class="flex items-center space-x-3 mb-2">
                <h2 class="text-2xl font-bold">${communication.title}</h2>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[communication.status]}">
                  ${communication.status}
                </span>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityColors[communication.priority]}">
                  ${communication.priority}
                </span>
              </div>
              <p class="text-gray-400">
                Created by ${communication.createdBy?.fullName || 'Admin'} on 
                ${new Date(communication.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button onclick="editCommunication('${communication._id}')" 
              class="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg flex items-center space-x-2">
              <i class="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            ${communication.status === 'published' && !communication.emailSent ? `
              <button onclick="sendCommunicationEmailNow('${communication._id}')" 
                class="px-3 py-1 bg-green-700 hover:bg-green-600 rounded-lg flex items-center space-x-2">
                <i class="fas fa-envelope"></i>
                <span>Send Email</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Summary -->
        ${communication.summary ? `
          <div class="bg-gray-900/50 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-1">Summary</p>
            <p class="text-gray-300">${communication.summary}</p>
          </div>
        ` : ''}

        <!-- Main Content -->
        <div>
          <h3 class="text-lg font-bold text-gray-300 mb-3">Content</h3>
          <div class="bg-gray-900 p-6 rounded-lg prose prose-invert max-w-none">
            ${communication.content.split('\n').map(p => `<p class="mb-2">${p}</p>`).join('')}
          </div>
        </div>

        <!-- Audience Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-700">
          <div>
            <p class="text-gray-400 text-sm mb-1">Audience</p>
            <p class="font-medium capitalize">
              ${communication.audience?.type === 'all' ? 'All Users' : 
                communication.audience?.type === 'specific_roles' ? communication.audience.roles.join(', ') : 
                `${communication.audience?.users?.length || 0} Specific Users`}
            </p>
          </div>
          
          <div>
            <p class="text-gray-400 text-sm mb-1">Type</p>
            <p class="font-medium capitalize">${communication.type}</p>
          </div>
          
          <div>
            <p class="text-gray-400 text-sm mb-1">Email Status</p>
            ${communication.sendEmail ? `
              <div class="flex items-center space-x-2">
                <i class="fas fa-envelope ${communication.emailSent ? 'text-green-400' : 'text-yellow-400'}"></i>
                <span class="${communication.emailSent ? 'text-green-400' : 'text-yellow-400'}">
                  ${communication.emailSent ? `Sent on ${new Date(communication.emailSentAt).toLocaleDateString()}` : 'Pending'}
                </span>
              </div>
            ` : `
              <span class="text-gray-500">No email notification</span>
            `}
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-700">
          <div class="bg-gray-900/50 p-3 rounded-lg text-center">
            <p class="text-2xl font-bold">${communication.views || 0}</p>
            <p class="text-xs text-gray-400">Views</p>
          </div>
          <div class="bg-gray-900/50 p-3 rounded-lg text-center">
            <p class="text-2xl font-bold">${communication.readBy?.length || 0}</p>
            <p class="text-xs text-gray-400">Read</p>
          </div>
          <div class="bg-gray-900/50 p-3 rounded-lg text-center">
            <p class="text-2xl font-bold">${communication.readBy?.length || 0}</p>
            <p class="text-xs text-gray-400">Read</p>
          </div>
          <div class="bg-gray-900/50 p-3 rounded-lg text-center">
            <p class="text-2xl font-bold">${communication.audience?.type === 'all' ? 'All' : 
              communication.audience?.roles?.length || communication.audience?.users?.length || 0}</p>
            <p class="text-xs text-gray-400">Target</p>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-700 text-sm">
          <div>
            <p class="text-gray-400">Created</p>
            <p>${new Date(communication.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p class="text-gray-400">Last Updated</p>
            <p>${new Date(communication.updatedAt).toLocaleString()}</p>
          </div>
          ${communication.publishedAt ? `
            <div>
              <p class="text-gray-400">Published</p>
              <p>${new Date(communication.publishedAt).toLocaleString()}</p>
            </div>
          ` : ''}
          ${communication.scheduledFor ? `
            <div>
              <p class="text-gray-400">Scheduled For</p>
              <p>${new Date(communication.scheduledFor).toLocaleString()}</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-700 flex justify-between">
        <button onclick="loadCommunications()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Back to Communications
        </button>
        <button onclick="deleteCommunicationPrompt('${communication._id}', '${communication.title.replace(/'/g, "\\'")}')" 
          class="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg flex items-center space-x-2">
          <i class="fas fa-trash"></i>
          <span>Delete</span>
        </button>
      </div>
    </div>
  `;
}

// ============ UTILITY FUNCTIONS ============
async function changeCommunicationsPage(newPage) {
  if (communicationsState.loading || newPage < 1) return;
  
  communicationsState.page = newPage;
  await loadCommunications();
}

async function applyCommunicationFilters() {
  communicationsState.page = 1;
  await loadCommunications();
}

async function resetCommunicationFilters() {
  communicationsState.search = '';
  communicationsState.statusFilter = '';
  communicationsState.priorityFilter = '';
  communicationsState.typeFilter = '';
  communicationsState.page = 1;
  await loadCommunications();
}

async function sendCommunicationEmailNow(id) {
  if (!confirm('Send email notification to all recipients?')) return;
  
  try {
    const result = await sendCommunicationEmail(id);
    alert(result.message || 'Email sent successfully!');
    loadCommunications(); // Reload to show updated status
  } catch (error) {
    alert('Failed to send email: ' + error.message);
  }
}

async function deleteCommunicationPrompt(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
  
  try {
    const result = await deleteCommunication(id);
    if (result.success) {
      loadCommunications();
    }
  } catch (error) {
    alert('Failed to delete communication: ' + error.message);
  }
}

// ============ GLOBAL FUNCTIONS ============
window.loadCommunications = loadCommunications;
window.showCreateCommunication = showCreateCommunication;
window.editCommunication = editCommunication;
window.viewCommunicationDetail = viewCommunicationDetail;
window.deleteCommunicationPrompt = deleteCommunicationPrompt;
window.sendCommunicationEmailNow = sendCommunicationEmailNow;
window.changeCommunicationsPage = changeCommunicationsPage;
window.applyCommunicationFilters = applyCommunicationFilters;
window.resetCommunicationFilters = resetCommunicationFilters;

// ============ GLOBAL FUNCTIONS ============
window.loadUsers = loadUsers;
window.handleLogout = handleLogout;
window.changeUsersPage = changeUsersPage;
window.loadApplications = loadApplications;
window.viewApplicationDetail = viewApplicationDetail;
window.changeApplicationsPage = changeApplicationsPage;

window.viewUserDetails = viewUserDetails;
window.applyUserFilters = applyUserFilters;
window.resetUserFilters = resetUserFilters;
window.exportUsers = exportUsers;

// Authorized Accounts Global Functions
window.loadAuthorizedAccounts = loadAuthorizedAccounts;
window.showAddAccountModal = showAddAccountModal;
window.showBulkImportModal = showBulkImportModal;
window.processBulkImport = processBulkImport;
window.editAuthorizedAccount = editAuthorizedAccount;
window.confirmDeleteAuthorizedAccount = confirmDeleteAuthorizedAccount;
window.closeModal = closeModal;
window.applyAuthorizedFilters = applyAuthorizedFilters;
window.resetAuthorizedFilters = resetAuthorizedFilters;
window.changeAuthorizedPage = changeAuthorizedPage;
window.downloadCSVTemplate = downloadCSVTemplate;



// Initialize the dashboard
InitializeDashboard();