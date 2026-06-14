// 1. KULLANICI VERİLERİ (Cüzdan, XP ve Sahip Olduğu Roller)
const userData = {
  "0x71C7656EC7ab88b098defB751B7401B5f6d1476B": {
    "xp": 2500000,
    "roles": ["Alpha Squad", "OG Alpha", "Moderators"] // Çoklu rol
  },
  "0x1234567890abcdef1234567890abcdef12345678": {
    "xp": 450000,
    "roles": ["OG Socials"]
  }
};

// Sabit Ekosistem Değerleri
const TOTAL_COMMUNITY_XP = 250000000000; // Toplam 250 Milyar XP
const TOTAL_TOKEN_SUPPLY = 10000000000;  // Toplam 10 Milyar Token Arzı

// Havuz Oranları (Toplam arzın %15'i Airdrop)
const TOTAL_AIRDROP_PERCENT = 0.15; 
const TOTAL_AIRDROP_TOKENS = TOTAL_TOKEN_SUPPLY * TOTAL_AIRDROP_PERCENT; // 1.500.000.000 Token

// %15'lik airdrop'un %12'si XP'ye, kalan %3'ü Discord Rollerine
const XP_POOL_TOKENS = TOTAL_TOKEN_SUPPLY * 0.12;    // 1.200.000.000 Token
const ROLE_POOL_TOKENS = TOTAL_TOKEN_SUPPLY * 0.03;  // 300.000.000 Token

// Discord Rollerinin Havuz İçindeki Ağırlık Puanları
const roleWeights = {
  "Moderators": 50,
  "OG Alpha": 40,
  "Alpha Squad": 25,
  "OG Socials": 20,
  "Reinforcement": 15
};

// Tüm rollerin toplam ağırlık puanı havuzu (8*50 + 17*40 + 91*25 + 20*20 + 14*15)
const TOTAL_ROLE_POINTS = 4345; 

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { address, fdv } = request.query;

  if (!address) {
    return response.status(400).json({ error: "Lütfen bir cüzdan adresi (address) belirtin." });
  }

  // Kullanıcı FDV girmezse varsayılan $1 Milyar baz alınır
  const userFDV = fdv ? parseFloat(fdv) : 1000000000;
  const estimatedTokenPrice = userFDV / TOTAL_TOKEN_SUPPLY;

  // Cüzdan adresi kontrolü (Büyük/küçük harf duyarlılığı kaldırıldı)
  const targetAddress = Object.keys(userData).find(
    key => key.toLowerCase() === address.toLowerCase()
  );

  if (!targetAddress) {
    return response.status(200).json({
      walletAddress: address,
      eligible: false,
      reason: "Bu cüzdan adresi airdrop listesinde bulunamadı.",
      estimatedAirdropTokens: 0,
      estimatedValueUSD: 0,
      poweredBy: "bobocubilal"
    });
  }

  const user = userData[targetAddress];

  // A) XP Ödülü Hesaplama (%12'lik havuzdan alınan pay)
  const userXpShare = user.xp / TOTAL_COMMUNITY_XP;
  const xpRewardTokens = XP_POOL_TOKENS * userXpShare;

  // B) Discord Rol Ödülü Hesaplama (%3'lük havuzdan alınan pay)
  let userTotalRolePoints = 0;
  user.roles.forEach(role => {
    if (roleWeights[role]) {
      userTotalRolePoints += roleWeights[role];
    }
  });

  const userRoleShare = userTotalRolePoints / TOTAL_ROLE_POINTS;
  const roleRewardTokens = ROLE_POOL_TOKENS * userRoleShare;

  // Toplam Token ve USD Değeri
  const totalTokens = xpRewardTokens + roleRewardTokens;
  const totalValueUSD = totalTokens * estimatedTokenPrice;

  // Yanıtı dönüyor ve bobocubilal imzasını basıyoruz
  return response.status(200).json({
    walletAddress: targetAddress,
    eligible: true,
    userStats: {
      xp: user.xp,
      roles: user.roles
    },
    poolDistribution: {
      totalAirdropAllocation: "15%",
      xpPoolAllocation: "12%",
      discordRolesPoolAllocation: "3%"
    },
    calculations: {
      tokensFromXp: Math.floor(xpRewardTokens),
      tokensFromRoles: Math.floor(roleRewardTokens)
    },
    simulatedMarket: {
      inputFDV: userFDV,
      estimatedTokenPrice: parseFloat(estimatedTokenPrice.toFixed(4))
    },
    totalAirdropTokens: Math.floor(totalTokens),
    estimatedValueUSD: parseFloat(totalValueUSD.toFixed(2)),
    currency: "OpenGDP",
    updatedAt: new Date().toISOString(),
    
    // DEVELOPER REKLAM ALANI 🔥
    poweredBy: "bobocubilal",
    developer: "bobocubilal",
    message: "OpenGDP Airdrop Checker successfully created by bobocubilal."
  });
}
