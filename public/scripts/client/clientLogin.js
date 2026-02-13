import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    isSignInWithEmailLink,
    signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

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

// Initialize Analytics only if supported
if (await isSupported()) {
    const analytics = getAnalytics(app);
}

// DOM Elements
const googleLoginBtn = document.getElementById("googleLoginBtn");
const loadingState = document.getElementById("loadingState");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

// Helper function to show/hide loading state
function setLoading(isLoading) {
    if (isLoading) {
        googleLoginBtn.classList.add("hidden");
        loadingState.classList.remove("hidden");
        errorMessage.classList.add("hidden");
    } else {
        googleLoginBtn.classList.remove("hidden");
        loadingState.classList.add("hidden");
    }
}

// Helper function to show error
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove("hidden");
    setTimeout(() => {
        errorMessage.classList.add("hidden");
    }, 5000);
}

// Check for redirect result on page load
async function checkRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            setLoading(true);
            await handleUserAuthentication(result.user);
        }
    } catch (error) {
        console.error("Redirect sign-in error:", error);
        showError(error.message || "Failed to sign in. Please try again.");
    }
}

// Handle user authentication and redirect
async function handleUserAuthentication(user) {
    try {
        // Get Firebase ID token
        const token = await user.getIdToken();
        
        const response = await fetch("/api/system/client-login", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error("Access denied. Your email is not authorized. Please contact the administrator.");
            }
            throw new Error(data.message || "Login failed");
        }

        // FIXED: Redirect to your route
        window.location.href = "/client-dashboard";
        
    } catch (error) {
        console.error("Authentication error:", error);
        setLoading(false);
        showError(error.message || "Failed to complete sign in. Please try again.");
    }
}

// Google Sign-In with Popup (Recommended)
async function signInWithGooglePopup() {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        const result = await signInWithPopup(auth, provider);
        await handleUserAuthentication(result.user);
    } catch (error) {
        console.error("Google sign-in error:", error);
        setLoading(false);
        
        switch (error.code) {
            case 'auth/popup-blocked':
                await signInWithGoogleRedirect();
                break;
            case 'auth/popup-closed-by-user':
                showError("Sign-in cancelled. Please try again.");
                break;
            case 'auth/account-exists-with-different-credential':
                showError("An account already exists with the same email address.");
                break;
            default:
                showError(error.message || "Failed to sign in. Please try again.");
        }
    }
}

// Google Sign-In with Redirect (Fallback)
async function signInWithGoogleRedirect() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error("Redirect sign-in error:", error);
        setLoading(false);
        showError("Failed to initiate sign in. Please try again.");
    }
}

// Check if user is already signed in
auth.onAuthStateChanged(async (user) => {
    if (user) {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch("/api/system/client/me", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.user.role === "admin") {
                    window.location.href = "/admin";
                } else {
                    // FIXED: Redirect to your route
                    window.location.href = "/client-dashboard";
                }
            }
        } catch (error) {
            console.error("Session check error:", error);
        }
        setLoading(false);
    }
});

// Event Listeners
googleLoginBtn.addEventListener("click", signInWithGooglePopup);
checkRedirectResult();

// Handle email link sign-in if applicable
if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
        email = prompt('Please provide your email for confirmation');
    }
    signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            handleUserAuthentication(result.user);
        })
        .catch((error) => {
            console.error("Email link sign-in error:", error);
            showError(error.message);
        });
}