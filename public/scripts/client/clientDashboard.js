import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
    getAuth,
    signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDdnvcuqH-bGGtWmBVnbx7pPHZn0eBDfVM",
    authDomain: "promathsconnect.firebaseapp.com",
    projectId: "promathsconnect",
    appId: "1:710763166434:web:d702125639645dc8fdfcbb",
    storageBucket: "promathsconnect.firebasestorage.app",
    messagingSenderId: "710763166434",
    measurementId: "G-B6K86BCXTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ============ DOM ELEMENTS ============
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");
const userRoleEl = document.getElementById("userRole");
const userInitialEl = document.getElementById("userInitial");
const logoutBtn = document.getElementById("logoutBtn")

// ============ HEADER UPDATE ============
function updateHeader(user) {
    if (!user) return;
    
    // Set user info
    userNameEl.textContent = user.fullName || "User";
    userEmailEl.textContent = user.email;
    
    // Format role nicely
    const role = user.role || "mentee";
    userRoleEl.textContent = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Set initial
    const initial = user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U";
    userInitialEl.textContent = initial;
}

// ============ LOGOUT ============
async function handleLogout() {
    try {
        await signOut(auth);
        await fetch("/api/system/client/logout", {
            method: "POST",
            credentials: "include"
        });
        window.location.href = "/client-login";
    } catch (error) {
        console.error("Logout error:", error);
    }
}

// ============ EVENT LISTENERS ============
logoutBtn.addEventListener("click", handleLogout);


// ============ STATE MANAGEMENT ============
const state = {
    user: null,
    communications: {
        list: [],
        unreadCount: 0,
        page: 1,
        loading: false,
        hasMore: false
    },
    feedback: {
        list: [],
        page: 1,
        loading: false,
        hasMore: false
    }
};

// ============ DOM ELEMENTS (add these) ============
const tabContent = document.getElementById("tab-content");
const tabButtons = document.querySelectorAll(".tab-btn");
const unreadBadge = document.getElementById("unreadBadge");

// ============ FETCH COMMUNICATIONS ============
async function fetchCommunications(page = 1, limit = 10) {
    try {
        const user = auth.currentUser;
        if (!user) return [];
        
        const token = await user.getIdToken();
        const response = await fetch(`/api/communications?page=${page}&limit=${limit}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!response.ok) {
            console.warn(`Communications fetch failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        
        if (page === 1) {
            state.communications.list = data.data || [];
        } else {
            state.communications.list = [...state.communications.list, ...(data.data || [])];
        }
        
        state.communications.unreadCount = (data.data || []).filter(c => !c.isReadByCurrentUser).length;
        state.communications.hasMore = data.pagination?.hasNextPage || false;
        state.communications.page = page;
        state.communications.loading = false;

        // Update unread badge
        if (state.communications.unreadCount > 0) {
            unreadBadge.textContent = state.communications.unreadCount;
            unreadBadge.classList.remove('hidden');
        } else {
            unreadBadge.classList.add('hidden');
        }

        return data.data || [];
    } catch (error) {
        console.error("Error fetching communications:", error);
        return [];
    }
}

// ============ TAB SYSTEM ============
const tabs = {
    home: { load: loadHome },
    communications: { load: loadCommunicationsTab },
    feedback: { load: loadFeedbackTab }
};

async function loadTab(tabName) {
    // Update active tab styling
    tabButtons.forEach(btn => {
        btn.classList.remove("active", "text-white", "bg-gradient-to-r", "from-violet-600", "to-blue-600");
        btn.classList.add("text-gray-400");
        
        if (btn.dataset.tab === tabName) {
            btn.classList.add("active", "text-white", "bg-gradient-to-r", "from-violet-600", "to-blue-600");
            btn.classList.remove("text-gray-400");
        }
    });

    // Load tab content
    if (tabs[tabName]) {
        await tabs[tabName].load();
    }
}

// Add click listeners to tab buttons
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        loadTab(btn.dataset.tab);
    });
});


