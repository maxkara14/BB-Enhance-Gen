# Player action API (version 1)

Enhance registers `globalThis.BBEnhanceGen` after its chat event handlers are ready and dispatches `bb-enhance-gen:ready` on `window`. The object is frozen and exposes `apiVersion: 1` and `generatePlayerAction(request)`.

Callers must check both the version and the method. This is an optional same-page integration; no installation, main connection switching or network discovery is performed.

## Request

| Field | Contract |
|---|---|
| `kind` | Exactly `map_travel` |
| `from`, `to` | Zone records: required nonempty string `name`; optional string `summary`, `threat_reason` and `threat_level` (`safe`, `tension`, `danger`) |
| `mapContext` | Saved scene summary, string |
| `instruction` | Optional player intention, string |
| `isCurrent` | Required synchronous function returning exactly `true` only while the source map, mode and chat remain current |
| `signal` | Optional AbortSignal for caller cancellation |

Reference fields are copied into a JSON data block before awaiting. Each string is limited to 32,000 UTF-16 code units and the serialized reference block to 60,000. Macro substitution happens before reference data is inserted. The main generation route also escapes literal macro delimiters.

## Operation

The method shares Enhance's busy lock, generation source (main/profile/Custom API), persona and story context, writing settings and Director token limit. It buffers streaming output until completion, validates narrative output, rechecks chat/map/draft/input availability, and appends prose to the exact existing draft. It never sends a chat message or updates the map. Restore-original remains available; this API does not expose automatic retry.

Success resolves to `{ status: 'applied' }`. Failures reject; the calling UI owns error presentation. Codes include `invalid_action`, `busy`, `stale_chat`, `stale_action`, `draft_changed` and the normal provider/generation errors. Cancellation uses `AbortError`. A failed request leaves the draft unchanged, including manual edits made while it was running. Provider fallback follows Enhance settings; a partial response or stale action never falls back.

The caller should cancel when its UI closes or the chat/mode changes, and must retain its `isCurrent` check until completion. Missing/unsupported API should offer the simple travel method explicitly rather than silently creating another generation request.

## Checks

`node --test tests/player-action.test.mjs` validates the request contract. The companion map repository's `tests/enhance-travel.browser.cjs` runs both extensions with controlled providers and disposable DOM fixtures, covering registration, execution, cancellation, stale state, draft preservation, undo and result handling.
