// Mode Configuration
const mode = new URLSearchParams(window.location.search).get("mode") || "easy";
const urlPlayers = parseInt(
	new URLSearchParams(window.location.search).get("players") || "0",
	10
);
const urlBots = parseInt(
	new URLSearchParams(window.location.search).get("bots") || "0",
	10
);
let urlNames = [];
try {
	const namesParam = new URLSearchParams(window.location.search).get("names");
	if (namesParam) {
		urlNames = JSON.parse(decodeURIComponent(namesParam));
	}
} catch (e) {
	urlNames = [];
}
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
			[3, 6, 9], // l1: CFI
			[2, 17, 20], // l2: BQT
			[2, 12, 13], // l3: BLM
			[2, 8, 22], // l4: BHV
			[2, 3, 25], // l5: BCY
			[1, 16, 17], // l6: APQ
			[1, 15, 19], // l7: AOS
			[1, 7, 13], // l8: AGM
			[1, 3, 12], // l9: ACL
			[15, 21, 23], // l10: OUW
			[12, 14, 22], // l11: LNV
			[11, 16, 23], // l12: KPW
			[11, 14, 20], // l13: KNT
			[11, 13, 21], // l14: KMU
			[10, 20, 25], // l15: JTY
			[10, 17, 24], // l16: JQX
			[10, 13, 15], // l17: JMO
			[9, 20, 26], // l18: ITZ
			[9, 16, 18], // l19: IPR
			[9, 27, 23], // l20: I@W
			[8, 21, 26], // l21: HUZ
			[8, 14, 27], // l22: HN@
			[7, 16, 24], // l23: GPX
			[7, 11, 15], // l24: GKO
			[6, 19, 26], // l25: FSZ
			[6, 18, 24], // l26: FRX
			[6, 27, 25], // l27: F@Y
			[5, 21, 22], // l28: EUV
			[5, 27, 18], // l29: E@R
			[5, 14, 17], // l30: ENQ
			[5, 7, 23], // l31: EGW
			[4, 22, 25], // l32: DVY
			[4, 12, 19], // l33: DLS
			[4, 10, 26], // l34: DJZ
			[4, 8, 18], // l35: DHR
			[3, 19, 24], // l36: CSX
		],
		cardsPerPlayer: 8,
		cardsToGuess: 3,
	},
};

// DOM elements
const getEl = (id) => document.getElementById(id);
const queryContainer = getEl("query-cards");
const guessOptions = getEl("guess-options");
const guessButton = getEl("guess-button");
const guessModal = getEl("guess-modal");
const guessModalClose = getEl("close-guess-modal");
const guessModalSubmit = getEl("submit-guess-modal");
const chooseQueryButton = getEl("choose-query-button");
const queryModal = getEl("query-modal");
const closeQueryModalBtn = getEl("close-query-modal");
const queryModalTop = getEl("query-modal-top");
const queryModalUsed = getEl("query-modal-used");
const handModal = getEl("hand-modal");
const handModalClose = getEl("close-hand-modal");
const handModalBody = getEl("hand-modal-body");
const resultModal = getEl("result-modal");
const resultTitle = getEl("result-title");
const resultMessage = getEl("result-message");
const closeResultModalBtn = getEl("close-result-modal");
const resultRestartBtn = getEl("result-restart");
const resultNewBtn = getEl("result-new");
const playersLayout = getEl("players-layout");
const askModal = getEl("ask-modal");
const askModalBody = getEl("ask-modal-body");
const askModalClose = getEl("close-ask-modal");
const restartButton = getEl("restart-button");
const statusLine = getEl("current-player-label");
const yourCardsContainer = getEl("your-cards");
const logBox = getEl("log-box");
const askButtons = getEl("ask-buttons");
const nextTurnBtn = getEl("next-turn");
const playerCountSelect = getEl("player-count");
const playerCountWrapper = getEl("player-count-wrapper");
const tokensLine = getEl("tokens-line");
const hiddenStackEl = getEl("hidden-stack");
const showHandBtn = getEl("show-hand-btn");
const handCount = getEl("hand-count");
let askHandler = null;

const hardCardKeys = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
	"@",
];

const fastCardKeys = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const hardPlayerColors = [
	"#ff7f50",
	"#00a7a0",
	"#7b5dfa",
	"#e63946",
	"#f4a261",
	"#4cc9f0",
];

const hardQueries = config.hard.queries.map((combo, idx) => ({
	id: idx + 1,
	combo,
	image: `query2/l${idx + 1}.png`,
}));

