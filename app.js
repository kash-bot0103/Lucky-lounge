"use strict";

/* =========================
   LUCKY LOUNGE
   PLAY-MONEY CASINO
========================= */

let balance = Number(localStorage.getItem("luckyBalance"));

if (!Number.isFinite(balance)) {
  balance = 1000;
}

let history = JSON.parse(
  localStorage.getItem("luckyHistory") || "[]"
);


/* =========================
   GENERAL
========================= */

const balanceEl = document.getElementById("balance");

function saveState() {
  localStorage.setItem("luckyBalance", String(balance));
  localStorage.setItem("luckyHistory", JSON.stringify(history));
}

function renderBalance() {
  balanceEl.textContent =
    `${Math.max(0, Math.floor(balance)).toLocaleString()} CR`;
}

function changeBalance(amount) {
  balance += amount;

  if (balance < 0) {
    balance = 0;
  }

  saveState();
  renderBalance();
}

function addHistory(game, result, amount, type = "") {

  history.unshift({
    game,
    result,
    amount,
    type,
    time: new Date().toLocaleTimeString()
  });

  history = history.slice(0, 30);

  saveState();
  renderHistory();
}

function renderHistory() {

  const container = document.getElementById("historyList");

  if (!history.length) {
    container.innerHTML =
      `<p class="empty-history">No games played yet.</p>`;
    return;
  }

  container.innerHTML = history.map(item => {

    const sign = item.amount >= 0 ? "+" : "";

    return `
      <div class="history-item">
        <div>
          <strong>${item.game}</strong>
          <br>
          <small>${item.result} • ${item.time}</small>
        </div>

        <strong class="${item.type}">
          ${sign}${item.amount} CR
        </strong>
      </div>
    `;

  }).join("");
}


/* =========================
   GAME NAVIGATION
========================= */

const panels = {
  slots: document.getElementById("slotsPanel"),
  blackjack: document.getElementById("blackjackPanel"),
  roulette: document.getElementById("roulettePanel"),
  dice: document.getElementById("dicePanel")
};

function openGame(game) {

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
}

document.querySelectorAll(".game-card").forEach(button => {

  button.addEventListener("click", () => {
    openGame(button.dataset.game);
  });

});


/* =========================
   SLOTS
========================= */

const symbols = ["🍒", "🍋", "⭐", "💎", "7️⃣"];

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

document.getElementById("spinButton").addEventListener("click", () => {

  const bet = Number(document.getElementById("slotBet").value);

  if (!validBet(bet)) return;

  changeBalance(-bet);

  const result = [
    randomSymbol(),
    randomSymbol(),
    randomSymbol()
  ];

  document.getElementById("slot1").textContent = result[0];
  document.getElementById("slot2").textContent = result[1];
  document.getElementById("slot3").textContent = result[2];

  let payout = 0;
  let message = "No match";
  let type = "loss";

  if (
    result[0] === "7️⃣" &&
    result[1] === "7️⃣" &&
    result[2] === "7️⃣"
  ) {

    payout = bet * 8;
    message = "JACKPOT! Three 7s!";
    type = "win";

  } else if (
    result[0] === result[1] &&
    result[1] === result[2]
  ) {

    payout = bet * 5;
    message = "Three of a kind!";
    type = "win";

  } else if (
    result[0] === result[1] ||
    result[1] === result[2] ||
    result[0] === result[2]
  ) {

    payout = bet * 2;
    message = "Pair!";
    type = "win";
  }

  if (payout > 0) {
    changeBalance(payout);
  }

  const net = payout - bet;

  document.getElementById("slotResult").textContent =
    `${message} ${net >= 0 ? "+" : ""}${net} CR`;

  addHistory(
    "Slots",
    message,
    net,
    type
  );
});


/* =========================
   BLACKJACK
========================= */

let blackjackDeck = [];
let dealerHand = [];
let playerHand = [];

let blackjackBet = 0;
let blackjackActive = false;
let playerHasDoubled = false;


/* VIRTUAL PLAYERS */

const virtualPlayers = [
  {
    name: "Alex",
    bet: 0,
    hand: [],
    status: "Waiting"
  },
  {
    name: "Mike",
    bet: 0,
    hand: [],
    status: "Waiting"
  },
  {
    name: "Sarah",
    bet: 0,
    hand: [],
    status: "Waiting"
  }
];


const suits = [
  { symbol: "♠", red: false },
  { symbol: "♥", red: true },
  { symbol: "♦", red: true },
  { symbol: "♣", red: false }
];

