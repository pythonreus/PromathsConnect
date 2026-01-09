const tabContent = document.getElementById("tab-content");
const tabButtons = document.querySelectorAll(".tab-btn");

async function loadTab(tabName) {
  try {
    const response = await fetch(`/admin/${tabName}`);
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

// Default tab
loadTab("dashboard");
