// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract FlappyDobiVsScore {
    address public owner;
    IERC20 public usdc;
    uint256 public betAmount = 1e6; // 1 USDC con 6 decimales
    uint256 public nextGameId = 1; // empezamos en 1

    enum GameStatus { Pending, Won, Lost, Claimed }

    struct Game {
        address player;
        GameStatus status;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public activeGameOf; // jugador -> gameId activo

    // Eventos
    event GameCreated(uint256 indexed gameId, address indexed player);
    event GameResult(uint256 indexed gameId, bool won);
    event PrizeClaimed(uint256 indexed gameId, address indexed player, uint256 amount);

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el owner puede hacer esto");
        _;
    }

    // Crear juego
    function createGame() external returns (uint256) {
        require(activeGameOf[msg.sender] == 0, "Ya tienes un juego activo");
        require(usdc.transferFrom(msg.sender, address(this), betAmount), "Transferencia fallida");

        uint256 gameId = nextGameId++;
        games[gameId] = Game({ player: msg.sender, status: GameStatus.Pending });
        activeGameOf[msg.sender] = gameId;

        emit GameCreated(gameId, msg.sender);
        return gameId;
    }

    // Owner decide resultado
    function setResult(uint256 gameId, bool won) external onlyOwner {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Pending, "Juego ya resuelto");

        game.status = won ? GameStatus.Won : GameStatus.Lost;

        if (!won) {
            // liberar juego si perdió
            activeGameOf[game.player] = 0;
        }

        emit GameResult(gameId, won);
    }

    // Reclamar premio
    function claimWinnings(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.player == msg.sender, "No eres el jugador");
        require(game.status == GameStatus.Won, "No puedes reclamar");

        game.status = GameStatus.Claimed;
        activeGameOf[msg.sender] = 0;

        require(usdc.transfer(msg.sender, betAmount * 2), "Transferencia fallida");
        emit PrizeClaimed(gameId, msg.sender, betAmount * 2);
    }

    // Listar todos los juegos (para front)
    function listGames(uint256 from, uint256 to) external view returns (Game[] memory result) {
        require(to >= from, "Rango inválido");
        result = new Game[](to - from + 1);
        uint256 counter = 0;
        for (uint256 i = from; i <= to; i++) {
            result[counter++] = games[i];
        }
    }
}
