const STARTING_BALANCE = 1000;

let balance = Number(
  localStorage.getItem("luckyBalance")
);

if (!Number.isFinite(balance)) {
  balance = STARTING_BALANCE;
}

let history = JSON.parse(
  localStorage.getItem("luckyHistory") || "[]"
);


const symbols = [
  "🍒",
  "🍋",
  "⭐",
  "💎",
  "7️⃣"
];

const diceFaces = [
  "⚀",
  "⚁",
  "⚂",
  "⚃",
  "⚄",
  "⚅"
];


let blackjack = {
  active: false,
  player: [],
  dealer: [],
  bet: 0
};


let deck = [];

let rouletteChoice = null;


function $(id) {
  return document.getElementById(id);
}


function saveData() {

  localStorage.setItem(
    "luckyBalance",
    String(balance)
  );

  localStorage.setItem(
    "luckyHistory",
    JSON.stringify(history)
  );
}


function formatCredits(number) {

  return Math.round(number).toLocaleString();
}


function renderBalance() {

  $("balance").textContent =
    formatCredits(balance);
}


function changeBalance(amount) {

  balance += amount;

  if (balance < 0) {
    balance = 0;
  }

  renderBalance();

  saveData();
}


function showToast(message) {

  const toast = $("toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2200);
}


function setResult(
  element,
  message,
  type = ""
) {

  element.textContent = message;

  element.className =
    "result " + type;
}


function addHistory(
  game,
  amount,
  detail,
  icon
) {

  history.unshift({

    game: game,

    amount: amount,

    detail: detail,

    icon: icon,

    time: new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )

  });

  history =
    history.slice(0, 20);

  saveData();

  renderHistory();
}


function renderHistory() {

  const list =
    $("historyList");

  if (!history.length) {

    list.innerHTML =
      '<div class="empty">No games played yet.</div>';

    return;
  }


  list.innerHTML =
    history.map(item => {

      const positive =
        item.amount >= 0;

      return `
        <div class="history-row">

          <div class="history-icon">
            ${item.icon}
          </div>

          <div class="history-main">

            <strong>
              ${item.game}
            </strong>

            <small>
              ${item.detail}
              ·
              ${item.time}
            </small>

          </div>

          <div class="history-amount ${positive ? "win" : "loss"}">

            ${positive ? "+" : "-"}
            ${formatCredits(Math.abs(item.amount))}
            CR

          </div>

        </div>
      `;

    }).join("");
}


function getBet(inputId) {

  const bet =
    Number($(inputId).value);

  if (
    !Number.isFinite(bet) ||
    bet < 10 ||
    bet > 500 ||
    bet % 10 !== 0
  ) {

    showToast(
      "Bet must be 10–500 credits."
    );

    return null;
  }


  if (bet > balance) {

    showToast(
      "Not enough virtual credits."
    );

    return null;
  }


  return bet;
}


/* =========================
   GAME NAVIGATION
========================= */


function openGame(game) {

  const area =
    $("game-area");

  area.classList.remove(
    "hidden"
  );


  document.querySelectorAll(
    ".game-panel"
  ).forEach(panel => {

    panel.classList.add(
      "hidden"
    );

  });


  const panel =
    $(game + "Panel");

  if (panel) {

    panel.classList.remove(
      "hidden"
    );

  }


  const titles = {

    slots: "🎰 Lucky Slots",

    blackjack: "🃏 Blackjack",

    roulette: "🎡 Roulette",

    dice: "🎲 High / Low Dice"

  };


  $("gameTitle").textContent =
    titles[game];


  area.scrollIntoView({
    behavior: "smooth"
  });


  if (game === "roulette") {

    buildNumberGrid();

  }

}


function closeGame() {

  $("game-area")
    .classList.add("hidden");

  document
    .getElementById("games")
    .scrollIntoView({
      behavior: "smooth"
    });
}


/* =========================
   SLOTS
========================= */


