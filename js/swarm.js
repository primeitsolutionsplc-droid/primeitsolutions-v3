/* =====================================================================
   Prime IT Solutions: background + pixel swarm (raw WebGL, no libraries)
   Dark mode only.

   1. BACKGROUND  full-screen shader: slow aurora, a wall of pixel cells that
                  drift / twinkle / rain upward, a soft light that follows the
                  logo, and rings that ripple out when a shockwave passes.
   2. SWARM       1,200 pixels sampled from the real logo. They morph between
                  shapes (logo, layers, barcode, </>, knot, logo) as you scroll.

   What makes it "alive":
     - SPRING PHYSICS  every pixel is on a spring, so it overshoots and settles
     - CURSOR          pixels swirl around the pointer, lift toward you (3D lens)
                       and leave a glowing wake
     - SHOCKWAVES      click / tap anywhere: a ring blasts through the pixels.
                       An automatic energy pulse also rolls out of the logo
     - TRAILS          fast pixels leave streaks (intro, scroll morphs)
     - CONSTELLATION   a network of glowing links between pixels, with data
                       packets travelling along them; links stretch and fade
                       while the shape morphs
     - INTRO           pixels spiral in from the dark and lock into the logo,
                       ending with a shockwave and a light sweep
     - GLITCH          now and then a slice of the logo "glitches" (IT feel)
     - SCROLL DRAG     pixels lag behind when you scroll fast, then snap back
   ===================================================================== */
