let canvas = document.getElementById("canvas");
let ctx    = canvas  .getContext('2d');

let R = 10, H = 50;
let shiftX = 50, shiftY = 50;

let alpha = 4;

let DARKEN = 0.8;

let covered    = -1;
let isdragging =  0;

let rects = [];
function inner_rects() {
    rects.push( {prev: -1, dx: 0, dy: 0, l: 500, h: 400} );

    rects.push( {prev:  0, dx:   5, dy: 65, l: 300, h: 135} );
    rects.push( {prev:  1, dx:  20, dy: 15, l: 100, h: 105} );
    rects.push( {prev:  1, dx: 135, dy: 15, l:  50, h: 105} );
    rects.push( {prev:  1, dx: 210, dy: 15, l:  25, h: 105} );
    
    rects.push( {prev:  0, dx:  75, dy: 215, l: 250, h: 155} );
    rects.push( {prev:  5, dx:  15, dy:  15, l: 130, h: 125} );
    rects.push( {prev:  5, dx: 160, dy:  15, l:  75, h: 125} );

    rects.push( {prev:  0, dx: 350, dy:  40, l: 125, h: 310} );
    rects.push( {prev:  8, dx:  10, dy:  15, l:  85, h:  60} );
    rects.push( {prev:  8, dx:  25, dy:  90, l:  95, h: 170} );
    rects.push( {prev: 10, dx:  10, dy:  15, l:  25, h:  75} );
    rects.push( {prev: 10, dx:  40, dy:  65, l:  25, h:  75} );
}

let childs = [];
let pos_in_childs = [];
function consturct_childs() {
    let n = rects.length;
    for(let i = 0; i < n; i++) childs.push( [] );

    for(let i = 1; i < n; i++) {
        let prev = rects[i].prev;
        pos_in_childs[i] = childs[prev].length;
        childs[prev].push(i);
    }
}

// сделать, чтобы вершины инцидентные этой ветке была первыми в списке смежности (childs) своих родителей
function push_branch(i) {
    let prev = rects[i].prev;

    while( prev != -1 ) {
        // swap-аем
        let pos_i = pos_in_childs[i];
        let i0 = childs[prev][0];

        pos_in_childs[i0] = pos_i;
        childs[prev][pos_i] = i0;

        pos_in_childs[i]  = 0;
        childs[prev][0] = i;

        i    = prev;
        prev = rects[i].prev;
    }
}

inner_rects();
consturct_childs();

let OUTER_id = -1;

function draw_rect(i, x, y, h, dwx, dwy = 0, skip = -1, darkenFactor = 1) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dwx, y + dwy);
    ctx.lineTo(x + dwx, y + dwy + h);
    ctx.lineTo(x, y + h);
    
    // if( i == OUTER_id ) {  // объемлющий прямоугольник
    //     ctx.fillStyle = '#d78c14';
    //     // darkenFactor = 1.1;
    //     // const rr = 25, gg = 207, bb = 89;
    //     // ctx.fillStyle = `rgb(${Math.floor(rr * darkenFactor)}, ${Math.floor(gg * darkenFactor)}, ${Math.floor(bb * darkenFactor)}, 1)`;
   
    // } else 
        {
        // Затемнение на 20%
        // let darkenFactor = (i == covered) ? 0.5 : 1;
        const rr = 25, gg = 207, bb = 89;
        ctx.fillStyle = `rgb(${Math.floor(rr * darkenFactor)}, ${Math.floor(gg * darkenFactor)}, ${Math.floor(bb * darkenFactor)}, 1)`;
    }


    ctx.closePath();

    // граница
    if( skip == 0 ) {  // без левой границы
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dwx, y + dwy);
        ctx.lineTo(x + dwx, y + dwy + h);
        ctx.lineTo(x, y + h);
        // ctx.closePath();
    }
    if( skip == 1 ) {  // без правой гранциы
        ctx.beginPath();
        ctx.moveTo(x + dwx, y + dwy + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dwx, y + dwy);
        // ctx.closePath();
    }

    // ctx.fillStyle = 'rgba(25, 207, 89, 1)';
    ctx.strokeStyle = 'black';
    // ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
}