// ============ HOME TAB ============
async function loadHome() {
    const recentComms = await fetchCommunications(1, 3);
    
    tabContent.innerHTML = `
        <div class="space-y-6 fade-in">
            <!-- Welcome Banner -->
            <div class="glass-card rounded-2xl p-6 bg-gradient-to-r from-violet-900/30 to-blue-900/30">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-2">
                            Welcome back, ${state.user?.fullName?.split(' ')[0] || 'User'}!
                        </h2>
                        <p class="text-gray-300">
                            ${getTimeBasedGreeting()} Ready to make an impact today?
                        </p>
                    </div>
                    <div class="hidden md:block">
                        <i class="fas fa-hand-peace text-6xl text-violet-400 opacity-50"></i>
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="glass-card rounded-xl p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">Communications</p>
                            <p class="text-2xl font-bold text-white">${state.communications.list.length}</p>
                        </div>
                        <div class="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <i class="fas fa-bullhorn text-blue-400"></i>
                        </div>
                    </div>
                    ${state.communications.unreadCount > 0 ? `
                        <p class="text-xs text-blue-400 mt-2">
                            ${state.communications.unreadCount} unread
                        </p>
                    ` : ''}
                </div>

                <div class="glass-card rounded-xl p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">Role</p>
                            <p class="text-lg font-bold text-white capitalize">${state.user?.role?.replace('_', ' ') || 'Mentee'}</p>
                        </div>
                        <div class="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <i class="fas fa-user-graduate text-purple-400"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Communications -->
            <div class="glass-card rounded-2xl p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center">
                        <i class="fas fa-bullhorn text-blue-400 mr-2"></i>
                        Recent Communications
                    </h3>
                    <button onclick="loadTab('communications')" class="text-sm text-blue-400 hover:text-blue-300">
                        View All <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
                ${renderRecentCommunications(recentComms)}
            </div>
        </div>
    `;
}

function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 18) return "Good afternoon!";
    return "Good evening!";
}

function renderRecentCommunications(comms) {
    if (!comms || comms.length === 0) {
        return `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-bullhorn text-4xl mb-3 opacity-30"></i>
                <p>No communications yet</p>
            </div>
        `;
    }

    return `
        <div class="space-y-3">
            ${comms.map(comm => `
                <div class="communication-card ${comm.isReadByCurrentUser ? 'read' : 'unread'} rounded-lg p-4 cursor-pointer"
                     onclick="viewCommunication('${comm._id}')">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-1">
                                ${!comm.isReadByCurrentUser ? `
                                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                                ` : ''}
                                <h4 class="font-medium text-white">${comm.title}</h4>
                                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                                    ${comm.type}
                                </span>
                            </div>
                            <p class="text-sm text-gray-400 line-clamp-2">${comm.summary || comm.content.substring(0, 100)}...</p>
                            <div class="flex items-center space-x-3 mt-2 text-xs">
                                <span class="text-gray-500">
                                    <i class="far fa-calendar mr-1"></i>
                                    ${new Date(comm.createdAt).toLocaleDateString()}
                                </span>
                                <span class="text-gray-500">
                                    <i class="far fa-user mr-1"></i>
                                    ${comm.createdBy?.fullName?.split(' ')[0] || 'Admin'}
                                </span>
                            </div>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs font-medium
                            ${comm.priority === 'urgent' ? 'bg-red-900/50 text-red-300' : 
                              comm.priority === 'high' ? 'bg-yellow-900/50 text-yellow-300' : 
                              'bg-gray-800 text-gray-300'}">
                            ${comm.priority}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}


