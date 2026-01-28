#include <set>
#include <vector>
#include <random>
#include <array>
using namespace std;


int random_int(int min, int max) {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    return std::uniform_int_distribution<>(min, max)(gen);
}

// ГРАФ !
int N;
vector<set<int>> adj;

void zero_topology(int n) {
    N = n;
    adj.clear();
    adj.resize(N);
}

void generate_random_topology(int n, int m) {
    zero_topology(n);

    set<pair<int,int>> was;

    // 1. делаем связанным (создаем дерево)
    for(int i = 1; i < N; i++) {
        int j = random_int(0, i-1);
        was.insert({j, i});
        m--;
        adj[i].insert(j);
        adj[j].insert(i);
    }


    // 2. удаляем приростки (вершины со степенью 1)
    vector<int> gr;
    vector<int> is_gr(N+1, 0);  // для упрощения if-ов добавим is_gr[N] = 0
    for(int i = 0; i < N; i++) {
        if( adj[i].size() <= 1 ) { gr.push_back(i); is_gr[i] = 1; }
    }
    random_shuffle(gr.begin(), gr.end());

    int cnt_gr = gr.size();
    while( cnt_gr ) {
        int a = N;
        while( !is_gr[a] ) {
            a = gr.back();
            gr.pop_back();
        }
        
        int b = N;
        if( cnt_gr > 1 && m-1 < cnt_gr/2 ) {  // надо соединять только отростки иначе буде больше чем m рёбер
            while( !is_gr[b] ) {
                b = gr.back();
                gr.pop_back();
            }
        } else { // берём рандомную вершину
            b = a;
            while( b == a || b == *adj[a].begin() ) b = random_int(0, N-1);
        }

        cnt_gr  -= is_gr[a];
        cnt_gr  -= is_gr[b];
        is_gr[a] = is_gr[b] = 0;

        if( a > b ) swap(a, b);
        was.insert({a,b});
        m--;
        adj[a].insert(b);
        adj[b].insert(a);
    }


    // 3. докидываем оставшиеся ребра
    while( m > 0 ) {
        int a = 0, b = 0;
        while( a == b || was.count({a,b}) ) {
            a = random_int(0, N-1), b = random_int(0, N-1);
            if( a > b ) swap(a, b);
        }
        was.insert({a,b});
        m--;
        adj[a].insert(b);
        adj[b].insert(a);
    }
}

// ФОРМАТ: n - число вершин, input = [{u1,v1}, ...] - массив рёбер
void load_topology(int n, vector<int> input) {
    zero_topology(n);
    
    for(int i = 0; i < input.size(); i += 2) {
        int u = input[i], v = input[i+1];
        adj[u].insert(v);
        adj[v].insert(u);
    }
}


// возвращает координаты (расставляет вершины на сетке NxN)
vector<pair<int, int>> random_reordering() {
    vector<pair<int, int>> xy(N);
    vector<bool> was(N*N);
    for(int i = 0; i < N; i++) {
        int x, y, id;
        do {
            x  = random_int(0, N-1);
            y  = random_int(0, N-1);
            id = x + N*y;
        } while( was[id] );
        was[id] = 1;
        xy [i]  = {x, y};
    }
    return xy;    
}

// возвращает координаты
vector<pair<int, int>> bfs_reordering(vector<int> u_start) {
    vector<bool> was(N); 
    for(auto u : u_start) was[u] = 1;
    vector<vector<int>> layers = { u_start };

    int h = 0;
    while( !layers[h].empty() ) {
        layers.push_back({});
        for(auto v : layers[h]) {
            for(auto j : adj[v])
                if( !was[j] ) {
                    was[j] = 1;
                    layers.back().push_back(j);
                }
        }
        h++;
    }

    int  maxl    = 0;
    bool chet[2] = {0, 0};
    for(int i = 0; i < h; i++) {
        chet[layers[i].size() % 2] |= 1;
        maxl = max(maxl, (int)layers[i].size());
    }

    vector<pair<int, int>> xy(N);
    int step = chet[0] + chet[1];
    for(int y = 0; y < h; y++) {
        int x = (maxl - layers[y].size()) / (3 - step);
        for(auto i : layers[y]) {
            xy[i] = {x, y};
            x += step;
        }
    }
     
    return xy;
}




// СИЛОВОЙ АЛГОРИТМ
vector<array<double, 2>> rxy;
vector<array<double, 2>> forces;
void load_real_cords(vector<double> xy) {
    rxy.resize(N);
    forces.resize(N);
    for(int i = 0; i < N; i++) {
        for(int t : {0, 1}) rxy[i][t]  = xy[2*i+t];
    }
}