const ranks = [
  "A", "2", "3", "4", "5", "6", "7",
  "8", "9", "10", "J", "Q", "K"
];


function createDeck() {

  const deck = [];

  suits.forEach(suit => {

    ranks.forEach(rank => {

      deck.push({
        rank,
        suit: suit.symbol,
        red: suit.red
      });

    });

  });

  return deck.sort(() => Math.random() - 0.5);
}


function drawCard() {

  if (!blackjackDeck.length) {
    blackjackDeck = createDeck();
  }

  return blackjackDeck.pop();
}


function cardValue(card) {

  if (["J", "Q", "K"].includes(card.rank)) {
    return 10;
  }

  if (card.rank === "A") {
    return 11;
  }

  return Number(card.rank);
}


function handValue(hand) {

  let total = hand.reduce(
    (sum, card) => sum + cardValue(card),
    0
  );

  let aces = hand.filter(
    card => card.rank === "A"
  ).length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}


function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}


function renderCard(card, hidden = false) {

  if (hidden) {
    return `<div class="card hidden">?</div>`;
  }

  return `
    <div class="card ${card.red ? "red" : ""}">
      <span>${card.rank}</span>
      <span class="suit">${card.suit}</span>
    </div>
  `;
}


function renderHand(elementId, hand, hideSecond = false) {

  const element = document.getElementById(elementId);

  element.innerHTML = hand.map(
    (card, index) =>
      renderCard(card, hideSecond && index === 1)
  ).join("");
}


function renderBlackjackHands(hideDealer = true) {

  renderHand(
    "dealerCards",
    dealerHand,
    hideDealer && blackjackActive
  );

  renderHand("yourCards", playerHand);

  document.getElementById("yourTotal").textContent =
    `Total: ${handValue(playerHand)}`;

  if (hideDealer && blackjackActive) {

    document.getElementById("dealerTotal").textContent =
      `Total: ${cardValue(dealerHand[0])} + ?`;

  } else {

    document.getElementById("dealerTotal").textContent =
      `Total: ${handValue(dealerHand)}`;

  }
}


/* VIRTUAL PLAYER RENDERING */

function renderVirtualPlayer(index) {

  const player = virtualPlayers[index];

  const cardElement =
    document.getElementById(`vp${index + 1}Cards`);

  const totalElement =
    document.getElementById(`vp${index + 1}Total`);

  const betElement =
    document.getElementById(`vp${index + 1}Bet`);

  const statusElement =
    document.getElementById(`vp${index + 1}Status`);

  cardElement.innerHTML =
    player.hand.map(card => renderCard(card)).join("");

  totalElement.textContent =
    player.hand.length
      ? `Total: ${handValue(player.hand)}`
      : "—";

  betElement.textContent =
    player.bet || "—";

  statusElement.textContent =
    player.status;
}


function renderAllVirtualPlayers() {

  virtualPlayers.forEach((_, index) => {
    renderVirtualPlayer(index);
  });

}


/* VIRTUAL PLAYER AI */

function dealVirtualPlayers() {

  virtualPlayers.forEach(player => {

    player.bet = randomVirtualBet();

    player.hand = [
      drawCard(),
      drawCard()
    ];

    player.status = "Playing";
  });

  renderAllVirtualPlayers();
}


function randomVirtualBet() {

  const amounts = [20, 30, 40, 50, 75, 100];

  return amounts[
    Math.floor(Math.random() * amounts.length)
  ];
}


function virtualPlayersPlay() {

  virtualPlayers.forEach((player, index) => {

    let safety = 0;

    while (
      handValue(player.hand) < 16 &&
      safety < 5
    ) {

      player.hand.push(drawCard());
      safety++;
    }

    const total = handValue(player.hand);

    if (total > 21) {
      player.status = "BUST";
    } else if (total === 21) {
      player.status = "21!";
    } else {
      player.status = "STANDS";
    }

    renderVirtualPlayer(index);

  });
}


/* DEAL */

document.getElementById("dealButton").addEventListener("click", startBlackjack);