const fastQueries = config.easy.queries.map((combo, idx) => ({
	id: idx + 1,
	combo,
	image: `query1/q${idx + 1}.png`,
}));

const isHardLikeMode = mode === "hard" || mode === "fast";

const layoutPositions = {
	3: [
		{ left: "42%", top: "6%" },
		{ left: "18%", top: "39%" },
		{ left: "66%", top: "39%" },
	],
	4: [
		{ left: "28%", top: "6%" },
		{ left: "58%", top: "6%" },
		{ left: "18%", top: "39%" },
		{ left: "68%", top: "39%" },
	],
	5: [
		{ left: "42%", top: "0%" },
		{ left: "20%", top: "22%" },
		{ left: "64%", top: "22%" },
		{ left: "30%", top: "44%" },
		{ left: "54%", top: "44%" },
	],
	6: [
		{ left: "18%", top: "12%" },
		{ left: "44%", top: "12%" },
		{ left: "70%", top: "12%" },
		{ left: "18%", top: "44%" },
		{ left: "44%", top: "44%" },
		{ left: "70%", top: "44%" },
	],
};

function currentHiddenCount() {
	if (mode === "fast") return 1;
	if (mode !== "hard") return config[mode]?.cardsToGuess || 3;
	return hardState.numPlayers === 5 ? 2 : 3;
}

function cardsPerPlayerByCount(playerCount) {
	if (mode === "fast") return 3;
	if (mode !== "hard") return config[mode]?.cardsPerPlayer || 3;
	const perPlayerMap = { 3: 8, 4: 6, 5: 5, 6: 4 };
	return perPlayerMap[playerCount] || 3;
}

function hardLikeTotalCards() {
	return mode === "fast" ? 10 : 27;
}

function hardLikeCardKeys() {
	return mode === "fast" ? fastCardKeys : hardCardKeys;
}

function hardLikeQueries() {
	return mode === "fast" ? fastQueries : hardQueries;
}

function hardGuessCount() {
	if (!isHardLikeMode) return config[mode]?.cardsToGuess || 3;
	return currentHiddenCount();
}

const classicState = {
	hands: {},
	hiddenCards: [],
	selectedQuery: null,
	selectedGuess: [],
	fullQueryDeck: [],
	visibleQueries: [],
	usedQueries: new Set(),
	currentTurnIndex: 0,
	players: [],
};

const hardState = {
	players: [],
	hands: {},
	hiddenCards: [],
	queryPiles: [[], [], []],
	usedCards: [],
	tokensRemaining: {},
	currentTurnIndex: 0,
	selectedQueryCard: null,
	selectedQuerySource: null,
	selectedGuess: [],
	showingHand: false,
	numPlayers: 3,
	hiddenCount: 3,
	botCount: 0,
	roles: {},
};

function shuffle(arr) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function numberToLetter(n, currentMode = mode) {
	if (currentMode === "easy") {
		if (n === 1) return "A";
		return String(n);
	} else if (currentMode === "medium") {
		if (n >= 1 && n <= 9) return `${n === 1 ? "A" : n}♠️`;
		if (n >= 10 && n <= 18) return `${n === 10 ? "A" : n - 9}♥️`;
	}
	return n.toString();
}

function setStatus(msg) {
	statusLine.textContent = msg;
}

function scrollLogToBottom() {
	if (logBox) logBox.scrollTop = logBox.scrollHeight;
}

function openAskModal(options = []) {
	if (!askModal || !askModalBody) return;
	askModalBody.innerHTML = "";
	options.forEach((opt) => {
		const btn = document.createElement("button");
		btn.className = "choice-btn";
		btn.textContent = opt.label;
		btn.onclick = () => {
			if (askHandler) askHandler(opt.value);
			closeAskModal();
		};
		askModalBody.appendChild(btn);
	});
	askModal.style.display = "flex";
}

function closeAskModal() {
	if (askModal) askModal.style.display = "none";
	askHandler = null;
}

