import GameScene from './scenes/GameScene.js?v=3';
import HighScoreScene from './scenes/HighScoreScene.js?v=3';

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Set game dimensions based on platform
const gameWidth = isMobile ? 360 : 1000;  // 18 blocks mobile, 50 blocks PC
const gameHeight = isMobile ? 600 : 700;  // 30 blocks mobile, 35 blocks PC

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
