const Colors = {
	red: 0xf25346,
	black: 0x1b1b1b,
	brown: 0x59332e,
	brownDark: 0x23190f,
	blue: 0x68c3c0,
    deepBlue: 0x0A2342,
    sand: 0xf7d9aa,
    gold: 0xFFD700
};
const leaderBoardDiv = document.getElementById('leaderboard-wrap');
const container = document.getElementById('world');
const levelSpan = document.getElementById('level-span');
const scoreDiv = document.getElementById('score-wrap');
const scoreSpan = document.getElementById("score-span");
const scoreBtn = document.getElementById('score-btn');
const menuDiv = document.getElementById('menu-wrap');
const lifesDiv = document.getElementById('lifes-wrap');
const hearts = Array.from( document.querySelectorAll('#life-img') );

let scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, height, width, renderer;
let lifes = 3;
let lvl = 1;

let playerName;

const startMenuTrack = new Audio('start-menu-music.mp3');
startMenuTrack.loop = true;
let isStartTrackPLayed;

const backgroundTrack = new Audio('bcg-music.mp3')
backgroundTrack.loop = true;

const coinTrack = new Audio('bump-into-coin.mp3');
const enemyTrack = new Audio('crash-into-enemy.mp3');
const gameOverTrack = new Audio('game-over.mp3');
const newLvlTrack = new Audio('new-level.mp3');

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// создание сцены 
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


// создание сцены
const createScene = () => {
    height = window.innerHeight;
    width = window.innerWidth;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7d9aa, 200, 950);  // эффект тумана
    // камера
    aspectRatio = width / height;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
    camera.position.x = 0;
    camera.position.y = 200;
    camera.position.z = 100;

    // рендерер
    renderer = new THREE.WebGLRenderer({ alpha: true });  //(aplha: true) - включает прозрачность чтобы был виден градиент
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // подстраивание игры под изменение размеров экрана
    const onWindowResize = () => {
        height = window.innerHeight;
        width = window.innerWidth;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onWindowResize);
};

// создание освещения
let hemisphereLight, shadowLight;
const createLights = () => {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, 1)

    shadowLight = new THREE.DirectionalLight(0xFFFFFF, 0.9);  // направленный свет
    shadowLight.position.set(150, 150, 350);
    shadowLight.castShadow = true;
    // область освещения
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    scene.add(hemisphereLight);
    scene.add(shadowLight);
};


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// классы обьектов 
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


// главный класс
class MainClass {
    constructor () {
        this.mesh = new THREE.Mesh();
        this.mesh.receiveShadow = true;
        this.object3d = new THREE.Object3D();
    };
    // создание множества мелких объектов (здесь - монеты и препятствия)
    spawnItems (type, amount, color) {
        this.matrixAutoUpdate = true;
        for (let i = 0; i < amount; i++) {
            let a = Math.PI * 2 / amount * i; // финальный угол
            let h = 600 + Math.random() * 150; // радиус mesh
            const item = new Item(type, a, h, color);
            this.mesh.add(item.mesh);
        };
    };
    // добавление обьекту координат для выстраивания по кругу
    addRoundCoords (a, h) {
        this.mesh.position.y = Math.sin(a) * h;
        this.mesh.position.x = Math.cos(a) * h;
        this.mesh.rotation.z = a + Math.PI / 2;
    }
};

// класс игрока
class Player extends MainClass{
    constructor() {
        super();
        this.mesh.geometry = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
        this.mesh.material = new THREE.MeshPhongMaterial({ color: Colors.black });
    }
};

// класс поверхности
class Sea extends MainClass{
    constructor() {
        super();
        this.mesh.geometry = new THREE.CylinderGeometry(600,600,800,20,20);
        this.mesh.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));  // вращение по Х
        this.mesh.material = new THREE.MeshPhongMaterial({ color: 0x072A6C, transparent: true, opacity: 1 });
    };
};
const sea = new Sea();

