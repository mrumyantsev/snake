const directions = {
    up: 1,
    right: 2,
    down: 3,
    left: 4
};

const newGameCode = -1;

const controlCodes = {
    13: newGameCode, // enter
    17: newGameCode, // ctrl
    27: newGameCode, // esc
    32: newGameCode, // space
    37: directions.left, // arrow left
    38: directions.up, // arrow up
    39: directions.right, // arrow right
    40: directions.down // arrow down
};

const defaultScore = 0;
const defaultSpeed = 4;

const cfg = {};

const loadConfig = () => {
    cfg.canvasWidth = 400;
    cfg.canvasHeight = 400;
    cfg.blockSize = 20;

    cfg.widthInBlocks = cfg.canvasWidth / cfg.blockSize;
    cfg.heightInBlocks = cfg.canvasHeight / cfg.blockSize;

    cfg.superElement = $("*");
    cfg.bodyElement = $("body");
    cfg.canvasElement = $("#canvas");

    cfg.canvas = document.getElementById("canvas");
    cfg.canvasContext = cfg.canvas.getContext("2d");

    cfg.apple;
    cfg.snake;
    cfg.engine;

    cfg.isGameContinues = true;
    cfg.score = defaultScore;
    cfg.speedMovesPerSecond = defaultSpeed;
};

applyStyles = () => {
    cfg.superElement.css({
        margin: 0,
        border: 0,
        padding: 0
    });

    cfg.canvas.width = cfg.canvasWidth;
    cfg.canvas.height = cfg.canvasHeight;
    
    cfg.canvasElement.css({
        position: "absolute",
        left: cfg.blockSize,
        top: cfg.blockSize,
        backgroundColor: "whitesmoke"
    });
};

class Block {
    #col = 0;
    #row = 0;

    /**
     * @return {number}
     */
    get col() {
        return this.#col;
    }

    /**
     * @return {number}
     */
    get row() {
        return this.#row;
    }

    /**
     * @param {number} value
     */
    set col(value) {
        this.#col = value;
    }

    /**
     * @param {number} value
     */
    set row(value) {
        this.#row = value;
    }

    constructor(col, row) {
        this.#col = col;
        this.#row = row;
    }

    drawSquare(color) {
        const ctx = cfg.canvasContext;
        const x = this.#col * cfg.blockSize;
        const y = this.#row * cfg.blockSize;

        ctx.fillStyle = color;

        ctx.fillRect(x, y, cfg.blockSize, cfg.blockSize);
    }

    equals(otherBlock) {
        return this.#col === otherBlock.col && this.#row === otherBlock.row;
    }
};

class Snake {
    #positions = [];
    #direction = directions.right;
    #nextDirection = directions.right;
    #snakeColor = "Blue";

    /**
     * @return {Block[]}
     */
    get positions() {
        return this.#positions;
    }

