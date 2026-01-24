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

async function loadTab(tabName) {
  try {
    const response = await fetch(`/admin/${tabName}`, {
      credentials: "include"
    });
    if (!response.ok) throw new Error("Tab not found");
    

    const html = await response.text();
    
    tabContent.innerHTML = html;
  } catch (err) {
    tabContent.innerHTML = `
      <div class="bg-red-900 p-4 rounded">
        Failed to load tab
      </div>
    `;
  }
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

    loadTab("dashboard");
  }

  catch (error) {
    console.error("Auth initialiazation failed:", error);
    window.location.href = "../login";
  }
}

InitializeDashboard();
