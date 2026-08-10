
-- SQL Schema for MySQL Migration

-- Table for User Profiles
CREATE TABLE user_profiles (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    location VARCHAR(255),
    avatar VARCHAR(255) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    win_count INT NOT NULL DEFAULT 0,
    loss_count INT NOT NULL DEFAULT 0,
    is_offline_preference BOOLEAN DEFAULT FALSE,
    vip_tier VARCHAR(255),
    vip_expires BIGINT, -- Unix timestamp
    role VARCHAR(255),
    password VARCHAR(255), -- Storing hashed password
    linked_agent_id VARCHAR(255),
    promo_code VARCHAR(255),
    firebase_uid VARCHAR(255) UNIQUE,
    created_at BIGINT NOT NULL -- Unix timestamp
);

-- Table for Agents
CREATE TABLE agents (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Storing hashed password
    promo_code VARCHAR(255) UNIQUE,
    location VARCHAR(255),
    commission_rate DECIMAL(5, 4) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    float_balance DECIMAL(10, 2),
    status ENUM('Active', 'Suspended') NOT NULL DEFAULT 'Active',
    created_at BIGINT NOT NULL -- Unix timestamp
);

-- Add foreign key for linked_agent_id in user_profiles after agents table is created
ALTER TABLE user_profiles
ADD CONSTRAINT fk_linked_agent
FOREIGN KEY (linked_agent_id) REFERENCES agents(id)
ON DELETE SET NULL; -- If an agent is deleted, unlink from users

-- Table for Wallet Transactions
CREATE TABLE wallet_transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type ENUM('deposit', 'withdrawal', 'bet_escrow_locked', 'bet_escrow_refund', 'win_payout', 'app_commission', 'refund') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    timestamp BIGINT NOT NULL, -- Unix timestamp
    match_id VARCHAR(255),
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Table for Manual Transaction Requests
CREATE TABLE manual_transaction_requests (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    phone VARCHAR(255) NOT NULL, -- For withdrawals, this is the destination phone number
    sender_phone VARCHAR(255), -- For deposits, this is the source phone number
    provider ENUM('evc', 'edahab', 'sahal', 'premier') NOT NULL,
    transaction_type ENUM('deposit', 'withdraw') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at BIGINT NOT NULL, -- Unix timestamp
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Table for Agent Transactions
CREATE TABLE agent_transactions (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    type ENUM('FloatPurchase', 'PlayerDeposit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2),
    player_id VARCHAR(255),
    timestamp BIGINT NOT NULL, -- Unix timestamp
    description TEXT,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES user_profiles(id) ON DELETE SET NULL -- Player may be deleted
);

-- Table for Agent Requests (e.g., float requests from agents to admin)
CREATE TABLE agent_requests (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    agent_username VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at BIGINT NOT NULL, -- Unix timestamp
    resolved_at BIGINT, -- Unix timestamp
    resolved_by VARCHAR(255), -- Admin user ID
    resolver_username VARCHAR(255),
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Table for Player Agent Requests (when a player requests an agent)
CREATE TABLE player_agent_requests (
    id VARCHAR(255) PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,
    player_username VARCHAR(255) NOT NULL,
    player_avatar VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    player_phone VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(255),
    provider ENUM('evc', 'edahab', 'sahal', 'premier') NOT NULL,
    type ENUM('deposit', 'withdrawal') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at BIGINT NOT NULL, -- Unix timestamp
    resolved_at BIGINT, -- Unix timestamp
    FOREIGN KEY (player_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Table for Tournaments
CREATE TABLE tournaments (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entry_fee DECIMAL(10, 2) NOT NULL,
    prize_pool DECIMAL(10, 2) NOT NULL,
    status ENUM('registration_open', 'in_progress', 'completed', 'cancelled') NOT NULL,
    max_players INT NOT NULL,
    start_date BIGINT NOT NULL, -- Unix timestamp
    end_date BIGINT NOT NULL, -- Unix timestamp
    winner_id VARCHAR(255),
    current_round INT NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL, -- Unix timestamp
    FOREIGN KEY (winner_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Table for Tournament Matches
CREATE TABLE tournament_matches (
    id VARCHAR(255) PRIMARY KEY,
    tournament_id VARCHAR(255) NOT NULL,
    round INT NOT NULL,
    player1_user_id VARCHAR(255),
    player1_username VARCHAR(255),
    player1_avatar VARCHAR(255),
    player2_user_id VARCHAR(255),
    player2_username VARCHAR(255),
    player2_avatar VARCHAR(255),
    winner_id VARCHAR(255),
    room_id VARCHAR(255),
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (player1_user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (player2_user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);


-- Table for Game Rooms
CREATE TABLE game_rooms (
    id VARCHAR(255) PRIMARY KEY,
    status ENUM('waiting', 'playing', 'completed', 'cancelled') NOT NULL,
    bet_amount DECIMAL(10, 2) NOT NULL,
    created_at BIGINT NOT NULL, -- Unix timestamp
    capacity INT,
    game_mode ENUM('solo', 'team'),
    tournament_id VARCHAR(255),
    tournament_match_id VARCHAR(255),
    game_state_json JSON NOT NULL, -- Storing the entire GameState as JSON
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
    FOREIGN KEY (tournament_match_id) REFERENCES tournament_matches(id) ON DELETE SET NULL
);

-- Table for Ludo Players within a Game Room (many-to-many relationship with GameRoom and UserProfile)
CREATE TABLE game_players (
    room_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) NOT NULL,
    color ENUM('red', 'green', 'yellow', 'blue') NOT NULL,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('online', 'offline', 'left') NOT NULL DEFAULT 'online',
    inactivity_timer INT,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Table for Ludo Tokens within a Game Room
CREATE TABLE game_tokens (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    color ENUM('red', 'green', 'yellow', 'blue') NOT NULL,
    position INT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Table for Chat Messages within a Game Room
CREATE TABLE game_chat_messages (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    timestamp BIGINT NOT NULL, -- Unix timestamp
    is_spectator BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Table for Game Logs within a Game Room
CREATE TABLE game_logs (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    timestamp BIGINT NOT NULL, -- Unix timestamp
    text TEXT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE
);
