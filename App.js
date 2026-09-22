let balance = Number(localStorage.getItem("luckyBalance")) || 1000;
let history = JSON.parse(localStorage.getItem("luckyHistory") || "[]");

const symbols = ["🍒", "🍋", "⭐", "💎", "7️⃣"];

function save() {
  localStorage.setItem("luckyBalance", balance);
  localStorage.setItem("luckyHistory", JSON.stringify(history));
}

function render() {
  document.getElementById("balance").textContent = balance.toLocaleString();

  const list = document.getElementById("historyList");
  if (!history.length) {
    list.innerHTML = '<p class="muted">No games played yet.</p>';
    return;
  }

  list.innerHTML = history.slice(0, 12).map(item => `
    <div class="history-item">
      <span>${item.game} · ${item.detail}</span>
      <strong class="${item.change >= 0 ? "win" : "loss"}">
        ${item.change >= 0 ? "+" : ""}${item.change} credits
      </strong>
    </div>
  `).join("");
}

function validBet(value) {
  const bet = Number(value);
  if (!Number.isFinite(bet) || bet < 10 || bet > 500 || bet % 10 !== 0) {
    alert("Choose a bet from 10 to 500 credits in steps of 10.");
    return null;
  }
  if (bet > balance) {
    alert("You don't have enough virtual credits.");
    return null;
  }
  return bet;
}

function addHistory(game, detail, change) {
  history.unshift({ game, detail, change });
  history = history.slice(0, 30);
  save();
  render();
}

function playSlots() {
  const bet = validBet(document.getElementById("slotBet").value);
  if (bet === null) return;

  const result = [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  document.getElementById("slots").innerHTML = result.map(s => `<div>${s}</div>`).join("");

  let multiplier = 0;
  if (result[0] === result[1] && result[1] === result[2]) multiplier = result[0] === "7️⃣" ? 8 : 5;
  else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) multiplier = 2;

  const change = multiplier ? bet * (multiplier - 1) : -bet;
  balance += change;

  const text = multiplier
    ? `You matched ${multiplier === 8 ? "three 7s" : multiplier === 5 ? "three symbols" : "two symbols"} — net +${change} credits.`
    : `No match — net -${bet} credits.`;

  document.getElementById("slotResult").textContent = text;
  addHistory("Lucky Slots", result.join(" "), change);
}

function playDice(choice) {
  const bet = validBet(document.getElementById("diceBet").value);
  if (bet === null) return;

  const roll = Math.floor(Math.random() * 6) + 1;
  document.getElementById("dice").textContent = ["⚀","⚁","⚂","⚃","⚄","⚅"][roll - 1];

  const won = (choice === "low" && roll <= 3) || (choice === "high" && roll >= 4);
  const change = won ? bet : -bet;
  balance += change;

  document.getElementById("diceResult").textContent =
    `You rolled ${roll}. ${won ? `You won ${bet} credits.` : `You lost ${bet} credits.`}`;

  addHistory("Dice", `${choice} · rolled ${roll}`, change);
}

function resetDemo() {
  balance = 1000;
  history = [];
  save();
  document.getElementById("slots").innerHTML = "<div>🍒</div><div>🍋</div><div>⭐</div>";
  document.getElementById("dice").textContent = "🎲";
  document.getElementById("slotResult").textContent = "Match 3 symbols for the biggest demo payout.";
  document.getElementById("diceResult").textContent = "Pick high or low, then roll.";
  render();
}

function clearHistory() {
  history = [];
  save();
  render();
}

function scrollToGames() {
  document.getElementById("games").scrollIntoView({ behavior: "smooth" });
}

render();
