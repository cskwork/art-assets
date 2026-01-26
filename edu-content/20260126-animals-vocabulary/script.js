// 초등 3-4학년용 ContentApp - Animals Vocabulary
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,

    // 퀴즈 정답
    correctAnswers: {
        1: 'lion',
        2: 'duck',
        3: 'elephant',
        4: 'pig'
    },

    // 동물 데이터
    animals: [
        { id: 'cat', category: 'pet', name: 'cat', korean: '고양이', color: '#FF9800' },
        { id: 'dog', category: 'pet', name: 'dog', korean: '강아지', color: '#8D6E63' },
        { id: 'bird', category: 'pet', name: 'bird', korean: '새', color: '#FFC107' },
        { id: 'fish', category: 'pet', name: 'fish', korean: '물고기', color: '#03A9F4' },
        { id: 'lion', category: 'zoo', name: 'lion', korean: '사자', color: '#FFD54F' },
        { id: 'elephant', category: 'zoo', name: 'elephant', korean: '코끼리', color: '#9E9E9E' },
        { id: 'monkey', category: 'zoo', name: 'monkey', korean: '원숭이', color: '#8D6E63' },
        { id: 'tiger', category: 'zoo', name: 'tiger', korean: '호랑이', color: '#FF9800' },
        { id: 'cow', category: 'farm', name: 'cow', korean: '소', color: '#A1887F' },
        { id: 'pig', category: 'farm', name: 'pig', korean: '돼지', color: '#F8BBD0' },
        { id: 'chicken', category: 'farm', name: 'chicken', korean: '닭', color: '#FFEB3B' },
        { id: 'duck', category: 'farm', name: 'duck', korean: '오리', color: '#FFD54F' }
    ],

    currentAnimalIndex: 0,
    matchedCount: 0,

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
            this.initCoreGame();
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
        this.storyText = "안녕! 나는 동물원 사육사 Zoomi야. 오늘 아침에 큰 바람이 불어서 동물 우리의 이름표들이 다 날아가버렸어. 동물들이 누구인지 알 수 없게 되었어! 나를 도와 각 동물의 영어 이름을 찾아서 다시 붙여줄 수 있을까?";
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

    // Core Game: 동물 이름 매칭
    initCoreGame() {
        this.currentAnimalIndex = 0;
        this.matchedCount = 0;
        this.shuffleAnimals();
        this.renderCurrentAnimal();
        this.renderWordChoices();
        document.getElementById('progress-count').textContent = '0';
        document.getElementById('total-count').textContent = this.animals.length;
    },

    shuffleAnimals() {
        for (let i = this.animals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.animals[i], this.animals[j]] = [this.animals[j], this.animals[i]];
        }
    },

    renderCurrentAnimal() {
        const animal = this.animals[this.currentAnimalIndex];
        const matchingArea = document.getElementById('matching-area');

        matchingArea.innerHTML = `
            <div class="animal-display" data-animal="${animal.id}">
                ${this.getAnimalSVG(animal)}
                <div class="animal-label hidden" id="animal-label">
                    <span class="english-text">${animal.name}</span>
                    <span class="korean-text">${animal.korean}</span>
                </div>
            </div>
        `;
    },

    getAnimalSVG(animal) {
        const svgs = {
            cat: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="65" rx="28" ry="22" fill="${animal.color}"/>
                <ellipse cx="50" cy="45" rx="20" ry="18" fill="${animal.color}"/>
                <polygon points="32,28 37,38 42,30" fill="${animal.color}"/>
                <polygon points="68,28 63,38 58,30" fill="${animal.color}"/>
                <circle cx="43" cy="43" r="3" fill="#333"/>
                <circle cx="57" cy="43" r="3" fill="#333"/>
                <path d="M 43 50 L 50 54 L 57 50" stroke="#333" stroke-width="2" fill="none"/>
            </svg>`,
            dog: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="65" rx="32" ry="25" fill="${animal.color}"/>
                <ellipse cx="50" cy="45" rx="22" ry="20" fill="${animal.color}"/>
                <ellipse cx="32" cy="32" rx="10" ry="18" fill="${animal.color}"/>
                <ellipse cx="68" cy="32" rx="10" ry="18" fill="${animal.color}"/>
                <circle cx="43" cy="43" r="4" fill="#333"/>
                <circle cx="57" cy="43" r="4" fill="#333"/>
                <circle cx="50" cy="52" r="4" fill="#333"/>
            </svg>`,
            bird: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="60" rx="20" ry="18" fill="${animal.color}"/>
                <circle cx="50" cy="45" r="15" fill="${animal.color}"/>
                <polygon points="35,45 25,50 35,52" fill="#FF6F00"/>
                <circle cx="45" cy="43" r="2" fill="#333"/>
                <ellipse cx="35" cy="75" rx="5" ry="3" fill="#FF6F00"/>
                <ellipse cx="55" cy="75" rx="5" ry="3" fill="#FF6F00"/>
            </svg>`,
            fish: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="55" cy="50" rx="30" ry="20" fill="${animal.color}"/>
                <polygon points="25,50 15,40 15,60" fill="${animal.color}"/>
                <circle cx="70" cy="47" r="3" fill="#333"/>
                <path d="M 60 35 Q 75 30 85 35" stroke="#333" stroke-width="2" fill="none"/>
            </svg>`,
            lion: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <circle cx="50" cy="50" r="35" fill="#FFB74D" opacity="0.6"/>
                <circle cx="50" cy="50" r="22" fill="${animal.color}"/>
                <circle cx="43" cy="47" r="3" fill="#333"/>
                <circle cx="57" cy="47" r="3" fill="#333"/>
                <path d="M 43 55 L 50 58 L 57 55" stroke="#333" stroke-width="2" fill="none"/>
            </svg>`,
            elephant: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="55" rx="35" ry="25" fill="${animal.color}"/>
                <ellipse cx="50" cy="35" rx="22" ry="20" fill="${animal.color}"/>
                <ellipse cx="32" cy="30" rx="12" ry="10" fill="${animal.color}"/>
                <ellipse cx="68" cy="30" rx="12" ry="10" fill="${animal.color}"/>
                <rect x="45" y="55" width="10" height="30" rx="5" fill="${animal.color}"/>
                <circle cx="43" cy="33" r="2" fill="#333"/>
                <circle cx="57" cy="33" r="2" fill="#333"/>
            </svg>`,
            monkey: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="60" rx="25" ry="22" fill="${animal.color}"/>
                <circle cx="50" cy="40" r="18" fill="${animal.color}"/>
                <circle cx="32" cy="37" r="8" fill="#FFE0B2"/>
                <circle cx="68" cy="37" r="8" fill="#FFE0B2"/>
                <circle cx="43" cy="38" r="3" fill="#333"/>
                <circle cx="57" cy="38" r="3" fill="#333"/>
                <ellipse cx="50" cy="48" rx="8" ry="10" fill="#FFE0B2"/>
            </svg>`,
            tiger: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="60" rx="28" ry="22" fill="${animal.color}"/>
                <ellipse cx="50" cy="42" rx="20" ry="18" fill="${animal.color}"/>
                <polygon points="35,30 38,38 42,32" fill="${animal.color}"/>
                <polygon points="65,30 62,38 58,32" fill="${animal.color}"/>
                <line x1="30" y1="45" x2="45" y2="45" stroke="#333" stroke-width="2"/>
                <line x1="55" y1="45" x2="70" y2="45" stroke="#333" stroke-width="2"/>
                <circle cx="43" cy="40" r="3" fill="#333"/>
                <circle cx="57" cy="40" r="3" fill="#333"/>
            </svg>`,
            cow: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="60" rx="32" ry="24" fill="${animal.color}"/>
                <rect x="40" y="55" width="8" height="25" rx="4" fill="${animal.color}"/>
                <rect x="52" y="55" width="8" height="25" rx="4" fill="${animal.color}"/>
                <ellipse cx="50" cy="42" rx="22" ry="18" fill="${animal.color}"/>
                <ellipse cx="35" cy="35" rx="6" ry="10" fill="${animal.color}"/>
                <ellipse cx="65" cy="35" rx="6" ry="10" fill="${animal.color}"/>
                <circle cx="43" cy="40" r="3" fill="#333"/>
                <circle cx="57" cy="40" r="3" fill="#333"/>
                <ellipse cx="50" cy="50" rx="8" ry="10" fill="#FFE0B2"/>
            </svg>`,
            pig: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="60" rx="28" ry="22" fill="${animal.color}"/>
                <circle cx="50" cy="42" r="18" fill="${animal.color}"/>
                <circle cx="43" cy="40" r="3" fill="#333"/>
                <circle cx="57" cy="40" r="3" fill="#333"/>
                <ellipse cx="50" cy="50" rx="10" ry="8" fill="#F48FB1"/>
                <circle cx="47" cy="50" r="2" fill="#333"/>
                <circle cx="53" cy="50" r="2" fill="#333"/>
            </svg>`,
            chicken: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="60" rx="22" ry="20" fill="${animal.color}"/>
                <circle cx="50" cy="42" r="14" fill="${animal.color}"/>
                <polygon points="48,35 50,30 52,35" fill="#FF6F00"/>
                <polygon points="35,42 30,45 35,48" fill="#FF6F00"/>
                <circle cx="47" cy="40" r="2" fill="#333"/>
                <ellipse cx="42" cy="75" rx="5" ry="3" fill="#FF6F00"/>
                <ellipse cx="58" cy="75" rx="5" ry="3" fill="#FF6F00"/>
            </svg>`,
            duck: `<svg viewBox="0 0 100 100" class="animal-card-svg">
                <ellipse cx="50" cy="60" rx="25" ry="20" fill="${animal.color}"/>
                <ellipse cx="45" cy="42" rx="16" ry="18" fill="${animal.color}"/>
                <polygon points="32,40 22,43 32,46" fill="#FF9800"/>
                <circle cx="42" cy="40" r="3" fill="#333"/>
                <ellipse cx="43" cy="75" rx="6" ry="4" fill="#FF9800"/>
                <ellipse cx="57" cy="75" rx="6" ry="4" fill="#FF9800"/>
            </svg>`
        };

        return svgs[animal.id] || '';
    },

    renderWordChoices() {
        const wordChoicesDiv = document.getElementById('word-choices');
        const currentAnimal = this.animals[this.currentAnimalIndex];

        // 현재 동물 + 2개 랜덤 선택지
        let choices = [currentAnimal.name];
        const otherAnimals = this.animals.filter((a, idx) => idx !== this.currentAnimalIndex);
        const shuffled = otherAnimals.sort(() => Math.random() - 0.5);
        choices.push(shuffled[0].name, shuffled[1].name);

        // 섞기
        choices = choices.sort(() => Math.random() - 0.5);

        wordChoicesDiv.innerHTML = choices.map(word =>
            `<button class="word-btn" onclick="ContentApp.selectWord('${word}')">${word}</button>`
        ).join('');
    },

    selectWord(word) {
        const currentAnimal = this.animals[this.currentAnimalIndex];
        const buttons = document.querySelectorAll('.word-btn');

        buttons.forEach(btn => btn.disabled = true);

        if (word === currentAnimal.name) {
            this.playSound('correct');
            document.getElementById('animal-label').classList.remove('hidden');
            this.speak(currentAnimal.name);
            this.matchedCount++;
            document.getElementById('progress-count').textContent = this.matchedCount;

            setTimeout(() => {
                this.currentAnimalIndex++;
                if (this.currentAnimalIndex < this.animals.length) {
                    this.renderCurrentAnimal();
                    this.renderWordChoices();
                } else {
                    this.showDiscovery();
                }
            }, 1500);
        } else {
            this.playSound('incorrect');
            buttons.forEach(btn => {
                if (btn.textContent === word) {
                    btn.style.background = '#EF5350';
                    btn.style.color = 'white';
                }
            });
            setTimeout(() => {
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.background = '';
                    btn.style.color = '';
                });
            }, 1000);
        }
    },

    showDiscovery() {
        document.getElementById('discovery').classList.remove('hidden');
        document.getElementById('core-next-btn').classList.remove('hidden');
        this.playSound('correct');
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
            oscillator.frequency.value = 659.25;
            oscillator.type = 'sine';
        } else {
            oscillator.frequency.value = 196;
            oscillator.type = 'square';
        }

        gainNode.gain.value = 0.1;
        oscillator.start();

        setTimeout(() => {
            oscillator.stop();
            audioCtx.close();
        }, 150);
    },

    // Web Speech API
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

        const quizItem = document.querySelector(`[data-quiz="${quizNum}"]`);
        const buttons = quizItem.querySelectorAll('.opt-btn');

        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correct) {
                btn.classList.add('correct');
            } else if (btn.textContent === answer && !isCorrect) {
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
            1: "lion은 동물원 동물이에요!",
            2: "오리는 영어로 duck이에요!",
            3: "코끼리는 elephant, 코가 길어요!",
            4: "돼지는 pig, 꿀꿀 소리를 내요!"
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
            if (e.key === 'ArrowRight') {
                // 개발 테스트용
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
