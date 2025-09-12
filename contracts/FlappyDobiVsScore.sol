// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract FlappyDobiVsScore is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public owner;
    IERC20 public dobi;
    uint256 public betAmount = 3500*10**18; // 3500 DOBI
    uint256 public nextGameId = 1; // start from 1

    enum GameStatus { Pending, Won, Lost, Claimed }

    struct Game {
        address player;
        GameStatus status;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public activeGameOf; // player -> active gameId

    // Events
    event GameCreated(uint256 indexed gameId, address indexed player);
    event GameResult(uint256 indexed gameId, bool won);
    event PrizeClaimed(uint256 indexed gameId, address indexed player, uint256 amount);
    event Withdraw(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
        dobi = IERC20(0x931eF8053E997b1Bab68d1E900a061305c0Ff4FB); // DOBI token
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can do this");
        _;
    }

    // --- Game Logic ---

    function createGame() external whenNotPaused returns (uint256) {
        require(activeGameOf[msg.sender] == 0, "You already have an active game");

        dobi.safeTransferFrom(msg.sender, address(this), betAmount);

        uint256 gameId = nextGameId++;
        games[gameId] = Game({ player: msg.sender, status: GameStatus.Pending });
        activeGameOf[msg.sender] = gameId;

        emit GameCreated(gameId, msg.sender);
        return gameId;
    }

    function setResult(uint256 gameId, bool won) external onlyOwner whenNotPaused {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Pending, "Game already resolved");

        game.status = won ? GameStatus.Won : GameStatus.Lost;

        if (!won) {
            activeGameOf[game.player] = 0;
        }

        emit GameResult(gameId, won);
    }

    function claimWinnings(uint256 gameId) external nonReentrant whenNotPaused {
        Game storage game = games[gameId];
        require(game.player == msg.sender, "You are not the player");
        require(game.status == GameStatus.Won, "You cannot claim");

        // Update state first (CEI pattern)
        game.status = GameStatus.Claimed;
        activeGameOf[msg.sender] = 0;

        uint256 prize = betAmount * 2;
        uint256 contractBalance = dobi.balanceOf(address(this));

        if (contractBalance >= prize) {
            dobi.safeTransfer(msg.sender, prize);
            emit PrizeClaimed(gameId, msg.sender, prize);
        } else {
            // Not enough balance: refund only betAmount
            dobi.safeTransfer(msg.sender, betAmount);
            emit PrizeClaimed(gameId, msg.sender, betAmount);
        }
    }

    // --- Admin Functions ---

    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        dobi.safeTransfer(owner, amount);
        emit Withdraw(owner, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setBetAmount(uint256 newBetAmount) external onlyOwner {
        betAmount = newBetAmount;
    }
}