function renderPlayersLayout() {
	if (!playersLayout) return;
	playersLayout.innerHTML = "";
	const positions = layoutPositions[hardState.players.length] || layoutPositions[3];
	hardState.players.forEach((p, idx) => {
		const card = document.createElement("div");
		card.className = "player-card";
		if (idx === hardState.currentTurnIndex) card.classList.add("active");
		const role = p;
		card.style.left = positions[idx]?.left || "10%";
		card.style.top = positions[idx]?.top || "10%";
		const count = hardState.hands[p]?.length || 0;
		const showRole = hardState.players.length === 3;
		const roleLabel =
			showRole && hardState.roles[p] === "bot"
				? "Bot"
				: showRole
					? "Human"
					: "";
		const colorDot = hardPlayerColors[idx % hardPlayerColors.length];
		card.innerHTML = `${roleLabel ? `<span class=\"role\">${roleLabel}</span>` : ""}<span class=\"name\"><span class=\"color-dot\" style=\"width:12px;height:12px;background:${colorDot};margin-right:6px;display:inline-block;border-radius:50%;\"></span>${role}</span><div class=\"info\">${count} card${count === 1 ? "" : "s"}</div>`;
		playersLayout.appendChild(card);
	});
}

function clearLog() {
	if (logBox) {
		logBox.innerHTML = "<strong>Query Log:</strong><br>";
	}
}

function resetAskButtons() {
	if (!askButtons) return;
	askButtons.innerHTML = "";
	askButtons.style.display = "none";
}

function updateNextButton(show) {
	if (nextTurnBtn) nextTurnBtn.style.display = "none";
}

function buildTokenDots(tokens = []) {
	const wrap = document.createElement("div");
	wrap.className = "token-dots";
	tokens.forEach((t) => {
		const dot = document.createElement("div");
		dot.className = "token-dot";
		dot.style.backgroundColor = t.color;
		dot.title = `${t.fromShort || ""}${t.toShort ? `→${t.toShort}` : ""}${
			t.count ? `: ${t.count}` : ""
		}`;
		wrap.appendChild(dot);
	});
	return wrap;
}

function openQueryModal() {
	if (!isHardLikeMode) return;
	if (!queryModal) return;
	renderQueryModal();
	queryModal.style.display = "flex";
}

function closeQueryModal() {
	if (!queryModal) return;
	queryModal.style.display = "none";
}

function renderQueryModal() {
	if (!queryModalTop || !queryModalUsed) return;
	queryModalTop.innerHTML = "";
	hardState.queryPiles.forEach((pile, idx) => {
		const card = pile[0];
		const slot = document.createElement("div");
		slot.className = "card-frame query-card-option";
		if (card) {
			slot.style.backgroundImage = `url(${card.image})`;
			slot.onclick = () =>
				selectHardQueryCard(card, { type: "pile", pileIndex: idx });
		} else {
			slot.classList.add("pile-card", "empty");
			slot.style.backgroundImage = "none";
			slot.textContent = "Empty";
		}
		queryModalTop.appendChild(slot);
	});

	queryModalUsed.innerHTML = "";
	if (hardState.usedCards.length === 0) {
		const note = document.createElement("div");
		note.className = "muted";
		note.textContent = "No used cards yet.";
		queryModalUsed.appendChild(note);
	} else {
		hardState.usedCards.forEach((entry) => {
			const slot = document.createElement("div");
			slot.className = "card-frame query-card-option";
			slot.style.backgroundImage = `url(${entry.card.image})`;
			const dots = buildTokenDots(entry.tokens);
			slot.appendChild(dots);
			slot.onclick = () =>
				selectHardQueryCard(entry.card, { type: "used", cardId: entry.card.id });
			queryModalUsed.appendChild(slot);
		});
	}
}

function openGuessModal() {
	if (!guessModal) return;
	guessModal.style.display = "flex";
	if (isHardLikeMode) {
		renderHardGuessOptions();
	} else {
		drawClassicGuessOptions();
	}
}

function closeGuessModal() {
	if (!guessModal) return;
	guessModal.style.display = "none";
}

function showResultModal({ title, message }) {
	if (!resultModal) return;
	if (resultTitle) resultTitle.textContent = title;
	if (resultMessage) resultMessage.textContent = message;
	resultModal.style.display = "flex";
	if (title.toLowerCase().includes("correct")) {
		resultModal.classList.add("celebrate");
		setTimeout(() => resultModal.classList.remove("celebrate"), 1500);
	}
}

function closeResultModal() {
	if (resultModal) resultModal.style.display = "none";
}

