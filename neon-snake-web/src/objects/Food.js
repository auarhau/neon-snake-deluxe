
export const FOOD_TYPES = {
    'normal': { color: 0xff5050, glow: 0xff7878, score: 10, chance: 50, speedMod: 0, special: null },
    'gold': { color: 0xffd700, glow: 0xffff96, score: 50, chance: 10, speedMod: 0, special: null },
    'speed': { color: 0x00ffff, glow: 0x64ffff, score: 20, chance: 10, speedMod: 8, special: null },
    'slow': { color: 0xb450ff, glow: 0xdc78ff, score: 10, chance: 10, speedMod: -8, special: null },
    'skull': { color: 0xff0000, glow: 0xff4444, score: 0, chance: 5, speedMod: 0, special: 'death' },
    'turbo': { color: 0xff00ff, glow: 0xff66ff, score: 30, chance: 8, speedMod: 0, special: 'turbo' },
    'bomb': { color: 0xffaa00, glow: 0xffcc44, score: 100, chance: 7, speedMod: 0, special: 'bomb' },
    'ladybug': { color: 0xff0000, glow: 0xff5555, score: 150, chance: 7, speedMod: 0, special: 'ladybug' },
    'neo': { color: 0x00ff00, glow: 0x00ff00, score: 30, chance: 7, speedMod: 0, special: 'neo' },
    'sixseven': { color: 0xffaa00, glow: 0xffcc66, score: 67, chance: 6, speedMod: 0, special: 'sixseven' }
};

export default class Food {
    constructor(scene, x, y, type, blockSize) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.blockSize = blockSize;
        this.data = FOOD_TYPES[type];
        this.pulse = 0;

        this.spawnTime = Date.now();
        this.lifetime = type === 'bomb' ? 5000 : 10000;
        this.label = null;

