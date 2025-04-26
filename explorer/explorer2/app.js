//const web3 = new Web3("http://127.0.0.1:8545");
const web3 = new Web3("http://192.168.225.68:8545");

const blocksContainer = document.getElementById("blocks");
const addressInput = document.getElementById("addressFilter");
const pageInfo = document.getElementById("pageInfo");

let allBlocks = [];
let latestFetchedBlock = -1;
let currentPage = 0;
const blocksPerPage = 10;

// THEMING
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// COPY
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => alert("Copied:\n" + text));
}

// FETCH
async function fetchBlockchainData() {
  try {
    const latestBlock = await web3.eth.getBlockNumber();

    for (let i = latestBlock; i > latestFetchedBlock; i--) {
      const block = await web3.eth.getBlock(i, true);
      if (block.transactions.length > 0) {
        allBlocks.unshift(block); // prepend
      }
    }

    latestFetchedBlock = latestBlock;
    renderBlocks();
  } catch (err) {
    blocksContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

// RENDER
function renderBlocks() {
  const filter = addressInput.value.toLowerCase().trim();
  const start = currentPage * blocksPerPage;
  const end = start + blocksPerPage;

  const blocksToShow = allBlocks.slice(start, end);
  blocksContainer.innerHTML = "";

  for (const block of blocksToShow) {
    const matchingTxs = block.transactions.filter(tx =>
      !filter ||
      (tx.from && tx.from.toLowerCase().includes(filter)) ||
      (tx.to && tx.to.toLowerCase().includes(filter))
    );

    if (matchingTxs.length > 0) {
      const blockEl = document.createElement("div");
      blockEl.className = "block";
      blockEl.innerHTML = `
        <strong>Block ${block.number}</strong><br>
        <small><b>Hash:</b> ${block.hash}</small><br>
        <small><b>Parent Hash:</b> ${block.parentHash}</small><br><br>
      `;

      matchingTxs.forEach(tx => {
        const txEl = document.createElement("div");
        txEl.className = "transaction";
        txEl.innerHTML = `
          <button class="copy-btn" onclick="copyToClipboard('${tx.hash}')">📋</button>
          <div><strong>Tx Hash:</strong> ${tx.hash}</div>
          <div><strong>From:</strong> <span onclick="copyToClipboard('${tx.from}')">${tx.from}</span></div>
          <div><strong>To:</strong> <span onclick="copyToClipboard('${tx.to}')">${tx.to || "Contract Creation"}</span></div>
          <div><strong>Value:</strong> ${web3.utils.fromWei(tx.value, "ether")} ETH</div>
          <div><strong>Gas:</strong> ${tx.gas}</div>
        `;
        blockEl.appendChild(txEl);
      });

      blocksContainer.appendChild(blockEl);
    }
  }

  pageInfo.innerText = `Page ${currentPage + 1} of ${Math.ceil(allBlocks.length / blocksPerPage)}`;

  if (!blocksContainer.hasChildNodes()) {
    blocksContainer.innerHTML = `<div class="loading">No matching transactions found.</div>`;
  }
}

// PAGINATION
function nextPage() {
  if ((currentPage + 1) * blocksPerPage < allBlocks.length) {
    currentPage++;
    renderBlocks();
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderBlocks();
  }
}

addressInput.addEventListener("input", renderBlocks);

// EXPORT TO CSV
function exportToCSV() {
  let csv = "BlockNumber,TxHash,From,To,Value(ETH),Gas\n";
  const filter = addressInput.value.toLowerCase().trim();

  allBlocks.forEach(block => {
    block.transactions.forEach(tx => {
      if (
        !filter ||
        (tx.from && tx.from.toLowerCase().includes(filter)) ||
        (tx.to && tx.to.toLowerCase().includes(filter))
      ) {
        csv += `${block.number},${tx.hash},${tx.from},${tx.to || "Contract Creation"},${web3.utils.fromWei(tx.value, "ether")},${tx.gas}\n`;
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

// Initial load
fetchBlockchainData();
setInterval(fetchBlockchainData, 10000); // live polling
