import GameScene from './scenes/GameScene.js';
import HighScoreScene from './scenes/HighScoreScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0f0f19',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
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

const game = new Phaser.Game(config);

if (window.gameLoaded) {
    window.gameLoaded();
}
