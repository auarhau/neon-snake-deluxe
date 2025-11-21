import LeaderboardService from '../services/LeaderboardService.js';

export default class HighScoreScene extends Phaser.Scene {
    constructor() {
        super('HighScoreScene');
    }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8).setOrigin(0);

        this.add.text(this.scale.width / 2, 30, '🏆 LEADERBOARD', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '32px', color: '#00ffff'
        }).setOrigin(0.5);

        // Tabs
        this.tabs = [];
        const tabNames = ['Global', 'Mobile'];
        const tabWidth = 100;
        const startX = this.scale.width / 2 - (tabWidth / 2); // Center for 2 tabs

        tabNames.forEach((name, index) => {
            const x = startX + (index * tabWidth) - (tabWidth / 2) + (index === 0 ? -10 : 10); // Slight adjustment for spacing
            const tabX = (this.scale.width / 2) + (index === 0 ? -60 : 60);

            const tab = this.add.text(tabX, 70, name, {
                fontFamily: 'Arial', fontSize: '18px', color: '#888888'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            tab.name = name.toLowerCase();
            tab.on('pointerdown', () => this.switchTab(tab.name));
            this.tabs.push(tab);
        });

        this.currentTab = 'global';
        this.updateTabs();

        this.scrollY = 0;
        this.maxScroll = 0;
        this.allScores = [];
        this.lastScore = parseInt(localStorage.getItem('neon_snake_last_score') || '0');

        this.scoresContainer = this.add.container(0, 0);
        this.setupScrolling();

        this.displayScores();

        const backText = this.add.text(this.scale.width / 2, this.scale.height - 40, 'Tap to Return', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '24px', color: '#ff3232'
        }).setOrigin(0.5);

        backText.setInteractive({ useHandCursor: true });
        backText.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });

        // Scroll to Top Button
        this.scrollTopBtn = this.add.text(this.scale.width - 30, this.scale.height - 100, '⬆️ TOP', {
            fontFamily: 'Arial', fontSize: '16px', color: '#00ffff', backgroundColor: '#000000', padding: { x: 5, y: 5 }
        }).setOrigin(1, 1).setInteractive({ useHandCursor: true }).setScrollFactor(0).setVisible(false);

        this.scrollTopBtn.on('pointerdown', () => {
            this.scrollY = 0;
            this.updateScrollPosition();
        });
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;
        this.currentTab = tabName;
        this.updateTabs();
        this.displayScores();
    }

    updateTabs() {
        this.tabs.forEach(tab => {
            if (tab.name === this.currentTab) {
                tab.setColor('#00ffff');
                tab.setFontStyle('bold');
            } else {
                tab.setColor('#888888');
                tab.setFontStyle('normal');
            }
        });
    }

    setupScrolling() {
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.scrollY += deltaY * 0.5;
            this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
            this.updateScrollPosition();
        });

        let dragStartY = 0;
        let dragStartScrollY = 0;

        this.input.on('pointerdown', (pointer) => {
            if (pointer.y > 100 && pointer.y < this.scale.height - 80) {
                dragStartY = pointer.y;
                dragStartScrollY = this.scrollY;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && dragStartY > 0) {
                const delta = dragStartY - pointer.y;
                this.scrollY = dragStartScrollY + delta;
                this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
                this.updateScrollPosition();
            }
        });

        this.input.on('pointerup', () => {
            dragStartY = 0;
        });
    }

    updateScrollPosition() {
        this.scoresContainer.y = -this.scrollY;
        if (this.scrollTopBtn) {
            this.scrollTopBtn.setVisible(this.scrollY > 200);
        }
    }

    async displayScores() {
        this.scoresContainer.removeAll(true);

        const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading...', {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5);
        this.scoresContainer.add(loadingText);

        this.allScores = await LeaderboardService.getTopScores(1000, this.currentTab);
        this.scoresContainer.removeAll(true);

        if (this.allScores.length === 0) {
            const noScoresText = this.add.text(this.scale.width / 2, this.scale.height / 2, `No scores yet for ${this.currentTab}!\nBe the first!`, {
                fontFamily: 'Arial', fontSize: '20px', color: '#888888', align: 'center'
            }).setOrigin(0.5);
            this.scoresContainer.add(noScoresText);
            return;
        }

        let y = 120;
        this.allScores.forEach((entry, index) => {
            let color = '#ffffff';
            let bgColor = null;
            let isPlayerScore = false;

            if (index === 0) color = '#ffd700';
            else if (index === 1) color = '#c0c0c0';
            else if (index === 2) color = '#cd7f32';

            if (entry.score === this.lastScore) {
                bgColor = 0x004400;
                isPlayerScore = true;
            }

            if (bgColor) {
                const highlight = this.add.rectangle(this.scale.width / 2, y, this.scale.width - 40, 32, bgColor, 0.5);
                this.scoresContainer.add(highlight);
            }

            const rankText = this.add.text(this.scale.width / 2 - 140, y, `${index + 1}.`, {
                fontFamily: 'Arial', fontSize: '18px', color: color
            }).setOrigin(0, 0.5);

            // Add icon based on platform
            let icon = '';
            if (this.currentTab === 'global') {
                icon = entry.platform === 'mobile' ? '📱 ' : '💻 ';
            }

            const nameText = this.add.text(this.scale.width / 2 - 110, y, icon + entry.name, {
                fontFamily: 'Arial', fontSize: '18px', color: isPlayerScore ? '#00ff00' : '#ffffff'
            }).setOrigin(0, 0.5);

            const scoreText = this.add.text(this.scale.width / 2 + 130, y, `${entry.score}`, {
                fontFamily: 'Arial', fontSize: '18px', color: '#ffd700'
            }).setOrigin(1, 0.5);

            if (isPlayerScore) {
                const youText = this.add.text(this.scale.width / 2 + 140, y, 'YOU', {
                    fontFamily: 'Arial', fontSize: '14px', color: '#00ff00'
                }).setOrigin(0, 0.5);
                this.scoresContainer.add(youText);
            }

            this.scoresContainer.add([rankText, nameText, scoreText]);
            y += 35;
        });

        this.maxScroll = Math.max(0, y - this.scale.height + 100);

        const playerRank = this.allScores.findIndex(s => s.score === this.lastScore);
        if (playerRank !== -1 && playerRank > 5) {
            this.scrollY = Math.min(playerRank * 35 - 200, this.maxScroll);
            this.updateScrollPosition();
        }
    }
}
