const MOVES = {
  rock:     { emoji: "✊", beats: { scissors: "crushes", lizard: "crushes" } },
  paper:    { emoji: "✋", beats: { rock: "covers", spock: "disproves" } },
  scissors: { emoji: "✌️", beats: { paper: "cuts", lizard: "decapitates" } },
  lizard:   { emoji: "🦎", beats: { paper: "eats", spock: "poisons" } },
  spock:    { emoji: "🖖", beats: { scissors: "smashes", rock: "vaporizes" } },
};
const MODES = {
  classic: ["rock", "paper", "scissors"],
  spicy: ["rock", "paper", "scissors", "lizard", "spock"],
};

const ROBO_LINES = {
  win: ["Robo: \"Beep boop. Too easy.\"", "Robo: \"Calculated. You never stood a chance.\"", "Robo: \"My circuits are tingling with victory!\""],
  lose: ["Robo: \"Lucky guess...\"", "Robo: \"ERROR: loss not found.\"", "Robo: \"Okay, I let you have that one.\""],
  tie: ["Robo: \"Great minds think alike.\"", "Robo: \"Are you reading my wires?!\"", "Robo: \"Again. Winner takes all.\""],
};

const choicesBox = document.getElementById("choices");
const roundsSelect = document.getElementById("rounds");
const modeSelect = document.getElementById("mode");
const resetButton = document.getElementById("reset");
const soundButton = document.getElementById("sound");
const message = document.getElementById("message");
const robo = document.getElementById("robo");
const pips = document.getElementById("pips");
const streakBadge = document.getElementById("streak");
const playerHand = document.getElementById("player-hand");
const computerHand = document.getElementById("computer-hand");
const playerScoreEl = document.getElementById("player-score");
const computerScoreEl = document.getElementById("computer-score");
const tieScoreEl = document.getElementById("tie-score");

let playerScore, computerScore, tieScore, roundNumber, streak, gameOver, busy;
let soundOn = true;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const currentMoves = () => MODES[modeSelect.value];
const winsNeeded = () => Math.ceil(Number(roundsSelect.value) / 2);

function getWinner(player, computer) {
  if (player === computer) return "tie";
  return MOVES[player].beats[computer] ? "player" : "computer";
}

let audioCtx;
function beep(freq, duration = 0.12, delay = 0, type = "square") {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const start = audioCtx.currentTime + delay;
    osc.start(start);
    osc.stop(start + duration);
  } catch (e) { /* audio not available */ }
}

function loadRecord() {
  try {
    return JSON.parse(localStorage.getItem("rpsRecord")) || { won: 0, lost: 0, bestStreak: 0 };
  } catch (e) {
    return { won: 0, lost: 0, bestStreak: 0 };
  }
}
function saveRecord(record) {
  try { localStorage.setItem("rpsRecord", JSON.stringify(record)); } catch (e) { /* storage unavailable */ }
}
function showRecord() {
  const record = loadRecord();
  document.getElementById("matches-won").textContent = record.won;
  document.getElementById("matches-lost").textContent = record.lost;
  document.getElementById("best-streak").textContent = record.bestStreak;
}

function confetti(count) {                                                         
  if (reduceMotion) return;
  const colors = ["#e83f6f", "#ffc93c", "#1b998b", "#7b5cff", "#2d7dd2"];
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("span");                                                         
    bit.className = "confetti";
    bit.style.left = Math.random() * 100 + "vw";
    bit.style.background = pick(colors);
    bit.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";                                                         
    bit.style.animationDelay = Math.random() * 0.4 + "s";
    bit.style.setProperty("--spin", Math.random() * 720 - 360 + "deg");
    bit.addEventListener("animationend", () => bit.remove());                                                         
    document.body.appendChild(bit);
  }
}

function shakeScreen() {
  document.body.classList.remove("screen-shake");
  void document.body.offsetWidth; // restart the animation
  document.body.classList.add("screen-shake");                                                         
}
                                                         
function bump(id) {
  const box = document.getElementById(id).parentElement;
  box.classList.remove("bump");
  void box.offsetWidth;                                                         
  box.classList.add("bump");
}                                                         

function setHand(el, move, state) {                                                         
  el.className = "hand " + state;
  el.querySelector(".emoji").textContent = MOVES[move].emoji;
}

function addPip(result) {                                                         
  const pip = document.createElement("span");
  pip.className = "pip " + result;
  pip.textContent = result === "w" ? "W" : result === "l" ? "L" : "T";
  pips.appendChild(pip);
}
                                                         
function showStreak() {
  streakBadge.hidden = streak < 2;
  streakBadge.textContent = "🔥 " + streak + " in a row!";
}                                                         

function floatBackground() {
  const bg = document.getElementById("bg");
  bg.innerHTML = "";
  const icons = ["✊", "✋", "✌️", "🦎", "🖖", "⭐"];                                                         
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span");                                                         
    s.textContent = pick(icons);
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 24 + Math.random() * 40 + "px";                                                         
    s.style.animationDuration = 14 + Math.random() * 16 + "s";
    s.style.animationDelay = -Math.random() * 20 + "s";                                                         
    bg.appendChild(s);
  }
}

