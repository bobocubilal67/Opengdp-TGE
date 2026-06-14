// 1. KULLANICI VERİLERİ (Çoklu rol destekli)
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

// Sabit Ekosistem Değerleri
const TOTAL_COMMUNITY_XP = 250000000000; 
const TOTAL_TOKEN_SUPPLY = 10000000000;  

// Havuz Dağılımları (%15 Toplam, %12 XP, %3 Roller)
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

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { address, fdv } = request.query;

  // EĞER KULLANICI ADRES GİRMEDİYSE: Ekrana Şık HTML Tasarımını Basıyoruz!
  if (!address) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    return response.status(200).send(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OpenGDP Airdrop Checker</title>
          <style>
              body {
                  background-color: #0d1117;
                  color: #c9d1d9;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                  box-sizing: border-box;
              }
              .container {
                  background: #161b22;
                  border: 1px solid #30363d;
                  border-radius: 12px;
                  padding: 30px;
                  max-width: 450px;
                  width: 100%;
                  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                  text-align: center;
              }
              h1 { color: #58a6ff; margin-bottom: 5px; font-size: 24px; }
              p { color: #8b949e; font-size: 14px; margin-top: 0; }
              .input-group { margin: 20px 0; text-align: left; }
              label { display: block; margin-bottom: 6px; font-size: 12px; color: #8b949e; text-transform: uppercase; font-weight: bold; }
              input[type="text"] {
                  width: 100%;
                  padding: 12px;
                  background: #0d1117;
                  border: 1px solid #30363d;
                  border-radius: 6px;
                  color: #fff;
                  box-sizing: border-box;
                  font-size: 14px;
              }
              .slider-container { background: #0d1117; border: 1px solid #30363d; padding: 12px; border-radius: 6px; margin-top: 5px; }
              .slider-header { display: flex; justify-content: space-between; font-size: 13px; color: #fff; margin-bottom: 5px; }
              input[type="range"] { width: 100%; accent-color: #58a6ff; cursor: pointer; }
              button {
                  width: 100%;
                  padding: 12px;
                  background: #238636;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-weight: bold;
                  font-size: 16px;
                  cursor: pointer;
                  transition: background 0.2s;
              }
              button:hover { background: #2ea043; }
              .result-box {
                  margin-top: 20px;
                  padding: 15px;
                  border-radius: 6px;
                  background: #21262d;
                  border: 1px solid #30363d;
                  display: none;
                  text-align: left;
                  font-size: 14px;
              }
              .result-item { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #30363d; padding-bottom: 4px; }
              .result-item:last-child { border: none; margin: 0; padding: 0; }
              .success-text { color: #3fb950; font-weight: bold; }
              .error-text { color: #f85149; font-weight: bold; }
              .footer { margin-top: 30px; font-size: 11px; color: #8b949e; letter-spacing: 0.5px; }
              .footer a { color: #58a6ff; text-decoration: none; font-weight: bold; }
          </style>
      </head>
      <body>

      <div class="container">
          <h1>OpenGDP Airdrop</h1>
          <p>Cüzdan Durumu ve Kazanç Simülatörü</p>
          
          <div class="input-group">
              <label>Cüzdan Adresi (EVM)</label>
              <input type="text" id="walletAddress" placeholder="0x... ile başlayan adresiniz">
          </div>

          <div class="input-group">
              <label>Simüle Edilecek FDV Piyasası</label>
              <div class="slider-container">
                  <div class="slider-header">
                      <span>FDV Değeri:</span>
                      <span id="fdvDisplay" style="color: #58a6ff; font-weight:bold;">$1.0B</span>
                  </div>
                  <input type="range" id="fdvSlider" min="100000000" max="10000000000" step="100000000" value="1000000000">
              </div>
          </div>

          <button onclick="checkAirdrop()">Sorgula & Hesapla</button>

          <div id="resultBox" class="result-box"></div>

          <div class="footer">
              POWERED BY <a href="#">bobocubilal</a> | OpenGDP Ecosystem
          </div>
      </div>

      <script>
          const slider = document.getElementById('fdvSlider');
          const display = document.getElementById('fdvDisplay');
          
          slider.oninput = function() {
              let val = parseFloat(this.value);
              if(val >= 1000000000) {
                  display.innerHTML = "$" + (val / 1000000000).toFixed(1) + "B";
              } else {
                  display.innerHTML = "$" + (val / 1000000).toFixed(0) + "M";
              }
          }

          async function checkAirdrop() {
              const address = document.getElementById('walletAddress').value.trim();
              const fdvValue = slider.value;
              const resultBox = document.getElementById('resultBox');

              if(!address) {
                  alert('Lütfen geçerli bir cüzdan adresi girin.');
                  return;
              }

              resultBox.style.display = 'block';
              resultBox.innerHTML = '<p style="text-align:center; color:#8b949e;">Hesaplanıyor...</p>';

              try {
                  // Mevcut konumdaki API'ye istek atıyoruz
                  const res = await fetch(\`/?address=\${address}&fdv=\${fdvValue}\`);
                  const data = await res.json();

                  if(data.eligible) {
                      resultBox.innerHTML = \`
                          <div class="result-item"><span>Durum:</span><span class="success-text">Airdrop Kapsamında!</span></div>
                          <div class="result-item"><span>Kazanılan Token:</span><span style="color:#fff; font-weight:bold;">\${data.totalAirdropTokens.toLocaleString()} OpenGDP</span></div>
                          <div class="result-item"><span>Simüle Fiyat:</span><span style="color:#58a6ff;">$\${data.simulatedMarket.estimatedTokenPrice}</span></div>
                          <div class="result-item"><span>Tahmini Değer:</span><span class="success-text">$\${data.estimatedValueUSD.toLocaleString()}</span></div>
                          <div style="font-size:11px; color:#8b949e; margin-top:10px; text-align:center;">
                              XP Payı: \${data.calculations.tokensFromXp.toLocaleString()} | Rol Payı: \${data.calculations.tokensFromRoles.toLocaleString()}
                          </div>
                      \`;
                  } else {
                      resultBox.innerHTML = \`
                          <div class="result-item"><span>Durum:</span><span class="error-text">Elverişli Değil</span></div>
                          <p style="color:#8b949e; font-size:12px; margin:5px 0 0 0;">\${data.reason}</p>
                      \`;
                  }
              } catch (error) {
                  resultBox.innerHTML = '<p class="error-text" style="text-align:center;">Sistem hatası oluştu.</p>';
              }
          }
      </script>

      </body>
      </html>
    `);
  }

  // EĞER CÜZDAN ADRESİ GİRİLDİYSE: Arka planda yine temiz JSON dönüyor
  const userFDV = fdv ? parseFloat(fdv) : 1000000000;
  const estimatedTokenPrice = userFDV / TOTAL_TOKEN_SUPPLY;

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

  const userXpShare = user.xp / TOTAL_COMMUNITY_XP;
  const xpRewardTokens = XP_POOL_TOKENS * userXpShare;

  let userTotalRolePoints = 0;
  user.roles.forEach(role => {
    if (roleWeights[role]) {
      userTotalRolePoints += roleWeights[role];
    }
  });

  const userRoleShare = userTotalRolePoints / TOTAL_ROLE_POINTS;
  const roleRewardTokens = ROLE_POOL_TOKENS * userRoleShare;

  const totalTokens = xpRewardTokens + roleRewardTokens;
  const totalValueUSD = totalTokens * estimatedTokenPrice;

  return response.status(200).json({
    walletAddress: targetAddress,
    eligible: true,
    userStats: { xp: user.xp, roles: user.roles },
    calculations: { tokensFromXp: Math.floor(xpRewardTokens), tokensFromRoles: Math.floor(roleRewardTokens) },
    simulatedMarket: { inputFDV: userFDV, estimatedTokenPrice: parseFloat(estimatedTokenPrice.toFixed(4)) },
    totalAirdropTokens: Math.floor(totalTokens),
    estimatedValueUSD: parseFloat(totalValueUSD.toFixed(2)),
    currency: "OpenGDP",
    poweredBy: "bobocubilal",
    developer: "bobocubilal"
  });
}