function playSlots() {

  const bet =
    getBet("slotBet");

  if (bet === null) {
    return;
  }


  const reels = [
    $("slot1"),
    $("slot2"),
    $("slot3")
  ];


  reels.forEach(reel => {

    reel.classList.remove(
      "spin"
    );

    void reel.offsetWidth;

    reel.classList.add(
      "spin"
    );

  });


  const result =
    reels.map(reel => {

      const symbol =
        symbols[
          Math.floor(
            Math.random() *
            symbols.length
          )
        ];

      reel.textContent =
        symbol;

      return symbol;

    });


  let payout = 0;


  if (
    result[0] === "7️⃣" &&
    result[1] === "7️⃣" &&
    result[2] === "7️⃣"
  ) {

    payout =
      bet * 8;

  } else if (
    result[0] === result[1] &&
    result[1] === result[2]
  ) {

    payout =
      bet * 5;

  } else if (
    result[0] === result[1] ||
    result[1] === result[2] ||
    result[0] === result[2]
  ) {

    payout =
      bet * 2;

  }


  changeBalance(-bet);


  if (payout > 0) {

    changeBalance(payout);

    setResult(
      $("slotResult"),
      `You won ${formatCredits(payout)} CR!`,
      "win"
    );

    addHistory(
      "Lucky Slots",
      payout - bet,
      `Bet ${bet} CR`,
      "🎰"
    );

  } else {

    setResult(
      $("slotResult"),
      `No match. You lost ${formatCredits(bet)} CR.`,
      "loss"
    );

    addHistory(
      "Lucky Slots",
      -bet,
      `Bet ${bet} CR`,
      "🎰"
    );

  }

}


/* =========================
   BLACKJACK
========================= */


function createDeck() {

  const suits = [
    "♠",
    "♥",
    "♦",
    "♣"
  ];

  const ranks = [
    ["A", 11],
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5", 5],
    ["6", 6],
    ["7", 7],
    ["8", 8],
    ["9", 9],
    ["10", 10],
    ["J", 10],
    ["Q", 10],
    ["K", 10]
  ];


  const cards = [];


  suits.forEach(suit => {

    ranks.forEach(rank => {

      cards.push({

        rank: rank[0],

        value: rank[1],

        suit: suit

      });

    });

  });


  return cards.sort(
    () => Math.random() - 0.5
  );

}


function handValue(hand) {

  let total =
    hand.reduce(
      (sum, card) =>
        sum + card.value,
      0
    );


  let aces =
    hand.filter(
      card => card.rank === "A"
    ).length;


  while (
    total > 21 &&
    aces > 0
  ) {

    total -= 10;

    aces--;

  }


  return total;
}


function renderCard(
  card,
  hidden = false
) {

  if (hidden) {

    return `
      <div class="card hidden-card">
        🂠
      </div>
    `;

  }


  const red =
    card.suit === "♥" ||
    card.suit === "♦";


  return `
    <div class="card ${red ? "red-card" : ""}">
      ${card.rank}${card.suit}
    </div>
  `;

}


function renderBlackjack(
  hideDealer = true
) {

  $("playerHand").innerHTML =
    blackjack.player
      .map(card =>
        renderCard(card)
      )
      .join("");


  $("dealerHand").innerHTML =
    blackjack.dealer
      .map((card, index) =>
        renderCard(
          card,
          hideDealer &&
          index === 1
        )
      )
      .join("");


  $("playerTotal").textContent =
    blackjack.player.length
      ? handValue(
          blackjack.player
        )
      : "0";


  $("dealerTotal").textContent =
    blackjack.dealer.length
      ? (
          hideDealer
            ? "?"
            : handValue(
                blackjack.dealer
              )
        )
      : "0";

}


