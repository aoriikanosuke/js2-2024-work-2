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
    if (keys['ArrowUp'] && spaceship.y > 0) spaceship.y -= 5;
    if (keys['ArrowDown'] && spaceship.y < canvas.height - spaceship.height) spaceship.y += 5;
    if (keys['ArrowLeft'] && spaceship.x > 0) spaceship.x -= 5;
    if (keys['ArrowRight'] && spaceship.x < canvas.width - spaceship.width) spaceship.x += 5;
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
    meteors.push({
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 40,
        height: 40,
        speed: Math.random() * 2 + 2,
    });
}

// Update meteors
function updateMeteors() {
    meteors.forEach((meteor, index) => {
        meteor.y += meteor.speed;

        // Check collision with spaceship
        if (isColliding(spaceship, meteor)) {
            health -= 20;
            meteors.splice(index, 1);
        }

        // Remove meteors that go off screen
        if (meteor.y > canvas.height) {
            meteors.splice(index, 1);
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game objects
    moveSpaceship();
    fireBullet();
    updateBullets();
    updateMeteors();
    checkCollisions();

    // Draw game objects
    drawSpaceship();
    drawBullets();
    drawMeteors();

    // Update stats
    stats.score.textContent = `Score: ${score}`;
    stats.health.textContent = `Health: ${health}`;

    // Check for game over
    if (health <= 0) {
        isRunning = false;
        alert('Game Over! Your score: ' + score);
    }

    requestAnimationFrame(gameLoop);
}

// Start spawning meteors
setInterval(spawnMeteor, 1000);

// Start game loop
gameLoop();