// ============ COMMUNICATIONS TAB ============
async function loadCommunicationsTab() {
    state.communications.loading = true;
    await fetchCommunications();
    
    tabContent.innerHTML = `
        <div class="space-y-6 fade-in">
            <!-- Header -->
            <div class="glass-card rounded-2xl p-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center">
                            <i class="fas fa-bullhorn text-blue-400 mr-2"></i>
                            Communications
                        </h2>
                        <p class="text-gray-400">Messages and announcements from administrators</p>
                    </div>
                </div>
            </div>

            <!-- Communications List -->
            <div class="space-y-4">
                ${renderCommunicationsList()}
            </div>

            <!-- Loading More -->
            ${state.communications.hasMore ? `
                <div class="text-center pt-4">
                    <button onclick="loadMoreCommunications()" class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm">
                        Load More
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    state.communications.loading = false;
}

function renderCommunicationsList() {
    const comms = state.communications.list;
    
    if (!comms || comms.length === 0) {
        return `
            <div class="glass-card rounded-2xl p-12 text-center">
                <i class="fas fa-bullhorn text-5xl text-gray-600 mb-4"></i>
                <h3 class="text-xl font-bold text-white mb-2">No Communications</h3>
                <p class="text-gray-400">You don't have any communications yet.</p>
            </div>
        `;
    }

    return comms.map(comm => `
        <div class="communication-card ${comm.isReadByCurrentUser ? 'read' : 'unread'} rounded-xl p-5 cursor-pointer"
             onclick="viewCommunication('${comm._id}')">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center flex-wrap gap-2 mb-2">
                        ${!comm.isReadByCurrentUser ? `
                            <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                        ` : ''}
                        <h3 class="text-lg font-bold text-white">${comm.title}</h3>
                        <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                            ${comm.type}
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs font-medium
                            ${comm.priority === 'urgent' ? 'bg-red-900/50 text-red-300' : 
                              comm.priority === 'high' ? 'bg-yellow-900/50 text-yellow-300' : 
                              comm.priority === 'normal' ? 'bg-blue-900/50 text-blue-300' : 
                              'bg-gray-800 text-gray-300'}">
                            ${comm.priority}
                        </span>
                    </div>
                    ${comm.summary ? `
                        <p class="text-gray-400 text-sm mb-2">${comm.summary}</p>
                    ` : ''}
                    <p class="text-gray-300">${comm.content.substring(0, 200)}${comm.content.length > 200 ? '...' : ''}</p>
                    <div class="flex items-center space-x-4 mt-3 text-xs">
                        <span class="text-gray-500">
                            <i class="far fa-calendar mr-1"></i>
                            ${new Date(comm.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                        <span class="text-gray-500">
                            <i class="far fa-user mr-1"></i>
                            ${comm.createdBy?.fullName || 'Admin'}
                        </span>
                        <span class="text-gray-500">
                            <i class="far fa-eye mr-1"></i>
                            ${comm.views || 0} views
                        </span>
                    </div>
                </div>
                <div class="ml-4">
                    <i class="fas fa-chevron-right text-gray-600"></i>
                </div>
            </div>
        </div>
    `).join('');
}

// ============ PAGINATION ============
window.loadMoreCommunications = async function() {
    if (state.communications.loading || !state.communications.hasMore) return;
    await fetchCommunications(state.communications.page + 1);
    await loadCommunicationsTab();
};


