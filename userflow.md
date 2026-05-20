# User Flow - The Hex Box

## 1. Authentication & Entry
- **First-Time / Returning User**:
    - On landing, the user is presented with a **Sign-Up/Login Screen**.
    - User enters a **Unique Name** and **Password**.
    - The system authenticates via Firebase. If the user is new, a profile is created with an initial gold balance and a randomly assigned **User Color**.
    - Authentication state is persisted to allow quick re-entry.

## 2. Landing & Navigation
- **The World**: 
    - The user enters a vast, blank hexagonal canvas.
    - The player is not represented by a tile, but by their **Live Mouse Cursor**.
    - **Real-time Presence**: Other active players' cursors are visible on the map, synced via Firebase RTDB, allowing for social observation and "staking out" land.

## 3. Land Acquisition Flow
- **Selection Phase**:
    - **Shift + Click**: The user holds the `Shift` key and clicks a hexagon to highlight it for purchase.
    - **Shift + Drag**: The user holds `Shift` and drags the cursor across multiple hexagons to select a contiguous or custom area.
    - **Visual Feedback**: Selected hexagons glow or change opacity to indicate they are "queued" for purchase.
- **Purchase Phase**:
    - A **"Buy Land"** button appears/activates once at least one tile is selected.
    - **Dynamic Cost Calculation**: 
        - `Total Cost = (Number of Selected Hexes) * (Current Economic Price per Hex)`.
        - The "Price per Hex" fluctuates based on the global economy (e.g., total land claimed vs. available space).
    - User clicks "Buy Land" $\rightarrow$ Gold is deducted $\rightarrow$ Transaction is validated and saved to Firebase.

## 4. Ownership & Visualization
- **Post-Purchase**:
    - The purchased hexagons are immediately filled with the user's **Assigned Color**.
    - Land data is stored in `game_state/land/{x}-{y}` containing the `ownerId`, `ownerName`, and `color`.
- **Observation**:
    - When any player hovers their cursor over a colored hexagon, a **Tooltip/Label** appears showing:
        - **Owner Name** (e.g., "Owned by Luna")
        - **Color Name** (e.g., "Neon Cyan")

## 5. Economic Cycle
- **Growth**: Owners of land generate passive gold income over time.
- **Expansion**: Gold is reinvested to buy more land or build fortifications (walls).
- **Conflict**: High-value areas become targets for buy-outs or territorial wars.