function startBlackjack() {

  if (blackjackActive) return;

  const betInput =
    document.getElementById("blackjackBet");

  const bet = Number(betInput.value);

  if (!validBet(bet)) return;

  if (balance < bet) {
    showBlackjackMessage("Not enough credits.");
    return;
  }

  blackjackBet = bet;
  playerHasDoubled = false;

  changeBalance(-bet);

  blackjackDeck = createDeck();

  dealerHand = [
    drawCard(),
    drawCard()
  ];

  playerHand = [
    drawCard(),
    drawCard()
  ];

  blackjackActive = true;

  document.getElementById("dealButton").disabled = true;
  document.getElementById("hitButton").disabled = false;
  document.getElementById("standButton").disabled = false;
  document.getElementById("doubleButton").disabled =
    balance < bet;

  showBlackjackMessage("Your turn.");

  dealVirtualPlayers();

  renderBlackjackHands(true);

  /* Natural blackjack */

  if (isBlackjack(playerHand)) {

    finishBlackjack("blackjack");
    return;
  }

  /* Virtual players act after a short delay */

  setTimeout(() => {

    if (!blackjackActive) return;

    virtualPlayersPlay();

  }, 500);
}


/* HIT */

document.getElementById("hitButton").addEventListener(
  "click",
  playerHit
);


function playerHit() {

  if (!blackjackActive) return;

  playerHand.push(drawCard());

  renderBlackjackHands(true);

  const total = handValue(playerHand);

  if (total > 21) {

    finishBlackjack("bust");

  } else if (total === 21) {

    finishBlackjack("stand");

  } else {

    showBlackjackMessage(
      `You have ${total}. Hit or stand?`
    );
  }
}


/* STAND */

document.getElementById("standButton").addEventListener(
  "click",
  () => finishBlackjack("stand")
);


/* DOUBLE */

document.getElementById("doubleButton").addEventListener(
  "click",
  playerDouble
);


function playerDouble() {

  if (!blackjackActive) return;

  if (playerHand.length !== 2) {
    showBlackjackMessage(
      "Double down is available on your first two cards."
    );
    return;
  }

  if (balance < blackjackBet) {
    showBlackjackMessage("Not enough credits to double.");
    return;
  }

  changeBalance(-blackjackBet);

  blackjackBet *= 2;
  playerHasDoubled = true;

  playerHand.push(drawCard());

  renderBlackjackHands(true);

  if (handValue(playerHand) > 21) {
    finishBlackjack("bust");
  } else {
    finishBlackjack("stand");
  }
}


/* FINISH */

function finishBlackjack(reason) {

  if (!blackjackActive) return;

  blackjackActive = false;

  document.getElementById("hitButton").disabled = true;
  document.getElementById("standButton").disabled = true;
  document.getElementById("doubleButton").disabled = true;

  /* Dealer plays */

  while (handValue(dealerHand) < 17) {
    dealerHand.push(drawCard());
  }

  renderBlackjackHands(false);

  const playerTotal = handValue(playerHand);
  const dealerTotal = handValue(dealerHand);

  let result = "";
  let payout = 0;
  let net = 0;
  let type = "loss";

  if (reason === "bust" || playerTotal > 21) {

    result = `You bust with ${playerTotal}. Dealer wins.`;

  } else if (isBlackjack(playerHand) && !isBlackjack(dealerHand)) {

    payout = blackjackBet * 2.5;
    result = "BLACKJACK! You win!";
    type = "win";

  } else if (
    isBlackjack(dealerHand) &&
    !isBlackjack(playerHand)
  ) {

    result = "Dealer has Blackjack.";

  } else if (dealerTotal > 21) {

    payout = blackjackBet * 2;
    result = `Dealer busts with ${dealerTotal}. You win!`;
    type = "win";

  } else if (playerTotal > dealerTotal) {

    payout = blackjackBet * 2;
    result =
      `You win ${playerTotal} to ${dealerTotal}!`;
    type = "win";

  } else if (playerTotal === dealerTotal) {

    payout = blackjackBet;
    result = `Push — both have ${playerTotal}.`;
    type = "push";

  } else {

    result =
      `Dealer wins ${dealerTotal} to ${playerTotal}.`;
  }

  if (payout > 0) {
    changeBalance(payout);
  }

  net = payout - blackjackBet;

  showBlackjackMessage(
    `${result} ${net >= 0 ? "+" : ""}${net} CR`
  );

  addHistory(
    "Blackjack",
    result,
    net,
    type
  );

  updateVirtualResults(dealerTotal);

  document.getElementById("dealButton").disabled = false;
}


function updateVirtualResults(dealerTotal) {

  virtualPlayers.forEach((player, index) => {

    const total = handValue(player.hand);

    if (total > 21) {
      player.status = "BUST";
    } else if (dealerTotal > 21) {
      player.status = "WIN";
    } else if (total > dealerTotal) {
      player.status = "WIN";
    } else if (total === dealerTotal) {
      player.status = "PUSH";
    } else {
      player.status = "LOSE";
    }

    renderVirtualPlayer(index);

  });
}