function recurse_draw(i, x, y, except, darkenFactor = 1) {
    if( i == LBM_select ) return;

    if( i == except ) {
        back_drawing(except, drag_ratiox * rects[covered].l/2, dragging_Xc, dragging_Yc);
        return;
    }

    if( i == covered ) darkenFactor = DARKEN;
    draw_rect(i, x, y, rects[i].h, rects[i].l, 0, -1, darkenFactor);

    for(let j of childs[i]) recurse_draw(j, x + rects[j].dx, y + rects[j].dy, except, darkenFactor);
}


let MOUSEX = 0, MOUSEY = 0;

let LBM_initX, LBM_initY;
let LBM_idx, LBM_idy;
let LBM_select = -1;

let dragging_Xc, dragging_Yc;
function redraw(except = -1, need_clear = 1, extra = -1) {
    // Очистка холста
    if( need_clear ) ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    recurse_draw(0, shiftX, shiftY, except);

    // if( extra != -1 )  // пока тут, чтобы таску сдать
    //     back_drawing(extra, rects[covered].l/4, dragging_Xc, dragging_Yc);


    // ПЕРЕТАСКИВАЕМЫЙ объект
    if( LBM_select != -1 ) {  
        console.log('redraw from: ', LBM_select);

        // тоже пока коряво лишь бы закрыть таску
        let tmp = LBM_select;
        LBM_select = -1;

        recurse_draw(tmp, MOUSEX + LBM_idx, MOUSEY + LBM_idy, except);
        
        LBM_select = tmp;
    }

    // ПЕРЕВОРАЧИВАЕМЫЙ объект
    if( extra != -1 ) //front_drawing(extra, XX, XC, YC); 
        front_drawing(extra, drag_ratiox * rects[covered].l/2, dragging_Xc, dragging_Yc);
}
redraw();


function back_drawing(i, xx, Xc, Yc) {
    let b  = rects[i].l/2;
    let yy = Math.sqrt( (b*b - xx*xx) / alpha );

    // "чекпоинт"
    ctx.save();

    // Клип: только область НИЖЕ y=H (там где должна быть видна часть A)
    ctx.beginPath();
    ctx.rect(0, Yc - rects[i].dy, canvas.width, canvas.height);
    ctx.clip();

    // console.log('CLIP: ', Yc, ' - ', rects[i].dy);
    
    draw_rect(i, Xc-xx, Yc-yy, rects[i].h, xx, yy, 1, DARKEN);
    
    for(let j of childs[i]) inner_back_drawing(j);

    // Восстанавливаем
    ctx.restore();
}


function inner_back_drawing(j, driftu = 0, driftv = 0) {
    let b  = rects[covered].l/2;
    let ul = rects[j].dx - b + driftu, ur = ul + rects[j].l;

    if( drag_start_side == -1 ) {
        let tmp = ul;
        ul = -ur;
        ur = -tmp;
    }

    if( ul > 0 ) {
        // лол убираем выход тут потому что не понятно как расположенны блоки
        // return;
    } else {
        let type_cutting = -1;
        if( ur > 0 ) {
            ur = 0;
            type_cutting = 1;
        }

        let curl = ur-ul;

        // тут ul, а не ur! (по сути контур в draw_rect рисуется в другую сторону)
        let x1 = drag_ratiox * ul, y1 = drag_ratioy * ul;
        let dwx = drag_ratiox*curl, dwy = drag_ratioy*curl;
        
        draw_rect(j, dragging_Xc + x1, dragging_Yc + 1*(driftv + y1 + rects[j].dy) , rects[j].h, dwx, dwy, type_cutting, DARKEN);
    }

    for(let jj of childs[j]) inner_back_drawing(jj, driftu + rects[j].dx, driftv + rects[j].dy);
}


function front_drawing(i, xx, Xc, Yc) {
    let b  = rects[i].l/2;
    let yy = Math.sqrt( (b*b - xx*xx) / alpha );

    draw_rect(i, Xc, Yc, rects[i].h, xx, yy, 0, DARKEN);

    for(let j of childs[i]) inner_front_drawing(j);
}