// класс облаков
class Cloud extends MainClass{
    constructor() {
        super();
        const geom = new THREE.BoxGeometry(90, 70, 70);  // создание элемента облака
        const mat = new THREE.MeshPhongMaterial({ color: Colors.deepBlue, opacity: 0.45, transparent: true});
        let blockAmount = 4 + Math.floor(Math.random() * 4);  // создание рандомного кол-ва блоков в облаке

        for (let i = 0; i < blockAmount; i++) {
            const m = new THREE.Mesh(geom, mat);
            m.position.x = i * 20;
            m.position.y = Math.random() * 5;
            m.position.z = Math.random() * 12;
            m.rotation.z = Math.random() * Math.PI * 5;
            m.rotation.y = Math.random() * Math.PI * 5;

            let s = 0.1 + Math.random() * 0.9;  // рандомный размер куба
            m.scale.set(s, s, s);
            m.receiveShadow = true;
            this.mesh.add(m);
        };
    };
};

// класс неба
class Sky extends MainClass{
    constructor() {
        super();
        this.cloudsAmount = 25;
        let stepAngle = Math.PI * 2 / this.cloudsAmount;
        // создание облаков
        for (let i = 0; i < this.cloudsAmount; i++) {
            const cloud = new Cloud();
            let h = 900 + Math.random() * 150; // радиус расположения облаков

            cloud.addRoundCoords(stepAngle * i, h)
            cloud.mesh.position.z = -400 - Math.random() * 400;

            let s = 1.7 + Math.random() * 2;  // масштаб облаков
            cloud.mesh.scale.set(s, s, s);
            this.mesh.add(cloud.mesh);
        };
    };
};
const sky = new Sky();

// класс общий для монет и препятствий
class Item extends MainClass{
    constructor (type, a, h, color) {
        super();
        let geom;
        if (type == 'coin') {
           geom = new THREE.TorusKnotGeometry(15, 4, 70, 12, 2, 3 );
        } else {
            geom = new THREE.SphereGeometry(10);
        }
        geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)); 
        this.mesh.geometry = geom;
        this.mesh.material = new THREE.MeshPhongMaterial({ color: color, opacity: 1 });
        this.addRoundCoords(a, h);
        this.mesh.position.z = -200;
    };
};

// класс группы монет и группы препятствий
class ItemGroup extends MainClass {
    constructor() {
        super();
        this.amount = 10;
    };
};
const coinGroup = new ItemGroup();
const enemyGroup = new ItemGroup();


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// функции создания обьектов 
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


// создание игрока (коробки)
const player = new Player();
const playerBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
function createPlayer(){
	player.mesh.scale.set(0.5,0.5,0.5);
    player.mesh.position.x = -100;
	player.mesh.position.y = 300;
    player.mesh.position.z = -403;
    playerBox.setFromObject(player.mesh);
	scene.add(player.mesh);
};

// добавить на сцену "природу"
function createArea (obj, posY) {
    obj.mesh.position.y = posY;
	scene.add(obj.mesh);
};
// добавить на сцену развлекательную чать (монетки и препятствия)
function createInteractive (type, obj, color) {
    obj.spawnItems(type, obj.amount, color)
    obj.mesh.position.y = -400;
    obj.mesh.position.z = -200;
    scene.add(obj.mesh);
};

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// localStorage
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// создать массив в local storage
const initLS = () => {
    const resultsArr = new Array();
    localStorage.setItem('results', JSON.stringify(resultsArr));
};

// занести данные в local storage
const updateLS = (name, score) => {
    currArr = localStorage.getItem('results');
    currArr = JSON.parse(currArr);
    // текущий результат
    const currRes = {
        name: name,
        score: score,
    };
    currArr.push(currRes);
    localStorage.setItem('results', JSON.stringify(currArr));
};

// получить данные из local storage
const getLS = () => {
    let resArr = localStorage.getItem('results');
    resArr = JSON.parse(resArr);
    return resArr;
};


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// отрисовка элементов 
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// отрисовка

// окно с правилами
const drawRules = () => {
    menuDiv.innerHTML = '';
    const div = document.createElement('div');
    div.style.zIndex = '100';
    div.style.display = 'grid';
    div.style.placeItems = 'center'
    const p1 = document.createElement('p');
    p1.textContent = 'Drag the cursor up and down to controle the box. Collect all knots to pass to the next level. Avoid the red balls';
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('id', 'close-btn');
    closeBtn.textContent = 'Got it!';
    div.appendChild(p1);
    div.appendChild(closeBtn);

    menuDiv.appendChild(div);
}

