let canvas = document.getElementById("canvas");
let ctx    = canvas  .getContext('2d');


let N = 0;
let gAdj = [];  //  с учётом "геометрического" порядка

let zero_time_vertex = 0;
let wait_time = [];


function gAdj_read() {
    // Здесь filter(Boolean) эквивалентен filter(line => line !== '').
    const input = document.getElementById("gAdj_input").value.split('\n').map(l => l.trim()).filter(l => l).map(l => l.split(/\s+/).map(Number));

    // стока не будет в входных данных gAdj
    N = input.length + 1;
    
    gAdj = [];
    for(let i = 0; i < N; i++) gAdj.push( [] );
    for(let vv of input) {
        for(let i = 1; i < vv.length; i++)
            gAdj[vv[0]].push(vv[i]);
    }
    
    recalc_wait_time();

    one_step_drawing();
}

function recalc_wait_time() {
    // уфф, как достала такая тупость создания массивов
    vertex_mention = [];
    for(let i = 0; i < N; i++) vertex_mention.push([]);
    vertex_bounds = [];
    for(let i = 0; i < N; i++) vertex_bounds.push({x1: 1e9, x2: -1});
    
    vertex = new Array(N).fill({x: -1, y: -1, x1: -1, x2: -1});
    
    wait_time = new Array(N).fill(0);

    for(let adj of gAdj) {
        for(let nxt of adj) wait_time[nxt]++;
    }

    for(let i = 0; i < N; i++) if( wait_time[i] == 0 ) zero_time_vertex = i;
    drawingQueue = [zero_time_vertex];
    drawingQueuePos = 0;

    vertex_mention[zero_time_vertex] = [{x : 400, y :  50, from: -1}];
    vertex_bounds [zero_time_vertex] =  {x1:   0, x2: 800} ;

    print_all_arrays();
}


function print_all_arrays() {
    console.log('zero_time_vertex', zero_time_vertex);
    console.log('drawingQueue', drawingQueue);
    console.log('vertex_mention', vertex_mention);
    console.log('vertex_bounds', vertex_bounds);
    console.log('vertex', vertex);
    console.log('gAdj', gAdj);
    console.log('wait_time', wait_time);
}

let drawingQueue = [];
let drawingQueuePos = 0;


// Размеры вершин
const VERTEX_RADIUS = 10;

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
};



let vertex_mention = [];
let vertex_bounds  = [];
let vertex = [{x: 250, y: 50, x1: 50, x2: 450}];


// ай ладно, сделаем отдельный массив (по идеи эту информацию можно было получить из vertex и vertex_mention)
let all_dots = []; // {x, y, dy}, dy - для вертикальных отрезков


let dY = 50;
let min_dX = 50;

function draw_segment(x1, y1, x2, y2, clr = COLORS.EDGE, ww = 2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = clr;
    ctx.lineWidth   = ww;
    ctx.stroke();
}

function draw_circle(x, y, r = VERTEX_RADIUS, clr = COLORS.VERTEX, bclr = '#333', ww = 2) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = clr;
    ctx.fill();
    ctx.strokeStyle = bclr;
    ctx.lineWidth = ww;
    ctx.stroke();
}


