import "./style.css";

declare global {
  /**
   * elements with id attributes create global variables of the same name
   * @see ../index.html
   */
  var m: HTMLElementTagNameMap["main"];
  var c: HTMLElementTagNameMap["canvas"];
  var a: HTMLElementTagNameMap["aside"];
  var p: HTMLElementTagNameMap["pre"];

  /**
   * override the global EventTarget signature to only accept function event
   * listeners of named / known events (simplifies typing)
   */
  interface Listener<T extends keyof DocumentEventMap> {
    (event: DocumentEventMap[T]): void;
  }

  interface EventTarget {
    addEventListener<T extends keyof DocumentEventMap>(
      type: T,
      callback: Listener<T> | null,
      options?: AddEventListenerOptions | boolean,
    ): void;
    removeEventListener<T extends keyof DocumentEventMap>(
      type: T,
      callback: Listener<T> | null,
      options?: EventListenerOptions | boolean,
    ): void;
  }
}

type State = {
  pts: {
    [key: number]: {
      x: number;
      y: number;
      d: boolean;
    };
  };
  btn: {
    p: number;
    x: number;
    y: number;
    d: boolean;
  };
};

const w = window,
  { performance: perf } = w,
  raf = w.requestAnimationFrame,
  // caf = w.cancelAnimationFrame,
  { atan2, cos, hypot, max, min, PI: π, /* round, */ sign, sin } = Math,
  clamp = (low: number, high: number, val: number) => min(max(low, val), high),
  pos = (n: number) => sign(n) === 1,
  ππ = π * 2,
  { entries } = Object,
  ctx = c.getContext("2d")!,
  on = <T extends keyof DocumentEventMap>(
    target: EventTarget,
    eventType: T,
    listener: Listener<T> | null,
    options?: AddEventListenerOptions | boolean,
  ) => target.addEventListener(eventType, listener, options),
  onResize = () => {
    // TODO: does changing screens count as a resize?
    ({ innerWidth: iw, innerHeight: ih, devicePixelRatio: dpr = 1 } = w);

    c.width = cw = iw * dpr;
    c.height = ch = ih * dpr;
    hw = cw / 2;
    hh = ch / 2;
  },
  /* trimLines = (lines: string) =>
    lines
      .split("\n")
      .reduce(
        (acc, l) =>
          // any non-whitespace character?
          /\S/.test(l)
            ? // trim & keep
              (acc.push(l.trim()), acc)
            : // discard
              acc,
        [],
      )
      .join("\n"), */
  circ = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) =>
    ctx.ellipse(x, y, r, r, 0, 0, ππ),
  state: State = {
    pts: {},
    btn: {
      p: 0,
      x: 0,
      y: 0,
      d: false,
    },
  },
  // onClick = () => (frameId === -1 ? raf(tick) : (caf(frameId), (frameId = -1))),
  onPointerDownMove = (e: PointerEvent) => {
    const x = e.x * dpr,
      y = e.y * dpr,
      d = state.pts[e.pointerId] === undefined,
      bx = hw,
      by = hh * 1.6,
      bri = cw * 0.08,
      bro = bri * 1.6,
      h = hypot(x - bx, y - by);

    state.pts[e.pointerId] = { x, y, d };

    state.btn.p = e.pointerId;
    if (d && h < bro) {
      state.btn.x = state.pts[e.pointerId].x;
      state.btn.y = state.pts[e.pointerId].y;
    }
  },
  onPointerUp = (e: PointerEvent) => {
    delete state.pts[e.pointerId];
    state.btn.p = 0;
    state.btn.x = 0;
    state.btn.y = 0;
    state.btn.d = false;
  },
  goldTime = 1_000 / 60,
  initTime = perf.now(),
  tick = (now: DOMHighResTimeStamp) => {
    /* frameId = */ raf(tick);

    prevTime = currTime;
    currTime = now;

    diffTime = currTime - prevTime;
    overTime += diffTime;

    while (overTime > goldTime) {
      overTime -= goldTime;
      draw(1);
    }

    // FIXME: this doesn't seem right
    draw((overTime - goldTime) / goldTime);
  },
  draw = (_pct?: number) => {
    const hue = (sin(currTime / 5_000) + 1) * 180,
      bx = hw,
      by = hh * 1.6,
      bri = cw * 0.08,
      bro = bri * 1.6;

    entries(state.pts).forEach(([id, { x, y, d }]) => {
      const h = hypot(x - bx, y - by);
      if (!(d && h < bro)) return;
      state.btn.p = Number(id);
      state.btn.x = x;
      state.btn.y = y;
      state.btn.d = h < bro;
    });

    const tx = state.btn.d ? state.pts[state.btn.p].x - state.btn.x : 0,
      ty = state.btn.d ? state.pts[state.btn.p].y - state.btn.y : 0,
      ta = atan2(ty, tx),
      tax = cos(ta) * (bro - 5),
      tay = sin(ta) * (bro - 5),
      rtx = clamp(pos(tax) ? -tax : tax, pos(tax) ? tax : -tax, tx),
      rty = clamp(pos(tay) ? -tay : tay, pos(tay) ? tay : -tay, ty);

    if (state.btn.d) {
      console.log(sign(tax), sign(tay));
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = `oklch(60% 40% ${hue}deg)`;
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle =
      ctx.strokeStyle = `oklch(40% 60% ${(hue + 120) % 360}deg / 0.3)`;
    ctx.lineWidth = 5;

    ctx.beginPath();
    circ(ctx, bx + rtx, by + rty, bri);
    ctx.fill();

    ctx.beginPath();
    circ(ctx, bx, by, bro);
    ctx.stroke();

    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + tax, by + tay);
    ctx.stroke();

    p.innerText = JSON.stringify(state, null, 2);
    p.style.color = `oklch(0% 0% ${(hue + 240) % 360}deg)`;
  };

let { innerWidth: iw, innerHeight: ih, devicePixelRatio: dpr } = w,
  cw = iw * dpr,
  ch = ih * dpr,
  hw = cw / 2,
  hh = ch / 2,
  // frameId = raf(tick),
  prevTime = initTime,
  currTime = initTime,
  diffTime = 0,
  overTime = 0;

raf(tick);

on(w, "resize", onResize);
w.dispatchEvent(new Event("resize"));

// on(m, "click", onClick);
on(c, "pointerdown", onPointerDownMove);
on(c, "pointermove", onPointerDownMove);
on(c, "pointerup", onPointerUp);

/**
 * necessary to prevent iOS magnifier on long press and selection on double tap
 */
const onTouchStartEnd = (e: TouchEvent) => e.preventDefault();
on(m, "touchstart", onTouchStartEnd);
on(m, "touchend", onTouchStartEnd);
