//const web3 = new Web3("http://127.0.0.1:8545");
const web3 = new Web3("http://192.168.225.68:8545");

const blocksContainer = document.getElementById("blocks");

async function displayTransactions() {
  try {
    const latestBlock = await web3.eth.getBlockNumber();
    blocksContainer.innerHTML = "";

    for (let i = latestBlock; i >= 0; i--) {
      const block = await web3.eth.getBlock(i, true);
      if (block.transactions && block.transactions.length > 0) {
        const blockEl = document.createElement("div");
        blockEl.className = "block";
        blockEl.innerHTML = `<strong>Block ${block.number}</strong> — <small>Hash:</small> ${block.hash}`;

        block.transactions.forEach(tx => {
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
  } catch (err) {
    blocksContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    console.error(err);
  }
}

displayTransactions();
