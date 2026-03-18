/**
 * Возвращает полный HTML приложения
 */
export function appTemplate() {
  return `
  <div class="layout">
    <section class="stage">
      <div class="stage__canvas" id="stage-canvas"></div>
      <div class="stage__hud">
        <div class="roll">
          <div class="roll__label">Случайное число</div>
          <div class="roll__value" id="rollValue">—</div>
          <div class="roll__sub" id="rollSub">Выберите ставку и нажмите “Ставка”</div>
        </div>
      </div>
      <div class="loading" id="loading" aria-live="polite">
        <div class="loading__card">
          <div class="loading__title">Загружаем персонажа…</div>
          <div class="loading__bar">
            <div class="loading__fill" id="loadingFill"></div>
          </div>
          <div class="loading__pct muted" id="loadingPct">0%</div>
        </div>
      </div>
      <button class="fab" id="openBets" type="button" aria-label="Открыть окно ставки">Ставка</button>
      <div class="centerResult" id="centerResult" aria-live="polite"></div>
    </section>

    <div class="drawer" id="drawer" aria-hidden="true">
      <div class="drawer__backdrop" id="drawerBackdrop"></div>
      <aside class="panel drawer__panel" role="dialog" aria-modal="true" aria-label="Ставки">
      <div class="panel__header panel__headerRow">
        <div class="balance">
          <div class="balance__label">Баланс</div>
          <div class="balance__value"><span id="balanceValue"></span> <span class="muted">₽</span></div>
        </div>
        <button class="close" id="closeBets" type="button" aria-label="Закрыть окно ставок">✕</button>
      </div>

      <div class="panel__body">
        <div class="field">
           <div class="field__label field__labelRow">
            <span>Размер ставки</span>
          </div>
          <div class="field__row">
            <input id="stake" class="input" inputmode="decimal" value="10" />
            <button class="btn btn--ghost" id="stakeMax" type="button">MAX</button>
          </div>
        </div>

        <div class="field">
          <div class="field__label field__labelRow">
            <span>Ставка на число</span>
            <button class="help" type="button" aria-label="Ставка на число" data-tooltip="tip-number">
              <span class="help__dot">?</span>
            </button>
            <div class="tooltip" role="tooltip" data-tooltip-body="tip-number">
              <div class="tooltip__title">Коэффициенты</div>
              <div class="tooltip__text">
                Правильное число: <b>x5</b><br />
              </div>
            </div>
          </div>
          <div class="grid" id="numberGrid"></div>
        </div>

        <div class="field">
          <div class="field__label field__labelRow">
            <span>Больше/меньше</span>
            <button class="help" type="button" aria-label="Больше/меньше" data-tooltip="tip-hl">
              <span class="help__dot">?</span>
            </button>
            <div class="tooltip" role="tooltip" data-tooltip-body="tip-hl">
              <div class="tooltip__title">Коэффициенты</div>
              <div class="tooltip__text">
                Больше/меньше: <b>x1.5</b><br />
                <div class="field__hint muted">Число 5 не выигрывает</div>
              </div>
            </div>
          </div>
          <div class="row">
            <button class="chip" id="betLt5" type="button">&lt; 5</button>
            <button class="chip" id="betGt5" type="button">&gt; 5</button>
          </div>
        </div>

        <div class="field">
          <div class="field__label field__labelRow">
            <span>Дополнительные ставки</span>
            <button class="help" type="button" aria-label="Коэффициенты" data-tooltip="tip-extra">
              <span class="help__dot">?</span>
            </button>
            <div class="tooltip" role="tooltip" data-tooltip-body="tip-extra">
              <div class="tooltip__title">Коэффициенты</div>
              <div class="tooltip__text">
                Чёт/неч: <b>x1.5</b><br />
                Простое (2,3,5,7): <b>x2</b><br />
                Диапазон: чем меньше чисел, тем выше x
              </div>
            </div>
          </div>
          <div class="grid grid--2">
            <button class="chip" id="betEven" type="button">Чётное</button>
            <button class="chip" id="betOdd" type="button">Нечётное</button>
            <button class="chip" id="betPrime" type="button">Простое</button>
          </div>

          <div class="rangeBet" id="rangeBet">
            <div class="rangeBet__top">
              <div class="rangeBet__title">Диапазон</div>
              <div class="rangeBet__coef muted">Коэф.: <span id="rangeCoef">x—</span></div>
            </div>
            <div class="rangeBet__row">
              <label class="rangeBet__label">
                От
                <select class="select" id="rangeFrom"></select>
              </label>
              <label class="rangeBet__label">
                До
                <select class="select" id="rangeTo"></select>
              </label>
              <button class="chip rangeBet__pick" id="betRange" type="button">Выбрать</button>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn--primary" id="placeBet" type="button">Ставка</button>
          <button class="btn" id="reset" type="button">Сброс</button>
        </div>

        <div class="result" id="result"></div>
      </div>
      </aside>
    </div>
  </div>
`
}