function inner_front_drawing(j, driftu = 0, driftv = 0) {
    let b  = rects[covered].l/2;
    let ul = rects[j].dx - b + driftu, ur = ul + rects[j].l;

    if( drag_start_side == -1 ) {
        let tmp = ul;
        ul = -ur;
        ur = -tmp;
    }

    if( ur < 0 ) {
        // лол убираем выход тут потому что не понятно как расположенны блоки
        // return;
    } else {
        let type_cutting = -1;
        if( ul < 0 ) {
            ul = 0;
            type_cutting = 0;
        }

        let curl = ur-ul;

        let x1 = drag_ratiox * ul, y1 = drag_ratioy * ul;
        let dwx = drag_ratiox*curl, dwy = drag_ratioy*curl;

        draw_rect(j, dragging_Xc + x1, dragging_Yc + 1*(driftv + y1 + rects[j].dy), rects[j].h, dwx, dwy, type_cutting, DARKEN);
    }

    for(let jj of childs[j]) inner_front_drawing(jj, driftu + rects[j].dx, driftv + rects[j].dy);
}



function recurse_mirroring(i) {
    for(let j of childs[i]) {
        rects[j].dx = rects[i].l - rects[j].l - rects[j].dx;
        recurse_mirroring(j);
    }
}



function init() {
    canvas.addEventListener('contextmenu', handleContextMenu);

    canvas.addEventListener('mousemove'  , handleMouseMove  );
    
    canvas.addEventListener('mousedown'  , handleMouseDown  );
    // // !!! НА ЦЕЛЫЙ ДОКУМЕНТ
    document.addEventListener('mouseup'  , handleMouseUp    );

    canvas.style.cursor = 'crosshair';
}
init();



// Получение координат мыши
function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    MOUSEX = event.clientX - rect.left;
    MOUSEY = event.clientY - rect.top;
    return { x: MOUSEX, y: MOUSEY };
}

// ЛКМ - перетаскивание
// ПКМ - разворот
// let LBM_pressed = 0, RBM_pressed = 0; 
// RBM_pressed - по сути не нужно, т.к. в текущем коде isdragging отвечает за это же самое



// не показывать контекстное меню на вершины
function handleContextMenu(event) {
    // if( coveredVertex != -1 ) 
        event.preventDefault();
}

let drag_start_side;
let drag_ratiox, drag_ratioy;
let drag_mouse_dX;
function handleMouseDown(event) {
    if( event.button == 0 ) { // ЛКМ
        if( covered == -1 ) return;

        LBM_select = covered;
        console.log('click on: ', LBM_select);

        let {x, y} = getMousePos(event);
        LBM_initX = x; LBM_initY = y;

        LBM_idx = coveredX1 - x; LBM_idy = coveredY1 - y;

        console.log('idx, iwy: ', LBM_idx, ' ', LBM_idy);

        covered = rects[LBM_select].prev;
        coveredX1 -= rects[LBM_select].dx;
        coveredY1 -= rects[LBM_select].dy;
        redraw();
    }

    if( event.button == 2 ) { // ПКМ
        if( covered == -1 ) return;

        canvas.style.cursor = 'ew-resize';
        isdragging = 1;

        push_branch(covered);

        dragging_Xc = coveredX1 + rects[covered].l/2;
        dragging_Yc = coveredY1;

        {
            console.log('drag: ', covered);
            console.log('X1: ', coveredX1, '  Y1: ', coveredY1);
        }
        
        let {x, y} = getMousePos(event);
        drag_mouse_dX = -Math.abs(dragging_Xc - x);

        
        drag_ratiox = drag_start_side = x > dragging_Xc ? +1 : -1;
        drag_ratioy = 0;
        console.log('drag ratio: ', drag_ratiox, ' ', drag_ratioy);
    }
}

