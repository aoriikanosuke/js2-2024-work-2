import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stats = {
    score: document.getElementById('score'),
    health: document.getElementById('health'),
};

// Game state
let score = 0;
let health = 100;
let isRunning = true;
let meteorSpeedIncreaseThreshold = 250; // スピードを上げるスコアの閾値
let meteorSpeedIncrement = 0.5; // 速度の増加量
let spaceshipSpeed = 5; // 初期の宇宙船の移動速度
let meteorSpawnRate = 1000; // 隕石の出現間隔（ミリ秒）
let lastMeteorSpawn = Date.now();
let maxMeteors = 50; // 最大隕石数
let orangeEnemy = null;
const spaceship = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
    width: 50,
    height: 50,
    color: 'cyan',
};
const bullets = [];
const meteors = [];
const keys = {};

// Input event listeners
window.addEventListener('keydown', (e) => (keys[e.key] = true));
window.addEventListener('keyup', (e) => (keys[e.key] = false));

// Draw spaceship
function drawSpaceship() {
    ctx.fillStyle = spaceship.color;
    ctx.fillRect(spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

// Draw bullets
function drawBullets() {
    ctx.fillStyle = 'yellow';
    bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// Draw meteors
function drawMeteors() {
    ctx.fillStyle = 'red';
    meteors.forEach((meteor) => {
        ctx.fillRect(meteor.x, meteor.y, meteor.width, meteor.height);
    });
}

// Move spaceship
function moveSpaceship() {
    if (keys['ArrowUp'] && spaceship.y > 0) spaceship.y -= spaceshipSpeed;
    if (keys['ArrowDown'] && spaceship.y < canvas.height - spaceship.height) spaceship.y += spaceshipSpeed;
    if (keys['ArrowLeft'] && spaceship.x > 0) spaceship.x -= spaceshipSpeed;
    if (keys['ArrowRight'] && spaceship.x < canvas.width - spaceship.width) spaceship.x += spaceshipSpeed;
}

// Fire bullets
function fireBullet() {
    if (keys[' ']) {
        const now = Date.now();
        if (!spaceship.lastFired || now - spaceship.lastFired > 300) {
            bullets.push({
                x: spaceship.x + spaceship.width / 2 - 2.5,
                y: spaceship.y,
                width: 5,
                height: 10,
                speed: 7,
            });
            spaceship.lastFired = now;
        }
    }
}

// Update bullets
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y + bullet.height < 0) {
            bullets.splice(index, 1);
        }
    });
}

// Spawn meteors
function spawnMeteor() {
    if (meteors.length < maxMeteors) {
        let spawnCount = score >= 500 ? 2 : 1; // スコアが500以上なら隕石を2つ出す
        for (let i = 0; i < spawnCount; i++) {
            const spawnDirection = Math.random() < 0.5 ? 'top' : 'side';
            if (spawnDirection === 'top') {
                meteors.push({
                    x: Math.random() * (canvas.width - 40),
                    y: -50,
                    width: 40,
                    height: 40,
                    speed: Math.random() * 2 + 2,
                    direction: 'vertical',
                });
            } else {
                const isLeft = Math.random() < 0.5;
                meteors.push({
                    x: isLeft ? -40 : canvas.width,
                    y: Math.random() * (canvas.height - 40),
                    width: 40,
                    height: 40,
                    speed: Math.random() * 2 + 2,
                    direction: 'horizontal',
                    moveDirection: isLeft ? 1 : -1,
                });
            }
        }
    }
}

