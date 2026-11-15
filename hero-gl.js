/* Lesehesten UB – varmt papirlys og svevende stjerner i toppen.
   Ren WebGL (ingen bibliotek), halv oppløsning, pauser når hero ikke synes. */
(function () {
  'use strict';
  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uScroll;uniform float uMobile;',
    'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'vec2 h2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(h1(i),h1(i+vec2(1.,0.)),u.x),mix(h1(i+vec2(0.,1.)),h1(i+vec2(1.,1.)),u.x),u.y);}',
    /* firetagget gnist */
    'float spark(vec2 d,float s){d/=s;float r=length(d);',
    ' float cr=exp(-abs(d.x)*14.)*exp(-abs(d.y)*2.2)+exp(-abs(d.y)*14.)*exp(-abs(d.x)*2.2);',
    ' return (cr*.55+exp(-r*r*18.))*smoothstep(1.,.2,r);}',
    'float layer(vec2 uv,float sc,float sp,float t,float seed){',
    ' vec2 g=uv*sc+vec2(0.,t*sp);vec2 id=floor(g);vec2 f=fract(g)-.5;',
    ' vec2 o=h2(id+seed)-.5;float on=step(.78,h1(id+seed*3.1));',
    ' float tw=.5+.5*sin(t*(1.2+h1(id)*1.6)+h1(id+7.)*6.28);',
    ' float sz=.16+.18*h1(id+seed*1.7);',
    ' return on*spark(f-o*.6,sz)*tw;}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;float t=uTime;',
    ' vec2 m=uMouse*vec2(.12,-.08);',
    /* myke, varme lysflekker som puster (papirglød) */
    ' vec2 c1=vec2(mix(.42,.0,uMobile)*uRes.x/uRes.y,mix(.05,.28,uMobile))+m+vec2(sin(t*.21)*.04,cos(t*.17)*.03);',
    ' vec2 c2=vec2(-.55*uRes.x/uRes.y,.35)+m*.5+vec2(cos(t*.13)*.05,sin(t*.19)*.04);',
    ' float n=noise(uv*3.+vec2(t*.05,-t*.04));',
    ' float g1=exp(-dot(uv-c1,uv-c1)*mix(3.2,4.5,uMobile))*(.75+.25*n);',
    ' float g2=exp(-dot(uv-c2,uv-c2)*6.)*.45;',
    ' vec3 sun=vec3(.965,.77,.33);vec3 peach=vec3(.97,.75,.6);',
    ' vec3 col=sun*g1*.4+peach*g2*.4;',
    ' float a=g1*.38+g2*.25;',
    /* stjerner som driver sakte oppover og blinker */
    ' vec2 su=uv+m*.4+vec2(0.,uScroll*.2);',
    ' float s=layer(su,5.5,.06,t,1.)+layer(su+.37,9.,.1,t,4.)*.45;',
    ' vec3 gold=vec3(.91,.66,.16);vec3 chest=vec3(.78,.41,.16);',
    ' vec3 sc=mix(gold,chest,step(.7,h1(floor(su*5.5))));',
    ' s*=mix(.55,1.,smoothstep(.0,.6,g1+g2+.25));',
    ' col+=sc*s;a+=s;',
    ' a=clamp(a,0.,1.)*(1.-smoothstep(.3,1.1,uScroll)*.7);col*=1.-smoothstep(.3,1.1,uScroll)*.7;',
    ' gl_FragColor=vec4(col,a);}'
  ].join('\n');

  window.startHeroGl = function (canvas) {
    var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return;
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var u = function (n) { return gl.getUniformLocation(prog, n); };
    var uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uScroll = u('uScroll'), uMobile = u('uMobile');

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var host = canvas.parentElement;
    var h = 1;
    var quality = Math.min(window.devicePixelRatio || 1, 2) * 0.6;
    function layout() {
      var w = host.clientWidth; h = host.clientHeight;
      canvas.width = Math.max(1, Math.round(w * quality));
      canvas.height = Math.max(1, Math.round(h * quality));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uMobile, w < 820 ? 1 : 0);
    }
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); if (reduce) frame(0); }).observe(host);

    var tx = 0, ty = 0, mx = 0, my = 0;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    var visible = true, raf = 0, t0 = performance.now();
    function frame(now) {
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      gl.uniform1f(uTime, reduce ? 6 : (now - t0) / 1000);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uScroll, Math.min(window.scrollY / Math.max(h, 1), 1.5));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function tick(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      frame(now);
      raf = requestAnimationFrame(tick);
    }
    function wake() {
      if (reduce) { frame(0); return; }
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; wake(); }).observe(host);
    document.addEventListener('visibilitychange', wake);
    frame(performance.now());
    canvas.classList.add('is-on');
    wake();
  };
})();
