const Web3 = require("web3");
//const web3 = new Web3("http://127.0.0.1:8545");
const web3 = new Web3("http://192.168.225.68:8545");


(async () => {
  const latest = await web3.eth.getBlockNumber();
  for (let i = 0; i <= latest; i++) {
    const block = await web3.eth.getBlock(i, true);
    if (block.transactions.length > 0) {
      console.log(`Block ${i}:`);
      block.transactions.forEach(tx => console.log(tx));
    }
  }
})();

/*
To display transactions in Ganache, you can use Truffle console or interact directly with Ganache using Web3.js or Ether.js scripts. However, Ganache CLI itself does not have a built-in command to list past transactions directly from the terminal.

But here are your options:

✅ Option 1: Use Truffle Console (if using Truffle)
Start Ganache (GUI or CLI).

Open Truffle console:

bash
truffle console
Then run this JavaScript code to list past transactions:

javascript

web3.eth.getBlockNumber().then(async (latest) => {
  for (let i = 0; i <= latest; i++) {
    let block = await web3.eth.getBlock(i, true);
    if (block && block.transactions.length > 0) {
      console.log(`\nBlock ${i}`);
      block.transactions.forEach(tx => console.log(tx));
    }
  }
});
✅ Option 2: Write a Script with Web3.js
If you are using Ganache CLI and want to see transactions using Node.js:

bash
npm install web3
Then create a transactions.js file:

js
const Web3 = require("web3");
const web3 = new Web3("http://127.0.0.1:8545");

(async () => {
  const latest = await web3.eth.getBlockNumber();
  for (let i = 0; i <= latest; i++) {
    const block = await web3.eth.getBlock(i, true);
    if (block.transactions.length > 0) {
      console.log(`Block ${i}:`);
      block.transactions.forEach(tx => console.log(tx));
    }
  }
})();
Run it with:

bash
node transactions.js

*/