        // For ladybug animation
        if (this.type === 'ladybug') {
            this.angle = 0;
            this.targetAngle = 0;
        }
    }

    update(time, delta) {
        this.pulse += delta * 0.005;

        if (this.type === 'ladybug') {
            // Random slight rotation for "alive" feel
            if (Math.random() < 0.05) {
                this.targetAngle = (Math.random() - 0.5) * 0.5;
            }
            this.angle += (this.targetAngle - this.angle) * 0.1;
        }
    }

    isExpired() {
        return Date.now() - this.spawnTime > this.lifetime;
    }

    getTimeRemaining() {
        return Math.max(0, this.lifetime - (Date.now() - this.spawnTime));
    }

    draw(graphics) {
        if (!this.data) return;

        const px = this.x * this.blockSize;
        const py = this.y * this.blockSize;
        const cx = px + this.blockSize / 2;
        const cy = py + this.blockSize / 2;

        const scale = 1 + Math.sin(this.pulse) * 0.2;

        graphics.fillStyle(this.data.glow, 0.3);
        graphics.fillCircle(cx, cy, (this.blockSize / 2) * 0.8 * scale);

        if (this.type === 'normal') {
            // Apple 🍎
            graphics.fillStyle(0xff0000, 1); // Red apple
            graphics.fillCircle(cx, cy + 1, this.blockSize * 0.35);

            // Leaf (green)
            graphics.fillStyle(0x00aa00, 1);
            graphics.fillEllipse(cx + 3, cy - 4, 4, 2);

            // Stem (brown)
            graphics.fillStyle(0x8b4513, 1);
            graphics.fillRect(cx - 1, cy - 5, 2, 3);

        } else if (this.type === 'gold') {
            // Coin 🪙
            graphics.fillStyle(0xffd700, 1); // Gold
            graphics.fillCircle(cx, cy, this.blockSize * 0.35);

            // Inner circle (darker gold)
            graphics.fillStyle(0xdaa520, 1);
            graphics.fillCircle(cx, cy, this.blockSize * 0.25);

            // Shine effect
            graphics.fillStyle(0xffff00, 0.5);
            graphics.fillCircle(cx - 2, cy - 2, this.blockSize * 0.1);

        } else if (this.type === 'speed') {
            // Lightning ⚡
            graphics.fillStyle(0x00ffff, 1); // Cyan
            graphics.beginPath();
            graphics.moveTo(cx + 2, cy - 7);
            graphics.lineTo(cx - 1, cy);
            graphics.lineTo(cx + 3, cy);
            graphics.lineTo(cx - 2, cy + 7);
            graphics.lineTo(cx + 1, cy + 1);
            graphics.lineTo(cx - 3, cy + 1);
            graphics.closePath();
            graphics.fillPath();

        } else if (this.type === 'slow') {
            // Clock/Stopwatch ⏱️ - Represents "slow"
            // Clock face (white/light gray)
            graphics.fillStyle(0xe0e0e0, 1); // Light gray
            graphics.fillCircle(cx, cy, this.blockSize * 0.35);

            // Clock border (purple to match theme)
            graphics.lineStyle(2, 0xb450ff, 1);
            graphics.strokeCircle(cx, cy, this.blockSize * 0.35);

            // Hour hand (short, pointing up-left)
            graphics.lineStyle(2, 0x333333, 1);
            graphics.beginPath();
            graphics.moveTo(cx, cy);
            graphics.lineTo(cx - 3, cy - 3);
            graphics.strokePath();

            // Minute hand (long, pointing down-right)
            graphics.beginPath();
            graphics.moveTo(cx, cy);
            graphics.lineTo(cx + 4, cy + 5);
            graphics.strokePath();

            // Center dot
            graphics.fillStyle(0x333333, 1);
            graphics.fillCircle(cx, cy, 1.5);

        } else if (this.type === 'skull') {
            // Skull 💀
            graphics.fillStyle(0xffffff, 1); // White skull
            graphics.fillCircle(cx, cy - 1, this.blockSize * 0.3);

            // Jaw
            graphics.fillRect(cx - 4, cy + 3, 8, 4);

            // Eyes (black)
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(cx - 3, cy - 2, 2);
            graphics.fillCircle(cx + 3, cy - 2, 2);

            // Nose
            graphics.fillTriangle(cx - 1, cy + 1, cx + 1, cy + 1, cx, cy + 3);

        } else if (this.type === 'turbo') {
            // Double Lightning ⚡⚡
            graphics.fillStyle(0xff00ff, 1); // Magenta

            // Left lightning
            graphics.beginPath();
            graphics.moveTo(cx - 2, cy - 6);
            graphics.lineTo(cx - 4, cy);
            graphics.lineTo(cx - 1, cy);
            graphics.lineTo(cx - 5, cy + 6);
            graphics.lineTo(cx - 3, cy + 1);
            graphics.lineTo(cx - 6, cy + 1);
            graphics.closePath();
            graphics.fillPath();

            // Right lightning
            graphics.beginPath();
            graphics.moveTo(cx + 4, cy - 6);
            graphics.lineTo(cx + 2, cy);
            graphics.lineTo(cx + 5, cy);
            graphics.lineTo(cx + 1, cy + 6);
            graphics.lineTo(cx + 3, cy + 1);
            graphics.lineTo(cx, cy + 1);
            graphics.closePath();
            graphics.fillPath();

        } else if (this.type === 'bomb') {
            // Bomb 💣 - Bright orange for visibility
            graphics.fillStyle(0xff6600, 1); // Bright orange
            graphics.fillCircle(cx, cy + 2, this.blockSize * 0.35);

            // Highlight to show it's round
            graphics.fillStyle(0xff8833, 0.8);
            graphics.fillCircle(cx - 2, cy, this.blockSize * 0.12);

            // Fuse (dark brown, thicker)
            graphics.lineStyle(3, 0x8b4513, 1); // Brown fuse
            graphics.beginPath();
            graphics.moveTo(cx + 1, cy - 2);
            graphics.lineTo(cx + 3, cy - 6);
            graphics.strokePath();

            // Spark (larger and brighter)
            graphics.fillStyle(0xff0000, 1); // Red
            graphics.fillCircle(cx + 3, cy - 6, 3);
            graphics.fillStyle(0xffff00, 1); // Yellow
            graphics.fillCircle(cx + 3, cy - 6, 2);
            graphics.fillStyle(0xffffff, 1); // White center
            graphics.fillCircle(cx + 3, cy - 6, 1);

        } else if (this.type === 'ladybug') {
            // Body (Red) - make it slightly oval
            graphics.fillStyle(0xff3333, 1);
            graphics.fillEllipse(cx, cy, this.blockSize * 0.7, this.blockSize * 0.8); // Oval body

            // Head (Black)
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(cx, cy - this.blockSize * 0.3, this.blockSize * 0.25);

            // Line down the middle
            graphics.lineStyle(1, 0x000000, 0.8);
            graphics.beginPath();
            graphics.moveTo(cx, cy - this.blockSize * 0.3);
            graphics.lineTo(cx, cy + this.blockSize * 0.4);
            graphics.strokePath();

            // Spots (Black) - better placement
            graphics.fillStyle(0x000000, 0.8);
            graphics.fillCircle(cx - 4, cy - 2, 1.5);
            graphics.fillCircle(cx + 4, cy - 2, 1.5);
            graphics.fillCircle(cx - 3, cy + 4, 1.5);
            graphics.fillCircle(cx + 3, cy + 4, 1.5);
        } else if (this.type === 'neo') {
            // Sunglasses Icon 🕶️
            graphics.fillStyle(0x000000, 1);

            // Left lens
            graphics.fillEllipse(cx - 4, cy, 6, 4);
            // Right lens
            graphics.fillEllipse(cx + 4, cy, 6, 4);

            // Bridge
            graphics.lineStyle(1, 0x000000, 1);
            graphics.beginPath();
            graphics.moveTo(cx - 1, cy - 1);
            graphics.lineTo(cx + 1, cy - 1);
            graphics.strokePath();
        } else if (this.type === 'sixseven') {
            // 6-7 meme - draw the numbers
            graphics.fillStyle(0xffaa00, 1);

            // Draw "6" on left side
            graphics.fillRect(cx - 7, cy - 5, 2, 10); // vertical line
            graphics.fillRect(cx - 7, cy - 5, 5, 2);  // top horizontal
            graphics.fillRect(cx - 7, cy - 1, 5, 2);  // middle horizontal
            graphics.fillRect(cx - 7, cy + 3, 5, 2);  // bottom horizontal
            graphics.fillRect(cx - 4, cy + 1, 2, 4);  // bottom right vertical

            // Draw "7" on right side
            graphics.fillRect(cx + 2, cy - 5, 5, 2);  // top horizontal
            graphics.fillRect(cx + 5, cy - 3, 2, 8);  // diagonal-ish vertical
        }

        const timePercent = this.getTimeRemaining() / this.lifetime;
        const barWidth = this.blockSize * 0.8;
        const barHeight = 3;

        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(cx - barWidth / 2, py - 5, barWidth, barHeight);

        graphics.fillStyle(timePercent > 0.3 ? 0x00ff00 : 0xff0000, 1);
        graphics.fillRect(cx - barWidth / 2, py - 5, barWidth * timePercent, barHeight);

        if (!this.label) {
            let labelText = '';

            if (this.type === 'normal') {
                labelText = '+10';
            } else if (this.type === 'gold') {
                labelText = '+50';
            } else if (this.type === 'speed') {
                labelText = '+20';
            } else if (this.type === 'slow') {
                labelText = '+10';
            } else if (this.type === 'skull') {
                labelText = 'DEATH';
            } else if (this.type === 'turbo') {
                labelText = 'TURBO';
            } else if (this.type === 'bomb') {
                labelText = 'BOMB';
            } else if (this.type === 'ladybug') {
                labelText = '+150';
            } else if (this.type === 'neo') {
                labelText = 'NEO';
            } else if (this.type === 'sixseven') {
                labelText = '6-7';
            }

            this.label = this.scene.add.text(cx, py + this.blockSize + 2, labelText, {
                fontFamily: 'Arial',
                fontSize: '10px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5, 0).setDepth(1000);
        }
    }

    destroy() {
        if (this.label) {
            this.label.destroy();
        }
    }
}
