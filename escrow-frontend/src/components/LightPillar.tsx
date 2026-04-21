"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import * as THREE from "three";

type LightPillarQuality = "low" | "medium" | "high";
type LightPillarElement = "div" | "span";

type LightPillarProps = Readonly<{
  as?: LightPillarElement;
  bottomColor?: string;
  className?: string;
  glowAmount?: number;
  intensity?: number;
  interactive?: boolean;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  noiseIntensity?: number;
  pillarHeight?: number;
  pillarRotation?: number;
  pillarWidth?: number;
  quality?: LightPillarQuality;
  rotationSpeed?: number;
  topColor?: string;
}>;

type QualitySettings = Readonly<{
  iterations: number;
  pixelRatio: number;
  precision: THREE.WebGLRendererParameters["precision"];
  stepMultiplier: number;
  targetFps: number;
  waveIterations: number;
}>;

type LightPillarInstance = Readonly<{
  camera: THREE.OrthographicCamera;
  geometry: THREE.PlaneGeometry;
  material: THREE.ShaderMaterial;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
}>;

type LightPillarRuntime = {
  animationFrame: number;
  instance: LightPillarInstance | null;
  resizeTimeout: number | null;
  time: number;
};

type LightPillarConfig = Required<Omit<LightPillarProps, "as" | "className">>;

