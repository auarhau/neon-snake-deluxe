import GameScene from './scenes/GameScene.js?v=3';
import HighScoreScene from './scenes/HighScoreScene.js?v=3';

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Set game dimensions based on platform
let gameWidth = 1000;
let gameHeight = 700;

if (isMobile) {
    gameWidth = 360;
    // Calculate height based on screen size, snapped to 20px grid
    // Use slightly less than full height (90%) to be safe with browser UI bars
    const safeHeight = Math.floor(window.innerHeight * 0.9);
    gameHeight = Math.floor(safeHeight / 20) * 20;
    // Cap height to reasonable limits (min 400, max 800)
    gameHeight = Math.min(Math.max(gameHeight, 400), 800);
}

// Make dimensions available globally for GameScene - BEFORE game creation
window.GAME_WIDTH = gameWidth;
window.GAME_HEIGHT = gameHeight;

const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    backgroundColor: '#0f0f19',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameWidth,
        height: gameHeight
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene, HighScoreScene]
};

console.log('GAME CONFIG:', config.width, 'x', config.height);

const game = new Phaser.Game(config);

if (window.gameLoaded) {
    window.gameLoaded();
}
