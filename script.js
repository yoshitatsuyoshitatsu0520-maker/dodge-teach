// =========================================
// 避けろ！！ティーチママ
// script.js
// =========================================


// =========================================
// 画面取得
// =========================================

const loadingScreen = document.getElementById("loadingScreen");
const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const rankingScreen = document.getElementById("rankingScreen");

const loadingProgress = document.getElementById("loadingProgress");
const loadingPercent = document.getElementById("loadingPercent");

const startButton = document.getElementById("startButton");

const gameField = document.getElementById("gameField");

const scoreValue = document.getElementById("scoreValue");
const finalScore = document.getElementById("finalScore");

const mobileGuide = document.getElementById("mobileGuide");


// =========================================
// 画像
// =========================================

const imageList = [
    "images/teach.png",
    "images/sam.png",
    "images/kobayashi.png",
    "images/dada.png",
    "images/dada-event.png"
];


// =========================================
// ゲーム設定
// =========================================

const PLAYER_WIDTH = 90;
const PLAYER_HEIGHT = 90;

const ENEMY_WIDTH = 75;
const ENEMY_HEIGHT = 75;

const PLAYER_BOTTOM = 20;

const MAX_ENEMIES = 3;


// =========================================
// ゲーム状態
// =========================================

let player = null;

let playerX = 0;

let score = 0;

let enemies = [];

let gameRunning = false;

let enemySpawnTimer = null;

let animationId = null;

let lastTime = 0;

let enemySpeed = 180;


// =========================================
// ローディング
// =========================================

function preloadImages() {

    return new Promise((resolve) => {

        let loaded = 0;

        const total = imageList.length;

        if (total === 0) {
            resolve();
            return;
        }

        imageList.forEach((src) => {

            const img = new Image();

            img.onload = () => {

                loaded++;

                const percent = Math.floor(
                    (loaded / total) * 100
                );

                loadingProgress.style.width = percent + "%";
                loadingPercent.textContent = percent + "%";

                if (loaded >= total) {
                    resolve();
                }

            };

            img.onerror = () => {

                console.warn(
                    "画像の読み込みに失敗しました：",
                    src
                );

                loaded++;

                const percent = Math.floor(
                    (loaded / total) * 100
                );

                loadingProgress.style.width = percent + "%";
                loadingPercent.textContent = percent + "%";

                if (loaded >= total) {
                    resolve();
                }

            };

            img.src = src;

        });

    });

}


// =========================================
// ゲーム開始前の読み込み
// =========================================

async function initializeGame() {

    await preloadImages();

    loadingPercent.textContent = "100%";
    loadingProgress.style.width = "100%";

    setTimeout(() => {

        loadingScreen.classList.add("hidden");
        titleScreen.classList.remove("hidden");

    }, 500);

}

initializeGame();


// =========================================
// スタートボタン
// =========================================

startButton.addEventListener("click", () => {

    startGame();

});


// =========================================
// ゲーム開始
// =========================================

function startGame() {

    // 他の画面を隠す
    loadingScreen.classList.add("hidden");
    titleScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    rankingScreen.classList.add("hidden");

    // ゲーム画面表示
    gameScreen.classList.remove("hidden");

    // スマホ案内
    mobileGuide.classList.remove("hidden");

    // 初期化
    score = 0;
    scoreValue.textContent = "0";

    enemySpeed = 180;

    enemies = [];

    gameField.innerHTML = "";

    gameRunning = true;

    // ティーチ作成
    createPlayer();

    // 敵出現開始
    startEnemySpawner();

    // ゲームループ開始
    lastTime = performance.now();

    animationId = requestAnimationFrame(gameLoop);

}


// =========================================
// プレイヤー作成
// =========================================

function createPlayer() {

    player = document.createElement("img");

    player.src = "images/teach.png";

    player.className = "player";

    gameField.appendChild(player);

    const fieldWidth = gameField.clientWidth;

    playerX =
        (fieldWidth - PLAYER_WIDTH) / 2;

    updatePlayerPosition();

}


// =========================================
// プレイヤー位置更新
// =========================================

function updatePlayerPosition() {

    if (!player) return;

    player.style.left =
        playerX + "px";

}


// =========================================
// キーボード操作
// =========================================

const keys = {
    left: false,
    right: false
};


document.addEventListener("keydown", (event) => {

    if (event.key === "ArrowLeft") {
        keys.left = true;
        event.preventDefault();
    }

    if (event.key === "ArrowRight") {
        keys.right = true;
        event.preventDefault();
    }

});


document.addEventListener("keyup", (event) => {

    if (event.key === "ArrowLeft") {
        keys.left = false;
    }

    if (event.key === "ArrowRight") {
        keys.right = false;
    }

});


// =========================================
// スマホのスワイプ操作
// =========================================

let touchStartX = 0;

let touchStartY = 0;


gameField.addEventListener(
    "touchstart",
    (event) => {

        if (!gameRunning) return;

        const touch = event.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

    },
    { passive: true }
);


gameField.addEventListener(
    "touchmove",
    (event) => {

        if (!gameRunning) return;

        event.preventDefault();

        const touch = event.touches[0];

        const currentX = touch.clientX;

        const diffX =
            currentX - touchStartX;

        playerX += diffX;

        keepPlayerInside();

        updatePlayerPosition();

        touchStartX = currentX;

    },
    { passive: false }
);


// =========================================
// プレイヤーを画面内に収める
// =========================================