function openHandModal() {
	if (!handModal || !handModalBody) return;
	handModalBody.innerHTML = "";
	let hand = [];
	if (isHardLikeMode) {
		hand = hardState.hands[hardState.players[hardState.currentTurnIndex]] || [];
		hand.forEach((id) => {
			const div = document.createElement("div");
			if (mode === "hard") {
				div.className = "card card-img guess-option";
				div.style.backgroundImage = `url(${hardIdToImage(id)})`;
			} else {
				div.className = "card guess-option";
				div.textContent = hardIdToKey(id);
			}
			handModalBody.appendChild(div);
		});
	} else {
		hand = classicState.hands[classicState.players[classicState.currentTurnIndex]] || [];
		hand.forEach((id) => {
			const div = document.createElement("div");
			div.className = "card guess-option";
			div.textContent = numberToLetter(id, mode);
			handModalBody.appendChild(div);
		});
	}
	if (hand.length === 0) {
		const empty = document.createElement("div");
		empty.className = "muted";
		empty.textContent = "No cards.";
		handModalBody.appendChild(empty);
	}
	handModal.style.display = "flex";
}

function closeHandModal() {
	if (handModal) handModal.style.display = "none";
}

// -------- Classic modes (easy / medium) --------
function initClassicGame() {
	if (playerCountWrapper) playerCountWrapper.style.display = "none";
	if (hiddenStackEl) {
		hiddenStackEl.style.display = "none";
		hiddenStackEl.innerHTML = "";
	}
	if (tokensLine) tokensLine.innerHTML = "";
	if (showHandBtn) showHandBtn.style.display = "none";
	if (handCount) handCount.textContent = "";
	queryContainer.classList.remove("query-piles");
	if (chooseQueryButton) chooseQueryButton.style.display = "none";
	if (logBox && logBox.parentElement)
		logBox.parentElement.style.display = "block";

	const numPlayers = 3;
	const cards = config[mode].cards;
	const shuffled = shuffle(cards);
	const cardsToGuess = config[mode].cardsToGuess;
	const cardsPerPlayer = config[mode].cardsPerPlayer;

	classicState.hiddenCards = shuffled.slice(0, cardsToGuess);
	classicState.hands = {};
	classicState.players = [];

	for (let i = 0; i < numPlayers; i++) {
		const name = `Player ${i + 1}`;
		classicState.hands[name] = shuffled.slice(
			cardsToGuess + i * cardsPerPlayer,
			cardsToGuess + (i + 1) * cardsPerPlayer
		);
		classicState.players.push(name);
	}

	classicState.currentTurnIndex = 0;
	classicState.selectedGuess = [];
	classicState.selectedQuery = null;
	classicState.fullQueryDeck = shuffle(config[mode].queries);
	classicState.visibleQueries = classicState.fullQueryDeck.splice(0, 3);
	classicState.usedQueries = new Set();

	clearLog();
	drawClassicQueryCards();
	drawClassicGuessOptions();
	setStatus(`${classicState.players[0]}'s turn`);
	renderClassicHand();
	resetAskButtons();
	updateNextButton(false);
}

function drawClassicQueryCards() {
	queryContainer.innerHTML = "";
	classicState.visibleQueries.forEach((query, index) => {
		const div = document.createElement("div");
		div.className = "query-card";
		div.textContent = query.map((q) => numberToLetter(q, mode)).join(" ");
		div.onclick = () => {
			classicState.selectedQuery = classicState.visibleQueries[index];
			document
				.querySelectorAll(".query-card")
				.forEach((card) => card.classList.remove("selected-query"));
			div.classList.add("selected-query");
			setStatus(`Choose a player to ask`);
			showClassicAskButtons();
		};
		queryContainer.appendChild(div);
	});
}

function drawClassicGuessOptions() {
	guessOptions.innerHTML = "";
	config[mode].cards.forEach((c) => {
		const div = document.createElement("div");
		div.className = "card guess-option";
		div.textContent = numberToLetter(c, mode);
		if (classicState.selectedGuess.includes(c)) {
			div.classList.add("selected");
		}
		div.onclick = () => selectClassicGuess(c, div);
		guessOptions.appendChild(div);
	});
}

function selectClassicGuess(card, element) {
	const index = classicState.selectedGuess.indexOf(card);
	if (index !== -1) {
		classicState.selectedGuess.splice(index, 1);
		element.classList.remove("selected");
	} else if (classicState.selectedGuess.length < config[mode].cardsToGuess) {
		classicState.selectedGuess.push(card);
		element.classList.add("selected");
	}
}

function handleClassicGuess() {
	if (classicState.selectedGuess.length !== config[mode].cardsToGuess) {
		alert(`Select exactly ${config[mode].cardsToGuess} card(s).`);
		return false;
	}
	const guesser = classicState.players[classicState.currentTurnIndex];
	const guessed = [...classicState.selectedGuess].sort().join(",");
	const actual = [...classicState.hiddenCards].sort().join(",");
	const success = guessed === actual;
	showResultModal({
		title: success ? "Correct!" : "Incorrect",
		message: success
			? `${guesser} solved the case!`
			: `Wrong guess. Hidden cards were ${classicState.hiddenCards
					.map((n) => numberToLetter(n, mode))
					.join(", ")}.`,
	});
	return true;
}

