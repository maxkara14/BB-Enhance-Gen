# 🎬 BB Enhance Generation

[Русский](README.md) · **English** · [Changelog](CHANGELOG.md#english)

A **SillyTavern** panel for writing your character’s turns, editing drafts, directing events, rolling a d20 and moving between scenes. Open it with **E** next to the chat input.

**Version 1.4.8**

## ✨ Features

| Tool | What it does |
|---|---|
| ✨ **Enhance** | Expands a draft with details; ×1.5, ×2 and ×3 options |
| 🔮 **Improve** | Polishes wording, rhythm and repetition without intentionally advancing the plot |
| 🎬 **Event Director** | Introduces disaster, blessing, tension, absurdity, tragedy or your own direction |
| 🎲 **Action Roll** | Rolls an animated d20 and passes the outcome to the main model for roleplay |
| 📍 **Fast Travel** | Suggests three destinations with reasons to visit and travel times |
| ⏩ **Time Skip** | Suggests three time skips and directions for the next scene |
| ↩️ **Restore original** | Restores the latest applied draft until you edit it or switch chats |

Translucent black panels, red accents, a sideways event menu and layouts that fit smaller screens. Settings use the standard extension drawer and support Extension-Sorter.

## 📦 Installation

1. Open **Extensions → Install extension** in SillyTavern.
2. Paste `https://github.com/maxkara14/BB-Enhance-Gen`.
3. Reload, open **BB Enhance Generation** in extension settings and choose a generation source.
4. Press **E** in your chat.

If the old interface remains after updating, hard-refresh the page — **Ctrl+F5** on Windows.

## 🚀 Quick start

### Edit a draft

Write in the chat input and press **Enhance** or **Improve**. The result appears directly in that field, without a separate window or Apply step. It is not automatically sent.

Use **Cancel** during generation. Afterwards, **Retry** and **Restore original** appear in the E panel. Retry generates another version from the original draft; cancelling a retry restores the previous version. Restore original brings back the text before processing. Manual edits are protected: retry and restore report a changed draft rather than overwrite it. Press Enhance or Improve again to process your edited text.

Settings control dialogue preservation, narrative person, expansion and output language. These are model instructions, not guarantees of exact length or verbatim preservation.

### Write your character’s turn

Open **Event Director → Custom**, describe the actions you want, then choose **To me**. The result goes directly into the normal chat input. For example: “Walk to the table, thank the host and ask about the road.”

**To bot** passes your direction to the main model and starts its reply instead of writing a player draft. Event intensity is configurable. Tension type — romantic, conflict or anxious — applies only to **Tension**. Your explicit direction takes priority in Custom.

### Move to another scene

Press **Fast Travel** or **Time Skip**. If a transition is appropriate, the model suggests three cards. Select one, optionally expand **Edit or write your own**, then apply it.

If the model recommends staying in the scene:

- **Check again** asks the model to reassess; it may decline again.
- **Write my own transition** opens three required fields and an author override checkbox. The checkbox does not generate options.

A recommendation to stay in the scene differs from a provider blocking the request. A blocked request provides no options.

### Roll a d20

Press **Action Roll**. Let the model suggest a question or enter one manually. Difficulties: Easy (DC 8), Normal (DC 12), Hard (DC 16), Epic (DC 20), Random (DC 10–16). Use the default or choose before each roll.

**Continue** records the outcome and passes it on for roleplay. History keeps the latest 10 rolls for the current chat; clearing it does not affect other chats.

## 🔌 Connections

| Source | How it is used |
|---|---|
| **Current SillyTavern connection** | Main model with extension-built context; the raw API returns text before assistant-message regex processing |
| **SillyTavern connection profile** | Connection Manager profile with its model, preset and instruct settings; the active chat connection stays unchanged |
| **Custom API** | Separate OpenAI-compatible URL, key and model; requests are sent from the browser |

The selected source handles Enhance, Improve, Director “To me”, transition analysis and roll questions. **To bot** replies and roleplay of outcomes use the main chat connection.

For Custom API, enter a base URL such as `https://example.com/v1`; the extension appends `/chat/completions`. Refresh the model list or type a model name manually. The server must allow browser requests (CORS).

Profiles and Custom API need not produce identical results: request assembly and parameters differ. Compatibility with a particular proxy depends on its API.

## ⚙️ Language and controls

- **Interface language:** browser language, Russian or English. Automatic mode selects Russian for a Russian browser locale, English otherwise.
- **Output language:** separately configured to match the draft/chat, Russian or English. Switching the interface does not translate existing chats, your directions or profile names.
- **Streaming:** profiles and Custom API stream Enhance, Improve and Director “To me” into the chat input. The main connection returns completed text. FT/TS through Custom API always receive complete JSON without streaming.
- **Cancellation:** Cancel stops the operation. Failure or cancellation restores the text from before the request while preserving manual edits made during generation. Switching chats cancels the operation.
- **Bot cue preview:** optionally inspect the direction before sending it.
- **Visibility:** each of the six main tools can be hidden in settings.

### Response limits

| Task | Default tokens |
|---|---:|
| Director → To me | 5000 |
| Enhance / Improve | 1500 |
| Fast Travel / Time Skip | 2000 |
| Action Roll question | 500 |

`0` omits the limit; provider limits still apply. Positive values are clamped to 64–8000. Timeout: 15–600 seconds, default 120.

### Context

The shared builder includes the player persona, character description, scenario, available Author’s Note and Summary, recent non-system messages and your draft as an intention. Defaults: 8 messages and 16000 characters; settings allow 1–40 messages and 4000–60000 characters. Descriptions can use up to half the budget; the draft and task instructions are counted separately.

Fast Travel and Time Skip use the same context builder with different instructions. These utility requests do not invoke full regular chat assembly with World Info. Profiles additionally use their preset and instruct settings.

Technical blocks are removed from context; obvious technical output is rejected as narrative. Universal cleanup of every third-party format is not guaranteed.

## 🛠️ Troubleshooting

| Message | Meaning |
|---|---|
| **The provider blocked the request** | Explicit `prompt_blocked`; no automatic switch to another model |
| **The model returned no text** | No final text was extracted; Custom API provides a safe `Response diagnostic` console line |
| **Reasoning only, without a final answer** | Check the operation’s token limit and connection reasoning settings |
| **Invalid options format** | The response does not match the transition schema; incomplete options are not sent |
| **HTTP 400 / another HTTP error** | The server rejected the request; its response contains the reason |
| **Unavailable profile** | Check Connection Manager and refresh the profile list |

The Custom API key is stored in plain text in SillyTavern settings. Do not publish settings dumps or Authorization headers. The extension’s own diagnostic logs do not contain keys, chat text or full provider replies.

## Updates

Updates: **[CHANGELOG.md](CHANGELOG.md#english)**.

Author: **BruniikBron** · [Lo-Fi & Mods](https://bblofi.online/) · [Telegram](https://t.me/Brun11kBr0n)
