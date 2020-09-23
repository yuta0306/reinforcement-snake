const SNAKES = document.getElementsByClassName('snake');
const FIELD = document.getElementsByClassName('field')[0];
const TARGET = document.getElementsByClassName('target')[0];
const START = document.getElementsByClassName('game_start')[0];
const END = document.getElementsByClassName('game_end')[0];
const RL = document.getElementsByClassName('rl')[0];
// const GEN = document.getElementsByClassName('generate')[0];
const DEMO = document.getElementsByClassName('demo')[0];
let dl;
const TIMES = document.getElementsByClassName('times')[0];
const PARAMS = document.getElementsByClassName('parameters')[0];
const REWARD = document.getElementsByClassName('reward')[0];
const SNAKE_SIZE = 20;
const TARGET_SIZE = 20;
const FIELD_SIZE = {
    height: FIELD.offsetHeight,
    width: FIELD.offsetWidth,
}
FIELD_SIZE.x = [FIELD.offsetLeft, FIELD.offsetLeft+FIELD_SIZE.width-SNAKE_SIZE];
FIELD_SIZE.y = [FIELD.offsetTop, FIELD.offsetTop+FIELD_SIZE.height-SNAKE_SIZE];
FIELD_SIZE.pixel_h = Math.floor(FIELD_SIZE.height/SNAKE_SIZE);
FIELD_SIZE.pixel_w = Math.floor(FIELD_SIZE.width/SNAKE_SIZE);

let state;
let flag;
let agent = null;
let count = 1;
let epoch = 1;

let snake_pos = {
    x: [],
    y: [],
}
let target_pos = {
    x: null,
    y: null,
}
let direction = {
    x: 1,
    y: 0,
}

// Agent class
class Agent {
    params = {
        // direction to move: [Left, Up, Right, Down]
        'L': [0.25, 0.25, 0.25, 0.25],
        'T': [0.25, 0.25, 0.25, 0.25],
        'R': [0.25, 0.25, 0.25, 0.25],
        'B': [0.25, 0.25, 0.25, 0.25],
    }
    params_index = {
        'ArrowLeft': 0,
        'ArrowUp': 1,
        'ArrowRight': 2,
        'ArrowDown': 3,
    }
    reward = -100;
    env = null;
    dist = 0;
    
    environ = (agent_pos, target_pos) => {
        let x = target_pos.x - agent_pos.x[0]
        let y = target_pos.y - agent_pos.y[0]
        let dist = Math.abs(x) + Math.abs(y);
        if ((Math.abs(x) > Math.abs(y)) && (x < 0)) this.env = "L"
        else if ((Math.abs(x) > Math.abs(y)) && (x > 0)) this.env = "R"
        else if ((Math.abs(x) < Math.abs(y)) && (y < 0)) this.env = "T"
        else if ((Math.abs(x) < Math.abs(y)) && (y > 0)) this.env = "B"

        return dist;
    }
    
    action = (keyaction) => {
        let movekey, proba;
        let params = this.params[this.env]
        let total = 0;
        let kevent;
        params.forEach(x => {
            total += x;
        });
        proba = Math.random() * total;
        if (proba < params[0]) movekey = "ArrowLeft"
        else if ((params[0] <= proba) && (proba < params[0]+params[1]))
            movekey = "ArrowUp"
        else if ((params[0]+params[1] <= proba) && proba < params[0]+params[1]+ params[2])
            movekey = "ArrowRight"
        else movekey = "ArrowDown"

        kevent = new KeyboardEvent("keydown", {key: movekey})
        if (keyaction) window.dispatchEvent(kevent);

        return this.params_index[movekey];
    }

    observe = (agent_pos, target_pos, goal) => {
        let new_dist, contrib, move;

        new_dist = this.environ(agent_pos, target_pos);
        move = this.action(true);

        if (new_dist < this.dist) {
            this.reward += 1;
            contrib = 0.01;
        }
        else {
            this.reward -= 3;
            contrib = -0.03;
        }

        if (goal) {
            this.reward += 30;
            contrib += 0.3;
        }

        this.params[this.env][move] += contrib;
        this.params[this.env][Math.floor(Math.random()*4)] -= contrib;

        for (let key of Object.keys(this.params)) {
            this.params[key] = this.params[key].map(x => Math.abs(x));
        }

        this.dist = new_dist;   
    }

    demo = (agent_pos, target_pos) => {
        this.environ(agent_pos, target_pos);
        this.action(true);
    }
}
// Agent class

let initialize = () => {
    let pos=0;
    let init_x = null;
    state;
    flag;
    snake_pos = {
        x: [],
        y: [],
    }
    direction = {
        x: 1,
        y: 0,
    }
    for (snake of SNAKES) {
        init_x = FIELD_SIZE.x[0] - SNAKE_SIZE*pos + SNAKE_SIZE*10;
        snake.style.left = init_x + "px";
        snake_pos.x.push(init_x);
        snake_pos.y.push(FIELD_SIZE.y[0]);
        pos++;
    }
}

