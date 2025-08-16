// Mode Configuration
const mode = new URLSearchParams(window.location.search).get("mode") || "easy";
const config = {
	easy: {
		cards: Array.from({ length: 10 }, (_, i) => i + 1),
		queries: [
			[1, 2, 3, 4],
			[2, 5, 6, 7],
			[3, 5, 8, 9],
			[4, 6, 8, 10],
			[1, 7, 9, 10],
		],
		cardsPerPlayer: 3,
		cardsToGuess: 1,
	},
	medium: {
		cards: Array.from({ length: 18 }, (_, i) => i + 1),
		queries: [
			[1, 2, 3],
			[2, 4, 5],
			[3, 4, 6],
			[5, 6, 7],
			[7, 8, 9],
			[8, 10, 11],
			[9, 10, 12],
			[11, 12, 13],
			[13, 14, 15],
			[14, 16, 17],
			[15, 16, 18],
			[17, 18, 1],
		],
		cardsPerPlayer: 5,
		cardsToGuess: 3,
	},
	hard: {
		cards: Array.from({ length: 27 }, (_, i) => i + 1),
		queries: [
			[1, 3, 12],
			[1, 7, 13],
			[1, 15, 19],
			[1, 16, 17],
			[2, 3, 25],
			[2, 8, 22],
			[2, 12, 13],
			[2, 17, 20],
			[3, 6, 9],
			[3, 19, 24],
			[4, 8, 18],
			[4, 10, 26],
			[4, 12, 19],
			[4, 22, 25],
			[5, 7, 23],
			[5, 14, 17],
			[5, 27, 18],
			[5, 21, 22],
			[6, 27, 25],
			[6, 18, 24],
			[6, 19, 26],
			[7, 11, 15],
			[7, 16, 24],
			[8, 14, 27],
			[8, 21, 26],
			[9, 27, 23],
			[9, 16, 18],
			[9, 20, 26],
			[10, 13, 15],
			[10, 17, 24],
			[10, 20, 25],
			[11, 13, 21],
			[11, 14, 20],
			[11, 16, 23],
			[12, 14, 22],
			[15, 21, 23],
		],
		cardsPerPlayer: 8,
		cardsToGuess: 3,
	},
};

let hands = {};
let blackVienna = [];
let selectedQuery = null;
let selectedGuess = [];
let fullQueryDeck = [];
let visibleQueries = [];
let usedQueries = new Set();
let currentTurnIndex = 0;
let players = [];

// DOM elements
const getEl = (id) => document.getElementById(id);
const queryContainer = getEl("query-cards");
const guessOptions = getEl("guess-options");
const guessButton = getEl("guess-button");
const statusLine = getEl("current-player-label");
const yourCardsContainer = getEl("your-cards");
const logBox = getEl("log-box");

