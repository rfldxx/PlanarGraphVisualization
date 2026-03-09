/* какой-то графа
0 1
1 2
1 3
1 4
1 5
1 6
1 7
1 8
2 5
2 6
2 8
3 5
3 7
4 7
4 8
5 7
5 8
6 8
6 9
7 8
8 9
0 6
0 9
0 8
*/

/* это зрелещнее?
            0 1
            1 2
            1 3
            1 8
            2 5
            2 6
            2 8
            3 5
            3 7
            4 7
            4 8
            5 7
            1 4
            1 5
            1 6
            1 7
            5 8
            6 8
            6 9
            7 8
            8 9
            0 6
            0 9
            0 8
    
*/

let canvas = document.getElementById("canvas");
let ctx    = canvas  .getContext('2d');

// Размеры вершин
const VERTEX_RADIUS = 10;
const SQUARE_HALF_LENGHT = 5;
const  Qnode_HALF_HEIGHT = 7;

let dY = 50;

// Цвета
const COLORS = {
    VERTEX: '#4CAF50',
    VERTEX_HOVER: '#45a049',
    VERTEX_SELECTED: '#2196F3',
    VERTEX_DRAGGING: '#FF5722',
    EDGE: '#333',
    EDGE_HOVER: '#FF5722',
    TEXT: '#333',
    BACKGROUND: '#fff',
    PURPLE: '#8b00ff',
    RED: '#da2d2d',
    BLUE: '#2196F3',
    GREEN: '#45a049',
    ORANGE: '#FF5722',
    BROWN: '#804824',
    VIRTUAL_VERTEX_TO_MERGE: '#8b00ff'
};

function draw_segment(x1, y1, x2, y2, clr = COLORS.EDGE, ww = 2, drawed_ctx = ctx) {
    drawed_ctx.beginPath();
    drawed_ctx.moveTo(x1, y1);
    drawed_ctx.lineTo(x2, y2);
    drawed_ctx.strokeStyle = clr;
    drawed_ctx.lineWidth   = ww;
    drawed_ctx.stroke();
}

function draw_circle(x, y, r = VERTEX_RADIUS, clr = COLORS.VERTEX, bclr = '#333', ww = 2, drawed_ctx = ctx) {
    drawed_ctx.beginPath();
    drawed_ctx.arc(x, y, r, 0, Math.PI * 2);
    drawed_ctx.fillStyle = clr;
    drawed_ctx.fill();
    drawed_ctx.strokeStyle = bclr;
    drawed_ctx.lineWidth = ww;
    drawed_ctx.stroke();
}

function get_coords(i) {
    if( PQvertex_type[i] >= 0 ) return [PQdraw[i].x, PQdraw[i].y];

    // давай-те для Q-node всегда брать центр
    let x_centre = (PQdraw[i].x1 + PQdraw[i].x2)/2;
    return [x_centre, PQdraw[i].y];
}

// let color_virtual = -1;
function draw_vertex_label(i, drawed_ctx = ctx) {
    let [x, y] = get_coords(i); // = PQdraw[i].x, y = PQdraw[i].y;

    let extra_info = ' [' + i + ']';

    if( PQvertex_type[i] < 0 ) {  // Это Q-node
        let x1 = PQdraw[i].x1, x2 = PQdraw[i].x2, y1 = y-Qnode_HALF_HEIGHT, y2 = y+Qnode_HALF_HEIGHT;

        // заполняем область Q-node сплошным цветом
        drawed_ctx.fillStyle = 'white';
        drawed_ctx.fillRect(x1, y1, x2-x1, y2-y1);

        draw_earflaps(x1, x2, y1, y2, drawed_ctx);
        
        draw_circle(x, y, 3, COLORS.VERTEX, '#333', 2, drawed_ctx);
        drawed_ctx.fillStyle    = 'black';
        drawed_ctx.font         = 'bold 10px Arial';
        drawed_ctx.textAlign    = 'center';
        drawed_ctx.textBaseline = 'middle';
        drawed_ctx.fillText(extra_info, x + 10, y);
        return;
    }

    let real_vertex = PQvertex_type[i];
    if( PQvertex_type[i] >= N ) {  // Это виртуальная вершина
        real_vertex -= N;
        let x1 = x-SQUARE_HALF_LENGHT, x2 = x+SQUARE_HALF_LENGHT, y1 = y, y2 = y+2*SQUARE_HALF_LENGHT;
        drawed_ctx.fillStyle = (PQvertex_type[i]-N == COLLECTED_VERTEX) ? COLORS.VIRTUAL_VERTEX_TO_MERGE : 'white';
        drawed_ctx.fillRect(x1, y1, x2-x1, y2-y1);

        draw_earflaps(x1, x2, y1, y2, drawed_ctx, (PQvertex_type[i]-N == COLLECTED_VERTEX) ? COLORS.VIRTUAL_VERTEX_TO_MERGE : COLORS.BLUE);
        drawed_ctx.fillStyle    = 'black';
        y += 15 + SQUARE_HALF_LENGHT;
    } else {                      // Это P-node
        draw_circle(x, y, VERTEX_RADIUS, COLORS.VERTEX, '#333', 2, drawed_ctx);
        drawed_ctx.fillStyle    = 'black'; //'white';
    }
    
    // Текст метки
    // drawed_ctx.fillStyle    = 'white';
    drawed_ctx.font         = 'bold 10px Arial';
    drawed_ctx.textAlign    = 'center';
    drawed_ctx.textBaseline = 'middle';
    // console.log('print: ', real_vertex);
    drawed_ctx.fillText(REAL_VERTEX_NAME[real_vertex] + extra_info, x, y);
}

// эта функция - кандидат на удаление
function draw_edge(i, j, drawed_ctx = ctx) {
    if( PQprev[j] != i ) [i, j] = [j, i];
    
    // ребро i -> j
    let [px, py] = get_coords(i);
    let [ x,  y] = get_coords(j);

    if( PQvertex_type[i] < 0 ) px = x;  // Q-node

    draw_segment(px, py, x, y, COLORS.EDGE, 2, drawed_ctx);
}


function draw_triangle_on_segment(x1, y1, x2, y2, drawed_ctx = ctx, clr = COLORS.ORANGE) {
    let R  = 7;  // радиус описанной окружности треугольника (брр, но так проще стороны по-выражать)
    let da = 2*Math.PI/3;

    // направление ребра
    const angle = Math.atan2(y2-y1, x2-x1);
    let xc = (x2+x1)/2, yc = (y2+y1)/2;

    const vertices = [ 
        {x: xc + R * Math.cos(angle)     ,  y: yc + R * Math.sin(angle)     },
        {x: xc + R * Math.cos(angle + da),  y: yc + R * Math.sin(angle + da)},
        {x: xc + R * Math.cos(angle - da),  y: yc + R * Math.sin(angle - da)}
    ];

    drawed_ctx.save();
    drawed_ctx.strokeStyle = 'black';
    drawed_ctx.fillStyle   = COLORS.ORANGE;
    drawed_ctx.lineWidth   = 1;
    drawed_ctx.beginPath();
    drawed_ctx.moveTo(vertices[0].x, vertices[0].y);
    drawed_ctx.lineTo(vertices[1].x, vertices[1].y);
    drawed_ctx.lineTo(vertices[2].x, vertices[2].y);
    drawed_ctx.closePath();
    drawed_ctx.fill();
    drawed_ctx.stroke();
    drawed_ctx.restore();
}

let highlighted_up_edges_from;
function draw_edge_to(i, drawed_ctx = ctx, clr = COLORS.EDGE) {
    if( i == 0 ) return;
    let [px, py] = get_coords(PQprev[i]);
    let [ x,  y] = get_coords(i);

    if( PQvertex_type[PQprev[i]] < 0 ) px = x;  // Q-node

    let highlight = highlighted_up_edges_from.has(i);
    if( highlight ) clr = COLORS.ORANGE;

    draw_segment(px, py, x, y, clr, 2, drawed_ctx);

    if( highlight ) draw_triangle_on_segment(x, y, px, py, drawed_ctx);   
}

let cnt_rect = 0;
// на самом деле это чисто прямоугольник [x1, x2]*[y1, y2]. Просто решил дать такое эпичное название
function draw_earflaps(x1, x2, y1, y2, drawed_ctx = ctx, clr = COLORS.RED) {
    // if( x2-x1 < 10 ) { x1 -= 5; x2 += 5; }

    draw_segment(x1, y1, x1, y2, clr, 2, drawed_ctx);
    draw_segment(x1, y1, x2, y1, clr, 2, drawed_ctx);
    draw_segment(x2, y1, x2, y2, clr, 2, drawed_ctx);
    draw_segment(x1, y2, x2, y2, clr, 2, drawed_ctx);

    // Добавляем число в левый верхний угол
    // ctx.font = '14px Arial';                   // размер и шрифт
    // ctx.fillStyle = 'black';                    // цвет текста
    // ctx.textBaseline = 'top';                    // привязка к верхнему краю текста
    // ctx.fillText(`${cnt_rect}`, x1+5, y+5);                   // координаты: отступ 5px от левого и верхнего края прямоугольника
    cnt_rect++;
}