let set_target = () => {
    target_pos.y = Math.floor(Math.random()*FIELD_SIZE.pixel_h) * TARGET_SIZE + FIELD_SIZE.y[0];
    target_pos.x =  Math.floor(Math.random()*FIELD_SIZE.pixel_w) * TARGET_SIZE + FIELD_SIZE.x[0];

    TARGET.style.top = target_pos.y + "px";
    TARGET.style.left = target_pos.x + "px";
}

let move = direction => {
    let new_pos = [];
    let tmp_pos = 0;
    new_pos.push(snake_pos.x[0] + SNAKE_SIZE*direction.x);
    snake_pos.x = new_pos.concat(snake_pos.x).slice(0, 10);
    
    new_pos = [];
    new_pos.push(snake_pos.y[0] + SNAKE_SIZE*direction.y);
    snake_pos.y = new_pos.concat(snake_pos.y).slice(0, 10);

    for (snake of SNAKES) {
        if (snake_pos.x[tmp_pos] > FIELD_SIZE.x[1]) snake_pos.x[tmp_pos] = FIELD_SIZE.x[0]
        else if (snake_pos.x[tmp_pos] < FIELD_SIZE.x[0]) snake_pos.x[tmp_pos] = FIELD_SIZE.x[1]
        else if (snake_pos.y[tmp_pos] > FIELD_SIZE.y[1]) snake_pos.y[tmp_pos] = FIELD_SIZE.y[0]
        else if (snake_pos.y[tmp_pos] < FIELD_SIZE.y[0]) snake_pos.y[tmp_pos] = FIELD_SIZE.y[1]

        snake.style.top = snake_pos.y[tmp_pos] + "px";
        snake.style.left = snake_pos.x[tmp_pos] + "px";
        tmp_pos++;
    }
}

let judge = () => {
    if ((target_pos.x <= snake_pos.x[0]+SNAKE_SIZE/2) && (snake_pos.x[0]+SNAKE_SIZE/2 <= target_pos.x+TARGET_SIZE)) {
        if ((target_pos.y <= snake_pos.y[0]+SNAKE_SIZE/2) && (snake_pos.y[0]+SNAKE_SIZE/2 <= target_pos.y+TARGET_SIZE))
            set_target();
            return true;
    }
    return false;
}

let play = () => {
    move(direction);
    judge();
}

let train = (agent, iter) => {
    move(direction);
    let goal = judge();
    agent.observe(snake_pos, target_pos, goal);
    PARAMS.innerHTML = 
        `L: ${agent.params.L}<br>T: ${agent.params.T}<br>R: ${agent.params.R}<br>B: ${agent.params.B}`;
    TIMES.innerHTML = `epoch: ${epoch}<br>iter: ${count} | max_iter: ${iter}`
    if (agent.reward < -200) REWARD.style.color = 'red';
    else REWARD.style.color = 'white';
    REWARD.innerHTML = `Reward: ${agent.reward}`;

    if (++count >= iter) {
        set_target();
        epoch++;
        count = 0;
    }
}

let demo = (agent) => {
    move(direction);
    judge();
    agent.demo(snake_pos, target_pos);
}


// Play this game
START.addEventListener('click', e => {
    if (!state) {
        END.value = 'Game End';
        initialize();
        set_target();
        state = true;
        flag = setInterval(() => play(), 100);
    }
})
END.addEventListener('click', e => {
    clearInterval(flag);
    state = false;
})
RL.addEventListener('click', e => {
    if (!state) {
        END.value = 'Stop Learning';
        // GEN.style.display = 'inline-block';
        agent = new Agent();
        initialize();
        set_target();
        state = true;
        flag = setInterval(() => train(agent, 1000), 10);
    }
})
// GEN.addEventListener('click', e => {
//     let blob = new Blob([JSON.stringify(agent.params)], {type: 'application/json'});
//     let link = window.URL.createObjectURL(blob);
//     dl = document.createElement("a");
//     dl.href = link;
//     dl.target = "_blank";
//     dl.download = "snake-params.json";
//     dl.innerText = "Download RL params";
//     document.getElementById("download").appendChild(dl);
// })
DEMO.addEventListener('click', e => {
    if (!state) {
        END.value = 'Stop Demo';
        // GEN.style.display = 'inline-block';
        initialize();
        set_target();
        state = true;
        flag = setInterval(() => demo(agent), 100);
    }
})

addEventListener('keydown', e => {
    if (e.key == 'ArrowLeft') {
        direction.x = -1;
        direction.y = 0;
    } else if (e.key == 'ArrowUp') {
        direction.x = 0;
        direction.y = -1;
    } else if (e.key == 'ArrowRight') {
        direction.x = 1;
        direction.y = 0;
    } else if (e.key == 'ArrowDown') {
        direction.x = 0;
        direction.y = 1;
    }
})