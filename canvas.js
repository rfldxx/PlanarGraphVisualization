// ГРАФ
let vertx = [{id:0, x:50, y:30, label:"tttt"}]; // id, x, y, label
let edges = []; // v1 (id1), v2 (id2)
let selectedVertex = null;
let draggingVertex = null;

// выбранные вершины
let selected   = new Array(100);

// переменные CANVAS
const canvas = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');


// Размеры вершин
const VERTEX_RADIUS = 15;

// Цвета
const COLORS = {
    VERTEX: '#4CAF50',
    VERTEX_HOVER: '#45a049',
    VERTEX_SELECTED: '#2196F3',
    VERTEX_DRAGGING: '#FF5722',
    EDGE: '#333',
    EDGE_HOVER: '#FF5722',
    TEXT: '#333',
    BACKGROUND: '#fff'
};


// Рисование вершины
function drawVertex(i, clr = (selected[i] ? COLORS.VERTEX_SELECTED : COLORS.VERTEX)) {
    ctx.beginPath();
    ctx.arc(vertx[i].x, vertx[i].y, VERTEX_RADIUS, 0, Math.PI * 2);
    
    // Выбор цвета в зависимости от состояния
    ctx.fillStyle = clr;
    ctx.fill();
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Текст метки
    ctx.fillStyle    = 'white';
    ctx.font         = 'bold 14px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vertx[i].label, vertx[i].x, vertx[i].y);
}

// Рисование ребра
function drawEdge(i) {
    let u = vertx[edges[i].v1], v = vertx[edges[i].v2];
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(v.x, v.y);
    
    ctx.strokeStyle = COLORS.EDGE;
    ctx.lineWidth   = 2;
    ctx.stroke();
}

function redraw() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисование всех рёбер
    for(let i = 0; i < edges.length; i++) drawEdge  (i);
    for(let i = 0; i < vertx.length; i++) drawVertex(i);
    
    // // Рисование временного ребра (если выбран режим добавления и есть первая вершина)
    // if (mode === 'addEdge' && startVertexForEdge !== null) {
    //     const currentMousePos = getMousePos({ clientX: 0, clientY: 0 }); // Текущая позиция мыши
    //     const startVertex = vertices[startVertexForEdge];
    //     drawEdge(startVertex, currentMousePos);
    // }

    // console.log(vertx);
}


// Запуск приложения
// window.onload = 
redraw();





// МЫШКА
// Инициализация
function init() {
    // Настройка обработчиков событий
    canvas.addEventListener('mousedown'  , handleMouseDown  );
    canvas.addEventListener('mousemove'  , handleMouseMove  );
    
    canvas.addEventListener('contextmenu', handleContextMenu);
    
    // !!! НА ЦЕЛЫЙ ДОКУМЕНТ
    document.addEventListener('mouseup'  , handleMouseUp    );
    
    // document.addEventListener('keydown', handleKeyDown);
    // document.addEventListener('keyup', handleKeyUp);
    
    // Первая отрисовка
    redraw();
}
init();


// Получение координат мыши
function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

let isdragging = 0;
let coveredVertex = -1;
function isVertexCovered(x, y) {
    for(let i = 0; i < vertx.length; i++) {
        let dx = x - vertx[i].x, dy = y - vertx[i].y;
        if( dx*dx + dy*dy <= VERTEX_RADIUS*VERTEX_RADIUS )
            return coveredVertex = i; 
    }
    return coveredVertex = -1;
}


// не показывать контекстное меню на вершины
function handleContextMenu(event) {
    if( coveredVertex != -1 ) event.preventDefault();
}




let pre_select = -1;
function handleMouseUp(event) {
    if( event.button == 0 ) // ЛКМ
        if( coveredVertex != -1 ) {  // возвращаем исходный цвет
            drawVertex(coveredVertex);
            isdragging = 0;
        }

    if( event.button == 2 ) // ПКМ
        if( coveredVertex == pre_select ) {  // возвращаем исходный цвет
            selected[coveredVertex] ^= 1;
            console.log('selected: ' + coveredVertex);

            drawVertex(coveredVertex);
            isdragging = 0;
        }
}

function handleMouseDown(event) {
    let {x, y} = getMousePos(event);
    isVertexCovered(x, y);

    pre_select = -2;
    if( coveredVertex == -1 ) return;

    console.log( coveredVertex );

    if( event.button == 0 ) { // ЛКМ (перетаскивание)
        drawVertex(coveredVertex, COLORS.VERTEX_DRAGGING);
        isdragging = 1;
    }

    if( event.button == 2 ) { // ПКМ (выделение)
        pre_select = coveredVertex;
        console.log('selected: ' + coveredVertex);
    }
}

function handleMouseMove(event) {
    let {x, y} = getMousePos(event);

    if( isdragging ) {  // перетаскиваем вершину
        vertx[coveredVertex].x = x;
        vertx[coveredVertex].y = y;
        redraw();
        drawVertex(coveredVertex, COLORS.VERTEX_DRAGGING);
        return;
    } 
    
    isVertexCovered(x, y);

    // Подсветка вершин при наведении
    canvas.style.cursor = (coveredVertex != -1) ? 'pointer' : 'crosshair';
}










// === [ модуль WEBASM ] ==========================================================================
// Глобальная переменная для модуля
let wasmModule = null;

