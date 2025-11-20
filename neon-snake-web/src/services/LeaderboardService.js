// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyALl3DpcDUveXeoPEq_2EMUZQLCfhmcHs8",
    authDomain: "neon-snake-deluxe.firebaseapp.com",
    databaseURL: "https://neon-snake-deluxe-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "neon-snake-deluxe",
    storageBucket: "neon-snake-deluxe.firebasestorage.app",
    messagingSenderId: "324312812666",
    appId: "1:324312812666:web:d90b3d2a832c005b387fc3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

class LeaderboardService {
    constructor() {
        this.leaderboardRef = database.ref('leaderboard');
        this.maxScores = 100;
    }

    async saveScore(name, score) {
        try {
            const timestamp = Date.now();
            const scoreData = {
                name: name.substring(0, 20),
                score: score,
                timestamp: timestamp,
                date: new Date().toISOString()
            };

            await this.leaderboardRef.push(scoreData);
            console.log('Score saved to global leaderboard:', scoreData);
            return true;
        } catch (error) {
            console.error('Error saving score to Firebase:', error);
            return false;
        }
    }

    async getTopScores(limit = 100) {
        try {
            const snapshot = await this.leaderboardRef
                .orderByChild('score')
                .limitToLast(limit)
                .once('value');

            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            scores.sort((a, b) => b.score - a.score);
            return scores;
        } catch (error) {
            console.error('Error fetching global scores:', error);
            return [];
        }
    }

    async getPlayerRank(score) {
        try {
            const snapshot = await this.leaderboardRef
                .orderByChild('score')
                .startAt(score)
                .once('value');

            const count = snapshot.numChildren();
            const totalSnapshot = await this.leaderboardRef.once('value');
            const total = totalSnapshot.numChildren();

            return {
                rank: total - count + 1,
                total: total
            };
        } catch (error) {
            console.error('Error getting player rank:', error);
            return { rank: 0, total: 0 };
        }
    }

    async getTotalPlayers() {
        try {
            const snapshot = await this.leaderboardRef.once('value');
            return snapshot.numChildren();
        } catch (error) {
            console.error('Error getting total players:', error);
            return 0;
        }
    }
}

export default new LeaderboardService();