void one_iteration() {
    for(int i = 0; i < N; i++) forces[i][0] = forces[i][1] = 0;

    double min_l2 = 100000;
    // парные силы
    for(int i = 0; i < N; i++) {
        for(int j = i+1; j < N; j++) {
            double dx = rxy[i][0] - rxy[j][0], dy = rxy[i][1] - rxy[j][1];
            double l2 = dx*dx + dy*dy;
            min_l2 = min(min_l2, l2);
            
            forces[i][0] += +100*dx/l2;
            forces[i][1] += +100*dy/l2;
            
            forces[j][0] += -100*dx/l2;
            forces[j][1] += -100*dy/l2;
        }
    }

    // силы по ребрам
    for(int i = 0; i < N; i++) {
        for(auto j : adj[i]) if( j > i ) {
            double dx = rxy[i][0] - rxy[j][0], dy = rxy[i][1] - rxy[j][1];
            double l2 = dx*dx + dy*dy;
            
            forces[i][0] += -dx/l2;
            forces[i][1] += -dy/l2;
            
            forces[j][0] += +dx/l2;
            forces[j][1] += +dy/l2;
        }
    }

    // смещение
    double max_f = 0, avg_ff[2] = {};
    for(int i = 0; i < N; i++) {
        max_f = max( {max_f, forces[i][0], forces[i][1]} );
        avg_ff[0] += abs(forces[i][0]);
        avg_ff[1] += abs(forces[i][1]);
    }

    double avg_f = min(avg_ff[0], avg_ff[1]) / N;

    // хотим чтобы max_f < 10
    double scaling = (max_f/avg_f < min_l2/10) ? min_l2*avg_f/(10*max_f) : 1.;

    for(int i = 0; i < N; i++) {
        for(int t : {0, 1}) rxy[i][t]  += scaling*forces[i][t];
    }
}



// ПОДГОТОВКА ФОРМАТА ДЛЯ коммуникации по webasm
vector<int> js_get_edges() {
    vector<int> edges;
    for(int i = 0; i < N; i++) {
        for(auto j : adj[i])
            if ( j > i ) {
                edges.push_back(i);
                edges.push_back(j);
            }
    }
    return edges;
}

// эхх,  нельзя у pair вызывать for(auto e : pair)
// template<typename R, template Cont>
// vector<R> jser(vector<Cont> ab) {
//     vector<R> r(2*ab.size());
//     for(int i = 0; auto [a, b] : ab) {
//         r[i++] = a;
//         r[i++] = b;
//     }
//     return r;
// }


vector<int> jser(vector<pair<int,int>> ab) {
    vector<int> r(2*ab.size());
    for(int i = 0; auto [a, b] : ab) {
        r[i++] = a;
        r[i++] = b;
    }
    return r;
}


vector<int> js_bfs_reordering(vector<int> u_start) { return jser(bfs_reordering(u_start));   }
vector<int> js_random_reordering()   { return jser(random_reordering()); }

vector<double> js_get_real_cords() { 
    vector<double> r(2*N);
    for(int i = 0; auto xy : rxy) for(int e : xy) r[i++] = e;
    return r; 
}


// вначале работы подключить emsdk: source ~/EMSCRIPTEN/emsdk/emsdk_env.sh
// компиляция: em++ --bind -O3 -s WASM=1 -s SINGLE_FILE=1 -s ENVIRONMENT='web' -o wasm.js g.cpp -Wc++20-extensions
#include <emscripten/bind.h>
using namespace emscripten;
EMSCRIPTEN_BINDINGS(my_module) {
    register_vector<int>("VectorInt");
    emscripten::function("cpp_zero_topology"           , &zero_topology);
    emscripten::function("cpp_generate_random_topology", &generate_random_topology);
    emscripten::function("cpp_load_topology"           , &load_topology);
    emscripten::function("cpp_get_edges"               , &js_get_edges);
    emscripten::function("cpp_bfs_reordering"          , &js_bfs_reordering);
    emscripten::function("cpp_random_reordering"       , &js_random_reordering);

    register_vector<double>("VectorDouble");
    emscripten::function("cpp_get_real_cords" , &js_get_real_cords);
    emscripten::function("cpp_load_real_cords", &load_real_cords);
    emscripten::function("cpp_one_iteration"  , &one_iteration);
}
