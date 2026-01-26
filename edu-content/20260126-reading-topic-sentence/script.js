const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    paragraphIndex: 0,
    paragraphs: [
        {
            title: 'Paragraph 1',
            sentences: [
                'Many teenagers use music to relax after school.',
                'Some listen to calm playlists while doing homework.',
                'Others prefer energetic songs before sports practice.'
            ],
            answer: 0
        },
        {
            title: 'Paragraph 2',
            sentences: [
                'The school library offers more than books.',
                'Students can borrow tablets for group projects.',
                'There is also a quiet room for recording presentations.'
            ],
            answer: 0
        },
        {
            title: 'Paragraph 3',
            sentences: [
                'Recycling at home is simple with small habits.',
                'Separating plastic and paper saves space.',
                'Labeling bins helps everyone remember the rules.'
            ],
            answer: 0
        }
    ],

    init() {
        this.bindNav();
        this.bindParagraph();
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
        if (this.scenes[index] === 'core') {
            this.renderParagraph();
        }
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

    bindParagraph() {
        const nextBtn = document.getElementById('next-paragraph');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.paragraphIndex = (this.paragraphIndex + 1) % this.paragraphs.length;
                this.renderParagraph();
            });
        }
    },

    renderParagraph() {
        const titleEl = document.getElementById('paragraph-title');
        const listEl = document.getElementById('sentence-list');
        const feedbackEl = document.getElementById('paragraph-feedback');
        const paragraph = this.paragraphs[this.paragraphIndex];
        if (!titleEl || !listEl || !paragraph) return;
        titleEl.textContent = paragraph.title;
        listEl.innerHTML = '';
        if (feedbackEl) feedbackEl.textContent = '';

        paragraph.sentences.forEach((sentence, index) => {
            const item = document.createElement('div');
            item.className = 'sentence-item';
            item.textContent = sentence;
            item.addEventListener('click', () => {
                listEl.querySelectorAll('.sentence-item').forEach((el) => el.classList.remove('correct', 'wrong'));
                const isCorrect = index === paragraph.answer;
                item.classList.add(isCorrect ? 'correct' : 'wrong');
                if (feedbackEl) {
                    feedbackEl.textContent = isCorrect ? '정답이에요. 핵심을 한 문장으로 말해요.' : '힌트: 가장 넓은 의미를 담은 문장을 찾으세요.';
                }
            });
            listEl.appendChild(item);
        });
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
                        feedback.textContent = isRight ? '정확해요. 문단 전체를 대표해요.' : '세부 정보가 아닌 핵심을 고르세요.';
                    }
                });
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
