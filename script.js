document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const elementos = {
        canvas: document.getElementById('game-canvas'),
        score: document.getElementById('score'),
        gameTime: document.getElementById('game-time'),
        finalScore: document.getElementById('final-score'),
        finalTime: document.getElementById('final-time'),
        soundBtn: document.getElementById('sound-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        restartBtn: document.getElementById('restart-btn'),
        gameOverScreen: document.getElementById('game-over'),
        playAgainBtn: document.getElementById('play-again'),
        overlay: document.getElementById('overlay'),
        upBtn: document.getElementById('up-btn'),
        downBtn: document.getElementById('down-btn'),
        leftBtn: document.getElementById('left-btn'),
        rightBtn: document.getElementById('right-btn')
    };

    // Contexto do canvas
    const ctx = elementos.canvas.getContext('2d');
    const gridSize = 20;
    const tileCountX = elementos.canvas.width / gridSize;
    const tileCountY = elementos.canvas.height / gridSize;
    
    // Estado do jogo
    const estadoJogo = {
        snake: [{x: 10, y: 10}],
        food: {x: 5, y: 5},
        direction: 'right',
        nextDirection: 'right',
        score: 0,
        highScore: localStorage.getItem('snakeHighScore') || 0,
        gameSpeed: 100,
        gameLoop: null,
        isPaused: false,
        isGameOver: false,
        somAtivado: true,
        gameStartTime: null,
        currentTime: '00:00',
        timerInterval: null
    };

    // Sons
    const sons = {
        eat: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3'),
        gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-lose-2027.mp3')
    };

    // Inicializa o jogo
    function iniciarJogo() {
        estadoJogo.snake = [{x: 10, y: 10}];
        estadoJogo.direction = 'right';
        estadoJogo.nextDirection = 'right';
        estadoJogo.score = 0;
        estadoJogo.isPaused = false;
        estadoJogo.isGameOver = false;
        estadoJogo.gameSpeed = 100;
        
        elementos.score.textContent = estadoJogo.score;
        elementos.gameOverScreen.classList.add('hidden');
        elementos.overlay.classList.add('hidden');
        
        gerarComida();
        desenharJogo();
        
        if (estadoJogo.gameLoop) {
            clearInterval(estadoJogo.gameLoop);
        }
        
        // Inicia o timer
        estadoJogo.gameStartTime = Date.now();
        if (estadoJogo.timerInterval) clearInterval(estadoJogo.timerInterval);
        estadoJogo.timerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Atualiza imediatamente
        
        estadoJogo.gameLoop = setInterval(jogoPrincipal, estadoJogo.gameSpeed);
    }

    // Loop principal do jogo
    function jogoPrincipal() {
        if (estadoJogo.isPaused || estadoJogo.isGameOver) return;
        
        atualizarSnake();
        verificarColisao();
        desenharJogo();
    }

    // Atualiza a posição da cobra
    function atualizarSnake() {
        // Atualiza a direção
        estadoJogo.direction = estadoJogo.nextDirection;
        
        // Cabeça da cobra
        const head = {x: estadoJogo.snake[0].x, y: estadoJogo.snake[0].y};
        
        // Move a cabeça baseado na direção
        switch(estadoJogo.direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // Verifica se saiu dos limites (causa game over)
        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            gameOver();
            return;
        }
        
        // Adiciona nova cabeça
        estadoJogo.snake.unshift(head);
        
        // Verifica se comeu a comida
        if (head.x === estadoJogo.food.x && head.y === estadoJogo.food.y) {
            comerComida();
        } else {
            // Remove a cauda se não comeu
            estadoJogo.snake.pop();
        }
    }

    // Verifica colisões
    function verificarColisao() {
        const head = estadoJogo.snake[0];
        
        // Colisão com o próprio corpo
        for (let i = 1; i < estadoJogo.snake.length; i++) {
            if (head.x === estadoJogo.snake[i].x && head.y === estadoJogo.snake[i].y) {
                gameOver();
                return;
            }
        }
    }

    // Gera comida em posição aleatória dentro dos limites
    function gerarComida() {
        // Garante que a comida fique dentro dos limites visíveis
        estadoJogo.food = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        
        // Verifica se a comida não apareceu em cima da cobra
        for (let segment of estadoJogo.snake) {
            if (segment.x === estadoJogo.food.x && segment.y === estadoJogo.food.y) {
                gerarComida();
                return;
            }
        }
    }

    // Quando a cobra come a comida
    function comerComida() {
        estadoJogo.score += 10;
        elementos.score.textContent = estadoJogo.score;
        
        // Gera nova comida imediatamente
        gerarComida();
        
        // Aumenta a velocidade a cada 50 pontos
        if (estadoJogo.score % 50 === 0 && estadoJogo.gameSpeed > 50) {
            estadoJogo.gameSpeed -= 5;
            clearInterval(estadoJogo.gameLoop);
            estadoJogo.gameLoop = setInterval(jogoPrincipal, estadoJogo.gameSpeed);
        }
        
        tocarSom(sons.eat);
    }

    // Desenha o jogo no canvas
    function desenharJogo() {
        // Obtém as cores das variáveis CSS
        const rootStyles = getComputedStyle(document.documentElement);
        const bgColor = rootStyles.getPropertyValue('--bg').trim();
        const snakeColor = rootStyles.getPropertyValue('--snake').trim();
        const highlightColor = rootStyles.getPropertyValue('--highlight').trim();
        const foodColor = rootStyles.getPropertyValue('--food').trim();
        
        // Limpa o canvas
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, elementos.canvas.width, elementos.canvas.height);
        
        // Desenha a cobra
        ctx.fillStyle = snakeColor;
        for (let segment of estadoJogo.snake) {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize-2, gridSize-2);
        }
        
        // Desenha a cabeça diferente
        const head = estadoJogo.snake[0];
        ctx.fillStyle = highlightColor;
        ctx.fillRect(head.x * gridSize, head.y * gridSize, gridSize-2, gridSize-2);
        
        // Desenha a comida
        ctx.fillStyle = foodColor;
        ctx.beginPath();
        ctx.arc(
            estadoJogo.food.x * gridSize + gridSize/2, 
            estadoJogo.food.y * gridSize + gridSize/2, 
            gridSize/2 - 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }

    // Atualiza o timer do jogo
    function updateTimer() {
        const elapsed = Math.floor((Date.now() - estadoJogo.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        estadoJogo.currentTime = `${minutes}:${seconds}`;
        elementos.gameTime.textContent = estadoJogo.currentTime;
    }

    // Game over
    function gameOver() {
        estadoJogo.isGameOver = true;
        clearInterval(estadoJogo.gameLoop);
        clearInterval(estadoJogo.timerInterval);
        
        // Atualiza high score
        if (estadoJogo.score > estadoJogo.highScore) {
            estadoJogo.highScore = estadoJogo.score;
            localStorage.setItem('snakeHighScore', estadoJogo.highScore);
        }
        
        elementos.finalScore.textContent = estadoJogo.score;
        elementos.finalTime.textContent = estadoJogo.currentTime;
        elementos.gameOverScreen.classList.remove('hidden');
        elementos.overlay.classList.remove('hidden');
        
        tocarSom(sons.gameOver);
    }

    // Pausa/despausa o jogo
    function alternarPausa() {
        estadoJogo.isPaused = !estadoJogo.isPaused;
        elementos.pauseBtn.innerHTML = estadoJogo.isPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
    }

    // Alterna som
    function alternarSom() {
        estadoJogo.somAtivado = !estadoJogo.somAtivado;
        elementos.soundBtn.innerHTML = estadoJogo.somAtivado ? 
            '<i class="fas fa-volume-up"></i> Som' : 
            '<i class="fas fa-volume-mute"></i> Som';
    }

    // Toca som
    function tocarSom(som) {
        if (estadoJogo.somAtivado) {
            som.currentTime = 0;
            som.play().catch(e => console.log("Erro ao reproduzir som:", e));
        }
    }

    // Event Listeners para teclado
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
                if (estadoJogo.direction !== 'down') estadoJogo.nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (estadoJogo.direction !== 'up') estadoJogo.nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (estadoJogo.direction !== 'right') estadoJogo.nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (estadoJogo.direction !== 'left') estadoJogo.nextDirection = 'right';
                break;
            case ' ':
                alternarPausa();
                break;
            case 'r':
                iniciarJogo();
                break;
        }
    });

    // Event Listeners para botões de controle móvel
    elementos.upBtn.addEventListener('click', () => {
        if (estadoJogo.direction !== 'down') estadoJogo.nextDirection = 'up';
    });
    elementos.downBtn.addEventListener('click', () => {
        if (estadoJogo.direction !== 'up') estadoJogo.nextDirection = 'down';
    });
    elementos.leftBtn.addEventListener('click', () => {
        if (estadoJogo.direction !== 'right') estadoJogo.nextDirection = 'left';
    });
    elementos.rightBtn.addEventListener('click', () => {
        if (estadoJogo.direction !== 'left') estadoJogo.nextDirection = 'right';
    });

    // Event Listeners para botões
    elementos.pauseBtn.addEventListener('click', alternarPausa);
    elementos.soundBtn.addEventListener('click', alternarSom);
    elementos.restartBtn.addEventListener('click', iniciarJogo);
    elementos.playAgainBtn.addEventListener('click', iniciarJogo);

    // Inicia o jogo
    iniciarJogo();
});