pragma solidity ^0.4.17;


contract LotteryAlly {
    address public manager;
    address[] public players;
    
    /*
    masg global variable available on all contracts
    msg global variable contains
        msg.data
        msg.gas
        msg.sender
        msg.value
    */
    //function Lottery() - deprecated version of constructor
    constructor() public {
        manager = msg.sender;
    }
    
    function enter() public payable {
        require(msg.value > .01 ether, "Not enough eth to enter"); //.01 eth * wei conversion
        players.push(msg.sender);
    }
    
    function randomNumberGenerator() private view returns (uint) {
        //use chainlink random number generator
        /* creating our own using
        - current block difficulty
        - current time
        - addresses of players
        and sending to SHA3 algorithm (depractaed - use keccak256)
        */
        return uint(keccak256(abi.encodePacked(block.difficulty, now, players))); //global variable
        
    }
    
    function pickWinner() public restricted {
        require(players.length > 0, "Not enough players to pick a winner");
        uint winnerIdx = randomNumberGenerator() % players.length;
        //address(uint160(players[winnerIdx]));
        address winnerAddress = players[winnerIdx];
        winnerAddress.transfer(address(this).balance); //get address of winner and send eth 
        players = new address[](0); //new dynamic array of type address with an initial size of 0 - reset the lottery
        // return winnerAddress; //doesn't work with returns(address)
    }
    

    //restrict a function to this logic matching
    modifier restricted() {
        require(msg.sender == manager); //make sure its the manager calling this function
        _;
    }
    
    function getPlayers() public view returns(address[]) {
        return players;
    }
    
}