(function(){
  'use strict';
  var LOGO = window.PRIME_LOGO;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canvas = document.getElementById('gl');
  var gl = null;
  try{
    var opt = {alpha: false, antialias: false, depth: true, stencil: false, powerPreference: 'high-performance'};
    gl = canvas.getContext('webgl', opt) || canvas.getContext('experimental-webgl', opt);
  }catch(e){ gl = null; }
  if(!gl || !LOGO){ root.classList.add('no-gl'); return; }

  var FOV_TAN = Math.tan(38 * Math.PI / 360), CAM_Z = 16, N = 1200;
  var SMALL = Math.min(window.innerWidth, window.innerHeight) < 700;   /* phones get a lighter network */
  var NODE_STRIDE = SMALL ? 4 : 3;                                     /* every Nth pixel is a network node */
  var feat = {trails: true, lines: true};

  /* ---------- tiny WebGL helpers ---------- */
  function compile(type, src){
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function makeProgram(vs, fs){
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function locs(p, names){ var o = {}; names.forEach(function(n){ o[n] = gl.getUniformLocation(p, n); }); return o; }
  function makeBuf(data, usage){ var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b; }
  function attr(buf, loc, n){ if(loc < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0); }
  function attrsOff(){ for(var q = 0; q < 8; q++) gl.disableVertexAttribArray(q); }

  /* ---------- shaders ---------- */
  var BG_VS = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }';
  var BG_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes; uniform vec2 uMouse; uniform vec2 uFocus; uniform vec2 uRingC; uniform vec3 uRing;',
    'uniform float uTime, uFlow, uPx, uMouseOn, uFocusI;',
    'uniform vec3 uBg1, uBg2, uC1, uC2;',
    'float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm2(vec2 p){ return noise(p) * 0.6 + noise(p * 2.03 + vec2(1.7, 9.2)) * 0.4; }',
    'float fbm3(vec2 p){ return noise(p) * 0.5 + noise(p * 2.03 + vec2(1.7, 9.2)) * 0.3 + noise(p * 4.1 + vec2(8.3, 2.8)) * 0.2; }',
    'void main(){',
    '  vec2 fc = gl_FragCoord.xy; vec2 uv = fc / uRes; float asp = uRes.x / uRes.y; vec2 p = vec2(uv.x * asp, uv.y);',
    '  float t = uTime * 0.045;',
    '  vec3 base = mix(uBg2, uBg1, smoothstep(0.0, 1.0, uv.y));',
    /* aurora */
    '  vec2 q = p * 1.1 + vec2(t * 0.9, -uFlow * 0.35);',
    '  float w1 = fbm3(q + fbm2(q * 0.7 + vec2(-t, t * 0.6)));',
    '  float w2 = fbm2(q * 1.35 + vec2(4.1, 2.7) + vec2(t * 0.7, -t * 0.4) + w1 * 0.8);',
    '  float a1 = smoothstep(0.42, 0.80, w1); float a2 = smoothstep(0.46, 0.84, w2);',
    '  vec3 col = base + (uC1 * a1 + uC2 * a2) * 0.42;',
    '  vec3 mid = mix(uC1, uC2, 0.5);',
    /* light that follows the logo + shockwave ring */
    '  float fr = length(fc - uFocus) / (0.44 * uRes.y);',
    '  col += mid * exp(-fr * fr * 2.4) * uFocusI;',
    '  float rq = (distance(fc, uRingC) - uRing.x) / max(uRing.y, 1.0);',
    '  float ring = exp(-rq * rq) * uRing.z;',
    '  col += mid * ring * 0.45;',
    /* pixel wall */
    '  float cell = floor(26.0 * uPx); vec2 cid = floor(fc / cell); vec2 cf = fract(fc / cell);',
    '  float sq = step(0.12, cf.x) * step(cf.x, 0.88) * step(0.12, cf.y) * step(cf.y, 0.88);',
    '  float cn = fbm2(vec2(cid.x * 0.075, cid.y * 0.075 - uFlow * 0.55) * 1.3 + vec2(uTime * 0.02, 0.0) + w1 * 0.5);',
    '  float band = smoothstep(0.50, 0.56, cn) * (1.0 - smoothstep(0.56, 0.68, cn));',
    '  float spark = step(0.982, hash(cid + floor(uTime * 0.6 + hash(cid) * 9.0)));',
    '  float colH = hash(vec2(cid.x, 3.7)); float rows = uRes.y / cell;',
    '  float head = fract(colH + uFlow * (0.35 + 0.65 * hash(vec2(cid.x, 9.1))) * 0.5);',
    '  float rel = fract(head - cid.y / rows);',
    '  float rain = exp(-rel * 8.0) * step(0.52, hash(vec2(cid.x, 5.3)));',
    '  float md = distance(fc, uMouse) / (240.0 * uPx); float mg = (1.0 - smoothstep(0.0, 1.0, md)) * uMouseOn;',
    '  float lit = band * 0.5 + spark * 0.9 + rain * 0.62 + mg * (0.3 + 0.7 * hash(cid + floor(uTime * 4.0))) * 0.95 + ring * 1.3;',
    '  float edge = smoothstep(0.2, 0.95, abs(uv.x - 0.5) * 2.0);',
    '  lit = clamp(lit * (0.6 + 0.4 * edge), 0.0, 1.0) * sq;',
    '  vec3 cellCol = mix(uC1, uC2, hash(cid + 7.0));',
    '  col += cellCol * lit * 0.26;',
    /* vignette + grain */
    '  col *= 1.0 - 0.34 * smoothstep(0.25, 0.95, length(uv - 0.5));',
    '  col += (hash(fc + fract(uTime)) - 0.5) * 0.014;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* pixels: three passes (0 = solid core, 1 = glow halo, 2 = motion trail) */
  var PT_VS = [
    'attribute vec3 aPos; attribute vec3 aColor; attribute float aSize; attribute float aTw; attribute vec3 aVel;',
    'uniform float uScale, uHalo, uTime, uTwk, uAsp, uTanH, uCam, uTrail, uSz;',
    'varying vec3 vC; varying float vCore; varying float vTA;',
    'void main(){',
    '  vec3 P = aPos - aVel * uTrail;',
    '  float d = uCam - P.z;',
    '  float px = max(aSize * uSz * uScale / d, 1.0);',
    '  float sp = min(px * (1.0 + uHalo), 64.0);',
    '  vCore = clamp(px / sp, 0.0, 1.0);',
    '  vC = aColor * (1.0 - uTwk * (0.5 + 0.5 * sin(uTime * 2.2 + aTw * 6.2831)));',
    '  vTA = smoothstep(0.7, 3.6, length(aVel.xy));',
    '  float n = 0.1; float f = 100.0;',
    '  gl_Position = vec4(P.x / (uTanH * uAsp), P.y / uTanH, (f + n) / (f - n) * d - 2.0 * f * n / (f - n), d);',
    '  gl_PointSize = sp;',
    '}'
  ].join('\n');
  var PT_FS = [
    'precision mediump float;',
    'uniform float uPass, uGlowA; varying vec3 vC; varying float vCore; varying float vTA;',
    'void main(){',
    '  vec2 q = abs(gl_PointCoord - 0.5) * 2.0; float m = max(q.x, q.y);',
    '  if(uPass < 0.5){ if(m > vCore) discard; gl_FragColor = vec4(vC, 1.0); }',
    '  else if(uPass < 1.5){ if(m <= vCore) discard; float g = 1.0 - smoothstep(vCore, 1.0, m); gl_FragColor = vec4(vC, g * g * uGlowA); }',
    '  else { if(m > vCore) discard; gl_FragColor = vec4(vC, vTA * uGlowA); }',
    '}'
  ].join('\n');

  /* network links, with a bright data packet running along each one */
  var LN_VS = [
    'attribute vec3 aPos; attribute vec4 aCol; attribute vec2 aMeta;',
    'uniform float uAsp, uTanH, uCam; varying vec4 vCol; varying vec2 vMeta;',
    'void main(){',
    '  float d = uCam - aPos.z; float n = 0.1; float f = 100.0;',
    '  gl_Position = vec4(aPos.x / (uTanH * uAsp), aPos.y / uTanH, (f + n) / (f - n) * d - 2.0 * f * n / (f - n), d);',
    '  vCol = aCol; vMeta = aMeta;',
    '}'
  ].join('\n');
  var LN_FS = [
    'precision mediump float;',
    'uniform float uPk; varying vec4 vCol; varying vec2 vMeta;',
    'void main(){',
    '  float head = fract(uPk + vMeta.y) * 2.3 - 0.6;',
    '  float dd = vMeta.x - head;',
    '  float pk = exp(-dd * dd * 240.0);',
    '  gl_FragColor = vec4(vCol.rgb + pk * 0.55, vCol.a * (0.5 + 2.4 * pk));',
    '}'
  ].join('\n');

  var bgProg, ptProg, lnProg, U, V, W_, aBg, aP, aL;
  try{
    bgProg = makeProgram(BG_VS, BG_FS); ptProg = makeProgram(PT_VS, PT_FS); lnProg = makeProgram(LN_VS, LN_FS);
  }catch(err){
    if(window.console) console.warn('WebGL shader error:', err);
    root.classList.add('no-gl'); return;
  }
  U = locs(bgProg, ['uRes', 'uMouse', 'uFocus', 'uRingC', 'uRing', 'uTime', 'uFlow', 'uPx', 'uMouseOn', 'uFocusI', 'uBg1', 'uBg2', 'uC1', 'uC2']);
  V = locs(ptProg, ['uScale', 'uHalo', 'uTime', 'uTwk', 'uAsp', 'uTanH', 'uCam', 'uTrail', 'uSz', 'uPass', 'uGlowA']);
  W_ = locs(lnProg, ['uAsp', 'uTanH', 'uCam', 'uPk']);
  aBg = gl.getAttribLocation(bgProg, 'aPos');
  aP = {pos: gl.getAttribLocation(ptProg, 'aPos'), col: gl.getAttribLocation(ptProg, 'aColor'), siz: gl.getAttribLocation(ptProg, 'aSize'), tw: gl.getAttribLocation(ptProg, 'aTw'), vel: gl.getAttribLocation(ptProg, 'aVel')};
  aL = {pos: gl.getAttribLocation(lnProg, 'aPos'), col: gl.getAttribLocation(lnProg, 'aCol'), meta: gl.getAttribLocation(lnProg, 'aMeta')};

  /* ---------- colour system (tokens come from the CSS) ---------- */
  var KEYS = ['ink', 'deep', 'royal', 'azure', 'sky', 'dust'];
  var css = getComputedStyle(root);
  function tok(n){ return (css.getPropertyValue(n) || '').trim(); }
  function hex(h){
    h = (h || '#888888').replace('#', ''); if(h.length === 3) h = h.split('').map(function(c){ return c + c; }).join('');
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
  }
  var P = {}; KEYS.forEach(function(k){ P[k] = hex(tok('--gl-' + k)); });
  var BG1 = hex(tok('--bg')), BG2 = hex(tok('--bg-bot'));
  function lerpA(a, b, e){ return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e]; }

  /* aurora colours per section (index = formation order) */
  var FX = [['#2563EB', '#8B5CF6'], ['#22D3EE', '#7C3AED'], ['#6366F1', '#DB2777'], ['#0EA5E9', '#14B8A6'], ['#4F46E5', '#06B6D4'], ['#3B82F6', '#A855F7']].map(function(a){ return [hex(a[0]), hex(a[1])]; });

  /* turn a colour "spec" into rgb using the dark palette */
  function resolve(spec, out, o){
    if(spec.rgb){
      var dr, dg, db;
      if(spec.ink){ dr = P.ink[0]; dg = P.ink[1]; db = P.ink[2]; }
      else if(spec.fl){ dr = P.azure[0]; dg = P.azure[1]; db = P.azure[2]; }
      else {
        var g = Math.min(1, Math.max(0, 1 - (spec.rgb[2] - 0.36) / 0.48));
        dr = P.azure[0] + (P.deep[0] - P.azure[0]) * g; dg = P.azure[1] + (P.deep[1] - P.azure[1]) * g; db = P.azure[2] + (P.deep[2] - P.azure[2]) * g;
      }
      out[o] = dr; out[o + 1] = dg; out[o + 2] = db;
      return;
    }
    var A = P[spec.a], C = P[spec.b], t = spec.t;
    out[o] = A[0] + (C[0] - A[0]) * t; out[o + 1] = A[1] + (C[1] - A[1]) * t; out[o + 2] = A[2] + (C[2] - A[2]) * t;
  }

  /* ---------- formations: each is N pixels arranged as a shape ---------- */
  function pt(x, y, z, s, tag, spec){ return {x: x, y: y, z: z, s: s, tag: tag, spec: spec, ph: Math.random()}; }

  /* connect every node to its 2 nearest neighbours (not too close, not too far) */
  function buildLinks(F){
    var idx = [], i, j, k;
    for(i = 0; i < N; i += NODE_STRIDE) idx.push(i);
    var MIN2 = 0.1 * 0.1, CAP2 = 0.46 * 0.46, seen = {}, pairs = [], rest = [];
    for(i = 0; i < idx.length; i++){
      var a = idx[i], b0 = -1, b1 = -1, d0 = 1e9, d1 = 1e9;
      for(j = 0; j < idx.length; j++){
        if(j === i) continue;
        var b = idx[j], dx = F.x[a] - F.x[b], dy = F.y[a] - F.y[b], dz = F.z[a] - F.z[b], d2 = dx * dx + dy * dy + dz * dz;
        if(d2 < MIN2 || d2 > CAP2) continue;
        if(d2 < d0){ d1 = d0; b1 = b0; d0 = d2; b0 = b; }
        else if(d2 < d1){ d1 = d2; b1 = b; }
      }
      var cand = [[b0, d0], [b1, d1]];
      for(k = 0; k < 2; k++){
        var bb = cand[k][0]; if(bb < 0) continue;
        var key = Math.min(a, bb) * 4096 + Math.max(a, bb);
        if(seen[key]) continue; seen[key] = 1;
        pairs.push(a, bb); rest.push(Math.sqrt(cand[k][1]));
      }
    }
    F.link = new Int16Array(pairs); F.lr = new Float32Array(rest);
    F.lph = new Float32Array(rest.length); for(i = 0; i < rest.length; i++) F.lph[i] = Math.random();
  }

  function finish(list, dustSize, opts){
    if(list.length > N){
      for(var i = list.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var tmp = list[i]; list[i] = list[j]; list[j] = tmp; }
      list.length = N;
    }
    while(list.length < N){   /* leftover pixels drift around the shape, like the ones flying off the logo */
      var a = Math.random() < 0.55 ? 2.4 + (Math.random() + Math.random() + Math.random() - 1.5) * 1.1 : Math.random() * 6.2832;
      var r = 0.88 + Math.random() * 0.3;
      list.push(pt(Math.cos(a) * r, Math.sin(a) * r * 0.85, (Math.random() - 0.5) * 0.8, dustSize * (0.55 + Math.random() * 0.9), 3, {a: 'dust', b: 'sky', t: Math.random()}));
    }
    list.forEach(function(p){ p.k = p.y + (Math.random() - 0.5) * 0.3; });
    list.sort(function(a, b){ return b.k - a.k; });   /* top of one shape flows into top of the next */
    var F = {x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N), s: new Float32Array(N), ph: new Float32Array(N),
             tag: new Uint8Array(N), spec: [], col: new Float32Array(N * 3), beam: !!(opts && opts.beam), sheen: !!(opts && opts.sheen),
             lineAmt: (opts && opts.line != null) ? opts.line : 1};   /* how visible the network is on this shape */
    list.forEach(function(p, i){ F.x[i] = p.x; F.y[i] = p.y; F.z[i] = p.z; F.s[i] = p.s; F.ph[i] = p.ph; F.tag[i] = p.tag; F.spec.push(p.spec); });
    for(var q = 0; q < N; q++){ resolve(F.spec[q], F.col, q * 3); }
    buildLinks(F);
    return F;
  }

  function formLogo(){
    var L = [], st = LOGO.step;
    LOGO.pts.forEach(function(p){
      L.push(pt(p[0], p[1], (Math.random() - 0.5) * 0.03, st * 1.12, 0, {rgb: [p[2] / 255, p[3] / 255, p[4] / 255], ink: p[4] < 80}));
    });
    LOGO.floats.forEach(function(p){
      L.push(pt(p[0], p[1], 0.02, p[5] * 1.05, 1, {rgb: [p[2] / 255, p[3] / 255, p[4] / 255], ink: false, fl: true}));
    });
    return finish(L, st, {sheen: true});
  }

  function formLayers(){
    var L = [], levels = [-0.8, 0, 0.8];
    var cols = [{a: 'deep', b: 'ink'}, {a: 'royal', b: 'deep'}, {a: 'azure', b: 'sky'}];
    var gx = 24, gz = 15;
    levels.forEach(function(y, s){
      for(var i = 0; i < gx; i++){
        for(var j = 0; j < gz; j++){
          var edge = (i === 0 || j === 0 || i === gx - 1 || j === gz - 1);
          L.push(pt(-1 + (i + 0.5) * (2 / gx), y, -0.65 + (j + 0.5) * (1.3 / gz), 0.09, 0,
            edge ? {a: cols[s].a, b: 'sky', t: 0.35} : {a: cols[s].a, b: cols[s].b, t: Math.random() * 0.35}));
        }
      }
    });
    [[-0.95, -0.6], [0.95, -0.6], [-0.95, 0.6], [0.95, 0.6]].forEach(function(c){
      for(var k = 0; k < 4; k++){ L.push(pt(c[0], 0, c[1], 0.075, 2, {a: 'azure', b: 'sky', t: 0.2})); }
    });
    return finish(L, 0.07, {line: 0.45});
  }

  function formBarcode(){
    var L = [], cell = 0.04, cols = Math.floor(2 / cell), rows = Math.floor(1.5 / cell), c = 0, runs = [1, 1, 2, 3];
    while(c < cols){
      var w = runs[Math.floor(Math.random() * runs.length)], gap = 1 + Math.floor(Math.random() * 2);
      for(var k = 0; k < w && c < cols; k++, c++){
        var x = -1 + (c + 0.5) * cell;
        for(var r = 0; r < rows; r++){
          L.push(pt(x, -0.75 + (r + 0.5) * cell, 0, cell * 1.06, 0,
            Math.random() < 0.12 ? {a: 'royal', b: 'azure', t: Math.random()} : {a: 'ink', b: 'deep', t: Math.random() * 0.3}));
        }
      }
      c += gap;
    }
    return finish(L, cell, {beam: true, line: 0.3});
  }

  function formCode(){
    var L = [], sp = 0.036;
    function seg(ax, ay, bx, by, ca, cb){
      var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy), nx = -dy / len, ny = dx / len, n = Math.ceil(len / sp);
      for(var i = 0; i <= n; i++){
        var u = i / n;
        for(var k = -3; k <= 3; k++){
          L.push(pt(ax + dx * u + nx * k * sp * 0.95, ay + dy * u + ny * k * sp * 0.95, (Math.random() - 0.5) * 0.02, sp * 1.05, 0, {a: ca, b: cb, t: u}));
        }
      }
    }
    seg(-0.42, 0.58, -0.98, 0, 'azure', 'royal');
    seg(-0.98, 0, -0.42, -0.58, 'royal', 'azure');
    seg(0.14, 0.75, -0.14, -0.75, 'royal', 'deep');
    seg(0.42, 0.58, 0.98, 0, 'deep', 'ink');
    seg(0.98, 0, 0.42, -0.58, 'ink', 'deep');
    return finish(L, sp, {line: 0.7});
  }

  function formKnot(){
    var L = [], M = 500, p = 2, q = 3, R = 0.66, tube = 0.06;
    function C(u){ var qp = q / p * u, cs = Math.cos(qp), r = R * (2 + cs) * 0.5; return [r * Math.cos(u), r * Math.sin(u), R * Math.sin(qp) * 0.5]; }
    for(var i = 0; i < M; i++){
      var u = i / M * 6.2832 * p, a = C(u), b = C(u + 0.02);
      var T = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.sqrt(T[0] * T[0] + T[1] * T[1] + T[2] * T[2]) || 1;
      T = [T[0] / tl, T[1] / tl, T[2] / tl];
      var Nn = [T[1], -T[0], 0], nl = Math.sqrt(Nn[0] * Nn[0] + Nn[1] * Nn[1]);
      if(nl < 1e-3){ Nn = [1, 0, 0]; nl = 1; }
      Nn = [Nn[0] / nl, Nn[1] / nl, Nn[2] / nl];
      var Bn = [T[1] * Nn[2] - T[2] * Nn[1], T[2] * Nn[0] - T[0] * Nn[2], T[0] * Nn[1] - T[1] * Nn[0]];
      var t = i / M, spec = t < 0.5 ? {a: 'azure', b: 'royal', t: t * 2} : {a: 'royal', b: 'deep', t: (t - 0.5) * 2};
      for(var k = 0; k < 2; k++){
        var an = i * 0.9 + k * 3.1416, ca = Math.cos(an) * tube, sa = Math.sin(an) * tube;
        L.push(pt(a[0] + Nn[0] * ca + Bn[0] * sa, a[1] + Nn[1] * ca + Bn[1] * sa, a[2] + Nn[2] * ca + Bn[2] * sa, 0.046, 0, spec));
      }
    }
    return finish(L, 0.05);
  }

  var FORMS = {logo: formLogo(), layers: formLayers(), barcode: formBarcode(), code: formCode(), knot: formKnot()};
  var MAXLINES = 0; for(var fk in FORMS){ MAXLINES = Math.max(MAXLINES, FORMS[fk].lr.length); }

  /* ---------- per-pixel state ---------- */
  var stag = new Float32Array(N), st2 = new Float32Array(N), swirl = new Float32Array(N), dirx = new Float32Array(N), diry = new Float32Array(N), dirz = new Float32Array(N);
  var cloud = new Float32Array(N * 3), tw = new Float32Array(N);
  var ox = new Float32Array(N), oy = new Float32Array(N), oz = new Float32Array(N);        /* spring offset  */
  var vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);        /* spring velocity */
  var hot = new Float32Array(N), heat = new Float32Array(N), asm = new Float32Array(N);    /* afterglow, flash, "assembled" 0..1 */
  var prev = new Float32Array(N * 3), tv = new Float32Array(N * 3), fresh = true;          /* trail velocity */
  for(var i = 0; i < N; i++){
    stag[i] = Math.random(); st2[i] = Math.random(); tw[i] = Math.random();
    swirl[i] = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65);
    var ang = Math.random() * 6.2832;
    dirx[i] = Math.cos(ang) * (0.4 + Math.random()); diry[i] = Math.sin(ang) * (0.4 + Math.random()); dirz[i] = (Math.random() - 0.5) * 1.6;
    var ca = Math.random() * 6.2832, cr = 5 + Math.random() * 11;     /* intro: start in a wide dark ring around the screen */
    cloud[i * 3] = Math.cos(ca) * cr * 1.25; cloud[i * 3 + 1] = Math.sin(ca) * cr * 0.8; cloud[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  /* ---------- GPU buffers ---------- */
  var pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), vel = new Float32Array(N * 3);
  var bPos = makeBuf(pos, gl.DYNAMIC_DRAW), bCol = makeBuf(col, gl.DYNAMIC_DRAW), bSiz = makeBuf(siz, gl.DYNAMIC_DRAW), bTw = makeBuf(tw, gl.STATIC_DRAW), bVel = makeBuf(vel, gl.DYNAMIC_DRAW);
  var bTri = makeBuf(new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var lnPos = new Float32Array(MAXLINES * 6), lnCol = new Float32Array(MAXLINES * 8), lnMeta = new Float32Array(MAXLINES * 4);
  var bLnPos = makeBuf(lnPos, gl.DYNAMIC_DRAW), bLnCol = makeBuf(lnCol, gl.DYNAMIC_DRAW), bLnMeta = makeBuf(lnMeta, gl.DYNAMIC_DRAW);

  /* ---------- pointer, clicks ---------- */
  var mouse = {x: 0, y: 0, tx: 0, ty: 0}, mc = {x: -9999, y: -9999}, mOn = 0;
  var mw = {x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0};        /* pointer in world units + its velocity */
  var waves = [], uppNow = 0.02, W = 1, H = 1, t = 0;
  function sc(){ return window.scrollY || window.pageYOffset || 0; }

  function addWave(x, y, o){
    waves.push({x: x, y: y, t0: t, speed: o.speed, sig: o.sig, amp: o.amp, decay: o.decay, push: o.push, lift: o.lift, life: o.life});
    if(waves.length > 5) waves.shift();
  }
  var W_CLICK = {speed: 9.5, sig: 0.55, amp: 1.0, decay: 0.85, push: 62, lift: 6, life: 3.4};
  var W_PULSE = {speed: 6.2, sig: 0.62, amp: 0.85, decay: 0.5, push: 9, lift: 2.2, life: 5.5};
  var W_BOOT  = {speed: 8.0, sig: 0.75, amp: 1.0, decay: 0.55, push: 30, lift: 4.5, life: 5.0};

  window.addEventListener('pointermove', function(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    mc.x = e.clientX; mc.y = e.clientY;
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, {passive: true});
  document.addEventListener('mouseleave', function(){ mc.x = mc.y = -9999; });
  window.addEventListener('pointerdown', function(e){
    if(reduce.matches) return;
    var tg = e.target; if(tg && tg.closest && tg.closest('input,textarea,select')) return;
    addWave((e.clientX - W / 2) * uppNow, -(e.clientY - H / 2) * uppNow, W_CLICK);
  }, {passive: true});

  /* ---------- where each formation lives on the page ---------- */
  var ANCH = [
    {stage: '#stage-hero',     sec: '#top',      form: 'logo',    fit: 0.9,  rot: function(t){ return [mouse.x * 0.35 + Math.sin(t * 0.4) * 0.06, mouse.y * 0.25]; }},
    {stage: '#stage-services', sec: '#services', form: 'layers',  fit: 0.68, rot: function(t){ return [t * 0.35 - 0.5 + mouse.x * 0.2, 0.42 + mouse.y * 0.1]; }},
    {stage: '#stage-pos',      sec: '#pos',      form: 'barcode', fit: 0.8,  rot: function(t){ return [Math.sin(t * 0.4) * 0.35 + mouse.x * 0.25, mouse.y * 0.15 - 0.1]; }},
    {stage: '#stage-students', sec: '#students', form: 'code',    fit: 0.92, rot: function(t){ return [Math.sin(t * 0.5) * 0.4 + mouse.x * 0.25, mouse.y * 0.15]; }},
    {stage: '#stage-process',  sec: '#process',  form: 'knot',    fit: 0.82, rot: function(t){ return [Math.sin(t * 0.35 + sc() * 0.002) * 0.5 + mouse.x * 0.2, 0.15 + Math.sin(t * 0.4) * 0.08 + mouse.y * 0.1]; }},
    {stage: '#stage-contact',  sec: '#contact',  form: 'logo',    fit: 0.9,  rot: function(t){ return [mouse.x * 0.35 + Math.sin(t * 0.4) * 0.06, mouse.y * 0.25]; }}
  ];
  ANCH.forEach(function(a, idx){ a.idx = idx; });
  ANCH = ANCH.filter(function(a){
    a.stageEl = document.querySelector(a.stage); a.secEl = document.querySelector(a.sec);
    a.f = FORMS[a.form]; a.c = {X: 0, Y: 0, S: 1, cy: 1, sy: 0, cx: 1, sx: 0};
    return a.stageEl && a.secEl;
  });
  if(ANCH.length < 2){ root.classList.add('no-gl'); return; }

  /* ---------- sizing (with a simple quality governor for slow GPUs) ---------- */
  var dprCap = Math.min(window.devicePixelRatio || 1, 1.5), dpr = 1;
  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    ANCH.forEach(function(a){ a.ref = (getComputedStyle(a.stageEl).position.indexOf('sticky') > -1) ? a.secEl : a.stageEl; });
  }
  window.addEventListener('resize', resize);
  resize();

  function smooth(a, b, x){ var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function ctx(a, tt, upp){
    var r = a.stageEl.getBoundingClientRect(), rot = a.rot(tt), c = a.c;
    var breath = 1 + 0.012 * Math.sin(tt * 0.8 + a.idx);
    c.X = (r.left + r.width / 2 - W / 2) * upp;
    c.Y = -(r.top + r.height / 2 - H / 2) * upp;
    c.S = Math.max(0.001, Math.min(r.width, r.height) * upp / 2 * a.fit) * breath;
    c.cy = Math.cos(rot[0]); c.sy = Math.sin(rot[0]); c.cx = Math.cos(rot[1]); c.sx = Math.sin(rot[1]);
  }
  function lp(f, i, tt, c, out){
    var x = f.x[i], y = f.y[i], z = f.z[i], s = f.s[i], tag = f.tag[i], ph = f.ph[i];
    if(tag === 1){ x += Math.sin(tt * 0.7 + ph * 6.283) * 0.035; y += Math.cos(tt * 0.6 + ph * 6.283) * 0.035; }
    else if(tag === 2){ y = -0.8 + ((tt * 0.4 + ph) % 1) * 1.6; }
    else if(tag === 3){ x += Math.sin(tt * 0.5 + ph * 6.283) * 0.05; y += Math.cos(tt * 0.45 + ph * 6.283) * 0.05; }
    var x1 = x * c.cy + z * c.sy, z1 = -x * c.sy + z * c.cy;
    out[0] = c.X + x1 * c.S;
    out[1] = c.Y + (y * c.cx - z1 * c.sx) * c.S;
    out[2] = (y * c.sx + z1 * c.cx) * c.S;
    out[3] = s * c.S;
  }
  var o1 = [0, 0, 0, 0], o2 = [0, 0, 0, 0], c1 = [0, 0, 0], c2 = [0, 0, 0], centers = [];

  function colorOf(f, i, beam, sheenPos, out){
    var b = i * 3; out[0] = f.col[b]; out[1] = f.col[b + 1]; out[2] = f.col[b + 2];
    if(f.beam){
      var g = 1 - Math.abs(f.x[i] - beam) / 0.13;
      if(g > 0){ g *= g; var az = P.azure; out[0] += (az[0] - out[0]) * g; out[1] += (az[1] - out[1]) * g; out[2] += (az[2] - out[2]) * g; }
    }
    if(f.sheen){
      var h = 1 - Math.abs((f.x[i] + f.y[i]) * 0.7071 - sheenPos) / 0.22;
      if(h > 0){ h = h * h * 0.8; out[0] += (1 - out[0]) * h; out[1] += (1 - out[1]) * h; out[2] += (1 - out[2]) * h; }
    }
  }

  var t0 = performance.now(), last = t0, flow = 0, lastY = sc(), ema = 0.016, frames = 0;
  var INTRO_MS = 3400, introDone = false, sheenT0 = 0, nextPulse = 0, nextGlitch = 0;
  var scrollV = 0, sSmooth = 0, govOff = !!window.__noGov;

  function frame(now){
    var raw = (now - last) / 1000; last = now;
    var dt = Math.min(raw, 0.05); if(dt < 0.0005) dt = 0.0005;
    var still = reduce.matches;
    if(!still) t += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
    mOn += ((mc.x > -900 && !still ? 1 : 0) - mOn) * 0.08;

    /* quality governor: first lower the resolution, then drop trails, then the network */
    ema = ema * 0.94 + Math.min(raw, 0.1) * 0.06; frames++;
    if(!govOff && frames % 90 === 0 && now - t0 > 3500 && ema > 0.027){
      if(dprCap > 0.8){ dprCap = Math.max(0.75, dprCap * 0.8); resize(); }
      else if(feat.trails){ feat.trails = false; }
      else if(feat.lines){ feat.lines = false; }
    }

    var y0 = sc(), upp = 2 * FOV_TAN * CAM_Z / H; uppNow = upp;
    var sdy = y0 - lastY;
    flow += (still ? 0 : dt * 0.05) + sdy * 0.0011; lastY = y0;
    sSmooth += ((sdy / dt) * upp - sSmooth) * 0.18;                       /* page scroll speed, world units / s */
    scrollV = Math.max(-14, Math.min(14, sSmooth));
    var mx = (mc.x - W / 2) * upp, my = -(mc.y - H / 2) * upp;
    mw.x = mx; mw.y = my;
    if(mc.x > -900 && Math.abs(mx - mw.px) < 3 && Math.abs(my - mw.py) < 3){
      mw.vx += (Math.max(-30, Math.min(30, (mx - mw.px) / dt)) - mw.vx) * 0.25;
      mw.vy += (Math.max(-30, Math.min(30, (my - mw.py) / dt)) - mw.vy) * 0.25;
    } else { mw.vx *= 0.85; mw.vy *= 0.85; }
    mw.px = mx; mw.py = my;
    var ik = still ? 1 : Math.min((now - t0) / INTRO_MS, 1);

    /* which two formations are we between, and how far? */
    var K = ANCH.length, vyp = y0 + H * 0.5, k = 0, u = 0;
    for(var a = 0; a < K; a++){ var r = ANCH[a].ref.getBoundingClientRect(); centers[a] = r.top + y0 + r.height / 2; }
    if(vyp <= centers[0]){ k = 0; u = 0; }
    else if(vyp >= centers[K - 1]){ k = K - 2; u = 1; }
    else { while(k < K - 2 && vyp >= centers[k + 1]) k++; u = (vyp - centers[k]) / (centers[k + 1] - centers[k]); }

    var A = ANCH[k], B = ANCH[k + 1];
    ctx(A, t, upp); ctx(B, t, upp);
    var dom = u < 0.5 ? A : B;

    /* events: intro finish, automatic energy pulse, glitch */
    if(!still){
      if(!introDone && ik >= 1){ introDone = true; sheenT0 = t; addWave(dom.c.X, dom.c.Y, W_BOOT); nextPulse = t + 7; nextGlitch = t + 5; }
      if(introDone && t > nextPulse){ addWave(dom.c.X, dom.c.Y, W_PULSE); nextPulse = t + 6.5 + Math.random() * 3.5; }
      if(introDone && t > nextGlitch){
        nextGlitch = t + 9 + Math.random() * 6;
        var gy = dom.c.Y + (Math.random() - 0.45) * dom.c.S * 1.3, gh = dom.c.S * (0.05 + Math.random() * 0.06);
        for(var g = 0; g < N; g++){
          if(Math.abs(pos[g * 3 + 1] - gy) < gh){ vx[g] += (Math.random() - 0.3) * 11; hot[g] = 1; }
        }
      }
    } else if(!introDone){ introDone = true; }
    for(var wi = waves.length - 1; wi >= 0; wi--){ if(t - waves[wi].t0 > waves[wi].life) waves.splice(wi, 1); }

    var beam = -1.15 + ((t * 0.55) % 1) * 2.3;
    var sheenPos = -1.6 + (((t - sheenT0) / 7) % 1) * 7;
    var R = 1.15, R2 = R * R, hotDecay = Math.exp(-dt * 4.2), nW = waves.length;
    var toyBase = -scrollV * 0.05;

    for(var i = 0; i < N; i++){
      var e = smooth(0.12 + 0.4 * stag[i], 0.52 + 0.4 * stag[i], u);
      lp(A.f, i, t, A.c, o1); lp(B.f, i, t, B.c, o2);
      var dxm = o2[0] - o1[0], dym = o2[1] - o1[1], L = Math.sqrt(dxm * dxm + dym * dym) + 1e-3;
      var arc = Math.sin(Math.PI * e), sw = swirl[i] * arc * Math.min(L, 6) * 0.32;
      var x = o1[0] + dxm * e + (-dym / L) * sw + dirx[i] * arc * 0.25;
      var y = o1[1] + dym * e + (dxm / L) * sw + diry[i] * arc * 0.25;
      var z = o1[2] + (o2[2] - o1[2]) * e + dirz[i] * arc * 0.6;
      var s = (o1[3] + (o2[3] - o1[3]) * e) * (1 + 0.25 * arc);

      colorOf(A.f, i, beam, sheenPos, c1); colorOf(B.f, i, beam, sheenPos, c2);
      var cr = c1[0] + (c2[0] - c1[0]) * e, cg = c1[1] + (c2[1] - c1[1]) * e, cb = c1[2] + (c2[2] - c1[2]) * e;

      /* intro: pixels spiral in from the dark and lock into place, glowing white-hot */
      var ei = 1, fl = hot[i] * hotDecay; hot[i] = fl;
      if(ik < 1){
        ei = smooth(st2[i] * 0.55, st2[i] * 0.55 + 0.45, ik);
        var rem = Math.pow(1 - ei, 3), an = swirl[i] * rem * 3.0, cs = Math.cos(an), sn = Math.sin(an);
        var rx = cloud[i * 3] - x, ry = cloud[i * 3 + 1] - y;
        x += (rx * cs - ry * sn) * rem; y += (rx * sn + ry * cs) * rem; z += (cloud[i * 3 + 2] - z) * rem;
        s *= 0.4 + 0.6 * ei;
        fl = Math.max(fl, (1 - ei) * 0.55);
      }
      asm[i] = (1 - arc) * smooth(0.7, 1, ei);

      /* spring physics + forces */
      var fx = x, fy = y, fz = z;
      if(!still){
        var Ki = 34 * (0.8 + 0.5 * st2[i]), Ci = 6.4;
        var px = x + ox[i], py = y + oy[i];
        var ax = -Ki * ox[i] - Ci * vx[i], ay = -Ki * (oy[i] - toyBase * (0.35 + 0.65 * stag[i])) - Ci * vy[i], az = -Ki * oz[i] - Ci * vz[i];

        var dxp = px - mx, dyp = py - my, d2 = dxp * dxp + dyp * dyp;
        if(d2 < R2 && d2 > 1e-6){
          var dd = Math.sqrt(d2), f = 1 - dd / R; f = f * f;
          ax += dxp / dd * 78 * f - dyp / dd * 34 * f + mw.vx * f * 2.2;
          ay += dyp / dd * 78 * f + dxp / dd * 34 * f + mw.vy * f * 2.2;
          az += 20 * f;
          if(f > 0.2 && f * 0.9 > fl) fl = f * 0.9;
          hot[i] = Math.max(hot[i], f * 0.75);
        }
        for(var w = 0; w < nW; w++){
          var wv = waves[w], age = t - wv.t0, rr = age * wv.speed;
          var wdx = px - wv.x, wdy = py - wv.y, wd = Math.sqrt(wdx * wdx + wdy * wdy) + 1e-4;
          var q = (wd - rr) / wv.sig, gq = Math.exp(-q * q) * wv.amp * Math.exp(-age * wv.decay);
          if(gq > 0.002){
            ax += wdx / wd * gq * wv.push; ay += wdy / wd * gq * wv.push; az += gq * wv.lift;
            if(gq > fl) fl = gq;
            if(gq * 0.6 > hot[i]) hot[i] = gq * 0.6;
          }
        }
        vx[i] += ax * dt; vy[i] += ay * dt; vz[i] += az * dt;
        ox[i] += vx[i] * dt; oy[i] += vy[i] * dt; oz[i] += vz[i] * dt;
        if(oz[i] > 4) oz[i] = 4; else if(oz[i] < -2.5) oz[i] = -2.5;
        fx = x + ox[i]; fy = y + oy[i]; fz = z + oz[i];
      }

      if(fl > 0.001){ var kf = Math.min(1, fl); cr += (0.72 - cr) * kf; cg += (0.95 - cg) * kf; cb += (1.0 - cb) * kf; s *= 1 + 0.4 * kf; }
      if(i % NODE_STRIDE === 0) s *= 1.22;
      fl = Math.min(1, fl); heat[i] = fl;

      var b3 = i * 3;
      pos[b3] = fx; pos[b3 + 1] = fy; pos[b3 + 2] = fz;
      col[b3] = cr; col[b3 + 1] = cg; col[b3 + 2] = cb;
      siz[i] = s;

      /* trail velocity (world units / s), smoothed and clamped */
      if(fresh){ prev[b3] = fx; prev[b3 + 1] = fy; prev[b3 + 2] = fz; }
      var tvx = (fx - prev[b3]) / dt, tvy = (fy - prev[b3 + 1]) / dt, tvz = (fz - prev[b3 + 2]) / dt;
      prev[b3] = fx; prev[b3 + 1] = fy; prev[b3 + 2] = fz;
      tv[b3] += (tvx - tv[b3]) * 0.3; tv[b3 + 1] += (tvy - tv[b3 + 1]) * 0.3; tv[b3 + 2] += (tvz - tv[b3 + 2]) * 0.3;
      var sp2 = tv[b3] * tv[b3] + tv[b3 + 1] * tv[b3 + 1], lim = 26;
      if(sp2 > lim * lim){ var sc2 = lim / Math.sqrt(sp2); vel[b3] = tv[b3] * sc2; vel[b3 + 1] = tv[b3 + 1] * sc2; }
      else { vel[b3] = tv[b3]; vel[b3 + 1] = tv[b3 + 1]; }
      vel[b3 + 2] = 0;
    }
    fresh = false;

    /* ---- network of links between nodes ---- */
    var lc = 0;
    if(feat.lines){
      var lf = (u < 0.5 ? A : B), Sref = (u < 0.5 ? A.c.S : B.c.S), LK = lf.f.link, LR = lf.f.lr, LP = lf.f.lph, cnt = LR.length;
      var az0 = P.azure;
      for(var j = 0; j < cnt; j++){
        var ia = LK[2 * j], ib = LK[2 * j + 1], a3 = ia * 3, b3b = ib * 3;
        var ddx = pos[a3] - pos[b3b], ddy = pos[a3 + 1] - pos[b3b + 1], ddz = pos[a3 + 2] - pos[b3b + 2];
        var len = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz), rest = LR[j] * Sref;
        var al = (1 - smooth(1.25, 2.7, len / rest)) * asm[ia] * asm[ib];
        if(al < 0.03) continue;
        var hh = Math.max(heat[ia], heat[ib]);
        al *= 0.34 * lf.f.lineAmt * (1 + 1.8 * hh);
        var o6 = lc * 6, o8 = lc * 8, o4 = lc * 4;
        lnPos[o6] = pos[a3]; lnPos[o6 + 1] = pos[a3 + 1]; lnPos[o6 + 2] = pos[a3 + 2];
        lnPos[o6 + 3] = pos[b3b]; lnPos[o6 + 4] = pos[b3b + 1]; lnPos[o6 + 5] = pos[b3b + 2];
        var lr = (col[a3] + col[b3b]) * 0.25 + az0[0] * 0.5, lg = (col[a3 + 1] + col[b3b + 1]) * 0.25 + az0[1] * 0.5, lb = (col[a3 + 2] + col[b3b + 2]) * 0.25 + az0[2] * 0.5;
        lnCol[o8] = lr; lnCol[o8 + 1] = lg; lnCol[o8 + 2] = lb; lnCol[o8 + 3] = al;
        lnCol[o8 + 4] = lr; lnCol[o8 + 5] = lg; lnCol[o8 + 6] = lb; lnCol[o8 + 7] = al;
        lnMeta[o4] = 0; lnMeta[o4 + 1] = LP[j]; lnMeta[o4 + 2] = 1; lnMeta[o4 + 3] = LP[j];
        lc++;
      }
    }

    /* ---- aurora colours + light focus + ring for this frame ---- */
    var fpos = k + u, ia2 = Math.min(Math.floor(fpos), K - 1), ib2 = Math.min(ia2 + 1, K - 1), fr = smooth(0, 1, fpos - Math.floor(fpos));
    var fx1 = lerpA(FX[ia2][0], FX[ib2][0], fr), fx2 = lerpA(FX[ia2][1], FX[ib2][1], fr);
    var eF = smooth(0.2, 0.8, u), fX = A.c.X + (B.c.X - A.c.X) * eF, fY = A.c.Y + (B.c.Y - A.c.Y) * eF;
    var focusI = (0.2 + 0.08 * Math.sin(t * 1.3)) * smooth(0, 0.6, ik);
    var ringR = 0, ringW = 1, ringA = 0, ringX = 0, ringY = 0;
    if(waves.length){
      var nw = waves[waves.length - 1], nAge = t - nw.t0;
      ringR = nAge * nw.speed / upp * dpr; ringW = 0.55 / upp * dpr;
      ringA = Math.exp(-nAge * nw.decay) * nw.amp * 0.7;
      ringX = (W / 2 + nw.x / upp) * dpr; ringY = (H / 2 + nw.y / upp) * dpr;
    }

    /* ---- draw: background ---- */
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.useProgram(bgProg);
    attrsOff(); attr(bTri, aBg, 2);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uMouse, mc.x * dpr, (H - mc.y) * dpr);
    gl.uniform2f(U.uFocus, (W / 2 + fX / upp) * dpr, (H / 2 + fY / upp) * dpr);
    gl.uniform2f(U.uRingC, ringX, ringY); gl.uniform3f(U.uRing, ringR, ringW, ringA);
    gl.uniform1f(U.uTime, t); gl.uniform1f(U.uFlow, flow); gl.uniform1f(U.uPx, dpr); gl.uniform1f(U.uMouseOn, mOn); gl.uniform1f(U.uFocusI, focusI);
    gl.uniform3f(U.uBg1, BG1[0], BG1[1], BG1[2]); gl.uniform3f(U.uBg2, BG2[0], BG2[1], BG2[2]);
    gl.uniform3f(U.uC1, fx1[0], fx1[1], fx1[2]); gl.uniform3f(U.uC2, fx2[0], fx2[1], fx2[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* ---- draw: pixels (solid) ---- */
    gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, bCol); gl.bufferSubData(gl.ARRAY_BUFFER, 0, col);
    gl.bindBuffer(gl.ARRAY_BUFFER, bSiz); gl.bufferSubData(gl.ARRAY_BUFFER, 0, siz);
    gl.bindBuffer(gl.ARRAY_BUFFER, bVel); gl.bufferSubData(gl.ARRAY_BUFFER, 0, vel);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.useProgram(ptProg);
    attrsOff(); attr(bPos, aP.pos, 3); attr(bCol, aP.col, 3); attr(bSiz, aP.siz, 1); attr(bTw, aP.tw, 1); attr(bVel, aP.vel, 3);
    gl.uniform1f(V.uScale, (canvas.height / 2) / FOV_TAN); gl.uniform1f(V.uTime, t); gl.uniform1f(V.uTwk, 0.13);
    gl.uniform1f(V.uAsp, canvas.width / canvas.height); gl.uniform1f(V.uTanH, FOV_TAN); gl.uniform1f(V.uCam, CAM_Z);
    gl.uniform1f(V.uPass, 0); gl.uniform1f(V.uHalo, 0); gl.uniform1f(V.uGlowA, 0); gl.uniform1f(V.uTrail, 0); gl.uniform1f(V.uSz, 1);
    gl.drawArrays(gl.POINTS, 0, N);

    /* ---- draw: additive layers (network, trails, glow) ---- */
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ZERO, gl.ONE); gl.depthMask(false);

    if(lc > 0){
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(lnProg); attrsOff();
      gl.bindBuffer(gl.ARRAY_BUFFER, bLnPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, lnPos.subarray(0, lc * 6)); attr(bLnPos, aL.pos, 3);
      gl.bindBuffer(gl.ARRAY_BUFFER, bLnCol); gl.bufferSubData(gl.ARRAY_BUFFER, 0, lnCol.subarray(0, lc * 8)); attr(bLnCol, aL.col, 4);
      gl.bindBuffer(gl.ARRAY_BUFFER, bLnMeta); gl.bufferSubData(gl.ARRAY_BUFFER, 0, lnMeta.subarray(0, lc * 4)); attr(bLnMeta, aL.meta, 2);
      gl.uniform1f(W_.uAsp, canvas.width / canvas.height); gl.uniform1f(W_.uTanH, FOV_TAN); gl.uniform1f(W_.uCam, CAM_Z); gl.uniform1f(W_.uPk, (t * 0.3) % 1);
      gl.drawArrays(gl.LINES, 0, lc * 2);
      gl.enable(gl.DEPTH_TEST);
    }

    gl.useProgram(ptProg);
    attrsOff(); attr(bPos, aP.pos, 3); attr(bCol, aP.col, 3); attr(bSiz, aP.siz, 1); attr(bTw, aP.tw, 1); attr(bVel, aP.vel, 3);
    if(feat.trails && !still){
      gl.uniform1f(V.uPass, 2); gl.uniform1f(V.uHalo, 0);
      var TA = [0.34, 0.2, 0.1], TS = [0.9, 0.74, 0.58];
      for(var ts = 0; ts < 3; ts++){
        gl.uniform1f(V.uTrail, 0.022 * (ts + 1)); gl.uniform1f(V.uSz, TS[ts]); gl.uniform1f(V.uGlowA, TA[ts]);
        gl.drawArrays(gl.POINTS, 0, N);
      }
      gl.uniform1f(V.uTrail, 0); gl.uniform1f(V.uSz, 1);
    }
    gl.uniform1f(V.uPass, 1); gl.uniform1f(V.uHalo, 1.25); gl.uniform1f(V.uGlowA, 0.34);   /* glow around every pixel */
    gl.drawArrays(gl.POINTS, 0, N);
    gl.disable(gl.BLEND); gl.depthMask(true);

    requestAnimationFrame(frame);
  }
  canvas.addEventListener('webglcontextlost', function(e){ e.preventDefault(); root.classList.add('no-gl'); }, false);
  requestAnimationFrame(frame);
})();
