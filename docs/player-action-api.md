# Player action API (version 1)

Enhance registers `globalThis.BBEnhanceGen` after its chat event handlers are ready and dispatches `bb-enhance-gen:ready` on `window`. The frozen object exposes `apiVersion: 1`, `generatePlayerAction(request)` and, since Enhance 1.6.0, frozen `actionKinds: ['map_travel', 'rpg_ability', 'rpg_quest']`. Existing map callers remain compatible; RPG callers must check the specific advertised capability in addition to version and method.

Callers must check both the version and the method. This is an optional same-page integration; no installation, main connection switching or network discovery is performed.

## Map request

| Field | Contract |
|---|---|
| `kind` | Exactly `map_travel` |
| `from`, `to` | Zone records: required nonempty string `name`; optional string `summary`, `threat_reason` and `threat_level` (`safe`, `tension`, `danger`) |
| `mapContext` | Saved scene summary, string |
| `instruction` | Optional player intention, string |
| `isCurrent` | Required synchronous function returning exactly `true` only while the source map, mode and chat remain current |
| `signal` | Optional AbortSignal for caller cancellation |

Reference fields are copied into a JSON data block before awaiting. Each string is limited to 32,000 UTF-16 code units and the serialized reference block to 60,000. Macro substitution happens before reference data is inserted. The main generation route also escapes literal macro delimiters.

## RPG ability request (Enhance 1.6.0+)

| Field | Contract |
|---|---|
| `kind` | Exactly `rpg_ability` |
| `hero` | `name` (nonempty string, max 160), `hp` and `mp` (nonnegative safe integers); HP must be positive |
| `ability` | `name`, `owner` (nonempty, max 160), `description` (nonempty, max 4000), nonnegative safe integer `costMP`, `duration`, `cooldown`, and `mechanics` (string, max 16,000) |
| `stateContext` | Accepted current attributes/effects and equipment context, string, max 16,000 |
| `instruction` | Required nonempty player intention, max 2000 |
| `isCurrent`, `signal` | Same lifecycle contract as the map; `isCurrent` checks the source RPG scene and game revision |

Numeric fields are capped at 1,000,000,000; cost cannot exceed current MP. The serialized reference block is capped at 60,000 code units. The caller owns cooldown, inventory and ability ownership validation. Request data is copied before awaiting. The RPG template asks for an attempted player action only, respects accepted mechanics and forbids inventing hits, victory, resource changes, new powers or other characters' reactions. The narrator establishes results. No RPG state is written by Enhance.

## Quest agreement request (Enhance 1.6.0+)

`kind: 'rpg_quest'` requires `heroName` (nonempty, max 160), `quest` with nonempty `title` (max 160), `objective` and `criteria` (max 1000 each), plus string `rewardText` (max 1000) and `giver` (max 160, may be empty). `isCurrent` and optional `signal` follow the same lifecycle contract. Fields are copied before awaiting. The caller checks that the quest is offered/available; the template writes only the player's agreement to established terms, without completing objectives, granting rewards or narrating the giver's reply. The method never updates quest status; normal RPG scene processing confirms consent later.

## Operation

The method shares Enhance's busy lock, generation source (main/profile/Custom API), persona and story context, writing settings and Director token limit. It buffers streaming output until completion, validates narrative output, rechecks chat/source/draft/input availability, and appends prose to the existing draft using Enhance's narrative-space normalization. It never sends a chat message or updates the source map/RPG state. Restore-original retains the exact original draft; this API does not expose automatic retry.

Success resolves to `{ status: 'applied' }`. Failures reject; the calling UI owns error presentation. Codes include `invalid_action`, `busy`, `stale_chat`, `stale_action`, `draft_changed` and the normal provider/generation errors. Cancellation uses `AbortError`. A failed request leaves the draft unchanged, including manual edits made while it was running. Provider fallback follows Enhance settings; a partial response or stale action never falls back.

The caller should cancel when its UI closes or the chat/mode changes, and must retain its `isCurrent` check until completion. Missing/unsupported API should offer the simple travel method explicitly rather than silently creating another generation request.

## Checks

`node --test tests/player-action.test.mjs tests/player-action-generation.test.mjs` validates both request contracts and actual action execution, final insertion, cancellation, stale state, draft preservation and undo. The companion map repository also contains its earlier `tests/enhance-travel.browser.cjs` integration fixture.
