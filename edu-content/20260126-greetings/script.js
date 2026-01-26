// Greetings Module - ContentApp
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,
    matchedCount: 0,
    totalMatches: 6,

    // 정답
    correctAnswers: {
        1: 'good-morning',
        2: 'nice-to-meet',
        3: 'im-fine',
        4: 'good-evening'
    },

    init() {
        this.bindEvents();
        this.showScene(0);
        this.initDragAndDrop();
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneElement = document.getElementById(sceneId);
        if (sceneElement) {
            sceneElement.classList.add('active');
        }
        this.currentScene = index;
        this.updateProgress();

        // Story scene: 타자 효과
        if (this.scenes[index] === 'story') {
            this.typewriterEffect();
        }

        // Core scene: 드래그앤드롭 초기화
        if (this.scenes[index] === 'core') {
            this.initDragAndDrop();
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    updateProgress() {
        const progress = ((this.currentScene + 1) / this.scenes.length) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    },

    // Story scene 타자 효과
    typewriterEffect() {
        const storyText = "안녕! 나는 Emma야. 오늘 우리 동네에 새로운 이웃이 이사왔어. 아침에 만나서 'Good morning!'이라고 인사했더니 너무 좋아했어! 하루 중 언제 만나느냐에 따라 다른 인사말을 사용할 수 있다는 것을 알려주고 싶어. 함께 시간대별 인사를 배워볼까?";
        const textEl = document.getElementById('story-text');
        if (!textEl) return;

        let index = 0;
        textEl.textContent = '';

        const typeInterval = setInterval(() => {
            if (index < storyText.length) {
                textEl.textContent += storyText.charAt(index);
                index++;
            } else {
                clearInterval(typeInterval);
            }
        }, 40);
    },

    // Drag and Drop 초기화
    initDragAndDrop() {
        const greetingCards = document.querySelectorAll('.greeting-card');
        const dropZones = document.querySelectorAll('.drop-zone');

        greetingCards.forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));

            // 터치 지원
            card.addEventListener('touchstart', this.handleTouchStart.bind(this));
            card.addEventListener('touchmove', this.handleTouchMove.bind(this));
            card.addEventListener('touchend', this.handleTouchEnd.bind(this));

            // 클릭으로 발음
            card.addEventListener('click', (e) => {
                const greetingText = card.querySelector('.english-text').textContent;
                this.speak(greetingText);
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver.bind(this));
            zone.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    handleDragStart(e) {
        this.draggedElement = e.target.closest('.greeting-card');
        if (this.draggedElement) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.draggedElement.innerHTML);
            this.draggedElement.style.opacity = '0.5';
        }
    },

    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.style.opacity = '1';
        }
    },

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    },

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        e.preventDefault();

        if (!this.draggedElement) return;

        const greetingType = this.draggedElement.dataset.greeting;
        const expectedAnswer = e.currentTarget.dataset.answer;

        if (greetingType === expectedAnswer && e.currentTarget.children.length === 0) {
            e.currentTarget.appendChild(this.draggedElement);
            this.draggedElement.draggable = false;
            this.draggedElement.classList.add('placed');
            this.matchedCount++;
            this.updateMatchedCount();
            this.playSound('correct');
            const greetingText = this.draggedElement.querySelector('.english-text').textContent;
            this.speak(greetingText);

            if (this.matchedCount === this.totalMatches) {
                this.onAllMatched();
            }
        } else {
            this.playSound('incorrect');
        }

        return false;
    },

    // 터치 이벤트
    handleTouchStart(e) {
        this.draggedElement = e.target.closest('.greeting-card');
        if (this.draggedElement) {
            this.draggedElement.style.opacity = '0.5';
        }
    },

    handleTouchMove(e) {
        e.preventDefault();
    },

    handleTouchEnd(e) {
        if (!this.draggedElement) return;

        this.draggedElement.style.opacity = '1';
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = target?.closest('.drop-zone');

        if (zone) {
            const greetingType = this.draggedElement.dataset.greeting;
            const expectedAnswer = zone.dataset.answer;

            if (greetingType === expectedAnswer && zone.children.length === 0) {
                zone.appendChild(this.draggedElement);
                this.draggedElement.draggable = false;
                this.draggedElement.classList.add('placed');
                this.matchedCount++;
                this.updateMatchedCount();
                this.playSound('correct');
                const greetingText = this.draggedElement.querySelector('.english-text').textContent;
                this.speak(greetingText);

                if (this.matchedCount === this.totalMatches) {
                    this.onAllMatched();
                }
            } else {
                this.playSound('incorrect');
            }
        }

        this.draggedElement = null;
    },

    updateMatchedCount() {
        const countEl = document.getElementById('matched-count');
        if (countEl) {
            countEl.textContent = this.matchedCount;
        }
    },

    onAllMatched() {
        const nextBtn = document.getElementById('core-next-btn');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
        setTimeout(() => {
            alert('Excellent! 모든 인사를 매칭했어요!');
        }, 500);
    },

    // Web Speech API (3-4학년용: rate=0.8)
    speak(text) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        }
    },

    // 효과음 재생
    playSound(type) {
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'correct') {
            oscillator.frequency.value = 659.25; // E5
            oscillator.type = 'sine';
        } else {
            oscillator.frequency.value = 196; // G3
            oscillator.type = 'square';
        }

        gainNode.gain.value = 0.1;
        oscillator.start();

        setTimeout(() => {
            oscillator.stop();
            audioCtx.close();
        }, 150);
    },

    // Quiz Scene
    checkAnswer(quizNum, answer) {
        const correct = this.correctAnswers[quizNum];
        const isCorrect = answer === correct;

        const buttons = document.querySelectorAll(`#quiz-${quizNum} .quiz-option`);
        buttons.forEach(btn => {
            btn.disabled = true;
            const btnAnswer = btn.onclick.toString().match(/'([^']+)'/);
            if (btnAnswer && btnAnswer[1] === correct) {
                btn.style.background = '#4CAF50';
                btn.style.color = 'white';
            } else if (btnAnswer && btnAnswer[1] === answer && !isCorrect) {
                btn.style.background = '#F44336';
                btn.style.color = 'white';
            }
        });

        const feedback = document.getElementById(`feedback-${quizNum}`);
        if (isCorrect) {
            feedback.textContent = '정답입니다! 👏';
            feedback.style.color = '#4CAF50';
            this.playSound('correct');

            // 정답 발음
            const correctBtn = Array.from(buttons).find(btn => {
                const btnAnswer = btn.onclick.toString().match(/'([^']+)'/);
                return btnAnswer && btnAnswer[1] === correct;
            });
            if (correctBtn) {
                this.speak(correctBtn.textContent);
            }
        } else {
            const correctBtn = Array.from(buttons).find(btn => {
                const btnAnswer = btn.onclick.toString().match(/'([^']+)'/);
                return btnAnswer && btnAnswer[1] === correct;
            });
            feedback.textContent = `틀렸어요. 정답은 "${correctBtn ? correctBtn.textContent : correct}"입니다.`;
            feedback.style.color = '#F44336';
            this.playSound('incorrect');
        }

        // 다음 퀴즈로 이동
        setTimeout(() => {
            if (quizNum < this.totalQuizzes) {
                this.showQuiz(quizNum + 1);
            } else {
                setTimeout(() => this.nextScene(), 1500);
            }
        }, 2500);
    },

    showQuiz(num) {
        document.querySelectorAll('.quiz-question').forEach(q => q.style.display = 'none');
        const quizEl = document.getElementById(`quiz-${num}`);
        if (quizEl) {
            quizEl.style.display = 'block';
        }
        const currentQuizEl = document.getElementById('current-quiz');
        if (currentQuizEl) {
            currentQuizEl.textContent = num;
        }
        this.currentQuiz = num;
    },

    restart() {
        location.reload();
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                // 테스트용 단축키 (필요시 제거 가능)
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