function draw_box(cur, drawed_ctx = ctx, clr = COLORS.PURPLE, msg = '', type_pos = 0) {
    let xx1 = PQdraw[cur].x1, xx2 = PQdraw[cur].x2, yy1 = PQdraw[cur].y, yy2 = yy1 + dY*PQdraw[cur].h;
    draw_earflaps(xx1, xx2, yy1 - VERTEX_RADIUS, yy2 + 30, drawed_ctx, clr);
    
    drawed_ctx.font         = '14px Arial';
    drawed_ctx.textAlign    = 'left';  // теперь x — левая граница
    drawed_ctx.textBaseline = (type_pos == 0 ) ? 'top' : 'bottom';  // отсчитываем от верхней границы текста
    drawed_ctx.fillStyle    =   clr ;
    drawed_ctx.fillText(msg, xx1, (type_pos == 0 ) ? yy2 + 30 + 5 : yy1 - VERTEX_RADIUS); // левый верхний угол
}

function draw_boxes(cur, drawed_ctx = ctx, clr = COLORS.PURPLE) {
    draw_box(cur, drawed_ctx, clr);
    for(let nxt of PQchilds[cur]) draw_boxes(nxt, drawed_ctx, clr);
}


// СОЗДАЁМ ДОПОЛНИТЕЛЬНЫЙ canvas НАД ПЕРВЫМ (для анимаций) -> ОТМЕНА он съезженный какой-то
// ================================================================================================



// НОВАЯ ГЛАВА
// ================================================================================================


// ================================================================================================
// [ ИСПОЛЬЗУЕМЫЕ "СТРУКТУРЫ" ]
// У НАС все вершина графа это числа от [0, N)


// 1. отдельно храним "реальный" граф - каждый узел в нём число от 0 до N-1
// (в нём вершины уже st-пронумерованны)
let N = 0;
let REAL_VERTEX_NAME  = [];
let REAL_GRAPH_CHILDS = [];

function restartREAL() {
    N = 0;
    REAL_VERTEX_NAME  = [];
    REAL_GRAPH_CHILDS = []
}

function newREALnode(name) {
    REAL_VERTEX_NAME .push(name);
    REAL_GRAPH_CHILDS.push([]);
    return REAL_VERTEX_NAME.length - 1;
}

// 2. отдельно храним PQ-tree - каждому узлу тоже соответствует какое-то число от 0 до |PQ_tree.size|-1
let PQvertex_type = [];
// vertex_type== -2  - пока свободная позиция (можно записать сюда новую вершину)
// vertex_type== -1  - Q-node
// vertex_type==  v  - P-node соответствующая шарниру вершины v (из "реального" графа)
// vertex_type== N+v - виртуальная вершина соответствующая вершине v (из "реального" графа)

// лол, давайте просто на каждом шаге создавать новую вершину
// let PQfree_pos    = [];

let PQchilds      = [];
let PQprev        = [];

let is_pertinent_node   = [];
let pertinent_tree_info = []; // {is_full, is_left_fulled}

let PQroot = 0;

let PQdraw        = [];  // {x, y, x1, x2, h, i1, i2} x,y - координаты узла, x1,x2 - координаты границ поддерева, i1,i2 - индексы граничных листьев поддерева
// ! вершина получает свою y координату при первом добавлении в PQtree

function restartPQ() {
    PQvertex_type       = [];
    PQchilds            = [];
    PQprev              = [];
    is_pertinent_node   = [];
    pertinent_tree_info = [];
    PQdraw              = [];
}

function newPQnode(type, prev, childs = []) {  // , childs??
    // if( PQfree_pos.length != 0 ) return PQfree_pos.pop();

    // надо создавать новую позицию в "массиве" хранящем PQ_tree
    PQvertex_type      .push(type);
    PQchilds           .push(childs);
    PQprev             .push(prev);
    is_pertinent_node  .push(0);
    pertinent_tree_info.push({is_full: 0, is_left_fulled: 0})
    PQdraw             .push({x: 10, y: (prev != -1 ? PQdraw[prev].y : 0) + dY, x1: canvas.width, x2: -1, h: 0, i1: -1, i2: -1});
    return PQvertex_type.length - 1;
}

// можно и забить на удаления, всё равно O(N)
// function del_PQ_node(i) { PQfree_pos.push(i); }
// 
// на это тоже забиваем, просто будем всегда push-ить
// function reinit_PQ(n) { }



// 3. СПИСОК ЛИСТЬЕВ: bottom_layer
let bottom_layer = [];


// ================================================================================================
// [ ЧТЕНИЕ ДАННЫХ ]

function st_Numbering(edges) {
    // ...
    // пока ничего
    return edges;
}


let EXPAND_ORDER_POS = 0;
let EXPAND_ORDER = [];

let is_input_data_readed = 0;
function tree_read() {
    is_input_data_readed = 1;
    highlighted_up_edges_from = new Map();

    restartREAL();
    restartPQ();

    const input = document.getElementById("tree_input").value.match(/\S+/g) || [];

    const str_to_indx = new Map();
    for(let i = 0; i+1 < input.length; i += 2) {
        let u = input[i], v = input[i+1];
        for(let cur of [u, v]) if( !str_to_indx.has(cur) ) str_to_indx.set(cur, newREALnode(cur));

        // ПОКА ПРЕДПОЛАГАЕМ ребро u -> v
        REAL_GRAPH_CHILDS[str_to_indx.get(u)].push(str_to_indx.get(v));
    }

    // ПОКА ПРЕДПОЛАГАЕМ ТАК
    // PQroot = str_to_indx.get(input[0]);

    N = REAL_VERTEX_NAME.length;
    EXPAND_ORDER = [];
    EXPAND_ORDER_POS = 0;
    for(let i = 0; i < N; i++) EXPAND_ORDER.push(i);

    console.log('REAL_VERTEX_NAME:  ', REAL_VERTEX_NAME );
    console.log('REAL_GRAPH_CHILDS: ', REAL_GRAPH_CHILDS);
    console.log('EXPAND_ORDER:      ', EXPAND_ORDER     );
}

// ================================================================================================
// [ ПРЕВРАЩАЕМ ВИРТУАЛЬНУЮ ВЕРШИНУ В РЕАЛЬНЫЙ УЗЕЛ ]
// МЕНЯЕТ bottom layer
// У НАС ДОЛЖНА БЫТЬ ТОЛЬКО ОДНА real_vertex (СЧИТАЕМ ЧТО МЫ ПЕРЕДЕЛАЛИ ВИРТУАЛЬНУЮ ВЕРШИНУ В real_vertex)
function expand(real_vertex) {
    // Ищем первое появление real_vertex и заменяем его
    // Первое появление превращается в P-node и к нему подкрепляются вируальные дети REAL_GRAPH_CHILDS[vertex]

    let first_mention = 0;
    while( PQvertex_type[bottom_layer[first_mention]] != real_vertex ) first_mention++;

    let pq_vertex = bottom_layer[first_mention];
    for(let chld of REAL_GRAPH_CHILDS[real_vertex]) {
        PQchilds[pq_vertex].push( newPQnode(N + chld, pq_vertex) );
    }
    
    let new_bottom_layer = bottom_layer.slice(0, first_mention);
    new_bottom_layer.push(...PQchilds[pq_vertex]);
    new_bottom_layer.push(...bottom_layer.slice(first_mention+1));
    bottom_layer = new_bottom_layer;

    console.log(' -> new bottom layer: ', bottom_layer);
}




// ================================================================================================
// [ ПОДСЧЁТ ВСЕХ КООРДИНАТ ]

let COLLECTED_VERTEX = 0;  // соответсвтуящая её виртуальная вершина: COLLECTED_VERTEX+N

let cnt_pertinent_leafs = 0;
let pos_one_of_pertinent_leafs = 0;  // <- нужно только для случая с одной виртуальной вершиной

let pertinent_vertex_order = [];
let pertinent_root = -1;

