# System Layer Architecture

To prevent "hallucinations" and ensure gameplay consistency, the Game System operates on a three-tier permission model, inspired by OS kernel spaces.

## Layer 1: User Space (Intent)
- **Role**: The Player.
- **Action**: Submits an intent (e.g., "I fly to the roof", "I hack the mainframe").
- **Constraint**: None. The user can *say* anything.

## Layer 2: System Space (Validation)
- **Role**: The Judge Agent.
- **Action**: Feasibility & Rule Check (`CAPABILITY_CHECK`).
- **Logic**:
    1. **Parse Intent**: What is the user trying to do?
    2. **Capability Audit**: Does the `CharacterProfile` (Stats, Inventory, Traits) support this action?
        - *Example*: "Fly" -> Check for `Jetpack` item or `Levitation` trait.
        - *Result*: If missing, return `AUTO_FAILURE`.
    3. **Dice Roll**: Only if Capability Audit passes.
- **Output**: A Verdict (Success/Failure/Impossible).

## Layer 3: Kernel Space (Execution)
- **Role**: The Game Engine & State Store.
- **Action**: Commit state changes.
- **Constraint**: Only accepts validated Verdicts from Layer 2.
- **Logic**: Updates DB, appends Lore (Atlas), and renders the final Narrative based strictly on the Verdict.

---

## Implementation Details

### Character Profile (`src/types/game.ts`)
The `traits` array acts as the "Permissions List".
- `[]` = Standard Human capabilities.
- `['psionic_affinity']` = Allows interaction with mental anomalies.
- `['cyber_deck_mk2']` = Allows `HARD_HACK` actions.

### The Judge's Mandate
The Judge is explicitly instructed in `judge.md`:
> "如果动作不可行（例如没有翅膀却想飞行）：判定为自动失败 (Auto-Failure)，忽略 DICE_ROLL。`narrative_directives` 必须描述这种尝试的徒劳。"
