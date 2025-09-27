import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBPS1FV97ulqq1kZnnte7fTwIgul3_nL70",
    authDomain: "stratego-multiplayer.firebaseapp.com",
    databaseURL: "https://stratego-multiplayer-default-rtdb.firebaseio.com",
    projectId: "stratego-multiplayer",
    storageBucket: "stratego-multiplayer.firebasestorage.app",
    messagingSenderId: "1092533424241",
    appId: "1:1092533424241:web:c9b15a40036b8b2fc5cbd0",
    measurementId: "G-6S0RC010LG"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);