let SILLY_SHIFT_X  =  50;
let AvailableWidth = 700;
function recalc_coords(extra_calc = 0) {
    if( extra_calc ) {
        pertinent_vertex_order = [];
        pertinent_root         = -1;
    }

    let min_pertinent_i1 = PQvertex_type.length, max_pertinent_i2 = -1;
    
    if( extra_calc ) {
        pertinent_reducing_pos    = 0;
        highlighted_up_edges_from = new Map();
    }

    // 0. СБРАСЫВАЕМ ОГРАНИЧИВАЮЩИЕ ПРЯМОУГОЛЬНИКИ
    for(let i = 0; i < PQvertex_type.length; i++) {
        PQdraw[i].x1 = SILLY_SHIFT_X + AvailableWidth;
        PQdraw[i].x2 = -1;
        PQdraw[i].h  =  0;
        PQdraw[i].i1 = bottom_layer.length;
        PQdraw[i].i2 = -1;

        if( extra_calc ) {
            is_pertinent_node  [i] = 0;
            pertinent_tree_info[i].is_full        = 0;
            pertinent_tree_info[i].is_left_fulled = 0;
        }
    }

    // 1. ПОДСЧЁТ ДЛЯ ЛИСТЬЕВ
    //    ТУТ МОЖНО РАЗНЫМИ ВАРИАНТАМИ -> сделать бы это переключаемым
    //    СЕЙЧАС: вписываем прям в края (в данном варианте растановки есть частный случай когда только одна вершина)
    if( extra_calc ) cnt_pertinent_leafs = 0;
    let l = bottom_layer.length;
    let [shift, space] = (l == 1) ? [AvailableWidth/2, 0] : [0, AvailableWidth/(l-1)];
    for(let i = 0; i < l; i++) {
        let v = bottom_layer[i];
        PQdraw[v].x  = SILLY_SHIFT_X + shift + i*space;
        PQdraw[v].x1 = PQdraw[v].x - VERTEX_RADIUS;
        PQdraw[v].x2 = PQdraw[v].x + VERTEX_RADIUS;
        PQdraw[v].i1 = PQdraw[v].i2 = i;

        // pertinent виртуальная вершина
        if( extra_calc && PQvertex_type[v]-N == COLLECTED_VERTEX ) {
            pos_one_of_pertinent_leafs = i;
            cnt_pertinent_leafs++; 
            one_of_virtual_vertex_id = v;

            is_pertinent_node  [v] = 1;
            pertinent_tree_info[v].is_full        = 1;
            pertinent_tree_info[v].is_left_fulled = 1;
            
            min_pertinent_i1 = Math.min(min_pertinent_i1, i);
            max_pertinent_i2 = Math.max(max_pertinent_i2, i);
        }
    }

    // 2. ПОДЪЁМ ВВЕРХ
    //    ТОЖЕ ЕСТЬ ВАРИАНТЫ
    //  sum, cnt - параметры DP для подсчёта координат
    let sum = Array(PQvertex_type.length).fill(0), cnt = Array(PQvertex_type.length).fill(0);
    for(let v of bottom_layer) { sum[v] = PQdraw[v].x; cnt[v] = 1; }

    let calls = Array(PQvertex_type.length).fill(0);
    for(let curr_layer = bottom_layer, next_layer; curr_layer.length; curr_layer = next_layer) {
        next_layer = [];

        for(let v of curr_layer) {
            let p = PQprev[v];
            if( p == -1 ) continue;
            
            calls[p]++;
            sum  [p] += sum[v];
            cnt  [p] += cnt[v];
            PQdraw[p].x1 = Math.min(PQdraw[p].x1, PQdraw[v].x1);
            PQdraw[p].x2 = Math.max(PQdraw[p].x2, PQdraw[v].x2);
            PQdraw[p].h  = Math.max(PQdraw[p].h , PQdraw[v].h + 1);
            PQdraw[p].i1 = Math.min(PQdraw[p].i1, PQdraw[v].i1);
            PQdraw[p].i2 = Math.max(PQdraw[p].i2, PQdraw[v].i2);

            if(extra_calc) is_pertinent_node[p] = Math.max(is_pertinent_node[p], is_pertinent_node[v]);
            
            if( calls[p] != PQchilds[p].length ) continue; 
            
            // все дети вершины p обработанны -> ДОБАВЛЯЕМ В next_layer
            next_layer.push(p);

            if( extra_calc && is_pertinent_node[p] && pertinent_root == -1 ) {  // если pertinent_tree ещё не законченно
                pertinent_vertex_order.push(p);

                // проверка может мы дошли до корня?
                if( PQdraw[p].i1 <= min_pertinent_i1 && max_pertinent_i2 <= PQdraw[p].i2) {
                    pertinent_root = p;
                }
            }

            // А. ЦЕНТР МАСС ЛИСТЬЕВ
            PQdraw[p].x = sum[p] / cnt[p];

            // Б. СРЕДНЕЕ ОТ СВОИХ ДЕТЕЙ
            // PQdraw[p].x = 0;
            // for(let u of PQchilds[p]) PQdraw[p].x += PQdraw[u].x;
            // PQdraw[p].x /= PQchilds[p].length;
        }
    }

    // рисуем pertinent tree
    if( extra_calc ) {
        console.log('Порядок просмотра pertinent вершин: ', pertinent_vertex_order);
        
        console.log('КОРЕНЬ pertinent tree: ', pertinent_root);
        for(let prt of pertinent_vertex_order) draw_box(prt, ctx, COLORS.ORANGE);
        if( pertinent_root != -1 ) draw_box(pertinent_root, ctx, COLORS.ORANGE, 'pertinent дерево');
    }
}


// ================================================================================================
// [ ОТДЕЛЬНАЯ ФУНКЦИЯ КОТОРАЯ РЕККУРСИВНО РИСУЕТ ]

function draw_subtree(cur, excepted_branch = -1, draw_ctx = ctx) {
    if( cur == excepted_branch ) return;

    if(PQchilds[cur].length) console.log(cur, ' : ', PQchilds[cur], ' (childs)  [x1,x2]:', PQdraw[cur].x1, PQdraw[cur].x2);

    for(let nxt of PQchilds[cur]) {
        if( nxt == excepted_branch ) continue;  // ай, сам знаю кринж - два сравнения с excepted_branch, но чет неочев как делать из-за рисования ребра
        draw_edge_to(nxt, draw_ctx);
        draw_subtree(nxt, excepted_branch, draw_ctx);
    }

    draw_vertex_label(cur, draw_ctx);
}

function redraw_tree() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_subtree(EXPAND_ORDER[0]);
}

// function draw_box() {}
// function recurse_draw_boxes() {}

// ================================================================================================
// !!! ИДЕИ:
// [ МЕЖДУ РИСУНКАМИ сохраняем только холсты для анимаций ]

// "история" (для кнопки назад)
let curr_drawPages = 0;
let savePagesAnimes = [];
function push_back_to_history() {
    savePagesAnimes.push( offscreen_canvas );
    curr_drawPages += 1;  // <- а надо это тут? (в моём использование вроде надо)
}




// ОБЩИЙ ОВЕРХЭД ДЛЯ АНИМАЦИЙ
// ================================================================================================
// СТРОИМ ВИРТУАЛЬНЫЕ canvas-ы  <<<ДЛЯ АНИМАЦИИ>>> (общее для обоих анимаций)
// СДЕЛАТЬ БЫ AnimeTime завищищем от кол-ва участвующих в анимации вершин
let AnimeTime = 200;
let extra_canvas1, extra_canvas2, extra_canvas3, extra_canvas4;
let animation_parent_x, animation_parent_y;
let animation_edge_to = [];  // {x, y, is_highlighted} - запрос на ребро к этой вершине от animation_parent

let currentAnimationFrame = null;  // идентификатор текущего работающего requestAnimationFrame
let animation_start_time  = -1;

// ================================================================================================
// [ АНИМАЦИЯ ОТЗЕРКАЛИВАНИЯ ]
// push_back-ать в историю в этой же функции

// Меняем только координаты - это нужно, чтобы нарисовать на offScreen зеркальную копию (с нормальными словами!)
function recurse_mirroring(cur, x_centre) {
    PQdraw[cur].x = 2*x_centre - PQdraw[cur].x;

    // ай, всё таки ради Q-шечек надо и это менять
    let x1 = PQdraw[cur].x1, x2 = PQdraw[cur].x2;
    PQdraw[cur].x1 = 2*x_centre - x2;
    PQdraw[cur].x2 = 2*x_centre - x1;

    // зеркалим порядок детей (.... всё таки это вернулось)
    for(let i1 = 0, i2 = PQchilds[cur].length-1; i1 < i2; i1++, i2--)
        [PQchilds[cur][i1], PQchilds[cur][i2]] = [PQchilds[cur][i2], PQchilds[cur][i1]];
    
    // в принципе не важно в каком порядке эти циклы делать, но так "типо" хвостовая реккурсия будет наверное
    for(let nxt of PQchilds[cur]) recurse_mirroring(nxt, x_centre);
}

// ОТЗЕРКАЛИВАНИЕ
let animate_rotation_x_centre     = -1;
let animate_rotation_variant_sign = -1; // или +1 

let ALPHA = 4;