function showBlackjackMessage(message) {

  document.getElementById(
    "blackjackStatus"
  ).textContent = message;
}


/* =========================
   ROULETTE
========================= */

const redNumbers = [
  1,3,5,7,9,12,14,16,18,
  19,21,23,25,27,30,32,34,36
];

const numberGrid =
  document.getElementById("numberGrid");

for (let number = 0; number <= 36; number++) {

  const button = document.createElement("button");

  button.textContent = number;

  button.addEventListener("click", () => {
    playRoulette(number);
  });

  numberGrid.appendChild(button);
}


document.querySelectorAll(
  "[data-roulette]"
).forEach(button => {

  button.addEventListener("click", () => {
    playRoulette(button.dataset.roulette);
  });

});


function getRouletteColor(number) {

  if (number === 0) return "green";

  return redNumbers.includes(number)
    ? "red"
    : "black";
}


function playRoulette(choice) {

  const bet =
    Number(document.getElementById("rouletteBet").value);

  if (!validBet(bet)) return;

  changeBalance(-bet);

  const result =
    Math.floor(Math.random() * 37);

  const color =
    getRouletteColor(result);

  let payout = 0;
  let message =
    `Result: ${result} ${color}`;

  let type = "loss";

  if (
    typeof choice === "number" &&
    result === choice
  ) {

    payout = bet * 35;
    message += " — Exact number WIN!";
    type = "win";

  } else if (
    typeof choice === "string" &&
    choice === color
  ) {

    if (color === "green") {
      payout = bet * 14;
    } else {
      payout = bet * 2;
    }

    message += " — WIN!";
    type = "win";
  }

  if (payout > 0) {
    changeBalance(payout);
  }

  const net = payout - bet;

  document.getElementById(
    "rouletteResult"
  ).textContent = result;

  document.getElementById(
    "rouletteMessage"
  ).textContent =
    `${message} ${net >= 0 ? "+" : ""}${net} CR`;

  addHistory(
    "Roulette",
    message,
    net,
    type
  );
}


/* =========================
   DICE
========================= */

document.querySelectorAll(
  "[data-dice]"
).forEach(button => {

  button.addEventListener("click", () => {

    const bet =
      Number(document.getElementById("diceBet").value);

    if (!validBet(bet)) return;

    const choice = button.dataset.dice;

    changeBalance(-bet);

    const roll =
      Math.floor(Math.random() * 6) + 1;

    const won =
      choice === "low"
        ? roll <= 3
        : roll >= 4;

    const payout =
      won ? bet * 2 : 0;

    if (payout > 0) {
      changeBalance(payout);
    }

    const net = payout - bet;

    document.getElementById(
      "diceDisplay"
    ).textContent = diceEmoji(roll);

    document.getElementById(
      "diceResult"
    ).textContent =
      `You rolled ${roll}. ${
        won ? "You win!" : "You lose."
      } ${net >= 0 ? "+" : ""}${net} CR`;

    addHistory(
      "Dice",
      `Rolled ${roll}`,
      net,
      won ? "win" : "loss"
    );

  });

});


function diceEmoji(number) {

  const dice = [
    "⚀",
    "⚁",
    "⚂",
    "⚃",
    "⚄",
    "⚅"
  ];

  return dice[number - 1];
}


/* =========================
   VALIDATION
========================= */

function validBet(bet) {

  if (!Number.isFinite(bet)) {
    alert("Enter a valid bet.");
    return false;
  }

  if (bet < 10 || bet > 500) {
    alert("Bet must be between 10 and 500 credits.");
    return false;
  }

  if (bet % 10 !== 0) {
    alert("Bet must be in increments of 10.");
    return false;
  }

  if (balance < bet) {
    alert("Not enough credits.");
    return false;
  }

  return true;
}


/* =========================
   RESET
========================= */

document.getElementById(
  "clearHistory"
).addEventListener("click", () => {

  history = [];

  saveState();
  renderHistory();

});


document.getElementById(
  "resetCredits"
).addEventListener("click", () => {

  balance = 1000;
  history = [];

  saveState();

  renderBalance();
  renderHistory();

  alert("Your virtual credits were reset to 1,000.");

});


/* =========================
   START
========================= */

renderBalance();
renderHistory();
renderAllVirtualPlayers();