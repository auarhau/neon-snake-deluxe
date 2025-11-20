

export default class Snake {
    constructor(scene, x, y, blockSize) {
        this.scene = scene;
        this.blockSize = blockSize;

        // Position is in grid coordinates
        this.body = [
            { x: x, y: y },
            { x: x, y: y + 1 }, // Tail
        ];

        this.direction = Phaser.Math.Vector2.UP;
        this.nextDirection = Phaser.Math.Vector2.UP;
        this.growPending = 0;

        this.color = 0x00ff96; // Neon green
        this.headColor = 0x96ffc8;

        this.alive = true;
    }

    update(time) {
        if (!this.alive) return;

        // Move body
        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Add new head
        this.body.unshift(newHead);

        // Remove tail unless growing
        if (this.growPending > 0) {
            this.growPending--;
        } else {
            this.body.pop();
        }

        this.direction = this.nextDirection;
    }

    setDirection(x, y) {
        // Prevent reversing
        if (this.direction.x !== 0 && x !== 0) return;
        if (this.direction.y !== 0 && y !== 0) return;

        this.nextDirection.set(x, y);
    }

    grow() {
        this.growPending++;
    }

    checkCollision(width, height) {
        const head = this.body[0];

        // Wall collision
        if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
            return true;
        }

        // Self collision
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }

        return false;
    }

    draw(graphics) {
        graphics.clear();

        // Draw glow
        graphics.lineStyle(this.blockSize * 1.5, this.color, 0.3);
        for (let i = 0; i < this.body.length; i++) {
            const segment = this.body[i];
            graphics.strokeRect(
                segment.x * this.blockSize + this.blockSize / 4,
                segment.y * this.blockSize + this.blockSize / 4,
                this.blockSize / 2,
                this.blockSize / 2
            );
        }

        // Draw body
        for (let i = 0; i < this.body.length; i++) {
            const segment = this.body[i];
            const isHead = (i === 0);

            graphics.fillStyle(isHead ? this.headColor : this.color, 1);

            // Draw rect with slight padding
            const pad = 2;
            graphics.fillRect(
                segment.x * this.blockSize + pad,
                segment.y * this.blockSize + pad,
                this.blockSize - pad * 2,
                this.blockSize - pad * 2
            );

            // Eyes for head
            if (isHead) {
                graphics.fillStyle(0x000000, 1);
                const eyeSize = 4;
                const cx = segment.x * this.blockSize + this.blockSize / 2;
                const cy = segment.y * this.blockSize + this.blockSize / 2;

                // Simple eyes based on direction
                // (Simplification: just draw them in center-ish for now)
                graphics.fillCircle(cx - 4, cy - 4, 2);
                graphics.fillCircle(cx + 4, cy - 4, 2);
            }
        }
    }
}
