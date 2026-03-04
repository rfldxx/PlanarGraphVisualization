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
    ORANGE: '#FF5722'
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
        drawed_ctx.fillStyle = (PQvertex_type[i]-N == vertex_to_expand) ? COLORS.VERTEX : 'white';
        drawed_ctx.fillRect(x1, y1, x2-x1, y2-y1);

        draw_earflaps(x1, x2, y1, y2, drawed_ctx, COLORS.VERTEX_SELECTED);
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

function draw_box(cur, drawed_ctx = ctx, clr = COLORS.PURPLE) {
    let xx1 = PQdraw[cur].x1, xx2 = PQdraw[cur].x2, yy1 = PQdraw[cur].y, yy2 = yy1 + dY*PQdraw[cur].h;
    draw_earflaps(xx1, xx2, yy1 - VERTEX_RADIUS, yy2 + 30, drawed_ctx, clr);
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

let PQroot = 0;

let PQdraw        = [];  // {x, y, x1, x2, h, i1, i2} x,y - координаты узла, x1,x2 - координаты границ поддерева, i1,i2 - индексы граничных листьев поддерева
// ! вершина получает свою y координату при первом добавлении в PQtree

function restartPQ() {
    PQvertex_type = [];
    PQchilds      = [];
    PQprev        = [];
}

function newPQnode(type, prev, childs = []) {  // , childs??
    // if( PQfree_pos.length != 0 ) return PQfree_pos.pop();

    // надо создавать новую позицию в "массиве" хранящем PQ_tree
    PQvertex_type.push(type);
    PQchilds     .push(childs);
    PQprev       .push(prev);
    PQdraw       .push({x: 10, y: (prev != -1 ? PQdraw[prev].y : 0) + dY, x1: canvas.width, x2: -1, h: 0, i1: -1, i2: -1});
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

function tree_read() {
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
    PQroot = str_to_indx.get(input[0]);


    N = REAL_VERTEX_NAME.length;


    console.log(REAL_VERTEX_NAME );
    console.log(REAL_GRAPH_CHILDS);


    // "Первое" построение PQ-дерева
    newPQnode(N, -1);
    bottom_layer = [0];

    vertex_to_expand = 0;
    next_vertex_expand();
    return;



    expand(0);
    expand(1);
    expand(2);
    expand(3);
    expand(4);

    // expand(5);

    let bl = [...bottom_layer];
    for(let i in bl) bl[i] -= N;
    console.log('bl: ', bl);

    // expand(6);
    // expand(7);
    // expand(8);



    recalc_coords();
    draw_subtree(0);
    // animate_rotation(1);

    // draw_boxes(0);

    
    console.log('PQdraw : ', PQdraw);


    console.log('PQchilds[1] : ', PQchilds[1]);

    // animate_rotation(1);
    animate_permutation(5, 3);
}

// ================================================================================================
// [ ПРЕВРАЩАЕМ ВИРТУАЛЬНУЮ ВЕРШИНУ В РЕАЛЬНЫЙ УЗЕЛ ]
function expand(real_vertex) {
    // Удаляем все появления vertex в bottom_layer, кроме первого
    // Первое появление превращается в P-node и к нему подкрепляются вируальные дети REAL_GRAPH_CHILDS[vertex]

    let first_mention = 1;
    let new_bottom_layer = [];
    for(let u of bottom_layer) {
        if( PQvertex_type[u] != N + real_vertex ) { new_bottom_layer.push(u); continue; }

        if( !first_mention ) {
            // удаляем из детей
            let prv = PQprev[u];
            PQchilds[prv].splice(PQchilds[prv].indexOf(u), 1);
            // new_bottom_layer.push(u); 
            continue;
        }
        first_mention = 0;

        // PQvertex_type[u] -= N;  // сделали P-node
        PQvertex_type[u] = (Math.random() < 0.5 ? -1 : PQvertex_type[u]-N);
        for(let chld of REAL_GRAPH_CHILDS[real_vertex]) PQchilds[u].push( newPQnode(N + chld, u) );
        new_bottom_layer.push(...PQchilds[u]);
    }
    bottom_layer = new_bottom_layer;
}




// ================================================================================================
// [ ПОДСЧЁТ ВСЕХ КООРДИНАТ ]

let SILLY_SHIFT_X  =  50;
let AvailableWidth = 700;
function recalc_coords() {
    // 0. СБРАСЫВАЕМ ОГРАНИЧИВАЮЩИЕ ПРЯМОУГОЛЬНИКИ
    for(let i = 0; i < PQvertex_type.length; i++) {
        PQdraw[i].x1 = SILLY_SHIFT_X + AvailableWidth;
        PQdraw[i].x2 = -1;
        PQdraw[i].h  =  0;
        PQdraw[i].i1 = bottom_layer.length;
        PQdraw[i].i2 = -1;
    }

    // 1. ПОДСЧЁТ ДЛЯ ЛИСТЬЕВ
    //    ТУТ МОЖНО РАЗНЫМИ ВАРИАНТАМИ -> сделать бы это переключаемым
    //    СЕЙЧАС: вписываем прям в края (в данном варианте растановки есть частный случай когда только одна вершина)
    let l = bottom_layer.length;
    let [shift, space] = (l == 1) ? [AvailableWidth/2, 0] : [0, AvailableWidth/(l-1)];
    for(let i = 0; i < l; i++) {
        let v = bottom_layer[i];
        PQdraw[v].x  = SILLY_SHIFT_X + shift + i*space;
        PQdraw[v].x1 = PQdraw[v].x - VERTEX_RADIUS;
        PQdraw[v].x2 = PQdraw[v].x + VERTEX_RADIUS;
        PQdraw[v].i1 = PQdraw[v].i2 = i;
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
            
            if( calls[p] != PQchilds[p].length ) continue;            
            
            // все дети вершины p обработанны
            next_layer.push(p);

            // А. ЦЕНТР МАСС ЛИСТЬЕВ
            PQdraw[p].x = sum[p] / cnt[p];

            // Б. СРЕДНЕЕ ОТ СВОИХ ДЕТЕЙ
            // PQdraw[p].x = 0;
            // for(let u of PQchilds[p]) PQdraw[p].x += PQdraw[u].x;
            // PQdraw[p].x /= PQchilds[p].length;
        }
    }
}


// ================================================================================================
// [ ОТДЕЛЬНАЯ ФУНКЦИЯ КОТОРАЯ РЕККУРСИВНО РИСУЕТ ]

function draw_subtree(cur, excepted_branch = -1, draw_ctx = ctx) {
    if( cur == excepted_branch ) return;

    for(let nxt of PQchilds[cur]) {
        if( nxt == excepted_branch ) continue;  // ай, сам знаю кринж - два сравнения с excepted_branch, но чет неочев как делать из-за рисования ребра
        draw_edge_to(nxt, draw_ctx);
        draw_subtree(nxt, excepted_branch, draw_ctx);
    }

    draw_vertex_label(cur, draw_ctx);
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
let AnimeTime = 2000;
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
function recurse_shift(cur, dx) {
    PQdraw[cur].x  += dx;
    PQdraw[cur].x1 += dx;
    PQdraw[cur].x2 += dx;
    for(let nxt of PQchilds[cur]) recurse_shift(nxt, dx);
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
    console.log(`bottom_layer:  [${bi1} : ${bi2}]  <->  [${bj1} : ${bj2}]`)
    array_rearange(bottom_layer, bi1, bi2, bj1, bj2);

    // перестановка детей (.... всё таки это вернулось)
    array_rearange(layer, cur_pos_in_childs, cur_pos_in_childs, blck_lft_pos, blck_rht_pos);

    console.log('AFTER  CHANGE:\n    bottom_layer:', bottom_layer);


    // // чё сама анимация?? неее
    if( currentAnimationFrame ) cancelAnimationFrame(currentAnimationFrame);
    animation_start_time  = -1;
    currentAnimationFrame = requestAnimationFrame(animate_permutation_frame);
}




// ================================================================================================
// как сделать все вершины подряд???

// собираем вершины vertex_to_expand
let reducing_pos = -1;
function reducing_step() {
    if( reducing_pos == -1 ) {
        reducing_pos = 0;
        highlighted_up_edges_from = new Map();
    }



}


// ================================================================================================
// КНОПКА [next]

let to_delete_flag = 0;

let vertex_to_expand = 0;
function next_vertex_expand() {
    if( vertex_to_expand >= N ) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // for(let i = 0; i < 100; i++) highlighted_up_edges_from.set(i, 1);

    // highlighted_up_edges_from.set(1, 1);
    // highlighted_up_edges_from.set(5, 1);

    let bl = [...bottom_layer];
    for(let i in bl) bl[i] = PQvertex_type[bl[i]] - N;
    console.log('AFTER EXPAND: ', vertex_to_expand, '  |  bottom_layer: ', bottom_layer, '  |  bl: ', bl);




    if( vertex_to_expand >= 1 ) {
        if(to_delete_flag) animate_rotation(1);
        else if( vertex_to_expand >= 5 )  animate_permutation(5, 4);
        to_delete_flag ^= 1;
        // animate_permutation(5, 3);
    }

    if( vertex_to_expand <= 5) {
        expand(vertex_to_expand);
        vertex_to_expand++;
        
        recalc_coords();
        draw_subtree(0);
    }  

}





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





