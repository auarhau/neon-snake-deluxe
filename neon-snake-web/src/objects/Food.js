
export const FOOD_TYPES = {
    'normal': { color: 0xff5050, glow: 0xff7878, score: 10, chance: 50, speedMod: 0, special: null },
    'gold': { color: 0xffd700, glow: 0xffff96, score: 50, chance: 10, speedMod: 0, special: null },
    'speed': { color: 0x00ffff, glow: 0x64ffff, score: 20, chance: 10, speedMod: 5, special: null },
    'slow': { color: 0xb450ff, glow: 0xdc78ff, score: 10, chance: 10, speedMod: -7, special: null },
    'skull': { color: 0xff0000, glow: 0xff4444, score: 0, chance: 5, speedMod: 0, special: 'death' },
    'turbo': { color: 0xff00ff, glow: 0xff66ff, score: 30, chance: 8, speedMod: 0, special: 'turbo' },
    'bomb': { color: 0xffaa00, glow: 0xffcc44, score: 100, chance: 7, speedMod: 0, special: 'bomb' },
    'ladybug': { color: 0xff0000, glow: 0xff5555, score: 150, chance: 7, speedMod: 0, special: 'ladybug' },
    'neo': { color: 0x00ff00, glow: 0x00ff00, score: 30, chance: 7, speedMod: 0, special: 'neo' }
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

        if (this.type === 'ladybug') {
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
        } else {
            graphics.fillStyle(this.data.color, 1);
            graphics.fillRect(
                cx - (this.blockSize / 2) * 0.8,
                cy - (this.blockSize / 2) * 0.8,
                this.blockSize * 0.8,
                this.blockSize * 0.8
            );
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

            if (this.type === 'skull') {
                labelText = '💀 DEATH';
            } else if (this.type === 'turbo') {
                labelText = '⚡⚡ TURBO';
            } else if (this.type === 'bomb') {
                labelText = '💣 BOMB';
            } else if (this.type === 'ladybug') {
                labelText = '🐞 150';
            } else if (this.type === 'neo') {
                labelText = '🕶️ NEO';
            } else {
                labelText = `+${this.data.score}`;
                if (this.data.speedMod > 0) labelText += ' ⚡';
                else if (this.data.speedMod < 0) labelText += ' 🐌';
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