    /**
     * @param {number} value
     */
    set nextDirection(value) {
        if (this.#direction === directions.up && value === directions.down)
            return;
        else if (this.#direction === directions.right && value === directions.left)
            return;
        else if (this.#direction === directions.down && value === directions.up)
            return;
        else if (this.#direction === directions.left && value === directions.right)
            return;
        
        this.#nextDirection = value;
    }

    constructor() {
        // Place the Snake in positions: [5, 5], [6, 5], [7, 5].
        for (let i = 8; i > 5; i--)
            this.#positions.push(new Block(i, 5));
    }

    draw() {
        for (let i = 0; i < this.#positions.length; i++)
            this.#positions[i].drawSquare(this.#snakeColor)
    }

    move() {
        const head = this.#positions[0];

        let newCol = 0;
        let newRow = 0;

        this.#direction = this.#nextDirection;

        if (this.#direction === directions.right) {
            newCol = head.col + 1;
            newRow = head.row;
        } else if (this.#direction === directions.down) {
            newCol = head.col;
            newRow = head.row + 1;
        } else if (this.#direction === directions.left) {
            newCol = head.col - 1;
            newRow = head.row;
        } else if (this.#direction === directions.up) {
            newCol = head.col;
            newRow = head.row - 1;
        }

        const newHead = new Block(newCol, newRow);

        if (this.#checkWallCollision(newHead) ||
            this.#checkSelfCollision(newHead)) {
            cfg.isGameContinues = false;
            return;
        }

        this.#positions.unshift(newHead);

        if (this.#checkApple(newHead)) {
            cfg.score++;

            if (cfg.score % 10 === 0)
                cfg.speedMovesPerSecond++;

            cfg.apple.move();

            return;
        }

        this.#positions.pop();
    }

    #checkWallCollision(head) {
        const leftCollision = (head.col === 0);
        const topCollision = (head.row === 0);
        const rightCollision = (head.col === cfg.widthInBlocks - 1);
        const bottmCollision = (head.row === cfg.heightInBlocks - 1);

        return leftCollision || topCollision || rightCollision || bottmCollision;
    }

    #checkSelfCollision(head) {
        for (let i = 0; i < this.#positions.length; i++)
            if (head.equals(this.#positions[i]))
                return true;
        
        return false;
    }

    #checkApple(head) {
        const apple = cfg.apple;

        return head.equals(apple.position);
    }
};

class Apple {
    #position;
    #appleColor = "LimeGreen";

    /**
     * @return {Block}
     */
    get position() {
        return this.#position;
    }

    constructor() {
        this.move();
    }

    move() {
        while (true) {
            const randomCol = Math.floor(Math.random() * (cfg.widthInBlocks - 2)) + 1;
            const randomRow = Math.floor(Math.random() * (cfg.heightInBlocks - 2)) + 1;

            this.#position = new Block(randomCol, randomRow);

            if (this.#checkSnakeCollision())
                continue;
            
            break;
        }
    }

    #checkSnakeCollision() {
        const snake = cfg.snake;

        for (let i = 0; i < snake.positions.length; i++)
            if (this.#position.equals(snake.positions[i]))
                return true;

        return false;
    }

    draw() {
        this.#position.drawSquare(this.#appleColor);
    }
};

class Engine {
    static runningGameId = 0;

    #borderColor = "Gray";
    #gridColor = "White";
    #isNoListeners = true;
    #previousSpeed = 0;

    constructor() {
        cfg.engine = this;
    }

    run() {
        if (this.#isNoListeners) {
            this.#isNoListeners = false;
            this.#listenControlKeys();
        }
        
        this.#runNewGame();
    }

    #runNewGame() {
        if (Engine.runningGameId)
            clearInterval(Engine.runningGameId)

        cfg.isGameContinues = true;
        cfg.score = defaultScore;
        cfg.speedMovesPerSecond = defaultSpeed;

        this.#previousSpeed = defaultSpeed;

        cfg.snake = new Snake(cfg);
        cfg.apple = new Apple(cfg);
        
        this.#runFrames();
    }

    #runFrames() {
        Engine.runningGameId = setInterval(() => {this.#runFrame()}, 1000 / cfg.speedMovesPerSecond);
    }

    #runFrame() {
        this.#clearScreen();

        cfg.snake.move();
        cfg.snake.draw();
        cfg.apple.draw();

        this.#drawBorder();
        this.#drawGrid();
        this.#drawScore();
        this.#drawSpeed();

        if (cfg.speedMovesPerSecond !== this.#previousSpeed)
            this.#changeGameSpeed();

        if (!cfg.isGameContinues)
            this.#endGame();
    }

    #changeGameSpeed() {
        if (Engine.runningGameId)
            clearInterval(Engine.runningGameId);

        this.#previousSpeed = cfg.speedMovesPerSecond;
        
        this.#runFrames();
    }

    #clearScreen() {
        const ctx = cfg.canvasContext;

        ctx.clearRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);
    }

    #drawBorder() {
        const ctx = cfg.canvasContext;

        ctx.fillStyle = this.#borderColor;

        ctx.fillRect(0, 0, cfg.canvasWidth, cfg.blockSize);
        ctx.fillRect(0, cfg.blockSize, cfg.blockSize, cfg.canvasHeight - cfg.blockSize * 2);
        ctx.fillRect(cfg.canvasWidth - cfg.blockSize, cfg.blockSize, cfg.blockSize, cfg.canvasHeight - cfg.blockSize * 2);
        ctx.fillRect(0, cfg.canvasHeight - cfg.blockSize, cfg.canvasWidth, cfg.blockSize);
    }

    #drawGrid() {
        const ctx = cfg.canvasContext;
        const lineWidth = cfg.blockSize * 0.1;

        ctx.fillStyle = this.#gridColor;

        for (let i = 0; i < cfg.heightInBlocks; i++)
            ctx.fillRect(0, cfg.blockSize * i - lineWidth / 2, cfg.canvasWidth, lineWidth);
        
        for (let i = 0; i < cfg.widthInBlocks; i++)
            ctx.fillRect(cfg.blockSize * i - lineWidth / 2, 0, lineWidth, cfg.canvasHeight);
    }

    #drawScore() {
        this.#drawText("Score: " + cfg.score, cfg.blockSize, cfg.blockSize + 1, 20, "Black", "left", "top");
    }

    #drawSpeed() {
        this.#drawText("Speed: " + cfg.speedMovesPerSecond, cfg.blockSize * (cfg.widthInBlocks - 1), cfg.blockSize + 1, 20, "Red", "right", "top");
    }

    #drawText(text, x, y, fontSize, color, align, baseline) {
        const ctx = cfg.canvasContext;

        if (fontSize)
            ctx.font = fontSize + "px Consolas";

        if (align)
            ctx.textAlign = align;
        
        if (baseline)
            ctx.textBaseline = baseline;
        
        ctx.fillStyle = color;

        ctx.fillText(text, x, y);
    }

    #endGame() {
        clearInterval(Engine.runningGameId);

        Engine.runningGameId = 0;

        this.#drawText("Game Over", cfg.canvasWidth / 2, cfg.canvasHeight / 2 - 26, 60, "Black", "center", "top");
    }

    #listenControlKeys() {
        cfg.bodyElement.keydown(this.#keydownHandler);
    }

    #keydownHandler(event) {
        const control = controlCodes[event.keyCode];

        if (!control)
            return;
        
        if (control === newGameCode)
            cfg.engine.run();
        else if (control >= directions.up && control <= directions.left)
            cfg.snake.nextDirection = control;
    }
};

main = () => {
    loadConfig();
    applyStyles();

    const engine = new Engine();
    engine.run();
};

window.onload = main;