// отрисовка стартового меню
const drawStartMenu = () => {
    menuDiv.innerHTML = '';

    const p1 = document.createElement('p');
    p1.setAttribute('id', 'click-to-play-music');
    p1.textContent = 'Welcome!';
    const p2 = document.createElement('p');
    p2.textContent = 'Press the button to start';

    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'start-btn');
    btn1.textContent = 'Start the game';
    const btn2 = document.createElement('button');
    btn2.setAttribute('id', 'score-btn');
    btn2.textContent = 'Show the leaderboard';

    menuDiv.appendChild(p1);
    menuDiv.appendChild(p2);
    menuDiv.appendChild(btn1);
    menuDiv.appendChild(btn2);

};

// отрисовка меню рестарта
const drawRestartMenu = (score) => {
    menuDiv.innerHTML = '';

    const p1 = document.createElement('p');
    p1.textContent = 'Your score: ' + score;
    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'restart-btn');
    btn1.textContent = 'click to restart';

    const btn2 = document.createElement('button');
    btn2.setAttribute('id', 'restart-home-btn');
    btn2.textContent = 'Go to main page';
    

    menuDiv.classList.remove('block-hide');
    menuDiv.appendChild(p1);
    menuDiv.appendChild(btn1);
    menuDiv.appendChild(btn2);

};


const drawLeadearBoardList = (ul, name, score) => {
    const li = document.createElement('li');
    li.textContent = `${name}: ${score}`;
    ul.appendChild(li);
};

// отрисовка доски результатов
function drawLeaderBoard () {
    const div = document.createElement('div');
    div.setAttribute('id', 'leaderboard-div');
    div.style.zIndex = '100';
    const h3 = document.createElement('h3');
    h3.textContent = 'Here are your session\'s results: ';
    
    const ul = document.createElement('ul');

    const scoreResults = getLS();
    scoreResults.sort((a, b) => b.score - a.score);  // сортировка по убыванию
    scoreResults.map(el => drawLeadearBoardList(ul, el.name, el.score));

    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('id', 'leaderboard-close-btn');
    closeBtn.textContent = 'Return to main menu';

    div.appendChild(h3);
    div.appendChild(ul);
    div.appendChild(closeBtn);
    leaderBoardDiv.appendChild(div);
    leaderBoardDiv.classList.add('block-show')
};

// установить обработчики событий
const setlisteners = () => {
    const startBtn = document.getElementById('start-btn');
    // кнопка 'Start the game'
    startBtn.addEventListener('click', () => {
        startBtn.disabled = 'true';
        console.log(startBtn.disabled);

        if (!!isGameOver) {
            isGameOver = false;
            setTimeout(restart, 200)
        } else {
            setTimeout(startGame, 200);
        };
    });

    // кнопка 'Show the leaderboard'
    document.getElementById('score-btn').addEventListener('click', () => {
        drawLeaderBoard();
        document.getElementById('leaderboard-close-btn').addEventListener('click', () => {
            leaderBoardDiv.innerHTML = '';
        });
    });

    // музыка
    document.getElementById('click-to-play-music').addEventListener('click', () => {
        if (!isStartTrackPLayed)  {
            startMenuTrack.play();
            isStartTrackPLayed = true;
        } else {
            startMenuTrack.pause();
            isStartTrackPLayed = false; 
        }
    });

};


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// функции игрового процесса 
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


// проверка на столкновение
function checkCollision (type, vector, element) {
    let playerPos = player.mesh.position;

    if (vector.x > -100 && vector.x < -95 && vector.y > 0) {
        if (playerPos.distanceTo(vector, vector) <= 30) {
            // препятствия
            if (type === 'enemy') {
                enemyTrack.play();
                lifes--;
                if (lifes == 0) {
                    return gameOver();
                };
                lifeDecrement(vector);
                element.removeFromParent();
            };
            // монеты 
            if (type ==='coin') {
                coinTrack.play();
                scoreIncrement();
                element.removeFromParent();
                if (coinGroup.mesh.children.length == 0){
                    enemyGroup.amount += 1;
                    coinGroup.amount += 4;
                    lvl += 0.2;
                    createInteractive('coin', coinGroup, Colors.gold);
                    levelIncrement();
                };
            };
        }; 


    };
};

