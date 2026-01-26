const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    correctDrops: 0,
    selectedCard: null,

    init() {
        this.bindNav();
        this.bindDragDrop();
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
        const nextScene = document.getElementById(sceneId);
        if (nextScene) {
            nextScene.classList.add('active');
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

    bindDragDrop() {
        const cards = document.querySelectorAll('.phrase-card');
        const zones = document.querySelectorAll('.drop-zone');
        const discovery = document.getElementById('discovery');

        cards.forEach((card) => {
            card.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', card.dataset.tense || '');
                event.dataTransfer.setData('example', card.dataset.example || '');
                event.dataTransfer.setData('id', card.textContent.trim());
            });

            card.addEventListener('click', () => {
                if (card.classList.contains('used')) return;
                cards.forEach((item) => item.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCard = card;
            });
        });

        zones.forEach((zone) => {
            zone.addEventListener('dragover', (event) => {
                event.preventDefault();
                zone.classList.add('drag-over');
            });
            zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
            zone.addEventListener('drop', (event) => {
                event.preventDefault();
                zone.classList.remove('drag-over');
                const tense = event.dataTransfer.getData('text/plain');
                const example = event.dataTransfer.getData('example');
                const text = event.dataTransfer.getData('id');
                const card = Array.from(cards).find((item) => item.textContent.trim() === text);
                this.handleDrop(zone, card, tense, example, discovery);
            });

            zone.addEventListener('click', () => {
                if (!this.selectedCard) return;
                const tense = this.selectedCard.dataset.tense || '';
                const example = this.selectedCard.dataset.example || '';
                this.handleDrop(zone, this.selectedCard, tense, example, discovery);
                this.selectedCard = null;
            });
        });
    },

    handleDrop(zone, card, tense, example, discovery) {
        if (!card || card.classList.contains('used')) return;
        const target = zone.dataset.target;
        const resultBox = zone.querySelector('.drop-result');
        if (!resultBox) return;

        if (tense === target) {
            resultBox.textContent = example;
            resultBox.classList.remove('wrong');
            resultBox.classList.add('correct');
            card.classList.add('used');
            card.classList.remove('selected');
            this.correctDrops += 1;
        } else {
            resultBox.textContent = '다시 생각해보세요.';
            resultBox.classList.remove('correct');
            resultBox.classList.add('wrong');
        }

        if (this.correctDrops >= 4 && discovery) {
            discovery.classList.add('show');
        }
    },

    bindQuiz() {
        const cards = document.querySelectorAll('.quiz-card');
        cards.forEach((card) => {
            const feedback = card.querySelector('.quiz-feedback');
            card.querySelectorAll('.quiz-option').forEach((btn) => {
                btn.addEventListener('click', () => {
                    card.querySelectorAll('.quiz-option').forEach((opt) => {
                        opt.classList.remove('correct', 'wrong');
                    });
                    const isRight = btn.dataset.answer === 'right';
                    btn.classList.add(isRight ? 'correct' : 'wrong');
                    if (feedback) {
                        feedback.textContent = isRight ? '정확해요. 현재와 연결되는지 확인했어요.' : '힌트: 시간 표현이 있는지 확인해요.';
                    }
                });
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