// ПРОБЛЕМА - тут зависим от координат рёбер - А ХОТИМ ТОЛЬКО ПО offScreen-ам делать
function animate_rotation_frame(currT) {
    if( animation_start_time == -1 ) animation_start_time = currT;

    // кароче всё на ctx просто рисуем, с topCtx как-то съезжают координаты
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let dT = currT - animation_start_time;
    if( dT > AnimeTime ) {
        currentAnimationFrame = null;

        // финальный кадр
        if( animation_edge_to.length ) {  // рисование ребра
            let {x, y, is_highlighted} = animation_edge_to[0];
            x = 2*animate_rotation_x_centre - x;  // отзеркаленный
            let px = (animation_parent_x == -1) ? x : animation_parent_x;
            draw_segment(px, animation_parent_y, x, y, (is_highlighted ? COLORS.ORANGE : COLORS.EDGE));
            if( is_highlighted ) {  // рисуем треугольник на ребре 
                draw_triangle_on_segment(x, y, px, animation_parent_y);
            }
        }
        ctx.drawImage(extra_canvas1, 0, 0);  // фон
        ctx.drawImage(extra_canvas3, 0, 0);  // отзеркаленное поддерево
        return;
    }

    // вторая половина / второй акт / другое эпичное название
    let c_r1 = (dT > AnimeTime/2) ? -1 + 4*Math.pow(1 - dT/AnimeTime, 2) : +1 - 4*Math.pow(dT/AnimeTime, 2);
    let c_r2 = Math.sqrt( (1 - c_r1*c_r1) / ALPHA );
    c_r2 *= animate_rotation_variant_sign;
    
    // рисование ребра
    if( animation_edge_to.length ) {
        let {x, y, is_highlighted} = animation_edge_to[0];
        let nx = c_r1 * x +    (1-c_r1)*animate_rotation_x_centre;
        let ny = c_r2 * x + y    -c_r2 *animate_rotation_x_centre;
        let px = (animation_parent_x == -1) ? nx : animation_parent_x;
        draw_segment(px, animation_parent_y, nx, ny, (is_highlighted ? COLORS.ORANGE : COLORS.EDGE));
        if( is_highlighted ) {  // рисуем треугольник на ребре 
            draw_triangle_on_segment(nx, ny, px, animation_parent_y);
        }
    }

    ctx.drawImage(extra_canvas1, 0, 0);  // фон
    
    
    // ВРАЩАЮЩЕЕСЯ ПОДДЕРЕВО
    let sourceCanvas = extra_canvas2;

    // для второго акта используем extra_canvas3
    if( c_r1 < 0 ) { c_r1 = - c_r1; c_r2 = -c_r2; sourceCanvas = extra_canvas3; }

    ctx.save();  // Сохраняем текущее состояние контекста
    ctx.setTransform(c_r1, c_r2, 0, 1, (1-c_r1)*animate_rotation_x_centre, -c_r2*animate_rotation_x_centre);  // Устанавливаем матрицу преобразования
    ctx.drawImage(sourceCanvas, 0, 0);  // <<<== вращающееся   поддерево
    ctx.restore(); // Восстанавливаем исходную матрицу (чтобы последующие рисунки не искажались)

    requestAnimationFrame(animate_rotation_frame);
}

// вращаем "PQtree"[i]
function animate_rotation(i) {
    animate_rotation_variant_sign = Math.random() >= 0.5 ? +1 : -1;

    if( i != 0 ) {
        // если parent - это Qnode, то все ребра вертикальное - будем кодировать  animation_parent_x == -1
        let parent = PQprev[i];

        console.log("TRY parent:", parent, " for vertex ", i);
        [animation_parent_x, animation_parent_y] = get_coords(parent);
        if(PQvertex_type[parent] < 0) animation_parent_x = -1
    
        // запрос на ребро
        let [xx, yy] = get_coords(i);
        animation_edge_to = [ {x: xx, y: yy, is_highlighted: highlighted_up_edges_from.has(i)} ];
    }
    

    extra_canvas1 = new OffscreenCanvas(canvas.width, canvas.height);  // фон
    extra_canvas2 = new OffscreenCanvas(canvas.width, canvas.height);  // вращающееся   поддерево
    extra_canvas3 = new OffscreenCanvas(canvas.width, canvas.height);  // отзеркаленное поддерево
    
    draw_subtree(0,  i, extra_canvas1.getContext('2d'));
    draw_subtree(i, -1, extra_canvas2.getContext('2d'));
    // рисуем коробки для вращающихся элементов [ для ЭПИЧНОСТИ))) ]
    draw_boxes(i, extra_canvas2.getContext('2d'), COLORS.RED);


    // зеркалим "картинку"
    animate_rotation_x_centre = (PQdraw[i].x1 + PQdraw[i].x2) / 2;
    recurse_mirroring(i, animate_rotation_x_centre);
    draw_subtree(i, -1, extra_canvas3.getContext('2d'));

    // рисуем коробки для вращающихся элементов [ для ЭПИЧНОСТИ))) ]
    draw_boxes(i, extra_canvas3.getContext('2d'), COLORS.RED);

    // зеркалим bottom_layer
    console.log("MIRRORING: [", PQdraw[i].i1, ' ', PQdraw[i].i2, ']')
    for(let i1 = PQdraw[i].i1, i2 = PQdraw[i].i2; i1 < i2; i1++, i2--) {
        [bottom_layer[i1], bottom_layer[i2]] = [bottom_layer[i2], bottom_layer[i1]];
    }
    
    // чё сама анимация?? неее
    if( currentAnimationFrame ) cancelAnimationFrame(currentAnimationFrame);
    animation_start_time  = -1;
    currentAnimationFrame = requestAnimationFrame(animate_rotation_frame);
}



// ================================================================================================
// [ АНИМАЦИЯ ПЕРЕМЕЩЕНИЯ ]

let animate_permutation_blck_dx;
let animate_permutation_vrtx_dx;

// а зачем?? по идеи всё равно можно это не использовать - на следующем шаге будет другое
// а хотя мы пересчитываем координаты только при доюавлении вершины, так-что это нужно если будут несколько раз подряд всякие изменения делаться
// блен ещё порядок в bottom_layer надо менять.... <------- !!! ВАЖНО !!!
function recurse_shift(cur, dx, dy = 0) {
    PQdraw[cur].x  += dx;
    PQdraw[cur].x1 += dx;
    PQdraw[cur].x2 += dx;
    PQdraw[cur].y  += dy;
    for(let nxt of PQchilds[cur]) recurse_shift(nxt, dx, dy);
}


// ПРОБЛЕМА - тут зависим от координат рёбер - А ХОТИМ ТОЛЬКО ПО offScreen-ам делать
function animate_permutation_frame(currT) {
    if( animation_start_time == -1 ) animation_start_time = currT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    let dT = currT - animation_start_time;
    if( dT > AnimeTime ) {
        currentAnimationFrame = null;

        // ФИНАЛЬНЫЙ КАДР
        // рисование ребер к блоку
        for(let i = 1; i < animation_edge_to.length; i++) {
            let {x, y, is_highlighted} = animation_edge_to[i];
            x += animate_permutation_blck_dx;  // сдвинутый
            let px = (animation_parent_x == -1) ? x : animation_parent_x;
            draw_segment(px, animation_parent_y, x, y, (is_highlighted ? COLORS.ORANGE : COLORS.EDGE));
            if( is_highlighted ) {  // рисуем треугольник на ребре 
                draw_triangle_on_segment(x, y, px, animation_parent_y);
            }
        }
        {   // рисование ребра к поддереву
            let {x, y, is_highlighted} = animation_edge_to[0];
            x += -animate_permutation_vrtx_dx;  // сдвинутый
            let px = (animation_parent_x == -1) ? x : animation_parent_x;
            draw_segment(px, animation_parent_y, x, y, (is_highlighted ? COLORS.ORANGE : COLORS.EDGE));
            if( is_highlighted ) {  // рисуем треугольник на ребре 
                draw_triangle_on_segment(x, y, px, animation_parent_y);
            }
        }

        ctx.drawImage(extra_canvas1, 0, 0);  // фон
        ctx.drawImage(extra_canvas2, -animate_permutation_vrtx_dx, 0);  // перемещаемое  поддерво
        ctx.drawImage(extra_canvas3,  animate_permutation_blck_dx, 0);  // передвигаемый блок
        return;
    }


    // БЛОК
    let curr_blck_dx = animate_permutation_blck_dx * dT/AnimeTime;
    
    // рисование ребер к блоку
    for(let i = 1; i < animation_edge_to.length; i++) {
        let {x, y, is_highlighted} = animation_edge_to[i];
        x += curr_blck_dx;  // сдвинутый
        // лол, было-бы странно если бы parent был Q-node (ведь мы тут переставляем вершины!)
        let px = (animation_parent_x == -1) ? x : animation_parent_x;
        draw_segment(px, animation_parent_y, x, y, (is_highlighted ? COLORS.ORANGE : COLORS.EDGE));
        if( is_highlighted ) {  // рисуем треугольник на ребре 
            draw_triangle_on_segment(x, y, px, animation_parent_y);
        }
    }
    

    // рисование ФОНА
    ctx.drawImage(extra_canvas1, 0, 0);

    // рисование БЛОКА
    ctx.drawImage(extra_canvas3, curr_blck_dx, 0);


    // рисование РАССМАТРИВАЕМОго ПОДДЕРЕВа (типо над всем остальным)
    // движется с постоянной скоростью
    
    let descent = 50;  // на сколько РАССМАТРИВАЕМОЕ поддерево отпускается вниз

    let total_dist = 2*descent + Math.abs(animate_permutation_vrtx_dx);

    let sbtr_shift_x = 0, sbtr_shift_y = 0;
    // три шага в движении
    // 1 АКТ (спуск  на descent)
    if( dT/AnimeTime < descent/total_dist ) {
        sbtr_shift_y = total_dist * dT/AnimeTime;
    }
    // 3 АКТ (подъём на descent)
    else if( (AnimeTime-dT)/AnimeTime < descent/total_dist ) {
        sbtr_shift_x = -animate_permutation_vrtx_dx;
        sbtr_shift_y = total_dist * (AnimeTime-dT)/AnimeTime;
    }
    // 2 АКТ (перемещение на -animate_permutation_vrtx_dx)
    else {
        let t_for_phase1 = AnimeTime * descent/total_dist 
        sbtr_shift_x = -animate_permutation_vrtx_dx * (dT - t_for_phase1)/(AnimeTime - 2*t_for_phase1);
        sbtr_shift_y = descent;
    }

    {   // рисование ребра к поддереву
        let {x, y, is_highlighted} = animation_edge_to[0];
        x += sbtr_shift_x;  // сдвинутый
        let px = (animation_parent_x == -1) ? x : animation_parent_x;
        draw_segment(px, animation_parent_y, x, y + sbtr_shift_y, (is_highlighted ? COLORS.ORANGE : COLORS.EDGE));
        if( is_highlighted ) {  // рисуем треугольник на ребре 
            draw_triangle_on_segment(x, y + sbtr_shift_y, px, animation_parent_y);
        }
    }
    
    // draw_vertex_label(parent);  // <- НАДО ПОФИКСИТЬ (УБРАТЬ ИСПОЛЬЗОВАНИЕ) -> перенесём на extra_canvas4
    ctx.drawImage(extra_canvas4, 0, 0);

    // рисование поддерева
    ctx.drawImage(extra_canvas2, sbtr_shift_x, sbtr_shift_y);
    
    requestAnimationFrame(animate_permutation_frame);
}