function draw_vertex(i) {
    // A. смотрим все упоминания этой вершины
    let lst = vertex_mention[i];
    let x_mean = 0;
    for(let xy of lst) x_mean += xy.x;
    x_mean /= lst.length;

    // находим максимальную высоту
    let x_min = lst[0].x, x_max = x_min;
    for(let xy of lst) { x_min = Math.min(x_min, xy.x); x_max = Math.max(x_max, xy.x); }

    let max_lstY = 0;
    for(let xy of lst) max_lstY = Math.max(max_lstY, xy.y);
    
    
    let max_drwY = 0;
    let cheked = [];
    for(let p = 0; p < drawingQueuePos; p++) {
        let v = drawingQueue[p];
        if( vertex[v].x <= x_min || x_max <= vertex[v].x ) continue;

        max_drwY  = Math.max(max_drwY, vertex[v].y);
        cheked.push(v);
    }
    
    console.log('lst.length', lst.length);
    let can_move_up = dY; // lst.length <= 2 ? dY: 0;
    let maxY = Math.max(max_lstY - can_move_up, max_drwY);
    console.log('maxY: ', maxY);

    console.log('mention: ', lst);
    console.log('chek: ', cheked);

    // ЗАПИСЫВАЕМ КООРДИНАТЫ ВЕРШИНЫ
    vertex[i] = {x: x_mean, y: maxY + dY, x1: vertex_bounds[i].x1, x2: vertex_bounds[i].x2, id_in_all: all_dots.length};
    let {x, y, x1, x2} = vertex[i];
    all_dots.push( {x: x, y: y, dy: 0} );
    
    console.log(`VERTEX[${i}]: `, vertex[i]);


    // Б. дорисовка входящих рёбер 
    let to_optimize_lst = [];

    // Б.1. сначала затираем прошлые нарисованные ребра (при необходимости)
    for(let xy of lst) {
        if( xy.y <= maxY ) { to_optimize_lst.push(xy); continue; }
        
        if( xy.x == x ) continue;  // не надо перерисовывать - уже всё впорядке с ребром

        let prev = xy.from;
        if( prev == -1 ) continue;
        
        // стираем прошлое ребро
        draw_segment(xy.x, xy.y, vertex[prev].x, vertex[prev].y, COLORS.BACKGROUND, 3);
        draw_circle( xy.x, xy.y, 5, COLORS.BACKGROUND, COLORS.BACKGROUND, 3);
        
        // перерисовываем ребро к ребенку
        draw_segment(x, y, vertex[prev].x, vertex[prev].y, COLORS.PURPLE);
        draw_vertex_label(prev);

        xy.x = x;
        xy.y = y;
    }

    // Б.2. уже только рисуем
    // ВЕРТИКАЛИЗАЦИЯ РЁБЕР
    let ll = to_optimize_lst.length;
    // ОТТДЕЛЬНО левая часть [0, left_border), отдлеьно правая часть [right_border, ll)
    // при этом может получится не симметрично! (из-за того что сначала обрабатывается (и жестко оптимизируется) одна из частей)
    to_optimize_lst.sort();
    let left_border = 0;
    while( left_border < ll && to_optimize_lst[ left_border].x <  x )  left_border++;
    let right_border = left_border;
    while( left_border < ll && to_optimize_lst[right_border].x <= x ) right_border++;

    
    // вертикализуем "левые" ребра
    // (по идеи бы отдельно прям спрямлять ребра у которых нет вертикальных участков, т.е. до которых 2 уровня вверх)
    // (те до которых 1 уровень вверх были построены на шаге Б.1)
    for(let j = left_border-1; j >= 0; j--) {
        let prev = to_optimize_lst[j].prev;
        if( vertex[prev].x <= to_optimize_lst[j].x ) continue;  // такие рерба не улучшаем (хотя надо - там аналогичная область, только вдругую сторону)

        // search zone:  x: [zone_x1 zone_x2]
        let zone_x1 = to_optimize_lst[j].x, zone_x2 = Math.min(x, vertex[prev].x) + min_dX;
        let zone_y1 = to_optimize_lst[j].y, zone_y2 = maxY;
        
        let ans_x = zone_x1 + min_dX;
        for(let xydy of all_dots) {  // перебор всех вершин
            let curx = xydy.x, cury1 = xydy.y, cury2 = cury1 + xydy.dy;
            if( curx  < zone_x1 || zone_x2 < curx  ) continue;
            if( cury2 < zone_y1 || zone_y2 < cury1 ) continue;

            ans_x = Math.min(ans_x, curx);
        }

        ans_x -= min_dX;
        if( ans_x <= zone_x1 ) continue;  // ребро не оптимизируется


        // эххх, жара.... парилка
        let id_in_all = to_optimize_lst[j].id_in_all;
        // ВСЁ УСТАЛ, ПОЙДУ В ARKNIGHTS ПОИГРАЮ И СПАТЬ
    }

    // дорисовываем остатки
    for(let xy of to_optimize_lst) {
        // ДОБАВИТЬ "спрямление" рёбер

        // сдвиг вертикальной грани вбок

        // вниз до необходимого уровня (при необходимости)
        draw_segment(xy.x, xy.y, xy.x, maxY, COLORS.VERTEX_DRAGGING);
        
        // соединение в одну точку
        draw_segment(xy.x, maxY, x, y, COLORS.VERTEX_SELECTED);

        draw_circle(xy.x, xy.y, 5, COLORS.VERTEX_SELECTED);
    }
    

    // В. Рисование исходящих рёбер
    let n = gAdj[i].length;
    let l = (x2 - x1) / n;
    for(let j = 0; j < n; j++) {
        // отрезок [x, y] - [x1 + l/2 + l*i, y+dY]
        let xj = x1 + l*(j+0.5), yj = y + dY;
        draw_segment(x, y, xj, yj);

        let nxt = gAdj[i][j];

        // ЗАПИСЫВАЕМ КООРДИНАТЫ В vertex_mention
        vertex_mention[nxt].push( {x: xj, y: yj, from: i, id_in_all: all_dots.length} );
        all_dots.push( {x: xj, y: yj, dy: 0} );  // пока dy = 0, длинна появится, когда эта ребро будет продленно вниз
        
        
        draw_circle(xj, yj, 5, COLORS.BACKGROUND);

        console.log(' -> ', nxt, '(t=', vertex_mention[nxt].length, ')', vertex_mention[nxt][vertex_mention[nxt].length-1]);

        vertex_bounds[nxt].x1 = Math.min(vertex_bounds[nxt].x1, x1 + l*j    );
        vertex_bounds[nxt].x2 = Math.max(vertex_bounds[nxt].x2, x1 + l*(j+1));

        if( vertex_mention[nxt].length == wait_time[nxt] ) {  // это последнее упоминание этой вершины
            drawingQueue.push(nxt);
        }
    }


    // Г. Рисование самой вершины
    draw_vertex_label(i);
}

function draw_vertex_label(i) {
    let x = vertex[i].x, y = vertex[i].y;
    draw_circle(x, y);
    
    // Текст метки
    ctx.fillStyle    = 'white';
    ctx.font         = 'bold 14px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i}`, x, y);
}

function one_step_drawing() {
    console.log('draw: ', drawingQueuePos);
    if( drawingQueuePos >= drawingQueue.length ) return;
    draw_vertex( drawingQueue[drawingQueuePos] );
    drawingQueuePos++;
}