function keepPlayerInside() {

    const fieldWidth =
        gameField.clientWidth;

    const maxX =
        fieldWidth - PLAYER_WIDTH;

    if (playerX < 0) {
        playerX = 0;
    }

    if (playerX > maxX) {
        playerX = maxX;
    }

}


// =========================================
// 敵出現
// =========================================

function startEnemySpawner() {

    spawnEnemy();

    enemySpawnTimer =
        setInterval(() => {

            if (!gameRunning) return;

            if (enemies.length < MAX_ENEMIES) {
                spawnEnemy();
            }

        }, 900);

}


// =========================================
// 敵を作る
// =========================================

function spawnEnemy() {

    if (!gameRunning) return;

    const enemy = document.createElement("img");

    const type = chooseEnemyType();

    enemy.src = type.image;

    enemy.className = "enemy";

    enemy.dataset.type = type.name;

    enemy.dataset.speed = type.speed;

    enemy.dataset.y = "-90";

    const fieldWidth =
        gameField.clientWidth;

    const maxX =
        fieldWidth - ENEMY_WIDTH;

    const x =
        Math.random() * maxX;

    enemy.style.left = x + "px";
    enemy.style.top = "-90px";

    gameField.appendChild(enemy);

    enemies.push({
        element: enemy,
        x: x,
        y: -90,
        speed: type.speed,
        type: type.name
    });

}


// =========================================
// 敵の種類を決める
// =========================================

function chooseEnemyType() {

    const random = Math.random();

    // サム：70%
    if (random < 0.70) {

        return {
            name: "sam",
            image: "images/sam.png",
            speed: enemySpeed
        };

    }

    // コバヤシ：24%
    if (random < 0.94) {

        return {
            name: "kobayashi",
            image: "images/kobayashi.png",
            speed: enemySpeed * 1.35
        };

    }

    // だだ様：6%
    return {
        name: "dada",
        image: "images/dada.png",
        speed: enemySpeed
    };

}


// =========================================
// ゲームループ
// =========================================

function gameLoop(timestamp) {

    if (!gameRunning) return;

    const deltaTime =
        (timestamp - lastTime) / 1000;

    lastTime = timestamp;


    // =====================================
    // プレイヤー移動
    // =====================================

    const playerMoveSpeed = 350;

    if (keys.left) {
        playerX -=
            playerMoveSpeed * deltaTime;
    }

    if (keys.right) {
        playerX +=
            playerMoveSpeed * deltaTime;
    }

    keepPlayerInside();

    updatePlayerPosition();


    // =====================================
    // 敵を動かす
    // =====================================

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy = enemies[i];

        enemy.y +=
            enemy.speed * deltaTime;

        enemy.element.style.top =
            enemy.y + "px";


        // 当たり判定
        if (checkCollision(enemy)) {

            if (enemy.type === "dada") {

                // だだ様はゲームオーバーにならない
                handleDada(enemy);

            } else {

                gameOver();
                return;

            }

        }


        // 画面外へ行った
        if (
            enemy.y >
            gameField.clientHeight + 100
        ) {

            enemy.element.remove();

            enemies.splice(i, 1);

            // だだ様以外ならスコア加算
            if (enemy.type !== "dada") {

                score++;

                scoreValue.textContent =
                    score;

            }

        }

    }


    // =====================================
    // 時間経過で少しずつ速くする
    // =====================================

    enemySpeed +=
        3 * deltaTime;

    // 上がりすぎ防止
    enemySpeed =
        Math.min(enemySpeed, 330);


    animationId =
        requestAnimationFrame(gameLoop);

}


// =========================================
// 当たり判定
// =========================================

function checkCollision(enemy) {

    if (!player) return false;

    const playerRect =
        player.getBoundingClientRect();

    const enemyRect =
        enemy.element.getBoundingClientRect();


    const padding = 15;


    return !(
        playerRect.right - padding <
            enemyRect.left + padding ||

        playerRect.left + padding >
            enemyRect.right - padding ||

        playerRect.bottom - padding <
            enemyRect.top + padding ||

        playerRect.top + padding >
            enemyRect.bottom - padding
    );

}


// =========================================
// だだ様イベント
// =========================================

function handleDada(enemy) {

    // だだ様を一度だけ処理
    if (enemy.processed) return;

    enemy.processed = true;

    enemy.element.remove();

    const index =
        enemies.indexOf(enemy);

    if (index !== -1) {
        enemies.splice(index, 1);
    }


    // ゲームを一時停止
    gameRunning = false;


    const dadaEvent =
        document.getElementById("dadaEvent");

    dadaEvent.classList.remove("hidden");


    setTimeout(() => {

        dadaEvent.classList.add("hidden");

        gameRunning = true;

        lastTime = performance.now();

        animationId =
            requestAnimationFrame(gameLoop);

    }, 2000);

}


// =========================================
// ゲームオーバー
// =========================================

function gameOver() {

    if (!gameRunning) return;

    gameRunning = false;


    // タイマー停止
    clearInterval(enemySpawnTimer);


    // アニメーション停止
    if (animationId) {
        cancelAnimationFrame(animationId);
    }


    // 敵削除
    enemies.forEach((enemy) => {
        enemy.element.remove();
    });

    enemies = [];


    // プレイヤー削除
    if (player) {
        player.remove();
        player = null;
    }


    // スマホ案内を隠す
    mobileGuide.classList.add("hidden");


    // スコア表示
    finalScore.textContent =
        score;


    // ゲームオーバー画面
    gameScreen.classList.add("hidden");

    gameOverScreen.classList.remove("hidden");

}