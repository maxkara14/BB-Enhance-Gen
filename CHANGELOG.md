# История изменений · Changelog

[Русский](#русский) · [English](#english) · [README](README.md)

## Русский

Изменения ниже доступны в **`enhance-test`**. Это журнал разработки тестовой версии, а не объявление о переносе в основную ветку. Старые релизы здесь не реконструируются полностью.

### Документация — без изменения версии расширения

- Русский README и отдельный English README с переключением языка.
- Инструкции приведены к текущему поведению; удалено устаревшее описание `generateQuietPrompt`.
- Подробности обновлений перенесены из README в этот журнал.

### Что нового в текущей тестовой ветке

- Выбор основного подключения, профиля Connection Manager или Custom API.
- Event Director «Своё → Мне» пишет прямо в поле чата, без отдельного окна результата. Enhance/Improve сохраняют редактор с оригиналом.
- Потоковый вывод через профили и Custom API, отмена с сохранением ручных правок черновика.
- Стандартный блок настроек для Extension-Sorter и боковое меню событий.
- История бросков отдельно для каждого чата, редактируемые переходы и явное авторское подтверждение.
- Русский и английский интерфейс, отдельно настраиваемый язык результата.

### 1.4.7 — Понятная блокировка запроса

- Явный `prompt_blocked` отображается как «Провайдер заблокировал запрос».
- Блокировка распознаётся в HTTP-ошибках Custom API, JSON/SSE и сыром ответе основного подключения.
- После блокировки нет автоматического fallback на основную модель. Сырой текст ошибки не выводится.

### 1.4.6 — Полный ответ для анализа переходов

- Fast Travel / Time Skip через Custom API получают полный JSON без стриминга.
- Стриминг художественного текста сохранён. Это изменение режима запроса, а не устранение фильтрации провайдера.

### 1.4.5 — Диагностика пустого ответа

- Строка `Response diagnostic` показывает HTTP-статус, режим потока, лимит и безопасные счётчики ответа.
- В ней нет текста чата, рассуждений, адресов или ключей.

### 1.4.4 — Формы ответа Custom API

- Поддержаны текстовые блоки и `choices[0].text`, включая SSE.
- Custom API различает пустой ответ и отдельные рассуждения без итогового текста.

### 1.4.3 — Диагностика профилей

- Профиль подключения отдельно сообщает об ответе только с рассуждениями, со стримингом и без него.
- Рассуждения не подставляются вместо результата.

### 1.4.2 — Примеры JSON

- Примеры FT/TS содержат три полных варианта, как требует проверка формата, и отдельный пример отказа.

### 1.4.1 — Понятный отказ при переходе

- Причина отказа отделена от ручного редактора.
- «Проверить ещё раз» повторяет анализ; «Задать свой переход» раскрывает поля и подтверждение.

### 1.4.0 — Общее оформление и d20

- Единый полупрозрачный чёрный стиль с красными акцентами для панели, настроек и окон.
- Кнопки не сдвигаются при нажатии; окна закрываются крестиком в заголовке.
- Геометрический двадцатигранник с анимацией вращения, пропуском анимации и поддержкой reduced motion.
- Компактный редактор переходов и подсветка выбранной карточки.

### Известное ограничение

На одном из пользовательских прокси Gemini запрос Fast Travel получил `prompt_blocked / PROHIBITED_CONTENT`, хотя Time Skip и запрос через профиль проходили. Подтверждена блокировка конкретного запроса; точное различие, вызвавшее её, не установлено. Обновления диагностики и формата ответа не заявляются как устранение этой блокировки.

## English

The changes below are available on **`enhance-test`**. This is a test-branch development log, not an announcement of a merge into the default branch. It does not reconstruct the full older release history.

### Documentation — extension version unchanged

- Russian and English README pages with language links.
- Instructions updated to match current behavior; obsolete `generateQuietPrompt` documentation removed.
- Detailed update notes moved from the README into this changelog.

### Highlights of the current test branch

- Choose the main connection, a Connection Manager profile or Custom API.
- Event Director “Custom → To me” writes directly into the chat input. Enhance/Improve retain the editor with the original draft.
- Streaming through profiles and Custom API, with cancellation that preserves manual draft edits.
- A standard settings drawer for Extension-Sorter and a sideways event menu.
- Per-chat roll history, editable transitions and explicit author overrides.
- Russian and English UI with a separate output-language setting.

### 1.4.7 — Clear blocked-request message

- Explicit `prompt_blocked` displays “The provider blocked the request.”
- Recognized in Custom API HTTP errors, JSON/SSE and raw main-connection responses.
- No automatic fallback to the main model after a block. Raw provider error text is not displayed.

### 1.4.6 — Complete transition analysis responses

- Fast Travel / Time Skip through Custom API request complete JSON without streaming.
- Prose streaming is preserved. This changes the request mode; it does not remove provider filtering.

### 1.4.5 — Empty-response diagnostics

- `Response diagnostic` reports HTTP status, streaming mode, token limit and safe response counters.
- It contains no chat text, reasoning text, addresses or keys.

### 1.4.4 — Custom API response variants

- Text blocks and `choices[0].text` are supported, including SSE.
- Custom API distinguishes empty responses from separate reasoning without final text.

### 1.4.3 — Profile diagnostics

- Connection profiles report reasoning-only responses separately, with and without streaming.
- Reasoning is not used as the final answer.

### 1.4.2 — JSON examples

- FT/TS examples contain three complete options to match validation, plus a separate denial example.

### 1.4.1 — Clear transition denials

- The denial reason is separate from the manual editor.
- “Check again” repeats analysis; “Write my own transition” reveals fields and confirmation.

### 1.4.0 — Shared design and d20

- Translucent black styling with red accents across the panel, settings and dialogs.
- Buttons no longer shift when pressed; dialogs have header close buttons.
- A geometric twenty-sided die with rotation, animation skipping and reduced-motion support.
- Compact transition editors and selected-card highlighting.

### Known limitation

On a user’s Gemini proxy, Fast Travel received `prompt_blocked / PROHIBITED_CONTENT` while Time Skip and the profile route worked. The specific request was blocked; the exact difference responsible has not been established. Diagnostics and response-format updates are not claimed to resolve that block.
