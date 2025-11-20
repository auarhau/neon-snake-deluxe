
export const FOOD_TYPES = {
    'normal': { color: 0xff5050, glow: 0xff7878, score: 10, chance: 70, speedMod: 0 },
    'gold': { color: 0xffd700, glow: 0xffff96, score: 50, chance: 10, speedMod: 0 },
    'speed': { color: 0x00ffff, glow: 0x64ffff, score: 20, chance: 10, speedMod: 2 },
    'slow': { color: 0xb450ff, glow: 0xdc78ff, score: 10, chance: 10, speedMod: -2 }
};

export default class Food {
    constructor(scene, x, y, type, blockSize) {
        graphics.fillRect(
            cx - (this.blockSize / 2) * 0.8,
            cy - (this.blockSize / 2) * 0.8,
            this.blockSize * 0.8,
            this.blockSize * 0.8
        );
    }
}
