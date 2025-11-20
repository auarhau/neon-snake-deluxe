import Snake from '../objects/Snake.js';
import Food, { FOOD_TYPES } from '../objects/Food.js';

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
