import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
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

if (await isSupported()) {
    const analytics = getAnalytics(app);
}

const passwordField = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const rememberMe = document.getElementById("remember");

// Password Visibility Toggle
togglePassword.addEventListener("click", () => {
    if (passwordField.type === "password") {
        passwordField.type = "text";
        togglePassword.textContent = "Hide";
    }

    else {
        passwordField.type = "password";
        togglePassword.textContent = "Show";
    }
});

// Email & Password LogIn
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = passwordField.value;

    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;
        const token = await user.getIdToken();

        const response = await fetch("/api/system/admin-login", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-type": "application/json"
            },

            credentials: "include"
        });

        if (!response.ok) {
            const errorData = await response.json();

            if (response.status === 401) {
                throw new Error("Session expired. Please log in again.");
            }
        
            if (response.status === 403) {
                throw new Error("You do not have admin access.");
            }

            throw new Error(errorData.message || "Admin login failed.");
        }

        const data = await response.json();
        window.location.href = "/admin/dashboard.html";
    }

    catch (error) {
        console.error("Login error:", error);

        alert(error.message || "Login failed. Please try again.");
    }

    if (rememberMe.checked) {
        localStorage.setItem("rememberedEmail", email);
    }

    else {
        localStorage.removeItem("rememberedEmail");
    }
});

// Google LogIn
document.getElementById("googleLoginBtn").addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();

    try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const token = await user.getIdToken();
    

    const response = await fetch("/api/system/admin-login", {
        method: "POST",
        headers: {
        "Authorization": `Bearer ${token}`,
        "Content-type": "application/json"
        },

        credentials: "include"
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Admin login failed.");
    }

    window.location.href = "/admin";

    } catch (error) {
    console.error("Google login error:", error);
    alert(error.message || "Google login failed.");
    }
});

// Restore remembered email
const rememberedEmail = localStorage.getItem("rememberedEmail");
if (rememberedEmail) {
    document.getElementById("email").value = rememberedEmail;
    rememberMe.checked = true;
}