// меняет местами фрагменты массива: [i1 : i2] и [j1 : j2]
// !!! ПРЕДПОЛАГАЕТСЯ, что эти фрагменты идут подряд !!!
function array_rearange(a, i1, i2, j1, j2) {
    if( i1 > j1 ) return array_rearange(a, j1, j2, i1, i2);

    // порядок: [i1 : i2] [j1 == i2+1 : j2]
    let left_part = a.slice(i1, i2+1);
    let i = i1;
    for(let j = j1; j <= j2; j++) a[i++] = a[j];
    for(let e of left_part)       a[i++] = e; 
}

// конечно бы лучше как array_rearange(a, i1, i2, j1, j2) сделать
// но дедлайн вообще близко - лучше не думать лишний раз...
function up_layer_fix_i1i2(layer, cur_pos_in_childs, blck_lft_pos, blck_rht_pos) {
    let a = PQdraw[layer[cur_pos_in_childs]].i1, b = PQdraw[layer[cur_pos_in_childs]].i2;

    let cur_pos_len = PQdraw[layer[cur_pos_in_childs]].i2 - PQdraw[layer[cur_pos_in_childs]].i1 + 1;

    console.log("LAYER FIX!!!!! args: ", cur_pos_in_childs, ' ', blck_lft_pos, ' ', blck_rht_pos);

    if( cur_pos_in_childs < blck_lft_pos ) {
        for(let i = blck_lft_pos; i <= blck_rht_pos; i++) {
            console.log(`      ${layer[i]} : [${PQdraw[layer[i]].i1}, ${PQdraw[layer[i]].i2}]  -> [${PQdraw[layer[i]].i1-cur_pos_len}, ${PQdraw[layer[i]].i2-cur_pos_len}]`)
            PQdraw[layer[i]].i1 -= cur_pos_len;
            PQdraw[layer[i]].i2 -= cur_pos_len;
        }
        PQdraw[layer[cur_pos_in_childs]].i1 = PQdraw[layer[blck_rht_pos]].i2 + 1;
    } else if( blck_rht_pos < cur_pos_in_childs  ) {
        PQdraw[layer[cur_pos_in_childs]].i1 = PQdraw[layer[blck_lft_pos]].i1;
        for(let i = blck_lft_pos; i <= blck_rht_pos; i++) {
            console.log(`      ${layer[i]} : [${PQdraw[layer[i]].i1}, ${PQdraw[layer[i]].i2}]  -> [${PQdraw[layer[i]].i1+cur_pos_len}, ${PQdraw[layer[i]].i2+cur_pos_len}]`)
            
            PQdraw[layer[i]].i1 += cur_pos_len;
            PQdraw[layer[i]].i2 += cur_pos_len;
        }
    }
    
    PQdraw[layer[cur_pos_in_childs]].i2 = PQdraw[layer[cur_pos_in_childs]].i1 + cur_pos_len - 1;
    console.log(`      ${layer[cur_pos_in_childs]} : [${a}, ${b}] -> [${PQdraw[layer[cur_pos_in_childs]].i1}, ${PQdraw[layer[cur_pos_in_childs]].i2}]`);
    console.log("END FIX!!!!!");
}

// переставляем "PQtree"[i] в позицию new_pos_in_childs своего предка
function animate_permutation(i, new_pos_in_childs) {
    let parent = PQprev[i];
    let layer  = PQchilds[parent];

    // если parent - это Qnode, то все ребра вертикальное - будем кодировать  animation_parent_x == -1
    [animation_parent_x, animation_parent_y] = get_coords(parent);
    if(PQvertex_type[parent] < 0) animation_parent_x = -1;


    console.log('=========================================');
    console.log('[ animate_permutation ]');
    console.log('parent: ', parent, ' all chulds: ', layer);

    let cur_pos_in_childs = 0;
    while( layer[cur_pos_in_childs] != i ) {
        cur_pos_in_childs++;
    }

    
    console.log('PERMUTATION: ', cur_pos_in_childs , ' -> ', new_pos_in_childs);

    // НЕ МЕНЯЮЩИЙСЯ ФОН
    extra_canvas1 = new OffscreenCanvas(canvas.width, canvas.height);  // фон
    draw_subtree(0, parent, extra_canvas1.getContext('2d'));
    if( parent != 0 ) {
        draw_edge_to     (       parent , extra_canvas1.getContext('2d'));
        draw_vertex_label(PQprev[parent], extra_canvas1.getContext('2d'));
    }
    let lft_pos = Math.min(cur_pos_in_childs, new_pos_in_childs), rht_pos = Math.max(cur_pos_in_childs, new_pos_in_childs);
    for(let j = 0; j < layer.length; j++) {
        if( j == lft_pos ) j = rht_pos + 1;
        if( j >=  layer.length ) break;

        draw_edge_to(layer[j],     extra_canvas1.getContext('2d'));
        draw_subtree(layer[j], -1, extra_canvas1.getContext('2d'));
    }
    draw_vertex_label(parent, extra_canvas1.getContext('2d'));
    
    

    // САМО ПЕРЕДВИГАЕМОЕ ПОДДЕРЕВО
    extra_canvas2 = new OffscreenCanvas(canvas.width, canvas.height);
    draw_subtree(i, -1, extra_canvas2.getContext('2d'));
    {   // запрос на ребро (к передвигаемой вершине)
        let [xx, yy] = get_coords(i);
        animation_edge_to = [ {x: xx, y: yy, is_highlighted: highlighted_up_edges_from.has(i)} ];
    }
    // чтобы ребро к передвигаемому поддереву не загораживало parent (можно было лучше... но так быстрее)
    extra_canvas4 = new OffscreenCanvas(canvas.width, canvas.height);
    draw_vertex_label(parent, extra_canvas4.getContext('2d'));  


    // ПЕРЕДВИГАЕМЫЙ БЛОК
    extra_canvas3 = new OffscreenCanvas(canvas.width, canvas.height);
    // индексы блока
    let blck_lft_pos = lft_pos, blck_rht_pos = rht_pos;
    (layer[blck_lft_pos] == i)  ?  blck_lft_pos++  :  blck_rht_pos--;
    
    for(let j = blck_lft_pos; j <= blck_rht_pos; j++) {
        draw_subtree(layer[j], -1, extra_canvas3.getContext('2d'));
        // запрос на ребро
        let [xx, yy] = get_coords(layer[j]);
        animation_edge_to.push( {x: xx, y: yy, is_highlighted: highlighted_up_edges_from.has(layer[j])} );
    }
    // рисуем коробки для анимированных элементов [ для ЭПИЧНОСТИ))) ]
    // СДЕЛАТЬ ТУТ РАЗНЫЕ ЦВЕТА У КОРОБОК
    for(let j = blck_lft_pos; j <= blck_rht_pos; j++) {
        draw_boxes(layer[j], extra_canvas3.getContext('2d'), COLORS.BLUE);
    }
    draw_boxes(i, extra_canvas2.getContext('2d'), COLORS.RED);

    

    // ПРИМЕНЯЕМ ИЗМЕНЕНИЯ ДЛЯ КООРДИНАТ
    let xx1 = PQdraw[i].x1, xx2 = PQdraw[i].x2;
    let bx1 = PQdraw[layer[blck_lft_pos]].x1, bx2 = PQdraw[layer[blck_rht_pos]].x2;
    
    let shift_block_dx = xx1 - bx1;
    let shift_vertx_dx = xx2 - bx2;
    if( cur_pos_in_childs > new_pos_in_childs ) [shift_block_dx, shift_vertx_dx] = [shift_vertx_dx, shift_block_dx];
    
    animate_permutation_blck_dx = shift_block_dx;
    animate_permutation_vrtx_dx = shift_vertx_dx;

    for(let j = blck_lft_pos; j <= blck_rht_pos; j++) recurse_shift(layer[j], shift_block_dx);
    recurse_shift(i, -shift_vertx_dx); // сдвинули "перетаскиваемое" поддерево

    

    // МЕНЯЕМ ПОРЯДОК  bottom_layer!
    console.log('BEFORE CHANGE:\n    bottom_layer:', bottom_layer);

    let bi1 = PQdraw[layer[cur_pos_in_childs]].i1, bi2 = PQdraw[layer[cur_pos_in_childs]].i2;
    let bj1 = PQdraw[layer[blck_lft_pos]     ].i1, bj2 = PQdraw[layer[blck_rht_pos]     ].i2;
    // !!! ПОДДЕРЖИВАЕМ .i1 .i2 только для "верхних" детей 
    up_layer_fix_i1i2(layer, cur_pos_in_childs, blck_lft_pos, blck_rht_pos);

    console.log(`bottom_layer:  [${bi1} : ${bi2}]  <->  [${bj1} : ${bj2}]`)
    
    array_rearange(bottom_layer, bi1, bi2, bj1, bj2);

    // ПЕРЕСТАНОВКА ДЕТЕЙ (.... всё таки это вернулось)
    array_rearange(layer, cur_pos_in_childs, cur_pos_in_childs, blck_lft_pos, blck_rht_pos);

    console.log('AFTER  CHANGE:\n    bottom_layer:', bottom_layer);


    // // чё сама анимация?? неее
    if( currentAnimationFrame ) cancelAnimationFrame(currentAnimationFrame);
    animation_start_time  = -1;
    currentAnimationFrame = requestAnimationFrame(animate_permutation_frame);
}