function renderClassicHand() {
	const hand = classicState.hands[classicState.players[classicState.currentTurnIndex]];
	handCount.textContent = hand ? `${hand.length} cards` : "";
	yourCardsContainer.innerHTML = (hand || [])
		.map((c) => `<div class="card">${numberToLetter(c, mode)}</div>`)
		.join("");
}

function showClassicAskButtons() {
	const current = classicState.players[classicState.currentTurnIndex];
	const options = classicState.players
		.filter((p) => p !== current)
		.map((p) => ({ label: `Ask ${p}`, value: p }));
	askHandler = (target) => handleClassicQuery(current, target);
	openAskModal(options);
}

function handleClassicQuery(from, to) {
	if (!classicState.selectedQuery) return;
	const matchCount = classicState.selectedQuery.filter((c) =>
		classicState.hands[to].includes(c)
	).length;
	const queryText = classicState.selectedQuery
		.map((n) => numberToLetter(n, mode))
		.join(" ");
	if (logBox)
		logBox.innerHTML += `<br>🟢 ${from} → ${to} [${queryText}] → ${matchCount} match(es)`;

	const index = classicState.visibleQueries.findIndex(
		(q) => q.toString() === classicState.selectedQuery.toString()
	);
	if (index !== -1) {
		const usedKey = classicState.visibleQueries[index].toString();
		if (!classicState.usedQueries.has(usedKey)) {
			classicState.usedQueries.add(usedKey);
			if (classicState.fullQueryDeck.length > 0) {
				const newCard = classicState.fullQueryDeck.pop();
				classicState.visibleQueries.push(newCard);
			}
		}
		classicState.visibleQueries.splice(index, 1);
	}
	drawClassicQueryCards();
	scrollLogToBottom();
	resetAskButtons();
	classicState.selectedQuery = null;
	updateNextButton(false);
	setStatus(`${from} asked ${to}. Moving to next turn...`);
	setTimeout(nextClassicTurn, 600);
}

function nextClassicTurn() {
	classicState.currentTurnIndex =
		(classicState.currentTurnIndex + 1) % classicState.players.length;
	setStatus(`${classicState.players[classicState.currentTurnIndex]}'s turn`);
	renderClassicHand();
	updateNextButton(false);
}

// -------- Hard mode --------
function hardIdToKey(id) {
	if (mode === "fast") {
		return fastCardKeys[id - 1] || String(id);
	}
	if (id === 27) return "@";
	return String.fromCharCode(96 + id);
}

function hardIdToImage(id) {
	if (mode === "fast") return null;
	return `playCards/${hardIdToKey(id)}.png`;
}

function formatQueryText(combo) {
	return combo.map((n) => hardIdToKey(n)).join(" ");
}

function renderHiddenStack() {
	if (!hiddenStackEl) return;
	hiddenStackEl.innerHTML = "";
	const count = currentHiddenCount();
	for (let i = 0; i < count; i++) {
		const card = document.createElement("div");
		card.className = "hidden-card";
		hiddenStackEl.appendChild(card);
	}
	hiddenStackEl.style.display = "block";
}

function renderTokensLine() {
	if (!tokensLine) return;
	tokensLine.innerHTML = "";
	hardState.players.forEach((p, idx) => {
		const chip = document.createElement("div");
		chip.className = "token-chip";
		const dot = document.createElement("span");
		dot.className = "color-dot";
		dot.style.backgroundColor = hardPlayerColors[idx % hardPlayerColors.length];
		const text = document.createElement("span");
		text.textContent = `${p}: ${hardState.tokensRemaining[p]} tokens left`;
		chip.appendChild(dot);
		chip.appendChild(text);
		tokensLine.appendChild(chip);
	});
}

