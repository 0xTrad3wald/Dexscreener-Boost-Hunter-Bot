# Dexscreener-Boost-Hunter-Bot
This Bot is a Node.js script written in Typescript and it scans the Boost Endpoints of Dexscreener for boosted contracts on the Solana Blockchain. If it finds fresh boosted contract it will do a rugcheck on the contract by using the rugcheck.xyz API and create a message as output that is ready for integration into your favorite tool (Discord, TG).

Shoutouts to [@DigitalBenjamin] for the original code and the inspiration.

Note: The code included in this repository does not cointain the Discord integration.
## Project Description

The Solana token hunter (sniper) is a Node.js project built with TypeScript, designed to automate the tracking of newly boosted tokens on Dexscreener. You can configure multiple things like pumpfun check, minimum boost and includes a rugcheck.

### Features

- Possibility to skip pump.fun tokens
- Rug check using a third party service rugcheck.xyz
- Display boosted Dexscreener tokens including token statistics
- Set a minimum boost amount

### Third Party documentation

- [Discord JS](https://discord.js.org/)
- [Dexscreener API Reference](https://docs.dexscreener.com/api/reference)
- [Rugcheck API Reference](https://api.rugcheck.xyz/swagger/index.html)

### Disclaimer

You are solely responsible for your own financial decisions. Before making any trades or investments, it is strongly recommended that you consult with a qualified financial professional.

By using this software, you acknowledge that the creators and contributors of this project shall not be held liable for any financial losses, damages, or other consequences resulting from its use. Use the software at your own risk.

The software (code in this repository) must not be used to engage in any form of market manipulation, fraud, illegal activities, or unethical behavior. The creators of this project do not endorse or support malicious use cases, such as front-running, exploiting contracts, or harming other users. Users are expected to adhere to ethical trading practices and comply with applicable laws and regulations.

The software (code in this repository) is intended solely to facilitate learning and enhance the educational experience provided by the accompanying videos. Any other use is strictly prohibited.

All trading involves risk and may not be suitable for all individuals. You should carefully consider your investment objectives, level of experience, and risk appetite before engaging in any trading activities. Past performance is not indicative of future results, and there is no guarantee that any trading strategy, algorithm or tool discussed will result in profits or avoid losses.

I am not a licensed financial advisor or a registered broker-dealer. The content shared is based solely on personal experience and knowledge and should not be relied upon as financial advice or a guarantee of success. Always conduct your own research and consult with a professional financial advisor before making any investment decisions.

If you have any questions or concerns regarding the software or if you´re interested in working togeteher, please contact me.
