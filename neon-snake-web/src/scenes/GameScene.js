import Snake from '../objects/Snake.js';
import Food, { FOOD_TYPES } from '../objects/Food.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.blockSize = 20;
        this.gridWidth = Math.floor(this.scale.width / this.blockSize);
        this.gridHeight = Math.floor(this.scale.height / this.blockSize);

        this.lastMoveTime = 0;

        const isMobile = this.scale.width < 600;
        this.moveInterval = isMobile ? 100 : 67;
        this.pendingDirection = null;

        this.score = 0;
        const scores = JSON.parse(localStorage.getItem('neon_snake_highscores') || '[]');
        this.highscore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;

        this.graphics = this.add.graphics();

        this.border = this.add.graphics();
        this.border.lineStyle(4, 0xff0000, 1);
        this.border.strokeRect(0, 0, this.scale.width, this.scale.height);

        this.turboEndTime = 0;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.setupTouchControls();

        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '20px', color: '#ffffff'
        });

        this.highscoreText = this.add.text(this.scale.width - 10, 10, `High: ${this.highscore}`, {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '20px', color: '#ffd700'
        }).setOrigin(1, 0);

        const hsButton = this.add.text(this.scale.width - 10, 40, '🏆 Leaders', {
            fontFamily: 'Arial', fontSize: '16px', color: '#00ffff'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        hsButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.scene.pause();
            this.scene.launch('HighScoreScene');
        });

        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER\nTap to Restart', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '40px', color: '#ff3232', align: 'center'
        }).setOrigin(0.5).setVisible(false);

        this.resetGame();
    }

    setupTouchControls() {
        this.swipeStartTime = 0;
        this.isSwipeInProgress = false;

        this.input.on('pointerdown', (pointer) => {
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
            this.swipeStartTime = Date.now();
            this.isSwipeInProgress = false;
        });

        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;

            const dx = pointer.x - this.touchStartX;
            const dy = pointer.y - this.touchStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 10) {
                this.isSwipeInProgress = true;
            }
        });

        this.input.on('pointerup', (pointer) => {
            const swipeDuration = Date.now() - this.swipeStartTime;

            if (!this.snake.alive) {
                if (!this.isSwipeInProgress && swipeDuration < 300) {
                    this.resetGame();
                }
                return;
            }

            const dx = pointer.x - this.touchStartX;
            const dy = pointer.y - this.touchStartY;
            const swipeDistance = Math.sqrt(dx * dx + dy * dy);

            if (swipeDistance < 30) {
                return;
            }

            let newDx = 0, newDy = 0;

            if (Math.abs(dx) > Math.abs(dy)) {
                newDx = dx > 0 ? 1 : -1;
            } else {
                newDy = dy > 0 ? 1 : -1;
            }

            if (newDx !== 0 || newDy !== 0) {
                this.pendingDirection = { dx: newDx, dy: newDy };
            }
        });
    }

    resetGame() {
        this.snake = new Snake(this, Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2), this.blockSize);

        if (this.foods) {
            for (const food of this.foods) {
                food.destroy();
            }
        }

        this.foods = [];
        this.score = 0;
        const isMobile = this.scale.width < 600;
        this.moveInterval = isMobile ? 100 : 67;
        this.pendingDirection = null;

        if (this.gameOverText) {
            this.gameOverText.setVisible(false);
        }
        if (this.scoreText) {
            this.scoreText.setText('Score: 0');
        }

        this.spawnFood();
        this.spawnFood();
    }

    spawnFood() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        let type = 'normal';

        for (const [key, data] of Object.entries(FOOD_TYPES)) {
            cumulative += data.chance;
            if (rand <= cumulative) {
                type = key;
                break;
            }
        }

        let x, y;
        let valid = false;
        while (!valid) {
            x = Phaser.Math.Between(0, this.gridWidth - 1);
            y = Phaser.Math.Between(0, this.gridHeight - 1);

            valid = true;
            for (const segment of this.snake.body) {
                if (segment.x === x && segment.y === y) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                for (const food of this.foods) {
                    if (food.x === x && food.y === y) {
                        valid = false;
                        break;
                    }
                }
            }
        }

        this.foods.push(new Food(this, x, y, type, this.blockSize));
    }

    update(time, delta) {
        if (this.snake.alive) {
            if (this.cursors.left.isDown) this.snake.setDirection(-1, 0);
            else if (this.cursors.right.isDown) this.snake.setDirection(1, 0);

            for (let i = this.foods.length - 1; i >= 0; i--) {
                if (this.foods[i].isExpired()) {
                    this.foods[i].destroy();
                    this.foods.splice(i, 1);
                    this.spawnFood();
                }
            }

            for (const food of this.foods) {
                food.update(time, delta);
                food.draw(this.graphics);
            }

            drawGrid() {
                this.graphics.lineStyle(1, 0x191923);
                for (let x = 0; x <= this.scale.width; x += this.blockSize * 2) {
                    this.graphics.moveTo(x, 0);
                    this.graphics.lineTo(x, this.scale.height);
                }
                for (let y = 0; y <= this.scale.height; y += this.blockSize * 2) {
                    this.graphics.moveTo(0, y);
                    this.graphics.lineTo(this.scale.width, y);
                }
                this.graphics.strokePath();
            }

            gameOver() {
                this.snake.alive = false;
                this.gameOverText.setVisible(true);

                const scores = JSON.parse(localStorage.getItem('neon_snake_highscores') || '[]');

                const isTopTen = scores.length < 10 || this.score > scores[scores.length - 1].score;

                if (isTopTen) {
                    const playerName = prompt('Top 10! Enter your name:', 'Player') || 'Player';
                    scores.push({ name: playerName, score: this.score, date: new Date().toISOString() });
                } else {
                    scores.push({ name: 'Player', score: this.score, date: new Date().toISOString() });
                }

                scores.sort((a, b) => b.score - a.score);
                localStorage.setItem('neon_snake_highscores', JSON.stringify(scores.slice(0, 10)));

                if (this.score > this.highscore) {
                    this.highscore = this.score;
                    this.highscoreText.setText(`High: ${this.highscore}`);
                    this.gameOverText.setText('NEW HIGHSCORE!\nTap to Restart');
                } else {
                    this.gameOverText.setText('GAME OVER\nTap to Restart');
                }
            }
        }
