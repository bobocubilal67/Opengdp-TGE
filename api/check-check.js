const userData = {
  "0x71C7656EC7ab88b098defB751B7401B5f6d1476B": {
    "xp": 2500000,
    "roles": ["Alpha Squad", "OG Alpha", "Moderators"]
  },
  "0x1234567890abcdef1234567890abcdef12345678": {
    "xp": 450000,
    "roles": ["OG Socials"]
  }
};

const TOTAL_COMMUNITY_XP = 250000000000; 
const TOTAL_TOKEN_SUPPLY = 10000000000;  

const XP_POOL_TOKENS = TOTAL_TOKEN_SUPPLY * 0.12;    
const ROLE_POOL_TOKENS = TOTAL_TOKEN_SUPPLY * 0.03;  

const roleWeights = {
  "Moderators": 50,
  "OG Alpha": 40,
  "Alpha Squad": 25,
  "OG Socials": 20,
  "Reinforcement": 15
};
const TOTAL_ROLE_POINTS = 4345; 

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (request.method === 'OPTIONS') { return response.status(200).end(); }

  const { address, fdv } = request.query;
  if (!address) { return response.status(400).json({ error: "Adres eksik" }); }

  const userFDV = fdv ? parseFloat(fdv) : 1000000000;
  const estimatedTokenPrice = userFDV / TOTAL_TOKEN_SUPPLY;

  const targetAddress = Object.keys(userData).find(
    key => key.toLowerCase() === address.toLowerCase()
  );

  if (!targetAddress) {
    return response.status(200).json({
      walletAddress: address, eligible: false, reason: "Airdrop listesinde yok.", totalAirdropTokens: 0, estimatedValueUSD: 0
    });
  }

  const user = userData[targetAddress];
  const xpRewardTokens = XP_POOL_TOKENS * (user.xp / TOTAL_COMMUNITY_XP);

  let userTotalRolePoints = 0;
  user.roles.forEach(role => { if (roleWeights[role]) userTotalRolePoints += roleWeights[role]; });
  const roleRewardTokens = ROLE_POOL_TOKENS * (userTotalRolePoints / TOTAL_ROLE_POINTS);

  const totalTokens = xpRewardTokens + roleRewardTokens;
  const totalValueUSD = totalTokens * estimatedTokenPrice;

  return response.status(200).json({
    walletAddress: targetAddress,
    eligible: true,
    calculations: { tokensFromXp: Math.floor(xpRewardTokens), tokensFromRoles: Math.floor(roleRewardTokens) },
    simulatedMarket: { inputFDV: userFDV, estimatedTokenPrice: parseFloat(estimatedTokenPrice.toFixed(4)) },
    totalAirdropTokens: Math.floor(totalTokens),
    estimatedValueUSD: parseFloat(totalValueUSD.toFixed(2)),
    poweredBy: "bobocubilal"
  });
}
