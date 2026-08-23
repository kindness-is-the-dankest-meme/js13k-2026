import "./style.css";

declare global {
  var m: HTMLElementTagNameMap["main"];
  var c: HTMLElementTagNameMap["canvas"];
  var a: HTMLElementTagNameMap["aside"];
  var p: HTMLElementTagNameMap["pre"];
}

const w = window,
  {
    requestAnimationFrame: raf,
    cancelAnimationFrame: caf,
    performance: perf,
  } = w,
  { PI: π /*, round, sin */ } = Math,
  ππ = π * 2,
  ctx = c.getContext("2d"),
  on = (
    target: EventTarget,
    eventType: string,
    listener: EventListener,
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
  state = {
    ps: {},
  },
  // onClick = () => (frameId === -1 ? raf(tick) : (caf(frameId), (frameId = -1))),
  onPointerDown = (event: PointerEvent) =>
    (state.ps[event.pointerId] = {
      x: event.x,
      y: event.y,
    }),
  onPointerUp = (event: PointerEvent) => delete state.ps[event.pointerId],
  goldTime = 1_000 / 60,
  initTime = perf.now(),
  tick = (now: DOMHighResTimeStamp) => {
    frameId = raf(tick);

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
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = `hsl(210, 60%, 50%)`;
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = ctx.strokeStyle = "#fe57a1";
    ctx.lineWidth = 5;

    ctx.beginPath();
    circ(ctx, hw, ch * 0.8, cw * 0.08);
    ctx.fill();

    ctx.beginPath();
    circ(ctx, hw, ch * 0.8, cw * 0.12);
    ctx.stroke();

    p.innerText = JSON.stringify(state, null, 2);

    // TODO: maybe oklch will give us something?
    // p.style.color = `hsl(${hue + 90}, 50%, 20%)`;
  };

let { innerWidth: iw, innerHeight: ih, devicePixelRatio: dpr } = w,
  cw = iw * dpr,
  ch = ih * dpr,
  hw = cw / 2,
  hh = ch / 2,
  frameId = raf(tick),
  prevTime = initTime,
  currTime = initTime,
  diffTime = 0,
  overTime = 0;

on(w, "resize", onResize);
w.dispatchEvent(new Event("resize"));

// on(m, "click", onClick);
on(c, "pointerdown", onPointerDown);
on(c, "pointerup", onPointerUp);