function renderHardQueryPiles() {
	queryContainer.innerHTML = "";
	queryContainer.classList.add("query-piles");
	queryContainer.style.display = "grid";
	queryContainer.style.gridTemplateColumns = "repeat(3, 140px)";
	queryContainer.style.justifyItems = "center";
	queryContainer.style.justifyContent = "center";
	queryContainer.style.gap = "10px";
	hardState.queryPiles.forEach((pile, idx) => {
		const wrapper = document.createElement("div");
		wrapper.className = "query-pile";

		const cardFace = document.createElement("div");
		cardFace.className = "pile-card";
		const topCard = pile[0];
		if (topCard) {
			cardFace.style.backgroundImage = `url(${topCard.image})`;
			cardFace.onclick = () => openQueryModal();
			cardFace.title = `Deck ${idx + 1}`;
		} else {
			cardFace.classList.add("empty");
			cardFace.textContent = "No cards";
		}

		const meta = document.createElement("div");
		meta.className = "pile-meta";
		meta.innerHTML = `<span>Deck ${idx + 1}</span><span>${pile.length} left</span>`;

		wrapper.append(cardFace, meta);
		queryContainer.appendChild(wrapper);
	});
}

function selectHardQueryCard(card, source) {
	hardState.selectedQueryCard = card;
	hardState.selectedQuerySource = source;
	closeQueryModal();
	setStatus(
		`${hardState.players[hardState.currentTurnIndex]} chose a query card. Pick a player to ask.`
	);
	showHardAskButtons();
}

function showHardAskButtons() {
	if (!hardState.selectedQueryCard) return;
	const current = hardState.players[hardState.currentTurnIndex];
	const options = hardState.players
		.filter((p) => p !== current)
		.map((p) => ({ label: `Ask ${p}`, value: p }));
	askHandler = (target) => handleHardQuery(target);
	openAskModal(options);
}

function attachTokenToUsedCard(card, token) {
	let entry = hardState.usedCards.find((u) => u.card.id === card.id);
	if (!entry) {
		entry = { card, tokens: [] };
		hardState.usedCards.push(entry);
	}
	entry.tokens.push(token);
}

function handleHardQuery(target) {
	if (!hardState.selectedQueryCard || !hardState.selectedQuerySource) return;
	const source = hardState.selectedQuerySource;
	const queryCard = hardState.selectedQueryCard;
	const from = hardState.players[hardState.currentTurnIndex];
	const matches = queryCard.combo.filter((c) => hardState.hands[target].includes(c))
		.length;

	const color = hardPlayerColors[
		hardState.players.indexOf(target) % hardPlayerColors.length
	];
	const token = {
		color,
		fromShort: target.replace("Player ", "P"),
		toShort: from.replace("Player ", "P"),
		count: matches,
	};

	if (source.type === "pile") {
		hardState.queryPiles[source.pileIndex].shift();
	}
	for (let i = 0; i < Math.max(1, matches); i++) {
		attachTokenToUsedCard(queryCard, token);
	}
	if (matches > 0) {
		const remaining = hardState.tokensRemaining[from];
		hardState.tokensRemaining[from] = Math.max(0, remaining - matches);
	}

	renderTokensLine();
	renderHardQueryPiles();
	resetAskButtons();
	updateNextButton(false);
	setStatus(`${from} asked ${target}. Moving to next turn...`);
	hardState.selectedQueryCard = null;
	hardState.selectedQuerySource = null;
	renderPlayersLayout();
	setTimeout(nextHardTurn, 600);
}

function renderHardHand() {
	const hand = hardState.hands[hardState.players[hardState.currentTurnIndex]] || [];
	if (!hardState.showingHand) {
		handCount.textContent = "";
		yourCardsContainer.innerHTML = "";
		return;
	}
	handCount.textContent = `${hand.length} cards`;
	yourCardsContainer.innerHTML = hand
		.map((id) => {
			if (mode === "hard") {
				return `<div class="card card-img" style="background-image:url('${hardIdToImage(
					id
				)}')" aria-label="${hardIdToKey(id)}"></div>`;
			}
			return `<div class="card" aria-label="${hardIdToKey(id)}">${hardIdToKey(
				id
			)}</div>`;
		})
		.join("");
}

function updateShowHandButton() {
	if (!showHandBtn) return;
	showHandBtn.textContent = hardState.showingHand
		? "Hide My Cards"
		: "Show My Cards";
}

function toggleHardHand() {
	hardState.showingHand = !hardState.showingHand;
	updateShowHandButton();
	renderHardHand();
}

function renderHardGuessOptions() {
	guessOptions.innerHTML = "";
	const keys = hardLikeCardKeys();
	keys.forEach((key, idx) => {
		const id = idx + 1;
		const div = document.createElement("div");
		if (mode === "hard") {
			div.className = "card card-img guess-option";
			div.style.backgroundImage = `url(playCards/${key}.png)`;
		} else {
			div.className = "card guess-option";
			div.textContent = key;
		}
		if (hardState.selectedGuess.includes(id)) {
			div.classList.add("selected");
		}
		div.onclick = () => selectHardGuess(id, div);
		guessOptions.appendChild(div);
	});
}

