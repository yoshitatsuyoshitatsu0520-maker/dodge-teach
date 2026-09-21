// =========================================
// 避けろ！！ティーチママ
// script.js
// =========================================


// =========================================
// Firebase
// =========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyAIwaGRB6ffUB1t7emLsXqFpfYDQ5d7WjQ",
    authDomain: "teach-fanclub.firebaseapp.com",
    projectId: "teach-fanclub",
    storageBucket: "teach-fanclub.firebasestorage.app",
    messagingSenderId: "350154920039",
    appId: "1:350154920039:web:20f0f1c2fbe0780e1044c2"
};
// =========================================
// 一時停止
// =========================================

let isPaused = false;

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
let gameStartTime = 0;
// =========================================
// サウンド
// =========================================

const bgm = new Audio("sounds/bgm.mp3");
const spawnSE = new Audio("sounds/spawn.mp3");
const moveSE = new Audio("sounds/move.mp3");
const hitSE = new Audio("sounds/hit.mp3");
const gameoverSE = new Audio("sounds/gameover.mp3");
const dadaSE = new Audio("sounds/dada.mp3");


// BGM設定
bgm.loop = true;
bgm.volume = 0.35;


// SE音量
spawnSE.volume = 0.5;
moveSE.volume = 0.5;
hitSE.volume = 0.7;
gameoverSE.volume = 0.8;
dadaSE.volume = 0.8;

// ランキング専用コレクション
const rankingCollection =
    collection(db, "dodgeRanking");


// =========================================
// 画面取得
// =========================================

const loadingScreen =
    document.getElementById("loadingScreen");

const titleScreen =
    document.getElementById("titleScreen");

const gameScreen =
    document.getElementById("gameScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const rankingScreen =
    document.getElementById("rankingScreen");

const loadingProgress =
    document.getElementById("loadingProgress");

const loadingPercent =
    document.getElementById("loadingPercent");

const startButton =
    document.getElementById("startButton");

const gameField =
    document.getElementById("gameField");

const scoreValue =
    document.getElementById("scoreValue");

const finalScore =
    document.getElementById("finalScore");

const playerName =
    document.getElementById("playerName");

const rankingSubmitButton =
    document.getElementById("rankingSubmitButton");

const rankingList =
    document.getElementById("rankingList");

const rankingMessage =
    document.getElementById("rankingMessage");

const retryButton =
    document.getElementById("retryButton");

const mobileGuide =
    document.getElementById("mobileGuide");

const dadaEvent =
    document.getElementById("dadaEvent");


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

// 通常敵の最大数
// 通常敵の最大数
const MAX_ENEMIES = 8;

// 敵の数が1体増えるまでの秒数
const ENEMY_COUNT_UP_INTERVAL = 10;

// 通常敵の初期速度
const BASE_ENEMY_SPEED = 180;

// だだ様の速度
const DADA_SPEED = 180;
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

let lastMoveSoundTime = 0;


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

                const percent =
                    Math.floor(
                        (loaded / total) * 100
                    );

                loadingProgress.style.width =
                    percent + "%";

                loadingPercent.textContent =
                    percent + "%";


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

                const percent =
                    Math.floor(
                        (loaded / total) * 100
                    );

                loadingProgress.style.width =
                    percent + "%";

                loadingPercent.textContent =
                    percent + "%";


                if (loaded >= total) {
                    resolve();
                }

            };


            img.src = src;

        });

    });

}

const pauseButton = document.getElementById("pauseButton");

pauseButton.addEventListener("click", () => {
    isPaused = !isPaused;

    if (isPaused) {
        pauseButton.textContent = "▶ 再開";
    } else {
        pauseButton.textContent = "⏸ 一時停止";
    }
});
// =========================================
// 初期化
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
// スタート
// =========================================

startButton.addEventListener(
    "click",
    () => {

        startGame();

    }
);


// =========================================
// ゲーム開始
// =========================================