// увеличение счета
let score = 0;
const scoreIncrement = () => {
    score++;
    scoreSpan.innerText = score;
};

// увеличение уровня
let prevLvl = 1;
const levelIncrement = () => {
    prevLvl++;
    newLvlTrack.play()
    levelSpan.innerText = prevLvl;
};

// жизни
const lifeDecrement = (vector) => {
    const lastHeart = hearts[lifes];
    lastHeart.style.visibility = 'hidden';
}

// движение игрока за мышкой
const movePlayer = (e) => {
    let step = 1 + Math.floor( (height - e.clientY) / 1.5 - player.mesh.position.y );
    player.mesh.position.y += step;
};
// ----------------------------------

// конец игры
let isGameOver = false;
const gameOver = () => {
    backgroundTrack.pause()
    isGameOver = true;
    hearts[0].style.filter = 'grayscale(1)';

    gameOverTrack.play();
    startMenuTrack.currentTime = 0;
    gameOverTrack.addEventListener('ended', () => startMenuTrack.play());

    if (playerName == null || playerName.trim() == '') {
        playerName = 'anonymous';
    };
    updateLS(playerName, score);

    drawRestartMenu(score);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('restart-home-btn').addEventListener('click', () => {
        drawStartMenu()
        setlisteners()
    });
};

// рестарт
const restart = () => {
    backgroundTrack.currentTime = 0;
    startMenuTrack.pause();
    backgroundTrack.play();

    enemyGroup.mesh.clear();
    coinGroup.mesh.clear();

    setTimeout(startGame, 200);
    menuDiv.classList.add('block-hide');
    scoreDiv.classList.add('block-show'); 
    hearts[0].style.filter = 'grayscale(0)';
    
    scoreSpan.innerHTML = 0;
    levelSpan.innerHTML = 1;
    score = 0;
    lvl = 1;
    lifes = 3;
    hearts.forEach(el => el.style.visibility = 'visible');
    isGameOver = false;
}

// функция анимации
let RAF;  // requestAnimationFrame
function animate() {
    sea.mesh.rotation.z += 0.005;
    sky.mesh.rotation.z += 0.0025;

    enemyGroup.mesh.rotation.z += 0.007 * lvl;
    enemyGroup.mesh.updateMatrixWorld();

    coinGroup.mesh.rotation.z += 0.005 * lvl;
    coinGroup.mesh.updateMatrixWorld();

    enemyGroup.mesh.children.forEach(element => {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(element.matrixWorld);
        checkCollision('enemy', vector, element);
    });

    coinGroup.mesh.children.forEach(element => {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(element.matrixWorld);
        checkCollision('coin', vector, element)
    });

    if (!isGameOver) {
    RAF = window.requestAnimationFrame(animate);
    } else {
        window.cancelAnimationFrame(RAF)
    };
    renderer.render(scene, camera);
};

// =============================================================================

// инициализация
function init () {
    createLights();
    createArea(sea, -600);
    createArea(sky, -450);
    drawStartMenu();
    setlisteners();
    initLS();
};

// старт игры
function startGame () {
    playerName = prompt('enter your name');
    startMenuTrack.pause();
    backgroundTrack.play();
    createPlayer();
    createInteractive('coin', coinGroup, Colors.gold);
    createInteractive('enemy', enemyGroup, Colors.red);
    menuDiv.classList.add('block-hide');
    scoreDiv.classList.add('block-show');

    document.addEventListener('mousemove', movePlayer);
    animate();
};

// event listeners
window.addEventListener('load', () => {
    createScene();
    drawRules();
    document.getElementById('close-btn').addEventListener('click', () => {
        init();
        startMenuTrack.play();
        isStartTrackPLayed = true;
    });
});