function selectHardGuess(id, element) {
	const index = hardState.selectedGuess.indexOf(id);
	if (index !== -1) {
		hardState.selectedGuess.splice(index, 1);
		element.classList.remove("selected");
	} else if (hardState.selectedGuess.length < hardGuessCount()) {
		hardState.selectedGuess.push(id);
		element.classList.add("selected");
	}
}

function handleHardGuess() {
	const guessTarget = hardGuessCount();
	if (hardState.selectedGuess.length !== guessTarget) {
		alert(`Select exactly ${guessTarget} card(s).`);
		return false;
	}
	const guesser = hardState.players[hardState.currentTurnIndex];
	const guessed = [...hardState.selectedGuess].sort();
	const actual = [...hardState.hiddenCards].sort();
	const correct = guessed.every((val, idx) => val === actual[idx]);
	showResultModal({
		title: correct ? "Correct!" : "Incorrect",
		message: correct
			? `${guesser} solved the case!`
			: `Wrong guess. Hidden cards were ${hardState.hiddenCards
					.map((id) => hardIdToKey(id))
					.join(", ")}. Game over.`,
	});
	return true;
}

function maybeRunBotTurn() {
	if (!isHardLikeMode) return;
	if (hardState.numPlayers !== 3 || hardState.botCount === 0) return;
	const current = hardState.players[hardState.currentTurnIndex];
	if (hardState.roles[current] !== "bot") return;

	// Pick first available pile top
	const pileIndex = hardState.queryPiles.findIndex((pile) => pile[0]);
	if (pileIndex === -1) return;
	const queryCard = hardState.queryPiles[pileIndex][0];
	hardState.selectedQueryCard = queryCard;
	hardState.selectedQuerySource = { type: "pile", pileIndex };

	// Choose a random target that is not the current bot
	const targets = hardState.players.filter((p) => p !== current);
	if (targets.length === 0) return;
	const target = targets[Math.floor(Math.random() * targets.length)];

	handleHardQuery(target);

	// Auto-advance
	setTimeout(() => {
		nextHardTurn();
	}, 400);
}

function nextHardTurn() {
	hardState.currentTurnIndex =
		(hardState.currentTurnIndex + 1) % hardState.players.length;
	hardState.showingHand = false;
	hardState.selectedQueryCard = null;
	hardState.selectedQuerySource = null;
	updateShowHandButton();
	renderHardHand();
	renderPlayersLayout();
	resetAskButtons();
	updateNextButton(false);
	setStatus(`${hardState.players[hardState.currentTurnIndex]}'s turn`);
	maybeRunBotTurn();
}

