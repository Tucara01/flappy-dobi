# Setup Guide for Flappy DOBI Game

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Base Network Configuration
BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_URL=http://localhost:3000

# Smart Contract Configuration
CONTRACT_ADDRESS=0xB57e102ecb7646a3a8AC08811e4eB4476f7ad929
DOBI_TOKEN_ADDRESS=0x931eF8053E997b1Bab68d1E900a061305c0Ff4FB

# Owner Private Key (for server operations)
# IMPORTANT: Keep this secure and never commit to version control
OWNER_PRIVATE_KEY=your_owner_private_key_here

# Game Configuration
BET_AMOUNT=1000000000000000000
WIN_THRESHOLD=50
```

## Smart Contract Integration

The game now integrates with the FlappyDobiVsScore smart contract on Base mainnet:

- **Contract Address**: `0xB57e102ecb7646a3a8AC08811e4eB4476f7ad929`
- **DOBI Token**: `0x931eF8053E997b1Bab68d1E900a061305c0Ff4FB`
- **Bet Amount**: 1 DOBI (1e18 wei)
- **Win Threshold**: 50 points

## Features Implemented

### 1. Bet Game Creation
- Users can create bet games by depositing DOBI tokens
- Automatic token approval if needed
- Game ID generation and backend registration

### 2. Backend Monitoring
- Automatic game registration when created
- Real-time monitoring of game progress
- Win/loss notifications to backend

### 3. Smart Contract Integration
- Server can set game results via API
- Automatic contract interaction for wins/losses
- Secure owner-only operations

### 4. User Interface
- Contract status display
- Token balance and allowance information
- One-click game creation and claiming

## API Endpoints

### Game Management
- `POST /api/games/bet` - Register bet game
- `PUT /api/games/bet` - Update game status
- `GET /api/games/bet` - Get game information

### Contract Operations
- `POST /api/games/set-result` - Set game result in contract
- `GET /api/games/set-result` - Get game status from contract
- `POST /api/games/evaluate-contract` - Evaluate and set result

### Monitoring
- `GET /api/games/bet/monitor` - Monitor all games
- `POST /api/games/bet/monitor/control` - Control monitoring service

## Usage Flow

1. **User connects wallet** and sees DOBI balance
2. **User approves DOBI tokens** if needed
3. **User creates bet game** by clicking "Create Bet Game"
4. **Backend registers game** for monitoring
5. **User plays game** and reaches 50+ points or loses
6. **Backend receives notification** and sets result in contract
7. **User claims winnings** if they won

## Security Considerations

- Owner private key must be kept secure
- All contract operations are validated
- User addresses are verified before operations
- Game states are checked before updates

## Testing

To test the complete flow:

1. Deploy the application
2. Connect a wallet with DOBI tokens
3. Create a bet game
4. Play and reach 50+ points
5. Verify the backend sets the result
6. Claim winnings

## Troubleshooting

### Common Issues

1. **"Insufficient allowance"** - User needs to approve DOBI tokens
2. **"Game already resolved"** - Game has already been processed
3. **"Player address mismatch"** - Wrong player trying to claim
4. **"No wallet connected"** - User needs to connect wallet

### Debug Information

Check the browser console and server logs for detailed error messages. All contract interactions are logged with transaction hashes.
