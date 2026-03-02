/* какое-то дерево
0 1
1 2
0 3
2 4
3 5
3 6
2 7
1 8
0 9
1 10
8 11
8 12
9 13
9 14
5 15
5 16
8 17
7 18
7 19
12 20
12 21
*/

let canvas = document.getElementById("canvas");
let ctx    = canvas  .getContext('2d');

// Размеры вершин
const VERTEX_RADIUS = 10;

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
    GREEN: '#45a049'
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

function draw_vertex_label(i, drawed_ctx = ctx) {
    let x = Xcoords[i], y = dY*(Ylvl[i]+1);
    draw_circle(x, y, VERTEX_RADIUS, COLORS.VERTEX, '#333', 2, drawed_ctx);
    
    // Текст метки
    drawed_ctx.fillStyle    = 'white';
    drawed_ctx.font         = 'bold 14px Arial';
    drawed_ctx.textAlign    = 'center';
    drawed_ctx.textBaseline = 'middle';
    drawed_ctx.fillText(`${i}`, x, y);
}

function draw_edge(i, j, drawed_ctx = ctx) {
    draw_segment(Xcoords[i], dY*(Ylvl[i]+1), Xcoords[j], dY*(Ylvl[j]+1), COLORS.EDGE, 2, drawed_ctx);
}

