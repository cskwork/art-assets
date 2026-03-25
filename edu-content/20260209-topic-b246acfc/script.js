const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    // Core Scene State
    state: {
        currentSum: 0,
        slicesAdded: [] // stores values '1/5' or '2/5'
    },

    init() {
        this.renderHookPizza();
        this.bindEvents();
    },

    bindEvents() {
        // Common event binding if needed
    },

    showScene(index) {
        // Validation
        if (index < 0 || index >= this.scenes.length) return;

        // UI Update
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        
        this.currentScene = index;

        // Scene specific init
        if (this.scenes[index] === 'core') {
            this.resetCoreScene();
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },

    prevScene() {
        if (this.currentScene > 0) {
            this.showScene(this.currentScene - 1);
        }
    },

    // --- Visual Helpers ---
    renderHookPizza() {
        const svg = document.getElementById('hook-pizza');
        // Draw a simple pizza with 5 slices
        let content = '';
        for(let i=0; i<5; i++) {
            const color = i === 0 ? '#FF7043' : '#FFCC80'; // One slice distinct
            content += `<path d="M100,100 L100,10 A90,90 0 0,1 185.6,55 Z" fill="${color}" stroke="#E65100" stroke-width="2" transform="rotate(${i*72} 100 100)" />`;
        }
        svg.innerHTML = content;
    },

    // --- Core Scene Logic ---
    resetCoreScene() {
        this.state = { currentSum: 0, slicesAdded: [] };
        document.getElementById('target-slices-container').innerHTML = '';
        document.getElementById('equation-display').innerText = '0/5 + 0/5 = 0/5';
        document.getElementById('feedback-msg').innerText = '';
        document.getElementById('feedback-msg').className = 'feedback';
        
        // Reset source visibility
        document.querySelectorAll('.source-container .slice-holder').forEach(el => {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
        });
    },

    moveSlice(element, value) {
        // Visual move
        element.style.transition = 'all 0.5s ease';
        element.style.opacity = '0'; // Fade out from source
        
        // Clone to target
        const clone = element.cloneNode(true);
        clone.style.opacity = '1';
        clone.style.transform = `rotate(${this.state.currentSum * 72}deg)`; // 360/5 = 72 deg per slice
        
        // Adjust clone logic for 2/5 slice (it consists of 2 parts visually, but let's treat it as a block for simplicity or rotate properly)
        // For simplicity in this educational context, we rotate the whole group based on sum of numerator
        
        const container = document.getElementById('target-slices-container');
        
        // Logic to calculate rotation: 
        // Current Sum is numerator. 1 slice = 72deg.
        // However, simply appending DOM elements stacks them. 
        // We need to rotate the NEW slice to sit AFTER the existing slices.
        let rotation = 0;
        if(this.state.slicesAdded.length > 0) {
             // Calculate total numerator so far
             const totalNum = this.state.slicesAdded.reduce((a, b) => a + b, 0);
             rotation = totalNum * 72;
        }
        
        clone.style.transform = `rotate(${rotation}deg)`;
        container.appendChild(clone);

        // Update State
        this.state.slicesAdded.push(value);
        this.state.currentSum += value;

        // Update Equation
        const parts = this.state.slicesAdded.join(' + ');
        document.getElementById('equation-display').innerText = `${parts} = ${this.state.currentSum}/5`;

        // Feedback (Emojis removed as per guidelines)
        const feedback = document.getElementById('feedback-msg');
        if (this.state.currentSum === 3) {
            feedback.innerText = "정답입니다! 주문한 3/5가 완성되었어요!";
            feedback.className = 'feedback success';
            setTimeout(() => this.nextScene(), 2000); // Auto advance after success
        } else if (this.state.currentSum > 3) {
            feedback.innerText = "주문량보다 너무 많아요! 다시 해볼까요?";
            feedback.className = 'feedback error';
            setTimeout(() => this.resetCoreScene(), 1500);
        } else {
            feedback.innerText = "좋아요! 계속 더해보세요.";
            feedback.className = 'feedback progress';
        }
    },

    // --- Quiz Logic ---
    checkQuiz(btn, isCorrect) {
        const feedback = document.getElementById('quiz-feedback');
        const allBtns = document.querySelectorAll('.option-btn');
        
        allBtns.forEach(b => b.disabled = true);

        if (isCorrect) {
            btn.classList.add('correct');
            feedback.innerText = "정답입니다! 분모는 그대로, 분자만 더했죠?";
            feedback.style.color = "var(--success-color)";
            setTimeout(() => this.nextScene(), 2000);
        } else {
            btn.classList.add('wrong');
            feedback.innerText = "틀렸어요. 다시 생각해보세요! (분자끼리만 더해볼까요?)";
            feedback.style.color = "var(--error-color)";
            setTimeout(() => {
                allBtns.forEach(b => {
                    b.disabled = false;
                    b.classList.remove('wrong');
                });
                feedback.innerText = "";
            }, 2000);
        }
    },

    // --- Toast Notification (replacing alert) ---
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.innerText = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});