/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'so';

export const translations = {
  en: {
    // Top Bar & Navigation
    languageName: 'English',
    welcome: 'Welcome',
    logout: 'Logout',
    wallet: 'Wallet',
    balance: 'Balance',
    onlinePlayers: 'Online Players',

    // Auth Screen
    gameTitle: 'DHILI DHILI',
    gameSubtitle: 'SOMALI LUDO ARENA',
    chooseAvatar: 'Choose Avatar',
    displayName: 'Display Name',
    displayNamePlaceholder: 'e.g. LudoStar_99',
    emailAddress: 'Email Address',
    phoneNumber: 'Phone Number',
    enterArena: 'Enter Game Arena',
    quickSocialLogin: 'Or Quick Social Login',
    authTerms: 'By entering, you agree to the gaming Terms & Conditions and understand that stake amounts are simulated using virtual currency balances.',
    nameRequired: 'Please choose a display name.',

    // Dashboard / Lobby
    selectStake: 'Select Bet Stake',
    chooseStakeTier: 'Choose Bet Stake Tier',
    selectMode: 'Select Game Mode',
    selectCapacity: 'Select Capacity',
    gameMode: 'Game Mode',
    soloMode: 'Solo',
    singlePlayer: 'Single Player',
    partnershipMode: 'Partnership 2v2',
    players: 'Players',
    searchLivePlayers: '⚔️ Search Live',
    playAgainstBot: '🤖 Play Bot',
    loadingBot: 'Loading Bot...',
    searchingPlayers: 'Searching Players...',
    cancelSearch: 'Cancel Search',
    matchmakingRadar: '📡 MATCHMAKING RADAR',
    refresh: 'Refresh ↻',
    loading: 'Loading...',
    radarActive: 'Your Radar is Active 📡',
    radarVisible: 'You are visible to online players!',
    radarWait: 'Please wait for a player to accept your challenge or join your match.',
    radarEmpty: 'Radar is empty (No active seekers)',
    radarStartInfo: 'Click "Search Live Players" to switch your radar on!',
    copyAppLink: '📋 Copy App Link',
    linkCopiedAlert: 'App link copied! Open in another browser tab to play locally against yourself.',
    challenge: 'Challenge ⚔️',
    you: 'You',
    cancelRadar: 'Cancel Radar',
    privateMatchTitle: 'Private Match with Friends',
    privateMatchDesc: 'Create a custom Ludo Room code to share with your friends, or type a lobby room code to enter their active lobby.',
    createPrivateRoom: '➕ Create Private Room',
    joinPrivateRoom: '🔑 Join Room',
    roomCodePlaceholder: 'Enter Room Code',
    createCustomLobby: 'Create Custom Lobby',
    lobbyCode: 'Lobby Code',
    globalLeaderboard: 'Global Earnings Board',
    practiceTitle: 'Practice Pro',
    practiceDesc: 'Pure skill development, no stakes required',
    stakeWin: 'Bet $1 • Win $2.00',
    wins: 'Wins',
    losses: 'Losses',
    totalEarned: 'Total Earned',
    profileSettings: 'Profile Settings',
    aboutUs: 'About Us',
    aboutUsContent: "Welcome to Dhili Dhili, the premier online Ludo destination for the Somali community and beyond. Our platform is more than just a game; it's a vibrant hub where friends, family, and Ludo enthusiasts can connect, compete, and share their passion for this timeless classic.\n\nBorn from a desire to create a dedicated space for Somali Ludo players, Dhili Dhili is a celebration of our culture, camaraderie, and competitive spirit. We've meticulously designed our app to offer an authentic and engaging Ludo experience, complete with all the traditional rules and a modern, user-friendly interface.\n\nWhether you're looking to challenge your friends in a private match, test your skills against players from around the world, or simply enjoy a casual game, Dhili Dhili has something for everyone. Our platform supports both individual and team play, allowing you to team up with a partner and take on the world together.\n\nAt Dhili Dhili, we're committed to fair play and a secure gaming environment. Our state-of-the-art technology ensures that every dice roll is random and every match is decided by skill and strategy. We also offer a range of features designed to enhance your gaming experience, including real-time chat, customizable profiles, and a global leaderboard where you can track your progress and see how you stack up against the competition.\n\nJoin us today and become a part of our growing community. Dhili Dhili is more than just a game; it's where the world comes to play Ludo, the Somali way.",
    help: 'Help',
    helpContent: "Welcome to the Dhili Dhili Help Center. Here you'll find answers to frequently asked questions and guides to help you get the most out of our app.\n\n**Getting Started**\n\n*   **Creating an Account:** To start playing, you'll need to create an account. You can sign up using your email address or through your social media accounts. Once you've registered, you can customize your profile with a unique username and avatar.\n*   **Joining a Game:** You can join a game in several ways. You can start matchmaking to be paired with other players, join a private room using a code from a friend, or create your own private room and invite others to join.\n*   **Playing the Game:** The rules of Dhili Dhili are the same as traditional Ludo. The goal is to move all four of your tokens from your starting area to the center of the board. To do this, you'll need to roll a six to get a token out of your yard and onto the starting square. You can then move your tokens around the board by rolling the dice.\n\n**Features**\n\n*   **Wallet:** Your in-game wallet allows you to manage your virtual currency. You can deposit funds to play in stake matches and withdraw your winnings.\n*   **Matchmaking:** Our matchmaking system will pair you with other players of a similar skill level for a competitive and fair game.\n*   **Private Rooms:** Create a private room to play with your friends. You can set a bet amount and share the room code with anyone you want to invite.\n*   **Leaderboard:** Track your progress and see how you rank against other players on our global leaderboard.\n\n**Contact Us**\n\nIf you can't find the answer to your question here, please don't hesitate to contact us. You can reach our support team by email at [support@dhilidhili.com](mailto:support@dhilidhili.com) or through our social media channels. We're always here to help.",

    // Game Room
    yourTurn: 'Your Turn!',
    waitingTurn: "Waiting for player's turn...",
    rollDice: 'Roll Dice',
    rolled: 'Rolled',
    moveToken: 'Click a highlighted token to move',
    liveVoice: 'Real-Time Voice Chat',
    micOn: 'Mic On',
    micMuted: 'Mic Muted',
    speakersOn: 'Speakers On',
    speakersMuted: 'Speakers Muted',
    send: 'Send',
    typeMessage: 'Type a message...',
    forfeitGame: 'Forfeit / Leave Game',
    forfeitTitle: 'Forfeit Match?',
    forfeitDesc: 'Leaving the game now will result in forfeiting your bet stake.',
    yesLeave: 'Yes, Leave Game',
    cancel: 'Cancel',
    winnerTitle: 'Game Winner!',
    wonPot: 'won the stake pot of',
    backToDashboard: 'Back to Dashboard',
    turnTimer: 'Turn Timer',
    waitingForApproval: 'Waiting for Approval',
    joinRequestSent: 'Your request to join the room has been submitted.',
    waitForHostApproval: 'Please wait for the room host to accept you to start the game!',
    betStake: 'Bet Stake',
    youWon: 'YOU WON! 🏆',
    youLost: 'YOU LOST! 😭',
    winner: 'Winner',
    winnings: 'Winnings',
    playAnotherGame: 'Play Another Game ⚔️',
    teamRedAndYellow: 'TEAM RED & YELLOW',
    allies: 'ALLIES',
    teamGreenAndBlue: 'TEAM GREEN & BLUE',
    notAvailable: 'Not Available',
    selectToken: 'Select Token',
    clickHighlightedTokenToMove: 'Click a highlighted token to move!',
    autoRoll: 'Auto Roll',
    quickReactions: 'Quick Reactions',
    newJoinRequest: 'New Join Request',
    accept: 'Accept',
    decline: 'Decline',


    // Wallet Modal
    walletTitle: 'In-Game Digital Wallet',
    availableBalance: 'Available Balance',
    deposit: 'Deposit Funds',
    withdraw: 'Withdraw Earnings',
    history: 'Transaction History',
    selectDepositMethod: 'Select Deposit Method',
    mobileNumber: 'Mobile Money Phone Number',
    amountUSD: 'Amount (USD)',
    confirmDeposit: 'Confirm Deposit',

    confirmWithdrawal: 'Confirm Withdrawal',
    processing: 'Processing...',
    quickSelect: 'Quick Select Amount',
    depositSuccess: 'Deposit successful!',
    withdrawSuccess: 'Withdrawal successful!',
    enterValidAmount: 'Please enter a valid positive amount.',
    insufficientFunds: 'Insufficient funds for withdrawal.',
    enterPhoneNumber: 'Please enter your mobile money phone number.',
    transactionFailed: 'Transaction failed. Please try again.',
    noTransactions: 'No transactions recorded yet.',

    // Switcher
    switchLanguage: 'Language',
  },
  so: {
    // Top Bar & Navigation
    languageName: 'Soomaali',
    welcome: 'Ku soo dhawoow',
    logout: 'Ka bax',
    wallet: 'Boorsada',
    balance: 'Haraaga',
    onlinePlayers: 'Ciyaartoyda Online-ka ah',

    // Auth Screen
    gameTitle: 'DHILI DHILI',
    gameSubtitle: 'CIYAAR LUDO SOOMAALIYEED',
    chooseAvatar: 'Dooro Astaanta (Avatar)',
    displayName: 'Magacaaga Ciyaarta',
    displayNamePlaceholder: 't.s. LudoStar_99',
    emailAddress: 'Ciwaanka Email-ka',
    phoneNumber: 'Lamberka Telefoonka',
    enterArena: 'Gala Garoonka Ciyaarta',
    quickSocialLogin: 'Ama Ku Gal Baraha Bulshada',
    authTerms: 'Aad oo aad u gasho garoonka, waxaad aqbashay shuruudaha ciyaarta iyo adeegsiga lacagta sharciga ah.',
    nameRequired: 'Fadlan qor magacaaga ciyaarta.',

    // Dashboard / Lobby
    selectStake: 'Dooro Bet-ka',
    chooseStakeTier: 'Dooro Stake-ka',
    selectMode: 'Habka Ciyaarta',
    selectCapacity: 'Tirada Ciyaartoyda',
    gameMode: 'Habka Ciyaarta',
    soloMode: 'Keli',
    singlePlayer: 'Ciyaaryahan Keli ah',
    partnershipMode: 'Labadu Waa Koox (2v2)',
    players: 'Ciyaartoy',
    searchLivePlayers: '⚔️ Raadi Live',
    playAgainstBot: '🤖 La Ciyaar Bot',
    loadingBot: 'Raranaya Bot-ka...',
    searchingPlayers: 'Raadinaya Ciyaartoy...',
    cancelSearch: 'Jooji Raadinta',
    matchmakingRadar: '📡 RADERKA TARTANKA',
    refresh: 'Cusboonaysii ↻',
    loading: 'Ku Raranaya...',
    radarActive: 'Raderkaaga waa shidanyahay 📡',
    radarVisible: 'Waxaad u muuqataa ciyaartoyda kale!',
    radarWait: 'Fadlan sug inta uu ciyaaryahan kale kugu soo biirayo!',
    radarEmpty: 'Raderka waa eber (Ma jiro ciyaartoy raadinaya)',
    radarStartInfo: 'Marka aad taabato "Raadi Ciyaartoy", Raderkaaga ayaa furmaya!',
    copyAppLink: '📋 Koobiyey Link-ga App-ka',
    linkCopiedAlert: 'Link-ga app-ka waa la koobiyey! Ku fur tab ama browser kale.',
    challenge: 'Tartan ⚔️',
    you: 'Adiga',
    cancelRadar: 'Ka Bax Radiyaha',
    privateMatchTitle: 'Qol Khaas Ah Asxaabta',
    privateMatchDesc: 'Sameey qol Ludo koodh leh si aad asxaabtaada ula ciyaarto, ama geli koodhka qolka asxaabtaada.',
    createPrivateRoom: '➕ Sameey Qol Khaas Ah',
    joinPrivateRoom: '🔑 Ku Biir Qol',
    roomCodePlaceholder: 'Geli Koodhka Qolka',
    createCustomLobby: 'Sameey Qol Khaas Ah',
    lobbyCode: 'Koodhka Qolka',
    globalLeaderboard: 'Kala Horeynta Guud',
    practiceTitle: 'Tababar Pro',
    practiceDesc: 'Aan lacag ku xirnayn, waa bilaash',
    stakeWin: 'Bet $1 • Guuleyso $2.00',
    wins: 'Guulaha',
    losses: 'Qasaaraha',
    totalEarned: 'Guud Ahaan Lacagta',
    profileSettings: 'Habaynta Pro-faylka',
    aboutUs: 'Nagu Saabsan',
    aboutUsContent: 'Kani waa barnaamij ciyaar Ludo ah oo loogu talagalay ciyaartoyda Soomaaliyeed. Waxaan hiigsaneynaa inaan siino khibrad xiiso leh dhammaan isticmaalayaasha.',
    help: 'Caawin',
    helpContent: 'Haddii aad u baahan tahay caawimaad, fadlan nagala soo xiriir support@example.com.',

    // Game Room
    yourTurn: 'Ciyaartaada Waa Hada!',
    waitingTurn: 'Waxaa la sugayaa ciyaaryahanka...',
    rollDice: 'Tuur Laadhuuga',
    rolled: 'Waxaa soo baxay',
    moveToken: 'Taabo shaxda ifaysa si aad u dhaqaajiso',
    liveVoice: 'Codka Live-ka Ah',
    micOn: 'Cmak-ka Shidan',
    micMuted: 'Cmak-ka Xiran',
    speakersOn: 'Codka Shidan',
    speakersMuted: 'Codka Muted',
    send: 'Dir',
    typeMessage: 'Qor maqaal ama fariin...',
    forfeitGame: 'Ka Bax Ciyaarta',
    forfeitTitle: 'Ma Hubtaa In Aad Ka Baxeysid?',
    forfeitDesc: 'Haddii aad hadda ka baxdo ciyaarta, waxaad luminaysaa lacagta bet-ka.',
    yesLeave: 'Hoo, Ka Bax',
    cancel: 'Kansal',
    winnerTitle: 'Ciyaartu Waa Dhamaatay!',
    wonPot: 'waxay ku guuleysteen lacagta',
    backToDashboard: 'Ku Bixii Garoonka',
    turnTimer: 'Waqtiga Ciyaarta',
    waitingForApproval: 'Sugida Ogolaanshaha',
    joinRequestSent: 'Codsigaaga ku biirista ee qolka waa la gudbiyey.',
    waitForHostApproval: 'Sug inta martigeliyaha qolka (Host) uu kaa aqbalayo si aad u bilowdo ciyaarta!',
    betStake: 'Lacagta ciyaarta',
    youWon: 'WAAD GUULEYSATAY! 🏆',
    youLost: 'WAA LAGU HELAY! 😭',
    winner: 'Guuleyste',
    winnings: 'Dakhliga Guusha',
    playAnotherGame: 'Ciyaar kale Bilow ⚔️',
    teamRedAndYellow: 'TEAM CAS & HURUUD',
    allies: 'XULAFA',
    teamGreenAndBlue: 'TEAM CAGAAR & BULUUG',
    notAvailable: 'Ma Jiro',
    selectToken: 'Dooro Boorinka',
    clickHighlightedTokenToMove: 'Taabo boorinka kor ku iftiimaya si aad u dhaqaajiso!',
    autoRoll: 'Duubid Toos Ah',
    quickReactions: 'Dareeno Degdeg Ah',
    newJoinRequest: 'Codsi ku soo biiritaan cusub',
    accept: 'Ogolow',
    decline: 'Diid',

    // Wallet Modal
    walletTitle: 'Boorsada & Lacag Bixinta',
    availableBalance: 'Lacagta Hadda Kuu Jirtay',
    deposit: 'Lacag Shubo',
    withdraw: 'Lacag La Bixid',
    history: 'Taariikhda Dhiganaha',
    selectDepositMethod: 'Dooro Habka Shubashada',
    mobileNumber: 'Lamberka Telefoonka',
    amountUSD: 'Tirada Lacagta (USD)',
    confirmDeposit: 'Xaqiiji Shubashada',
    confirmWithdrawal: 'Xaqiiji Bixinta',
    processing: 'Waqti Yar Sug...',
    quickSelect: 'Dooro Qadarka',
    depositSuccess: 'Shubashadu waa guuleysatay!',
    withdrawSuccess: 'Kala bixidda waa ay guuleysatay!',
    enterValidAmount: 'Fadlan geli lacag sax ah oo togan.',
    insufficientFunds: 'Haraagaaga kuma filna kala bixiddaan.',
    enterPhoneNumber: 'Fadlan qor lambarkaaga talefanka.',
    transactionFailed: 'Bixintu waa fashilantay. Fadlan kor u tijaabi.',
    noTransactions: 'Ma jiro wax dhigan ah oo la diwaan geliyay.',

    // Switcher
    switchLanguage: 'Luqadda',
  }
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'so' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'so' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
