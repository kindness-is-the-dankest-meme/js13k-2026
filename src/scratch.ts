const raf = requestAnimationFrame,
  perf = performance;

((initTime: DOMHighResTimeStamp) => {
  const stepTime = 10;

  let prevTime = initTime,
    overTime = 0,
    diffTime = 0,
    fameId;

  fameId = raf(function tick(t: DOMHighResTimeStamp) {
    fameId = raf(tick);
  });
})(perf.now());