function startGame() {

    // スマホ操作ガイドを表示
    mobileGuide.classList.remove("hidden");

    // 5秒後に消す
    setTimeout(() => {
        mobileGuide.classList.add("hidden");
    }, 5000);

    // 以下、元々のゲーム開始処理
    score = 0;
    scoreValue.textContent = score;


    loadingScreen.classList.add("hidden");

    titleScreen.classList.add("hidden");

    gameOverScreen.classList.add("hidden");

    rankingScreen.classList.add("hidden");


    gameScreen.classList.remove("hidden");




    bgm.currentTime = 0;

bgm.play().catch((error) => {
    console.log("BGMを再生できませんでした：", error);
});


    score = 0;

    scoreValue.textContent = "0";

    enemySpeed = BASE_ENEMY_SPEED;

    enemies = [];


    gameField.innerHTML = "";

gameStartTime = performance.now();

isPaused = false;
pauseButton.textContent = "⏸ 一時停止";

gameRunning = true;


    createPlayer();


    startEnemySpawner();


    lastTime = performance.now();

    animationId =
        requestAnimationFrame(gameLoop);

}


// =========================================
// プレイヤー作成
// =========================================

function createPlayer() {

    player =
        document.createElement("img");

    player.src =
        "images/teach.png";

    player.className =
        "player";


    gameField.appendChild(player);


    const fieldWidth =
        gameField.clientWidth;


    playerX =
        (fieldWidth - PLAYER_WIDTH) / 2;


    updatePlayerPosition();

}


// =========================================
// プレイヤー位置
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


document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "ArrowLeft") {

            keys.left = true;

            event.preventDefault();

        }


        if (event.key === "ArrowRight") {

            keys.right = true;

            event.preventDefault();

        }

    }
);


document.addEventListener(
    "keyup",
    (event) => {

        if (event.key === "ArrowLeft") {
            keys.left = false;
        }


        if (event.key === "ArrowRight") {
            keys.right = false;
        }

    }
);


// =========================================
// スマホ スワイプ
// =========================================

let touchStartX = 0;

let touchStartY = 0;


gameField.addEventListener(
    "touchstart",
    (event) => {

        if (!gameRunning) return;


        const touch =
            event.touches[0];


        touchStartX =
            touch.clientX;

        touchStartY =
            touch.clientY;

    },
    { passive: true }
);


gameField.addEventListener(
    "touchmove",
    (event) => {

        if (!gameRunning) return;


        event.preventDefault();


        const touch =
            event.touches[0];


        const currentX =
            touch.clientX;


        const diffX =
            currentX - touchStartX;


        playerX += diffX;


        keepPlayerInside();


        updatePlayerPosition();


        touchStartX =
            currentX;

    },
    { passive: false }
);


// =========================================
// プレイヤーを画面内に
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
// 敵出現開始
// =========================================

function startEnemySpawner() {

    clearInterval(enemySpawnTimer);

    spawnEnemy();

    enemySpawnTimer =
    setInterval(() => {

        if (!gameRunning || isPaused) return;

            const elapsedTime =
                (performance.now() - gameStartTime) / 1000;

            // 10秒ごとに最大敵数を1体増やす
            const currentMaxEnemies =
                Math.min(
                    3 + Math.floor(elapsedTime / ENEMY_COUNT_UP_INTERVAL),
                    MAX_ENEMIES
                );

            if (enemies.length < currentMaxEnemies) {
                spawnEnemy();
            }

        }, 900);
}


// =========================================
// 敵生成
// =========================================

function spawnEnemy() {

    if (!gameRunning) return;


    const enemy =
        document.createElement("img");


    const type =
        chooseEnemyType();


    enemy.src =
        type.image;

    enemy.className =
        "enemy";

    enemy.dataset.type =
        type.name;

    enemy.dataset.speed =
        type.speed;


    const fieldWidth =
        gameField.clientWidth;


    const maxX =
        fieldWidth - ENEMY_WIDTH;


    const x =
        Math.random() * maxX;


    enemy.style.left =
        x + "px";

    enemy.style.top =
        "-90px";


    gameField.appendChild(enemy);


    enemies.push({

        element: enemy,

        x: x,

        y: -90,

        speed: type.speed,

        type: type.name,

        processed: false

    });

    spawnSE.currentTime = 0;

spawnSE.play().catch(() => {});

}


