# The Hex Box - Economic Social Experiment

## 1. Infrastructure & Visuals
- [x] 100x100 Hex Grid Rendering (Canvas).
- [x] Smooth Camera & Optimized Movement.
- [x] Real-time Firebase Sync.
- [x] Click-to-Interact Gameplay (Movement removed).

## 2. Land Economics (The Core)
- [x] Land Acquisition: Click to purchase/claim hexes.
- [ ] Ownership Tracking: `game_state/land/{x}-{y}` stores the owner ID.
- [ ] Passive Income: Each owned tile generates `X` gold every 10 seconds.
- [ ] Land Tax: A small global tax that fuels the "Central Bank".

## 3. Market & Stock War
- [ ] Dynamic Pricing: Land purchase price fluctuates based on total land claimed.
- [ ] Resource Speculation: "Gold" is the primary currency for land.
- [ ] Global Economy State: A `economy/market_multiplier` affects all costs and earnings.

## 4. Territorial Strategy
- [ ] Tribe/Faction Ownership: Grouping land owners into factions.
- [ ] Border Wars: Ability to "buy out" or "steal" land from others.
- [ ] Wall Fortification: Walls usable on owned land to protect against takeovers.

## 5. Social Experiment Hooks
- [ ] Wealth Gap Visualization: Leaderboard based on land area and gold.
- [ ] Diplomatic Chat: Real-time chat for land deals and alliances.
- [ ] Economic Crashes: Periodic resets or value drops.

## 6. Security (Firebase Rules)
- [ ] Transaction Validation: Ensure players have enough gold before claiming.
- [ ] Ownership Validation: Ensure only owners can build walls on their land.
- [ ] Rate Limiting: Prevent rapid-fire land claims.
