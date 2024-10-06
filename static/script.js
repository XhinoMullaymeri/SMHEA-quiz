let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let startTime;
let timerInterval;

document.getElementById('newQuizBtn').addEventListener('click', () => startNewQuiz(false));
document.getElementById('allQuestionsBtn').addEventListener('click', () => startNewQuiz(true));

function startNewQuiz(allQuestions) {
    fetch('/get_quiz' + (allQuestions ? '?all=true' : ''))
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            currentQuiz = data;
            currentQuestionIndex = 0;
            userAnswers = new Array(currentQuiz.length).fill(null);
            showQuestion();
            document.getElementById('quizContainer').style.display = 'block';
            document.getElementById('newQuizBtn').style.display = 'none';
            document.getElementById('allQuestionsBtn').style.display = 'none';
            document.getElementById('results').style.display = 'none';
            
            // Start the timer
            startTime = new Date();
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load quiz: ' + error.message);
        });
}

function updateTimer() {
    if (!startTime) return;  // Don't update if startTime isn't set
    const currentTime = new Date();
    const elapsedTime = new Date(currentTime - startTime);
    const minutes = elapsedTime.getUTCMinutes().toString().padStart(2, '0');
    const seconds = elapsedTime.getUTCSeconds().toString().padStart(2, '0');
    document.getElementById('timer').textContent = `Time: ${minutes}:${seconds}`;
}

function showQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    document.getElementById('categoryText').textContent = question.category;
    document.getElementById('questionText').textContent = `Ερώτηση ${currentQuestionIndex + 1}: ${question.question}`;
    const answerOptions = document.getElementById('answerOptions');
    answerOptions.innerHTML = '';
    Object.entries(question.options).forEach(([key, value]) => {
        const button = document.createElement('button');
        button.classList.add('answer-option');
        
        const letterSpan = document.createElement('span');
        letterSpan.classList.add('answer-letter');
        letterSpan.textContent = key;
        
        const textSpan = document.createElement('span');
        textSpan.classList.add('answer-text');
        textSpan.textContent = value;
        
        button.appendChild(letterSpan);
        button.appendChild(textSpan);
        
        if (userAnswers[currentQuestionIndex] === key) {
            button.classList.add('selected');
        }
        button.addEventListener('click', () => selectAnswer(key));
        answerOptions.appendChild(button);
    });
    updateNavigation();
}

function selectAnswer(key) {
    if (userAnswers[currentQuestionIndex] === key) {
        userAnswers[currentQuestionIndex] = null;
    } else {
        userAnswers[currentQuestionIndex] = key;
    }
    showQuestion();
}

function updateNavigation() {
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === currentQuiz.length - 1;
    
    document.getElementById('prevBtn').disabled = isFirstQuestion;
    
    // Hide 'Next' button on the last question, show it otherwise
    if (isLastQuestion) {
        document.getElementById('nextBtn').style.display = 'none';
    } else {
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('nextBtn').disabled = false;
    }
    
    // Show 'Submit' button if all questions are answered
    const allAnswered = userAnswers.every(answer => answer !== null);
    document.getElementById('submitBtn').style.display = allAnswered ? 'inline-block' : 'none';
    
    updateQuestionStatus();
}

function updateQuestionStatus() {
    const totalQuestions = currentQuiz.length;
    const answeredQuestions = userAnswers.filter(answer => answer !== null).length;
    const status = `Ερώτηση ${currentQuestionIndex + 1} of ${totalQuestions}`;
    const unansweredCount = totalQuestions - answeredQuestions;
    
    let statusHTML = status;
    if (unansweredCount > 0) {
        statusHTML += `<span class="unanswered-indicator">(${unansweredCount} unanswered)</span>`;
    }
    
    document.getElementById('questionStatus').innerHTML = statusHTML;
}

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
});

document.getElementById('submitBtn').addEventListener('click', showResults);

function showResults() {
    // Stop the timer
    clearInterval(timerInterval);

    // Calculate total time
    const endTime = new Date();
    const totalTime = new Date(endTime - startTime);
    const minutes = totalTime.getUTCMinutes();
    const seconds = totalTime.getUTCSeconds();

    const resultsDiv = document.getElementById('results');
    let score = 0;
    currentQuiz.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct_answer;
        if (isCorrect) score++;
    });

    // Display the score and time first
    resultsDiv.innerHTML = `
        <h2>Quiz Results</h2>
        <h3>Your score: ${score} out of ${currentQuiz.length}</h3>
        <h3>Total Time: ${minutes} minutes and ${seconds} seconds</h3>
    `;

    // Then display individual question results
    currentQuiz.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct_answer;
        resultsDiv.innerHTML += `
            <div class="question-result">
                <p><strong>Category:</strong> ${question.category}</p>
                <p><strong>Question ${index + 1}:</strong> ${question.question}</p>
                <p>Your answer: ${userAnswer !== null ? question.options[userAnswer] : 'Skipped'}</p>
                <p>Correct answer: ${question.options[question.correct_answer]}</p>
                <p class="${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? 'Correct' : 'Incorrect'}</p>
            </div>
        `;
    });

    resultsDiv.style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('newQuizBtn').style.display = 'inline-block';
    document.getElementById('allQuestionsBtn').style.display = 'inline-block';

    // Reset timer
    startTime = null;
    clearInterval(timerInterval);
}

// When the page loads, check if there's a stored start time
window.onload = function() {
    const storedStartTime = localStorage.getItem('quizStartTime');
    if (storedStartTime) {
        startTime = new Date(parseInt(storedStartTime));
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }
}
