import LeaderboardService from '../services/LeaderboardService.js';

export default class HighScoreScene extends Phaser.Scene {
    constructor() {
        super('HighScoreScene');
    }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8).setOrigin(0);

        this.add.text(this.scale.width / 2, 40, '🌍 GLOBAL LEADERBOARD', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '32px', color: '#00ffff'
        }).setOrigin(0.5);

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
            if (pointer.y < this.scale.height - 80 && pointer.y > 90) {
                this.scene.stop();
                this.scene.resume('GameScene');
            }
        });
    }

    async displayScores() {
        this.scoresContainer.removeAll(true);

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

        const totalText = this.add.text(this.scale.width / 2, 85, `${globalScores.length} players worldwide`, {
            fontFamily: 'Arial', fontSize: '16px', color: '#888888'
        }).setOrigin(0.5);
        this.scoresContainer.add(totalText);

        let y = 120;
        globalScores.slice(0, 10).forEach((entry, index) => {
            let color = '#ffffff';
            if (index === 0) color = '#ffd700';
            else if (index === 1) color = '#c0c0c0';
            else if (index === 2) color = '#cd7f32';

            const rankText = this.add.text(this.scale.width / 2 - 120, y, `${index + 1}.`, {
                fontFamily: 'Arial', fontSize: '20px', color: color
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
    }
}
