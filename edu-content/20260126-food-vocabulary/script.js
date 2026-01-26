// Food Vocabulary Module - ContentApp
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,

    // 음식 아이템 데이터
    foodItems: [
        // Fruits
        { id: 'apple', name: 'apple', korean: '사과', category: 'fruits', color: '#E53935' },
        { id: 'banana', name: 'banana', korean: '바나나', category: 'fruits', color: '#FFD54F' },
        { id: 'orange', name: 'orange', korean: '오렌지', category: 'fruits', color: '#FF9800' },
        { id: 'grape', name: 'grape', korean: '포도', category: 'fruits', color: '#9C27B0' },
        // Food
        { id: 'bread', name: 'bread', korean: '빵', category: 'food', color: '#D7CCC8' },
        { id: 'rice', name: 'rice', korean: '쌀/밥', category: 'food', color: '#FFF9C4' },
        { id: 'pizza', name: 'pizza', korean: '피자', category: 'food', color: '#FFCA28' },
        { id: 'hamburger', name: 'hamburger', korean: '햄버거', category: 'food', color: '#FF9800' },
        // Drinks
        { id: 'milk', name: 'milk', korean: '우유', category: 'drinks', color: '#FFF' },
        { id: 'juice', name: 'juice', korean: '주스', category: 'drinks', color: '#FFA726' },
        { id: 'water', name: 'water', korean: '물', category: 'drinks', color: '#81D4FA' },
        { id: 'cake', name: 'cake', korean: '케이크', category: 'drinks', color: '#FFCCBC' }
    ],

    placedItems: 0,
    draggedItem: null,

    // 퀴즈 정답
    correctAnswers: {
        1: 'apple',
        2: 'pizza',
        3: 'water',
        4: 'grape'
    },

    init() {
        this.bindEvents();
        this.showScene(0);
        this.initStoryTypewriter();
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

        if (this.scenes[index] === 'story') {
            this.startTypewriter();
        } else if (this.scenes[index] === 'core') {
            this.initCoreScene();
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

    // Story Scene 타자 효과
    initStoryTypewriter() {
        this.storyText = "안녕! 나는 Chef Mimi야. 새 레스토랑 메뉴판을 만들고 있는데, 음식들을 카테고리별로 정리하는 게 어려워. 과일(Fruits), 음식(Food), 음료(Drinks)... 너희가 도와줄 수 있을까? 함께 영어로 음식 이름도 배우면서 정리해보자!";
        this.typewriterIndex = 0;
    },

    startTypewriter() {
        const textEl = document.getElementById('typewriter-text');
        if (!textEl) return;
        textEl.textContent = '';
        this.typewriterIndex = 0;
        this.typeText(textEl);
    },

    typeText(element) {
        if (this.typewriterIndex < this.storyText.length) {
            element.textContent += this.storyText.charAt(this.typewriterIndex);
            this.typewriterIndex++;
            setTimeout(() => this.typeText(element), 40);
        }
    },

    // Core Scene 초기화
    initCoreScene() {
        const container = document.getElementById('food-items');
        if (!container) return;

        container.innerHTML = '';
        this.placedItems = 0;

        // 음식 아이템 섞기
        const shuffled = [...this.foodItems].sort(() => Math.random() - 0.5);

        shuffled.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'food-item';
            itemEl.draggable = true;
            itemEl.dataset.id = item.id;
            itemEl.dataset.category = item.category;
            itemEl.style.background = item.color;
            itemEl.style.borderColor = this.darkenColor(item.color);

            itemEl.innerHTML = `
                <span class="food-name english-text">${item.name}</span>
                <span class="food-korean">${item.korean}</span>
            `;

            // 드래그 이벤트
            itemEl.addEventListener('dragstart', (e) => this.onDragStart(e));
            itemEl.addEventListener('dragend', (e) => this.onDragEnd(e));

            // 터치 이벤트
            itemEl.addEventListener('touchstart', (e) => this.onTouchStart(e));
            itemEl.addEventListener('touchmove', (e) => this.onTouchMove(e));
            itemEl.addEventListener('touchend', (e) => this.onTouchEnd(e));

            // 클릭으로 발음
            itemEl.addEventListener('click', () => this.speak(item.name));

            container.appendChild(itemEl);
        });

        // 드롭존 이벤트 등록
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => this.onDragOver(e));
            zone.addEventListener('drop', (e) => this.onDrop(e));
        });

        this.updatePlacedCount();
    },

    onDragStart(e) {
        this.draggedItem = e.target;
        e.target.style.opacity = '0.5';
    },

    onDragEnd(e) {
        e.target.style.opacity = '1';
    },

    onDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    },

    onDrop(e) {
        e.preventDefault();
        const zone = e.currentTarget;
        zone.classList.remove('drag-over');

        if (!this.draggedItem) return;

        const itemCategory = this.draggedItem.dataset.category;
        const zoneCategory = zone.id.replace('-zone', '');

        if (itemCategory === zoneCategory) {
            zone.appendChild(this.draggedItem);
            this.draggedItem.draggable = false;
            this.draggedItem.classList.add('placed');
            this.placedItems++;
            this.playSound('correct');
            this.speak(this.draggedItem.dataset.id);
            this.updatePlacedCount();

            if (this.placedItems === this.foodItems.length) {
                this.onAllItemsPlaced();
            }
        } else {
            this.playSound('incorrect');
        }

        this.draggedItem = null;
    },

    // 터치 이벤트 처리
    onTouchStart(e) {
        this.draggedItem = e.target.closest('.food-item');
        if (this.draggedItem) {
            this.draggedItem.style.opacity = '0.5';
        }
    },

    onTouchMove(e) {
        e.preventDefault();
    },

    onTouchEnd(e) {
        if (!this.draggedItem) return;

        this.draggedItem.style.opacity = '1';
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = target?.closest('.drop-zone');

        if (zone) {
            const itemCategory = this.draggedItem.dataset.category;
            const zoneCategory = zone.id.replace('-zone', '');

            if (itemCategory === zoneCategory) {
                zone.appendChild(this.draggedItem);
                this.draggedItem.draggable = false;
                this.draggedItem.classList.add('placed');
                this.placedItems++;
                this.playSound('correct');
                this.speak(this.draggedItem.dataset.id);
                this.updatePlacedCount();

                if (this.placedItems === this.foodItems.length) {
                    this.onAllItemsPlaced();
                }
            } else {
                this.playSound('incorrect');
            }
        }

        this.draggedItem = null;
    },

    updatePlacedCount() {
        const countEl = document.getElementById('progress-count');
        if (countEl) {
            countEl.textContent = this.placedItems;
        }
    },

    onAllItemsPlaced() {
        const discovery = document.getElementById('discovery');
        const nextBtn = document.getElementById('core-next-btn');
        if (discovery) {
            discovery.classList.remove('hidden');
        }
        if (nextBtn) {
            nextBtn.classList.remove('hidden');
        }
    },

    darkenColor(color) {
        // 간단한 색상 어둡게 처리
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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

    // Quiz Scene
    checkAnswer(quizNum, answer) {
        const correct = this.correctAnswers[quizNum];
        const isCorrect = answer === correct;

        const buttons = document.querySelectorAll(`[data-quiz="${quizNum}"] .opt-btn`);
        buttons.forEach(btn => {
            btn.disabled = true;
            const btnAnswer = btn.textContent.trim();
            if (btnAnswer === correct) {
                btn.classList.add('correct');
            } else if (btnAnswer === answer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        const feedback = document.getElementById('quiz-feedback');
        feedback.classList.remove('hidden', 'correct', 'incorrect');

        if (isCorrect) {
            feedback.classList.add('correct');
            let explanation = this.getExplanation(quizNum);
            feedback.innerHTML = `<strong>잘했어요!</strong> ${explanation}`;
            this.playSound('correct');
            this.speak(correct);
        } else {
            feedback.classList.add('incorrect');
            feedback.innerHTML = `<strong>다시 생각해봐요!</strong> 정답은 "${correct}"예요.`;
            this.playSound('incorrect');
        }

        setTimeout(() => {
            if (this.currentQuiz < this.totalQuizzes) {
                this.currentQuiz++;
                this.showQuiz(this.currentQuiz);
            } else {
                setTimeout(() => this.nextScene(), 1500);
            }
        }, 2500);
    },

    getExplanation(quizNum) {
        const explanations = {
            1: "Apple은 과일(fruit)이에요!",
            2: "Pizza는 레스토랑에서 주문할 수 있는 음식이에요!",
            3: "Water는 마시는 음료(drink)예요!",
            4: "Grape는 달콤한 과일이에요!"
        };
        return explanations[quizNum] || '잘했어요!';
    },

    showQuiz(num) {
        document.querySelectorAll('.quiz-item').forEach(q => q.classList.remove('active'));
        const quizItem = document.querySelector(`[data-quiz="${num}"]`);
        if (quizItem) {
            quizItem.classList.add('active');
        }
        const feedback = document.getElementById('quiz-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
        }
        const progressText = document.getElementById('quiz-progress-text');
        if (progressText) {
            progressText.textContent = `${num} / ${this.totalQuizzes}`;
        }
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                // 테스트용 단축키 (필요시 제거 가능)
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