function handleMouseUp(event) {
    if( event.button == 0 ) { // ЛКМ
        if( LBM_select == -1 ) return;
        if( covered == -1 ) {
            covered = LBM_select;
            coveredX1 += rects[LBM_select].dx;
            coveredY1 += rects[LBM_select].dy;
            LBM_select = -1;
            redraw();
            return;
        }

        console.log('end move on: ', covered);
        
        if( rects[LBM_select].prev != covered ) {  // переподвешиваем вершину
            let prev = rects[LBM_select].prev;
            let pos  = pos_in_childs[LBM_select];

            let last_child = childs[prev].pop();
            if( last_child != LBM_select ) {
                childs[prev][pos] = last_child;
                pos_in_childs[last_child] = pos;
                console.log('swap childs: ', LBM_select, ' <- ', last_child);
            }

            rects[LBM_select].prev = covered;
            pos_in_childs[LBM_select] = childs[covered].length;
            childs[covered].push(LBM_select);
            console.log('rebranch from: ', prev, ' to: ', covered);

        }   
        
        // задаём новые сдвиги dx dy
        rects[LBM_select].dx = MOUSEX - coveredX1 + LBM_idx;
        rects[LBM_select].dy = MOUSEY - coveredY1 + LBM_idy;

        covered = LBM_select;
        coveredX1 += rects[LBM_select].dx;
        coveredY1 += rects[LBM_select].dy;

        LBM_select = -1;
        
        redraw();
    }

    if( event.button == 2 ) { // ПКМ
        if( isdragging ) {
            isdragging = 0;

            let {x, y} = getMousePos(event);

            let drag_end_side = x > dragging_Xc ? +1 : -1;
            if( drag_start_side != drag_end_side ) { // отражение
                recurse_mirroring(covered);

                // пересчёт текущего покрытого прямоуг.
                covered = whichCover(x - shiftX, y - shiftY, shiftX, shiftY);
            
                if( covered != -1 ) {
                    console.log('covered: ', covered);
                    console.log('X1: ', coveredX1, '  Y1: ', coveredY1);
                    OUTER_id = rects[covered].prev;
                } else {
                    OUTER_id = -1;
                }
                // А может всё таки просто:  ?? profit
                // handleMouseMove(event);
            }
            
            canvas.style.cursor = (covered != -1) ? 'move' : 'crosshair';
            redraw();
            
        }
    }
}

let coveredX1, coveredY1;
function whichCover(x, y, xreal, yreal, i = 0, except = LBM_select) {
    if( i == except ) return -1;

    let cur_ans = i;
    if( x < 0 || x > rects[i].l || y < 0 || y > rects[i].h ) {
        cur_ans = -1;
        
        // лол убираем выход тут потому что не понятно как расположенны блоки
        // return -1;
    }

    // предпочитаем результат потомков
    for(let j of childs[i]) {
        let v = whichCover(x - rects[j].dx, y - rects[j].dy, xreal+rects[j].dx, yreal+rects[j].dy, j);
        if( v != -1 ) return v;
    }
    coveredX1 = xreal;
    coveredY1 = yreal;
    return cur_ans;
}


let trancate_up = 30;

let selected = -1;
function handleMouseMove(event) {
    let {x, y} = getMousePos(event);

    if( isdragging ) {  // РАЗВОРОТ ПРЯМОУГОЛЬНИКА
        let {x, y} = getMousePos(event);
        drag_ratiox = (dragging_Xc - x) / drag_mouse_dX;
        if( drag_ratiox > +1 ) drag_ratiox = +1;
        if( drag_ratiox < -1 ) drag_ratiox = -1;

        drag_ratioy = Math.sqrt( (1 - drag_ratiox*drag_ratiox) / alpha );

        console.log('drag ratio: ', drag_ratiox, ' ', drag_ratioy);

        redraw(covered, 1, covered);

        return;
    }

    // if( LBM_select != -1 ) {
    //     console.log('moving: ', LBM_select);
    //     redraw();
    //     return;    
    // }

    covered = whichCover(x - shiftX, y - shiftY, shiftX, shiftY);
    
    
    // Подсветка вершин при наведении
    canvas.style.cursor = (covered != -1) ? 'move' : 'crosshair';
    // 'ew-resize'

    if( covered != -1 ) {
        console.log('covered: ', covered);
        console.log('X1: ', coveredX1, '  Y1: ', coveredY1);   

        OUTER_id = rects[covered].prev;
    } else {
        OUTER_id = -1;
    }
    
    redraw();
}
