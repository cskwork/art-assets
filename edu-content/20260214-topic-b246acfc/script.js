// Educational Content Application
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    game: null,
    score: 0,
    quizScore: 0,
    currentQuiz: 1,
    hints: [
        '분모가 같은 분수끼리는 분자만 더해요!',
        '1 + 2 = 3 이니까, 3/4가 돼요!',
        '정답은 3/4예요! 분모 4는 그대로 두고 분자만 더했어요.'
    ],
    hintIndex: 0,
    pieceCount: 0,

    // Content Data
    contentData: {
        title: '분수의 덧셈',
        subject: 'math',
        gradeLevel: '초등 1-2학년',
        topic: '같은 분모를 가진 분수의 덧셈'
    },

    // Initialize
    init() {
        this.bindEvents();
        this.showScene(0);
    },

    // Bind Events
    bindEvents() {
        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const sceneIndex = parseInt(e.target.dataset.scene);
                this.showScene(sceneIndex);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    },

    // Scene Switching
    showScene(index) {
        if (index < 0 || index >= this.scenes.length) return;

        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        
        // Update navigation dots
        document.querySelectorAll('.dot').forEach((d, i) => {
            d.classList.toggle('active', i === index);
        });

        this.currentScene = index;
        this[`init${this.capitalizeFirst(this.scenes[index])}Scene`]?.();
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },

    prevScene() {
        if (this.currentScene > 0) {
            this.showScene(this.currentScene - 1);
        }
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Scene Initializers
    initHookScene() {
        // Reset sparkle animation
        const sparkle = document.querySelector('.sparkle-container');
        if (sparkle) {
            sparkle.style.animation = 'none';
            sparkle.offsetHeight;
            sparkle.style.animation = 'float 3s ease-in-out infinite';
        }
    },

    initAnchorScene() {
        // Animate cards entrance
        const cards = document.querySelectorAll('.anchor-card');
        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 200);
        });
    },

    initStoryScene() {
        // Bunny bounce animation handled by CSS
    },

    initCoreScene() {
        if (!this.game) {
            this.initPhaserGame();
        }
        this.pieceCount = 0;
        this.hintIndex = 0;
        document.getElementById('hintText').textContent = '';
        document.getElementById('nextFromCore').classList.add('hidden');
    },

    // Phaser Game
    initPhaserGame() {
        const self = this;
        const config = {
            type: Phaser.AUTO,
            width: Math.min(600, window.innerWidth - 40),
            height: 400,
            parent: 'phaser-game',
            backgroundColor: '#FFF5F8',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        };

        function preload() {
            // Create graphics for cake pieces
            this.graphics = this.add.graphics();
        }

        function create() {
            const gameWidth = this.scale.width;
            const gameHeight = this.scale.height;
            
            // Draw plate (target area)
            self.plate = this.add.graphics();
            self.plate.fillStyle(0xFFE4E1, 1);
            self.plate.fillCircle(gameWidth / 2, gameHeight - 80, 70);
            self.plate.lineStyle(4, 0xFF69B4);
            self.plate.strokeCircle(gameWidth / 2, gameHeight - 80, 70);
            
            // Add plate label
            this.add.text(gameWidth / 2, gameHeight - 80, '그릇', {
                font: '16px Noto Sans KR',
                color: '#E75480'
            }).setOrigin(0.5);

            // Create draggable cake pieces
            self.pieces = [];
            self.pieceTexts = [];
            
            // Piece 1: 1/4
            self.createPiece(this, 80, 100, 0xFF69B4, '1/4', 1);
            // Piece 2: 2/4 (first part)
            self.createPiece(this, 200, 80, 0xFF1493, '2/4', 2);
            // Piece 3: 2/4 (second part)
            self.createPiece(this, 320, 100, 0xFF1493, '2/4', 2);

            // Instructions
            this.add.text(gameWidth / 2, 30, '드래그해서 그릇에 놓으세요!', {
                font: '18px Noto Sans KR',
                color: '#666'
            }).setOrigin(0.5);

            // Score display
            self.scoreText = this.add.text(gameWidth / 2, 60, `놓은 조각: ${self.pieceCount}/3`, {
                font: 'bold 20px Noto Sans KR',
                color: '#E91E63'
            }).setOrigin(0.5);

            // Store reference for updates
            self.phaserScene = this;
        }

        function update() {
            // Check if pieces are on plate
            if (self.pieces) {
                self.pieces.forEach((piece, index) => {
                    if (piece && piece.draggable) {
                        const gameWidth = this.scale.width;
                        const gameHeight = this.scale.height;
                        const plateX = gameWidth / 2;
                        const plateY = gameHeight - 80;
                        
                        const dist = Phaser.Math.Distance.Between(
                            piece.x, piece.y, plateX, plateY
                        );
                        
                        if (dist < 60 && !piece.onPlate) {
                            piece.onPlate = true;
                            self.pieceCount++;
                            self.scoreText.setText(`놓은 조각: ${self.pieceCount}/3`);
                            
                            // Snap to plate
                            this.tweens.add({
                                targets: piece,
                                x: plateX + (index % 2 === 0 ? -20 : 20),
                                y: plateY - 20 + (Math.floor(index / 2) * 20),
                                scale: 0.8,
                                duration: 200,
                                ease: 'Back.easeOut'
                            });
                            
                            // Check completion
                            if (self.pieceCount >= 3) {
                                self.onGameComplete();
                            }
                        }
                    }
                });
            }
        }

        this.game = new Phaser.Game(config);
    },

    createPiece(scene, x, y, color, label, value) {
        const piece = scene.add.graphics();
        piece.fillStyle(color, 1);
        piece.slice(0, 0, 50, 0, Math.PI / 2, true);
        piece.fillPath();
        piece.lineStyle(3, 0xFFFFFF);
        piece.slice(0, 0, 50, 0, Math.PI / 2, true);
        piece.strokePath();
        
        // Container for positioning
        const container = scene.add.container(x, y, [piece]);
        container.setSize(80, 80);
        container.draggable = true;
        container.onPlate = false;
        container.pieceValue = value;
        
        // Label
        const text = scene.add.text(x, y + 60, label, {
            font: 'bold 16px Noto Sans KR',
            color: '#333'
        }).setOrigin(0.5);
        
        // Make draggable
        container.setInteractive({ draggable: true });
        scene.input.setDraggable(container);
        
        scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject.draggable && !gameObject.onPlate) {
                gameObject.x = dragX;
                gameObject.y = dragY;
                text.x = dragX;
                text.y = dragY + 60;
            }
        });
        
        this.pieces.push(container);
        this.pieceTexts.push(text);
    },

    onGameComplete() {
        // Update result display
        document.getElementById('resultNumer').textContent = '3';
        document.getElementById('resultNumer').style.color = '#4CAF50';
        
        // Show success message
        const hintText = document.getElementById('hintText');
        hintText.textContent = '🎉 정답! 1/4 + 2/4 = 3/4';
        hintText.style.color = '#4CAF50';
        
        // Show next button
        document.getElementById('nextFromCore').classList.remove('hidden');
        
        // Celebrate in game
        if (this.phaserScene) {
            const gameWidth = this.phaserScene.scale.width;
            const gameHeight = this.phaserScene.scale.height;
            
            // Add celebration particles
            for (let i = 0; i < 20; i++) {
                const star = this.phaserScene.add.graphics();
                star.fillStyle(Phaser.Math.RND.pick([0xFFD700, 0xFF69B4, 0x4CAF50]), 1);
                star.fillStar(0, 0, 5, 10, 5);
                star.x = Phaser.Math.RND.between(50, gameWidth - 50);
                star.y = Phaser.Math.RND.between(50, gameHeight - 100);
                star.alpha = 0;
                
                this.phaserScene.tweens.add({
                    targets: star,
                    alpha: 1,
                    scale: { from: 0, to: 1.5 },
                    y: star.y - 50,
                    duration: 500,
                    delay: i * 50,
                    yoyo: true,
                    repeat: 0,
                    onComplete: () => star.destroy()
                });
            }
        }
    },

    showHint() {
        const hintText = document.getElementById('hintText');
        hintText.textContent = this.hints[this.hintIndex];
        hintText.style.color = '#E91E63';
        this.hintIndex = (this.hintIndex + 1) % this.hints.length;
    },

    resetGame() {
        this.pieceCount = 0;
        this.hintIndex = 0;
        document.getElementById('hintText').textContent = '';
        document.getElementById('resultNumer').textContent = '?';
        document.getElementById('resultNumer').style.color = '';
        document.getElementById('nextFromCore').classList.add('hidden');
        
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
            this.pieces = [];
            this.pieceTexts = [];
        }
        this.initPhaserGame();
    },

    initVisualizeScene() {
        // Animate principle steps
        const steps = document.querySelectorAll('.principle-step');
        steps.forEach((step, i) => {
            step.style.opacity = '0';
            step.style.transform = 'scale(0.8)';
            setTimeout(() => {
                step.style.transition = 'all 0.5s ease';
                step.style.opacity = '1';
                step.style.transform = 'scale(1)';
            }, i * 300);
        });
    },

    initQuizScene() {
        this.currentQuiz = 1;
        this.quizScore = 0;
        this.updateQuizProgress();
        
        // Reset quiz cards
        document.getElementById('quiz1').classList.remove('hidden');
        document.getElementById('quiz2').classList.add('hidden');
        document.getElementById('quizNextBtn').classList.add('hidden');
        
        // Reset inputs
        document.getElementById('answer1Num').value = '';
        document.getElementById('answer2Num').value = '';
        document.getElementById('feedback1').textContent = '';
        document.getElementById('feedback2').textContent = '';
    },

    checkAnswer(quizNum) {
        const input = document.getElementById(`answer${quizNum}Num`);
        const feedback = document.getElementById(`feedback${quizNum}`);
        const answer = parseInt(input.value);
        
        const correctAnswers = { 1: 5, 2: 3 };
        const correct = correctAnswers[quizNum];
        
        if (answer === correct) {
            feedback.textContent = '정답이에요! 훌륭해요!';
            feedback.className = 'feedback correct';
            this.quizScore++;
            
            setTimeout(() => {
                if (quizNum === 1) {
                    this.currentQuiz = 2;
                    this.updateQuizProgress();
                    document.getElementById('quiz1').classList.add('hidden');
                    document.getElementById('quiz2').classList.remove('hidden');
                } else {
                    this.updateQuizProgress();
                    document.getElementById('quizNextBtn').classList.remove('hidden');
                }
            }, 1000);
        } else {
            feedback.textContent = '다시 생각해보세요! 분자끼리 더하면?';
            feedback.className = 'feedback incorrect';
            
            // Shake animation
            input.style.animation = 'shake 0.5s';
            setTimeout(() => {
                input.style.animation = '';
                input.value = '';
                input.focus();
            }, 500);
        }
    },

    updateQuizProgress() {
        const progress = (this.currentQuiz / 2) * 100;
        document.getElementById('quizProgress').style.width = `${progress}%`;
        document.getElementById('quizNum').textContent = this.currentQuiz;
    },

    initWrapScene() {
        // Celebration is handled by CSS animation
    },

    restart() {
        this.currentScene = 0;
        this.score = 0;
        this.quizScore = 0;
        this.currentQuiz = 1;
        this.pieceCount = 0;
        this.hintIndex = 0;
        
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
            this.pieces = [];
            this.pieceTexts = [];
        }
        
        this.showScene(0);
    },

    freeExplore() {
        // Go back to core scene for free exploration
        this.showScene(3);
    }
};

// Add shake animation for wrong answers
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => ContentApp.init());

// Handle window resize for Phaser game
window.addEventListener('resize', () => {
    if (ContentApp.game && ContentApp.phaserScene) {
        ContentApp.game.scale.resize(
            Math.min(600, window.innerWidth - 40),
            400
        );
    }
});