// app.js - Ganache Explorer Logic with Contracts, Charts, and Search

let web3;
let currentPage = 0;
const blocksPerPage = 5;
let latestBlockNumber = 0;
let blockDataCache = [];

window.addEventListener("DOMContentLoaded", async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
  } else {
    //web3 = new Web3("http://127.0.0.1:7545");
    //const web3 = new Web3("http://192.168.225.68:8545");
    web3 = new Web3("http://192.168.225.68:8545");
  }

  latestBlockNumber = await web3.eth.getBlockNumber();
  renderBlocks();
});

async function renderBlocks() {
  const container = document.getElementById("mainContent");
  container.innerHTML = "Loading blocks...";
  blockDataCache = [];

  const start = latestBlockNumber - currentPage * blocksPerPage;
  const end = Math.max(start - blocksPerPage + 1, 0);

  const blocks = [];
  for (let i = start; i >= end; i--) {
    const block = await web3.eth.getBlock(i, true);
    blocks.push(block);
    blockDataCache.push(block);
  }

  container.innerHTML = "";

  blocks.forEach((block) => {
    const blockDiv = document.createElement("div");
    blockDiv.className = "block";

    blockDiv.innerHTML = `
      <h3>Block #${block.number}</h3>
      <p><strong>Hash:</strong> ${block.hash}</p>
      <p><strong>Parent Hash:</strong> ${block.parentHash}</p>
      <p><strong>Gas Used:</strong> ${block.gasUsed}</p>
      <p><strong>Transactions:</strong> ${block.transactions.length}</p>
      <button class="collapsible" onclick="toggleTxs('${block.number}')">Show/Hide Transactions</button>
      <div class="txs hidden" id="txs-${block.number}">
        ${block.transactions
          .map((tx) => {
            const isContract = tx.to === null;
            return `
              <div class="transaction ${isContract ? "contract-creation" : ""}">
                <p><strong>Hash:</strong> ${tx.hash} <button class="copy-btn" onclick="copyToClipboard('${tx.hash}')">Copy</button></p>
                <p><strong>From:</strong> ${tx.from}</p>
                <p><strong>To:</strong> ${isContract ? "<em>Contract Creation</em>" : tx.to}</p>
                <p><strong>Gas:</strong> ${tx.gas}</p>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    container.appendChild(blockDiv);
  });

  document.getElementById("pageInfo").innerText = `Showing ${end} - ${start}`;
  updateCharts();
}

function toggleTxs(id) {
  const div = document.getElementById("txs-" + id);
  div.classList.toggle("hidden");
}

function prevPage() {
  currentPage++;
  renderBlocks();
}

function nextPage() {
  if (currentPage > 0) {
    currentPage--;
    renderBlocks();
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert("Copied to clipboard: " + text);
}

function exportToCSV() {
  let csv = "Block,TxHash,From,To,Gas\n";
  blockDataCache.forEach((block) => {
    block.transactions.forEach((tx) => {
      csv += `${block.number},${tx.hash},${tx.from},${tx.to || "Contract Creation"},${tx.gas}\n`;
    });
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ganache_transactions.csv";
  a.click();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function showTab(tabName) {
  document.querySelectorAll(".tabs button").forEach((btn) => btn.classList.remove("active-tab"));
  document.getElementById("tab-" + tabName).classList.add("active-tab");

  document.getElementById("gasChart").classList.add("hidden");
  document.getElementById("txChart").classList.add("hidden");
  document.getElementById("mainContent").classList.remove("hidden");

  if (tabName === "analytics") {
    document.getElementById("mainContent").classList.add("hidden");
    document.getElementById("gasChart").classList.remove("hidden");
    document.getElementById("txChart").classList.remove("hidden");
  }
}

function updateCharts() {
  const blockNums = blockDataCache.map((b) => b.number).reverse();
  const gasUsed = blockDataCache.map((b) => b.gasUsed).reverse();
  const txCounts = blockDataCache.map((b) => b.transactions.length).reverse();

  new Chart(document.getElementById("gasChart"), {
    type: "bar",
    data: {
      labels: blockNums,
      datasets: [{ label: "Gas Used", data: gasUsed, backgroundColor: "#f39c12" }],
    },
  });

  new Chart(document.getElementById("txChart"), {
    type: "line",
    data: {
      labels: blockNums,
      datasets: [{ label: "Tx Count", data: txCounts, borderColor: "#3498db", fill: false }],
    },
  });
}

async function searchExplorer() {
  const input = document.getElementById("searchBox").value.trim();
  const container = document.getElementById("mainContent");

  if (!input) return;

  if (/^0x([A-Fa-f0-9]{64})$/.test(input)) {
    const tx = await web3.eth.getTransaction(input);
    if (tx) {
      container.innerHTML = `
        <div class="block">
          <h3>Transaction Found</h3>
          <p><strong>Block:</strong> ${tx.blockNumber}</p>
          <p><strong>Hash:</strong> ${tx.hash}</p>
          <p><strong>From:</strong> ${tx.from}</p>
          <p><strong>To:</strong> ${tx.to || "Contract Creation"}</p>
          <p><strong>Gas:</strong> ${tx.gas}</p>
        </div>
      `;
    } else {
      container.innerHTML = "Transaction not found.";
    }
  } else if (/^\d+$/.test(input)) {
    const block = await web3.eth.getBlock(Number(input), true);
    if (block) {
      container.innerHTML = "";
      const fakeLatest = latestBlockNumber;
      latestBlockNumber = block.number;
      currentPage = 0;
      blockDataCache = [];
      renderBlocks();
      latestBlockNumber = fakeLatest;
    } else {
      container.innerHTML = "Block not found.";
    }
  } else {
    container.innerHTML = "Invalid search input.";
  }
}