// Update meteors
function updateMeteors() {
    let speedMultiplier = 1;
    if (score >= meteorSpeedIncreaseThreshold) {
        speedMultiplier = Math.floor(score / meteorSpeedIncreaseThreshold) * meteorSpeedIncrement + 1;
    }

    if (score >= 750 && !orangeEnemy) {
        // 750点以上でオレンジの敵（弾幕生成）
        orangeEnemy = {
            x: canvas.width / 2 - 50,
            y: 50,
            width: 100,
            height: 50,
            speed: 2,
            bulletSpeed: 5,
            direction: 1, // 右方向
            bullets: [], // 弾幕の弾を保持
        };
    }

    if (orangeEnemy) {
        // オレンジの敵が弾幕を発射
        if (Math.random() < 0.05) { // 5%の確率で弾を発射
            orangeEnemy.bullets.push({
                x: orangeEnemy.x + orangeEnemy.width / 2,
                y: orangeEnemy.y + orangeEnemy.height,
                width: 5,
                height: 15,
                speed: orangeEnemy.bulletSpeed,
            });
        }

        // 弾幕の更新
        orangeEnemy.bullets.forEach((bullet, bIndex) => {
            bullet.y += bullet.speed;
            if (bullet.y > canvas.height) {
                orangeEnemy.bullets.splice(bIndex, 1); // 画面外に出た弾を削除
            }
        });

        // オレンジの敵の移動
        orangeEnemy.x += orangeEnemy.speed * orangeEnemy.direction;
        if (orangeEnemy.x <= 0 || orangeEnemy.x + orangeEnemy.width >= canvas.width) {
            orangeEnemy.direction *= -1; // キャンバスの左右で反転
        }

        // オレンジの敵の弾の描画
        ctx.fillStyle = 'orange';
        orangeEnemy.bullets.forEach((bullet) => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }

    meteors.forEach((meteor, index) => {

        // 隕石の移動処理
        if (meteor.direction === 'vertical') {
            meteor.y += meteor.speed * speedMultiplier;
            if (isColliding(spaceship, meteor)) {
                health -= 20;
                meteors.splice(index, 1);
            }
            if (meteor.y > canvas.height) {
                meteors.splice(index, 1);
            }
        } else if (meteor.direction === 'horizontal') {
            meteor.x += meteor.speed * meteor.moveDirection * speedMultiplier;
            if (isColliding(spaceship, meteor)) {
                health -= 20;
                meteors.splice(index, 1);
            }
            if (meteor.x < -meteor.width || meteor.x > canvas.width) {
                meteors.splice(index, 1);
            }
        }
    });
}

// Check for bullet-meteor collisions
function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        meteors.forEach((meteor, mIndex) => {
            if (isColliding(bullet, meteor)) {
                score += 10;
                bullets.splice(bIndex, 1);
                meteors.splice(mIndex, 1);
            }
        });
    });
}

// 弾幕の当たり判定を追加
function checkBulletCollisions() {
    // プレイヤーが弾幕に当たったかチェック
    if (orangeEnemy) {
        orangeEnemy.bullets.forEach((bullet, index) => {
            if (isColliding(spaceship, bullet)) {
                health -= 10; // 弾幕に当たったらダメージ
                orangeEnemy.bullets.splice(index, 1); // 当たった弾を削除
            }
        });
    }
}

// Collision detection
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Game loop
function gameLoop() {
    if (!isRunning) return;

    // 描画の最適化（canvasをクリアする回数を減らす）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 750点以上で宇宙船を小さくする
    if (score >= 750) {
        spaceship.width = 35; // 小さくする
        spaceship.height = 35; // 小さくする
    }

    // 宇宙船の移動、弾の発射、隕石の更新
    moveSpaceship();
    fireBullet();
    updateBullets();
    updateMeteors();
    checkCollisions();
    checkBulletCollisions();

    // ゲームオブジェクトの描画
    drawSpaceship();
    drawBullets();
    drawMeteors();

    // スコアと健康の表示
    stats.score.textContent = `Score: ${score}`;
    stats.health.textContent = `Health: ${health}`;

    // ゲームオーバー判定
    if (health <= 0) {
        isRunning = false;
        alert('Game Over! Your score: ' + score);
    }

    // 宇宙船のスピードアップ
    if (score >= 500) {
        spaceshipSpeed = 7; // 宇宙船の移動速度を速くする
    }

    // 隕石生成
    const now = Date.now();
    if (now - lastMeteorSpawn > meteorSpawnRate) {
        spawnMeteor();
        lastMeteorSpawn = now;
    }

    // フレームレートの調整
    requestAnimationFrame(gameLoop);
}

// Start spawning meteors
setInterval(spawnMeteor, meteorSpawnRate);

// Start game loop
gameLoop();