function buildButtons() {
  choicesBox.innerHTML = "";                                                         
  currentMoves().forEach((move) => {                                                         
    const button = document.createElement("button");
    button.className = "choice";                                                         
    button.type = "button";
    button.dataset.choice = move;
    button.innerHTML = `<span class="emoji">${MOVES[move].emoji}</span>${move[0].toUpperCase() + move.slice(1)}`;
    button.addEventListener("click", () => playRound(move));
    choicesBox.appendChild(button);                                                         
  });
}
                                                         
function setButtonsDisabled(disabled) {
  choicesBox.querySelectorAll(".choice").forEach((b) => (b.disabled = disabled));
}

function playRound(playerChoice) {
  if (busy || gameOver) return;                                                         
  busy = true;
  setButtonsDisabled(true);
  playerHand.className = "hand shuffling";                                                         
  computerHand.className = "hand shuffling";                                                         

  const shuffler = setInterval(() => {
    playerHand.querySelector(".emoji").textContent = MOVES[pick(currentMoves())].emoji;
    computerHand.querySelector(".emoji").textContent = MOVES[pick(currentMoves())].emoji;
  }, 90);

  ["Rock...", "Paper...", "Scissors...", "SHOOT!"].forEach((word, i) => {                                                         
    setTimeout(() => {
      message.textContent = word;
      beep(i === 3 ? 880 : 330, 0.1);                                                         
    }, i * 300);
  });

  setTimeout(() => {                                                         
    clearInterval(shuffler);
    resolveRound(playerChoice, pick(currentMoves()));
  }, 1250);                                                         
}

function resolveRound(playerChoice, computerChoice) {                                                         
  const winner = getWinner(playerChoice, computerChoice);                                                         
  roundNumber++;
                                                         
  if (winner === "player") {                                                         
    playerScore++; streak++;
    setHand(playerHand, playerChoice, "win");
    setHand(computerHand, computerChoice, "lose");
    message.textContent = `Round ${roundNumber}: ${MOVES[playerChoice].emoji} ${playerChoice} ${MOVES[playerChoice].beats[computerChoice]} ${computerChoice}. You win!`;
    robo.textContent = pick(ROBO_LINES.lose);
    bump("player-score");
    addPip("w");                                                         
    confetti(30);
    beep(523, 0.1, 0); beep(659, 0.1, 0.1); beep(784, 0.2, 0.2);
  } else if (winner === "computer") {
    computerScore++; streak = 0;                                                         
    setHand(playerHand, playerChoice, "lose");
    setHand(computerHand, computerChoice, "win");
    message.textContent = `Round ${roundNumber}: ${MOVES[computerChoice].emoji} ${computerChoice} ${MOVES[computerChoice].beats[playerChoice]} ${playerChoice}. Robo wins.`;
    robo.textContent = pick(ROBO_LINES.win);
    bump("computer-score");
    addPip("l");
    shakeScreen();
    beep(300, 0.15, 0); beep(200, 0.3, 0.15, "sawtooth");
  } else {
    tieScore++;
    setHand(playerHand, playerChoice, "draw");
    setHand(computerHand, computerChoice, "draw");
    message.textContent = `Round ${roundNumber}: you both picked ${playerChoice}. It's a tie.`;
    robo.textContent = pick(ROBO_LINES.tie);
    bump("tie-score");
    addPip("t");
    beep(440, 0.2);
  }                                                         

  playerScoreEl.textContent = playerScore;
  computerScoreEl.textContent = computerScore;
  tieScoreEl.textContent = tieScore;                                                         
  showStreak();                                                         
  busy = false;
  checkMatchEnd();
  if (!gameOver) setButtonsDisabled(false);                                                         
}
                                                         
function checkMatchEnd() {
  const needed = winsNeeded();                                                         
  if (playerScore < needed && computerScore < needed) return;

  gameOver = true;
  const record = loadRecord();                      
  const playerWon = playerScore > computerScore;
  if (playerWon) record.won++; else record.lost++;                      
  record.bestStreak = Math.max(record.bestStreak, streak);                      
  saveRecord(record);
  showRecord();                      

  message.classList.add("final");
  if (playerWon) {
    message.textContent = `🏆 You won the match ${playerScore} to ${computerScore}!`;
    robo.textContent = "Robo: \"Rematch? I demand a rematch.\"";                      
    confetti(140);
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.18, i * 0.15));
  } else {
    message.textContent = `🤖 Robo won the match ${computerScore} to ${playerScore}.`;
    robo.textContent = "Robo: \"Better luck next time, human.\"";
  }
}
                      
function startGame() {
  playerScore = computerScore = tieScore = roundNumber = streak = 0;                      
  gameOver = false;
  busy = false;
  playerScoreEl.textContent = computerScoreEl.textContent = tieScoreEl.textContent = 0;
  for (const el of [playerHand, computerHand]) {                      
    el.className = "hand";
    el.querySelector(".emoji").textContent = "❔";                      
  }
  pips.innerHTML = "";
  showStreak();
  message.classList.remove("final");
  message.textContent = `First to ${winsNeeded()} wins. Pick a move to start round 1.`;
  robo.textContent = "Robo: \"Ready to lose?\"";
  buildButtons();                      
}                      

resetButton.addEventListener("click", startGame);                      
roundsSelect.addEventListener("change", startGame);
modeSelect.addEventListener("change", startGame);                      
soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.textContent = soundOn ? "🔊" : "🔇";                      
});

floatBackground();                      
showRecord();
startGame();                      