// ================================================================================================
// как сделать все вершины подряд???


// самое важное получаем порядок - в котором рассматриваем вершины
// function build_pertinent_tree() {

// }


let pertinent_reducing_pos = -1;


// первое "половинное" или полное в рассматриваемом pertinent поддереве
let lft_first_pertinent_child = 0, rht_first_pertinent_child = 0;


// ?!! У нас обязательно потомки должны быть LEFT_FULLED !!!  -  можно через поддержание этого сделать
// ДЛЯ СОЗДАНИЯ АИМАЦИИ
function reducing_step() {
    let curr_vertex = pertinent_vertex_order[pertinent_reducing_pos++];
    console.log('РАССМАТРИВАЕМ [', curr_vertex, '] (для cоздания анимации)');
    
    let is_full = 1;
    let pertinent_childs = [];  // хранятся именно номера "PQtree[i]"

    // выделяем (highlighting) нужные рёбра
    for(let nxt of PQchilds[curr_vertex]) {
        //   pertinent виртуальная вершина
        if( is_pertinent_node[nxt] ) {
            pertinent_childs.push(nxt);
            highlighted_up_edges_from.set(nxt, 1);
            
            if( !pertinent_tree_info[nxt].is_full ) is_full = 0;
        } else {
            is_full = 0;
            is_occured_blank_childs = 1;
        }
    }


    redraw_tree();
    draw_box(curr_vertex, ctx, COLORS.PURPLE, 'рассматриваемое pertinent поддерево');


    // ЕСЛИ НАШЕ ДЕРЕВО ПОЛНОЕ  =>  ТО НИЧЕГО ДЕЛАТЬ НЕ НАДО!
    if( is_full ) {
        pertinent_tree_info[curr_vertex].is_full        = 1;
        pertinent_tree_info[curr_vertex].is_left_fulled = 1;

        lft_first_pertinent_child = 0;
        rht_first_pertinent_child = PQchilds[curr_vertex].length-1;

        return;
    }

    pertinent_tree_info[curr_vertex].is_full = 0;

    // ЭКСТРЕМАЛЬНЫЕ СЛУЧАИ ПОДДЕРЕВЬЕВ
    //  1. есть > 2 детей, которые только  only_lefted_fulled
    //  2. есть pertinent поддерево, которое не lefted_fulled
    let only_lefted_fulled_i1 = -1, only_lefted_fulled_i2 = -1;  // позиции в масиве PQchilds[curr_vertex]
    let is_exist_isolated = 0, is_more_than_2_lefted_fulled = 0;
    lft_first_pertinent_child = PQchilds[curr_vertex].length;
    rht_first_pertinent_child = 0;
    {   // айй, спамим код
        for(let i in PQchilds[curr_vertex]) {
            let nxt = PQchilds[curr_vertex][i];
            if( !is_pertinent_node[nxt] ) continue;
            lft_first_pertinent_child = Math.min(lft_first_pertinent_child, i);
            rht_first_pertinent_child = Math.max(rht_first_pertinent_child, i);
            
            if( !pertinent_tree_info[nxt].is_left_fulled ) {  // изолированная вершина
                is_exist_isolated = 1;
                draw_box(nxt, ctx, COLORS.RED, '"изолировано"', 1);
                continue;  // <- возможно "коварный" continue - не знаю оставить или убрать
            }

            if( !pertinent_tree_info[nxt].is_full ) {  // only_lefted_fulled
                     if( only_lefted_fulled_i1 == -1 ) only_lefted_fulled_i1 = i;
                else if( only_lefted_fulled_i2 == -1 ) only_lefted_fulled_i2 = i;
                else {  // > 2 детей, которые только  only_lefted_fulled
                    is_more_than_2_lefted_fulled = i;
                    draw_box(nxt, ctx, COLORS.BROWN, '"частично заполнено"', 1);
                }
            }
        }   
    }
    if( is_exist_isolated ) {  // ГРАФ НЕ ПЛАНАРНЫЙ!
        alert('ГРАФ НЕ ПЛАНАРНЫЙ!\n[ОШИБКА:] Не допустим потомок в виде изолированного pertinent-поддерева!');
    }
    if( is_more_than_2_lefted_fulled ) {  // ГРАФ НЕ ПЛАНАРНЫЙ!
        alert('ГРАФ НЕ ПЛАНАРНЫЙ!\n[ОШИБКА:] Должно быть не более двух частично заполненых потомков!');
    }


    // ИДЕИ (впрочем очевидные):
    //      * всплытие уведомлений если в вершине оказалась проблема (с описанием) 
    //      * если в самом конце всё хорошо - то тоже уведомить (вот бы туда хлопающих людей из евангелиона)
    //      * рисовать корбки для разных поддеревьев (в зависимости от: is_full - зелённая, is_left_fulled - серая, иначе - красная/оранжевая/фиолетовая)
    // 
    //      * подниматься по pertinent tree сразу к следующему маесту пересечения "цепей"


    // РАЗНЫЕ ДЕЙСТВИЯ В ЗАВИСИМОСТИ ОТ ТОГО КАКОГО ТИПА ВЕРШИНА (Q-node или P-node)
    if( PQvertex_type[curr_vertex] < 0 ) {  // Q-node
        let is_all_pertinent_subtree_consistent = 1;
        let is_partial_subtree_on_borders = 1;
        {   // проверка что все pertinent_subtree идут подряд
            let start = 0;
            while( !is_pertinent_node[PQchilds[curr_vertex][start]] ) start++;
            let end   = start+1, l = PQchilds[curr_vertex].length;
            while( end < l && is_pertinent_node[PQchilds[curr_vertex][end]] ) end++;
            
            let cnt = end - start;

            // проверка что все pertinent_subtree идут подряд
            if( cnt != pertinent_childs.length ) {
                is_all_pertinent_subtree_consistent = 0;;
                draw_box(pertinent_childs[cnt], ctx, COLORS.BROWN, '"не подряд"', 1);
            }

            // проверка что частично заполненные поддеревья находятся только на краях
            if( only_lefted_fulled_i1 != -1 ) {
                let i = only_lefted_fulled_i1;
                if( i != start && i != end-1 ) {
                    is_partial_subtree_on_borders = 0;
                    draw_box(PQchilds[curr_vertex][i], ctx, COLORS.BROWN, '"не на краю"', 1);
                }
            }
            if( only_lefted_fulled_i2 != -1 ) {
                let i = only_lefted_fulled_i2;
                if( i != start && i != end-1 ) {
                    is_partial_subtree_on_borders = 0;
                    draw_box(PQchilds[curr_vertex][i], ctx, COLORS.BROWN, '"не на краю"', 1);
                }
            }
        }
        // is_all_pertinent_subtree_consistent = 0;
        if( !is_all_pertinent_subtree_consistent ) {  // ГРАФ НЕ ПЛАНАРНЫЙ!
            alert('ГРАФ НЕ ПЛАНАРНЫЙ!\n[ОШИБКА:] [требование Q-node:] все поддеревья, содержащие pertinent-вершины, должны идти подряд!');
        }
        // is_partial_subtree_on_borders = 0;
        if( !is_partial_subtree_on_borders ) {  // ГРАФ НЕ ПЛАНАРНЫЙ!
            alert('ГРАФ НЕ ПЛАНАРНЫЙ!\n[ОШИБКА:] [требование Q-node:] частично заполненные поддервья должны располагаться только на краях последовательного промежутка pertinent-детей!');
        }
        

        // в Q-node особо ничего не можем сделать
        pertinent_tree_info[curr_vertex].is_left_fulled = 0;  // начинаем с этого как по умолчанию (по идеи уже до этого так можно закомиттить эту сторку)

        if( only_lefted_fulled_i2 != -1 ) {  // два частичных ребёнка -> это дерево будет частинчым в любом случае
            booked_order_reducing_move.push( [0, PQchilds[curr_vertex][only_lefted_fulled_i1]] );
            return;
        }
        
        // Есть пустые поддеревья - делаем, чтобы они были с правого края
        // с каких краёв есть пустые поддеревья
        let  is_left_blanked = (pertinent_childs[0] != PQchilds[curr_vertex][0]);
        let is_right_blanked = (pertinent_childs[pertinent_childs.length-1] != PQchilds[curr_vertex][PQchilds[curr_vertex].length-1]);

        let pos_i1_in_fragment = -1;
        // -1 - нет only_lefted_fulled_i1
        //  1 - является  концом фрагмента
        //  0 - является началом фрагмента и при этом не является концом
        if( only_lefted_fulled_i1 != -1 ) pos_i1_in_fragment = ( PQchilds[curr_vertex][only_lefted_fulled_i1] == pertinent_childs[pertinent_childs.length-1] );
        
        // рил, гениально, это же обязательно всегда надо сделать
        if( pos_i1_in_fragment == 0 ) booked_order_reducing_move.push( [0, PQchilds[curr_vertex][only_lefted_fulled_i1]] ); 
        
        // ничего для будующего не сделаешь - curr_vertex в любом случае будет частичным\
        if( is_left_blanked && is_right_blanked ) return;
        
        // давайте простое заифаем лол (че я столько думал на этим)

        // случаи когда curr_vertex в любом случае получается частичным\
        if( (pos_i1_in_fragment == 1) &&  is_left_blanked && pertinent_childs.length >  1 ) return;
        if( (pos_i1_in_fragment == 1) &&  is_left_blanked && pertinent_childs.length == 1 ) booked_order_reducing_move.push( [0, PQchilds[curr_vertex][only_lefted_fulled_i1]] );

        if( (pos_i1_in_fragment == 0) && is_right_blanked ) return;

        pertinent_tree_info[curr_vertex].is_left_fulled = 1;

        if( is_left_blanked || (pos_i1_in_fragment == 0) ) booked_order_reducing_move.push( [0, curr_vertex] ); 
        return;
    }



    // * упростить поведение в pertinent_root (А надо? как будто тогда будут "загадочно" выглядить действия)
    if( curr_vertex == pertinent_root && pertinent_childs.length == 1 ) {
        
        console.log("  [ранний выход: вершина корень]: только один ребёнок")    
        return;  // ну это точно надо
    }


    // * неделать лишние действия

    // это P-node
    let pos_to_place_in_childs = 0;
    lft_first_pertinent_child  = 0;
    rht_first_pertinent_child  = pertinent_childs.length-1;

    if( only_lefted_fulled_i2 != -1 ) {
        [only_lefted_fulled_i1, only_lefted_fulled_i2] = [only_lefted_fulled_i2, only_lefted_fulled_i1];

        pertinent_tree_info[curr_vertex].is_left_fulled = 0;        
        booked_order_reducing_move.push( [1, PQchilds[curr_vertex][only_lefted_fulled_i2], pos_to_place_in_childs] ); 
        booked_order_reducing_move.push( [0, PQchilds[curr_vertex][only_lefted_fulled_i2]] ); 
        pos_to_place_in_childs++;
    } else {
        pertinent_tree_info[curr_vertex].is_left_fulled = 1;
    }

    for(let e of pertinent_childs) {
        if( e == PQchilds[curr_vertex][only_lefted_fulled_i1] || e == PQchilds[curr_vertex][only_lefted_fulled_i2] ) continue;
        booked_order_reducing_move.push( [1, e, pos_to_place_in_childs] );
        pos_to_place_in_childs++;
    }

    if( only_lefted_fulled_i1 != -1 ) {
        booked_order_reducing_move.push( [1, PQchilds[curr_vertex][only_lefted_fulled_i1], pos_to_place_in_childs] );
        pos_to_place_in_childs++;
    }

}




