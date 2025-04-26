//const web3 = new Web3("http://127.0.0.1:8545");
const web3 = new Web3("http://192.168.225.68:8545");
const content = document.getElementById("mainContent");
const addressInput = document.getElementById("addressFilter");
const pageInfo = document.getElementById("pageInfo");

let allBlocks = [];
let latestFetchedBlock = -1;
let currentPage = 0;
const blocksPerPage = 10;

// Load theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => alert("Copied:\n" + text));
}

function showTab(tab) {
  document.querySelectorAll(".tabs button").forEach(btn => btn.classList.remove("active-tab"));
  document.getElementById(`tab-${tab}`).classList.add("active-tab");

  if (tab === "blocks") renderBlocks();
  if (tab === "addresses") renderAddresses();
  if (tab === "contracts") renderContracts();
}

function renderAddresses() {
  content.innerHTML = "<p>Coming soon: Address stats and balances.</p>";
}
function renderContracts() {
  content.innerHTML = "<p>Coming soon: Deployed contracts with interaction history.</p>";
}

async function fetchBlockchainData() {
  const latest = await web3.eth.getBlockNumber();
  for (let i = latest; i > latestFetchedBlock; i--) {
    const block = await web3.eth.getBlock(i, true);
    if (block.transactions.length > 0) allBlocks.unshift(block);
  }
  latestFetchedBlock = latest;
  renderBlocks();
}
setInterval(fetchBlockchainData, 10000);

// Block Explorer
function renderBlocks() {
  const filter = addressInput.value.toLowerCase().trim();
  const start = currentPage * blocksPerPage;
  const end = start + blocksPerPage;
  const visibleBlocks = allBlocks.slice(start, end);

  content.innerHTML = "";

  for (const block of visibleBlocks) {
    const matchingTxs = block.transactions.filter(tx =>
      !filter ||
      (tx.from && tx.from.toLowerCase().includes(filter)) ||
      (tx.to && tx.to.toLowerCase().includes(filter))
    );

    if (matchingTxs.length > 0) {
      const blockEl = document.createElement("div");
      blockEl.className = "block";

      blockEl.innerHTML = `
        <a href="#" onclick="viewBlock(${block.number}); return false;"><strong>Block #${block.number}</strong></a><br>
        <small><b>Hash:</b> ${block.hash}</small><br>
        <small><b>Parent Hash:</b> ${block.parentHash}</small><br>
        <button class="collapsible" onclick="toggleTxs(this)">Show Transactions (${matchingTxs.length})</button>
        <div class="tx-container hidden"></div>
      `;

      const txContainer = blockEl.querySelector(".tx-container");

      matchingTxs.forEach(tx => {
        const txEl = document.createElement("div");
        txEl.className = "transaction";
        txEl.innerHTML = `
          <button class="copy-btn" onclick="copyToClipboard('${tx.hash}')">📋</button>
          <div><strong>Tx Hash:</strong> ${tx.hash}</div>
          <div><strong>From:</strong> <span onclick="copyToClipboard('${tx.from}')">${tx.from}</span></div>
          <div><strong>To:</strong> <span onclick="copyToClipboard('${tx.to}')">${tx.to || "Contract Creation"}</span></div>
          <div><strong>Value:</strong> ${web3.utils.fromWei(tx.value, "ether")} ETH</div>
        `;
        txContainer.appendChild(txEl);
      });

      content.appendChild(blockEl);
    }
  }

  pageInfo.innerText = `Page ${currentPage + 1} of ${Math.ceil(allBlocks.length / blocksPerPage)}`;
}

function toggleTxs(btn) {
  const container = btn.nextElementSibling;
  container.classList.toggle("hidden");
  btn.textContent = container.classList.contains("hidden") ? "Show Transactions" : "Hide Transactions";
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderBlocks();
  }
}

function nextPage() {
  if ((currentPage + 1) * blocksPerPage < allBlocks.length) {
    currentPage++;
    renderBlocks();
  }
}

function exportToCSV() {
  let csv = "Block,TxHash,From,To,Value(ETH)\n";
  const filter = addressInput.value.toLowerCase().trim();

  allBlocks.forEach(block => {
    block.transactions.forEach(tx => {
      if (
        !filter ||
        (tx.from && tx.from.toLowerCase().includes(filter)) ||
        (tx.to && tx.to.toLowerCase().includes(filter))
      ) {
        csv += `${block.number},${tx.hash},${tx.from},${tx.to || "Contract"},${web3.utils.fromWei(tx.value, "ether")}\n`;
      }
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ganache-transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// View Block Detail
async function viewBlock(blockNumber) {
  const block = await web3.eth.getBlock(blockNumber, true);
  content.innerHTML = `
    <div class="block">
      <h2>Block #${block.number}</h2>
      <p><strong>Hash:</strong> ${block.hash}</p>
      <p><strong>Parent Hash:</strong> ${block.parentHash}</p>
      <p><strong>Miner:</strong> ${block.miner}</p>
      <p><strong>Gas Used:</strong> ${block.gasUsed}</p>
      <p><strong>Size:</strong> ${block.size} bytes</p>
      <p><strong>Timestamp:</strong> ${new Date(block.timestamp * 1000).toLocaleString()}</p>
      <h3>Transactions (${block.transactions.length})</h3>
      ${block.transactions.map(tx => `
        <div class="transaction">
          <div><b>Hash:</b> ${tx.hash}</div>
          <div><b>From:</b> ${tx.from}</div>
          <div><b>To:</b> ${tx.to}</div>
          <div><b>Value:</b> ${web3.utils.fromWei(tx.value, "ether")} ETH</div>
          <div><b>Nonce:</b> ${tx.nonce}</div>
          <div><b>Gas:</b> ${tx.gas}</div>
          <div><b>Input:</b> ${tx.input}</div>
        </div>
      `).join("")}
      <br><button onclick="renderBlocks()">🔙 Back to Blocks</button>
    </div>
  `;
}

// Events
addressInput.addEventListener("input", renderBlocks);

// Init
fetchBlockchainData();
