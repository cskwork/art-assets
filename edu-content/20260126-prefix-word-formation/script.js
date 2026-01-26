const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    selectedPrefix: null,
    selectedWord: null,
    foundWords: new Set(),
    combos: {
        undo: '되돌리다',
        redo: '다시 하다',
        disagree: '동의하지 않다',
        reconnect: '다시 연결하다',
        disconnect: '연결을 끊다',
        misplace: '잘못 두다',
        rewrite: '다시 쓰다',
        misuse: '잘못 사용하다'
    },

    init() {
        this.bindNav();
        this.bindFactory();
        this.bindQuiz();
        this.showScene(0);
    },

    bindNav() {
        document.querySelectorAll('[data-action="next"]').forEach((btn) => {
            btn.addEventListener('click', () => this.nextScene());
        });
        document.querySelectorAll('[data-action="restart"]').forEach((btn) => {
            btn.addEventListener('click', () => this.showScene(0));
        });
        document.querySelectorAll('[data-action="finish"]').forEach((btn) => {
            btn.addEventListener('click', () => this.showScene(0));
        });
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach((scene) => scene.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const target = document.getElementById(sceneId);
        if (target) {
            target.classList.add('active');
        }
        this.currentScene = index;
        this.updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },

    updateProgress() {
        const progress = ((this.currentScene + 1) / this.scenes.length) * 100;
        const bar = document.getElementById('progress-bar');
        if (bar) {
            bar.style.width = `${progress}%`;
        }
    },

    bindFactory() {
        const outputWord = document.getElementById('output-word');
        const outputMeaning = document.getElementById('output-meaning');
        const meterFill = document.getElementById('meter-fill');

        document.querySelectorAll('.prefix-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.prefix-btn').forEach((item) => item.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPrefix = btn.dataset.prefix || '';
                this.updateOutput(outputWord, outputMeaning, meterFill);
            });
        });

        document.querySelectorAll('.word-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.word-btn').forEach((item) => item.classList.remove('active'));
                btn.classList.add('active');
                this.selectedWord = btn.dataset.word || '';
                this.updateOutput(outputWord, outputMeaning, meterFill);
            });
        });
    },

    updateOutput(outputWord, outputMeaning, meterFill) {
        if (!this.selectedPrefix || !this.selectedWord) {
            return;
        }
        const combined = `${this.selectedPrefix}${this.selectedWord}`;
        if (outputWord) outputWord.textContent = combined;
        if (this.combos[combined]) {
            if (outputMeaning) outputMeaning.textContent = this.combos[combined];
            this.foundWords.add(combined);
        } else {
            if (outputMeaning) outputMeaning.textContent = '자연스럽지 않은 조합이에요.';
        }
        const total = Object.keys(this.combos).length;
        const progress = Math.min((this.foundWords.size / total) * 100, 100);
        if (meterFill) meterFill.style.width = `${progress}%`;
    },

    bindQuiz() {
        document.querySelectorAll('.quiz-card').forEach((card) => {
            const feedback = card.querySelector('.quiz-feedback');
            card.querySelectorAll('.quiz-option').forEach((btn) => {
                btn.addEventListener('click', () => {
                    card.querySelectorAll('.quiz-option').forEach((opt) => opt.classList.remove('correct', 'wrong'));
                    const isRight = btn.dataset.answer === 'right';
                    btn.classList.add(isRight ? 'correct' : 'wrong');
                    if (feedback) {
                        feedback.textContent = isRight ? '정답이에요. 접두사가 의미를 바꿨어요.' : '다시 생각해보세요.';
                    }
                });
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