function initHardGame() {
	queryContainer.classList.add("query-piles");
	if (playerCountWrapper)
		playerCountWrapper.style.display = mode === "fast" ? "none" : "inline-flex";
	if (hiddenStackEl) hiddenStackEl.style.display = "block";
	if (tokensLine) tokensLine.innerHTML = "";
	if (showHandBtn) showHandBtn.style.display = "inline-block";
	if (chooseQueryButton) chooseQueryButton.style.display = "inline-block";
	if (logBox && logBox.parentElement)
		logBox.parentElement.style.display = "none";
	if (showHandBtn) showHandBtn.textContent = "Show My Cards";

	const desiredPlayers =
		mode === "fast"
			? 3
			: [3, 4, 5, 6].includes(urlPlayers)
				? urlPlayers
				: parseInt(playerCountSelect?.value || "3", 10);
	hardState.numPlayers = [3, 4, 5, 6].includes(desiredPlayers) ? desiredPlayers : 3;
	if (playerCountSelect) playerCountSelect.value = String(hardState.numPlayers);
	hardState.botCount =
		hardState.numPlayers === 3 && isHardLikeMode
			? Math.min(2, Math.max(0, urlBots || 0))
			: 0;

	const deckIds = shuffle(
		Array.from({ length: hardLikeTotalCards() }, (_, i) => i + 1)
	);
	const hiddenCount = currentHiddenCount();
	hardState.hiddenCount = hiddenCount;
	hardState.hiddenCards = deckIds.slice(0, hiddenCount);
	const remaining = deckIds.slice(hiddenCount);

	const humanCount = hardState.numPlayers - hardState.botCount;
	hardState.players = Array.from({ length: hardState.numPlayers }, (_, i) => {
		const incoming = (urlNames[i] || "").trim();
		if (incoming) return incoming;
		if (i < humanCount) return `Player ${i + 1}`;
		const botIndex = i - humanCount + 1;
		return `Bot ${botIndex}`;
	});
	hardState.roles = {};
	hardState.players.forEach((p, idx) => {
		if (idx === 0) {
			hardState.roles[p] = "human";
		} else if (hardState.numPlayers === 3 && hardState.botCount > 0) {
			if (hardState.botCount === 2) {
				hardState.roles[p] = "bot";
			} else if (hardState.botCount === 1 && idx === hardState.players.length - 1) {
				hardState.roles[p] = "bot";
			} else {
				hardState.roles[p] = "human";
			}
		} else {
			hardState.roles[p] = "human";
		}
	});
	hardState.hands = {};
	hardState.players.forEach((p) => (hardState.hands[p] = []));
	const perPlayer = cardsPerPlayerByCount(hardState.numPlayers);
	const dealable = remaining.slice(0, perPlayer * hardState.numPlayers);
	dealable.forEach((card, idx) => {
		const targetPlayer = hardState.players[idx % hardState.numPlayers];
		hardState.hands[targetPlayer].push(card);
	});

	hardState.tokensRemaining = {};
	hardState.players.forEach((p) => (hardState.tokensRemaining[p] = 15));
	hardState.usedCards = [];
	hardState.currentTurnIndex = 0;
	hardState.selectedQueryCard = null;
	hardState.selectedQuerySource = null;
	hardState.selectedGuess = [];
	hardState.showingHand = false;

	const qDeck = shuffle(hardLikeQueries().slice());
	const chunk = Math.ceil(qDeck.length / 3);
	hardState.queryPiles = [
		qDeck.slice(0, chunk),
		qDeck.slice(chunk, chunk * 2),
		qDeck.slice(chunk * 2),
	];

	clearLog();
	renderHiddenStack();
	renderTokensLine();
	renderHardQueryPiles();
	renderHardHand();
	renderHardGuessOptions();
	updateShowHandButton();
	renderPlayersLayout();
	resetAskButtons();
	updateNextButton(false);
	setStatus(`${hardState.players[0]}'s turn - choose a query card.`);
	maybeRunBotTurn();
}

// -------- Mode setup --------
function setupClassicMode() {
	guessButton.onclick = openGuessModal;
	nextTurnBtn.onclick = nextClassicTurn;
	initClassicGame();
}

function setupHardMode() {
	guessButton.onclick = openGuessModal;
	nextTurnBtn.onclick = nextHardTurn;
	if (playerCountSelect) {
		playerCountSelect.onchange = initHardGame;
	}
	if (showHandBtn) {
		// Show the hand in a modal instead of toggling an inline strip
		showHandBtn.onclick = openHandModal;
	}
	initHardGame();
}

document.addEventListener("DOMContentLoaded", () => {
	if (guessModalClose) guessModalClose.onclick = closeGuessModal;
	if (guessModalSubmit) {
		guessModalSubmit.onclick = () => {
			const ok = isHardLikeMode ? handleHardGuess() : handleClassicGuess();
			if (ok) closeGuessModal();
		};
	}
	if (handModalClose) handModalClose.onclick = closeHandModal;
	if (askModalClose) askModalClose.onclick = closeAskModal;
	if (closeQueryModalBtn) closeQueryModalBtn.onclick = closeQueryModal;
	if (chooseQueryButton) chooseQueryButton.onclick = openQueryModal;
	if (showHandBtn) showHandBtn.onclick = openHandModal;
	if (closeResultModalBtn) closeResultModalBtn.onclick = closeResultModal;
	if (resultModal) {
		resultModal.addEventListener("click", (e) => {
			if (e.target === resultModal) closeResultModal();
		});
	}
	if (resultRestartBtn)
		resultRestartBtn.onclick = () => {
			closeResultModal();
			if (isHardLikeMode) initHardGame();
			else initClassicGame();
		};
	if (resultNewBtn)
		resultNewBtn.onclick = () => {
			window.location.href = "index.html";
		};
	if (handModal) {
		handModal.addEventListener("click", (e) => {
			if (e.target === handModal) closeHandModal();
		});
	}
	if (restartButton)
		restartButton.onclick = () => {
			if (isHardLikeMode) initHardGame();
			else initClassicGame();
		};
	if (askModal) {
		askModal.addEventListener("click", (e) => {
			if (e.target === askModal) closeAskModal();
		});
	}
	if (isHardLikeMode) {
		setupHardMode();
	} else {
		setupClassicMode();
	}
});
