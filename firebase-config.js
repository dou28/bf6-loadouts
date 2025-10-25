// firebase-config.js
firebase.initializeApp({
  apiKey: "AIzaSyD4O388ofZ9ZT6F0KDEjbcjc4gPNEyOxNc",
  authDomain: "bf6-loadouts.firebaseapp.com",
  projectId: "bf6-loadouts",
  storageBucket: "bf6-loadouts.firebasestorage.app",
  messagingSenderId: "1003913644717",
  appId: "1:1003913644717:web:7c8868f3fe838e2d82d424",
  measurementId: "G-J8YXKLEGHQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