// ============ COMMUNICATION DETAIL ============
window.viewCommunication = async function(commId) {
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`/api/communications/${commId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });
        
        if (!response.ok) throw new Error("Failed to fetch communication");
        
        const data = await response.json();
        const comm = data.data;
        
        // Mark as read in local state
        const localComm = state.communications.list.find(c => c._id === commId);
        if (localComm && !localComm.isReadByCurrentUser) {
            localComm.isReadByCurrentUser = true;
            state.communications.unreadCount = Math.max(0, state.communications.unreadCount - 1);
            
            if (state.communications.unreadCount > 0) {
                unreadBadge.textContent = state.communications.unreadCount;
            } else {
                unreadBadge.classList.add('hidden');
            }
        }
        
        showCommunicationModal(comm);
    } catch (error) {
        console.error("Error viewing communication:", error);
    }
};

function showCommunicationModal(comm) {
    const priorityColors = {
        low: 'bg-gray-900/50 text-gray-300',
        normal: 'bg-blue-900/50 text-blue-300',
        high: 'bg-yellow-900/50 text-yellow-300',
        urgent: 'bg-red-900/50 text-red-300'
    };
    
    const modalHtml = `
        <div id="communicationModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div class="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <div class="sticky top-0 bg-gray-800/95 backdrop-blur-sm p-6 border-b border-gray-700 flex justify-between items-start">
                    <div>
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                                ${comm.type}
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${priorityColors[comm.priority]}">
                                ${comm.priority}
                            </span>
                            <span class="text-xs text-gray-500">
                                ${new Date(comm.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h2 class="text-2xl font-bold text-white">${comm.title}</h2>
                        <p class="text-sm text-gray-400 mt-1">
                            From: ${comm.createdBy?.fullName || 'Admin'} • ${comm.views || 0} views
                        </p>
                    </div>
                    <button onclick="closeCommunicationModal()" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <i class="fas fa-times text-gray-400"></i>
                    </button>
                </div>
                
                <div class="p-6">
                    ${comm.summary ? `
                        <div class="bg-gray-900/50 p-4 rounded-lg mb-6">
                            <p class="text-sm text-gray-400 mb-1">Summary</p>
                            <p class="text-gray-300">${comm.summary}</p>
                        </div>
                    ` : ''}
                    
                    <div class="prose prose-invert max-w-none">
                        ${comm.content.split('\n').map(p => `<p class="text-gray-300 mb-3">${p}</p>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('communicationModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.closeCommunicationModal = function() {
    const modal = document.getElementById('communicationModal');
    if (modal) modal.remove();
};




// ============ FEEDBACK API FUNCTIONS ============
async function fetchMyFeedback(page = 1, limit = 10) {
    try {
        const user = auth.currentUser;
        if (!user) return [];
        
        const token = await user.getIdToken();
        const response = await fetch(`/api/feedback/my-feedback?page=${page}&limit=${limit}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!response.ok) {
            console.warn(`Feedback fetch failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        
        if (page === 1) {
            state.feedback.list = data.data || [];
        } else {
            state.feedback.list = [...state.feedback.list, ...(data.data || [])];
        }
        
        state.feedback.hasMore = data.pagination?.hasNextPage || false;
        state.feedback.page = page;
        state.feedback.loading = false;

        return data.data || [];
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return [];
    }
}

async function submitFeedback(feedbackData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");
        
        const token = await user.getIdToken();
        const response = await fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(feedbackData),
            credentials: "include"
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to submit feedback");
        }

        const data = await response.json();
        
        // Refresh feedback list
        await fetchMyFeedback(1);
        
        return { success: true, data: data.data };
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return { success: false, error: error.message };
    }
}


// ============ FEEDBACK TAB ============
async function loadFeedbackTab() {
    state.feedback.loading = true;
    await fetchMyFeedback();
    
    tabContent.innerHTML = `
        <div class="space-y-6 fade-in">
            <!-- Header with Anonymity Disclaimer -->
            <div class="glass-card rounded-2xl p-6 border-l-4 border-purple-500">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center space-x-2 mb-2">
                            <i class="fas fa-shield-alt text-purple-400 text-xl"></i>
                            <h2 class="text-2xl font-bold text-white flex items-center">
                                Feedback & Suggestions
                            </h2>
                        </div>
                        <p class="text-gray-300">Your voice helps us improve the program</p>
                        
                        <!-- 🔥 ANONYMITY DISCLAIMER - PROMINENTLY DISPLAYED -->
                        <div class="mt-3 bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-lock text-purple-400 mt-1"></i>
                                <div>
                                    <p class="text-sm font-medium text-white">🔒 100% Anonymous</p>
                                    <p class="text-xs text-gray-300">
                                        Your identity is never shared with admins. They see only your feedback, 
                                        <span class="text-purple-400 font-semibold">never who sent it</span>. 
                                        Not even system administrators can see who submitted this feedback.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="openFeedbackModal()" 
                        class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white flex items-center space-x-2 shadow-lg transition-all transform hover:scale-105">
                        <i class="fas fa-plus-circle"></i>
                        <span>New Feedback</span>
                    </button>
                </div>
            </div>

            <!-- Quick Feedback Form with Anonymity Reminder -->
            <div class="glass-card rounded-2xl p-6">
                <div class="flex items-center space-x-2 mb-4">
                    <i class="fas fa-pen-alt text-green-400"></i>
                    <h3 class="text-lg font-bold text-white">Quick Feedback</h3>
                    <span class="bg-gray-800 text-xs px-2 py-1 rounded-full text-gray-300">Anonymous</span>
                </div>
                
                <form id="quickFeedbackForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select id="quickFeedbackType" class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                            <option value="suggestion">💡 Suggestion</option>
                            <option value="complaint">⚠️ Complaint</option>
                            <option value="review">⭐ Review</option>
                            <option value="other">📌 Other</option>
                        </select>
                        <input type="text" id="quickFeedbackTitle" placeholder="Brief title (optional)" 
                            class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    </div>
                    
                    <textarea id="quickFeedbackContent" rows="3" placeholder="Share your thoughts... (Admins will not know who sent this)" 
                        class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" required></textarea>
                    
                    <!-- Anonymity Reminder -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2 text-xs text-gray-400">
                            <i class="fas fa-user-secret text-purple-400"></i>
                            <span>Your identity is <span class="text-purple-400 font-bold">never</span> revealed</span>
                        </div>
                        <button type="submit" 
                            class="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium flex items-center space-x-2 transition-all">
                            <i class="fas fa-paper-plane"></i>
                            <span>Submit Anonymously</span>
                        </button>
                    </div>
                </form>
            </div>

            <!-- Your Feedback History -->
            <div class="glass-card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-history text-blue-400"></i>
                        <h3 class="text-lg font-bold text-white">Your Feedback History</h3>
                    </div>
                    <span class="text-xs text-gray-400">Only visible to you</span>
                </div>
                
                ${renderFeedbackList()}
            </div>

            <!-- Loading More -->
            ${state.feedback.hasMore ? `
                <div class="text-center pt-4">
                    <button onclick="loadMoreFeedback()" class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-all">
                        <i class="fas fa-spinner mr-2"></i>Load More
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    // Add quick feedback form listener
    const quickForm = document.getElementById('quickFeedbackForm');
    if (quickForm) {
        quickForm.addEventListener('submit', handleQuickFeedback);
    }

    state.feedback.loading = false;
}

// ============ FEEDBACK RENDER FUNCTIONS ============
function renderFeedbackList() {
    const feedback = state.feedback.list;
    
    if (!feedback || feedback.length === 0) {
        return `
            <div class="text-center py-12 text-gray-400">
                <div class="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-comment-dots text-3xl text-gray-600"></i>
                </div>
                <h3 class="text-lg font-medium text-white mb-2">No feedback yet</h3>
                <p class="text-gray-500 text-sm">Your anonymous feedback will appear here</p>
                <button onclick="openFeedbackModal()" class="mt-4 px-4 py-2 bg-purple-700/50 hover:bg-purple-700 text-white rounded-lg text-sm transition-all">
                    <i class="fas fa-plus mr-2"></i>Submit Anonymous Feedback
                </button>
            </div>
        `;
    }

    return `
        <div class="space-y-4">
            ${feedback.map(item => `
                <div class="bg-gray-900/30 rounded-xl p-5 border border-gray-800 hover:border-purple-700/50 transition-all">
                    <!-- Header -->
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 rounded-full text-xs font-medium
                                ${item.type === 'suggestion' ? 'bg-blue-900/50 text-blue-300' : 
                                  item.type === 'complaint' ? 'bg-yellow-900/50 text-yellow-300' : 
                                  item.type === 'review' ? 'bg-green-900/50 text-green-300' : 
                                  'bg-gray-800 text-gray-300'}">
                                ${item.type === 'suggestion' ? '💡' : 
                                  item.type === 'complaint' ? '⚠️' : 
                                  item.type === 'review' ? '⭐' : '📌'} 
                                ${item.type}
                            </span>
                            <span class="text-xs text-gray-500">${item.displayId}</span>
                            <span class="text-xs text-gray-500 capitalize">• ${item.category || 'other'}</span>
                        </div>
                        
                        <!-- Status Badge -->
                        <span class="text-xs px-2 py-1 rounded-full
                            ${item.status === 'pending' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50' : 
                              item.status === 'reviewed' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' : 
                              item.status === 'acknowledged' ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' : 
                              item.status === 'resolved' ? 'bg-green-900/30 text-green-300 border border-green-700/50' : 
                              'bg-gray-800 text-gray-400'}">
                            ${item.status}
                        </span>
                    </div>
                    
                    <!-- Title -->
                    ${item.title ? `
                        <h3 class="text-lg font-bold text-white mb-2">${item.title}</h3>
                    ` : ''}
                    
                    <!-- Content -->
                    <p class="text-gray-300 mb-3 whitespace-pre-wrap">${item.content}</p>
                    
                    <!-- Admin Response (if any) -->
                    ${item.adminNotes ? `
                        <div class="mt-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-reply text-purple-400 mt-1 text-xs"></i>
                                <div>
                                    <p class="text-xs text-purple-400 mb-1">Admin Response:</p>
                                    <p class="text-sm text-gray-300">${item.adminNotes}</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Footer -->
                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                        <div class="flex items-center space-x-3 text-xs">
                            <span class="text-gray-500">
                                <i class="far fa-calendar mr-1"></i>
                                ${new Date(item.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            ${item.resolvedAt ? `
                                <span class="text-gray-500">
                                    <i class="fas fa-check-circle mr-1 text-green-400"></i>
                                    Resolved ${new Date(item.resolvedAt).toLocaleDateString()}
                                </span>
                            ` : ''}
                        </div>
                        
                        <!-- Rating Stars -->
                        ${item.rating ? `
                            <div class="flex items-center space-x-1">
                                <span class="text-xs text-gray-400 mr-1">Rating:</span>
                                ${Array.from({ length: 5 }, (_, i) => `
                                    <i class="fas fa-star text-xs ${i < item.rating ? 'text-yellow-400' : 'text-gray-600'}"></i>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Anonymous Badge -->
                    <div class="mt-2 flex items-center justify-end">
                        <span class="text-xs text-gray-600 flex items-center">
                            <i class="fas fa-lock mr-1 text-purple-800"></i>
                            Anonymous
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============ FEEDBACK HANDLERS ============
window.openFeedbackModal = function() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
};

window.closeFeedbackModal = function() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset form
        const form = document.getElementById('feedbackForm');
        if (form) form.reset();
        // Reset rating
        document.getElementById('feedbackRating').value = 0;
        document.querySelectorAll('.rating-star i').forEach(star => {
            star.className = 'fas fa-star text-gray-500';
        });
    }
};

window.setRating = function(rating) {
    document.getElementById('feedbackRating').value = rating;
    const stars = document.querySelectorAll('.rating-star i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star text-yellow-400';
        } else {
            star.className = 'fas fa-star text-gray-500';
        }
    });
};

// Handle quick feedback form
async function handleQuickFeedback(e) {
    e.preventDefault();
    
    const type = document.getElementById('quickFeedbackType').value;
    const title = document.getElementById('quickFeedbackTitle').value;
    const content = document.getElementById('quickFeedbackContent').value;
    
    if (!content.trim()) {
        alert('Please enter your feedback');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
    submitBtn.disabled = true;
    
    try {
        const result = await submitFeedback({
            type,
            title: title || undefined,
            content,
            category: 'other'
        });
        
        if (result.success) {
            // Clear form
            e.target.reset();
            // Show success message with anonymity reminder
            alert('✅ Feedback submitted anonymously!\n\nThank you for your input. Your identity remains completely private.');
            // Reload feedback tab
            await loadFeedbackTab();
        } else {
            alert(result.error || 'Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit feedback. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle feedback form submission (modal)
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('feedbackType').value;
    if (!type) {
        alert('Please select a feedback type');
        return;
    }
    
    const category = document.getElementById('feedbackCategory').value;
    const title = document.getElementById('feedbackTitle').value;
    const content = document.getElementById('feedbackContent').value;
    const rating = type === 'review' ? parseInt(document.getElementById('feedbackRating').value) : undefined;
    
    if (!content.trim()) {
        alert('Please enter your feedback');
        return;
    }
    
    if (type === 'review' && (!rating || rating === 0)) {
        alert('Please provide a rating for your review');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
    submitBtn.disabled = true;
    
    try {
        const result = await submitFeedback({
            type,
            category,
            title: title || undefined,
            content,
            rating
        });
        
        if (result.success) {
            closeFeedbackModal();
            alert('✅ Feedback submitted anonymously!\n\nThank you for your input. Your identity remains completely private.');
            await loadFeedbackTab();
        } else {
            alert(result.error || 'Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit feedback. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ============ PAGINATION ============
window.loadMoreFeedback = async function() {
    if (state.feedback.loading || !state.feedback.hasMore) return;
    await fetchMyFeedback(state.feedback.page + 1);
    await loadFeedbackTab();
};



// ============ PROFILE UPDATE FUNCTIONS ============

// Check profile status on load
async function checkProfileStatus() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(`/api/system/user/profile-status/${encodeURIComponent(user.email)}`, {
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!response.ok) {
            if (response.status === 404) {
                // User not in PreLoaded collection - they might be an admin or something
                console.log("User not found in PreLoaded collection");
                return;
            }
            throw new Error("Failed to check profile status");
        }

        const data = await response.json();
        
        const container = document.getElementById('profileUpdateContainer');
        const completedBanner = document.getElementById('profileCompletedBanner');
        
        if (data.hasCompletedProfile) {
            // Profile is complete - hide form, show banner
            container.classList.add('hidden');
            completedBanner.classList.remove('hidden');
            
            // Update banner with user data
            document.getElementById('displayFaculty').textContent = data.user.faculty;
            document.getElementById('displayGender').textContent = 
                data.user.gender === 'male' ? 'Male' : 'Female';
        } else {
            // Profile incomplete - show form
            container.classList.remove('hidden');
            completedBanner.classList.add('hidden');
            
            // Pre-fill gender if it exists
            if (data.user.gender) {
                document.getElementById('genderField').value = data.user.gender;
            }
        }
    } catch (error) {
        console.error("Error checking profile status:", error);
    }
}

// Handle profile update form submission
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const faculty = document.getElementById('facultyField').value;
    const gender = document.getElementById('genderField').value;
    const user = auth.currentUser;
    
    if (!faculty || !gender) {
        showProfileError("Please select both faculty and gender");
        return;
    }
    
    if (!user) {
        showProfileError("You must be logged in");
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('profileSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    submitBtn.disabled = true;
    
    // Hide any previous messages
    hideProfileMessages();
    
    try {
        const token = await user.getIdToken();
        const response = await fetch("/api/system/user/update-profile", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: user.email,
                faculty,
                gender
            }),
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Failed to update profile");
        }
        
        // Show success message
        showProfileSuccess("Profile updated successfully! Refreshing...");
        
        // Update user state
        if (state.user) {
            state.user.faculty = faculty;
            state.user.gender = gender;
            state.user.hasCompletedProfile = true;
        }
        
        // Hide form and show banner after delay
        setTimeout(() => {
            document.getElementById('profileUpdateContainer').classList.add('hidden');
            document.getElementById('profileCompletedBanner').classList.remove('hidden');
            document.getElementById('displayFaculty').textContent = faculty;
            document.getElementById('displayGender').textContent = 
                gender === 'male' ? 'Male' : 'Female';
            
            // Refresh the page content (optional)
            loadTab("home");
        }, 2000);
        
    } catch (error) {
        console.error("Profile update error:", error);
        showProfileError(error.message);
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Helper functions for profile messages
function showProfileError(message) {
    const errorDiv = document.getElementById('profileError');
    const errorMsg = document.getElementById('profileErrorMessage');
    errorMsg.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Hide success if visible
    document.getElementById('profileSuccess').classList.add('hidden');
}

function showProfileSuccess(message) {
    const successDiv = document.getElementById('profileSuccess');
    const successMsg = document.getElementById('profileSuccessMessage');
    successMsg.textContent = message;
    successDiv.classList.remove('hidden');
    
    // Hide error if visible
    document.getElementById('profileError').classList.add('hidden');
}

function hideProfileMessages() {
    document.getElementById('profileError').classList.add('hidden');
    document.getElementById('profileSuccess').classList.add('hidden');
}

// Edit profile function (from banner)
window.editProfile = function() {
    document.getElementById('profileCompletedBanner').classList.add('hidden');
    document.getElementById('profileUpdateContainer').classList.remove('hidden');
    
    // Pre-fill current values
    const user = state.user;
    if (user) {
        document.getElementById('facultyField').value = user.faculty || '';
        document.getElementById('genderField').value = user.gender || '';
    }
    
    // Scroll to form
    document.getElementById('profileUpdateContainer').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
};



// auth.onAuthStateChanged(async (user) => {
//     console.log("🔥 Auth state changed:", user ? `✅ Logged in as ${user.email}` : "❌ Not logged in");
    
//     if (!user) {
//         console.log("No authenticated user, redirecting to login");
//         window.location.href = "/client-login";
//         return;
//     }

//     try {
//         const token = await user.getIdToken();
//         const response = await fetch("/api/system/client/me", {
//             headers: {
//                 "Authorization": `Bearer ${token}`,
//                 "Content-Type": "application/json"
//             },
//             credentials: "include"
//         });

//         if (!response.ok) throw new Error("Failed to fetch user data");

//         const data = await response.json();
//         state.user = data.user;
//         updateHeader(state.user);

//         // Load communications and feedback
//         await Promise.all([
//             fetchCommunications(),
//             fetchMyFeedback()
//         ]);
        
//         // Load default tab (home)
//         loadTab("home");

//     } catch (error) {
//         console.error("Error fetching user data:", error);
//     }
// });



auth.onAuthStateChanged(async (user) => {
    console.log("🔥 Auth state changed:", user ? `✅ Logged in as ${user.email}` : "❌ Not logged in");
    
    if (!user) {
        console.log("No authenticated user, redirecting to login");
        window.location.href = "/client-login";
        return;
    }

    try {
        const token = await user.getIdToken();
        const response = await fetch("/api/system/client/me", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        state.user = data.user;
        updateHeader(state.user);

        // Check profile status (NEW)
        await checkProfileStatus();

        // Load communications and feedback
        await Promise.all([
            fetchCommunications(),
            fetchMyFeedback()
        ]);
        
        // Load default tab (home)
        loadTab("home");

    } catch (error) {
        console.error("Error fetching user data:", error);
    }
});


// Add profile form submit listener
document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileUpdateForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
});


// ============ MAKE FUNCTIONS GLOBALLY AVAILABLE ============
window.loadTab = loadTab;
window.viewCommunication = viewCommunication;
window.closeCommunicationModal = closeCommunicationModal;
window.loadMoreCommunications = loadMoreCommunications;
window.loadMoreFeedback = loadMoreFeedback;
window.openFeedbackModal = openFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;
window.setRating = setRating;
window.editProfile = editProfile; // ADD THIS
window.handleProfileUpdate = handleProfileUpdate; // ADD THIS