// Загрузка WebAssembly модуля
async function loadWasm() {
    try {
        // Динамически создаем модуль из wasm.js
        const script = document.createElement('script');
        script.src = 'wasm.js';
        
        // Ждем загрузки или ошибки
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load wasm.js script'));
            document.body.appendChild(script);
        });
        
        // Инициализируем модуль (если используется Module из Emscripten)
        if (typeof Module !== 'undefined') {
            wasmModule = Module;
            console.log('WebAssembly module loaded');
            document.getElementById('text').innerHTML  = '<span style="color: green">✓ Module loaded successfully</span>';
        } else {
            throw new Error('Module is undefined after script load');
        }
    } catch (error) {
        console.error('Failed to load WebAssembly:', error);
        document.getElementById('text').innerHTML  = '<span style="color: red">✗ Failed to load module</span>';
    }
}

// пока костыль
function pre_pos() {
    vertx = [];
    for(let i = 0; i < 10; i++) {
        vertx.push( {x: 50*(i+1), y: 50 + 15*(i-5)*(i-5), label: `${i}`} );
    }
}
pre_pos();
redraw();
// Загружаем WebAssembly при старте
// window.onload = 
loadWasm();
// wasmModule.cpp_zero_topology(10);


function rejser(abVector, key1, key2) {
    let ab = [];
    for(let i = 0; i < abVector.size(); i += 2) {
        ab.push( {[key1]: abVector.get(i), [key2]: abVector.get(i+1)} );
    }
    // Очищаем
    abVector.delete();
    return ab;
}

function generate_random_topology() {
    wasmModule.cpp_generate_random_topology(10, 15);
    edges = rejser( wasmModule.cpp_get_edges(), 'v1', 'v2' );
}

let no_topology = 1;
function random_reordering() {
    if( no_topology ) {
        wasmModule.cpp_zero_topology(10);
        no_topology = 0;
    }

    let xy = rejser( wasmModule.cpp_random_reordering(), 'x', 'y' );
    console.log(xy);

    let indent = 20;
    inscribe_dots(xy, canvas.width - 2*indent, canvas.height - 2*indent);

    for(let i = 0; i < vertx.length; i++) {
        vertx[i].x = xy[i].x + indent;
        vertx[i].y = xy[i].y + indent;
    }
}

function bfs_reordering() {
    const bfs_starts = new wasmModule.VectorInt();
    let cnt = 0;
    for(let i = 0; i < vertx.length; i++) {
        if( selected[i] ) { bfs_starts.push_back(i); cnt++; console.log('bfs: ', i); bfs_reordering}
    }
    if( !cnt ) bfs_starts.push_back(0);
    let xy = rejser( wasmModule.cpp_bfs_reordering(bfs_starts), 'x', 'y' );
    // Очищаем
    bfs_starts.delete();


    let indent = 20;
    inscribe_dots(xy, canvas.width - 2*indent, canvas.height - 2*indent);

    for(let i = 0; i < vertx.length; i++) {
        vertx[i].x = xy[i].x + indent;
        vertx[i].y = xy[i].y + indent;
    }
}

// // Загружаем вектор в WebAssembly
function loadVector() {    
    const input = document.getElementById('vectorInput').value;
    const numbers = input.split(',').map(num => parseInt(num.trim())).filter(n => !isNaN(n));

    if (numbers.length === 0) {
        alert('Please enter valid numbers');
        return;
    }
   
    // Создаем вектор
    const vec = new wasmModule.VectorInt();
    numbers.forEach(n => vec.push_back(n));
   
    // Вызываем функцию load
    wasmModule.load(vec);
   
    // Очищаем
    vec.delete();
       
    document.getElementById('loadStatus').innerHTML = `Loaded vector: [${numbers.join(', ')}]`;
}
//
// // Вычисляем сумму
// function calculateSum() {
//     const sum = wasmModule.f();
//     document.getElementById('sumResult').innerHTML = `Sum of all elements: <strong>${sum}</strong>`;
// }
//
// function findNumber() {
//     const elem = parseInt(document.getElementById('elem').value);
//     const r = wasmModule.h(elem);
//     document.getElementById('findResult').innerHTML = `Result: ${r}`;
// }
//
// // Умножаем вектор
// function multiplyVector() {
//     const multiplier = parseInt(document.getElementById('multiplier').value);
//     if (isNaN(multiplier)) {
//         alert('Please enter a valid number');
//         return;
//     }
//    
//     // Получаем результат умножения
//     const resultVec = wasmModule.g(multiplier);
//    
//     // Конвертируем в массив
//     const result = [];
//     for (let i = 0; i < resultVec.size(); i++) {
//         result.push(resultVec.get(i));
//     }
//    
//     // Очищаем
//     resultVec.delete();
//    
//     document.getElementById('multiplyResult').innerHTML = `Result: [${result.join(', ')}]`;
// }



// может её лучше в js?
function inscribe_dots(dots, X, Y) {
    let min_x = dots[0].x, max_x = dots[0].x;
    let min_y = dots[0].y, max_y = dots[0].y;
    for(let e of dots) {
        min_x = Math.min(min_x, e.x);
        max_x = Math.max(max_x, e.x);
        min_y = Math.min(min_y, e.y);
        max_y = Math.max(max_y, e.y);
    }

    let XX = max_x - min_x, YY = max_y - min_y;
    for(let e of dots) {
        e.x = X * (e.x-min_x)/XX;
        e.y = Y * (e.y-min_y)/YY;
    }
    return dots;
}


//=================================================================================================



function press(btn) {
    console.log('pressed: ', btn);

    document.getElementById('text').innerHTML = "Pressed: button" + btn;
    
    let skipped = 1;
    if( btn == 0 ) { skipped = 0; generate_random_topology(); }
    if( btn == 1 ) { skipped = 0; bfs_reordering();           }
    if( btn == 2 ) { skipped = 0; random_reordering();        }
    
    if( skipped ) document.getElementById('text').innerHTML += ' <span style="color: blue">currently not worked :(</span>';
    redraw();
}