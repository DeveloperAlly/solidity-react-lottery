const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../compile');


let lottery;
let accounts;

//run before assertions / test
beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000'})
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address)
    }),

    it('allows one user account to enter lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.strictEqual(accounts[0], players[0]);
        assert.strictEqual(1, players.length)
    })

    it('allows mutliple user accounts to enter lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.strictEqual(accounts[0], players[0]);
        assert.strictEqual(accounts[1], players[1]);
        assert.strictEqual(accounts[2], players[2]);
        assert.strictEqual(3, players.length)
    })

    it('ensures user has minimum amount of eth needed to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 200 //wei
            });
            assert(false)
        }
        catch(err) {
            assert(err)
        }
    })

    it('ensures only manager can call winner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false)
        }
        catch(err) {
            assert(err)
        }
    })

    it('sends money to the winner and resets the players array', async ()=> {
        //random number is not checked
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        })

        const iniitialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0]});
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - iniitialBalance;
        console.log(`gas spent: ${2 - web3.utils.fromWei(difference.toString(), 'ether')} eth`)

        assert(difference > web3.utils.toWei('1.8', 'ether'));

        //check players array is emptied
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert(players.length == 0);

        //check lottery balance is back to 0
        const lotteryBalace = await web3.eth.getBalance(lottery.options.address);
        assert(lotteryBalace == 0); //no money in pool

    })
})