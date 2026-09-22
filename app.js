// ==========================================
// LUCKY LOUNGE - PLAY MONEY CASINO
// ==========================================

let balance = Number(localStorage.getItem("luckyBalance")) || 1000;
let history = JSON.parse(localStorage.getItem("luckyHistory")) || [];

const balanceEl = document.getElementById("balance");

// ==========================================
// BALANCE
// ==========================================

function updateBalance() {
  balanceEl.textContent = `${balance.toLocaleString()} CR`;
  localStorage.setItem("luckyBalance", balance);
}

function addHistory(game, result, amount) {
  history.unshift({
    game,
    result,
    amount,
    time: new Date().toLocaleString()
  });

  history = history.slice(0, 50);

  localStorage.setItem("luckyHistory", JSON.stringify(history));

  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");

  if (!history.length) {
    list.innerHTML = `
      <p class="empty-history">
        No games played yet.
      </p>
    `;
    return;
  }

  list.innerHTML = history.map(item => `
    <div class="history-item">
      <div>
        <strong>${item.game}</strong>
        <br>
        <small>${item.time}</small>
      </div>

      <div class="${item.amount > 0 ? "win" : item.amount < 0 ? "loss" : "push"}">
        ${item.amount > 0 ? "+" : ""}
        ${item.amount} CR
        <br>
        <small>${item.result}</small>
      </div>
    </div>
  `).join("");
}

updateBalance();
renderHistory();


// ==========================================
// GAME CARD NAVIGATION
// ==========================================

const gameCards = document.querySelectorAll(".game-card");

const panels = {
  slots: document.getElementById("slotsPanel"),
  blackjack: document.getElementById("blackjackPanel"),
  roulette: document.getElementById("roulettePanel"),
  dice: document.getElementById("dicePanel")
};

gameCards.forEach(card => {

  card.addEventListener("click", () => {

    const game = card.dataset.game;

    Object.values(panels).forEach(panel => {
      panel.classList.remove("active");
    });

    if (panels[game]) {
      panels[game].classList.add("active");

      panels[game].scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  });

});


// ==========================================
// SLOTS
// ==========================================

const slotSymbols = [
  "🍒",
  "🍋",
  "⭐",
  "💎",
  "7️⃣"
];

const spinButton = document.getElementById("spinButton");

spinButton.addEventListener("click", () => {

  const bet = Number(document.getElementById("slotBet").value);

  if (!validBet(bet)) return;

  if (balance < bet) {
    showMessage("slotResult", "Not enough credits.");
    return;
  }

  balance -= bet;

  const a = randomItem(slotSymbols);
  const b = randomItem(slotSymbols);
  const c = randomItem(slotSymbols);

  document.getElementById("slot1").textContent = a;
  document.getElementById("slot2").textContent = b;
  document.getElementById("slot3").textContent = c;

  let winnings = 0;

  if (a === "7️⃣" && b === "7️⃣" && c === "7️⃣") {
    winnings = bet * 8;
  }
  else if (a === b && b === c) {
    winnings = bet * 5;
  }
  else if (a === b || a === c || b === c) {
    winnings = bet * 2;
  }

  balance += winnings;

  const net = winnings - bet;

  if (winnings > 0) {
    showMessage(
      "slotResult",
      `WIN! You received ${winnings} CR.`
    );
  } else {
    showMessage(
      "slotResult",
      `No match. You lost ${bet} CR.`
    );
  }

  addHistory(
    "Lucky Slots",
    winnings > 0 ? "WIN" : "LOSS",
    net
  );

  updateBalance();

});


// ==========================================
// BLACKJACK
// ==========================================

let deck = [];
let playerHand = [];
let dealerHand = [];

let bjBet = 0;
let bjActive = false;
let bjFinished = false;


// Virtual players
const virtualPlayers = [
  {
    name: "ALEX",
    cards: [],
    bet: 0
  },
  {
    name: "MIKE",
    cards: [],
    bet: 0
  },
  {
    name: "SARAH",
    cards: [],
    bet: 0
  }
];


// Create standard 52-card deck
function createDeck() {

  const suits = [
    {
      symbol: "♥",
      name: "red"
    },
    {
      symbol: "♦",
      name: "red"
    },
    {
      symbol: "♣",
      name: "black"
    },
    {
      symbol: "♠",
      name: "black"
    }
  ];

  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K"
  ];

  deck = [];

  suits.forEach(suit => {

    ranks.forEach(rank => {

      deck.push({
        rank,
        suit: suit.symbol,
        color: suit.name
      });

    });

  });

  shuffle(deck);
}


// Shuffle deck
function shuffle(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];

  }

}


// Deal one card
function drawCard() {

  if (!deck.length) {
    createDeck();
  }

  return deck.pop();

}


// Calculate blackjack hand
function handValue(hand) {

  let total = 0;
  let aces = 0;

  hand.forEach(card => {

    if (card.rank === "A") {

      total += 11;
      aces++;

    }
    else if (
      card.rank === "K" ||
      card.rank === "Q" ||
      card.rank === "J"
    ) {

      total += 10;

    }
    else {

      total += Number(card.rank);

    }

  });

  while (total > 21 && aces > 0) {

    total -= 10;
    aces--;

  }

  return total;

}


// Render a card
function cardHTML(card, hidden = false) {

  if (hidden) {

    return `
      <div class="card hidden"></div>
    `;

  }

  const red =
    card.color === "red"
      ? "red"
      : "";

  return `
    <div class="card ${red}">
      <span>${card.rank}</span>
      <span class="suit">${card.suit}</span>
    </div>
  `;

}


// Render hand
function renderHand(elementId, hand, hideFirst = false) {

  const element =
    document.getElementById(elementId);

  element.innerHTML = hand.map(
    (card, index) =>
      cardHTML(
        card,
        hideFirst && index === 0
      )
  ).join("");

}


// DEAL
document
  .getElementById("dealButton")
  .addEventListener("click", dealBlackjack);


function dealBlackjack() {

  if (bjActive) return;

  const bet =
    Number(
      document.getElementById("blackjackBet").value
    );

  if (!validBet(bet)) return;

  if (balance < bet) {

    setBlackjackStatus(
      "Not enough credits."
    );

    return;

  }

  balance -= bet;

  bjBet = bet;

  bjActive = true;
  bjFinished = false;

  createDeck();

  playerHand = [
    drawCard(),
    drawCard()
  ];

  dealerHand = [
    drawCard(),
    drawCard()
  ];

  // Virtual players
  virtualPlayers.forEach(player => {

    player.bet = randomItem([
      20,
      30,
      40,
      50,
      75,
      100
    ]);

    player.cards = [
      drawCard(),
      drawCard()
    ];

  });


  renderBlackjack();

  document.getElementById("hitButton").disabled = false;
  document.getElementById("standButton").disabled = false;
  document.getElementById("doubleButton").disabled = false;

  setBlackjackStatus(
    "Your turn — choose HIT, STAND or DOUBLE."
  );

  updateBalance();


  // Natural blackjack
  if (handValue(playerHand) === 21) {

   