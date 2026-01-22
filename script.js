// Основные переменные
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const vertexCountSpan = document.getElementById('vertexCount');
const edgeCountSpan = document.getElementById('edgeCount');

// Элементы управления
const addVertexBtn = document.getElementById('addVertexBtn');
const addEdgeBtn = document.getElementById('addEdgeBtn');
const deleteBtn = document.getElementById('deleteBtn');
const clearBtn = document.getElementById('clearBtn');

let buttons = [];
function init_buttons() {
    txt = ['addVertexBtn', 'addEdgeBtn', 'deleteBtn', 'clearBtn'];
    for(let e of txt) buttons.push( document.getElementById(e) );
}


// Состояние приложения
let mode = 'addVertex'; // 'addVertex', 'addEdge', 'delete'
let vertices = [];
let edges = [];
let selectedVertex = null;
let draggingVertex = null;
let startVertexForEdge = null;
let isShiftPressed = false;

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

// Инициализация
function init() {
    init_buttons();

    // Настройка обработчиков событий
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup'  , handleMouseUp  );
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Обработчики кнопок
    addVertexBtn.addEventListener('click', () => setMode('addVertex'));
    addEdgeBtn.addEventListener('click', () => setMode('addEdge'));
    deleteBtn.addEventListener('click', () => setMode('delete'));
    clearBtn.addEventListener('click', clearAll);
    
    // Стартовый режим
    setMode('addVertex');
    
    // Первая отрисовка
    redraw();
}

// Установка режима работы
function setMode(newMode) {
    mode = newMode;

    // Обновление кнопок
    [addVertexBtn, addEdgeBtn, deleteBtn].forEach(btn => btn.classList.remove('active'));
    
    if (newMode === 'addVertex') {
        addVertexBtn.classList.add('active');
        statusDiv.innerHTML = 'Режим: <strong>Добавление вершин</strong> | Кликните на поле для добавления вершины';
    } else if (newMode === 'addEdge') {
        addEdgeBtn.classList.add('active');
        statusDiv.innerHTML = 'Режим: <strong>Добавление рёбер</strong> | Кликните на две вершины для создания ребра';
    } else if (newMode === 'delete') {
        deleteBtn.classList.add('active');
        statusDiv.innerHTML = 'Режим: <strong>Удаление</strong> | Кликните на вершину или ребро для удаления';
    }
    
    startVertexForEdge = null;
    selectedVertex = null;
    redraw();
}

// Получение координат мыши
function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

// Проверка попадания в вершину
function getVertexAtPosition(x, y) {
    for (let i = vertices.length - 1; i >= 0; i--) {
        const vertex = vertices[i];
        const dx = vertex.x - x;
        const dy = vertex.y - y;
        const distance2 = dx * dx + dy * dy;
        
        if (distance2 <= VERTEX_RADIUS*VERTEX_RADIUS) return { vertex, index: i };
    }
    return null;
}

// Проверка попадания в ребро
function getEdgeAtPosition(x, y) {
    for (let i = edges.length - 1; i >= 0; i--) {
        const edge = edges[i];
        const v1 = vertices[edge.v1];
        const v2 = vertices[edge.v2];
        
        // Проверка расстояния от точки до отрезка
        if (isPointNearLine(x, y, v1.x, v1.y, v2.x, v2.y)) return { edge, index: i };
    }
    return null;
}

// Проверка близости точки к линии
function isPointNearLine(px, py, x1, y1, x2, y2, tolerance = 8) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    if( param < 0 ) param = 0;
    if( param > 1 ) param = 1;
    let xx = x1 + param * C, yy = y1 + param * D;
    
    const dx = px - xx, dy = py - yy;
    return dx * dx + dy * dy < tolerance*tolerance;
}

