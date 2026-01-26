const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    selectedCard: null,
    filledCount: 0,

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

    bindDragDrop() {
        const cards = document.querySelectorAll('.phrase-card');
        const slots = document.querySelectorAll('.slot');
        const discovery = document.getElementById('discovery');

        cards.forEach((card) => {
            card.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', card.textContent.trim());
            });

            card.addEventListener('click', () => {
                if (card.classList.contains('used')) return;
                cards.forEach((item) => item.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCard = card;
            });
        });

        slots.forEach((slot) => {
            slot.addEventListener('dragover', (event) => event.preventDefault());
            slot.addEventListener('drop', (event) => {
                event.preventDefault();
                const text = event.dataTransfer.getData('text/plain');
                const card = Array.from(cards).find((item) => item.textContent.trim() === text);
                this.fillSlot(slot, card, discovery);
            });

            slot.addEventListener('click', () => {
                if (!this.selectedCard) return;
                this.fillSlot(slot, this.selectedCard, discovery);
                this.selectedCard = null;
                cards.forEach((item) => item.classList.remove('selected'));
            });
        });
    },

    fillSlot(slot, card, discovery) {
        if (!card || card.classList.contains('used')) return;
        if (slot.classList.contains('filled')) return;
        const answer = slot.dataset.answer || '';
        const text = card.textContent.trim();
        if (text === answer) {
            slot.textContent = text;
            slot.classList.add('filled');
            card.classList.add('used');
            this.filledCount += 1;
            this.speak(slot.parentElement.textContent.trim());
        } else {
            slot.textContent = '다시 선택';
            setTimeout(() => {
                slot.textContent = '[빈칸]';
            }, 800);
        }
        if (this.filledCount >= 3 && discovery) {
            discovery.classList.add('show');
        }
    },

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
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
                        feedback.textContent = isRight ? '좋아요. 톤이 부드럽고 공손해요.' : '친구에게는 괜찮지만 선생님에게는 강해요.';
                    }
                });
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
