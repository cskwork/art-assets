// School Items Module - ContentApp
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,
    placedCount: 0,
    totalItems: 12,

    // 정답
    correctAnswers: {
        1: 'pencil',
        2: 'scissors',
        3: 'bag', // 필기구가 아닌 것
        4: 'notebook'
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
        const storyText = "안녕! 나는 미국에서 온 교환학생 Bobby야. 오늘 첫 수업인데 책상 위가 너무 어질러져 있어서 어떤 학용품이 어디 있는지 찾기가 힘들어. 필기구, 교실용품, 미술용품을 카테고리별로 정리하면 찾기 쉬울 것 같은데... 영어 이름도 같이 배우면서 도와줄 수 있을까?";
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
        const draggableItems = document.querySelectorAll('.draggable-item');
        const dropZones = document.querySelectorAll('.zone-items');

        draggableItems.forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));

            // 터치 지원
            item.addEventListener('touchstart', this.handleTouchStart.bind(this));
            item.addEventListener('touchmove', this.handleTouchMove.bind(this));
            item.addEventListener('touchend', this.handleTouchEnd.bind(this));

            // 클릭으로 발음
            item.addEventListener('click', (e) => {
                const itemName = item.dataset.item;
                this.speak(itemName);
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver.bind(this));
            zone.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    handleDragStart(e) {
        this.draggedElement = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        e.target.style.opacity = '0.5';
    },

    handleDragEnd(e) {
        e.target.style.opacity = '1';
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

        const itemCategory = this.draggedElement.dataset.category;
        const zoneCategory = e.currentTarget.dataset.category;

        if (itemCategory === zoneCategory) {
            e.currentTarget.appendChild(this.draggedElement);
            this.draggedElement.draggable = false;
            this.draggedElement.classList.add('placed');
            this.placedCount++;
            this.updatePlacedCount();
            this.playSound('correct');
            this.speak(this.draggedElement.dataset.item);

            if (this.placedCount === this.totalItems) {
                this.onAllItemsPlaced();
            }
        } else {
            this.playSound('incorrect');
        }

        return false;
    },

    // 터치 이벤트
    handleTouchStart(e) {
        this.draggedElement = e.target.closest('.draggable-item');
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
        const zone = target?.closest('.zone-items');

        if (zone) {
            const itemCategory = this.draggedElement.dataset.category;
            const zoneCategory = zone.dataset.category;

            if (itemCategory === zoneCategory) {
                zone.appendChild(this.draggedElement);
                this.draggedElement.draggable = false;
                this.draggedElement.classList.add('placed');
                this.placedCount++;
                this.updatePlacedCount();
                this.playSound('correct');
                this.speak(this.draggedElement.dataset.item);

                if (this.placedCount === this.totalItems) {
                    this.onAllItemsPlaced();
                }
            } else {
                this.playSound('incorrect');
            }
        }

        this.draggedElement = null;
    },

    updatePlacedCount() {
        const countEl = document.getElementById('placed-count');
        if (countEl) {
            countEl.textContent = this.placedCount;
        }
    },

    onAllItemsPlaced() {
        const nextBtn = document.getElementById('core-next-btn');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
        setTimeout(() => {
            alert('Great! 모든 학용품을 정리했어요!');
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
            if (btn.textContent.toLowerCase().trim() === correct || btn.textContent.trim() === '공책' && answer === 'notebook') {
                btn.style.background = '#4CAF50';
                btn.style.color = 'white';
            } else if (btn.onclick && btn.onclick.toString().includes(answer) && !isCorrect) {
                btn.style.background = '#F44336';
                btn.style.color = 'white';
            }
        });

        const feedback = document.getElementById(`feedback-${quizNum}`);
        if (isCorrect) {
            feedback.textContent = '정답입니다! 👏';
            feedback.style.color = '#4CAF50';
            this.playSound('correct');
            this.speak(correct);
        } else {
            feedback.textContent = `틀렸어요. 정답은 "${correct}"입니다.`;
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
