//const web3 = new Web3("http://127.0.0.1:8545");
const web3 = new Web3("http://192.168.225.68:8545");
const blocksContainer = document.getElementById("blocks");
const addressInput = document.getElementById("addressFilter");

let allBlocks = [];

async function fetchBlockchainData() {
  try {
    const latestBlock = await web3.eth.getBlockNumber();
    allBlocks = [];

    for (let i = latestBlock; i >= 0; i--) {
      const block = await web3.eth.getBlock(i, true);
      if (block.transactions && block.transactions.length > 0) {
        allBlocks.push(block);
      }
    }

    renderBlocks(); // Initial render
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
      blockEl.innerHTML = `<strong>Block ${block.number}</strong> — <small>Hash:</small> ${block.hash}`;

      matchingTxs.forEach(tx => {
        const txEl = document.createElement("div");
        txEl.className = "transaction";
        txEl.innerHTML = `
          <div><strong>Tx Hash:</strong> ${tx.hash}</div>
          <div><strong>From:</strong> ${tx.from}</div>
          <div><strong>To:</strong> ${tx.to || "Contract Creation"}</div>
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

// Re-render on search input change
addressInput.addEventListener("input", renderBlocks);

// Load on page start
fetchBlockchainData();