let cnt_rect = 0;
function draw_earflaps(x1, x2, y1, y2 = 1000, drawed_ctx = ctx, clr = COLORS.RED) {
    if( x2-x1 < 10 ) { x1 -= 5; x2 += 5; }

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


// ================================================================================================
// СОЗДАЁМ ДОПОЛНИТЕЛЬНЫЙ canvas НАД ПЕРВЫМ (для анимаций)

// Создаём верхний canvas с такими же размерами
const topCanvas  = document.createElement('canvas');
topCanvas.width  = canvas.width;
topCanvas.height = canvas.height;

// Позиционируем абсолютно поверх основного
topCanvas.style.position = 'absolute';
topCanvas.style.left     = canvas.offsetLeft + 'px';
topCanvas.style.top      = canvas.offsetTop  + 'px';
topCanvas.style.zIndex   = '10';

// *** Убираем фон и рамку, которые наследуются от CSS ***
topCanvas.style.background = 'none';
topCanvas.style.border     = 'none';

// Чтобы клики проходили сквозь на нижний слой (если нужно)
topCanvas.style.pointerEvents = 'none';

// Добавляем на страницу
document.body.appendChild(topCanvas);

// Контекст для рисования на верхнем слое
const topCtx = topCanvas.getContext('2d');



// ================================================================================================
// ТУПИЗМ, опять пишу в ручную связный список.....
let lst_bottom_layer_val = [];
let lst_bottom_layer_nxt = [];
// let lst_bottom_layer_pos_start = 0;  // <- ВСЕГДА по идеи в моём использовании
let lst_bottom_layer_pos_empty = 0;
let lst_bottom_layer_cnt = 0;

// function lst_bottom_layer_del_after(pos) {  // тоже пока не нужно
//     let del = lst_bottom_layer_nxt[pos];
//     lst_bottom_layer_nxt[pos] = lst_bottom_layer_nxt[del];

//     lst_bottom_layer_nxt[del]  = lst_bottom_layer_pos_empty;
//     lst_bottom_layer_pos_empty = del;
// }


function lst_print() {
    console.log('LST val:  ', lst_bottom_layer_val);
    console.log('LST nxt:  ', lst_bottom_layer_nxt);
    console.log('cur free: ', lst_bottom_layer_pos_empty);
}

function lst_bottom_layer_add_after(pos) {
    lst_bottom_layer_cnt++;

    let cur_empty              = lst_bottom_layer_pos_empty;
    lst_bottom_layer_pos_empty = lst_bottom_layer_nxt[cur_empty];

    lst_bottom_layer_nxt[cur_empty] = lst_bottom_layer_nxt[pos];
    lst_bottom_layer_nxt[pos]       = cur_empty;

    return cur_empty
}

function lst_bottom_layer_init(n) {
    lst_bottom_layer_val = [];
    lst_bottom_layer_nxt = [];
    for(let i = 0; i < n; i++) { lst_bottom_layer_nxt.push(i+1); lst_bottom_layer_val.push(0);}
    lst_bottom_layer_cnt = 0;
    lst_bottom_layer_pos_empty = 0;
}

let lst_bottom_layer_array = [];
function lst_bottom_layer_to_array() {
    lst_bottom_layer_array = [];
    let pos = 0;
    for(let cnt = 0; cnt < lst_bottom_layer_cnt; cnt++) {
        lst_bottom_layer_array.push( lst_bottom_layer_val[pos] );
        pos = lst_bottom_layer_nxt[pos];
    }
}
// ================================================================================================

let ROOT = 0;
let N = 0;
let Childs = [];

// У КОРНЯ prev == N, а не как "обычно" -1
let Prev = [];
let Ylvl = [];

let Xcoords = [];


// let bottom_vertices = [];  // только номера вершин

let pos_in_bottom = [];
let last_drawing_child = [];


let drawingQueue = [];  // порядок в котором рисуем вершины
let drawingQueuePos = 0;

let currStepChilds = [];

function tree_read() {
    // Здесь filter(Boolean) эквивалентен filter(line => line !== '').
    const input = document.getElementById("tree_input").value.split('\n').map(l => l.trim()).filter(l => l).map(l => l.split(/\s+/).map(Number));

    N = input.length + 1;
    // ааа, как меня бесят эти массивы, почему нельзя было C++ vector стырить просто???
    Childs = []; Prev = []; Ylvl = []; Xcoords = [];
    for(let i = 0; i < N; i++) {
        Childs.push( [] );  Prev.push( N );  Ylvl.push( 0 );  Xcoords.push( 20 );
    }


    // Делаем и для "бедроковой" N+1-ой вершины
    pos_in_bottom = []; last_drawing_child = [];
    for(let i = 0; i < N+1; i++) { pos_in_bottom.push(-1); last_drawing_child.push(-1); }
    pos_in_bottom[N] = 0;


    currStepChilds = [];
    for(let i = 0; i <= N; i++) currStepChilds.push([]);
    currStepChilds[N] = [-1, -1];

    // уфффф
    lst_bottom_layer_init(N);
    lst_bottom_layer_val[0]    = N;
    lst_bottom_layer_cnt       = 1;
    lst_bottom_layer_pos_empty = 1;
    lst_bottom_layer_to_array();


    // ПРЯМ ОЧЕНЬ ЗАХАРДКОЖЕНО НА ВХОДНЫЕ ДАННЫЕ
    let root = input[0][0];
    ROOT = root;
    
    // рисуем вершины в порядке первого упомянания
    drawingQueue = [root]; drawingQueuePos = 0;
    let was = [];
    for(let i = 0; i < N; i++) was.push(0);
    // was[root] = 1;  - не обязательно

    for(let vv of input) {  // ребро: vv[0] -> vv[1]
        Childs[vv[0]].push(vv[1]);
        Prev  [vv[1]] = vv[0];
        Ylvl  [vv[1]] = Ylvl[vv[0]] + 1;
        
        if( !was[vv[1]] ) { drawingQueue.push(vv[1]); was[vv[1]] = 1; }
    }

    // console.log(Ylvl);
    one_step_drawing();


    // SPEERUN
    while( drawingQueuePos < drawingQueue.length ) one_step_drawing();
}


let SILLY_SHIFT_X  =  50;
let AvailableWidth = 700;
function calc_bottom_x_coords() {
    // ТУТ МОЖНО РАЗНЫМИ ВАРИАНТАМИ -> сделать бы это переключаемым
    // СЕЙЧАС: вписываем прям в края

    // в данном варианте растановки есть частный случай когда только одна вершина
    let l = lst_bottom_layer_cnt;

    let [shift, space] = (l == 1) ? [AvailableWidth/2, 0] : [0, AvailableWidth/(l-1)];

    for(let i = 0; i < l; i++) {
        Xcoords[ lst_bottom_layer_array[i] ] = SILLY_SHIFT_X + shift + i*space;
    }
}

// ================================================================================================
// ТУТ и рисование и ПОДСЧЁТ КООРДИНАТ
let SubtreeBorders = [];

function upward_drawing() {  // ай пофиг бует функция которая всё и сразу делает
    // СЕЙЧАС: размещаем координату в центре масс "листьев"
    let sum = [], cnt = [];
    for(let i = 0; i < N; i++)    { sum.push(0);         cnt.push(0); }
    for(let v of lst_bottom_layer_array) { sum[v] = Xcoords[v]; cnt[v] = 1;  }

    // для рисования ограничивающих прямоугольников
    SubtreeBorders = [];
    for(let i = 0; i <= N; i++) SubtreeBorders.push( {x1: 750, x2: 10, y2: 10} );
    for(let v of lst_bottom_layer_array) {
        SubtreeBorders[v] = {x1: Xcoords[v] - VERTEX_RADIUS, x2: Xcoords[v] + VERTEX_RADIUS, y2: dY*(Ylvl[v]+1) + VERTEX_RADIUS};
        
        draw_earflaps(SubtreeBorders[v].x1, SubtreeBorders[v].x2, dY*(Ylvl[v]+1) - VERTEX_RADIUS, SubtreeBorders[v].y2);
    }

    let calls = [];
    for(let i = 0; i <= N; i++) calls.push(0);

    let curr = lst_bottom_layer_array;
    while( curr.length ) {
        let nxt = [];
        for(let v of curr) {
            let p = Prev[v];
            calls[p]++;

            sum[p] += sum[v];
            cnt[p] += cnt[v];

            SubtreeBorders[p].x1 = Math.min(SubtreeBorders[p].x1, SubtreeBorders[v].x1); //-5);
            SubtreeBorders[p].x2 = Math.max(SubtreeBorders[p].x2, SubtreeBorders[v].x2); //+5);
            SubtreeBorders[p].y2 = Math.max(SubtreeBorders[p].y2, SubtreeBorders[v].y2); //+5);

            // проверка если вершина p ещё не дообработанна
            if( calls[p] != currStepChilds[p].length ) continue;            
            nxt.push(p);

            // А. ЦЕНТР МАСС ЛИСТЬЕВ
            // Xcoords[p] = sum[p] / cnt[p];

            // Б. СРЕДНЕЕ ОТ СВОИХ ДЕТЕЙ
            Xcoords[p] = 0;
            for(let u of currStepChilds[p]) Xcoords[p] += Xcoords[u];
            Xcoords[p] /= currStepChilds[p].length;

            // рисуем всех АКТУАЛЬНЫХ детей
            for(let u of currStepChilds[p]) {
                draw_segment(Xcoords[p], dY*(Ylvl[p]+1), Xcoords[u], dY*(Ylvl[u]+1));
                draw_vertex_label(u);
            }

            let xx1 = SubtreeBorders[p].x1, xx2 = SubtreeBorders[p].x2, yy1 = dY*(Ylvl[p]+1) - VERTEX_RADIUS, yy2 = SubtreeBorders[p].y2;
            draw_earflaps(xx1, xx2, yy1, yy2);
            let ww = xx2 - xx1, hh = yy2 - yy1;
            let subtree_canvas = new OffscreenCanvas(ww, hh);
            subtree_canvas.getContext('2d').drawImage(canvas, xx1, yy1, ww, hh, 0, 0, ww, hh);
            subtreeDraws[p] = subtree_canvas;
            subtreeDrawsPositions[p] = {x: xx1, y: yy1};
        }

        curr = nxt;
    }

    console.log('calls: ', calls);
    console.log('needs: ', currStepChilds);

    // ЕЩЁ ОДИН ЗАХАРКОЖЕННЫЙ УЧАСТОК
    draw_vertex_label( drawingQueue[0] );
}


function add_to_bottom(vertex) {
    let u = Prev[vertex];
    while( last_drawing_child[u] != -1 ) u = last_drawing_child[u];

    // записываем вместо родителя если: (u == Prev[vertex])
    let pos = (u == Prev[vertex]) ? pos_in_bottom[u] : lst_bottom_layer_add_after( pos_in_bottom[u] );
    pos_in_bottom[vertex] = pos;
    lst_bottom_layer_val[pos] = vertex;

    last_drawing_child[Prev[vertex]] = vertex
}

// let globalX

// "история" (для кнопки назад)
let curr_drawPages = 0;
let savePages = [];
function push_back_to_history() {
    let offscreen_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    offscreen_canvas.getContext('2d').drawImage(canvas, 0, 0);
    savePages.push( offscreen_canvas );
    curr_drawPages += 1;  // <- а надо это тут? (в моём использование вроде надо)
}


// для актуального шага (drawingQueuePos)
let subtreeDraws = [];
let subtreeDrawsPositions = [];


// ================================================================================================
// СТРОИМ ВИРТУАЛЬНЫЕ canvas-ы  <<<ДЛЯ АНИМАЦИИ>>>

function builds_offcsreen_canvas(cur, excepted_branch = -1, draw_ctx = ctx) {
    if( cur == excepted_branch ) return;

    for(let nxt of currStepChilds[cur]) {
        if( nxt == excepted_branch ) continue;  // ай, сам знаю кринж - два сравнения с excepted_branch, но чет неочев как делать из-за рисования ребра
        draw_edge(cur, nxt, draw_ctx);
        builds_offcsreen_canvas(nxt, excepted_branch, draw_ctx);
    }

    draw_vertex_label(cur, draw_ctx);
}

let ALPHA = 4;


// блен ещё порядок в bottom_layer надо менять.... <------- !!! ВАЖНО !!!
function recurse_mirroring(cur, x_centre) {
    Xcoords[cur] = 2*x_centre - Xcoords[cur];

    console.log("GET BORDERS to ", cur);
    // а зачем они нужны..? - а видимо для x_centre... - если только там, то можно было сразу хранить x_centreх[v]
    let xx1 = SubtreeBorders[cur].x1, xx2 = SubtreeBorders[cur].x2;
    SubtreeBorders[cur].x1 = 2*x_centre - xx2;
    SubtreeBorders[cur].x2 = 2*x_centre - xx1;

    // зеркалим порядок детей
    for(let i1 = 0, i2 = currStepChilds[cur].length-1; i1 < i2; i1++, i2--) {
        let tmp = currStepChilds[cur][i1];
        currStepChilds[cur][i1] = currStepChilds[cur][i2];
        currStepChilds[cur][i2] = tmp;
    }
    
    // в принципе не важно в каком порядке эти циклы делать, но так "типо" хвостовая реккурсия будет наверное
    for(let nxt of currStepChilds[cur]) recurse_mirroring(nxt, x_centre);
}


// а зачем?? по идеи всё равно можно это не использовать - на следующем шаге будет другое
// а хотя мы пересчитываем координаты только при доюавлении вершины, так-что это нужно если будут несколько раз подряд всякие изменения делаться
// блен ещё порядок в bottom_layer надо менять.... <------- !!! ВАЖНО !!!
function recurse_shift(cur, dx) {
    Xcoords[cur] += dx;
    SubtreeBorders[cur].x1 += dx;
    SubtreeBorders[cur].x2 += dx;

    for(let nxt of currStepChilds[cur]) recurse_shift(nxt, dx);
}

function draw_boxes(cur, drawed_ctx = ctx, dy = 0, clr = COLORS.RED) {
    let xx1 = SubtreeBorders[cur].x1, xx2 = SubtreeBorders[cur].x2, yy1 = dY*(Ylvl[cur]+1) - VERTEX_RADIUS, yy2 = SubtreeBorders[cur].y2;
    draw_earflaps(xx1, xx2, yy1 + dy, yy2 + dy, drawed_ctx, clr);
    for(let nxt of currStepChilds[cur]) draw_boxes(nxt, drawed_ctx, dy, clr);
}



// ================================================================================================
// СДЕЛАТЬ БЫ AnimeTime завищищем от кол-ва участвующих в анимации вершин
let AnimeTime = 200;

let     enviroment_canvas;
let animated_start_canvas;
let animated_ended_canvas;

// ОТЗЕРКАЛИВАНИЕ
let animate_rotation_start_time   = -1;
let animate_rotation_x_centre     = -1;
let animate_rotation_vertex       = -1;
let animate_rotation_variant_sign = -1; // или +1 

// рисуется только на topCanvas
function animate_rotation_frame(currT) {
    if( animate_rotation_start_time == -1 ) animate_rotation_start_time = currT;

    // кароче всё на ctx просто рисуем, с topCtx как-то съезжают координаты
    ctx.clearRect(0, 0, topCanvas.width, topCanvas.height);

    let dT = currT - animate_rotation_start_time;
    if( dT > AnimeTime ) {
        // финальный кадр
        if( animate_rotation_vertex != ROOT ) {
            draw_edge(animate_rotation_vertex, Prev[animate_rotation_vertex]);
        }
        ctx.drawImage(    enviroment_canvas, 0, 0);
        ctx.drawImage(animated_ended_canvas, 0, 0);
        return;
    }


    // вторая половина / второй акт / другое эпичное название
    let c_r1 = (dT > AnimeTime/2) ? -1 + 4*Math.pow(1 - dT/AnimeTime, 2) : +1 - 4*Math.pow(dT/AnimeTime, 2);
    let c_r2 = Math.sqrt( (1 - c_r1*c_r1) / ALPHA );
    c_r2 *= animate_rotation_variant_sign;
    
    // рисование ребра
    if( animate_rotation_vertex != ROOT ) {
        let i = animate_rotation_vertex, pr = Prev[i];
        let px = Xcoords[pr], py = dY*(Ylvl[pr]+1);
        // емаё я же зеркалю координаты перед вызывом requestAnimationFrame (поэтому такой странный xx)
        let xx = (2*animate_rotation_x_centre-Xcoords[ i]), yy = dY*(Ylvl[ i]+1);
        let nx = c_r1 * xx +     (1-c_r1)*animate_rotation_x_centre;
        let ny = c_r2 * xx + yy    -c_r2 *animate_rotation_x_centre;
        draw_segment(px, py, nx, ny);
    }

    let sourceCanvas = animated_start_canvas;
    // для второго акта используем animated_ended_canvas
    if( c_r1 < 0 ) { c_r1 = - c_r1; c_r2 = -c_r2; sourceCanvas = animated_ended_canvas; }


    ctx.drawImage(    enviroment_canvas, 0, 0);

    // Сохраняем текущее состояние контекста
    ctx.save();

    // Устанавливаем матрицу преобразования
    ctx.setTransform(c_r1, c_r2, 0, 1, (1-c_r1)*animate_rotation_x_centre, -c_r2*animate_rotation_x_centre);
    
    ctx.drawImage(sourceCanvas, 0, 0);

    // Восстанавливаем исходную матрицу (чтобы последующие рисунки не искажались)
    ctx.restore();

    requestAnimationFrame(animate_rotation_frame);
}

function animate_rotation(i) {
    animate_rotation_variant_sign = Math.random() >= 0.5 ? +1 : -1;
    animate_rotation_vertex = i;
        enviroment_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    animated_start_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    animated_ended_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    
    builds_offcsreen_canvas(ROOT,  i,     enviroment_canvas.getContext('2d'));
    builds_offcsreen_canvas(i   , -1, animated_start_canvas.getContext('2d'));
    

    // рисуем коробки для вращающихся элементов [ для ЭПИЧНОСТИ))) ]
    draw_boxes(i, animated_start_canvas.getContext('2d'));

    // зеркалим поддерево на i-ой вершине
    let x_centre = (SubtreeBorders[i].x1 + SubtreeBorders[i].x2) / 2;
    animate_rotation_x_centre = x_centre;
    recurse_mirroring(i, x_centre);
    builds_offcsreen_canvas(i   , -1, animated_ended_canvas.getContext('2d'));
    

    // рисуем коробки для вращающихся элементов [ для ЭПИЧНОСТИ))) ]
    draw_boxes(i, animated_ended_canvas.getContext('2d'));

    // чё сама анимация?? неее
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(enviroment_canvas, 0, 0);

    animate_rotation_start_time = -1;
    requestAnimationFrame(animate_rotation_frame);
}


// ПЕРЕМЕЩЕНИЕ
let animate_permutation_start_time = -1;
let animate_permutation_block_canvas;
let animate_permutation_blck_lft_pos;
let animate_permutation_blck_rht_pos;
let animate_permutation_blck_dx;
let animate_permutation_vrtx_dx;
let animate_permutation_vertex;
let animate_permutation_prv;

function animate_permutation_frame(currT) {
    if( animate_permutation_start_time == -1 ) animate_permutation_start_time = currT;

    ctx.clearRect(0, 0, topCanvas.width, topCanvas.height);

    let pr = animate_permutation_prv;

    let dT = currT - animate_permutation_start_time;

    
    // console.log(`dT ding! : ${dT}`);
    

    if( dT > AnimeTime ) {
        // ФИНАЛЬНЫЙ КАДР
        for(let i = animate_permutation_blck_lft_pos; i <= animate_permutation_blck_rht_pos; i++) {
            draw_edge(pr, currStepChilds[pr][i]);
        }
        draw_edge(pr, animate_permutation_vertex);
        ctx.drawImage(    enviroment_canvas, 0, 0);
        ctx.drawImage(animated_ended_canvas, 0, 0);
        return;
    }


    // БЛОК
    let curr_blck_dx = animate_permutation_blck_dx * dT/AnimeTime;

    // console.log(`dx: ${curr_blck_dx} / ${animate_permutation_blck_dx}`);
    
    let px = Xcoords[pr], py = dY*(Ylvl[pr]+1);
    // рисование ребер к блоку
    for(let i = animate_permutation_blck_lft_pos; i <= animate_permutation_blck_rht_pos; i++) {
        let nxt = currStepChilds[pr][i];
        // рисование с измененными Xcoords (поэтому такой странный xx)
        let xx = Xcoords[nxt] - animate_permutation_blck_dx + curr_blck_dx, yy = dY*(Ylvl[nxt]+1);
        draw_segment(px, py, xx, yy);
    }
    
    // рисование ФОНА
    ctx.drawImage(enviroment_canvas, 0, 0);

    // рисование БЛОКА
    ctx.drawImage(animate_permutation_block_canvas, curr_blck_dx, 0);


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


    // рисование ребера к поддереву
    let xx = Xcoords[animate_permutation_vertex] + animate_permutation_vrtx_dx, yy = dY*(Ylvl[animate_permutation_vertex]+1);
    draw_segment(px, py, xx + sbtr_shift_x, yy + sbtr_shift_y);
    draw_vertex_label(pr);

    // рисование поддерева
    ctx.drawImage(animated_start_canvas, sbtr_shift_x, sbtr_shift_y);
    

    // ctx.drawImage(enviroment_canvas, 0, 300);
    // ctx.drawImage(animate_permutation_block_canvas, 0, 300);

    requestAnimationFrame(animate_permutation_frame);
}

function animate_permutation(i, new_pos_in_childs) {
    let prv = Prev[i];
    animate_permutation_vertex = i;
    animate_permutation_prv    = prv;
    let cur_pos_in_childs = 0;
    while( currStepChilds[prv][cur_pos_in_childs] != i ) cur_pos_in_childs++;

    console.log('PERMUTATION: ', cur_pos_in_childs , ' -> ', new_pos_in_childs);

    // НЕ МЕНЯЮЩИЙСЯ ФОН
    enviroment_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    builds_offcsreen_canvas(ROOT, prv, enviroment_canvas.getContext('2d'));

    if( prv != ROOT ) {
        draw_edge(Prev[prv],   prv , enviroment_canvas.getContext('2d'));
        draw_vertex_label(Prev[prv], enviroment_canvas.getContext('2d'));
    }

    let lft_pos = Math.min(cur_pos_in_childs, new_pos_in_childs), rht_pos = Math.max(cur_pos_in_childs, new_pos_in_childs);
    for(let j = 0; j < currStepChilds[prv].length; j++) {
        if( j == lft_pos ) j = rht_pos + 1;
        if( j >=  currStepChilds[prv].length ) continue;

        let nxt = currStepChilds[prv][j];
        draw_edge(prv, nxt, enviroment_canvas.getContext('2d'));
        builds_offcsreen_canvas(nxt, -1, enviroment_canvas.getContext('2d'));
    }
    draw_vertex_label(prv, enviroment_canvas.getContext('2d'));
    

    // САМО ПЕРЕДВИГАЕМОЕ ПОДДЕРЕВО
    animated_start_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    builds_offcsreen_canvas(i, -1, animated_start_canvas.getContext('2d'));
    

    // ПЕРЕДВИГАЕМЫЙ БЛОК
    // индексы блока
    let blck_lft_pos = lft_pos, blck_rht_pos = rht_pos;
    if( currStepChilds[prv][blck_lft_pos] == i ) blck_lft_pos++;
    else                                         blck_rht_pos--;

    
    console.log(`parent:  ${prv}`);
    console.log(`block:  [${blck_lft_pos}, ${blck_rht_pos}]`);
    console.log(`i:       ${i}`);

    animate_permutation_block_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    for(let j = blck_lft_pos; j <= blck_rht_pos; j++) {
        let nxt = currStepChilds[prv][j];
        builds_offcsreen_canvas(nxt, -1, animate_permutation_block_canvas.getContext('2d'));
    }

    // рисуем коробки для анимированных элементов [ для ЭПИЧНОСТИ))) ]
    // СДЕЛАТЬ ТУТ РАЗНЫЕ ЦВЕТА У КОРОБОК
    for(let j = blck_lft_pos; j <= blck_rht_pos; j++) {
        let nxt = currStepChilds[prv][j];
        draw_boxes(nxt, animate_permutation_block_canvas.getContext('2d'), 0, COLORS.BLUE);
    }
    draw_boxes(i, animated_start_canvas.getContext('2d'), 0, COLORS.RED);

    

    // ИЗМЕНЕНИЯ
    let xx1 = SubtreeBorders[i].x1, xx2 = SubtreeBorders[i].x2;
    let bx1 = SubtreeBorders[currStepChilds[prv][blck_lft_pos]].x1, bx2 = SubtreeBorders[currStepChilds[prv][blck_rht_pos]].x2;

    // сдвинули блок
    let shift_block_dx = xx1 - bx1;
    let shift_vrtx_dx  = xx2 - bx2;
    if( cur_pos_in_childs > new_pos_in_childs ) {
        let tmp = shift_block_dx;
        shift_block_dx = shift_vrtx_dx;
        shift_vrtx_dx  = tmp;
    }
    
    animate_permutation_blck_dx = shift_block_dx;
    animate_permutation_vrtx_dx = shift_vrtx_dx;

    

    for(let j = blck_lft_pos; j <= blck_rht_pos; j++) {
        let nxt = currStepChilds[prv][j];
        recurse_shift(nxt, shift_block_dx);
    }
    // сдвинули "перетаскиваемое" поддерево
    recurse_shift(i, -shift_vrtx_dx);

    // меняем порядок детей
    // если (lft_pos != blck_lft_pos) - то "перетаскиваемое" поддерево в lft_pos
    let direction_blck_move = (lft_pos != blck_lft_pos) ? -1 : +1;
    if( lft_pos != blck_lft_pos ) {  // АХАХАХАХАХ, всё равно написал if, СТОЛЬКО ЭТот БАГ ИСКАл!!!!
        for(let j = blck_lft_pos; j <= blck_rht_pos; j++)
            currStepChilds[prv][j-1] = currStepChilds[prv][j];
        currStepChilds[prv][blck_rht_pos] = i;
    } else {  // АХХАХААХАХА в точности такой же if, до того как я решил его "исправить "
        for(let j = blck_rht_pos; j >= blck_lft_pos; j--)
            currStepChilds[prv][j+1] = currStepChilds[prv][j];
        currStepChilds[prv][blck_lft_pos] = i;
    }
    
    animate_permutation_blck_lft_pos = blck_lft_pos + direction_blck_move;
    animate_permutation_blck_rht_pos = blck_rht_pos + direction_blck_move;
    
    console.log(`AFTER CHANGING: [${animate_permutation_blck_lft_pos}, ${animate_permutation_blck_rht_pos}]`);
    console.log(`CHILDS:`, currStepChilds);




    // ФИНАЛЬНАЯ КАРТИНКА
    animated_ended_canvas = new OffscreenCanvas(canvas.width, canvas.height);
    for(let j = lft_pos; j <= rht_pos; j++) {
        let nxt = currStepChilds[prv][j];
        builds_offcsreen_canvas(nxt, -1, animated_ended_canvas.getContext('2d'));
    }
    // КОРОБОКи
    for(let j = animate_permutation_blck_lft_pos; j <= animate_permutation_blck_rht_pos; j++) {
        let nxt = currStepChilds[prv][j];
        draw_boxes(nxt, animated_ended_canvas.getContext('2d'), 0, COLORS.BLUE);
    }
    draw_boxes(i, animated_ended_canvas.getContext('2d'), 0, COLORS.RED);


    // чё сама анимация?? неее
    animate_permutation_start_time = -1;
    requestAnimationFrame(animate_permutation_frame);
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





