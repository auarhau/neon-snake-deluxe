import Snake from '../objects/Snake.js';
import Food, { FOOD_TYPES } from '../objects/Food.js';
import LeaderboardService from '../services/LeaderboardService.js';

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
        this.moveQueue = [];

        this.score = 0;
        const scores = JSON.parse(localStorage.getItem('neon_snake_highscores') || '[]');
        this.highscore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;

        this.graphics = this.add.graphics();

        this.border = this.add.graphics();
        this.border.lineStyle(4, 0xff0000, 1);
        // Fix: Draw border based on grid size, not screen size, to match logical boundaries
        this.border.strokeRect(0, 0, this.gridWidth * this.blockSize, this.gridHeight * this.blockSize);

        this.turboEndTime = 0;
        this.wallWrapActive = false;
        this.wallWrapEndTime = 0;
        this.speedModEndTime = 0;
        this.speedModValue = 0;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.setupTouchControls();

        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '20px', color: '#ffffff'
        });

        this.highscoreText = this.add.text(this.scale.width - 10, 10, `High: ${this.highscore}`, {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '20px', color: '#ffd700'
        }).setOrigin(1, 0);

        // Pause button in the middle
        this.pauseButton = this.add.text(this.scale.width / 2, 10, '⏸️', {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

        this.pauseButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.togglePause();
        });

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

        this.pausedText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'PAUSED\nTap to Resume', {
            fontFamily: 'Arial Rounded MT Bold', fontSize: '40px', color: '#00ffff', align: 'center'
        }).setOrigin(0.5).setVisible(false);

        this.isPaused = false;

        this.resetGame();

        // Create heart texture for particles
        const heartGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        heartGraphics.fillStyle(0xff0000, 1);
        heartGraphics.beginPath();
        // Draw a simple heart shape using geometric primitives - larger
        heartGraphics.fillCircle(9, 9, 6);
        heartGraphics.fillCircle(21, 9, 6);
        heartGraphics.fillTriangle(3, 9, 27, 9, 15, 27);
        heartGraphics.generateTexture('heart', 30, 30);

        this.heartEmitter = this.add.particles(0, 0, 'heart', {
            speed: { min: 50, max: 120 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1500,
            gravityY: -30,
            emitting: false
        });
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

            // Threshold for detecting a swipe (reduced to 20 for responsiveness)
            if (distance > 20) {
                this.isSwipeInProgress = true;

                if (this.snake.alive) {
                    let newDx = 0, newDy = 0;

                    if (Math.abs(dx) > Math.abs(dy)) {
                        newDx = dx > 0 ? 1 : -1;
                    } else {
                        newDy = dy > 0 ? 1 : -1;
                    }

                    if (newDx !== 0 || newDy !== 0) {
                        this.queueMove(newDx, newDy);

                        // Reset start position to current to allow continuous swiping
                        this.touchStartX = pointer.x;
                        this.touchStartY = pointer.y;
                    }
                }
            }
        });

        this.input.on('pointerup', (pointer) => {
            const swipeDuration = Date.now() - this.swipeStartTime;

            if (!this.snake.alive) {
                if (!this.isSwipeInProgress && swipeDuration < 300) {
                    this.resetGame();
                }
            }
        });
    }

    queueMove(dx, dy) {
        // Limit queue size to prevent huge input lag
        if (this.moveQueue.length >= 2) return;

        // Determine the direction to check against (last queued or current)
        const lastMove = this.moveQueue.length > 0
            ? this.moveQueue[this.moveQueue.length - 1]
            : this.snake.direction;

        // Prevent 180 degree turns relative to the PLANNED direction
        if (lastMove.x + dx === 0 && lastMove.y + dy === 0) {
            return;
        }

        // Prevent duplicate moves (spamming same direction)
        if (lastMove.x === dx && lastMove.y === dy) {
            return;
        }

        this.moveQueue.push({ x: dx, y: dy });
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
        this.moveQueue = [];
        this.turboEndTime = 0;
        this.wallWrapActive = false;
        this.wallWrapEndTime = 0;
        this.speedModEndTime = 0;
        this.speedModValue = 0;
        this.baseFoodCount = 2;

        // Reset pause state
        if (this.isPaused) {
            this.isPaused = false;
            this.pausedText.setVisible(false);
            this.pauseButton.setText('⏸️');
        }

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
        // Calculate total weight dynamically
        let totalWeight = 0;
        for (const data of Object.values(FOOD_TYPES)) {
            totalWeight += data.chance;
        }

        const rand = Math.random() * totalWeight;
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
        // Skip game logic if paused, but still render
        if (this.isPaused) {
            this.graphics.clear();
            this.drawGrid();
            this.updateBorder();

            for (const food of this.foods) {
                food.draw(this.graphics);
            }

            this.snake.draw(this.graphics);
            return;
        }

        if (this.snake.alive) {
            // Check for new inputs and queue them
            if (this.cursors.left.isDown) {
                this.queueMove(-1, 0);
            } else if (this.cursors.right.isDown) {
                this.queueMove(1, 0);
            } else if (this.cursors.up.isDown) {
                this.queueMove(0, -1);
            } else if (this.cursors.down.isDown) {
                this.queueMove(0, 1);
            }
        }

        // Check if speed modifier has expired
        if (this.speedModEndTime > 0 && Date.now() > this.speedModEndTime) {
            this.speedModValue = 0;
            this.speedModEndTime = 0;
        }

        // Calculate effective interval with both turbo and speed modifiers
        let effectiveInterval = this.moveInterval + this.speedModValue;
        if (this.turboEndTime > Date.now()) {
            effectiveInterval = effectiveInterval / 2;
        }

        // Check Neo state
        if (this.wallWrapActive && Date.now() > this.wallWrapEndTime) {
            this.wallWrapActive = false;
        }

        if (time > this.lastMoveTime + effectiveInterval) {
            this.lastMoveTime = time;

            if (this.snake.alive) {
                // Apply next move from queue if available
                if (this.moveQueue.length > 0) {
                    const nextMove = this.moveQueue.shift();
                    this.snake.setDirection(nextMove.x, nextMove.y);
                }

                this.snake.update(time);

                // Custom collision check for Neo mode
                const head = this.snake.body[0];
                if (this.wallWrapActive) {
                    // Wrap logic
                    if (head.x < 0) head.x = this.gridWidth - 1;
                    else if (head.x >= this.gridWidth) head.x = 0;

                    if (head.y < 0) head.y = this.gridHeight - 1;
                    else if (head.y >= this.gridHeight) head.y = 0;

                    // Still check for self-collision
                    for (let i = 1; i < this.snake.body.length; i++) {
                        if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                            this.gameOver();
                            break;
                        }
                    }
                } else {
                    // Standard collision
                    if (this.snake.checkCollision(this.gridWidth, this.gridHeight)) {
                        this.gameOver();
                    }
                }

                this.checkFoodCollision();
            }
        }

        this.graphics.clear();
        this.drawGrid();
        this.updateBorder(); // Redraw border based on state

        for (let i = this.foods.length - 1; i >= 0; i--) {
            if (this.foods[i].isExpired()) {
                this.foods[i].destroy();
                this.foods.splice(i, 1);

                if (this.foods.length < this.baseFoodCount) {
                    this.spawnFood();
                }
            }
        }

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
                if (food.data.special === 'death') {
                    food.destroy();
                    this.foods.splice(i, 1);
                    this.gameOver();
                    return;
                }

                if (food.data.special === 'turbo') {
                    this.turboEndTime = Date.now() + 5000;
                    this.cameras.main.flash(200, 255, 0, 255);
                }

                if (food.data.special === 'bomb') {
                    for (let j = 0; j < 10; j++) {
                        this.spawnFood();
                    }
                    this.cameras.main.shake(300, 0.01);
                }

                if (food.data.special === 'ladybug') {
                    this.heartEmitter.explode(10, food.x * this.blockSize + this.blockSize / 2, food.y * this.blockSize + this.blockSize / 2);
                }

                if (food.data.special === 'neo') {
                    this.wallWrapActive = true;
                    this.wallWrapEndTime = Date.now() + 10000;
                    this.cameras.main.flash(300, 0, 255, 0); // Green flash
                }

                if (food.data.special === 'sixseven') {
                    // Create juggling animation
                    const px = food.x * this.blockSize + this.blockSize / 2;
                    const py = food.y * this.blockSize + this.blockSize / 2;

                    // Create kid juggler
                    const juggler = this.add.text(px, py, '🧒', {
                        fontFamily: 'Arial',
                        fontSize: '32px'
                    }).setOrigin(0.5);

                    // Create floating 6 and 7
                    const six = this.add.text(px - 15, py - 20, '6', {
                        fontFamily: 'Arial',
                        fontSize: '20px',
                        color: '#ffaa00',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);

                    const seven = this.add.text(px + 15, py - 20, '7', {
                        fontFamily: 'Arial',
                        fontSize: '20px',
                        color: '#ffaa00',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);

                    // Animate juggling (5 seconds)
                    this.tweens.add({
                        targets: juggler,
                        y: py - 60,
                        alpha: 0,
                        duration: 5000,
                        ease: 'Power2',
                        onComplete: () => juggler.destroy()
                    });

                    this.tweens.add({
                        targets: six,
                        y: py - 80,
                        x: px - 30,
                        alpha: 0,
                        duration: 3000,
                        ease: 'Sine.easeInOut',
                        onComplete: () => six.destroy()
                    });

                    this.tweens.add({
                        targets: seven,
                        y: py - 70,
                        x: px + 30,
                        alpha: 0,
                        duration: 3000,
                        ease: 'Sine.easeInOut',
                        onComplete: () => seven.destroy()
                    });
                }

                this.score += food.data.score;
                this.snake.grow();

                // Apply temporary speed modifier (lasts 5 seconds)
                if (food.data.speedMod !== 0) {
                    this.speedModValue = -food.data.speedMod * 2;
                    this.speedModEndTime = Date.now() + 5000;

                    // Visual feedback
                    if (food.data.speedMod > 0) {
                        this.cameras.main.flash(150, 0, 255, 255); // Cyan flash for speed
                    } else {
                        this.cameras.main.flash(150, 180, 120, 255); // Purple flash for slow
                    }
                }

                food.destroy();
                this.foods.splice(i, 1);

                if (this.foods.length < this.baseFoodCount) {
                    this.spawnFood();
                }

                this.scoreText.setText(`Score: ${this.score}`);
                this.cameras.main.shake(100, 0.005);
            }
        }
    }

    updateBorder() {
        this.border.clear();

        let color = 0xff0000; // Default Red
        let alpha = 1;

        if (this.wallWrapActive) {
            color = 0x00ff00; // Neo Green
            const timeRemaining = this.wallWrapEndTime - Date.now();

            if (timeRemaining < 3000) {
                // Blink every 200ms
                if (Math.floor(Date.now() / 200) % 2 === 0) {
                    color = 0xff0000; // Flash back to red
                }
            }
        }

        this.border.lineStyle(4, color, alpha);
        this.border.strokeRect(0, 0, this.gridWidth * this.blockSize, this.gridHeight * this.blockSize);
    }

    drawGrid() {
        this.graphics.lineStyle(1, 0x191923);
        const width = this.gridWidth * this.blockSize;
        const height = this.gridHeight * this.blockSize;

        for (let x = 0; x <= width; x += this.blockSize * 2) {
            this.graphics.moveTo(x, 0);
            this.graphics.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += this.blockSize * 2) {
            this.graphics.moveTo(0, y);
            this.graphics.lineTo(width, y);
        }
        this.graphics.strokePath();
    }

    togglePause() {
        if (this.snake && !this.snake.alive) {
            // Don't allow pausing when game is over
            return;
        }

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.pausedText.setVisible(true);
            this.pauseButton.setText('▶️');

            // Add click listener to resume
            this.input.once('pointerdown', (pointer) => {
                // Check if click wasn't on the pause button itself
                const bounds = this.pauseButton.getBounds();
                if (!bounds.contains(pointer.x, pointer.y)) {
                    this.togglePause();
                }
            });
        } else {
            this.pausedText.setVisible(false);
            this.pauseButton.setText('⏸️');
        }
    }

    async gameOver() {
        this.snake.alive = false;
        this.gameOverText.setVisible(true);
        this.gameOverText.setText(`GAME OVER\nScore: ${this.score}`);

        if (this.score > 0) {
            this.createNameInput();
        } else {
            this.gameOverText.setText(`GAME OVER\nTap to Restart`);
            this.input.once('pointerdown', () => this.resetGame());
        }
    }

    createNameInput() {
        const element = document.createElement('div');
        element.style.position = 'absolute';
        element.style.top = '50%';
        element.style.left = '50%';
        element.style.transform = 'translate(-50%, -50%)';
        element.style.padding = '20px';
        element.style.background = 'rgba(0, 0, 0, 0.9)';
        element.style.border = '2px solid #00ffff';
        element.style.borderRadius = '10px';
        element.style.textAlign = 'center';
        element.style.zIndex = '1000';

        const title = document.createElement('h3');
        title.innerText = 'Enter Your Name';
        title.style.color = '#00ffff';
        title.style.fontFamily = 'Arial, sans-serif';
        title.style.margin = '0 0 15px 0';
        element.appendChild(title);

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 15;
        input.value = localStorage.getItem('neon_snake_last_name') || 'Player';
        input.style.padding = '10px';
        input.style.fontSize = '16px';
        input.style.borderRadius = '5px';
        input.style.border = 'none';
        input.style.marginBottom = '15px';
        input.style.width = '200px';
        element.appendChild(input);

        const button = document.createElement('button');
        button.innerText = 'Submit Score';
        button.style.display = 'block';
        button.style.margin = '0 auto';
        button.style.padding = '10px 20px';
        button.style.background = '#00ffff';
        button.style.color = '#000';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';

        button.onclick = async () => {
            const name = input.value.trim() || 'Player';
            localStorage.setItem('neon_snake_last_name', name);
            document.body.removeChild(element);

            await this.submitScore(name);
        };

        element.appendChild(button);
        document.body.appendChild(element);
        input.focus();
    }

    async submitScore(playerName) {
        localStorage.setItem('neon_snake_last_score', this.score.toString());

        const scores = JSON.parse(localStorage.getItem('neon_snake_highscores') || '[]');
        scores.push({ name: playerName, score: this.score, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('neon_snake_highscores', JSON.stringify(scores.slice(0, 10)));

        const platform = this.scale.width < 600 ? 'mobile' : 'pc';
        await LeaderboardService.saveScore(playerName, this.score, platform);

        const rankInfo = await LeaderboardService.getPlayerRank(this.score, platform);

        if (this.score > this.highscore) {
            this.highscore = this.score;
            this.highscoreText.setText(`High: ${this.highscore}`);
            this.gameOverText.setText(`NEW HIGHSCORE!\n${platform.toUpperCase()} Rank: #${rankInfo.rank}/${rankInfo.total}\nTap to Restart`);
        } else {
            this.gameOverText.setText(`GAME OVER\n${platform.toUpperCase()} Rank: #${rankInfo.rank}/${rankInfo.total}\nTap to Restart`);
        }

        // Launch Leaderboard immediately
        this.scene.pause();
        this.scene.launch('HighScoreScene');

        // Add a small delay before allowing restart to prevent accidental clicks
        this.time.delayedCall(500, () => {
            this.input.once('pointerdown', () => this.resetGame());
        });
    }
}