// Обработка нажатия кнопки мыши
function handleMouseDown(event) {
    const pos = getMousePos(event);
    const vertexInfo = getVertexAtPosition(pos.x, pos.y);
    
    if (mode === 'addVertex') {
        if (event.button === 0) { // Левая кнопка
            // Добавление вершины
            const id = vertices.length;
            vertices.push({
                id: id,
                x: pos.x,
                y: pos.y,
                label: `V${id + 1}`
            });
            updateCounters();
            redraw();
        }
    } else if (mode === 'addEdge') {
        if (vertexInfo) {
            if (!startVertexForEdge) {
                // Выбор первой вершины
                startVertexForEdge = vertexInfo.index;
                selectedVertex = vertexInfo.index;
                statusDiv.innerHTML = 'Режим: <strong>Добавление рёбер</strong> | Выбрана вершина ' + vertexInfo.vertex.label + '. Выберите вторую вершину';
                redraw();
            } else {
                // Выбор второй вершины - создание ребра
                if (startVertexForEdge !== vertexInfo.index) {
                    // Проверяем, не существует ли уже такое ребро
                    const edgeExists = edges.some(edge => 
                        (edge.v1 === startVertexForEdge && edge.v2 === vertexInfo.index) ||
                        (edge.v1 === vertexInfo.index && edge.v2 === startVertexForEdge)
                    );
                    
                    if (!edgeExists) {
                        edges.push({
                            v1: startVertexForEdge,
                            v2: vertexInfo.index
                        });
                        updateCounters();
                    }
                }
                startVertexForEdge = null;
                selectedVertex = null;
                redraw();
            }
        }
    } else if (mode === 'delete') {
        if (vertexInfo) {
            // Удаление вершины и всех связанных рёбер
            vertices.splice(vertexInfo.index, 1);
            
            // Обновляем индексы вершин в рёбрах
            edges = edges.filter(edge => 
                edge.v1 !== vertexInfo.index && edge.v2 !== vertexInfo.index
            );
            
            // Корректируем индексы оставшихся вершин в рёбрах
            edges.forEach(edge => {
                if (edge.v1 > vertexInfo.index) edge.v1--;
                if (edge.v2 > vertexInfo.index) edge.v2--;
            });
            
            // Обновляем id вершин
            vertices.forEach((v, i) => v.id = i);
            
            updateCounters();
            redraw();
        } else {
            const edgeInfo = getEdgeAtPosition(pos.x, pos.y);
            if (edgeInfo) {
                // Удаление ребра
                edges.splice(edgeInfo.index, 1);
                updateCounters();
                redraw();
            }
        }
    }
    
    // Начало перетаскивания (в любом режиме)
    if (vertexInfo && event.button === 0) {
        draggingVertex = vertexInfo;
        selectedVertex = vertexInfo.index;
        redraw();
    }
}

// Обработка движения мыши
function handleMouseMove(event) {
    const pos = getMousePos(event);
    
    // Перетаскивание вершины
    if (draggingVertex) {
        draggingVertex.vertex.x = pos.x;
        draggingVertex.vertex.y = pos.y;
        redraw();
        return;
    }
    
    // Подсветка вершин при наведении
    const vertexInfo = getVertexAtPosition(pos.x, pos.y);
    if (vertexInfo) {
        canvas.style.cursor = 'pointer';
    } else if (mode === 'delete' && getEdgeAtPosition(pos.x, pos.y)) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'crosshair';
    }
    
    // Обновление информации о режиме добавления рёбер
    if (mode === 'addEdge' && startVertexForEdge !== null) {
        const vertex = vertices[startVertexForEdge];
        statusDiv.innerHTML = `Режим: <strong>Добавление рёбер</strong> | Выбрана вершина ${vertex.label}. Выберите вторую вершину (текущие координаты: ${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`;
    }
}

// Обработка отпускания кнопки мыши
function handleMouseUp() {
    draggingVertex = null;
}

