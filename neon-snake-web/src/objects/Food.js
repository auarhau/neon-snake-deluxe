
export const FOOD_TYPES = {
    'normal': { color: 0xff5050, glow: 0xff7878, score: 10, chance: 50, speedMod: 0, special: null },
    'gold': { color: 0xffd700, glow: 0xffff96, score: 50, chance: 10, speedMod: 0, special: null },
    'speed': { color: 0x00ffff, glow: 0x64ffff, score: 20, chance: 10, speedMod: 2, special: null },
    'slow': { color: 0xb450ff, glow: 0xdc78ff, score: 10, chance: 10, speedMod: -2, special: null },
    'skull': { color: 0xff0000, glow: 0xff4444, score: 0, chance: 5, speedMod: 0, special: 'death' },
    'turbo': { color: 0xff00ff, glow: 0xff66ff, score: 30, chance: 8, speedMod: 0, special: 'turbo' },
    'bomb': { color: 0xffaa00, glow: 0xffcc44, score: 100, chance: 7, speedMod: 0, special: 'bomb' }
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
    }

    update(time, delta) {
        this.pulse += delta * 0.005;
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
        graphics.fillCircle(cx, cy, (this.blockSize * 0.8) * scale);

        graphics.fillStyle(this.data.color, 1);
        graphics.fillRect(
            cx - (this.blockSize / 2) * 0.8,
            cy - (this.blockSize / 2) * 0.8,
            this.blockSize * 0.8,
            this.blockSize * 0.8
        );

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
