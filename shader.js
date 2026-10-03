(function () {
  "use strict";

  var VERTEX_SRC = [
    "attribute vec2 a_position;",
    "void main() {",
    "  gl_Position = vec4(a_position, 0.0, 1.0);",
    "}"
  ].join("\n");

  // Port of design-assets/soft-shape.glsl. The original samples an SDF texture
  // provided by the canvas renderer; here the rounded-rectangle SDF is computed
  // analytically so the effect can run standalone in the browser.
  var FRAGMENT_SRC = [
    "precision highp float;",
    "",
    "uniform vec2 u_resolution;",
    "uniform vec2 u_size;",
    "uniform float u_radius;",
    "uniform vec3 u_color;",
    "uniform float u_lightAngle;",
    "uniform float u_scatter;",
    "uniform float u_density;",
    "uniform float u_ambient;",
    "uniform float u_softness;",
    "uniform float u_noise;",
    "uniform float u_noiseScale;",
    "",
    "vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }",
    "vec3 toGamma(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }",
    "",
    "vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
    "vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
    "vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }",
    "",
    "float snoise(vec2 v) {",
    "  const vec4 C = vec4(0.211324865405187, 0.366025403784439,",
    "      -0.577350269189626, 0.024390243902439);",
    "  vec2 i = floor(v + dot(v, C.yy));",
    "  vec2 x0 = v - i + dot(i, C.xx);",
    "  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);",
    "  vec4 x12 = x0.xyxy + C.xxzz;",
    "  x12.xy -= i1;",
    "  i = mod289(i);",
    "  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));",
    "  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);",
    "  m = m * m;",
    "  m = m * m;",
    "  vec3 x = 2.0 * fract(p * C.www) - 1.0;",
    "  vec3 h = abs(x) - 0.5;",
    "  vec3 ox = floor(x + 0.5);",
    "  vec3 a0 = x - ox;",
    "  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);",
    "  vec3 g;",
    "  g.x = a0.x * x0.x + h.x * x0.y;",
    "  g.yz = a0.yz * x12.xz + h.yz * x12.yw;",
    "  return 130.0 * dot(m, g);",
    "}",
    "",
    "float fbm(vec2 p) {",
    "  float sum = 0.0;",
    "  float amp = 0.5;",
    "  float norm = 0.0;",
    "  for (int i = 0; i < 5; i++) {",
    "    sum += amp * snoise(p);",
    "    norm += amp;",
    "    p = p * 2.0 + 19.0;",
    "    amp *= 0.5;",
    "  }",
    "  return sum / norm;",
    "}",
    "",
    "float shapeDepth(vec2 fragPos) {",
    "  vec2 halfSize = u_size * 0.5;",
    "  vec2 p = fragPos - halfSize;",
    "  float r = min(u_radius, min(halfSize.x, halfSize.y));",
    "  vec2 q = abs(p) - halfSize + vec2(r);",
    "  float sd = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;",
    "  return -sd;",
    "}",
    "",
    "float lightThickness(vec2 fragPos, vec2 L) {",
    "  float t = 0.0;",
    "  for (int i = 0; i < 160; i++) {",
    "    vec2 p = fragPos + L * t;",
    "    if (p.x < 0.0 || p.x > u_size.x || p.y < 0.0 || p.y > u_size.y) {",
    "      break;",
    "    }",
    "    float r = shapeDepth(p);",
    "    if (r <= 0.0) {",
    "      break;",
    "    }",
    "    t += max(r, 1.0);",
    "  }",
    "  return t;",
    "}",
    "",
    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / u_resolution;",
    "",
    "  float depth = shapeDepth(gl_FragCoord.xy);",
    "  if (depth <= 0.0) {",
    "    gl_FragColor = vec4(0.0);",
    "    return;",
    "  }",
    "",
    "  float penetration = max(u_scatter * min(u_resolution.x, u_resolution.y), 1.0);",
    "",
    "  float aspect = u_resolution.x / u_resolution.y;",
    "  vec2 np = (uv - 0.5) * vec2(aspect, 1.0) * u_noiseScale;",
    "  float clouds = fbm(np);",
    "  penetration *= clamp(1.0 + u_noise * clouds, 0.2, 3.0);",
    "",
    "  vec3 colorLin = toLinear(u_color);",
    "  vec3 absorb = u_density * (vec3(1.0) - colorLin);",
    "",
    "  vec2 Lc = vec2(cos(radians(u_lightAngle)), sin(radians(u_lightAngle)));",
    "  float k = clamp(log(0.5) / log(max(cos(radians(u_softness)), 1e-4)), 1.0, 400.0);",
    "",
    "  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));",
    "",
    "  const int N = 20;",
    "  vec3 keyAcc = vec3(0.0);",
    "  vec3 ambAcc = vec3(0.0);",
    "  float keyW = 0.0;",
    "  for (int i = 0; i < N; i++) {",
    "    float a = (float(i) + ign) / float(N) * 6.2831853;",
    "    vec2 dir = vec2(cos(a), sin(a));",
    "    vec3 ti = exp(-absorb * (lightThickness(gl_FragCoord.xy, dir) / penetration));",
    "    ambAcc += ti;",
    "    float w = pow(max(dot(dir, Lc), 0.0), k);",
    "    keyAcc += ti * w;",
    "    keyW += w;",
    "  }",
    "  vec3 color = colorLin * (keyAcc / max(keyW, 1e-4) + u_ambient * ambAcc / float(N));",
    "",
    "  float edgeFade = smoothstep(0.0, 1.5, depth);",
    "  gl_FragColor = vec4(toGamma(color), edgeFade);",
    "}"
  ].join("\n");

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      if (window.console) {
        window.console.error("[soft-shape] shader compile failed:", gl.getShaderInfoLog(shader));
      }
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function hexToRgb(hex) {
    var value = String(hex || "").trim().replace("#", "");
    if (value.length === 3) {
      value = value.split("").map(function (c) { return c + c; }).join("");
    }
    if (value.length !== 6) {
      return [0.78, 0.12, 0.31];
    }
    return [
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255
    ];
  }

  function createRenderer(canvas, options) {
    var gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power"
    });
    if (!gl) {
      return null;
    }

    var vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    var fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vertexShader || !fragmentShader) {
      return null;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (window.console) {
        window.console.error("[soft-shape] program link failed:", gl.getProgramInfoLog(program));
      }
      return null;
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      size: gl.getUniformLocation(program, "u_size"),
      radius: gl.getUniformLocation(program, "u_radius"),
      color: gl.getUniformLocation(program, "u_color"),
      lightAngle: gl.getUniformLocation(program, "u_lightAngle"),
      scatter: gl.getUniformLocation(program, "u_scatter"),
      density: gl.getUniformLocation(program, "u_density"),
      ambient: gl.getUniformLocation(program, "u_ambient"),
      softness: gl.getUniformLocation(program, "u_softness"),
      noise: gl.getUniformLocation(program, "u_noise"),
      noiseScale: gl.getUniformLocation(program, "u_noiseScale")
    };

    var rgb = hexToRgb(options.color);
    gl.uniform3f(uniforms.color, rgb[0], rgb[1], rgb[2]);
    gl.uniform1f(uniforms.lightAngle, options.lightAngle);
    gl.uniform1f(uniforms.scatter, options.scatter);
    gl.uniform1f(uniforms.density, options.density);
    gl.uniform1f(uniforms.ambient, options.ambient);
    gl.uniform1f(uniforms.softness, options.softness);
    gl.uniform1f(uniforms.noise, options.noise);
    gl.uniform1f(uniforms.noiseScale, options.noiseScale);

    var maxWidth = options.maxWidth || 260;
    var quality = options.quality || 0.5;
    var hasSize = false;

    function render() {
      var rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        return;
      }

      var width = Math.max(1, Math.min(maxWidth, Math.round(rect.width * quality)));
      var height = Math.max(1, Math.round(rect.height * (width / rect.width)));
      var scale = width / rect.width;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform2f(uniforms.size, width, height);
      gl.uniform1f(uniforms.radius, options.radius * scale);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      hasSize = true;
    }

    render();
    return { render: render, gl: gl, hasSize: function () { return hasSize; } };
  }

  window.initSoftShape = function (canvas, options) {
    if (!canvas) {
      return null;
    }
    var renderer = createRenderer(canvas, options);
    if (!renderer) {
      return null;
    }

    var scheduled = false;
    function schedule() {
      if (scheduled) {
        return;
      }
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        renderer.render();
      });
    }

    if (window.ResizeObserver) {
      new ResizeObserver(schedule).observe(canvas);
    } else {
      window.addEventListener("resize", schedule);
    }

    return renderer;
  };
})();