function dealBlackjack() {

  if (blackjack.active) {

    showToast(
      "Finish your current hand first."
    );

    return;
  }


  const bet =
    getBet("blackjackBet");

  if (bet === null) {
    return;
  }


  deck =
    createDeck();


  blackjack = {

    active: true,

    player: [
      deck.pop(),
      deck.pop()
    ],

    dealer: [
      deck.pop(),
      deck.pop()
    ],

    bet: bet

  };


  changeBalance(-bet);


  renderBlackjack(
    true
  );


  $("dealButton")
    .disabled = true;

  $("hitButton")
    .disabled = false;

  $("standButton")
    .disabled = false;


  if (
    handValue(
      blackjack.player
    ) === 21
  ) {

    finishBlackjack();

  } else {

    setResult(
      $("blackjackResult"),
      "Your move — hit or stand."
    );

  }

}


function hitBlackjack() {

  if (!blackjack.active) {
    return;
  }


  blackjack.player.push(
    deck.pop()
  );


  renderBlackjack(
    true
  );


  const total =
    handValue(
      blackjack.player
    );


  if (total >= 21) {

    finishBlackjack();

  } else {

    setResult(
      $("blackjackResult"),
      "Choose HIT or STAND."
    );

  }

}


function standBlackjack() {

  if (!blackjack.active) {
    return;
  }

  finishBlackjack();

}


function finishBlackjack() {

  while (
    handValue(
      blackjack.dealer
    ) < 17
  ) {

    blackjack.dealer.push(
      deck.pop()
    );

  }


  renderBlackjack(
    false
  );


  const player =
    handValue(
      blackjack.player
    );

  const dealer =
    handValue(
      blackjack.dealer
    );


  let payout = 0;

  let message = "";

  let type = "";


  if (player > 21) {

    message =
      `Bust — you lost ${formatCredits(blackjack.bet)} CR.`;

    type = "loss";

    addHistory(
      "Blackjack",
      -blackjack.bet,
      `Bust · Bet ${blackjack.bet} CR`,
      "🃏"
    );

  } else if (
    dealer > 21 ||
    player > dealer
  ) {

    payout =
      blackjack.bet * 2;

    changeBalance(
      payout
    );

    message =
      `You win ${formatCredits(payout)} CR!`;

    type = "win";

    addHistory(
      "Blackjack",
      blackjack.bet,
      `Won · Bet ${blackjack.bet} CR`,
      "🃏"
    );

  } else if (
    player === dealer
  ) {

    payout =
      blackjack.bet;

    changeBalance(
      payout
    );

    message =
      "Push — your bet was returned.";

    addHistory(
      "Blackjack",
      0,
      `Push · Bet ${blackjack.bet} CR`,
      "🃏"
    );

  } else {

    message =
      `Dealer wins — you lost ${formatCredits(blackjack.bet)} CR.`;

    type = "loss";

    addHistory(
      "Blackjack",
      -blackjack.bet,
      `Dealer ${dealer} · You ${player}`,
      "🃏"
    );

  }


  setResult(
    $("blackjackResult"),
    message,
    type
  );


  blackjack.active =
    false;


  $("dealButton")
    .disabled = false;

  $("hitButton")
    .disabled = true;

  $("standButton")
    .disabled = true;

}


/* =========================
   ROULETTE
========================= */


function getRouletteColor(number) {

  if (number === 0) {
    return "green";
  }


  const redNumbers = [
    1, 3, 5, 7, 9,
    12, 14, 16, 18,
    19, 21, 23, 25,
    27, 30, 32, 34,
    36
  ];


  return redNumbers.includes(number)
    ? "red"
    : "black";

}


function buildNumberGrid() {

  const grid =
    $("numberGrid");


  if (grid.children.length) {
    return;
  }


  for (
    let number = 0;
    number <= 36;
    number++
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.textContent =
      number;


    const color =
      getRouletteColor(
        number
      );


    if (color === "red") {

      button.className =
        "red-number";

    } else if (
      color === "black"
    ) {

      button.className =
        "black-number";

    }


    button.onclick = () => {

      document
        .querySelectorAll(
          ".number-grid button"
        )
        .forEach(
          b =>
            b.classList.remove(
              "selected"
            )
        );


      document
        .querySelectorAll(
          ".roulette-buttons .choice"
        )
        .forEach(
          b =>
            b.classList.remove(
              "selected"
            )
        );


      button.classList.add(
        "selected"
      );


      rouletteChoice =
        number;

    };


    grid.appendChild(
      button
    );

  }

}


