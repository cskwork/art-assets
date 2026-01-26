const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    outputs: {
        1: [],
        2: []
    },
    answers: {
        1: ['The noodles', 'were', 'cooked', 'by', 'the chef'],
        2: ['English', 'is', 'used', 'worldwide']
    },

    init() {
        this.bindNav();
        this.bindWordBanks();
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

    bindWordBanks() {
        Object.keys(this.answers).forEach((taskId) => {
            const bank = document.getElementById(`bank-${taskId}`);
            const output = document.getElementById(`output-${taskId}`);
            const feedback = document.getElementById(`feedback-${taskId}`);
            if (!bank || !output) return;

            bank.querySelectorAll('.word-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    if (btn.classList.contains('used')) return;
                    this.outputs[taskId].push(btn.dataset.word || '');
                    btn.classList.add('used');
                    this.renderOutput(output, this.outputs[taskId]);
                    this.checkSentence(taskId, feedback);
                });
            });

            const resetBtn = document.querySelector(`[data-reset="${taskId}"]`);
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.outputs[taskId] = [];
                    output.innerHTML = '';
                    bank.querySelectorAll('.word-btn').forEach((btn) => btn.classList.remove('used'));
                    if (feedback) feedback.textContent = '';
                });
            }
        });
    },

    renderOutput(output, words) {
        output.innerHTML = '';
        words.forEach((word) => {
            const span = document.createElement('span');
            span.textContent = word;
            output.appendChild(span);
        });
    },

    checkSentence(taskId, feedback) {
        const answer = this.answers[taskId];
        const current = this.outputs[taskId];
        if (current.length < answer.length) return;
        const isCorrect = answer.every((word, index) => word === current[index]);
        if (feedback) {
            feedback.textContent = isCorrect ? '완성! 수동태 문장이 맞아요.' : '순서를 다시 확인해보세요.';
        }
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
                        feedback.textContent = isRight ? '좋아요. 대상이 중심이에요.' : '힌트: 결과를 강조할 때 수동태.';
                    }
                });
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