// ================================================================================================
// чет не круто дебажить функцию, придется логику разделять

let pos_in_booked = 0;
let booked_order_reducing_move = [];  // [type, args..] - тупо в виде массива

let vertex_to_bind_reduce = -1;


// let pertinent_vertex_order = [];
// let pertinent_root = -1;

let button_condition = 0;
function button_press() {
    console.log('\n------------ [ BUTTON PRESS ] ------------');

    if( !is_input_data_readed ) {
        console.log('НЕТ ДАННЫХ');
        console.log('  => читаем tree_read()');
        tree_read();
        
        // ИНИЦИАЛИЗАЦИЯ PQ-дерева
        newPQnode(EXPAND_ORDER[0], -1);
        bottom_layer = [ EXPAND_ORDER[0] ];
        
        
        recalc_coords();
        redraw_tree();

        button_condition = 0;
        return;
    }

    if( button_condition == 0 ) {  // РАСПИСЫВАЕМ ДЕТЕЙ ВИРТУАЛЬНОЙ ВЕРШИНЫ
        if( EXPAND_ORDER_POS  >= N ) return;
        COLLECTED_VERTEX = EXPAND_ORDER[EXPAND_ORDER_POS++];

        console.log('РАСПИСЫВАЕМ ДЕТЕЙ "виртуальной" ВЕРШИНЫ [', COLLECTED_VERTEX, ']');
        expand(COLLECTED_VERTEX);

        COLLECTED_VERTEX = EXPAND_ORDER[EXPAND_ORDER_POS];

        recalc_coords(1);
        redraw_tree();

        button_condition = 1;
        return;
    }


    // НАЧИЛИ собирать в новом pretinent tree
    if( button_condition == 1 ) {  // обработка следующей вершины из очереди pertinent subtrees
        vertex_to_bind_reduce = pertinent_vertex_order[pertinent_reducing_pos];
        console.log('ПРИСТУПАЕМ К ПОДДЕРЕВУ НА ВЕРШИНЕ [', vertex_to_bind_reduce, ']');
        pos_in_booked              =  0;
        booked_order_reducing_move = [];
        reducing_step();
        button_condition = 2;
        return;
    }


    // АНИМАЦИИ сборки (вращения / перестановки)
    if( button_condition == 2 && pos_in_booked >= booked_order_reducing_move.length ) {
        console.log('АНИМАЦИИ ДЛЯ ПОДДЕРЕВА НА ВЕРШИНЕ [', vertex_to_bind_reduce,'] ЗАКОНЧИЛИСЬ');
        button_condition = 3;
    }
    if( button_condition == 2 ) {  // анимации вершины
        console.log("BOOKED: ", booked_order_reducing_move);

        let type   = booked_order_reducing_move[pos_in_booked][0];
        let vertex = booked_order_reducing_move[pos_in_booked][1];
        
        //  type == 0  -  значит разворот
        if( type == 0 ) animate_rotation(vertex);
        else {
            let new_pos = booked_order_reducing_move[pos_in_booked][2];
            
            // иначе не надо переставлять!
            let pos_in_childs = 0, parent = PQprev[vertex];
            while( PQchilds[parent][pos_in_childs] != vertex ) pos_in_childs++;
            if( pos_in_childs == new_pos ) {
                // АХАХАХАХАХХААХХАХА ВАПХПААХПАХПХ
                pos_in_booked++;
                console.log('АДСКИЙ АД');
                button_press();  // <- ПОМОЕМУ ЭТО АД АДСКИЙ, АПХАХАХАХА, ВА-ха-ха - а вроде сейчас кажется вообще норм
                return;
            }

            console.log('[booking]: move vertex [', vertex, '] to pos in parent: ', new_pos);
            animate_permutation(vertex, new_pos);
        }

        console.log('!!!! AFTER REDUCTION:\nbottom_layer: ', bottom_layer);
        pos_in_booked++;
        return;
    }


    if( button_condition == 3 && vertex_to_bind_reduce == pertinent_root ) {
        button_condition = 4;
    }
    if( button_condition == 3 ) {  // редуцируем корень pertinent tree
        console.log('ПРИВОДИМ ЭТО ПОДДЕРЕВО, ЧТОБЫ наверху было Q-node');
        bind_reduce(vertex_to_bind_reduce);
        recalc_coords();
        button_condition = 1;
    }


    if( button_condition == 4 && cnt_pertinent_leafs == 1 ) {
        console.log('ЭТО КОРЕНЬ ВСЕГО pertinent tree! НО у нас всего один виртуальный лист -> ничего не делаем');
        PQvertex_type[bottom_layer[pos_one_of_pertinent_leafs]] -= N;  // превращаем в реальную
        button_condition = 0;
        button_press();
    }
    if( button_condition == 4 ) {
        console.log('ЭТО КОРЕНЬ ВСЕГО pertinent tree! -> выделяем pertinent tree в отдельную Q-node');
        root_bind_reduce();
        let save_root = pertinent_root;
        recalc_coords();
        redraw_tree();
        draw_box(pertinent_root, ctx, COLORS.BROWN, "корень pertinent tree");
        button_condition = 5;
    }


    if( button_condition == 5 ) {
        console.log('ЭТО КОРЕНЬ ВСЕГО pertinent tree! -> выделяем pertinent tree в отдельную Q-node');
        pruning();
        button_condition = 0
    }


}

function pruning() {

}


// ================================================================================================
// удаление pertinent вершин

