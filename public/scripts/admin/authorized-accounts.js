// ============ AUTHORIZED ACCOUNTS TAB ============
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

// ============ API FUNCTIONS ============
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

// ============ MAIN LOAD FUNCTION ============
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

// ============ RENDER FUNCTIONS ============
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

        <!-- Recently Added (if on first page and no filters) -->
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
    // Search input debounce
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

    // Filter change listeners
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

// ============ MODAL FUNCTIONS ============
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

  // Remove any existing modal
  const existingModal = document.getElementById('add-account-modal');
  if (existingModal) existingModal.remove();

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Add form submit handler
  document.getElementById('add-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('add-email').value;
    const role = document.getElementById('add-role').value;
    const gender = document.getElementById('add-gender').value;

    try {
      const result = await addAuthorizedEmail([{ email, role, gender }]);
      
      if (result.success) {
        closeModal();
        loadAuthorizedAccounts(); // Reload the list
        showToast(`Successfully added ${email}`, 'success');
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
          <!-- Template Download -->
          <div class="bg-gray-900/50 p-4 rounded-lg">
            <p class="text-sm text-gray-300 mb-2">Download template:</p>
            <button onclick="downloadCSVTemplate()" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center space-x-2">
              <i class="fas fa-download"></i>
              <span>template.csv</span>
            </button>
          </div>
          
          <!-- CSV Upload -->
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
          
          <!-- JSON Input -->
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

    // Process CSV file if uploaded
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const text = await file.text();
      emails = parseCSV(text);
    }
    // Process JSON if provided
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
    
    // Show detailed results
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
          <!-- Summary -->
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
        showToast('Account updated successfully', 'success');
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
      showToast(`Successfully removed ${email}`, 'success');
    }
  } catch (error) {
    alert(error.message);
  }
}

// ============ UTILITY FUNCTIONS ============
function closeModal() {
  const modals = document.querySelectorAll('[id$="-modal"]');
  modals.forEach(modal => modal.remove());
}

function showToast(message, type = 'info') {
  // Simple alert for now - can be enhanced with a proper toast notification
  alert(message);
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

// ============ ADD TO TABS CONFIG ============
tabs['authorized-accounts'] = {
  load: loadAuthorizedAccounts
};

// ============ EXPORT FUNCTIONS TO WINDOW ============
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