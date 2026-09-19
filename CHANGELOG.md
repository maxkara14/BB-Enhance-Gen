# BB Enhance Generation — обновления / changelog

[Русский](#русский) · [English](#english)

## Русский

### Микрообновление — 19 сентября 2026 (без изменения версии)

- Блок «Модель для генерации» теперь свёрнут по умолчанию, как и остальные блоки настроек.

### 1.5.0 — 14 сентября 2026

- Добавлены свои кнопки обработки черновика: название, иконка и текстовая инструкция. До 20 кнопок в меню E; доступны изменение, отключение и удаление.
- Инструкции Enhance и Improve можно редактировать в настройках и возвращать к стандартным. Полный шаблон промпта редактировать не нужно; контекст добавляется автоматически.
- Свои кнопки используют общее подключение, лимит ответа Enhance / Improve, потоковый вывод, отмену, повтор и возврат оригинала. Результат остаётся в поле ввода и не отправляется автоматически.
- Повтор сохраняет исходные черновик и инструкцию; ручные правки и смена чата защищены от поздних ответов. Язык, лицо повествования и сохранение реплик из настроек имеют приоритет; множитель длины действует только для Enhance.
- Иконки принимают цифры, символы и эмодзи без букв, пробелов и переносов строк. Добавлены интерфейс и справка на русском и английском.
- Сохранён мобильный CSS-фикс версии 1.4.9.

### 1.4.9 — 14 сентября 2026

- Исправлено смещение и масштабирование интерфейса с появлением пустых чёрных областей в некоторых мобильных браузерах. Закрытое подменю Director больше не расширяет границы страницы.

### 1.4.8 — 13 сентября 2026

- Enhance и Improve работают прямо в поле чата, как Director «Мне», без отдельного окна и применения результата.
- «Повторить» и «Вернуть оригинал» находятся в панели E; во время генерации доступна «Отменить».
- Повтор использует исходный черновик. Отмена повтора восстанавливает предыдущий вариант; ручные правки защищены от перезаписи.
- Сохранены потоковый вывод, обработка ошибок и защита при переключении чата.

### 1.4.7 — 13 сентября 2026

Что изменилось по сравнению с **1.1.4**:

**Интерфейс**
- Общее полупрозрачное чёрное оформление с красными акцентами для панели, настроек и окон.
- Кнопки без боковых сдвигов, адаптивное меню событий и поле «Своё» без горизонтальной прокрутки.
- Стандартный блок настроек для Extension-Sorter, клавиатурная навигация и понятная индикация генерации и остановки.

**Текст и события**
- Редактор оригинала и результата для Enhance/Improve: правка, повторная генерация, применение и возврат исходного черновика.
- Выбор расширения ×1.5/×2/×3, сохранения реплик, лица повествования и языка результата.
- «Своё» сразу предлагает «Мне» и «Боту», без шага «Далее». Director «Мне» пишет прямо в поле чата.
- Улучшена обработка авторского указания, добавлены интенсивность событий и тип напряжения с пояснениями.
- Отдельная генерация основной моделью до regex-обработки сообщений бота; очевидный технический вывод не применяется как художественный текст.

**Подключения**
- Профили Connection Manager с моделью, пресетом и instruct без переключения активного подключения.
- Потоковый вывод профилей, расширенная поддержка форматов ответа Custom API.
- Настраиваемая глубина и бюджет контекста.

**Переходы и d20**
- Редактирование вариантов Fast Travel / Time Skip, повторный запрос и собственный переход с авторским подтверждением.
- Проверка вариантов до отправки в чат; понятное объяснение рекомендации остаться в сцене.
- Геометрический d20 с вращением и пропуском анимации; ручной вопрос без обращения к модели.
- История бросков отдельно для каждого чата. Старый общий журнал убран из интерфейса без удаления сохранённых данных.

**Надёжность и язык**
- Отмена, тайм-аут и защита черновика от поздних ответов, переключения чата и перезаписи ручных правок.
- Понятные сообщения о пустом ответе, рассуждениях без результата, неверном формате и блокировке провайдером.
- Ручной выбор языка интерфейса, расширенная локализация RU/EN, README на двух языках.

**Важно**
- Служебные запросы основной модели теперь используют raw API: полная обычная сборка чата с World Info не подключается автоматически.
- Анализаторы Fast Travel / Time Skip через Custom API получают JSON целиком; стриминг художественного текста сохранён.
- Блокировка запроса провайдером не снимается расширением. При явном `prompt_blocked` показывается причина без автоматического перехода на другую модель.

## English

### Minor update — September 19, 2026 (no version change)

- The “Generation model” section is now collapsed by default, like the other settings sections.

### 1.5.0 — September 14, 2026

- Added custom draft-processing buttons with a name, icon and plain-text instruction. Up to 20 buttons appear in the E menu and can be edited, disabled or deleted.
- Enhance and Improve instructions can be edited in settings and restored to their defaults. No full prompt template is required; context is added automatically.
- Custom buttons use the shared connection, Enhance / Improve response limit, streaming, Cancel, Retry and Restore original. Results stay in the chat input and are not sent automatically.
- Retry retains the original draft and instruction; manual edits and chat changes are protected against late responses. Language, narrative person and dialogue-preservation settings take priority; the length multiplier applies only to Enhance.
- Icons accept numbers, symbols and emoji without letters, spaces or line breaks. Added Russian and English controls and help text.
- Includes the mobile CSS fix from 1.4.9.

### 1.4.9 — September 14, 2026

- Fixed interface shifting and scaling with empty black areas in some mobile browsers. The closed Director submenu no longer expands the page bounds.

### 1.4.8 — September 13, 2026

- Enhance and Improve work directly in the chat input, like Director “To me”, without a separate window or Apply step.
- Retry and Restore original are in the E panel; Cancel is available during generation.
- Retry uses the original draft. Cancelling a retry restores the previous version; manual edits are protected against overwriting.
- Streaming, error handling and chat-switch protection are preserved.

### 1.4.7 — September 13, 2026

Changes compared with **1.1.4**:

**Interface**
- Shared translucent black styling with red accents across the panel, settings and dialogs.
- Buttons no longer shift sideways; the event menu fits the screen and Custom input avoids horizontal scrolling.
- Standard settings drawer for Extension-Sorter, keyboard navigation and clear generation/stopping indicators.

**Writing and events**
- Original/result editor for Enhance and Improve: edit, retry, apply and restore the original draft.
- Configurable ×1.5/×2/×3 expansion, dialogue preservation, narrative person and output language.
- Custom offers “To me” and “To bot” immediately, without Next. Director “To me” writes directly into the chat input.
- Improved handling of author directions; configurable event intensity and tension type with explanations.
- Separate main-model generation before assistant-message regex processing; obvious technical output is rejected as narrative.

**Connections**
- Connection Manager profiles with their model, preset and instruct settings, without switching the active connection.
- Profile streaming and broader Custom API response-format support.
- Configurable context depth and budget.

**Transitions and d20**
- Editable Fast Travel / Time Skip options, refreshed suggestions and custom transitions with author confirmation.
- Options validated before sending; clear explanations when the model recommends staying in the scene.
- A geometric, rotating d20 with animation skipping and manually entered questions without a model call.
- Per-chat roll history. The old shared journal is removed from the interface without deleting stored data.

**Reliability and language**
- Cancellation, timeouts and draft protection against late responses, chat changes and overwriting manual edits.
- Clear errors for empty, reasoning-only, malformed and provider-blocked responses.
- Manual UI language selection, expanded RU/EN localization and bilingual documentation.

**Important**
- Main-model utility requests now use the raw API; regular full chat assembly with World Info is not included automatically.
- Custom API Fast Travel / Time Skip analyzers request complete JSON; prose streaming is preserved.
- The extension does not remove provider blocking. Explicit `prompt_blocked` responses are explained without automatically switching models.