// =========================================
// 敵種類
// =========================================

function chooseEnemyType() {

    const random =
        Math.random();


    // サムくん 70%
    if (random < 0.70) {

        return {

            name: "sam",

            image: "images/sam.png",

            speed: enemySpeed

        };

    }


    // コバヤシくん 24%
    if (random < 0.96) {

        return {

            name: "kobayashi",

            image: "images/kobayashi.png",

            speed:
                enemySpeed * 1.5

        };

    }


    // だだ様 6%
    return {
    name: "dada",
    image: "images/dada.png",
    speed: DADA_SPEED
};

}


// =========================================
// ゲームループ
// =========================================

function gameLoop(timestamp) {

    if (!gameRunning) return;

    // 一時停止中はゲームの処理を止める
    if (isPaused) {
        lastTime = timestamp;
        animationId = requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime =
        (timestamp - lastTime) / 1000;


    lastTime = timestamp;


    // =====================================
    // プレイヤー
    // =====================================

    const playerMoveSpeed = 350;


    let isMoving = false;


if (keys.left) {

    playerX -=
        playerMoveSpeed * deltaTime;

    isMoving = true;

}


if (keys.right) {

    playerX +=
        playerMoveSpeed * deltaTime;

    isMoving = true;

}


if (isMoving) {

    const now = performance.now();

    if (now - lastMoveSoundTime > 150) {

        moveSE.currentTime = 0;

        moveSE.play().catch(() => {});

        lastMoveSoundTime = now;

    }

}


    keepPlayerInside();

    updatePlayerPosition();


    // =====================================
    // 敵
    // =====================================

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        enemy.y +=
            enemy.speed * deltaTime;


        enemy.element.style.top =
            enemy.y + "px";


        // 当たり判定
        if (checkCollision(enemy)) {

            if (enemy.type === "dada") {

    handleDada(enemy);

} else {

    // 💥 ヒットSE
    hitSE.currentTime = 0;

    hitSE.play().catch(() => {});


    gameOver();

    return;

}

        }


        // 画面外
        // 画面外
if (
    enemy.y >
    gameField.clientHeight + 100
) {

    // =====================================
    // だだ様が画面外まで落ちた
    // =====================================
    if (enemy.type === "dada") {

        handleDada(enemy);

        return;

    }


    // =====================================
    // 普通の敵
    // =====================================

    enemy.element.remove();

    enemies.splice(i, 1);


    // 避けたので得点
    score++;

    scoreValue.textContent =
        score;

}

    }


    // =====================================
    // 難易度上昇
    // =====================================

    enemySpeed +=
        15 * deltaTime;


    enemySpeed =
        Math.min(
            enemySpeed,
            1000
        );


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

    if (enemy.processed) return;


    enemy.processed = true;


    enemy.element.remove();


    const index =
        enemies.indexOf(enemy);


    if (index !== -1) {

        enemies.splice(index, 1);

    }


    gameRunning = false;

    // 👑 だだ様SE
dadaSE.currentTime = 0;

dadaSE.play().catch(() => {});


    dadaEvent.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        dadaEvent.classList.add(
            "hidden"
        );


        gameRunning = true;


        lastTime =
            performance.now();


        animationId =
            requestAnimationFrame(
                gameLoop
            );

    }, 2000);

}


// =========================================
// ゲームオーバー
// =========================================

function gameOver() {

    if (!gameRunning) return;


    gameRunning = false;

    bgm.pause();
bgm.currentTime = 0;

    gameoverSE.currentTime = 0;

gameoverSE.play().catch(() => {});


    clearInterval(
        enemySpawnTimer
    );


    if (animationId) {

        cancelAnimationFrame(
            animationId
        );

    }


    enemies.forEach(
        (enemy) => {

            enemy.element.remove();

        }
    );


    enemies = [];


    if (player) {

        player.remove();

        player = null;

    }


    mobileGuide.classList.add(
        "hidden"
    );


    finalScore.textContent =
        score;


    playerName.value = "";


    gameScreen.classList.add(
        "hidden"
    );


    gameOverScreen.classList.remove(
        "hidden"
    );

}


