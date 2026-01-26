// 초등 3-4학년용 ContentApp 템플릿
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,

    // 퀴즈 정답 (모듈별로 수정)
    correctAnswers: {
        1: 'option1',
        2: 'option2',
        3: 'option3',
        4: 'option1'
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
        // 모듈별로 스토리 텍스트 수정
        this.storyText = "안녕! 이곳에 캐릭터의 이야기를 작성하세요. 캐릭터가 도움을 요청하는 내용을 포함합니다.";
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
            setTimeout(() => this.typeText(element), 40); // 3-4학년용: 조금 더 느리게
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

    // Web Speech API (3-4학년용: rate=0.8)
    speak(text) {
        if ('speechSynthesis' in window) {
            // 기존 발음 중지
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8; // 3-4학년용: 느린 발음
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
            if (btn.textContent === correct || btn.onclick.toString().includes(correct)) {
                btn.classList.add('correct');
            } else if (btn.onclick.toString().includes(answer) && !isCorrect) {
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
        // 모듈별로 설명 수정
        const explanations = {
            1: "설명 1",
            2: "설명 2",
            3: "설명 3",
            4: "설명 4"
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
                // 스페이스바로 씬 이동 (테스트용)
                // 프로덕션에서는 제거 가능
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
