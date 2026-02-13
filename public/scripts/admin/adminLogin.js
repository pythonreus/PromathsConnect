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