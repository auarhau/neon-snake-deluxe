export default class HighScoreScene extends Phaser.Scene {
    constructor() {
        super('HighScoreScene');
    }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8).setOrigin(0);

        this.add.text(this.scale.width / 2, 50, 'HIGH SCORES', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '40px', color: '#00ffff'
        }).setOrigin(0.5);

        const scores = JSON.parse(localStorage.getItem('neon_snake_highscores') || '[]');

        // Sort and top 10
        scores.sort((a, b) => b.score - a.score);
        const top10 = scores.slice(0, 10);

        let y = 120;
        top10.forEach((entry, index) => {
            this.add.text(this.scale.width / 2 - 100, y, `${index + 1}. ${entry.name || 'Player'}`, {
                fontFamily: 'Arial', fontSize: '24px', color: '#ffffff'
            }).setOrigin(0, 0.5);

            this.add.text(this.scale.width / 2 + 100, y, `${entry.score}`, {
                fontFamily: 'Arial', fontSize: '24px', color: '#ffd700'
            }).setOrigin(1, 0.5);

            y += 40;
        });

        const backText = this.add.text(this.scale.width / 2, this.scale.height - 50, 'Tap to Return', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '30px', color: '#ff3232'
        }).setOrigin(0.5);

        // Interactive
        backText.setInteractive({ useHandCursor: true });
        backText.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });

        // Also close on any click outside
        this.input.on('pointerdown', (pointer) => {
            if (pointer.y < this.scale.height - 100) {
                this.scene.stop();
                this.scene.resume('GameScene');
            }
        });
    }
}