function shuffle(arr) {
	let a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function numberToLetter(n) {
	if (mode === "easy") {
		if (n === 1) return "A";
		return String(n);
	} else if (mode === "medium") {
		if (n >= 1 && n <= 9) return `${n === 1 ? "A" : n}♠️`;
		if (n >= 10 && n <= 18) return `${n === 10 ? "A" : n - 9}♥️`;
	} else if (mode === "hard") {
		if (n === 27) return "@";
		return String.fromCharCode(64 + n);
	}
	return n.toString();
}

function setStatus(msg) {
	statusLine.textContent = msg;
}

function scrollLogToBottom() {
	logBox.scrollTop = logBox.scrollHeight;
}

function drawQueryCards() {
	queryContainer.innerHTML = "";
	visibleQueries.forEach((query, index) => {
		const div = document.createElement("div");
		div.className = "query-card";
		div.textContent = query.map(numberToLetter).join(" ");
		div.onclick = () => {
			selectedQuery = visibleQueries[index];
			document
				.querySelectorAll(".query-card")
				.forEach((card) => card.classList.remove("selected-query"));
			div.classList.add("selected-query");
			setStatus(`Choose a player to ask`);
			showAskButtons(); // ← Add this line
		};
		queryContainer.appendChild(div);
	});
}

function handleQueryUsage(index) {
	const usedCard = visibleQueries[index];
	const usedKey = usedCard.toString();
	if (!usedQueries.has(usedKey)) {
		usedQueries.add(usedKey);
		if (fullQueryDeck.length > 0) {
			const newCard = fullQueryDeck.pop();
			visibleQueries.push(newCard);
		}
	}
}

function drawGuessOptions() {
	guessOptions.innerHTML = "";
	config[mode].cards.forEach((c) => {
		const div = document.createElement("div");
		div.className = "card guess-option";
		div.textContent = numberToLetter(c);
		div.onclick = () => selectGuess(c, div);
		guessOptions.appendChild(div);
	});
	document
		.querySelectorAll(".guess-option")
		.forEach((el) => el.classList.remove("selected"));
}

function selectGuess(card, element) {
	const index = selectedGuess.indexOf(card);
	if (index !== -1) {
		selectedGuess.splice(index, 1);
		element.classList.remove("selected");
	} else if (selectedGuess.length < config[mode].cardsToGuess) {
		selectedGuess.push(card);
		element.classList.add("selected");
	}
}

guessButton.onclick = () => {
	if (selectedGuess.length !== config[mode].cardsToGuess) {
		alert(`Select exactly ${config[mode].cardsToGuess} card(s).`);
		return;
	}
	const guessed = selectedGuess.sort().join(",");
	const actual = blackVienna.sort().join(",");
	if (guessed === actual) {
		alert("🎉 Correct! You win!");
	} else {
		alert(
			`❌ Wrong. The hidden cards were: ${blackVienna
				.map(numberToLetter)
				.join(", ")}`
		);
	}
	setTimeout(initGame, 1500);
};

function initGame() {
	const numPlayers = 3;
	const cards = config[mode].cards;
	const shuffled = shuffle(cards);
	const cardsToGuess = config[mode].cardsToGuess;
	const cardsPerPlayer = config[mode].cardsPerPlayer;

	blackVienna = shuffled.slice(0, cardsToGuess);
	hands = {};
	players = [];

	for (let i = 0; i < numPlayers; i++) {
		const name = `Player ${i + 1}`;
		hands[name] = shuffled.slice(
			cardsToGuess + i * cardsPerPlayer,
			cardsToGuess + (i + 1) * cardsPerPlayer
		);
		players.push(name);
	}
	currentTurnIndex = 0;
	selectedGuess = [];
	selectedQuery = null;
	fullQueryDeck = shuffle(config[mode].queries);
	visibleQueries = fullQueryDeck.splice(0, 3);
	usedQueries = new Set();

	drawQueryCards();
	drawGuessOptions();
	setStatus(`${players[currentTurnIndex]}'s turn`);
	renderCurrentPlayerHand();
	logBox.innerHTML = "<strong>Query Log:</strong><br>";
}

function renderCurrentPlayerHand() {
	const hand = hands[players[currentTurnIndex]];
	yourCardsContainer.innerHTML = hand
		.map((c) => `<div class="card">${numberToLetter(c)}</div>`)
		.join("");
}

function showAskButtons() {
	const askBox = document.getElementById("ask-buttons");
	askBox.innerHTML = "";
	const current = players[currentTurnIndex];
	console.log("Current player is", current);
	players
		.filter((p) => p !== current)
		.forEach((p) => {
			const btn = document.createElement("button");
			btn.textContent = `Ask ${p}`;
			btn.onclick = () => handleQuery(current, p);
			askBox.appendChild(btn);
		});
	askBox.style.display = "block";
}

function handleQuery(from, to) {
	if (!selectedQuery) return;
	const matchCount = selectedQuery.filter((c) =>
		hands[to].includes(c)
	).length;
	const queryText = selectedQuery.map(numberToLetter).join(" ");
	logBox.innerHTML += `<br>🟢 ${from} → ${to} [${queryText}] → ${matchCount} match(es)`;

	// Replace query if it's newly used
	const index = visibleQueries.findIndex(
		(q) => q.toString() === selectedQuery.toString()
	);
	if (index !== -1) {
		handleQueryUsage(index);
		drawQueryCards();
	}

	scrollLogToBottom();
	document.getElementById("ask-buttons").style.display = "none";
	selectedQuery = null;

	// Move to next player
	document.getElementById("next-turn").style.display = "inline-block";
	setStatus(`${players[currentTurnIndex]}'s turn`);
}

document.getElementById("next-turn").onclick = () => {
	currentTurnIndex = (currentTurnIndex + 1) % players.length;
	setStatus(`${players[currentTurnIndex]}'s turn`);
	renderCurrentPlayerHand();
	document.getElementById("next-turn").style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {
	initGame();
});
