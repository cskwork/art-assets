const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    pizzaState: 0, // Current number of 1/4 slices (0 to 4)
    correctAnswerIndex: 1, // For quiz

    init() {
        this.updateProgress();
        this.bindEvents();
        this.initCoreScene(); // Initialize visuals
    },

    bindEvents() {
        // Add any global event listeners here
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;
        this.updateProgress();

        // Initialize specific scene logic if needed
        if (this.scenes[index] === 'core') {
            this.resetPizza();
        }
        if (this.scenes[index] === 'quiz') {
            document.getElementById('quiz-feedback').innerHTML = '';
            document.getElementById('next-quiz-btn').classList.add('hidden');
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },

    updateProgress() {
        const progress = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('scene-indicator').innerText = `${this.currentScene + 1}/${this.scenes.length}`;
    },

    // --- Core Scene Logic ---
    initCoreScene() {
        // Prepare interactive elements if necessary
    },

    createSlicePath(startAngle, endAngle, color) {
        const radius = 90;
        const center = 100;
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        return `<path d="M${center} ${center} L${x1} ${y1} A${radius} ${radius} 0 0 1 ${x2} ${y2} Z" fill="${color}" stroke="#E65100" stroke-width="2"/>`;
    },

    addSlice() {
        if (this.pizzaState < 4) {
            this.pizzaState++;
            this.renderPizza();
            this.updateFeedback();
        } else {
            this.showFeedback("이제 피자가 꽉 찼어요! (1/4 + 1/4 + 1/4 + 1/4 = 1)", "info");
        }
    },

    resetPizza() {
        this.pizzaState = 0;
        this.renderPizza();
        document.getElementById('feedback-msg').innerHTML = '';
    },

    renderPizza() {
        const group = document.getElementById('pizza-slices-group');
        group.innerHTML = '';
        
        // Color palette for slices
        const colors = ['#FFCC80', '#FFAB91', '#fff59d', '#a5d6a7'];
        
        // Render slices based on current count
        // Each slice is 90 degrees (360 / 4)
        for (let i = 0; i < this.pizzaState; i++) {
            const startAngle = i * 90;
            const endAngle = (i + 1) * 90;
            const slice = this.createSlicePath(startAngle, endAngle, colors[i % 4]);
            
            // Add topping visual
            const topping = `
                <circle cx="${100 + 40 * Math.cos((startAngle + 45 - 90) * Math.PI / 180)}" 
                        cy="${100 + 40 * Math.sin((startAngle + 45 - 90) * Math.PI / 180)}" 
                        r="10" fill="#FF7043" opacity="0.8" />
            `;

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.innerHTML = slice + topping;
            group.appendChild(g);
        }
        
        // Update Fraction Text
        document.getElementById('current-fraction').innerText = this.pizzaState;
    },

    updateFeedback() {
        const msgEl = document.getElementById('feedback-msg');
        let msg = "";
        if (this.pizzaState === 1) msg = "첫 번째 조각! (1/4)";
        else if (this.pizzaState === 2) msg = "두 번째 조각! 1/4 + 1/4 = 2/4 (반 조각)";
        else if (this.pizzaState === 3) msg = "세 번째 조각! 2/4 + 1/4 = 3/4";
        
        if (msg) this.showFeedback(msg, "success");
    },

    showFeedback(text, type) {
        const msgEl = document.getElementById('feedback-msg');
        msgEl.innerHTML = text;
        msgEl.className = `feedback-msg ${type}`;
        
        // Simple animation reset
        msgEl.style.animation = 'none';
        msgEl.offsetHeight; /* trigger reflow */
        msgEl.style.animation = 'popIn 0.3s ease';
    },

    // --- Quiz Logic ---
    checkQuiz(index, value) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.quiz-option');
        const nextBtn = document.getElementById('next-quiz-btn');
        
        // Reset styles
        buttons.forEach(btn => btn.classList.remove('correct', 'wrong'));

        if (index === this.correctAnswerIndex) {
            feedbackEl.innerHTML = "<strong>정답! 🎉</strong><br>3/8 + 2/8 = (3+2)/8 = 5/8 이에요.";
            feedbackEl.style.color = "#2E7D32";
            buttons[index].classList.add('correct');
            nextBtn.classList.remove('hidden');
        } else {
            feedbackEl.innerHTML = "<strong>틀렸어요! 😅</strong><br>분모(8)는 그대로 두고, 분자끼리만 더해보세요.";
            feedbackEl.style.color = "#C62828";
            buttons[index].classList.add('wrong');
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => ContentApp.init());