const DEFAULT_TOP_COLOR = "#22007C";
const DEFAULT_BOTTOM_COLOR = "#FFFFFF";
const MOBILE_DEVICE_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export function LightPillar({
  as: Element = "div",
  bottomColor = DEFAULT_BOTTOM_COLOR,
  className = "",
  glowAmount = 0.004,
  intensity = 0.95,
  interactive = false,
  mixBlendMode = "screen",
  noiseIntensity = 0.18,
  pillarHeight = 0.34,
  pillarRotation = 0,
  pillarWidth = 2.25,
  quality = "medium",
  rotationSpeed = 0.26,
  topColor = DEFAULT_TOP_COLOR,
}: LightPillarProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const runtimeRef = useRef<LightPillarRuntime>({
    animationFrame: 0,
    instance: null,
    resizeTimeout: null,
    time: 0,
  });
  const rotationSpeedRef = useRef(rotationSpeed);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    setWebGLSupported(isWebGLSupported());
  }, []);

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !webGLSupported) {
      return;
    }

    const config = getLightPillarConfig({
      bottomColor,
      glowAmount,
      intensity,
      interactive,
      mixBlendMode,
      noiseIntensity,
      pillarHeight,
      pillarRotation,
      pillarWidth,
      quality,
      rotationSpeed,
      topColor,
    });
    const settings = getQualitySettings(config.quality);
    const instance = createLightPillarInstance(container, config, settings, mouseRef);
    const handleMouseMove = createMouseMoveHandler(container, config, mouseRef);
    const handleResize = createResizeHandler(container, instance, runtimeRef);

    runtimeRef.current.instance = instance;
    startAnimationLoop(runtimeRef, rotationSpeedRef, settings);
    attachListeners(container, config, handleMouseMove, handleResize);

    return () => {
      detachListeners(container, config, handleMouseMove, handleResize);
      destroyRuntime(container, runtimeRef);
    };
  }, [
    bottomColor,
    glowAmount,
    intensity,
    interactive,
    mixBlendMode,
    noiseIntensity,
    pillarHeight,
    pillarRotation,
    pillarWidth,
    quality,
    rotationSpeed,
    topColor,
    webGLSupported,
  ]);

  if (!webGLSupported) {
    return (
      <Element
        aria-hidden="true"
        className={`absolute inset-0 block h-full w-full bg-white/10 ${className}`}
        style={{ mixBlendMode }}
      />
    );
  }

  return (
    <Element
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 block h-full w-full ${className}`}
      style={{ mixBlendMode }}
    />
  );
}

function getLightPillarConfig(config: LightPillarConfig): LightPillarConfig {
  const quality = getEffectiveQuality(config.quality);
  return { ...config, quality };
}

function isWebGLSupported(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  );
}

function getEffectiveQuality(quality: LightPillarQuality): LightPillarQuality {
  const isMobile = MOBILE_DEVICE_PATTERN.test(navigator.userAgent);
  const isLowEndDevice = isMobile || navigator.hardwareConcurrency <= 4;

  if (isMobile && quality !== "low") {
    return "low";
  }

  if (isLowEndDevice && quality === "high") {
    return "medium";
  }

  return quality;
}

function getQualitySettings(quality: LightPillarQuality): QualitySettings {
  const settings = {
    low: {
      iterations: 24,
      pixelRatio: 0.5,
      precision: "mediump",
      stepMultiplier: 1.5,
      targetFps: 30,
      waveIterations: 1,
    },
    medium: {
      iterations: 40,
      pixelRatio: 0.65,
      precision: "mediump",
      stepMultiplier: 1.2,
      targetFps: 60,
      waveIterations: 2,
    },
    high: {
      iterations: 80,
      pixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2),
      precision: "highp",
      stepMultiplier: 1,
      targetFps: 60,
      waveIterations: 4,
    },
  } satisfies Record<LightPillarQuality, QualitySettings>;

  return settings[quality];
}

function createLightPillarInstance(
  container: HTMLElement,
  config: LightPillarConfig,
  settings: QualitySettings,
  mouseRef: RefObject<THREE.Vector2>
): LightPillarInstance {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = createRenderer(container, config, settings);
  const material = createMaterial(container, config, settings, mouseRef);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return { camera, geometry, material, renderer, scene };
}

function createRenderer(
  container: HTMLElement,
  config: LightPillarConfig,
  settings: QualitySettings
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: config.quality === "low" ? "low-power" : "high-performance",
    precision: settings.precision,
    stencil: false,
  });
  renderer.setPixelRatio(settings.pixelRatio);
  renderer.setSize(getWidth(container), getHeight(container));
  container.appendChild(renderer.domElement);
  return renderer;
}

function createMaterial(
  container: HTMLElement,
  config: LightPillarConfig,
  settings: QualitySettings,
  mouseRef: RefObject<THREE.Vector2>
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: createFragmentShader(settings),
    transparent: true,
    uniforms: createUniforms(container, config, mouseRef),
    vertexShader: VERTEX_SHADER,
  });
}

function createUniforms(
  container: HTMLElement,
  config: LightPillarConfig,
  mouseRef: RefObject<THREE.Vector2>
): Record<string, THREE.IUniform> {
  const rotation = getRotationValues(config.pillarRotation);
  return {
    uBottomColor: { value: parseColor(config.bottomColor) },
    uGlowAmount: { value: config.glowAmount },
    uIntensity: { value: config.intensity },
    uInteractive: { value: config.interactive },
    uMouse: { value: mouseRef.current },
    uNoiseIntensity: { value: config.noiseIntensity },
    uPillarHeight: { value: config.pillarHeight },
    uPillarRotCos: { value: rotation.cos },
    uPillarRotSin: { value: rotation.sin },
    uPillarRotation: { value: config.pillarRotation },
    uPillarWidth: { value: config.pillarWidth },
    uResolution: { value: new THREE.Vector2(getWidth(container), getHeight(container)) },
    uRotCos: { value: 1 },
    uRotSin: { value: 0 },
    uTime: { value: 0 },
    uTopColor: { value: parseColor(config.topColor) },
    uWaveCos: { value: getWaveValues("cos") },
    uWaveSin: { value: getWaveValues("sin") },
  };
}

function createFragmentShader(settings: QualitySettings): string {
  return `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uIntensity;
uniform bool uInteractive;
uniform float uGlowAmount;
uniform float uPillarWidth;
uniform float uPillarHeight;
uniform float uNoiseIntensity;
uniform float uPillarRotation;
uniform float uRotCos;
uniform float uRotSin;
uniform float uPillarRotCos;
uniform float uPillarRotSin;
uniform float uWaveSin[4];
uniform float uWaveCos[4];
varying vec2 vUv;

const float PI = 3.141592653589793;
const float EPSILON = 0.001;
const float E = 2.71828182845904523536;

float noise(vec2 coord) {
  vec2 r = (E * sin(E * coord));
  return fract(r.x * r.y * (1.0 + coord.x));
}

void main() {
  vec2 fragCoord = vUv * uResolution;
  vec2 uv = (fragCoord * 2.0 - uResolution) / uResolution.y;
  uv = vec2(
    uv.x * uPillarRotCos - uv.y * uPillarRotSin,
    uv.x * uPillarRotSin + uv.y * uPillarRotCos
  );

  vec3 origin = vec3(0.0, 0.0, -10.0);
  vec3 direction = normalize(vec3(uv, 1.0));
  float maxDepth = 50.0;
  float depth = 0.1;
  float rotCos = uRotCos;
  float rotSin = uRotSin;

  if(uInteractive && length(uMouse) > 0.0) {
    float mouseAngle = uMouse.x * PI * 2.0;
    rotCos = cos(mouseAngle);
    rotSin = sin(mouseAngle);
  }

  vec3 color = vec3(0.0);
  const int ITERATIONS = ${settings.iterations};
  const int WAVE_ITERATIONS = ${settings.waveIterations};
  const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};

  for(int i = 0; i < ITERATIONS; i++) {
    vec3 pos = origin + direction * depth;
    float newX = pos.x * rotCos - pos.z * rotSin;
    float newZ = pos.x * rotSin + pos.z * rotCos;
    pos.x = newX;
    pos.z = newZ;

    vec3 deformed = pos;
    deformed.y *= uPillarHeight;
    deformed = deformed + vec3(0.0, uTime, 0.0);
    float frequency = 1.0;
    float amplitude = 1.0;

    for(int j = 0; j < WAVE_ITERATIONS; j++) {
      float wx = deformed.x * uWaveCos[j] - deformed.z * uWaveSin[j];
      float wz = deformed.x * uWaveSin[j] + deformed.z * uWaveCos[j];
      deformed.x = wx;
      deformed.z = wz;
      float phase = uTime * float(j) * 2.0;
      vec3 oscillation = cos(deformed.zxy * frequency - phase);
      deformed += oscillation * amplitude;
      frequency *= 2.0;
      amplitude *= 0.5;
    }

    vec2 cosinePair = cos(deformed.xz);
    float fieldDistance = length(cosinePair) - 0.2;
    float radialBound = length(pos.xz) - uPillarWidth;
    float k = 4.0;
    float h = max(k - abs(-radialBound - (-fieldDistance)), 0.0);
    fieldDistance = -(min(-radialBound, -fieldDistance) - h * h * 0.25 / k);
    fieldDistance = abs(fieldDistance) * 0.15 + 0.01;

    vec3 gradient = mix(uBottomColor, uTopColor, smoothstep(15.0, -15.0, pos.y));
    color += gradient / fieldDistance;

    if(fieldDistance < EPSILON || depth > maxDepth) break;
    depth += fieldDistance * STEP_MULT;
  }

  float widthNormalization = uPillarWidth / 3.0;
  color = tanh(color * uGlowAmount / widthNormalization);
  float rnd = noise(gl_FragCoord.xy);
  color -= rnd / 15.0 * uNoiseIntensity;
  float alpha = clamp(max(max(color.r, color.g), color.b) * uIntensity * 1.8, 0.0, 0.82);
  gl_FragColor = vec4(color * uIntensity, alpha);
}
`;
}

function createMouseMoveHandler(
  container: HTMLElement,
  config: LightPillarConfig,
  mouseRef: RefObject<THREE.Vector2>
): (event: MouseEvent) => void {
  let mouseMoveTimeout = 0;
  return (event) => {
    if (!config.interactive || mouseMoveTimeout) {
      return;
    }

    mouseMoveTimeout = globalThis.window.setTimeout(() => {
      mouseMoveTimeout = 0;
    }, 16);
    updateMousePosition(container, mouseRef, event);
  };
}

function createResizeHandler(
  container: HTMLElement,
  instance: LightPillarInstance,
  runtimeRef: RefObject<LightPillarRuntime>
): () => void {
  return () => {
    if (runtimeRef.current.resizeTimeout) {
      clearTimeout(runtimeRef.current.resizeTimeout);
    }

    runtimeRef.current.resizeTimeout = globalThis.window.setTimeout(() => {
      updateSize(container, instance);
      runtimeRef.current.resizeTimeout = null;
    }, 150);
  };
}

function startAnimationLoop(
  runtimeRef: RefObject<LightPillarRuntime>,
  rotationSpeedRef: RefObject<number>,
  settings: QualitySettings
): void {
  let lastTime = performance.now();
  const frameTime = 1000 / settings.targetFps;

  const animate = (currentTime: number) => {
    lastTime = renderFrame(currentTime, lastTime, frameTime, runtimeRef, rotationSpeedRef);
    runtimeRef.current.animationFrame = requestAnimationFrame(animate);
  };

  runtimeRef.current.animationFrame = requestAnimationFrame(animate);
}

function renderFrame(
  currentTime: number,
  lastTime: number,
  frameTime: number,
  runtimeRef: RefObject<LightPillarRuntime>,
  rotationSpeedRef: RefObject<number>
): number {
  const instance = runtimeRef.current.instance;
  const deltaTime = currentTime - lastTime;

  if (!instance || deltaTime < frameTime) {
    return lastTime;
  }

  updateAnimationUniforms(instance.material, runtimeRef, rotationSpeedRef);
  instance.renderer.render(instance.scene, instance.camera);
  return currentTime - (deltaTime % frameTime);
}

function updateAnimationUniforms(
  material: THREE.ShaderMaterial,
  runtimeRef: RefObject<LightPillarRuntime>,
  rotationSpeedRef: RefObject<number>
): void {
  runtimeRef.current.time += 0.016 * rotationSpeedRef.current;
  material.uniforms.uTime.value = runtimeRef.current.time;
  material.uniforms.uRotCos.value = Math.cos(runtimeRef.current.time * 0.3);
  material.uniforms.uRotSin.value = Math.sin(runtimeRef.current.time * 0.3);
}

function attachListeners(
  container: HTMLElement,
  config: LightPillarConfig,
  handleMouseMove: (event: MouseEvent) => void,
  handleResize: () => void
): void {
  if (config.interactive) {
    container.addEventListener("mousemove", handleMouseMove, { passive: true });
  }

  globalThis.addEventListener("resize", handleResize, { passive: true });
}

function detachListeners(
  container: HTMLElement,
  config: LightPillarConfig,
  handleMouseMove: (event: MouseEvent) => void,
  handleResize: () => void
): void {
  if (config.interactive) {
    container.removeEventListener("mousemove", handleMouseMove);
  }

  globalThis.removeEventListener("resize", handleResize);
}

function destroyRuntime(
  container: HTMLElement,
  runtimeRef: RefObject<LightPillarRuntime>
): void {
  cancelAnimationFrame(runtimeRef.current.animationFrame);
  clearPendingResize(runtimeRef);
  destroyInstance(container, runtimeRef.current.instance);
  runtimeRef.current = { animationFrame: 0, instance: null, resizeTimeout: null, time: 0 };
}

function destroyInstance(
  container: HTMLElement,
  instance: LightPillarInstance | null
): void {
  if (!instance) {
    return;
  }

  instance.geometry.dispose();
  instance.material.dispose();
  instance.renderer.dispose();
  instance.renderer.forceContextLoss();
  instance.renderer.domElement.remove();
}

function clearPendingResize(
  runtimeRef: RefObject<LightPillarRuntime>
): void {
  if (!runtimeRef.current.resizeTimeout) {
    return;
  }

  clearTimeout(runtimeRef.current.resizeTimeout);
  runtimeRef.current.resizeTimeout = null;
}

function updateMousePosition(
  container: HTMLElement,
  mouseRef: RefObject<THREE.Vector2>,
  event: MouseEvent
): void {
  const rect = container.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  mouseRef.current.set(x, y);
}

function updateSize(
  container: HTMLElement,
  instance: LightPillarInstance
): void {
  const width = getWidth(container);
  const height = getHeight(container);
  instance.renderer.setSize(width, height);
  instance.material.uniforms.uResolution.value.set(width, height);
}

function getWidth(container: HTMLElement): number {
  return Math.max(1, container.clientWidth);
}

function getHeight(container: HTMLElement): number {
  return Math.max(1, container.clientHeight);
}

function parseColor(hex: string): THREE.Vector3 {
  const color = new THREE.Color(hex);
  return new THREE.Vector3(color.r, color.g, color.b);
}

function getRotationValues(degrees: number): { cos: number; sin: number } {
  const radians = (degrees * Math.PI) / 180;
  return { cos: Math.cos(radians), sin: Math.sin(radians) };
}

function getWaveValues(operation: "cos" | "sin"): Float32Array {
  const values = new Float32Array(4);
  const angle = 0.4;

  for (let index = 0; index < values.length; index += 1) {
    values[index] = operation === "cos" ? Math.cos(angle) : Math.sin(angle);
  }

  return values;
}
