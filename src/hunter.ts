import dotenv from "dotenv"; // zero-dependency module that loads environment variables from a .env
import axios from "axios";
import { DateTime } from "luxon";
import { config } from "./config"; // Configuration parameters for our hunter
import { RugResponse, TokenResponseType, detailedTokenResponseType, dexEndpoint, updatedDetailedTokenType } from "./types";
import { selectTokenBoostAmounts, upsertTokenBoost } from "./db";
import chalk from "chalk";
import { getRugCheck } from "./transactions";

// Load environment variables from the .env file
dotenv.config();

// Helper function to get data from endpoints
export async function getEndpointData(url: string): Promise<false | any> {
  const tokens = await axios.get<TokenResponseType[]>(url, {
    timeout: config.axios.get_timeout,
  });

  if (!tokens.data) return false;

  return tokens.data;
}

// Start requesting data
let firstRun = true;
async function main() {
  // First run logic
  if (firstRun) console.clear();
  if (firstRun) console.log("Started. Waiting for tokens...");

  // Get endpoints
  const endpoints = config.dex.endpoints || "";

  // Verify if endpoints are provided
  if (endpoints.length === 0) return;

  // Loop through the endpoints
  await Promise.all(
    endpoints.map(async (endpoint) => {
      const ep: dexEndpoint = endpoint;
      const endpointName = ep.name;
      const endpointUrl = ep.url;
      const endpointPlatform = ep.platform;
      const chains = config.settings.chains_to_track;

      // Handle Dexscreener
      if (endpointPlatform === "dexscreener") {
        // Check latest token boosts on dexscreener
        if (endpointName === "boosts-latest") {
          // Get latest boosts
          const data = await getEndpointData(endpointUrl);

          // Check if data was received
          if (!data) console.log(`🚫 No new token boosts received.`);

          // Add tokens database
          if (data) {
            const tokensData: TokenResponseType[] = data;

            // Loop through tokens
            for (const token of tokensData) {
              // Verify chain
              if (!chains.includes(token.chainId.toLowerCase())) continue;

              // Handle Exceptions
              if (token.tokenAddress.trim().toLowerCase().endsWith("pump") && config.settings.ignore_pump_fun) continue;

              // Get the current boost amounts for this token
              const returnedAmounts = await selectTokenBoostAmounts(token.tokenAddress);

              // Check if new information was provided
              if (!returnedAmounts || returnedAmounts.amountTotal !== token.totalAmount) {
                // Get latest token information
                const endpoint = endpoints.find((e) => e.platform === endpointPlatform && e.name === "get-token");
                const getTokenEndpointUrl = endpoint ? endpoint.url : null;
                if (!getTokenEndpointUrl) continue;

                // Request latest token information
                const newTokenData = await getEndpointData(`${getTokenEndpointUrl}${token.tokenAddress}`);
                if (!newTokenData) continue;

                // Extract information from returned data
                const detailedTokensData: detailedTokenResponseType = newTokenData;
                const dexPair = detailedTokensData.pairs.find((pair) => pair.dexId === config.settings.dex_to_track);
                if (!dexPair) continue;
                const tokenName = dexPair.baseToken.name || token.tokenAddress;
                const tokenSymbol = dexPair.baseToken.symbol || "N/A";

                // Create record with latest token information
                const updatedTokenProfile: updatedDetailedTokenType = {
                  url: token.url,
                  chainId: token.chainId,
                  tokenAddress: token.tokenAddress,
                  icon: token.icon,
                  header: token.header,
                  openGraph: token.openGraph,
                  description: token.description,
                  links: token.links,
                  amount: token.amount,
                  totalAmount: token.totalAmount,
                  pairsAvailable: detailedTokensData.pairs.length ? detailedTokensData.pairs.length : 0,
                  dexPair: config.settings.dex_to_track,
                  currentPrice: dexPair.priceUsd ? parseFloat(dexPair.priceUsd) : 0,
                  liquidity: dexPair.liquidity.usd ? dexPair.liquidity.usd : 0,
                  marketCap: dexPair.marketCap ? dexPair.marketCap : 0,
                  pairCreatedAt: dexPair.pairCreatedAt ? dexPair.pairCreatedAt : 0,
                  tokenName: tokenName,
                  tokenSymbol: tokenSymbol,
                };

                // Add or update Record
                const x = await upsertTokenBoost(updatedTokenProfile);

                // Confirm
                if (x && !firstRun && token.totalAmount && config.settings.min_boost_amount <= token.totalAmount) {
                  // Check if Golden Ticker
                  let goldenTicker = "⚡";
                  let goldenTickerColor = chalk.bgGray;
                  if (updatedTokenProfile.totalAmount && updatedTokenProfile.totalAmount > 499) {
                    goldenTicker = "🔥";
                    goldenTickerColor = chalk.bgYellowBright;
                  }

                  // Check socials
                  let socialsIcon = "🔴";
                  let socialsColor = chalk.bgGray;
                  let socialLenght = 0;
                  if (updatedTokenProfile.links && updatedTokenProfile.links.length > 0) {
                    socialsIcon = "🟢";
                    socialsColor = chalk.greenBright;
                    socialLenght = updatedTokenProfile.links.length;
                  }

                  // Handle pumpfun
                  let pumpfunIcon = "🔴";
                  let isPumpFun = "No";
                  if (updatedTokenProfile.tokenAddress.trim().toLowerCase().endsWith("pump")) {
                    pumpfunIcon = "🟢";
                    isPumpFun = "Yes";
                  }

                  // Handle Rugcheck
                  let rugCheckResults: string[] = [];
                  if (config.rug_check.enabled) {
                    const res = await getRugCheck(updatedTokenProfile.tokenAddress);
                    if (res) {
                      const rugResults: RugResponse = res;
                      const rugRisks = rugResults.risks;

                      // Add risks
                      if (rugRisks.length !== 0) {
                        const dangerLevelIcons = {
                          danger: "🔴",
                          warn: "🟡",
                        };

                        rugCheckResults = rugRisks.map((risk) => {
                          const icon = dangerLevelIcons[risk.level as keyof typeof dangerLevelIcons] || "⚪"; // Default to white circle if no match
                          return `${icon} ${risk.name}: ${risk.description}`;
                        });
                      }
                      // Add no risks
                      if (rugRisks.length === 0) {
                        const newRiskString = `🟢 No risks found`;
                        rugCheckResults.push(newRiskString);
                      }
                    }
                  }

                  // Check age
                  const timeAgo = updatedTokenProfile.pairCreatedAt ? DateTime.fromMillis(updatedTokenProfile.pairCreatedAt).toRelative() : "N/A";

                  // Console Log
                  console.log("\n\n[ Boost Information ]");
                  console.log(`✅ ${updatedTokenProfile.amount} boosts added for ${updatedTokenProfile.tokenName} (${updatedTokenProfile.tokenSymbol}).`);
                  console.log(goldenTickerColor(`${goldenTicker} Boost Amount: ${updatedTokenProfile.totalAmount}`));
                  console.log("[ Token Information ]");
                  console.log(socialsColor(`${socialsIcon} This token has ${socialLenght} socials.`));
                  console.log(
                    `🕝 This token pair was created ${timeAgo} and has ${updatedTokenProfile.pairsAvailable} pairs available including ${updatedTokenProfile.dexPair}`
                  );
                  console.log(`🤑 Current Price: $${updatedTokenProfile.currentPrice}`);
                  console.log(`📦 Current Mkt Cap: $${updatedTokenProfile.marketCap}`);
                  console.log(`💦 Current Liquidity: $${updatedTokenProfile.liquidity}`);
                  console.log(`🚀 Pumpfun token: ${pumpfunIcon} ${isPumpFun}`);
                  if (rugCheckResults.length !== 0) {
                    console.log("[ Rugcheck Result   ]");
                    rugCheckResults.forEach((risk) => {
                      console.log(risk);
                    });
                  }
                  console.log("[ Checkout Token    ]");
                  console.log(`👀 View on Dex https://dexscreener.com/${updatedTokenProfile.chainId}/${updatedTokenProfile.tokenAddress}`)
                  console.log(`👽 Buy via GMGN https://gmgn.ai/sol/token/${updatedTokenProfile.tokenAddress}`);
                  console.log(`🟣 Buy via Photon https://photon-sol.tinyastro.io/en/lp/${updatedTokenProfile.tokenAddress}`);
                }
              }
            }
          }
        }
      }
    })
  );

  firstRun = false;
  setTimeout(main, config.settings.hunter_timeout); // Call main again after 5 seconds
}

main().catch((err) => {
  console.error(err);
});
