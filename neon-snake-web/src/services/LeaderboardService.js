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
        this.db = database;
        this.maxScores = 100;
    }

    getRef(platform) {
        // If platform is mobile, use 'leaderboard_mobile'
        // Otherwise (pc or undefined), use 'leaderboard' to keep old scores
        const path = platform === 'mobile' ? 'leaderboard_mobile' : 'leaderboard';
        return this.db.ref(path);
    }

    async saveScore(name, score, platform) {
        try {
            const timestamp = Date.now();
            const scoreData = {
                name: name.substring(0, 20),
                score: score,
                timestamp: timestamp,
                date: new Date().toISOString(),
                platform: platform || 'pc'
            };

            await this.getRef(platform).push(scoreData);
            console.log(`Score saved to ${platform} leaderboard:`, scoreData);
            return true;
        } catch (error) {
            console.error('Error saving score to Firebase:', error);
            return false;
        }
    }

    async getTopScores(limit = 100, platform) {
        try {
            if (platform === 'global') {
                return this.getGlobalScores(limit);
            }

            const snapshot = await this.getRef(platform)
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

    async getGlobalScores(limit) {
        try {
            const [pcSnapshot, mobileSnapshot] = await Promise.all([
                this.db.ref('leaderboard').orderByChild('score').limitToLast(limit).once('value'),
                this.db.ref('leaderboard_mobile').orderByChild('score').limitToLast(limit).once('value')
            ]);

            const scores = [];

            pcSnapshot.forEach((child) => {
                scores.push({ id: child.key, ...child.val(), platform: 'pc' });
            });

            mobileSnapshot.forEach((child) => {
                scores.push({ id: child.key, ...child.val(), platform: 'mobile' });
            });

            scores.sort((a, b) => b.score - a.score);
            return scores.slice(0, limit);
        } catch (error) {
            console.error('Error fetching global scores:', error);
            return [];
        }
    }

    async getPlayerRank(score, platform) {
        try {
            const allScores = await this.getTopScores(1000, platform);

            const rank = allScores.findIndex(s => s.score <= score) + 1;
            const actualRank = rank === 0 ? allScores.length + 1 : rank;

            return {
                rank: actualRank,
                total: allScores.length
            };
        } catch (error) {
            console.error('Error getting player rank:', error);
            return { rank: 0, total: 0 };
        }
    }

    async getTotalPlayers(platform) {
        try {
            const snapshot = await this.getRef(platform).once('value');
            return snapshot.numChildren();
        } catch (error) {
            console.error('Error getting total players:', error);
            return 0;
        }
    }

    async migrateLegacyMobileScores() {
        const mobileNames = [
            'mærye', 'wenche', 'martin mobil', 'brage er best', 'martin er best', 'viktor'
        ];

        try {
            const snapshot = await this.db.ref('leaderboard').once('value');
            const updates = {};
            let count = 0;

            snapshot.forEach((child) => {
                const data = child.val();
                const name = (data.name || '').toLowerCase();

                // Check if name contains any of the mobile names
                if (mobileNames.some(mName => name.includes(mName))) {
                    // Add to mobile leaderboard
                    const newKey = this.db.ref('leaderboard_mobile').push().key;
                    updates[`leaderboard_mobile/${newKey}`] = {
                        ...data,
                        platform: 'mobile'
                    };

                    // Remove from PC leaderboard
                    updates[`leaderboard/${child.key}`] = null;
                    count++;
                }
            });

            if (count > 0) {
                await this.db.ref().update(updates);
                console.log(`Migrated ${count} scores to mobile.`);
                return count;
            }
            return 0;
        } catch (error) {
            console.error('Migration failed:', error);
            return -1;
        }
    }
}

export default new LeaderboardService();
