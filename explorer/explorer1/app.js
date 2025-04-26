//const web3 = new Web3("http://127.0.0.1:8545");
const web3 = new Web3("http://192.168.225.68:8545");
const blocksContainer = document.getElementById("blocks");
const addressInput = document.getElementById("addressFilter");

let allBlocks = [];
let latestFetchedBlock = -1;

async function fetchBlockchainData() {
  try {
    const latestBlock = await web3.eth.getBlockNumber();

    for (let i = latestBlock; i > latestFetchedBlock; i--) {
      const block = await web3.eth.getBlock(i, true);
      if (block.transactions && block.transactions.length > 0) {
        allBlocks.unshift(block); // prepend new blocks
      }
    }

    latestFetchedBlock = latestBlock;
    renderBlocks();
  } catch (err) {
    blocksContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    console.error(err);
  }
}

function renderBlocks() {
  const filter = addressInput.value.toLowerCase().trim();
  blocksContainer.innerHTML = "";

  for (const block of allBlocks) {
    const matchingTxs = block.transactions.filter(tx => {
      return !filter ||
        (tx.from && tx.from.toLowerCase().includes(filter)) ||
        (tx.to && tx.to.toLowerCase().includes(filter));
    });

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

  if (!blocksContainer.hasChildNodes()) {
    blocksContainer.innerHTML = `<div class="loading">No transactions match this address.</div>`;
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert(`Copied to clipboard:\n${text}`))
    .catch(err => alert("Failed to copy: " + err));
}

// Initial load
fetchBlockchainData();
addressInput.addEventListener("input", renderBlocks);

// 🔁 Poll every 10 seconds
setInterval(fetchBlockchainData, 10000);
