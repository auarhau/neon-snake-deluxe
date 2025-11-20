import LeaderboardService from '../services/LeaderboardService.js';

export default class HighScoreScene extends Phaser.Scene {
    constructor() {
        super('HighScoreScene');
    }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8).setOrigin(0);

        this.add.text(this.scale.width / 2, 30, 'LEADERBOARD', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '36px', color: '#00ffff'
        }).setOrigin(0.5);

        this.showingGlobal = false;

        const localBtn = this.add.text(this.scale.width / 2 - 80, 80, '📍 Local', {
            fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const globalBtn = this.add.text(this.scale.width / 2 + 80, 80, '🌍 Global', {
            fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', backgroundColor: '#111111', padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        localBtn.on('pointerdown', () => {
            if (!this.showingGlobal) return;
            this.showingGlobal = false;
            localBtn.setBackgroundColor('#333333');
            globalBtn.setBackgroundColor('#111111');
            this.displayScores();
        });

        globalBtn.on('pointerdown', () => {
            if (this.showingGlobal) return;
            this.showingGlobal = true;
            localBtn.setBackgroundColor('#111111');
            globalBtn.setBackgroundColor('#333333');
            this.displayScores();
        });

        this.scoresContainer = this.add.container(0, 0);

        this.displayScores();

        const backText = this.add.text(this.scale.width / 2, this.scale.height - 40, 'Tap to Return', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '24px', color: '#ff3232'
        }).setOrigin(0.5);

        backText.setInteractive({ useHandCursor: true });
        backText.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.y < this.scale.height - 80 && pointer.y > 110) {
                this.scene.stop();
                this.scene.resume('GameScene');
            }
        });
    }

    async displayScores() {
        this.scoresContainer.removeAll(true);

        if (this.showingGlobal) {
            const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading...', {
                fontFamily: 'Arial', fontSize: '24px', color: '#ffffff'
            }).setOrigin(0.5);
            this.scoresContainer.add(loadingText);

            const globalScores = await LeaderboardService.getTopScores(100);
            this.scoresContainer.removeAll(true);

            if (globalScores.length === 0) {
                const noScoresText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'No global scores yet!\nBe the first!', {
                    fontFamily: 'Arial', fontSize: '20px', color: '#888888', align: 'center'
                }).setOrigin(0.5);
                this.scoresContainer.add(noScoresText);
                return;
            }

            let y = 130;
            globalScores.slice(0, 10).forEach((entry, index) => {
                const rankText = this.add.text(this.scale.width / 2 - 120, y, `${index + 1}.`, {
                    fontFamily: 'Arial', fontSize: '20px', color: index < 3 ? '#ffd700' : '#ffffff'
                }).setOrigin(0, 0.5);

                const nameText = this.add.text(this.scale.width / 2 - 90, y, entry.name, {
                    fontFamily: 'Arial', fontSize: '20px', color: '#ffffff'
                }).setOrigin(0, 0.5);

                const scoreText = this.add.text(this.scale.width / 2 + 120, y, `${entry.score}`, {
                    fontFamily: 'Arial', fontSize: '20px', color: '#ffd700'
                }).setOrigin(1, 0.5);

                this.scoresContainer.add([rankText, nameText, scoreText]);
                y += 35;
            });
        } else {
            const scores = JSON.parse(localStorage.getItem('neon_snake_highscores') || '[]');
            scores.sort((a, b) => b.score - a.score);
            const top10 = scores.slice(0, 10);

            if (top10.length === 0) {
                const noScoresText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'No local scores yet!\nPlay a game!', {
                    fontFamily: 'Arial', fontSize: '20px', color: '#888888', align: 'center'
                }).setOrigin(0.5);
                this.scoresContainer.add(noScoresText);
                return;
            }

            let y = 130;
            top10.forEach((entry, index) => {
                const rankText = this.add.text(this.scale.width / 2 - 120, y, `${index + 1}.`, {
                    fontFamily: 'Arial', fontSize: '20px', color: index < 3 ? '#ffd700' : '#ffffff'
                }).setOrigin(0, 0.5);

                const nameText = this.add.text(this.scale.width / 2 - 90, y, entry.name || 'Player', {
                    fontFamily: 'Arial', fontSize: '20px', color: '#ffffff'
                }).setOrigin(0, 0.5);

                const scoreText = this.add.text(this.scale.width / 2 + 120, y, `${entry.score}`, {
                    fontFamily: 'Arial', fontSize: '20px', color: '#ffd700'
                }).setOrigin(1, 0.5);

                this.scoresContainer.add([rankText, nameText, scoreText]);
                y += 35;
            });
        }
    }
}
