(() => {
  'use strict';

  /* ================================================================
   * Palettes, defaults, presets
   * ================================================================ */

  const MAX_COLORS = 8;

  const PALETTES = {
    mono:      { name: 'Ч/Б',            colors: ['#0a0a0a', '#f5f5f0'] },
    paper:     { name: 'Бумага',         colors: ['#1d1b19', '#efe6d2'] },
    amber:     { name: 'Янтарный CRT',   colors: ['#140900', '#ffb000'] },
    phosphor:  { name: 'Зелёный CRT',    colors: ['#020a03', '#33ff66'] },
    blueprint: { name: 'Чертёж',         colors: ['#0b2a5b', '#e6f0ff'] },
    gameboy:   { name: 'Game Boy',       colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
    cga:       { name: 'CGA',            colors: ['#000000', '#55ffff', '#ff55ff', '#ffffff'] },
    vapor:     { name: 'Vaporwave',      colors: ['#2b1055', '#d53a9d', '#7597de', '#f2f2f2'] },
    sunset:    { name: 'Закат',          colors: ['#1a0b2e', '#7a1f5c', '#e2445c', '#f9a03f', '#fdf3c7'] },
    pico:      { name: 'PICO-8',         colors: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8'] },
  };

  const DEFAULTS = Object.freeze({
    // dithering
    mode: 'bayer8',
    pixel: 3,
    spread: 1,
    dotSize: 6,
    angle: 45,
    // color
    colorMode: 'palette',
    palette: 'sunset',
    colors: PALETTES.sunset.colors.slice(),
    levels: 2,
    invert: false,
    // tone
    brightness: 0,
    contrast: 1.1,
    gamma: 1,
    // motion
    playing: true,
    speed: 1,
    fps: 30,
    driftX: 0,
    driftY: 3,
    jitter: 0,
    waveAmp: 0.006,
    waveFreq: 12,
    waveSpeed: 1.5,
    pulse: 0,
    glitch: 0,
    // mouse
    mouseStrength: 0.6,
    mouseRadius: 0.18,
  });

  const PRESETS = [
    { name: 'Закат (по умолчанию)', values: {} },
    { name: '1-bit классика', values: { mode: 'bayer4', pixel: 2, palette: 'mono', driftX: 0, driftY: 0, jitter: 0.35, waveAmp: 0.002, waveFreq: 8, contrast: 1.2 } },
    { name: 'Game Boy', values: { mode: 'bayer4', pixel: 4, palette: 'gameboy', driftX: 2, driftY: 0, waveAmp: 0.003, fps: 15, contrast: 1.15 } },
    { name: 'Янтарный терминал', values: { mode: 'ign', pixel: 2, palette: 'amber', jitter: 1, driftY: 0, waveAmp: 0.0015, fps: 24, contrast: 1.3, glitch: 0.12 } },
    { name: 'Газета', values: { mode: 'halftone', pixel: 1, dotSize: 7, angle: 45, palette: 'paper', driftX: 3, driftY: 3, waveAmp: 0.004, waveFreq: 6, contrast: 1.25 } },
    { name: 'Гравюра', values: { mode: 'lines', pixel: 1, dotSize: 5, angle: 30, palette: 'blueprint', driftX: 0, driftY: 6, waveAmp: 0.008, waveFreq: 20, contrast: 1.3 } },
    { name: 'Глитч', values: { mode: 'bayer8', pixel: 3, palette: 'cga', glitch: 0.6, jitter: 0.5, driftX: -8, driftY: 0, fps: 20, waveAmp: 0.01, waveSpeed: 3 } },
    { name: 'Цветной RGB', values: { colorMode: 'rgb', levels: 3, mode: 'bayer8', pixel: 2, driftY: 2, waveAmp: 0.005 } },
    { name: 'Дыхание', values: { mode: 'bayer8', pixel: 5, palette: 'vapor', pulse: 0.18, speed: 0.8, driftX: 1, driftY: 1, waveAmp: 0.012, waveFreq: 5, waveSpeed: 0.8 } },
    { name: 'Статика', values: { mode: 'white', pixel: 2, palette: 'phosphor', jitter: 1, driftY: 0, waveAmp: 0, fps: 60, contrast: 1.4 } },
  ];

  const MODES = [
    ['bayer2', 'Bayer 2×2'],
    ['bayer4', 'Bayer 4×4'],
    ['bayer8', 'Bayer 8×8'],
    ['bayer16', 'Bayer 16×16'],
    ['ign', 'Градиентный шум (IGN)'],
    ['white', 'Белый шум'],
    ['halftone', 'Полутон (точки)'],
    ['lines', 'Линии'],
    ['threshold', 'Порог (без дизеринга)'],
  ];
  const MODE_INDEX = Object.fromEntries(MODES.map(([k], i) => [k, i]));

  const isPatternMode = (s) => s.mode === 'halftone' || s.mode === 'lines';

  /* Control schema. `show` hides controls that do not apply to the current mode. */
  const SCHEMA = [
    {
      title: 'Дизеринг', open: true, items: [
        { key: 'mode', type: 'select', label: 'Алгоритм', options: MODES },
        { key: 'pixel', type: 'range', label: 'Размер пикселя', min: 1, max: 16, step: 1, unit: 'px' },
        { key: 'spread', type: 'range', label: 'Сила дизеринга', min: 0, max: 2, step: 0.01 },
        { key: 'dotSize', type: 'range', label: 'Размер ячейки', min: 2, max: 32, step: 1, show: isPatternMode },
        { key: 'angle', type: 'range', label: 'Угол растра', min: 0, max: 180, step: 1, unit: '°', show: isPatternMode },
      ],
    },
    {
      title: 'Цвет', open: true, items: [
        { key: 'colorMode', type: 'select', label: 'Режим цвета', options: [['palette', 'Палитра (по яркости)'], ['rgb', 'RGB (по каналам)']] },
        { key: 'palette', type: 'select', label: 'Палитра', options: () => paletteOptions(), show: (s) => s.colorMode === 'palette' },
        { key: 'colors', type: 'colors', label: 'Цвета палитры', show: (s) => s.colorMode === 'palette' },
        { key: 'levels', type: 'range', label: 'Уровней на канал', min: 2, max: 8, step: 1, show: (s) => s.colorMode === 'rgb' },
        { key: 'invert', type: 'toggle', label: 'Инвертировать' },
      ],
    },
    {
      title: 'Тон', open: false, items: [
        { key: 'brightness', type: 'range', label: 'Яркость', min: -0.6, max: 0.6, step: 0.01 },
        { key: 'contrast', type: 'range', label: 'Контраст', min: 0.2, max: 3, step: 0.01 },
        { key: 'gamma', type: 'range', label: 'Гамма', min: 0.3, max: 3, step: 0.01 },
      ],
    },
    {
      title: 'Движение', open: true, items: [
        { key: 'playing', type: 'toggle', label: 'Анимация' },
        { key: 'speed', type: 'range', label: 'Скорость', min: 0, max: 4, step: 0.01, unit: '×' },
        { key: 'fps', type: 'range', label: 'Частота кадров', min: 1, max: 60, step: 1, unit: ' fps' },
        { key: 'driftX', type: 'range', label: 'Дрейф паттерна X', min: -30, max: 30, step: 0.5 },
        { key: 'driftY', type: 'range', label: 'Дрейф паттерна Y', min: -30, max: 30, step: 0.5 },
        { key: 'jitter', type: 'range', label: 'Мерцание (temporal)', min: 0, max: 1, step: 0.01 },
        { key: 'waveAmp', type: 'range', label: 'Волна: амплитуда', min: 0, max: 0.05, step: 0.0005 },
        { key: 'waveFreq', type: 'range', label: 'Волна: частота', min: 0, max: 60, step: 0.5 },
        { key: 'waveSpeed', type: 'range', label: 'Волна: скорость', min: 0, max: 10, step: 0.1 },
        { key: 'pulse', type: 'range', label: 'Пульсация яркости', min: 0, max: 0.5, step: 0.01 },
        { key: 'glitch', type: 'range', label: 'Глитч', min: 0, max: 1, step: 0.01 },
      ],
    },
    {
      title: 'Курсор', open: false, items: [
        { key: 'mouseStrength', type: 'range', label: 'Сила искажения', min: 0, max: 1.5, step: 0.01 },
        { key: 'mouseRadius', type: 'range', label: 'Радиус', min: 0.03, max: 0.6, step: 0.01 },
      ],
    },
  ];

  const RANGE_KEYS = SCHEMA.flatMap((s) => s.items).filter((i) => i.type === 'range');

  /* ================================================================
   * State
   * ================================================================ */

  const STORAGE_KEY = 'motion-dither:v1';
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let state = clone(DEFAULTS);

  function sanitize(input) {
    const s = clone(DEFAULTS);
    if (!input || typeof input !== 'object') return s;
    for (const key of Object.keys(DEFAULTS)) {
      if (!(key in input)) continue;
      const def = DEFAULTS[key];
      const val = input[key];
      if (Array.isArray(def)) {
        if (Array.isArray(val)) {
          const cols = val.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, MAX_COLORS);
          if (cols.length >= 2) s[key] = cols;
        }
      } else if (typeof def === typeof val) {
        s[key] = val;
      }
    }
    for (const r of RANGE_KEYS) s[r.key] = Math.min(r.max, Math.max(r.min, Number(s[r.key])));
    if (!(s.mode in MODE_INDEX)) s.mode = DEFAULTS.mode;
    return s;
  }

  function loadState() {
    const hash = location.hash.match(/^#s=(.+)$/);
    if (hash) {
      try {
        return sanitize(JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(hash[1]))))));
      } catch (e) { /* fall through to storage */ }
    }
    try {
      return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch (e) {
      return clone(DEFAULTS);
    }
  }

  let saveTimer = 0;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
    }, 200);
  }

  function paletteOptions() {
    const opts = Object.entries(PALETTES).map(([k, p]) => [k, p.name]);
    if (state.palette === 'custom') opts.push(['custom', 'Своя']);
    return opts;
  }

  /* ================================================================
   * WebGL
   * ================================================================ */

  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;

    uniform sampler2D uImage;
    uniform vec2  uRes;
    uniform float uTime;
    uniform float uFrame;

    uniform int   uMode;
    uniform float uPixel;
    uniform float uSpread;
    uniform float uDotSize;
    uniform float uAngle;

    uniform int   uColorMode;
    uniform vec3  uPalette[${MAX_COLORS}];
    uniform int   uPaletteSize;
    uniform float uLevels;
    uniform float uInvert;

    uniform float uBrightness;
    uniform float uContrast;
    uniform float uGamma;

    uniform vec2  uDrift;
    uniform float uJitter;
    uniform float uWaveAmp;
    uniform float uWaveFreq;
    uniform float uWaveSpeed;
    uniform float uPulse;
    uniform float uGlitch;

    uniform vec2  uMouse;
    uniform float uMouseActive;
    uniform float uMouseStrength;
    uniform float uMouseRadius;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    // Recursive Bayer matrices, values in [0, 1).
    float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
    float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
    float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
    float bayer16(vec2 a) { return bayer8(0.5 * a) * 0.25 + bayer2(a); }

    // Mirror-repeat so distorted UVs never hit the clamped texture edge.
    vec2 mirrorUv(vec2 uv) { return 1.0 - abs(1.0 - mod(uv, 2.0)); }

    vec3 pickColor(int idx) {
      vec3 c = uPalette[0];
      for (int i = 0; i < ${MAX_COLORS}; i++) {
        if (i == idx) c = uPalette[i];
      }
      return c;
    }

    float threshold(vec2 dc) {
      if (uMode == 0) return bayer2(dc);
      if (uMode == 1) return bayer4(dc);
      if (uMode == 2) return bayer8(dc);
      if (uMode == 3) return bayer16(dc);
      if (uMode == 4) return fract(52.9829189 * fract(dot(dc, vec2(0.06711056, 0.00583715))));
      if (uMode == 5) return hash12(dc);
      float ca = cos(uAngle), sa = sin(uAngle);
      vec2 r = vec2(ca * dc.x - sa * dc.y, sa * dc.x + ca * dc.y) / uDotSize;
      if (uMode == 6) return clamp(length(fract(r) - 0.5) * 1.4142, 0.0, 1.0);
      if (uMode == 7) return abs(fract(r.x) - 0.5) * 2.0;
      return 0.5;
    }

    void main() {
      vec2 cell = floor(gl_FragCoord.xy / uPixel);
      vec2 uv = (cell + 0.5) * uPixel / uRes;
      float aspect = uRes.x / uRes.y;

      // Glitch: horizontal band displacement.
      float gTime = floor(uTime * 12.0);
      float band = floor(uv.y * 28.0);
      float gOn = step(1.0 - uGlitch * 0.35, hash12(vec2(band, gTime))) * step(0.001, uGlitch);
      uv.x += gOn * (hash12(vec2(band + 17.0, gTime)) - 0.5) * 0.2 * uGlitch;

      // Wave distortion.
      uv.x += sin(uv.y * uWaveFreq + uTime * uWaveSpeed) * uWaveAmp;
      uv.y += sin(uv.x * uWaveFreq * 0.73 + uTime * uWaveSpeed * 1.31) * uWaveAmp * 0.6;

      // Cursor: lens pull + ripple.
      vec2 d = uv - uMouse;
      d.x *= aspect;
      float l = length(d);
      float fall = smoothstep(uMouseRadius, 0.0, l) * uMouseActive * uMouseStrength;
      vec2 dir = d / max(l, 1e-4);
      dir.x /= aspect;
      uv -= (uv - uMouse) * fall * 0.35;
      uv -= dir * sin(l * 70.0 - uTime * 7.0) * fall * 0.012;

      vec2 split = vec2(gOn * 0.012 * uGlitch, 0.0);
      vec3 c = vec3(
        texture2D(uImage, mirrorUv(uv + split)).r,
        texture2D(uImage, mirrorUv(uv)).g,
        texture2D(uImage, mirrorUv(uv - split)).b
      );

      c = pow(max(c, 0.0), vec3(1.0 / uGamma));
      float pulse = sin(uTime * 2.2) * uPulse;
      c = (c - 0.5) * uContrast + 0.5 + uBrightness + pulse;
      c = clamp(c, 0.0, 1.0);
      c = mix(c, 1.0 - c, uInvert);

      // Pattern coords drift in whole cells so the pattern "crawls" across the image.
      vec2 dc = cell - floor(uDrift * uTime);
      float th = threshold(dc);
      // Temporal dithering: a per-frame cyclic shift keeps the threshold distribution uniform.
      th = fract(th + uJitter * hash12(vec2(uFrame * 0.6180339, 3.7)));
      float offs = (th - 0.5) * uSpread;

      vec3 outc;
      if (uColorMode == 0) {
        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        float n = float(uPaletteSize) - 1.0;
        int idx = int(floor(clamp(lum + offs / n, 0.0, 1.0) * n + 0.5));
        outc = pickColor(idx);
      } else {
        float n = uLevels - 1.0;
        outc = floor(clamp(c + offs / n, 0.0, 1.0) * n + 0.5) / n;
      }

      gl_FragColor = vec4(outc, 1.0);
    }
  `;

  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });

  if (!gl) {
    document.getElementById('stage').innerHTML =
      '<p style="max-width:420px;text-align:center;color:#aaa">Ваш браузер не поддерживает WebGL — эффект недоступен.</p>';
    return;
  }

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  const nUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < nUniforms; i++) {
    const name = gl.getActiveUniform(program, i).name.replace(/\[0\]$/, '');
    U[name] = gl.getUniformLocation(program, name);
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let imageAspect = 1.5;
  let imageLabel = '';

  function setImage(source, label) {
    const w = source.naturalWidth || source.videoWidth || source.width;
    const h = source.naturalHeight || source.videoHeight || source.height;
    if (!w || !h) return;
    const maxSide = Math.min(2048, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const k = Math.min(1, maxSide / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    imageAspect = c.width / c.height;
    imageLabel = `${label || 'изображение'} · ${w}×${h}`;
    resize();
  }

  /* ================================================================
   * Sizing & rendering
   * ================================================================ */

  const stage = document.getElementById('stage');
  const stageInfo = document.getElementById('stageInfo');
  let dpr = 1;
  let dirty = true;

  function resize() {
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0 || availH <= 0) return;
    let w = availW;
    let h = w / imageAspect;
    if (h > availH) { h = availH; w = h * imageAspect; }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${Math.floor(w)}px`;
    canvas.style.height = `${Math.floor(h)}px`;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    dirty = true;
  }

  new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);

  const paletteBuf = new Float32Array(MAX_COLORS * 3);
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  const anim = { time: 0, frame: 0, acc: 0 };
  const mouse = { x: 0.5, y: 0.5, active: 0, target: 0 };

  function render() {
    const s = state;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, anim.time);
    gl.uniform1f(U.uFrame, anim.frame);

    gl.uniform1i(U.uMode, MODE_INDEX[s.mode]);
    gl.uniform1f(U.uPixel, Math.max(1, Math.round(s.pixel * dpr)));
    gl.uniform1f(U.uSpread, s.spread);
    gl.uniform1f(U.uDotSize, s.dotSize);
    gl.uniform1f(U.uAngle, (s.angle * Math.PI) / 180);

    gl.uniform1i(U.uColorMode, s.colorMode === 'rgb' ? 1 : 0);
    paletteBuf.fill(0);
    s.colors.forEach((hex, i) => paletteBuf.set(hexToRgb(hex), i * 3));
    gl.uniform3fv(U.uPalette, paletteBuf);
    gl.uniform1i(U.uPaletteSize, s.colors.length);
    gl.uniform1f(U.uLevels, s.levels);
    gl.uniform1f(U.uInvert, s.invert ? 1 : 0);

    gl.uniform1f(U.uBrightness, s.brightness);
    gl.uniform1f(U.uContrast, s.contrast);
    gl.uniform1f(U.uGamma, s.gamma);

    gl.uniform2f(U.uDrift, s.driftX, s.driftY);
    gl.uniform1f(U.uJitter, s.jitter);
    gl.uniform1f(U.uWaveAmp, s.waveAmp);
    gl.uniform1f(U.uWaveFreq, s.waveFreq);
    gl.uniform1f(U.uWaveSpeed, s.waveSpeed);
    gl.uniform1f(U.uPulse, s.pulse);
    gl.uniform1f(U.uGlitch, s.glitch);

    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform1f(U.uMouseActive, mouse.active);
    gl.uniform1f(U.uMouseStrength, s.mouseStrength);
    gl.uniform1f(U.uMouseRadius, s.mouseRadius);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  let last = performance.now();
  let fpsCount = 0;
  let fpsTime = 0;
  let fpsShown = 0;

  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // Mouse fade in/out is independent from the stepped animation clock.
    const prevActive = mouse.active;
    mouse.active += (mouse.target - mouse.active) * Math.min(1, dt * 8);
    if (Math.abs(mouse.active - prevActive) > 1e-3) dirty = true;

    if (state.playing) {
      anim.acc += dt;
      const step = state.fps >= 60 ? 0 : 1 / state.fps;
      if (anim.acc >= step) {
        anim.time += anim.acc * state.speed;
        anim.frame = (anim.frame + 1) % 100000;
        anim.acc = 0;
        dirty = true;
      }
    }

    if (dirty) {
      render();
      dirty = false;
      fpsCount++;
    }

    fpsTime += dt;
    if (fpsTime >= 0.5) {
      fpsShown = Math.round(fpsCount / fpsTime);
      fpsCount = 0;
      fpsTime = 0;
      stageInfo.textContent = `${imageLabel} · ${canvas.width}×${canvas.height} · ${fpsShown} fps`;
    }

    requestAnimationFrame(loop);
  }

  /* ================================================================
   * Pointer interaction
   * ================================================================ */

  function updatePointer(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = 1 - (e.clientY - r.top) / r.height;
    mouse.target = 1;
    dirty = true;
  }
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerdown', updatePointer);
  canvas.addEventListener('pointerleave', () => { mouse.target = 0; });
  canvas.addEventListener('pointercancel', () => { mouse.target = 0; });

  /* ================================================================
   * Controls UI
   * ================================================================ */

  const controlsEl = document.getElementById('controls');
  const ctrlRefs = [];

  function formatValue(item, v) {
    const decimals = item.step >= 1 ? 0 : item.step >= 0.1 ? 1 : item.step >= 0.01 ? 2 : 4;
    return `${Number(v).toFixed(decimals)}${item.unit || ''}`;
  }

  function setValue(key, value, { rebuild = false } = {}) {
    state[key] = value;
    if (key === 'palette' && PALETTES[value]) state.colors = PALETTES[value].colors.slice();
    if (key === 'playing') updatePlayButton();
    dirty = true;
    saveState();
    if (rebuild) buildControls();
    else updateVisibility();
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children) node.append(c);
    return node;
  }

  function buildControl(item) {
    const id = `c-${item.key}`;
    const wrap = el('div', { class: 'ctrl' });

    if (item.type === 'range') {
      const out = el('output', { for: id, text: formatValue(item, state[item.key]) });
      const input = el('input', {
        id, type: 'range', min: item.min, max: item.max, step: item.step, value: state[item.key],
        oninput: (e) => {
          const v = parseFloat(e.target.value);
          out.textContent = formatValue(item, v);
          setValue(item.key, v);
        },
      });
      const label = el('label', {
        for: id, text: item.label, title: 'Двойной клик — значение по умолчанию',
        ondblclick: () => {
          input.value = DEFAULTS[item.key];
          out.textContent = formatValue(item, DEFAULTS[item.key]);
          setValue(item.key, DEFAULTS[item.key]);
        },
      });
      wrap.append(el('div', { class: 'ctrl-row' }, [label, out]), input);
    } else if (item.type === 'select') {
      const opts = typeof item.options === 'function' ? item.options() : item.options;
      const select = el('select', {
        id,
        onchange: (e) => setValue(item.key, e.target.value, { rebuild: item.key === 'palette' }),
      }, opts.map(([v, t]) => {
        const o = el('option', { value: v, text: t });
        if (v === state[item.key]) o.selected = true;
        return o;
      }));
      wrap.append(el('div', { class: 'ctrl-row' }, [el('label', { for: id, text: item.label })]), select);
    } else if (item.type === 'toggle') {
      const input = el('input', {
        id, type: 'checkbox',
        onchange: (e) => setValue(item.key, e.target.checked),
      });
      input.checked = !!state[item.key];
      wrap.classList.add('ctrl-toggle');
      wrap.append(el('label', { for: id, text: item.label }), input);
    } else if (item.type === 'colors') {
      wrap.append(buildSwatches(item));
    }

    ctrlRefs.push({ item, wrap });
    return wrap;
  }

  function buildSwatches(item) {
    const box = el('div');
    box.append(el('div', { class: 'ctrl-row' }, [el('label', { text: item.label })]));
    const sw = el('div', { class: 'swatches' });

    const markCustom = () => {
      state.palette = 'custom';
      dirty = true;
      saveState();
    };

    state.colors.forEach((hex, i) => {
      sw.append(el('input', {
        type: 'color', value: hex, title: `Цвет ${i + 1}`,
        oninput: (e) => {
          state.colors[i] = e.target.value;
          markCustom();
        },
        onchange: () => buildControls(),
      }));
    });

    if (state.colors.length < MAX_COLORS) {
      sw.append(el('button', {
        type: 'button', class: 'btn mini', title: 'Добавить цвет', text: '+',
        onclick: () => {
          const a = hexToRgb(state.colors[state.colors.length - 1]);
          state.colors.push(`#${a.map((v) => Math.round((v * 0.5 + 0.5) * 255).toString(16).padStart(2, '0')).join('')}`);
          markCustom();
          buildControls();
        },
      }));
    }
    if (state.colors.length > 2) {
      sw.append(el('button', {
        type: 'button', class: 'btn mini', title: 'Убрать последний цвет', text: '−',
        onclick: () => {
          state.colors.pop();
          markCustom();
          buildControls();
        },
      }));
    }
    sw.append(el('button', {
      type: 'button', class: 'btn mini', title: 'Развернуть порядок', text: '⇄',
      onclick: () => {
        state.colors.reverse();
        markCustom();
        buildControls();
      },
    }));

    box.append(sw, el('div', { class: 'hint', text: 'Цвета идут от тёмных к светлым.' }));
    return box;
  }

  const openSections = new Set(SCHEMA.filter((s) => s.open).map((s) => s.title));

  function buildControls() {
    const scroll = controlsEl.closest('.panel').scrollTop;
    controlsEl.textContent = '';
    ctrlRefs.length = 0;
    for (const section of SCHEMA) {
      const details = el('details', { class: 'section' });
      details.open = openSections.has(section.title);
      details.addEventListener('toggle', () => {
        if (details.open) openSections.add(section.title);
        else openSections.delete(section.title);
      });
      details.append(el('summary', { text: section.title }));
      section.items.forEach((item) => details.append(buildControl(item)));
      controlsEl.append(details);
    }
    updateVisibility();
    controlsEl.closest('.panel').scrollTop = scroll;
  }

  function updateVisibility() {
    for (const { item, wrap } of ctrlRefs) {
      wrap.hidden = item.show ? !item.show(state) : false;
    }
  }

  /* ================================================================
   * Actions
   * ================================================================ */

  const toastEl = document.getElementById('toast');
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function applyState(next, msg) {
    state = sanitize(next);
    if (state.palette !== 'custom' && PALETTES[state.palette] && !next.colors) {
      state.colors = PALETTES[state.palette].colors.slice();
    }
    updatePlayButton();
    buildControls();
    saveState();
    dirty = true;
    if (msg) toast(msg);
  }

  function randomize() {
    const r = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const palette = pick(Object.keys(PALETTES));
    applyState({
      ...state,
      mode: pick(MODES.slice(0, 8)).at(0),
      pixel: Math.round(r(1, 6)),
      spread: r(0.7, 1.3),
      dotSize: Math.round(r(4, 12)),
      angle: Math.round(r(0, 180)),
      colorMode: Math.random() < 0.85 ? 'palette' : 'rgb',
      palette,
      colors: PALETTES[palette].colors.slice(),
      levels: Math.round(r(2, 4)),
      contrast: r(0.9, 1.5),
      driftX: Math.round(r(-8, 8)),
      driftY: Math.round(r(-8, 8)),
      jitter: Math.random() < 0.4 ? r(0.2, 1) : 0,
      waveAmp: r(0, 0.015),
      waveFreq: r(2, 30),
      waveSpeed: r(0.3, 4),
      pulse: Math.random() < 0.3 ? r(0.05, 0.2) : 0,
      glitch: Math.random() < 0.2 ? r(0.1, 0.6) : 0,
      fps: pick([12, 15, 24, 30, 60]),
      playing: true,
    }, 'Случайные настройки');
  }

  const btnPlay = document.getElementById('btnPlay');
  function updatePlayButton() {
    btnPlay.textContent = state.playing ? 'Пауза' : 'Играть';
  }
  function togglePlay() {
    setValue('playing', !state.playing, { rebuild: true });
  }

  function savePng() {
    render();
    canvas.toBlob((blob) => {
      if (blob) download(blob, `motion-dither-${Date.now()}.png`);
    }, 'image/png');
  }

  const btnRec = document.getElementById('btnRec');
  let recorder = null;
  function toggleRecord() {
    if (recorder) { recorder.stop(); return; }
    if (!window.MediaRecorder || !canvas.captureStream) {
      toast('Запись видео не поддерживается этим браузером');
      return;
    }
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      .find((m) => MediaRecorder.isTypeSupported(m));
    const chunks = [];
    recorder = new MediaRecorder(canvas.captureStream(60), mime ? { mimeType: mime, videoBitsPerSecond: 16e6 } : undefined);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const type = recorder.mimeType || mime || 'video/webm';
      download(new Blob(chunks, { type }), `motion-dither-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`);
      recorder = null;
      btnRec.textContent = '● Запись видео';
      btnRec.classList.remove('recording');
    };
    recorder.start();
    btnRec.textContent = '■ Остановить';
    btnRec.classList.add('recording');
    if (!state.playing) togglePlay();
  }

  function shareLink() {
    const payload = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(state)))));
    const url = `${location.origin}${location.pathname}#s=${payload}`;
    history.replaceState(null, '', url);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => toast('Ссылка с настройками скопирована'), () => toast('Ссылка в адресной строке'));
    } else {
      toast('Ссылка с настройками — в адресной строке');
    }
  }

  /* ================================================================
   * Image sources
   * ================================================================ */

  function loadFromUrl(src, label, crossOrigin) {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img, label);
    img.onerror = () => toast('Не удалось загрузить изображение');
    img.src = src;
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      toast('Нужен файл изображения');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImage(img, file.name); URL.revokeObjectURL(url); };
    img.onerror = () => { toast('Не удалось прочитать файл'); URL.revokeObjectURL(url); };
    img.src = url;
  }

  /* Procedural landscape so the page works offline with no bundled assets. */
  function demoScene() {
    const W = 1400, H = 900;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#070a1c');
    sky.addColorStop(0.35, '#2b2463');
    sky.addColorStop(0.62, '#c5577a');
    sky.addColorStop(0.8, '#ffb37a');
    sky.addColorStop(1, '#ffe6b0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    for (let i = 0; i < 260; i++) {
      const y = Math.pow(rnd(), 1.8) * H * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.75})`;
      ctx.fillRect(rnd() * W, y, 1 + rnd() * 2, 1 + rnd() * 2);
    }

    const sx = W * 0.6, sy = H * 0.56, sr = H * 0.17;
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3.2);
    glow.addColorStop(0, 'rgba(255,220,160,0.65)');
    glow.addColorStop(1, 'rgba(255,160,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
    sun.addColorStop(0, '#fffbe8');
    sun.addColorStop(1, '#ff9a5a');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();

    const layers = [
      { base: 0.62, amp: 0.13, col: ['#7a4a8c', '#5a3576'] },
      { base: 0.7, amp: 0.11, col: ['#4f2c66', '#3a1f52'] },
      { base: 0.78, amp: 0.09, col: ['#2e1a45', '#22123a'] },
      { base: 0.87, amp: 0.07, col: ['#160c27', '#0d0718'] },
    ];
    for (const L of layers) {
      const p = [rnd() * 10, rnd() * 10, rnd() * 10, rnd() * 10];
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const t = x / W;
        const n = Math.sin(t * 5 + p[0]) * 0.5 + Math.sin(t * 13 + p[1]) * 0.25 +
          Math.sin(t * 31 + p[2]) * 0.12 + Math.sin(t * 71 + p[3]) * 0.05;
        ctx.lineTo(x, H * (L.base - n * L.amp));
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, H * (L.base - L.amp), 0, H);
      g.addColorStop(0, L.col[0]);
      g.addColorStop(1, L.col[1]);
      ctx.fillStyle = g;
      ctx.fill();
    }
    setImage(c, 'демо-сцена');
  }

  const fileInput = document.getElementById('file');
  fileInput.addEventListener('change', () => {
    loadFile(fileInput.files[0]);
    fileInput.value = '';
  });

  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; stage.classList.add('dragging'); });
  window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; stage.classList.remove('dragging'); } });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    stage.classList.remove('dragging');
    loadFile(e.dataTransfer.files[0]);
  });
  window.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) loadFile(item.getAsFile());
  });

  /* ================================================================
   * Wiring
   * ================================================================ */

  const app = document.querySelector('.app');
  const panelToggle = document.getElementById('panelToggle');
  function togglePanel() {
    app.classList.toggle('panel-hidden');
    panelToggle.textContent = app.classList.contains('panel-hidden') ? 'Настройки' : 'Скрыть настройки';
    resize();
  }

  document.getElementById('btnUpload').addEventListener('click', () => fileInput.click());
  document.getElementById('btnPhoto').addEventListener('click', () => {
    toast('Загружаю фото…');
    loadFromUrl(`https://picsum.photos/1400/900?random=${Date.now()}`, 'фото picsum.photos', true);
  });
  document.getElementById('btnDemo').addEventListener('click', demoScene);
  btnPlay.addEventListener('click', togglePlay);
  document.getElementById('btnPng').addEventListener('click', savePng);
  btnRec.addEventListener('click', toggleRecord);
  document.getElementById('btnRandom').addEventListener('click', randomize);
  document.getElementById('btnShare').addEventListener('click', shareLink);
  document.getElementById('btnReset').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname);
    applyState(clone(DEFAULTS), 'Настройки сброшены');
  });
  panelToggle.addEventListener('click', togglePanel);

  const presetsEl = document.getElementById('presets');
  for (const p of PRESETS) {
    presetsEl.append(el('button', {
      type: 'button', class: 'chip', text: p.name,
      onclick: () => applyState({ ...clone(DEFAULTS), ...p.values }, `Пресет: ${p.name}`),
    }));
  }

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName;
    if ((tag === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (tag === 'BUTTON' && e.code === 'Space') return;
    const k = e.key.toLowerCase();
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (k === 's' || k === 'ы') savePng();
    else if (k === 'r' || k === 'к') randomize();
    else if (k === 'h' || k === 'р') togglePanel();
  });

  state = loadState();
  updatePlayButton();
  buildControls();
  demoScene();
  requestAnimationFrame(loop);
})();
