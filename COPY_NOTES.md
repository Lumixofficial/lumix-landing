# Landing-page claim review

Reviewed on 2026-09-27. This file is internal context, not public page content.

The product owner subsequently supplied the exact public copy for the four feature cards: “Completely trustless,” “Secured by Soroban,” “No KYC,” and “Open source.” That direction supersedes the conservative feature wording discussed below. The review remains as historical context for the preceding draft.

## Copy supported by the available project

- **Options:** `../lumix-front/components/options-market.ts` and `options-workspace.tsx` expose calls/puts, strikes, expiries, and participant-priced premiums. The page describes those choices and hedging, without promising limited risk for every position.
- **Perpetuals:** `../lumix-front/components/perpetuals-workspace.tsx` includes long/short positions, adjustable leverage, position-size estimates, opening fees, and liquidation estimates. The copy keeps leverage and liquidation risk together.
- **Spot:** `../lumix-front/components/blux-runtime.tsx` selects the highest expected output from returned Stellar paths. `spot-workspace.tsx` shows output, route, fees, minimum received, slippage, and a review stage. The copy says competitive quotes across available paths, not universally best prices.
- **Pools:** `design-system/patterns/product-patterns.md` documents pair-specific liquidity, fee income, shares, and exposure to trader P&L. `../lumax-api/src/types/entities.ts` models shares, share price, pool value, and pending trader P&L. The copy describes earning potential through pool performance, without claiming a particular payout mechanism or guaranteed return.
- **Wallet approval and access:** `../lumix-front/components/blux-runtime.tsx` handles wallet connection and transaction submission. The page describes connected-wallet approvals and no separate platform account; it makes no platform-wide KYC claim.
- **Soroban:** `../lumax-api/README.md` describes protocol data projected from Soroban events. The page says "Built for Soroban" and explains its intended smart-contract role, without claiming an audit or guaranteed security. Technical reference: https://developers.stellar.org/docs/build/smart-contracts/overview
- **Verifiable activity:** the app links submitted transactions to Stellar's explorer. This is the supported openness benefit used on the page.

## Confirm before strengthening claims

- **Production leverage cap:** the local perpetual demo uses 25× for XLM and 20× for BTC/ETH. These are not evidence for a production cap, and do not support 50×.
- **Pool earnings:** the exact fee allocation, accrual/redemption mechanism, and other reward sources need contract or deployed-configuration evidence before publishing "Earn a share of trading fees."
- **Completely trustless:** custody, admin and upgrade powers, oracle dependencies, and deployed contracts have not been verified. The API models admin and pause fields, so an absolute claim is inappropriate on this evidence.
- **Soroban deployment scope:** the full contract implementation/deployment was not available in the reviewed app/API sources.
- **No KYC:** confirm the applicable products, assets, wallet providers, and access policy. A wallet connection flow alone does not establish a blanket exemption.
- **Open source:** the app/API Git remotes returned public 404 responses during verification; no public source repository and license were verified. Do not publish those URLs or an open-source claim until the intended public repository and license are confirmed.

The existing hero, product illustrations, closing invitation, footer, and interaction behavior were preserved.