// Обработка нажатия клавиш
function handleKeyDown(event) {
    if (event.key === 'Shift') {
        isShiftPressed = true;
        // Если нажат Shift, временно переключаемся в режим добавления рёбер
        if (mode !== 'addEdge') {
            statusDiv.innerHTML += ' (SHIFT нажат: можно выбрать две вершины для ребра)';
        }
    }
    
    // Ctrl+Z - отмена последнего действия
    if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
    }
    
    // Удаление клавишей Delete
    if (event.key === 'Delete') {
        if (selectedVertex !== null) {
            // Удаляем выбранную вершину
            vertices.splice(selectedVertex, 1);
            
            // Удаляем связанные рёбра
            edges = edges.filter(edge => 
                edge.v1 !== selectedVertex && edge.v2 !== selectedVertex
            );
            
            // Корректируем индексы
            edges.forEach(edge => {
                if (edge.v1 > selectedVertex) edge.v1--;
                if (edge.v2 > selectedVertex) edge.v2--;
            });
            
            vertices.forEach((v, i) => v.id = i);
            
            selectedVertex = null;
            updateCounters();
            redraw();
        }
    }
}

function handleKeyUp(event) {
    if (event.key === 'Shift') {
        isShiftPressed = false;
    }
}

// Отмена последнего действия (простая версия)
function undo() {
    if (vertices.length > 0) {
        vertices.pop();
        // Удаляем рёбра, связанные с удалённой вершиной
        const lastVertexId = vertices.length;
        edges = edges.filter(edge => edge.v1 !== lastVertexId && edge.v2 !== lastVertexId);
        updateCounters();
        redraw();
        statusDiv.innerHTML = 'Отменено добавление последней вершины';
    }
}

// Очистка всего
function clearAll() {
    if (confirm('Удалить все вершины и рёбра?')) {
        vertices = [];
        edges = [];
        selectedVertex = null;
        startVertexForEdge = null;
        updateCounters();
        redraw();
        statusDiv.innerHTML = 'Всё очищено';
    }
}

// Обновление счётчиков
function updateCounters() {
    vertexCountSpan.textContent = vertices.length;
    edgeCountSpan.textContent = edges.length;
}

// Рисование вершины
function drawVertex(vertex, isSelected = false, isDragging = false) {
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, VERTEX_RADIUS, 0, Math.PI * 2);
    
    // Выбор цвета в зависимости от состояния
    if (isDragging) {
        ctx.fillStyle = COLORS.VERTEX_DRAGGING;
    } else if (isSelected) {
        ctx.fillStyle = COLORS.VERTEX_SELECTED;
    } else {
        ctx.fillStyle = COLORS.VERTEX;
    }
    
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Текст метки
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vertex.label, vertex.x, vertex.y);
}

// Рисование ребра
function drawEdge(v1, v2, isHovered = false) {
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    
    ctx.strokeStyle = isHovered ? COLORS.EDGE_HOVER : COLORS.EDGE;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.stroke();
}

// Рисование всех элементов
function drawAll() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисование всех рёбер
    edges.forEach(edge => {
        const v1 = vertices[edge.v1];
        const v2 = vertices[edge.v2];
        if (v1 && v2) {
            drawEdge(v1, v2);
        }
    });
    
    // Рисование всех вершин
    vertices.forEach((vertex, index) => {
        const isSelected = index === selectedVertex;
        const isDragging = draggingVertex && draggingVertex.index === index;
        drawVertex(vertex, isSelected, isDragging);
    });
    
    // Рисование временного ребра (если выбран режим добавления и есть первая вершина)
    if (mode === 'addEdge' && startVertexForEdge !== null) {
        const currentMousePos = getMousePos({ clientX: 0, clientY: 0 }); // Текущая позиция мыши
        const startVertex = vertices[startVertexForEdge];
        drawEdge(startVertex, currentMousePos);
    }
}

// Перерисовка всего
function redraw() {
    drawAll();
}

// Запуск приложения
window.onload = init;