function selectRoulette(choice) {

  rouletteChoice =
    choice;


  document
    .querySelectorAll(
      ".roulette-buttons .choice"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.choice === choice
      );

    });


  document
    .querySelectorAll(
      ".number-grid button"
    )
    .forEach(
      button =>
        button.classList.remove(
          "selected"
        )
    );

}


function playRoulette() {

  const bet =
    getBet("rouletteBet");

  if (
    bet === null
  ) {

    return;

  }


  if (
    rouletteChoice === null
  ) {

    showToast(
      "Choose a color or number first."
    );

    return;

  }


  const wheel =
    $("rouletteWheel");


  wheel.classList.remove(
    "spin"
  );

  void wheel.offsetWidth;

  wheel.classList.add(
    "spin"
  );


  const number =
    Math.floor(
      Math.random() * 37
    );


  const color =
    getRouletteColor(
      number
    );


  $("rouletteNumber")
    .textContent = number;


  changeBalance(
    -bet
  );


  let payout = 0;


  if (
    rouletteChoice === color
  ) {

    if (
      color === "green"
    ) {

      payout =
        bet * 14;

    } else {

      payout =
        bet * 2;

    }

  } else if (
    typeof rouletteChoice === "number" &&
    rouletteChoice === number
  ) {

    payout =
      bet * 35;

  }


  if (payout > 0) {

    changeBalance(
      payout
    );


    setResult(
      $("rouletteResult"),
      `Ball landed on ${number} ${color}. You won ${formatCredits(payout)} CR!`,
      "win"
    );


    addHistory(
      "Roulette",
      payout - bet,
      `Result ${number} ${color}`,
      "🎡"
    );

  } else {

    setResult(
      $("rouletteResult"),
      `Ball landed on ${number} ${color}. You lost ${formatCredits(bet)} CR.`,
      "loss"
    );


    addHistory(
      "Roulette",
      -bet,
      `Result ${number} ${color}`,
      "🎡"
    );

  }

}


/* =========================
   DICE
========================= */


function playDice(choice) {

  const bet =
    getBet("diceBet");

  if (
    bet === null
  ) {

    return;

  }


  const die =
    $("dice");


  die.classList.remove(
    "roll"
  );

  void die.offsetWidth;

  die.classList.add(
    "roll"
  );


  const number =
    Math.floor(
      Math.random() * 6
    ) + 1;


  die.textContent =
    diceFaces[number - 1];


  const won =
    choice === "low"
      ? number <= 3
      : number >= 4;


  changeBalance(
    -bet
  );


  if (won) {

    const payout =
      bet * 2;

    changeBalance(
      payout
    );


    setResult(
      $("diceResult"),
      `You rolled ${number}. You won ${formatCredits(payout)} CR!`,
      "win"
    );


    addHistory(
      "Dice",
      payout - bet,
      `Rolled ${number} · ${choice}`,
      "🎲"
    );

  } else {

    setResult(
      $("diceResult"),
      `You rolled ${number}. You lost ${formatCredits(bet)} CR.`,
      "loss"
    );


    addHistory(
      "Dice",
      -bet,
      `Rolled ${number} · ${choice}`,
      "🎲"
    );

  }

}


/* =========================
   HISTORY / RESET
========================= */


function clearHistory() {

  history = [];

  saveData();

  renderHistory();

}


function resetCredits() {

  balance =
    STARTING_BALANCE;

  history = [];

  blackjack = {
    active: false,
    player: [],
    dealer: [],
    bet: 0
  };

  saveData();

  renderBalance();

  renderHistory();

  showToast(
    "Credits reset to 1,000."
  );

}


/* =========================
   STARTUP
========================= */


renderBalance();

renderHistory();

buildNumberGrid();