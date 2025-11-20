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
        this.moveInterval = 100; // ms per step (starts at speed 10-ish)

        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('neon_snake_highscore') || '0');

        // Graphics object for drawing
        this.graphics = this.add.graphics();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.setupTouchControls();

        // UI
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '20px', color: '#ffffff'
        });
        this.highscoreText = this.add.text(this.scale.width - 10, 10, `High: ${this.highscore}`, {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '20px', color: '#ffd700'
        }).setOrigin(1, 0);

        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER\nTap to Restart', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '40px', color: '#ff3232', align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Game Objects (Call this last so UI exists)
        this.resetGame();
    }

    setupTouchControls() {
        this.input.on('pointerdown', (pointer) => {
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
        });

        this.input.on('pointerup', (pointer) => {
            if (!this.snake.alive) {
                this.resetGame();
                return;
            }

            const swipeThreshold = 30;
            const dx = pointer.x - this.touchStartX;
            const dy = pointer.y - this.touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > swipeThreshold) {
                    if (dx > 0) this.snake.setDirection(1, 0);
                    else this.snake.setDirection(-1, 0);
                }
            } else {
                if (Math.abs(dy) > swipeThreshold) {
                    if (dy > 0) this.snake.setDirection(0, 1);
                    else this.snake.setDirection(0, -1);
                }
            }
        });
    }

    resetGame() {
        this.snake = new Snake(this, Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2), this.blockSize);
        this.foods = [];
        this.score = 0;
        this.moveInterval = 100;

        // Ensure UI exists before accessing
        if (this.gameOverText) {
            this.gameOverText.setVisible(false);
        }
        if (this.scoreText) {
            this.scoreText.setText('Score: 0');
        }

        // Spawn initial food
        this.spawnFood();
        this.spawnFood();
    }

    spawnFood() {
        // Random type
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

        // Find valid position
        let x, y;
        let valid = false;
        while (!valid) {
            x = Phaser.Math.Between(0, this.gridWidth - 1);
            y = Phaser.Math.Between(0, this.gridHeight - 1);

            // Check collision with snake
            valid = true;
            for (const segment of this.snake.body) {
                if (segment.x === x && segment.y === y) {
                    valid = false;
                    break;
                }
            }
            // Check collision with other food
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
        // Input
        if (this.snake.alive) {
            if (this.cursors.left.isDown) this.snake.setDirection(-1, 0);
            else if (this.cursors.right.isDown) this.snake.setDirection(1, 0);
            else if (this.cursors.up.isDown) this.snake.setDirection(0, -1);
            else if (this.cursors.down.isDown) this.snake.setDirection(0, 1);
        }

        // Game Loop
        if (time > this.lastMoveTime + this.moveInterval) {
            this.lastMoveTime = time;

            if (this.snake.alive) {
                this.snake.update(time);

                // Check Death
                if (this.snake.checkCollision(this.gridWidth, this.gridHeight)) {
                    this.gameOver();
                }

                // Check Food
                this.checkFoodCollision();
            }
        }

        // Render
        this.graphics.clear();
        this.drawGrid();

        for (const food of this.foods) {
            food.update(time, delta);
            food.draw(this.graphics);
        }

        this.snake.draw(this.graphics);
    }

    checkFoodCollision() {
        const head = this.snake.body[0];

        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            if (head.x === food.x && head.y === food.y) {
                // Eat food
                this.score += food.data.score;
                this.snake.grow();

                // Speed effect
                if (food.data.speedMod !== 0) {
                    this.moveInterval -= food.data.speedMod * 2;
                    this.moveInterval = Phaser.Math.Clamp(this.moveInterval, 30, 200);
                }

                this.foods.splice(i, 1);
                this.spawnFood();

                this.scoreText.setText(`Score: ${this.score}`);

                // Particle effect (simple flash for now)
                this.cameras.main.shake(100, 0.005);
            }
        }
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

        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('neon_snake_highscore', this.highscore);
            this.highscoreText.setText(`High: ${this.highscore}`);
            this.gameOverText.setText('NEW HIGHSCORE!\nTap to Restart');
        } else {
            this.gameOverText.setText('GAME OVER\nTap to Restart');
        }
    }
}
