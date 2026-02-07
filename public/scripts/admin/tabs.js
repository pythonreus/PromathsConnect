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
  // dashboard: {
  //   load: loadDashboard
  // },
  users: {
    load: loadUsers
  },
  // applications: {
  //   load: loadApplications
  // },
  // system: {
  //   load: loadSystem
  // },
  // settings: {
  //   load: loadSettings
  // }
};


const usersState = {
  page: 1,
  loading: false
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
  }

  catch (error) {
    console.error("Logout failed:", error);
  }
}

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
      <div class="text-gray-400">Loading users...</div>
    `;

    const result = await fetchUsers(usersState.page);

    renderUsersTab(result.data, result.pagination);
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900 p-4 rounded">
        Failed to load users: ${err.message}
      </div>
    `;
  } finally {
    usersState.loading = false;
  }
}




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

async function InitializeDashboard() {
  try {
    const response =await fetch("/api/system/me", {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      window.location.href = "../login";
      return;
    }

    const data = await response.json();
    updateHeader(data.user);

    loadTab("users");
  }

  catch (error) {
    console.error("Auth initialiazation failed:", error);
    window.location.href = "../login";
  }
}

// render users
function renderUsersTable(users) {
  return `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="text-gray-400 border-b border-gray-700">
            <th class="py-2">Name</th>
            <th>Email</th>
            <th>Gender</th>
            <th>Role</th>
            <th>Date Joined</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr class="border-b border-gray-700 hover:bg-gray-700">
              <td class="py-2 font-medium">${u.fullName}</td>
              <td>${u.email}</td>
              <td class="capitalize">${u.gender}</td>
              <td class="capitalize text-purple-400">${u.role}</td>
              <td class="text-gray-400">
                ${new Date(u.dateJoined).toLocaleDateString()}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPagination(pagination) {
  const { currentPage, totalPages } = pagination;

  return `
    <div class="flex justify-between items-center mt-4">
      <p class="text-gray-400 text-sm">
        Page ${currentPage} of ${totalPages}
      </p>

      <div class="flex space-x-2">
        <button 
          ${currentPage === 1 ? "disabled" : ""}
          onclick="changeUsersPage(${currentPage - 1})"
          class="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
        >
          Prev
        </button>

        <button 
          ${currentPage === totalPages ? "disabled" : ""}
          onclick="changeUsersPage(${currentPage + 1})"
          class="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
        >
          Next
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
      </div>

      ${renderUsersTable(users)}
      ${renderPagination(pagination)}
    </div>
  `;
}






InitializeDashboard();