// =========================================
// ランキング登録ボタン
// =========================================

rankingSubmitButton.addEventListener(
    "click",
    async () => {

        const name =
            playerName.value.trim();


        // 名前が空だった場合
        if (!name) {

            rankingMessage.textContent =
                "ニックネームを入力してね！";

            return;

        }


        // ボタン連打防止
        rankingSubmitButton.disabled =
            true;


        rankingSubmitButton.textContent =
            "登録中……";


        rankingMessage.textContent =
            "";


        try {

            // =================================
            // Firebaseへ保存
            // =================================

            await addDoc(
                rankingCollection,
                {

                    name: name,

                    score: score,

                    createdAt:
                        serverTimestamp()

                }
            );


            console.log(
                "ランキング登録成功！"
            );


            // =================================
            // ランキング取得
            // =================================

            await showRanking(name);


        } catch (error) {

            console.error(
                "ランキング登録エラー：",
                error
            );


            rankingMessage.textContent =
                "ランキング登録に失敗しました……";


            rankingSubmitButton.disabled =
                false;


            rankingSubmitButton.textContent =
                "ランキングに登録！";

        }

    }
);


// =========================================
// ランキング表示
// =========================================

async function showRanking(myName) {

    try {

        const rankingQuery =
            query(
                rankingCollection,
                orderBy("score", "desc"),
                limit(100)
            );


        const snapshot =
            await getDocs(rankingQuery);


        // =================================
        // 名前ごとに最高記録だけ残す
        // =================================

        const bestScores = new Map();


        snapshot.forEach((doc) => {

            const data = doc.data();

            const name =
                data.name || "名無し";

            const score =
                Number(data.score || 0);


            // まだ登録されていない名前
            if (!bestScores.has(name)) {

                bestScores.set(name, {
                    id: doc.id,
                    name: name,
                    score: score
                });

                return;
            }


            // すでに登録されているなら
            // 高いスコアだけ残す
            const current =
                bestScores.get(name);


            if (score > current.score) {

                bestScores.set(name, {
                    id: doc.id,
                    name: name,
                    score: score
                });

            }

        });


        // =================================
        // Map → 配列
        // =================================

        const rankings =
            Array.from(
                bestScores.values()
            );


        // =================================
        // スコア順に並べる
        // =================================

        rankings.sort((a, b) => {

            return b.score - a.score;

        });


        // =================================
        // 自分の順位
        // =================================

        const myIndex =
            rankings.findIndex((entry) => {

                return (
                    entry.name === myName &&
                    entry.score === score
                );

            });


        // =================================
        // ランキングを空にする
        // =================================

        rankingList.innerHTML = "";


        // =================================
        // TOP10表示
        // =================================

        const top10 =
            rankings.slice(0, 10);


        top10.forEach((entry, index) => {

            const li =
                document.createElement("li");


            const rank =
                index + 1;


            li.textContent =
                `位　${entry.name}　${entry.score}体`;


            rankingList.appendChild(li);

        });


        // =================================
        // 自分の順位
        // =================================

        if (myIndex === -1) {

            rankingMessage.textContent =
                "圏外";

        } else {

            const myRank =
                myIndex + 1;


            rankingMessage.textContent =
                `あなたは ${myRank}位！　${score}体回避`;

        }


        // =================================
        // ランキング画面
        // =================================

        gameOverScreen.classList.add(
            "hidden"
        );

        rankingScreen.classList.remove(
            "hidden"
        );


        rankingSubmitButton.disabled =
            false;

        rankingSubmitButton.textContent =
            "ランキングに登録！";


    } catch (error) {

        console.error(
            "ランキング取得エラー：",
            error
        );


        rankingMessage.textContent =
            "ランキングの取得に失敗しました……";


        rankingSubmitButton.disabled =
            false;

        rankingSubmitButton.textContent =
            "ランキングに登録！";

    }

}

// =========================================
// リトライ
// =========================================

retryButton.addEventListener(
    "click",
    () => {

        rankingScreen.classList.add(
            "hidden"
        );


        startGame();

    }
);