// t == 0 - значит pertinent вершины справа, иначе слева
function recurse_deleting(i, t = 0) {
    console.log('recurse del: [', i, ']');
    let l = PQchilds[i].length, to_del = 0, pos = 0;
    if( t == 0 ) {
        pos = l-1;
        while( pos > 0 && pertinent_tree_info[PQchilds[i][pos]].is_full ) pos--, to_del++;
    } else {
        pos = 0;
        while( pos < l && pertinent_tree_info[PQchilds[i][pos]].is_full ) pos++, to_del++;
    }

    let is_exist_lefted = to_del != l ? pertinent_tree_info[PQchilds[i][pos]].is_left_fulled : 0;
    PQchilds[i].splice(t ? 0 : pos+1, to_del);  // удаляем промежуток fulled вершин
    console.log(`УДАЛЯМ [${t ? 0 : pos+1}, ${(t ? 0 : pos+1)+to_del}) промежуток из детей [${i}] - > `, PQchilds[i]);
    if( is_exist_lefted ) recurse_deleting(t == 0 ? PQchilds[i].length-1 : 0, t);
}

// что есди одна вершина? -> просто не вызывать pruning()!
// ЭТА ФУНЦИЯ МЕНЯЕТ ТОЛЬКО ТОПОЛОГИЮ, НО НЕ КООРДИНАТЫ
function root_bind_reduce() {
    // собираем все вершины в pertinent root
    console.log('!!!!!!!!!!!!!!!!!root_bind_reduce: ', PQchilds[pertinent_root]);

    let lft_blank = PQchilds[pertinent_root].slice(0, lft_first_pertinent_child);
    let rht_blank = PQchilds[pertinent_root].slice(rht_first_pertinent_child+1, PQchilds[pertinent_root].length);

    let is_lft_not_full = !pertinent_tree_info[PQchilds[pertinent_root][lft_first_pertinent_child]].is_full;
    let is_rht_not_full = !pertinent_tree_info[PQchilds[pertinent_root][rht_first_pertinent_child]].is_full;
    
    let lft_partial = is_lft_not_full && lft_first_pertinent_child != rht_first_pertinent_child ? [PQchilds[pertinent_root][lft_first_pertinent_child]] : [];
    let rht_partial = is_rht_not_full ? [PQchilds[pertinent_root][rht_first_pertinent_child]] : [];

    if( is_lft_not_full ) recurse_deleting(PQchilds[pertinent_root][lft_first_pertinent_child], 0);
    if( is_rht_not_full ) recurse_deleting(PQchilds[pertinent_root][rht_first_pertinent_child], 1);


    // удаляем [/( lft_first_pertinent_child , rht_first_pertinent_child ]/)
    let virtual_end_vertex;
    if( PQvertex_type[pertinent_root] >= 0 ) {  // это P-node
        // надо создать новую Q-node
        let pre_root = newPQnode(-1, pertinent_root);
        
        // создаём новую виртуальную вершину
        virtual_end_vertex = newPQnode(COLLECTED_VERTEX, pre_root);
        
        PQchilds[pre_root] = [...lft_partial, virtual_end_vertex, ...rht_partial];

        PQchilds[pertinent_root] = [...lft_blank, pre_root, ...rht_blank];
        console.log('>>>> new childs [', pertinent_root, ']: ', PQchilds[pertinent_root]);
        
        for(let e of PQchilds[pre_root]) {
            PQprev[e] = pre_root;
            recurse_shift(e, 0, +dY);
        }
        
    } else {
        // создаём новую виртуальную вершину
        virtual_end_vertex = newPQnode(COLLECTED_VERTEX, pertinent_root);

        // вливаем вершины
        PQchilds[pertinent_root] = [...lft_blank, ...lft_partial, virtual_end_vertex, ...rht_partial, ...rht_blank];
    }

    // изменяем bottom_layer
    let new_bottom_layer = [], need_first_push = 1;
    for(let e of bottom_layer) {
        if( PQvertex_type[e] != N+COLLECTED_VERTEX ) new_bottom_layer.push(e);
        else {
            if( need_first_push ) new_bottom_layer.push(virtual_end_vertex);
            need_first_push = 0;
        }
    }
    bottom_layer = new_bottom_layer;
    console.log('>>> new bottom layer: ', new_bottom_layer);
}


function bind_reduce(vertex) {
    let first_blank = 0;
    while( first_blank < PQchilds[vertex].length && is_pertinent_node[PQchilds[vertex][first_blank]] ) first_blank++;
    
    console.log('[BIND]: old childs:', PQchilds[vertex]);

    if( PQvertex_type[vertex] != -1 ) {  // P-node -> делаем доп шаг (сделать бы его по кнопке)
        console.log('[BIND]: its P-node');

        let cnt_blank = PQchilds[vertex].length - first_blank;
        if( cnt_blank > 1 ) {  // должны создать P-node потомка
            let blank_childs = PQchilds[vertex].slice(first_blank);
            
            let new_node = newPQnode(PQvertex_type[vertex], vertex, blank_childs);
            let summ = 0;
            for(let e of blank_childs) {
                summ += PQdraw[e].x;
                PQprev[e] = new_node;
                recurse_shift(e, 0, +dY);
                PQdraw[new_node].h = Math.max(PQdraw[new_node].h, PQdraw[e].h + 1);
            }

            // ПОФИГ НА ПРИНЦИПЫ КОДА (сейчас)
            // А. ЦЕНТР МАСС ЛИСТЬЕВ
            // Б. СРЕДНЕЕ ОТ СВОИХ ДЕТЕЙ

            PQdraw[new_node].x  = summ / blank_childs.length;
            PQdraw[new_node].x1 = PQchilds[blank_childs[0]].x1;
            PQdraw[new_node].x2 = PQchilds[blank_childs[blank_childs.length-1]].x2;
            
            PQchilds[vertex] = PQchilds[vertex].slice(0, first_blank);
            PQchilds[vertex].push(new_node);
            PQdraw[vertex].h = Math.max(PQdraw[vertex].h, PQdraw[new_node].h + 1);
        }
        
        console.log('[BIND]: mid childs:', PQchilds[vertex]);

        // "переименовываем" вершину (на Q-node)
        PQvertex_type[vertex] = -1;
    }


    // вливаем pertinent потомков
    let pump_childs = [];
    for(let i = 0; i < first_blank; i++) {
        let vrtx = PQchilds[vertex][i];
        if( PQvertex_type[vrtx] != -1 ) {  // по идеи тут может быть только виртуальная вершина
            pump_childs.push(vrtx);
            continue;
        }
    
        // вливаем детей
        pump_childs.push(...PQchilds[vrtx]);
        for(let e of PQchilds[vrtx]) {
            PQprev[e] = vertex;
            recurse_shift(e, 0, -dY);
        }
    }
    let blank_childs = PQchilds[vertex].slice(first_blank);
    PQchilds[vertex] = [...pump_childs, ...blank_childs];
    console.log('[BIND]: new childs:', PQchilds[vertex]);
}


// ================================================================================================
// КНОПКА [next]


// ================================================================================================
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}


function one_step_drawing(direction = +1) {
    if( curr_drawPages + direction < 0 ) return;

    if( curr_drawPages +  direction < savePages.length ) {  // уже рисовали
        curr_drawPages += direction;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let Xshift = 0, Yshift = 0;  // <-- ЭХ ПО ХОРОШЕМУ БЫ ИСПОЛЬЗОВАТЬ ИХ ВЕЗДЕ!!!
        ctx.drawImage(savePages[curr_drawPages], Xshift, Yshift);
        return;
    }

    console.log('draw: ', drawingQueuePos);
    if( drawingQueuePos >= drawingQueue.length ) {

        console.log('\n!!! AFTER GAME !!!\nCHILDS: ', currStepChilds);
        
        // ПОДБРАСЫВАЕТСЯ МОНЕТКА НА ЧТО ЗА ЭВЕНТ БУДЕТ:
        //  * перемещение    рандомного поддерева
        //  * отзеркаливание рандомного поддерева

        let ppv = getRandomInt(N);
        while( currStepChilds[ppv] < 1 ) ppv = getRandomInt(N);

        if( Math.random() >= 0.5 ) {
            // перестановка какого-то объекта
            let i1 = getRandomInt(currStepChilds[ppv].length);
            let i2 = getRandomInt(currStepChilds[ppv].length - 1);
            if( i2 >= i1 ) i2++;
            animate_permutation(currStepChilds[ppv][i1], i2);

            push_back_to_history();
            return;
        }

        // давайте типо "поворот" рисовать - просто посмотреть как это будет выглядеть
        animate_rotation( ppv );
        push_back_to_history();
        return;
    }


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // рисуем новую вершину: drawingQueue[drawingQueuePos]
    subtreeDraws = [];
    subtreeDrawsPositions = [];
    for(let i = 0; i < N; i++) { subtreeDraws.push(0); subtreeDrawsPositions.push( {x: 50, y: 300} ); }

    // добавляем новую вершину в bottom
    let new_vertex = drawingQueue[drawingQueuePos];
    console.log("NEW VERTEX: ", new_vertex);
    add_to_bottom(new_vertex);
    currStepChilds[Prev[new_vertex]].push(new_vertex);

    lst_bottom_layer_to_array();

    console.log('Bottom Vertices: ', lst_bottom_layer_array);
    // lst_print();
    
    calc_bottom_x_coords();
    upward_drawing();
    
    
    drawingQueuePos++;

    // сохранение рисунка в "историю"
    push_back_to_history();

    // ctx.drawImage(subtreeDraws[1], 0, 300);
}





