# BB Enhance Generation — 1.4.7

[Русский](#русский) · [English](#english) · [README](README.md)

## Русский

Итоговые изменения **1.4.7 относительно 1.1.4 из main**.

База сравнения проверена 2026-09-13: `main`, коммит
[`ba81e79`](https://github.com/maxkara14/BB-Enhance-Gen/commit/ba81e79).
Версия 1.4.7 пока находится в **`enhance-test`**; этот текст описывает готовое
обновление, а не состоявшееся слияние в основную ветку.

### 🎨 Обновлённый интерфейс

- Панель, настройки, переходы и кубик приведены к общему полупрозрачному чёрному оформлению с красными акцентами.
- Кнопки больше не дёргаются в сторону при наведении и нажатии.
- Боковое меню событий учитывает границы экрана; поле собственного указания не создаёт горизонтальную прокрутку.
- Настройки используют стандартный блок SillyTavern, поддерживают Extension-Sorter и сохраняют положение при смене языка.
- Окна получили единое закрытие, управление с клавиатуры и возврат фокуса. Активная генерация и остановка обозначаются отдельно.

### ✍️ Больше контроля над текстом

- Enhance и Improve показывают оригинал и результат в редакторе: можно исправить текст, повторить генерацию или применить его.
- Добавлен возврат оригинального черновика с защитой последующих ручных правок.
- Настраиваются расширение ×1.5/×2/×3, сохранение реплик, лицо повествования и язык результата.
- «Своё» в Event Director сразу предлагает «Мне» и «Боту», без промежуточного шага «Далее».
- Director «Мне» продолжает писать прямо в поле чата; улучшены отмена, потоковый вывод и сохранение указания для повторного запуска.
- Инструкция для «Своё → Мне» требует разыграть заданные действия, а не считать их уже случившимися.
- Основная модель получает отдельный служебный запрос через raw API: результат извлекается до regex-обработки сообщений бота. Очевидные технические блоки не применяются как художественный текст.

### 🔌 Подключения и контекст

- Добавлены **профили Connection Manager**: модель, пресет и instruct выбранного профиля используются без смены активного подключения чата.
- Потоковый вывод доступен и для профилей. Поддержка Custom API расширена текстовыми блоками и дополнительными формами ответа.
- Добавлены глубина и бюджет контекста, общая сборка персоны, описания персонажа, сценария, Author’s Note, Summary и последних сообщений.
- Добавлены интенсивность событий и выбор типа Tension: романтическое, конфликтное или тревожное, с пояснениями в настройках.

### 📍 Переходы между сценами

- Варианты Fast Travel и Time Skip можно редактировать: место/глава, время и направление сцены.
- Доступны повторный запрос вариантов и собственный переход.
- Если модель рекомендует остаться, окно объясняет причину и разделяет повторную оценку и ручное авторское решение.
- Ответ проверяется до применения; неверные или неполные варианты не отправляются в чат.
- Анализаторы через Custom API получают полный JSON без стриминга; настройка потокового вывода прозы сохранена.

### 🎲 Броски и история

- Вместо прежнего куба отображается геометрический d20 с двадцатью треугольными гранями и анимацией вращения.
- Вопрос для броска можно задать вручную без служебного запроса модели; анимацию можно пропустить.
- История разделена по чатам. Очистка затрагивает только текущий чат.
- Старый общий журнал убран из интерфейса; сохранённые ранее данные не удаляются.

### 🛠️ Надёжность и язык

- Добавлены отмена и тайм-аут операций, защита черновика от позднего ответа и привязка результатов к исходному чату.
- Уточнена обработка пустых, оборванных и ограниченных ответов, рассуждений без итогового текста и HTTP-ошибок.
- Явная блокировка отображается как **«Провайдер заблокировал запрос»**; автоматический переход на другую модель при такой ошибке не выполняется.
- Диагностика Custom API показывает безопасные сведения о форме ответа, без переписки и ключей.
- К автоматическому RU/EN добавлен ручной выбор языка интерфейса; локализованы дополнительные кнопки и окна. Язык результата задаётся отдельно.
- README доступен на русском и английском.

### Что важно после обновления

Шесть основных инструментов, Custom API, RU/EN по языку браузера, отдельные лимиты
ответа и выбор сложности кубика **уже были в 1.1.4**. Обновление развивает их,
а не добавляет заново.

Основная модель теперь используется через raw API: обычная полная сборка чата
с World Info не подключается автоматически к служебному запросу. Профиль и
Custom API могут давать разные результаты из-за различий запросов и параметров.

Блокировка Gemini `prompt_blocked / PROHIBITED_CONTENT` на конкретном прокси
подтверждена ответом сервера. Универсальное устранение блокировки не заявляется.

Проверки: **14 unit-тестов, 56 браузерных сценариев** на изолированном стенде.
Это не гарантия совместимости со всеми моделями, прокси и сторонними расширениями.

## English

Final changes in **1.4.7 compared with 1.1.4 on main**.

Baseline checked on 2026-09-13: `main`, commit
[`ba81e79`](https://github.com/maxkara14/BB-Enhance-Gen/commit/ba81e79).
Version 1.4.7 is still on **`enhance-test`**. These notes describe the completed
update, not a merge into the default branch.

### 🎨 Updated interface

- The panel, settings, transitions and die share translucent black styling with red accents.
- Buttons no longer shift sideways on hover or press.
- The sideways event menu stays within the screen; custom input no longer introduces horizontal scrolling.
- Settings use the standard SillyTavern drawer, support Extension-Sorter and retain their position when changing languages.
- Dialogs share close controls, keyboard navigation and focus restoration. Generation and stopping have distinct indicators.

### ✍️ More control over writing

- Enhance and Improve show the original and result in an editor: edit, retry or apply.
- Original-draft restoration protects subsequent manual edits.
- Configurable ×1.5/×2/×3 expansion, dialogue preservation, narrative person and output language.
- Custom in Event Director offers “To me” and “To bot” immediately, without the intermediate Next step.
- Director “To me” still writes into the chat input, with improved cancellation, streaming and direction retention for another run.
- Custom directions instruct the model to depict the requested actions rather than treat them as already completed.
- Main-model utility generation uses the raw API before assistant-message regex processing. Obvious technical output is rejected as narrative.

### 🔌 Connections and context

- Added **Connection Manager profiles**, including their model, preset and instruct settings, without changing the active chat connection.
- Streaming now supports profiles. Custom API accepts text blocks and additional response variants.
- Added context depth and budget, with shared assembly of persona, character description, scenario, Author’s Note, Summary and recent messages.
- Added event intensity and romantic, conflict or anxious Tension types with explanatory settings text.

### 📍 Scene transitions

- Edit Fast Travel and Time Skip options: destination/chapter, time and scene direction.
- Request new options or write your own transition.
- When the model recommends staying, the dialog explains why and separates reassessment from a manual author override.
- Responses are validated before applying; invalid or incomplete options are not sent to chat.
- Custom API analyzers request complete JSON without streaming; prose streaming remains configurable.

### 🎲 Rolls and history

- A geometric d20 with twenty triangular faces and rotation replaces the previous cube.
- Enter a roll question manually without a utility model request; skip the animation if desired.
- History is scoped to each chat, and clearing it affects only that chat.
- The old shared journal is removed from the interface; previously stored data is not deleted.

### 🛠️ Reliability and language

- Added cancellation and timeouts, draft protection against late responses, and binding results to their original chat.
- Clearer handling of empty, interrupted, length-limited, reasoning-only and HTTP error responses.
- Explicit blocks display **“The provider blocked the request”** without automatically switching models.
- Custom API diagnostics report safe response-shape information without chat text or keys.
- Manual UI language selection supplements automatic RU/EN. Additional buttons and dialogs are localized; output language is separate.
- Russian and English README pages.

### Before updating

The six main tools, Custom API, browser-based RU/EN, per-task response limits and
die difficulty selection **already existed in 1.1.4**. This update improves them.

Main-model utility requests now use the raw API rather than the regular full
chat assembly with World Info. Profiles and Custom API may behave differently
because their requests and parameters differ.

A Gemini `prompt_blocked / PROHIBITED_CONTENT` response was confirmed on a
specific proxy. This update does not claim to eliminate provider blocking.

Validation: **14 unit tests and 56 browser scenarios** in an isolated harness,
not a guarantee of compatibility with every model, proxy or third-party extension.
