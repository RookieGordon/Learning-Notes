"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  default: () => LiveWallpaperPlugin2,
  defaultWallpaper: () => defaultWallpaper
});
module.exports = __toCommonJS(main_exports);

// src/Styles/TextArenaStyles.ts
function LoadOrUnloadChanges(doc, TextArenas, load) {
  const el = doc.body.classList.contains("theme-dark") || doc.body.classList.contains("theme-light") ? doc.body : doc.documentElement;
  if (!el) return;
  for (const { attribute } of TextArenas) {
    try {
      const attr = attribute?.trim();
      if (!attr) continue;
      const isVar = attr.startsWith("--");
      if (isVar) {
        if (load) {
          el.style.setProperty(attr, "transparent", "important");
        } else {
          el.style.removeProperty(attr);
        }
        continue;
      }
      if (load) {
        el.style.setProperty(attr, "transparent", "important");
      } else {
        el.style.removeProperty(attr);
        if (!el.getAttribute("style")) {
          el.removeAttribute("style");
        }
      }
    } catch (error) {
      console.error("Error processing element:", { attribute }, error);
    }
  }
}
function ApplyChanges(doc, TextArenas, id) {
  const { attribute } = TextArenas[id];
  const attr = attribute.trim();
  const isVar = attr.startsWith("--");
  let el = null;
  if (isVar) {
    el = doc.body.classList.contains("theme-dark") || doc.body.classList.contains("theme-light") ? doc.body : doc.documentElement;
  } else {
    el = doc.body;
  }
  if (!el) return;
  el.style.setProperty(attr, "transparent", "important");
}
function RemoveChanges(doc, TextArenas, id, oldAttribute) {
  if (id < 0 || id >= TextArenas.length) return;
  const attribute = (oldAttribute ?? TextArenas[id].attribute)?.trim();
  const el = doc.body.classList.contains("theme-dark") || doc.body.classList.contains("theme-light") ? doc.body : doc.documentElement;
  if (!attribute || !el) return;
  try {
    el.style.removeProperty(attribute);
    if (!el.getAttribute("style")) {
      el.removeAttribute("style");
    }
  } catch (error) {
    console.error(`Error removing '${attribute}' at index ${id}:`, error);
  }
}

// src/Scheduler.ts
var Scheduler = class {
  static ValidateText(text) {
    const timePattern = /^(?:[01]?\d|2[0-3])(?::[0-5]\d){1,2}$/;
    return timePattern.test(text);
  }
  static Check(options, exceptKey) {
    const BOOLEAN_KEYS = [
      "dayNightMode",
      "weekly",
      "autoSwitch"
    ];
    return BOOLEAN_KEYS.some((k) => {
      if (k === exceptKey) return false;
      const val = options[k];
      return val === true || val === "true";
    });
  }
  static getIntervalInMs(options) {
    const timeStr = options.intervalCheckTime ?? "00:10";
    const [hh, mm] = timeStr.split(":").map(Number);
    return (hh * 60 + mm) * 60 * 1e3;
  }
};

// src/WallpaperConfigUtils.ts
var WallpaperConfigUtils = class _WallpaperConfigUtils {
  static async GetCurrentConfig(Plugin2) {
    const Settings = Plugin2.settings;
    const AnyScheduledWallpaperEnabled = Scheduler.Check(Settings.ScheduledOptions);
    if (Settings.Preview) return Plugin2.settings.currentWallpaper;
    else if (AnyScheduledWallpaperEnabled) {
      const index = this.getWallpaperIndex(Plugin2);
      if (index == void 0) {
        Plugin2.settings.WallpaperConfigs = _WallpaperConfigUtils.NewConfig(Plugin2.settings.WallpaperConfigs);
        Plugin2.saveSettings();
        return Plugin2.settings.WallpaperConfigs[Plugin2.settings.WallpaperConfigs.length - 1];
      }
      if (Settings.globalConfig.enabled) {
        return _WallpaperConfigUtils.applyGlobalConfig(Settings.WallpaperConfigs[index], Settings.globalConfig.config);
      }
      return Settings.WallpaperConfigs[index];
    }
    if (Settings.globalConfig.enabled) return _WallpaperConfigUtils.applyGlobalConfig(Settings.WallpaperConfigs[0], Settings.globalConfig.config);
    return Settings.WallpaperConfigs[0];
  }
  static getWallpaperIndex(Plugin2) {
    const now = /* @__PURE__ */ new Date();
    const options = Plugin2.settings.ScheduledOptions;
    if (options.dayNightMode) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      const [dayHour, dayMinute] = options.dayStartTime.split(":").map(Number);
      const [nightHour, nightMinute] = options.nightStartTime.split(":").map(Number);
      const dayTime = dayHour * 60 + dayMinute;
      const nightTime = nightHour * 60 + nightMinute;
      const isDay = dayTime < nightTime ? currentTime >= dayTime && currentTime < nightTime : currentTime >= dayTime || currentTime < nightTime;
      return isDay ? 1 : 2;
    } else if (options.weekly) {
      let day = now.getDay();
      day = (day + 6) % 7 + 1;
      return day + 2;
    } else if (options.autoSwitch) {
      const min = 10;
      const max = Plugin2.settings.WallpaperConfigs.length - 1;
      if (min > max) return void 0;
      const range = max - min + 1;
      const index = ((Plugin2.settings.currentWallpaper.Index + 1 - min) % range + range) % range + min;
      return index;
    }
    return 1;
  }
  static getPaths(slotIndex, Configs) {
    const configs = Configs;
    if (slotIndex >= 1 && slotIndex <= 2) {
      return configs.slice(1, 3).map((cfg) => cfg.path);
    } else if (slotIndex <= 9) {
      return configs.slice(3, 10).map((cfg) => cfg.path);
    } else {
      return configs.slice(10, Configs.length).map((cfg) => cfg.path);
    }
  }
  static getPathAndType(slotIndex, Configs) {
    const configs = Configs;
    if (slotIndex >= 1 && slotIndex <= 2) {
      return configs.slice(1, 3).map((cfg) => ({ path: cfg.path, type: cfg.type }));
    } else if (slotIndex <= 9) {
      return configs.slice(3, 10).map((cfg) => ({ path: cfg.path, type: cfg.type }));
    } else {
      return configs.slice(10, Configs.length).map((cfg) => ({ path: cfg.path, type: cfg.type }));
    }
  }
  static applyGlobalConfig(config, globalConfig) {
    globalConfig.path = config.path;
    globalConfig.type = config.type;
    globalConfig.Index = config.Index;
    return globalConfig;
  }
  static computeActiveSubfolder(slotIndex) {
    if (slotIndex >= 10) return "autoSwitch";
    else if (slotIndex > 2) return "weekly";
    else if (slotIndex != 0) return "daily";
    return "normal";
  }
  static NewConfig(configs) {
    return [
      ...configs,
      {
        ...defaultWallpaper,
        Index: configs.length
      }
    ];
  }
  static RemoveConfig(configs, config) {
    return configs.filter((c) => c.Index !== config.Index).map((c, i) => ({ ...c, Index: i }));
  }
  static ClearConfigsFromIndex(configs, startIndex) {
    return configs.filter((c) => c.Index < startIndex);
  }
};

// src/Wallpaper/mediaUtils.ts
function UpdatePaths(plugin, Args) {
  plugin.lastPath = Args.path;
  plugin.lastType = Args.type;
}
async function GetConfig(plugin, skipConfigReload) {
  try {
    if (skipConfigReload) {
      return plugin.settings.currentWallpaper;
    }
    return await WallpaperConfigUtils.GetCurrentConfig(plugin);
  } catch (err) {
    console.error("Error while accessing wallpaper config:", err);
    return void 0;
  }
}
function GetFileName(FilePath) {
  return FilePath.substring(FilePath.lastIndexOf("/") + 1);
}
async function waitForMediaDimensions(element, timeout = 2e3) {
  if (element instanceof HTMLImageElement) {
    if (element.complete && element.naturalWidth > 0) return;
  } else {
    if (element.videoWidth > 0) return;
  }
  return Promise.race([
    new Promise((resolve) => {
      if (element instanceof HTMLImageElement) {
        element.addEventListener("load", () => resolve(), { once: true });
        element.addEventListener("error", () => resolve(), { once: true });
      } else {
        element.addEventListener("loadedmetadata", () => resolve(), { once: true });
        element.addEventListener("error", () => resolve(), { once: true });
      }
    }),
    new Promise(
      (resolve) => setTimeout(() => resolve(), timeout)
    )
  ]);
}

// src/Wallpaper/wallpaperDom.ts
function removeExistingWallpaperElements(doc) {
  const existingContainer = doc.getElementById("live-wallpaper-container");
  const existingStyles = doc.getElementById("live-wallpaper-overrides");
  const existingTitlebarStyles = doc.getElementById("live-wallpaper-titlebar-styles");
  existingContainer?.remove();
  existingStyles?.remove();
  existingTitlebarStyles?.remove();
  doc.body.classList.remove("live-wallpaper-active");
}
function createWallpaperContainer(doc, currentConfig, adnvOpened) {
  const container = doc.createElement("div");
  container.id = "live-wallpaper-container";
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    pointerEvents: "none",
    filter: `blur(${currentConfig.blurRadius}px) brightness(${currentConfig.brightness}%) contrast(${currentConfig.contrast}%)`
  });
  if (adnvOpened) {
    Object.assign(container.style, {
      opacity: `1`,
      zIndex: `0`
    });
  } else {
    Object.assign(container.style, {
      opacity: `${Math.min(currentConfig.opacity / 100, 0.8)}`,
      zIndex: `${currentConfig.zIndex}`
    });
  }
  return container;
}
function ChangeWallpaperContainer(doc, size) {
  const container = doc.getElementById("live-wallpaper-container");
  if (container == null) return;
  const width = size.width || "100vw";
  const height = size.height || "100vh";
  Object.assign(container.style, {
    width,
    height
  });
}
function applyContainerEffects(container, currentConfig, adnvOpened) {
  if (adnvOpened) {
    Object.assign(container.style, {
      opacity: `1`,
      zIndex: `0`
    });
  } else {
    Object.assign(container.style, {
      opacity: `${Math.min(currentConfig.opacity / 100, 0.8)}`,
      zIndex: `${currentConfig.zIndex}`
    });
  }
  Object.assign(container.style, {
    filter: `blur(${currentConfig.blurRadius}px) brightness(${currentConfig.brightness}%) contrast(${currentConfig.contrast}%)`
  });
}

// src/Wallpaper/wallpaperMedia.ts
async function createMediaElement(doc, plugin) {
  const { currentWallpaper } = plugin.settings;
  const isVideo = currentWallpaper.type === "video";
  const media = isVideo ? doc.createElement("video") : doc.createElement("img");
  media.id = "live-wallpaper-media";
  if (media instanceof HTMLImageElement) {
    media.loading = "lazy";
  }
  const path = `${plugin.app.vault.configDir}/${currentWallpaper.path}`;
  const exists = await plugin.app.vault.adapter.exists(path);
  if (!exists) {
    currentWallpaper.path = "";
    return null;
  }
  media.src = plugin.app.vault.adapter.getResourcePath(path);
  applyMediaStyles(media, currentWallpaper);
  if (isVideo) {
    const video = media;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playbackRate = currentWallpaper.playbackSpeed;
  }
  return media;
}
function applyMediaStyles(media, config) {
  media.removeAttribute("style");
  Object.assign(media.style, {
    width: "100%",
    height: "100%",
    position: "absolute",
    objectFit: config.useObjectFit ? "unset" : "cover",
    ...config.Reposition && {
      objectPosition: config.position
    }
  });
  if (config.Quality) {
    Object.assign(media.style, {
      imageRendering: "auto",
      willChange: "transform",
      overflowClipMargin: "unset",
      overflow: "clip"
    });
  }
}

// src/Wallpaper/WallpaperApplier.ts
var import_obsidian = require("obsidian");
var WallpaperApplier = class _WallpaperApplier {
  static async applyWallpaper(plugin, skipConfigReload = false, doc) {
    const config = await GetConfig(plugin, skipConfigReload);
    if (!config) {
      return false;
    }
    plugin.settings.currentWallpaper = config;
    if (plugin.settings.ScheduledOptions.dayNightMode || plugin.settings.ScheduledOptions.autoSwitch) {
      plugin.startDayNightWatcher();
    } else {
      plugin.stopDayNightWatcher();
    }
    if (!plugin.settings.currentWallpaper || !plugin.settings.currentWallpaper.path) {
      new import_obsidian.Notice("No wallpaper path defined, skipping applyWallpaper.");
      return false;
    }
    const newPath = plugin.settings.currentWallpaper.path;
    const newType = plugin.settings.currentWallpaper.type;
    const container = doc.getElementById("live-wallpaper-container");
    let media = doc.getElementById("live-wallpaper-media");
    if (container && media) {
      applyContainerEffects(container, plugin.settings.currentWallpaper, plugin.settings.AdnvOpend);
      if (media.tagName === "VIDEO") {
        const video = media;
        video.playbackRate = plugin.settings.currentWallpaper.playbackSpeed;
      }
      if (newPath !== plugin.lastPath || newType !== plugin.lastType) {
        const newMedia = await createMediaElement(doc, plugin);
        if (newMedia) {
          _WallpaperApplier.applyNewMedia(newMedia, container);
          media = newMedia;
        }
      }
      if (plugin.settings.currentWallpaper.Reposition) {
        await SettingsUtils.applyImagePosition(
          media,
          plugin.settings.currentWallpaper.positionX,
          plugin.settings.currentWallpaper.positionY,
          plugin.settings.currentWallpaper.Scale
        );
      }
      return true;
    }
    await plugin.CreateMedia(doc);
    return true;
  }
  static async applyNewMedia(newMedia, container) {
    await waitForMediaDimensions(newMedia);
    newMedia.style.opacity = "0";
    newMedia.style.transition = "opacity 1s ease-in-out";
    container.appendChild(newMedia);
    await new Promise(
      (resolve) => requestAnimationFrame(() => resolve())
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    const medias = container.querySelectorAll(
      '[id^="live-wallpaper-media"]'
    );
    medias.forEach((el, i) => {
      if (i < medias.length - 1) {
        const htmlEl = el;
        htmlEl.style.transition = "opacity 1s ease-in-out";
        htmlEl.style.opacity = "0";
        newMedia.style.opacity = "1";
        setTimeout(() => {
          if (htmlEl.parentElement) {
            htmlEl.remove();
          }
        }, 3e3);
      }
    });
  }
};

// src/Settings/SettingsUtils.ts
var import_obsidian2 = require("obsidian");
var SettingsUtils = class {
  static AttributeValid(attribute) {
    const attr = attribute.trim();
    if (attr === "") return false;
    if (attr.startsWith("--")) return true;
    return false;
  }
  static TargetValid(target) {
    const trimmed = target.trim();
    if (trimmed === "") return false;
    try {
      document.createDocumentFragment().querySelector(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  static async getWallpaperPath(plugin, Index) {
    const settings = plugin.settings;
    const baseDir = plugin.app.vault.configDir;
    let path = "";
    const config = settings.WallpaperConfigs[Index];
    path = `${baseDir}/${config.path}`;
    return path;
  }
  static async getPathExists(plugin, relativePath) {
    if (!relativePath || relativePath.trim() === "") {
      return false;
    }
    const fullPath = `${plugin.app.vault.configDir}/${relativePath}`;
    return await this.wallpaperExists(plugin, fullPath);
  }
  static async wallpaperExists(plugin, path) {
    return await plugin.app.vault.adapter.exists(path);
  }
  static async applyImagePosition(element, posXPercent, posYPercent, scaleFactor) {
    if (element.parentElement === null) return;
    const container = element.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const isImage = element.tagName === "IMG";
    const naturalWidth = isImage ? element.naturalWidth : element.videoWidth;
    const naturalHeight = isImage ? element.naturalHeight : element.videoHeight;
    const minScale = Math.max(
      containerWidth / naturalWidth,
      containerHeight / naturalHeight
    );
    const scale = Math.max(minScale, minScale * scaleFactor);
    const scaledWidth = naturalWidth * scale;
    const scaledHeight = naturalHeight * scale;
    const maxOffsetX = (scaledWidth - containerWidth) / 2;
    const maxOffsetY = (scaledHeight - containerHeight) / 2;
    const offsetX = (posXPercent - 50) / 50 * maxOffsetX;
    const offsetY = (posYPercent - 50) / 50 * maxOffsetY;
    element.style.width = `${scaledWidth}px`;
    element.style.height = `${scaledHeight}px`;
    element.style.objectFit = "cover";
    element.style.position = "absolute";
    element.style.left = `${containerWidth / 2 - scaledWidth / 2 + offsetX}px`;
    element.style.top = `${containerHeight / 2 - scaledHeight / 2 + offsetY}px`;
  }
  static enableReposition(plugin, doc) {
    if (this.resizeHandler) return;
    this.resizeHandler = () => {
      const media = doc.getElementById("live-wallpaper-media");
      if (!media) return;
      if (!plugin.settings.currentWallpaper.Reposition) {
        applyMediaStyles(media, plugin.settings.currentWallpaper);
        return;
      }
      this.applyImagePosition(
        media,
        plugin.settings.currentWallpaper.positionX ?? 50,
        plugin.settings.currentWallpaper.positionY ?? 50,
        plugin.settings.currentWallpaper.Scale ?? 1
      );
    };
    doc.win.addEventListener("resize", this.resizeHandler);
  }
  static disableReposition(window2) {
    if (!this.resizeHandler) return;
    window2.removeEventListener("resize", this.resizeHandler);
    this.resizeHandler = null;
  }
  static SaveSettingsDebounced(plugin) {
    return (0, import_obsidian2.debounce)(async () => {
      await plugin.saveSettings();
    }, 300);
  }
  static ApplyWallpaperDebounced(plugin) {
    return (0, import_obsidian2.debounce)(async (skipConfigReload = false) => {
      for (const win of plugin.windows) {
        await WallpaperApplier.applyWallpaper(plugin, skipConfigReload, win.document);
      }
      UpdatePaths(plugin, { path: plugin.settings.currentWallpaper.path, type: plugin.settings.currentWallpaper.type });
    }, 300);
  }
};
SettingsUtils.resizeHandler = null;

// src/Styles/ModalStyles.ts
async function toggleModalStyles(doc, Plugin2) {
  const styleId = "extrastyles-dynamic-css";
  let style = doc.getElementById(styleId);
  if (Plugin2.settings.AdnvOpend) {
    if (!style) {
      style = doc.createElement("style");
      style.id = styleId;
      doc.head.appendChild(style);
    }
    const { effect, blurRadius, dimOpacity, dimColor, disableModalBg } = Plugin2.settings.modalStyle;
    let background = "transparent";
    let backdrop = "none";
    let extraCss = "";
    if (effect.includes("dim")) {
      const color = dimColor === "white" ? "255, 255, 255" : "0, 0, 0";
      background = `rgba(${color}, ${dimOpacity})`;
    }
    if (effect.includes("blur")) {
      backdrop = `blur(${blurRadius}px)`;
    }
    if (disableModalBg) {
      extraCss += `.modal-bg { opacity: 0 !important; }`;
    }
    style.textContent = `
        .modal-container.mod-dim,
        .modal-container {
            background: ${background};
            backdrop-filter: ${backdrop};
        }
        ${extraCss}
        `;
  } else {
    style?.remove();
  }
  const wallpaperExists = await SettingsUtils.getPathExists(Plugin2, Plugin2.settings.currentWallpaper.path);
  if (!wallpaperExists) {
    for (const win of Plugin2.windows) {
      LoadOrUnloadChanges(win.document, Plugin2.settings.TextArenas, false);
    }
    return;
  } else {
    for (const win of Plugin2.windows) {
      LoadOrUnloadChanges(win.document, Plugin2.settings.TextArenas, Plugin2.settings.AdnvOpend);
    }
  }
}
function RemoveModalStyles(doc) {
  const styleId = "extrastyles-dynamic-css";
  const existingStyle = doc.getElementById(styleId);
  existingStyle != null ? existingStyle.remove() : "";
}

// src/Styles/BackgroundColor.ts
async function applyBackgroundColor(doc, AdnvOpend, Color) {
  const existingElement = doc.getElementById("live-wallpaper-container");
  if (existingElement) {
    if (AdnvOpend && Color) {
      existingElement.parentElement?.style.setProperty("background-color", Color, "important");
    }
    return;
  }
  await new Promise((resolve) => {
    const observer = new MutationObserver((mutations, obs) => {
      const element = doc.getElementById("live-wallpaper-container");
      if (element) {
        obs.disconnect();
        resolve();
      }
    });
    observer.observe(doc.body, {
      childList: true,
      subtree: true
    });
  });
  if (AdnvOpend && Color) {
    const Main = doc.getElementById("live-wallpaper-container");
    Main?.parentElement?.style.setProperty("background-color", Color, "important");
  }
}
async function clearBackgroundColor(doc) {
  const Main = doc.getElementById("live-wallpaper-container");
  Main?.parentElement?.style.removeProperty("background-color");
}

// src/FilePicker/fileUtils.ts
async function removeFileIfUnused(plugin, index, filetoRemoveName) {
  const matches = WallpaperConfigUtils.getPaths(index, plugin.settings.WallpaperConfigs).filter(
    (file) => file.split("/").pop() === filetoRemoveName.split("/").pop()
  );
  if (matches.length !== 1) return;
  await plugin.app.vault.adapter.remove(`.obsidian/${filetoRemoveName}`).catch(() => {
  });
}
async function removeUnusedFilesInFolder(plugin, folderPath, index, currentPath) {
  const filesInFolder = await plugin.app.vault.adapter.list(folderPath);
  const validFileNames = new Set(
    WallpaperConfigUtils.getPathAndType(index, plugin.settings.WallpaperConfigs).map((cfg) => cfg.path?.split("/").pop()).filter((p) => !!p)
  );
  const currentFileName = currentPath?.split("/").pop();
  for (const file of filesInFolder.files) {
    const fileName = file.split("/").pop();
    if (!fileName) continue;
    if (fileName === currentFileName) continue;
    if (!validFileNames.has(fileName)) {
      await plugin.app.vault.adapter.remove(file).catch(() => {
      });
    }
  }
}
async function removeAllExcept(plugin, dirPath, keepFilePath) {
  const fullDirPath = `${plugin.app.vault.configDir}/${dirPath}`;
  const files = await plugin.app.vault.adapter.list(fullDirPath).catch(() => null);
  if (!files || !files.files) return;
  for (const file of files.files) {
    if (file !== `${plugin.app.vault.configDir}/${keepFilePath}`) {
      await plugin.app.vault.adapter.remove(file).catch(() => {
      });
    }
  }
}

// src/FilePicker/historyManager.ts
function prependHistory(history, entry) {
  return [
    entry,
    ...history.filter((e) => e.path !== entry.path)
  ];
}
async function trimHistory(plugin, max, folderPath) {
  const filesInFolder = await plugin.app.vault.adapter.list(folderPath);
  if (filesInFolder.files.length <= max) return;
  const allowed = new Set(
    plugin.settings.HistoryPaths.slice(0, max).map((e) => e.path.split("/").pop()).filter((p) => !!p)
  );
  const toRemove = filesInFolder.files.filter((file) => {
    const fileName = file.split("/").pop();
    return fileName && !allowed.has(fileName);
  });
  plugin.settings.HistoryPaths = plugin.settings.HistoryPaths.slice(0, max);
  for (const file of toRemove) {
    await plugin.app.vault.adapter.remove(file).catch(() => {
    });
  }
}
async function cleanInvalidWallpaperHistory(plugin) {
  const validPaths = [];
  for (const entry of plugin.settings.HistoryPaths) {
    const fullPath = `${plugin.app.vault.configDir}/${entry.path}`;
    const exists = await plugin.app.vault.adapter.exists(fullPath);
    if (exists) {
      validPaths.push(entry);
    }
  }
  plugin.settings.HistoryPaths = validPaths;
  await plugin.saveSettings();
}

// src/FilePicker/imageProcessing.ts
var import_obsidian3 = require("obsidian");
async function resizeImageToBlob(file, options) {
  const img = await createImageBitmap(file);
  let MAX_WIDTH = options.maxWidth;
  if (import_obsidian3.Platform.isMobile) {
    const parsed = parseInt(options.mobileBackgroundWidth);
    if (!isNaN(parsed)) {
      MAX_WIDTH = parsed;
    }
  }
  if (options.allowFullRes || img.width <= MAX_WIDTH) {
    return new Blob([await file.arrayBuffer()], { type: file.type });
  }
  const newWidth = MAX_WIDTH;
  const newHeight = img.height / img.width * newWidth;
  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const bmp = await createImageBitmap(img, {
    resizeWidth: newWidth,
    resizeHeight: newHeight,
    resizeQuality: "high"
  });
  ctx.drawImage(bmp, 0, 0, newWidth, newHeight);
  return canvas.convertToBlob({ quality: 0.8, type: "image/jpeg" });
}

// src/FilePicker/fileManager.ts
async function saveUnder(plugin, baseDir, subfolder, fileName, arrayBuffer) {
  const dir = `${baseDir}/${subfolder}`;
  await plugin.app.vault.adapter.mkdir(dir);
  const fullPath = `${dir}/${fileName}`;
  await plugin.app.vault.adapter.writeBinary(fullPath, arrayBuffer);
  return `plugins/${plugin.manifest.id}/wallpapers/${subfolder}/${fileName}`;
}
async function getFileArrayBuffer(file, options) {
  if (file.type.startsWith("image/")) {
    const blob = await resizeImageToBlob(file, options);
    return blob.arrayBuffer();
  }
  return file.arrayBuffer();
}

// src/FilePicker/filePicker.ts
async function openFilePicker(plugin, slotIndex, isScheduledPicker = false, doc) {
  const file = await pickSingleFile(doc);
  if (!file) return;
  try {
    await plugin.applyWallpaperFile(file, slotIndex, doc, isScheduledPicker);
    plugin.debouncedSave();
  } catch (error) {
    alert("Could not save the file. Check disk permissions.");
    console.error(error);
  }
}
async function pickFolderFiles(doc, accept = ".jpg,.jpeg,.png,.gif,.mp4,.webm,.avif") {
  return new Promise((resolve) => {
    const input = doc.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.webkitdirectory = true;
    input.addEventListener("cancel", () => {
      resolve(null);
    });
    input.onchange = () => {
      resolve(Array.from(input.files ?? []));
    };
    input.click();
  });
}
function pickSingleFile(doc, accept = ".jpg,.jpeg,.png,.gif,.mp4,.webm,.avif") {
  return new Promise((resolve) => {
    const input = doc.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = false;
    input.addEventListener("change", () => {
      resolve(input.files?.[0] ?? null);
    });
    input.addEventListener("cancel", () => {
      resolve(null);
    });
    input.click();
  });
}
function validateWallpaperFile(file, SizeLimited) {
  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "mp4", "webm", "avif"];
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    alert("Unsupported file type!");
    return false;
  }
  if (SizeLimited && file.size > 12 * 1024 * 1024) {
    alert("File is too large (max 12MB).");
    return false;
  }
  return true;
}
function getWallpaperType(filename) {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (["mp4", "webm"].includes(extension || "")) return "video";
  if (extension === "gif") return "gif";
  return "image";
}

// src/main.ts
var import_obsidian8 = require("obsidian");

// src/Settings/SettingsManager.ts
var import_obsidian7 = require("obsidian");

// src/Settings/Settings.ts
var import_obsidian4 = require("obsidian");
var positions = /* @__PURE__ */ new Map([
  [100, "Right"],
  [0, "Left"],
  [50, "Center"]
]);
var SettingsApp = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const setting = new import_obsidian4.Setting(containerEl).setName("Wallpaper source").setDesc("Select an image, GIF, or video file to use as your wallpaper");
    setting.addButton(async (btn) => {
      const pathExists = await SettingsUtils.getPathExists(
        this.plugin,
        this.plugin.settings.currentWallpaper.path
      );
      if (pathExists) {
        btn.setIcon("circle-check").setTooltip("Wallpaper path exists");
      } else {
        btn.setIcon("circle-x").setTooltip("Wallpaper path is missing");
      }
    });
    setting.addButton(
      (btn) => btn.setButtonText("History").setIcon("history").setClass("mod-cta").onClick(async () => {
        containerEl.empty();
        await cleanInvalidWallpaperHistory(this.plugin);
        this.plugin.settings.HistoryPaths.forEach((entry) => {
          new import_obsidian4.Setting(containerEl).setName(entry.fileName).setDesc(entry.path).addButton((button) => {
            button.setButtonText("Select").onClick(async () => {
              this.plugin.settings.currentWallpaper = await WallpaperConfigUtils.GetCurrentConfig(this.plugin);
              const Index = this.plugin.settings.currentWallpaper.Index;
              const pluginId = this.plugin.manifest.id;
              const baseDir = `${this.app.vault.configDir}/plugins/${pluginId}/wallpapers`;
              const sourceFullPath = `${this.app.vault.configDir}/${entry.path}`;
              const ActiveSubFolder = WallpaperConfigUtils.computeActiveSubfolder(Index);
              const targetFullPath = `${baseDir}/active/${ActiveSubFolder}/${entry.fileName}`;
              const exists = await this.app.vault.adapter.exists(targetFullPath);
              if (!exists) {
                try {
                  await this.app.vault.adapter.copy(sourceFullPath, targetFullPath);
                } catch (e) {
                  console.error("Failed to copy wallpaper from history to active folder", e);
                  return;
                }
              }
              const relativeTargetFullPath = targetFullPath.replace(`${this.app.vault.configDir}/`, "");
              const folder = relativeTargetFullPath.substring(0, relativeTargetFullPath.lastIndexOf("/"));
              if (ActiveSubFolder === "normal") {
                await removeAllExcept(this.plugin, folder, relativeTargetFullPath);
              } else {
                const Path = `.obsidian/plugins/${pluginId}/wallpapers/active/${ActiveSubFolder}`;
                await removeUnusedFilesInFolder(this.plugin, Path, this.plugin.settings.currentWallpaper.Index, this.plugin.settings.currentWallpaper.path);
              }
              this.plugin.settings.currentWallpaper.path = `plugins/${pluginId}/wallpapers/active/${ActiveSubFolder}/${entry.fileName}`;
              this.plugin.settings.currentWallpaper.type = entry.type;
              this.plugin.settings.WallpaperConfigs[Index].path = `plugins/${pluginId}/wallpapers/active/${ActiveSubFolder}/${entry.fileName}`;
              this.plugin.settings.WallpaperConfigs[Index].type = entry.type;
              await Promise.all(
                Array.from(this.plugin.windows).map(async (win) => {
                  await toggleModalStyles(win.document, this.plugin);
                  await WallpaperApplier.applyWallpaper(this.plugin, true, win.document);
                })
              );
              UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
              await this.plugin.saveSettings();
              this.display();
            });
          });
        });
      })
    );
    setting.addButton((btn) => {
      btn.setButtonText("Check wallpaper").setIcon("image-file").onClick(async () => {
        const path = await SettingsUtils.getWallpaperPath(this.plugin, this.plugin.settings.currentWallpaper.Index);
        if (!path) {
          new import_obsidian4.Notice("No wallpaper path set.");
          return;
        }
        if (await SettingsUtils.wallpaperExists(this.plugin, path)) {
          new import_obsidian4.Notice("Wallpaper loaded successfully.");
        } else {
          new import_obsidian4.Notice("Wallpaper file not found. Resetting path.");
          this.plugin.settings.currentWallpaper.path = "";
          await this.plugin.saveSettings();
        }
      });
    });
    setting.addButton(
      (btn) => btn.setButtonText("Browse").setIcon("folder-open").setClass("mod-cta").onClick(async (evt) => {
        const doc = evt.currentTarget.ownerDocument;
        await openFilePicker(this.plugin, this.plugin.settings.currentWallpaper.Index, false, doc);
        for (const win of this.plugin.windows) {
          await toggleModalStyles(win.document, this.plugin);
        }
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Use global configuration").setDesc("When enabled, all wallpapers will use the global settings instead of individual configurations.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.globalConfig.enabled).onChange(async (value) => {
        this.plugin.settings.globalConfig.enabled = value;
        this.plugin.settings.Preview = false;
        this.plugin.settings.currentWallpaper = await WallpaperConfigUtils.GetCurrentConfig(this.plugin);
        await Promise.all(
          Array.from(this.plugin.windows).map(async (win) => {
            const media = win.document.getElementById("live-wallpaper-media");
            await toggleModalStyles(win.document, this.plugin);
            applyMediaStyles(media, this.plugin.settings.currentWallpaper);
            await WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
          })
        );
        UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
        await this.plugin.saveSettings();
        this.display();
      });
    });
    if (!this.plugin.settings.globalConfig.enabled) {
      const Preview = new import_obsidian4.Setting(containerEl).setName("Wallpaper preview").setDesc("Preview and test specific wallpaper schedules below.");
      Preview.addDropdown((dropdown) => {
        const MODAL_EFFECTS = {
          "0": "No Schedule",
          "1": "Day",
          "2": "Night",
          "3": "Monday",
          "4": "Tuesday",
          "5": "Wednesday",
          "6": "Thursday",
          "7": "Friday",
          "8": "Saturday",
          "9": "Sunday"
        };
        dropdown.addOptions(MODAL_EFFECTS).setValue(this.plugin.settings.Preview ? this.plugin.settings.currentWallpaper.Index.toString() : "X").onChange(async (value) => {
          const index = parseInt(value, 10);
          const targetConfig = this.plugin.settings.WallpaperConfigs[index];
          if (targetConfig) {
            this.plugin.settings.currentWallpaper = targetConfig;
            this.plugin.settings.Preview = true;
            await Promise.all(
              Array.from(this.plugin.windows).map(
                async (win) => {
                  await toggleModalStyles(win.document, this.plugin);
                  await WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
                }
              )
            );
            UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
            new import_obsidian4.Notice(`Previewing wallpaper for ${MODAL_EFFECTS[value]}`);
            await this.plugin.saveSettings();
            this.display();
          }
        });
      });
      Preview.addButton((button) => {
        button.setButtonText("Turn off preview").setIcon("eye-off").onClick(async () => {
          const currentConfig = await WallpaperConfigUtils.GetCurrentConfig(this.plugin);
          if (currentConfig) {
            this.plugin.settings.currentWallpaper = { ...currentConfig };
            this.plugin.settings.Preview = false;
            await Promise.all(
              Array.from(this.plugin.windows).map(async (win) => {
                await toggleModalStyles(win.document, this.plugin);
                await WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
              })
            );
            new import_obsidian4.Notice("Preview turned off restored scheduled wallpaper.");
            UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
            await this.plugin.saveSettings();
            this.display();
          }
        });
      });
    }
    new import_obsidian4.Setting(containerEl).setName("Use full-resolution wallpapers").setDesc("Keeps the original image size. To apply, add the wallpaper again.").addToggle((Toggle) => {
      Toggle.setValue(this.plugin.settings.currentWallpaper.Quality).onChange(async (value) => {
        this.plugin.settings.currentWallpaper.Quality = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Limit wallpaper size").setDesc("Enable to restrict wallpapers to a maximum size (currently 12 MB). Disable for unlimited size.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.SizeLimited).onChange(async (value) => {
        this.plugin.settings.SizeLimited = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Enable reposition").setDesc("Toggle to adjust the wallpaper's position and scale.").addToggle((Toggle) => {
      Toggle.setValue(this.plugin.settings.currentWallpaper.Reposition).onChange(async (value) => {
        for (const win of this.plugin.windows) {
          const media = win.document.getElementById("live-wallpaper-media");
          if (value) {
            SettingsUtils.enableReposition(this.plugin, win.document);
            SettingsUtils.applyImagePosition(media, this.plugin.settings.currentWallpaper.positionX, this.plugin.settings.currentWallpaper.positionY, this.plugin.settings.currentWallpaper.Scale);
          } else {
            SettingsUtils.disableReposition(win);
            applyMediaStyles(media, this.plugin.settings.currentWallpaper);
          }
        }
        this.plugin.settings.currentWallpaper.Reposition = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    if (this.plugin.settings.currentWallpaper.Reposition) {
      new import_obsidian4.Setting(containerEl).setName("Horizontal position").setDesc("Adjust the horizontal position of the wallpaper.").addSlider((slider) => {
        slider.setLimits(0, 100, 1).setValue(this.plugin.settings.currentWallpaper.positionX).setDynamicTooltip().setInstant(true).onChange(async (value) => {
          this.plugin.settings.currentWallpaper.positionX = value;
          this.plugin.debouncedSave();
          await Promise.all(
            Array.from(this.plugin.windows).map(async (win) => {
              const media = win.document.getElementById("live-wallpaper-media");
              if (media) {
                SettingsUtils.applyImagePosition(media, this.plugin.settings.currentWallpaper.positionX, this.plugin.settings.currentWallpaper.positionY, this.plugin.settings.currentWallpaper.Scale);
              }
            })
          );
        });
      });
      new import_obsidian4.Setting(containerEl).setName("Vertical position").setDesc("Adjust the vertical position of the wallpaper.").addSlider((slider) => {
        slider.setLimits(0, 100, 1).setValue(this.plugin.settings.currentWallpaper.positionY).setDynamicTooltip().setInstant(true).onChange(async (value) => {
          this.plugin.settings.currentWallpaper.positionY = value;
          this.plugin.debouncedSave();
          await Promise.all(
            Array.from(this.plugin.windows).map(async (win) => {
              const media = win.document.getElementById("live-wallpaper-media");
              if (media) {
                SettingsUtils.applyImagePosition(media, this.plugin.settings.currentWallpaper.positionX, this.plugin.settings.currentWallpaper.positionY, this.plugin.settings.currentWallpaper.Scale);
              }
            })
          );
        });
      });
      new import_obsidian4.Setting(containerEl).setName("Image scale").setDesc("Adjust the size of the wallpaper.").addSlider((slider) => {
        slider.setLimits(0.5, 2, 0.1).setValue(this.plugin.settings.currentWallpaper.Scale ?? 1).setDynamicTooltip().setInstant(true).onChange(async (value) => {
          this.plugin.settings.currentWallpaper.Scale = value;
          this.plugin.debouncedSave();
          await Promise.all(
            Array.from(this.plugin.windows).map(async (win) => {
              const media = win.document.getElementById("live-wallpaper-media");
              if (media) {
                await SettingsUtils.applyImagePosition(
                  media,
                  this.plugin.settings.currentWallpaper.positionX,
                  this.plugin.settings.currentWallpaper.positionY,
                  this.plugin.settings.currentWallpaper.Scale
                );
              }
            })
          );
        });
      });
      new import_obsidian4.Setting(containerEl).setName("Image position").setDesc("Adjust the image alignment when the main focus is off-center.").addDropdown((dropdown) => {
        positions.forEach((label, key) => {
          dropdown.addOption(key.toString(), label);
        });
        dropdown.setValue(this.plugin.settings.currentWallpaper.position).onChange(async (value) => {
          this.plugin.settings.currentWallpaper.position = value;
          this.plugin.debouncedSave();
          await Promise.all(
            Array.from(this.plugin.windows).map(async (win) => {
              const media = win.document.getElementById("live-wallpaper-media");
              if (media) {
                this.plugin.settings.currentWallpaper.positionX = Number.parseInt(value);
                SettingsUtils.applyImagePosition(media, this.plugin.settings.currentWallpaper.positionX, this.plugin.settings.currentWallpaper.positionY, this.plugin.settings.currentWallpaper.Scale);
              }
            })
          );
          this.display();
        });
      });
    } else {
      new import_obsidian4.Setting(containerEl).setName("Disable image cover").setDesc("Toggle this option to turn off object-fit: cover for the image.").addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.currentWallpaper.useObjectFit).onChange(async (value) => {
          for (const win of this.plugin.windows) {
            const media = win.document.getElementById("live-wallpaper-media");
            if (media) {
              Object.assign(media.style, {
                objectFit: this.plugin.settings.currentWallpaper.useObjectFit ? "unset" : "cover"
              });
            }
          }
          this.plugin.settings.currentWallpaper.useObjectFit = value;
          this.plugin.debouncedSave();
        });
      });
    }
    new import_obsidian4.Setting(containerEl).setName("Wallpaper opacity").setDesc(
      "Controls the transparency level of the wallpaper (0% = fully transparent, 100% = fully visible)"
    ).addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.currentWallpaper.opacity}%`,
        cls: "setting-item-description"
      });
      const initialValue = this.plugin.settings.AdnvOpend ? 100 : this.plugin.settings.currentWallpaper.opacity;
      if (this.plugin.settings.AdnvOpend) {
        slider.setDisabled(true);
        valueEl.textContent = ` 100%`;
      }
      slider.setLimits(0, 80, 1).setValue(initialValue).setDisabled(this.plugin.settings.AdnvOpend).setDynamicTooltip().setInstant(true).onChange(async (v) => {
        if (!this.plugin.settings.AdnvOpend) {
          this.plugin.settings.currentWallpaper.opacity = v;
          valueEl.textContent = ` ${v}%`;
          this.plugin.debouncedApplyWallpaper();
          this.plugin.debouncedSave();
        }
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Blur radius").setDesc("Applies a blur effect to the wallpaper in pixels").addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.currentWallpaper.blurRadius}px`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(0, 20, 1).setValue(this.plugin.settings.currentWallpaper.blurRadius).onChange(async (v) => {
        this.plugin.settings.currentWallpaper.blurRadius = v;
        valueEl.textContent = ` ${v}px`;
        this.plugin.debouncedApplyWallpaper();
        this.plugin.debouncedSave();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Brightness").setDesc("Adjusts the wallpaper brightness (100% = normal)").addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.currentWallpaper.brightness}%`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(20, 130, 1).setValue(this.plugin.settings.currentWallpaper.brightness).onChange(async (v) => {
        this.plugin.settings.currentWallpaper.brightness = v;
        valueEl.textContent = ` ${v}%`;
        this.plugin.debouncedApplyWallpaper();
        this.plugin.debouncedSave();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Contrast").setDesc("Controls the wallpaper contrast intensity 100% represents the original image").addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.currentWallpaper.contrast}%`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(0, 200, 1).setValue(this.plugin.settings.currentWallpaper.contrast).onChange(async (v) => {
        this.plugin.settings.currentWallpaper.contrast = v;
        valueEl.textContent = ` ${v}%`;
        this.plugin.debouncedApplyWallpaper();
        this.plugin.debouncedSave();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Layer position (z\u2011index)").setDesc(
      "Determines the stacking order: higher values bring the wallpaper closer to the front"
    ).addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.currentWallpaper.zIndex}`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(-10, 100, 1).setValue(this.plugin.settings.currentWallpaper.zIndex).setDisabled(this.plugin.settings.AdnvOpend).onChange(async (v) => {
        if (!this.plugin.settings.AdnvOpend) {
          this.plugin.settings.currentWallpaper.zIndex = v;
          valueEl.textContent = ` ${v}`;
          this.plugin.debouncedApplyWallpaper();
          this.plugin.debouncedSave();
        }
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Change playback speed").setDesc(
      "Adjust the playback speed for videos (0.25x \u2013 2x). This does not affect GIFs."
    ).addSlider((slider) => {
      const valueEl = containerEl.createSpan({
        text: `${this.plugin.settings.currentWallpaper.playbackSpeed.toFixed(2)}x`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(0.25, 2, 0.25).setValue(this.plugin.settings.currentWallpaper.playbackSpeed).onChange(async (val) => {
        this.plugin.settings.currentWallpaper.playbackSpeed = val;
        this.plugin.debouncedApplyWallpaper();
        this.plugin.debouncedSave();
        valueEl.setText(`${val.toFixed(2)}x`);
      });
    });
    if (import_obsidian4.Platform.isMobileApp) {
      const desc = document.createElement("div");
      desc.textContent = "On mobile devices, zooming can affect background size. You can manually set the height and width to maintain consistency.";
      containerEl.appendChild(desc);
      new import_obsidian4.Setting(containerEl).setName("Background width").setDesc(
        "Set a custom width for the background on mobile (e.g., 100vw or 500px)."
      ).addText(
        (text) => text.setPlaceholder("e.g., 100vw").setValue(this.plugin.settings.mobileBackgroundWidth || "").onChange(async (value) => {
          this.plugin.settings.mobileBackgroundWidth = value;
          await this.plugin.saveSettings();
          for (const win of this.plugin.windows) {
            ChangeWallpaperContainer(win.document, { width: this.plugin.settings.mobileBackgroundWidth, height: this.plugin.settings.mobileBackgroundHeight });
          }
        })
      );
      new import_obsidian4.Setting(containerEl).setName("Background height").setDesc(
        "Set a custom height for the background on mobile (e.g., 100vh or 800px)."
      ).addText(
        (text) => text.setPlaceholder("e.g., 100vh").setValue(this.plugin.settings.mobileBackgroundHeight || "").onChange(async (value) => {
          this.plugin.settings.mobileBackgroundHeight = value;
          await this.plugin.saveSettings();
          for (const win of this.plugin.windows) {
            ChangeWallpaperContainer(win.document, { width: this.plugin.settings.mobileBackgroundWidth, height: this.plugin.settings.mobileBackgroundHeight });
          }
        })
      );
      new import_obsidian4.Setting(containerEl).setName("Match screen size").setDesc(
        "Automatically set the background size to match your device's screen dimensions."
      ).addButton(
        (button) => button.setButtonText("Resize to screen").onClick(async () => {
          for (const win of this.plugin.windows) {
            this.plugin.settings.mobileBackgroundHeight = win.innerHeight.toString() + "px";
            this.plugin.settings.mobileBackgroundWidth = win.innerWidth.toString() + "px";
            ChangeWallpaperContainer(win.document, { width: this.plugin.settings.mobileBackgroundWidth, height: this.plugin.settings.mobileBackgroundHeight });
          }
          await this.plugin.saveSettings();
          this.display();
        })
      );
    }
    new import_obsidian4.Setting(containerEl).setName("Reset options").setDesc("Resets all settings").addButton(
      (Button) => Button.setButtonText("Reset").onClick(async () => {
        const defaults = DEFAULT_SETTINGS;
        this.plugin.settings.currentWallpaper.path = defaults.currentWallpaper.path;
        this.plugin.settings.currentWallpaper.type = defaults.currentWallpaper.type;
        this.plugin.settings.HistoryPaths = defaults.HistoryPaths;
        this.plugin.settings.currentWallpaper.playbackSpeed = defaults.currentWallpaper.playbackSpeed;
        this.plugin.settings.currentWallpaper.opacity = defaults.currentWallpaper.opacity;
        this.plugin.settings.currentWallpaper.zIndex = defaults.currentWallpaper.zIndex;
        this.plugin.settings.currentWallpaper.blurRadius = defaults.currentWallpaper.blurRadius;
        this.plugin.settings.currentWallpaper.brightness = defaults.currentWallpaper.brightness;
        this.plugin.settings.currentWallpaper.contrast = defaults.currentWallpaper.contrast;
        this.plugin.settings.mobileBackgroundHeight = defaults.mobileBackgroundHeight;
        this.plugin.settings.mobileBackgroundWidth = defaults.mobileBackgroundWidth;
        await this.plugin.saveSettings();
        for (const win of this.plugin.windows) {
          WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
        }
        this.display();
      })
    );
  }
};

// src/Settings/ScheduledWallpaperSettings.ts
var import_obsidian5 = require("obsidian");
var ScheduledApp = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian5.Setting(containerEl).setName("Day and night mode").setDesc("Enable different wallpapers for day and night").addToggle(
      (toggle) => toggle.setValue(
        this.plugin.settings.ScheduledOptions.dayNightMode
      ).onChange(async (value) => {
        const otherEnabled = Scheduler.Check(
          this.plugin.settings.ScheduledOptions,
          "dayNightMode"
        );
        if (value && otherEnabled) {
          new import_obsidian5.Notice("Only one mode can be enabled at a time.");
          toggle.setValue(false);
          return;
        }
        this.plugin.settings.ScheduledOptions.dayNightMode = value;
        await Promise.all(
          Array.from(this.plugin.windows).map(
            async (win) => {
              await WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
            }
          )
        );
        UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
        await this.plugin.saveSettings();
        this.display();
      })
    );
    if (this.plugin.settings.ScheduledOptions.dayNightMode) {
      const paths = WallpaperConfigUtils.getPaths(this.plugin.settings.currentWallpaper.Index, this.plugin.settings.WallpaperConfigs);
      if (!paths[0]) paths[0] = "";
      if (!paths[1]) paths[1] = "";
      new import_obsidian5.Setting(containerEl).setName("Day Wallpaper").setDesc("Wallpaper to use during the day").addButton((btn) => btn.setIcon("folder-open").setTooltip("Browse for file").onClick((evt) => {
        const doc = evt.currentTarget.ownerDocument;
        openFilePicker(this.plugin, 1, true, doc);
      }));
      new import_obsidian5.Setting(containerEl).setName("Night Wallpaper").setDesc("Wallpaper to use at night").addButton((btn) => btn.setIcon("folder-open").setTooltip("Browse for file").onClick((evt) => {
        const doc = evt.currentTarget.ownerDocument;
        openFilePicker(this.plugin, 2, true, doc);
      }));
      let dayTimeValue = this.plugin.settings.ScheduledOptions.dayStartTime;
      let nightTimeValue = this.plugin.settings.ScheduledOptions.nightStartTime;
      const Time = new import_obsidian5.Setting(containerEl).setName("Time").setDesc("Enter time in HH:MM format (e.g., 23:54)");
      Time.addText((area) => {
        area.setPlaceholder("HH:MM").setValue(this.plugin.settings.ScheduledOptions.dayStartTime ?? "").onChange((value) => {
          dayTimeValue = value;
        });
      });
      Time.addText((area) => {
        area.setPlaceholder("HH:MM").setValue(this.plugin.settings.ScheduledOptions.nightStartTime ?? "").onChange((value) => {
          nightTimeValue = value;
        });
      });
      new import_obsidian5.Setting(containerEl).addButton(
        (btn) => btn.setButtonText("Apply now").setCta().onClick(async () => {
          if (Scheduler.ValidateText(dayTimeValue) && Scheduler.ValidateText(nightTimeValue)) {
            this.plugin.settings.ScheduledOptions.dayStartTime = dayTimeValue;
            this.plugin.settings.ScheduledOptions.nightStartTime = nightTimeValue;
            await this.plugin.saveSettings();
            new import_obsidian5.Notice("Wallpaper schedule has been set.");
            for (const win of this.plugin.windows) {
              await WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
            }
            UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
          } else {
            new import_obsidian5.Notice(
              "One or both time values are invalid. Use HH:MM format."
            );
          }
        })
      );
      new import_obsidian5.Setting(containerEl).setName("Check day and night wallpapers").setDesc(
        "Check whether the paths to the day and night wallpapers are set and whether the files exist."
      ).addButton(async (btn) => {
        btn.setButtonText("Check").onClick(async () => {
          const dayPath = this.plugin.settings.WallpaperConfigs[1].path;
          const nightPath = this.plugin.settings.WallpaperConfigs[2].path;
          const dayExists = dayPath ? await SettingsUtils.getPathExists(this.plugin, dayPath) : false;
          const nightExists = nightPath ? await SettingsUtils.getPathExists(this.plugin, nightPath) : false;
          if (dayExists && nightExists) {
            new import_obsidian5.Notice("Both wallpapers (day and night) are set and exist.");
          } else if (!dayExists && !nightExists) {
            new import_obsidian5.Notice("Both wallpapers are missing: day and night.");
          } else if (!dayExists) {
            new import_obsidian5.Notice("The day wallpaper is not set or does not exist.");
          } else {
            new import_obsidian5.Notice("The night wallpaper is not set or does not exist.");
          }
        });
      });
    }
    new import_obsidian5.Setting(containerEl).setName("Weekly mode").setDesc("Enable different wallpapers for any day").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ScheduledOptions.weekly).onChange(async (value) => {
        const otherEnabled = Scheduler.Check(
          this.plugin.settings.ScheduledOptions,
          "weekly"
        );
        if (value && otherEnabled) {
          new import_obsidian5.Notice("Only one mode can be enabled at a time.");
          toggle.setValue(false);
          return;
        }
        this.plugin.settings.ScheduledOptions.weekly = value;
        await Promise.all(
          Array.from(this.plugin.windows).map(
            async (win) => {
              await WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
            }
          )
        );
        UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
        await this.plugin.saveSettings();
        this.display();
      })
    );
    if (this.plugin.settings.ScheduledOptions.weekly) {
      const paths = WallpaperConfigUtils.getPaths(this.plugin.settings.currentWallpaper.Index, this.plugin.settings.WallpaperConfigs);
      let selectedDay = "Monday";
      const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ];
      daysOfWeek.forEach((_, index) => {
        if (!paths[index]) {
          paths[index] = "";
        }
      });
      new import_obsidian5.Setting(containerEl).setName("Day Wallpaper").setDesc("Wallpaper to use during the day").addButton(
        (btn) => btn.setIcon("folder-open").setTooltip("Browse for file").onClick((evt) => {
          const doc = evt.currentTarget.ownerDocument;
          const index = daysOfWeek.indexOf(selectedDay);
          if (index !== -1) {
            openFilePicker(this.plugin, index + 3, true, doc);
          } else {
            console.warn("Invalid day selected");
          }
        })
      ).addDropdown((dropdown) => {
        daysOfWeek.forEach((day) => {
          dropdown.addOption(day, day);
        });
        dropdown.setValue(selectedDay);
        dropdown.onChange((value) => {
          selectedDay = value;
        });
      });
      new import_obsidian5.Setting(containerEl).setName("Check weekly wallpapers").setDesc(
        "Check if the paths for the weekly wallpapers are set and if the files exist."
      ).addButton((btn) => {
        btn.setButtonText("Check").onClick(async () => {
          const missingDays = [];
          for (let i = 0; i < paths.length; i++) {
            const pathExists = await SettingsUtils.getPathExists(this.plugin, paths[i]);
            if (!pathExists) {
              missingDays.push(daysOfWeek[i]);
            }
          }
          if (missingDays.length > 0) {
            new import_obsidian5.Notice(`Missing wallpapers for: ${missingDays.join(", ")}`);
          } else {
            new import_obsidian5.Notice("All weekly wallpapers are loaded.");
          }
        });
      });
    }
    new import_obsidian5.Setting(containerEl).setName("Auto-rotate wallpapers").setDesc("Change wallpapers automatically over time").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ScheduledOptions.autoSwitch).onChange(async (value) => {
        const otherEnabled = Scheduler.Check(
          this.plugin.settings.ScheduledOptions,
          "autoSwitch"
        );
        if (value && otherEnabled) {
          new import_obsidian5.Notice("Only one mode can be enabled at a time.");
          toggle.setValue(false);
          return;
        }
        this.plugin.settings.ScheduledOptions.autoSwitch = value;
        const results = await Promise.all(
          Array.from(this.plugin.windows).map(
            (win) => WallpaperApplier.applyWallpaper(this.plugin, false, win.document)
          )
        );
        if (results.some((r) => !r)) {
          await this.plugin.saveSettings();
          this.display();
          return;
        }
        UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
        await this.plugin.saveSettings();
        this.display();
      })
    );
    if (this.plugin.settings.ScheduledOptions.autoSwitch) {
      this.plugin.settings.WallpaperConfigs.slice(10, this.plugin.settings.WallpaperConfigs.length).forEach((Config) => {
        new import_obsidian5.Setting(containerEl).setName(`Wallpaper ${GetFileName(Config.path)}`).setDesc("Order in the automatic rotation").addButton(
          (btn) => btn.setIcon("folder-open").setTooltip("Browse for file").onClick(async (evt) => {
            const doc = evt.currentTarget.ownerDocument;
            await openFilePicker(this.plugin, Config.Index, true, doc);
            await Promise.all(
              Array.from(this.plugin.windows).map(
                async (win) => {
                  await toggleModalStyles(win.document, this.plugin);
                }
              )
            );
            this.display();
          })
        ).addExtraButton(
          (btn) => btn.setIcon("x").setTooltip("Remove").onClick(async () => {
            await removeFileIfUnused(this.plugin, Config.Index, this.plugin.settings.WallpaperConfigs[Config.Index].path);
            this.plugin.settings.WallpaperConfigs = WallpaperConfigUtils.RemoveConfig(this.plugin.settings.WallpaperConfigs, Config);
            await this.plugin.saveSettings();
            this.display();
          })
        );
      });
      new import_obsidian5.Setting(containerEl).addButton(
        (btn) => btn.setButtonText("Add new element").setClass("text-arena-center-button").setTooltip("Add a new row to the table").onClick(async (evt) => {
          const doc = evt.currentTarget.ownerDocument;
          this.plugin.settings.WallpaperConfigs = WallpaperConfigUtils.NewConfig(this.plugin.settings.WallpaperConfigs);
          await openFilePicker(this.plugin, this.plugin.settings.WallpaperConfigs.length - 1, true, doc);
          await Promise.all(
            Array.from(this.plugin.windows).map(
              async (win) => {
                await toggleModalStyles(win.document, this.plugin);
              }
            )
          );
          UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
          await this.plugin.saveSettings();
          this.display();
        })
      );
      new import_obsidian5.Setting(containerEl).setName("Wallpaper folder").setDesc("Select a folder and load all wallpapers").addButton(
        (btn) => btn.setIcon("folder").setButtonText("Select folder").onClick(async (evt) => {
          const doc = evt.currentTarget.ownerDocument;
          await this.plugin.openFolderPicker(doc);
          await Promise.all(
            Array.from(this.plugin.windows).map(
              async (win) => {
                await toggleModalStyles(win.document, this.plugin);
              }
            )
          );
          UpdatePaths(this.plugin, { path: this.plugin.settings.currentWallpaper.path, type: this.plugin.settings.currentWallpaper.type });
          this.display();
        })
      );
    }
    const WALLPAPER_INTERVALS = {
      "00:01": "Every 1 minute",
      "00:05": "Every 5 minutes",
      "00:10": "Every 10 minutes",
      "00:30": "Every 30 minutes",
      "01:00": "Every 1 hour",
      "custom": "Custom interval"
    };
    const currentInterval = this.plugin.settings.ScheduledOptions.intervalCheckTime ?? "00:10";
    new import_obsidian5.Setting(containerEl).setName("Wallpaper change interval").setDesc("How often the wallpaper should be checked and changed").addDropdown((dropdown) => {
      dropdown.addOptions(WALLPAPER_INTERVALS);
      dropdown.setValue(this.plugin.settings.ScheduledOptions.isCustomInterval ? "custom" : currentInterval);
      dropdown.onChange(async (value) => {
        if (value !== "custom") {
          this.plugin.settings.ScheduledOptions.intervalCheckTime = value;
          this.plugin.settings.ScheduledOptions.isCustomInterval = false;
          await this.plugin.saveSettings();
          this.plugin.startDayNightWatcher();
          this.display();
        } else {
          this.plugin.settings.ScheduledOptions.intervalCheckTime = "00:42";
          this.plugin.settings.ScheduledOptions.isCustomInterval = true;
          await this.plugin.saveSettings();
          this.display();
        }
      });
    });
    if (this.plugin.settings.ScheduledOptions.isCustomInterval) {
      let customValue = currentInterval;
      new import_obsidian5.Setting(containerEl).setName("Custom interval").setDesc("Enter time in HH:MM format (e.g., 00:42)").addText((text) => {
        text.setPlaceholder("HH:MM").setValue(currentInterval).onChange((value) => {
          customValue = value;
        });
      });
      new import_obsidian5.Setting(containerEl).addButton(
        (btn) => btn.setButtonText("Apply custom interval").setCta().onClick(async () => {
          if (!Scheduler.ValidateText(customValue)) {
            new import_obsidian5.Notice("Invalid format. Use HH:MM.");
            return;
          }
          this.plugin.settings.ScheduledOptions.intervalCheckTime = customValue;
          await this.plugin.saveSettings();
          this.plugin.startDayNightWatcher();
          new import_obsidian5.Notice("Custom interval applied.");
        })
      );
    }
  }
};

// src/Settings/TransparencySettings.ts
var import_obsidian6 = require("obsidian");
var TransparencySettingsTab = class extends import_obsidian6.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const transparencySection = containerEl.createDiv();
    new import_obsidian6.Setting(transparencySection).setName("Transparency options").setHeading();
    new import_obsidian6.Setting(transparencySection).setName(
      "Fine-tune transparency and visual effects to seamlessly integrate your wallpaper. These features allow for deeper customization but may require CSS knowledge."
    );
    const toggleTransparencyButton = transparencySection.createEl("button", {
      text: this.plugin.settings.AdnvOpend ? "Disable transparency settings" : "Enable transparency settings"
    });
    const transparencyOptionsContainer = transparencySection.createDiv();
    transparencyOptionsContainer.style.display = this.plugin.settings.AdnvOpend ? "block" : "none";
    toggleTransparencyButton.onclick = async () => {
      this.plugin.settings.AdnvOpend = !this.plugin.settings.AdnvOpend;
      transparencyOptionsContainer.style.display = this.plugin.settings.AdnvOpend ? "block" : "none";
      toggleTransparencyButton.setText(this.plugin.settings.AdnvOpend ? "Hide transparency options" : "Show transparency options");
      for (const win of this.plugin.windows) {
        await toggleModalStyles(win.document, this.plugin);
        WallpaperApplier.applyWallpaper(this.plugin, false, win.document);
      }
      this.plugin.saveSettings();
      this.display();
    };
    const tableDescription = transparencyOptionsContainer.createEl("p", {
      cls: "transparency-options-description"
    });
    tableDescription.innerHTML = "Define UI elements and CSS attributes that should be made transparent. This allows the wallpaper to appear behind the interface, improving readability and aesthetics. Example attributes you can modify:<br>\u2022 attribute: <code>--background-primary</code><br>\u2022 attribute: <code>--background-secondary</code><br>\u2022 attribute: <code>--background-secondary-alt</code><br>\u2022 attribute: <code>--col-pr-background</code><br>\u2022 attribute: <code>--col-bckg-mainpanels</code><br>\u2022 attribute: <code>--col-txt-titlebars</code><br><br>You can inspect elements and variables using browser dev tools (CTRL + SHIFT + I) to discover more attributes to adjust.";
    const tableContainer = transparencyOptionsContainer.createEl("div", {
      cls: "text-arena-table-container"
    });
    const table = tableContainer.createEl("table", { cls: "text-arena-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Attribute to modify" });
    this.plugin.settings.TextArenas.forEach((entry, index) => {
      const row = table.createEl("tr");
      new import_obsidian6.Setting(row).addText((text) => {
        text.setValue(entry.attribute).onChange(async (value) => {
          if (!SettingsUtils.AttributeValid(value)) {
            return;
          }
          for (const win of this.plugin.windows) {
            RemoveChanges(win.document, this.plugin.settings.TextArenas, index);
          }
          this.plugin.settings.TextArenas[index].attribute = value;
          for (const win of this.plugin.windows) {
            await LoadOrUnloadChanges(win.document, this.plugin.settings.TextArenas, true);
            ApplyChanges(win.document, this.plugin.settings.TextArenas, index);
          }
          await this.plugin.saveSettings();
        });
      });
      const actionCell = row.createEl("td");
      new import_obsidian6.Setting(actionCell).addExtraButton((btn) => {
        btn.setIcon("cross").setTooltip("Remove this entry").onClick(() => {
          for (const win of this.plugin.windows) {
            RemoveChanges(win.document, this.plugin.settings.TextArenas, index);
          }
          this.plugin.settings.TextArenas.splice(index, 1);
          for (const win of this.plugin.windows) {
            LoadOrUnloadChanges(win.document, this.plugin.settings.TextArenas, true);
          }
          this.plugin.saveSettings();
          this.display();
        });
      });
    });
    new import_obsidian6.Setting(transparencyOptionsContainer).addButton(
      (btn) => btn.setButtonText("Add new element").setClass("text-arena-center-button").setTooltip("Add a new row to the table").onClick(() => {
        this.plugin.settings.TextArenas.push({ attribute: "" });
        this.display();
      })
    );
    let colorPickerRef = null;
    new import_obsidian6.Setting(transparencyOptionsContainer).setName("Custom background color").setDesc("Set a custom color for the plugin's styling logic").addColorPicker((picker) => {
      colorPickerRef = picker;
      picker.setValue(this.plugin.settings.Color || "#000000").onChange(async (value) => {
        this.plugin.settings.Color = value;
        await this.plugin.saveSettings();
        for (const win of this.plugin.windows) {
          applyBackgroundColor(win.document, this.plugin.settings.AdnvOpend, this.plugin.settings.Color);
        }
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
        this.plugin.settings.Color = "";
        await this.plugin.saveSettings();
        for (const win of this.plugin.windows) {
          applyBackgroundColor(win.document, this.plugin.settings.AdnvOpend, this.plugin.settings.Color);
        }
        if (colorPickerRef) {
          colorPickerRef.setValue("#000000");
        }
      })
    );
    if (import_obsidian6.Platform.isDesktop) {
      new import_obsidian6.Setting(transparencyOptionsContainer).setName("Modal background effect").setDesc("Choose how the modal background is styled when transparency options are enabled").addDropdown((dropdown) => {
        const MODAL_EFFECTS = {
          none: "No effect",
          blur: "Apply blur effect",
          dim: "Dim the background",
          "blur+dim": "Apply both blur and dim effects"
        };
        dropdown.addOptions(MODAL_EFFECTS).setValue(this.plugin.settings.modalStyle.effect).onChange(async (value) => {
          this.plugin.settings.modalStyle.effect = value;
          await this.plugin.saveSettings();
          for (const win of this.plugin.windows) {
            await toggleModalStyles(win.document, this.plugin);
          }
        });
      });
      new import_obsidian6.Setting(transparencyOptionsContainer).setName("Modal blur radius").setDesc("Adjust the blur intensity applied to the modal background").addSlider((slider) => {
        slider.setValue(this.plugin.settings.modalStyle.blurRadius).setLimits(0, 30, 1).setInstant(true).setDynamicTooltip().onChange(async (value) => {
          this.plugin.settings.modalStyle.blurRadius = value;
          for (const win of this.plugin.windows) {
            await toggleModalStyles(win.document, this.plugin);
          }
          this.plugin.debouncedSave();
        });
      });
      new import_obsidian6.Setting(transparencyOptionsContainer).setName("Modal dim opacity").setDesc("Adjust the darkness level applied to the modal background").addSlider((slider) => {
        slider.setValue(this.plugin.settings.modalStyle.dimOpacity * 100).setLimits(0, 100, 5).setInstant(true).setDynamicTooltip().onChange(async (value) => {
          this.plugin.settings.modalStyle.dimOpacity = value / 100;
          for (const win of this.plugin.windows) {
            await toggleModalStyles(win.document, this.plugin);
          }
          this.plugin.debouncedSave();
        });
      });
      new import_obsidian6.Setting(transparencyOptionsContainer).setName("Modal dim color").setDesc("Choose whether the modal background dim is black or white").addDropdown((dropdown) => {
        dropdown.addOption("black", "Black").addOption("white", "White").setValue(this.plugin.settings.modalStyle.dimColor).onChange(async (value) => {
          this.plugin.settings.modalStyle.dimColor = value;
          for (const win of this.plugin.windows) {
            await toggleModalStyles(win.document, this.plugin);
          }
          this.plugin.debouncedSave();
        });
      });
      new import_obsidian6.Setting(transparencyOptionsContainer).setName("Disable modal background").setDesc("Turns off the default modal background dim").addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.modalStyle.disableModalBg).onChange(async (value) => {
          this.plugin.settings.modalStyle.disableModalBg = value;
          for (const win of this.plugin.windows) {
            await toggleModalStyles(win.document, this.plugin);
          }
          this.plugin.debouncedSave();
        });
      });
      new import_obsidian6.Setting(transparencyOptionsContainer).setName("Reset modal settings").setDesc("Restore default blur and dim opacity for the modal background").addButton(
        (btn) => btn.setIcon("reset").setTooltip("Reset modal styles to default").onClick(async () => {
          const defaults = DEFAULT_SETTINGS;
          this.plugin.settings.modalStyle = { ...defaults.modalStyle };
          for (const win of this.plugin.windows) {
            await toggleModalStyles(win.document, this.plugin);
          }
          this.plugin.debouncedSave();
          this.display();
        })
      );
    }
  }
};

// src/Settings/SettingsManager.ts
var LiveWallpaperSettingManager = class extends import_obsidian7.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.regularTab = new SettingsApp(app, plugin);
    this.scheduledTab = new ScheduledApp(app, plugin);
    this.transparencyTab = new TransparencySettingsTab(app, plugin);
    this.activeTab = "regular";
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const navContainer = containerEl.createDiv({
      cls: "live-wallpaper-settings-nav"
    });
    new import_obsidian7.Setting(navContainer).addButton((button) => {
      button.setButtonText("General settings").setClass(this.activeTab === "regular" ? "mod-cta" : "mod-off").onClick(() => {
        this.activeTab = "regular";
        this.display();
      });
    }).addButton((button) => {
      button.setButtonText("Scheduled themes").setClass(this.activeTab === "dynamic" ? "mod-cta" : "mod-off").onClick(() => {
        this.activeTab = "dynamic";
        this.display();
      });
    }).addButton((button) => {
      button.setButtonText("Transparency settings").setClass(this.activeTab === "transparency" ? "mod-cta" : "mod-off").onClick(() => {
        this.activeTab = "transparency";
        this.display();
      });
    });
    const contentContainer = containerEl.createDiv({
      cls: "live-wallpaper-settings-content"
    });
    if (this.activeTab === "regular") {
      this.regularTab.containerEl = contentContainer;
      this.regularTab.display();
    } else if (this.activeTab === "transparency") {
      this.transparencyTab.containerEl = contentContainer;
      this.transparencyTab.display();
    } else {
      this.scheduledTab.containerEl = contentContainer;
      this.scheduledTab.display();
    }
  }
};

// src/MigrationManager.ts
var Migrate = class {
  static async migrateOldSettings(Plugin2) {
    const settings = Plugin2.settings;
    const scheduled = Plugin2.settings.scheduledWallpapers;
    if (!scheduled || typeof scheduled !== "object") {
      return;
    }
    if (Array.isArray(scheduled.wallpaperPaths)) {
      const oldPaths = scheduled.wallpaperPaths;
      scheduled.wallpaperDayPaths = [oldPaths[0] ?? "", oldPaths[1] ?? ""];
      scheduled.wallpaperWeekPaths = oldPaths.slice(2, 9);
      delete scheduled.wallpaperPaths;
    }
    if (Array.isArray(scheduled.wallpaperTypes)) {
      const oldTypes = scheduled.wallpaperTypes;
      scheduled.wallpaperDayTypes = [
        this.isValidWallpaperType(oldTypes[0]) ? oldTypes[0] : "image",
        this.isValidWallpaperType(oldTypes[1]) ? oldTypes[1] : "image"
      ];
      scheduled.wallpaperWeekTypes = oldTypes.slice(2, 9).map((t) => t ?? "image");
      delete scheduled.wallpaperTypes;
    }
    const pluginDir = `${Plugin2.app.vault.configDir}/plugins/${Plugin2.manifest.id}`;
    const oldDir = `${pluginDir}/wallpaper`;
    const exists = await Plugin2.app.vault.adapter.exists(oldDir);
    if (exists) {
      const oldFolder = `${Plugin2.app.vault.configDir}/plugins/${Plugin2.manifest.id}/wallpaper`;
      try {
        await Plugin2.app.vault.adapter.rmdir(oldFolder, true);
      } catch (err) {
        console.error("Could not remove old wallpaper folder:", err);
      }
    }
    if (!Array.isArray(settings.WallpaperConfigs)) {
      settings.WallpaperConfigs = Array.from({ length: 10 }, (_, i) => ({
        ...defaultWallpaper,
        Index: i
      }));
    } else if (settings.WallpaperConfigs.length < 10) {
      for (let i = settings.WallpaperConfigs.length; i < 10; i++) {
        settings.WallpaperConfigs.push({ ...defaultWallpaper, Index: i });
      }
    }
    if (settings.wallpaperPath) {
      const path = settings.wallpaperPath;
      const oldConfig = Plugin2.settings.WallpaperConfigs[0] ?? {};
      settings.WallpaperConfigs[0] = {
        ...defaultWallpaper,
        ...oldConfig,
        path,
        type: settings.wallpaperType ?? "image",
        zIndex: settings.zIndex ?? defaultWallpaper.zIndex,
        opacity: settings.opacity ?? defaultWallpaper.opacity,
        playbackSpeed: settings.playbackSpeed ?? defaultWallpaper.playbackSpeed,
        Quality: settings.Quality ?? defaultWallpaper.Quality,
        blurRadius: settings.blurRadius ?? defaultWallpaper.blurRadius,
        Reposition: settings.Reposition ?? defaultWallpaper.Reposition,
        positionX: settings.PositionX ?? defaultWallpaper.positionX,
        positionY: settings.PositionY ?? defaultWallpaper.positionY,
        position: settings.Position ?? defaultWallpaper.position,
        Scale: settings.Scale ?? defaultWallpaper.Scale,
        useObjectFit: settings.useObjectFit ?? defaultWallpaper.useObjectFit,
        Index: 0
      };
      Plugin2.settings.globalConfig.config = {
        ...defaultWallpaper,
        ...oldConfig,
        path,
        type: settings.wallpaperType ?? "image",
        zIndex: settings.zIndex ?? defaultWallpaper.zIndex,
        opacity: settings.opacity ?? defaultWallpaper.opacity,
        playbackSpeed: settings.playbackSpeed ?? defaultWallpaper.playbackSpeed,
        Quality: settings.Quality ?? defaultWallpaper.Quality,
        blurRadius: settings.blurRadius ?? defaultWallpaper.blurRadius,
        Reposition: settings.Reposition ?? defaultWallpaper.Reposition,
        positionX: settings.PositionX ?? defaultWallpaper.positionX,
        positionY: settings.PositionY ?? defaultWallpaper.positionY,
        position: settings.Position ?? defaultWallpaper.position,
        Scale: settings.Scale ?? defaultWallpaper.Scale,
        useObjectFit: settings.useObjectFit ?? defaultWallpaper.useObjectFit,
        Index: 0
      };
    }
    if (scheduled) {
      if (Array.isArray(scheduled.wallpaperDayPaths)) {
        scheduled.wallpaperDayPaths.forEach((path, i) => {
          const slotIndex = 1 + i;
          if (slotIndex < settings.WallpaperConfigs.length) {
            const oldConfig = settings.WallpaperConfigs[slotIndex] ?? {};
            settings.WallpaperConfigs[slotIndex] = {
              ...defaultWallpaper,
              ...oldConfig,
              path,
              type: scheduled.wallpaperDayTypes?.[i] ?? "image",
              zIndex: settings.zIndex ?? defaultWallpaper.zIndex,
              opacity: settings.opacity ?? defaultWallpaper.opacity,
              playbackSpeed: settings.playbackSpeed ?? defaultWallpaper.playbackSpeed,
              Quality: settings.Quality ?? defaultWallpaper.Quality,
              blurRadius: settings.blurRadius ?? defaultWallpaper.blurRadius,
              Reposition: settings.Reposition ?? defaultWallpaper.Reposition,
              positionX: settings.PositionX ?? defaultWallpaper.positionX,
              positionY: settings.PositionY ?? defaultWallpaper.positionY,
              position: settings.Position ?? defaultWallpaper.position,
              Scale: settings.Scale ?? defaultWallpaper.Scale,
              useObjectFit: settings.useObjectFit ?? defaultWallpaper.useObjectFit,
              Index: slotIndex
            };
          }
        });
      }
      if (Array.isArray(scheduled.wallpaperWeekPaths)) {
        scheduled.wallpaperWeekPaths.forEach((path, i) => {
          const slotIndex = 3 + i;
          if (slotIndex < settings.WallpaperConfigs.length) {
            const oldConfig = settings.WallpaperConfigs[slotIndex] ?? {};
            settings.WallpaperConfigs[slotIndex] = {
              ...defaultWallpaper,
              ...oldConfig,
              path,
              type: scheduled.wallpaperWeekTypes?.[i] ?? "image",
              zIndex: settings.zIndex ?? defaultWallpaper.zIndex,
              opacity: settings.opacity ?? defaultWallpaper.opacity,
              playbackSpeed: settings.playbackSpeed ?? defaultWallpaper.playbackSpeed,
              Quality: settings.Quality ?? defaultWallpaper.Quality,
              blurRadius: settings.blurRadius ?? defaultWallpaper.blurRadius,
              Reposition: settings.Reposition ?? defaultWallpaper.Reposition,
              positionX: settings.PositionX ?? defaultWallpaper.positionX,
              positionY: settings.PositionY ?? defaultWallpaper.positionY,
              position: settings.Position ?? defaultWallpaper.position,
              Scale: settings.Scale ?? defaultWallpaper.Scale,
              useObjectFit: settings.useObjectFit ?? defaultWallpaper.useObjectFit,
              Index: slotIndex
            };
          }
        });
      }
    }
    delete settings.scheduledWallpapers;
    delete settings.scheduled;
    const obsoleteKeys = [
      "wallpaperPath",
      "wallpaperType",
      "playbackSpeed",
      "Quality",
      "Reposition",
      "opacity",
      "zIndex",
      "blurRadius",
      "brightness",
      "PositionX",
      "PositionY",
      "Position",
      "Scale",
      "useObjectFit"
    ];
    for (const key of obsoleteKeys) {
      if (key in settings) {
        delete settings[key];
      }
    }
  }
  static isValidWallpaperType(t) {
    return ["image", "video", "gif"].includes(t);
  }
};

// src/main.ts
var defaultWallpaper = {
  path: "",
  type: "image",
  zIndex: 5,
  opacity: 40,
  brightness: 100,
  blurRadius: 8,
  contrast: 100,
  playbackSpeed: 1,
  Reposition: false,
  Quality: false,
  useObjectFit: true,
  position: "Center",
  positionX: 50,
  positionY: 50,
  Scale: 1,
  Index: 0
};
var DEFAULT_SETTINGS = {
  LatestVersion: "1.5.9",
  currentWallpaper: defaultWallpaper,
  globalConfig: {
    config: defaultWallpaper,
    enabled: true
  },
  Preview: false,
  WallpaperConfigs: Array.from({ length: 10 }, (_, i) => ({ ...defaultWallpaper, Index: i })),
  HistoryPaths: [],
  mobileBackgroundWidth: "100vw",
  mobileBackgroundHeight: "100vh",
  AdnvOpend: false,
  modalStyle: {
    effect: "blur+dim",
    blurRadius: 10,
    dimOpacity: 0.7,
    dimColor: "black",
    disableModalBg: false
  },
  TextArenas: [
    { attribute: "" }
  ],
  Color: "#000000",
  INBUILD: false,
  SizeLimited: true,
  ScheduledOptions: {
    dayNightMode: false,
    weekly: false,
    autoSwitch: false,
    dayStartTime: "08:00",
    nightStartTime: "20:00",
    intervalCheckTime: "00:10",
    isCustomInterval: false
  },
  migrated: false
};
var LiveWallpaperPlugin2 = class extends import_obsidian8.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.lastPath = null;
    this.lastType = null;
    this.windows = /* @__PURE__ */ new Set();
    this.resizeRegistered = false;
    this.debouncedSave = SettingsUtils.SaveSettingsDebounced(this);
    this.debouncedApplyWallpaper = SettingsUtils.ApplyWallpaperDebounced(this);
  }
  async onload() {
    await this.loadSettings();
    await this.ensureWallpaperFolderExists();
    if (this.isVersionLess(this.settings.LatestVersion, "1.5.1")) {
      await Migrate.migrateOldSettings(this);
      this.settings.LatestVersion = "1.5.9";
      await this.saveSettings();
    }
    const anyOptionEnabled = Scheduler.Check(this.settings.ScheduledOptions);
    this.settings.currentWallpaper = await WallpaperConfigUtils.GetCurrentConfig(this);
    this.addSettingTab(new LiveWallpaperSettingManager(this.app, this));
    this.windows.add(window);
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      const container = view?.containerEl;
      if (!container) return;
      const doc = container.ownerDocument;
      const win = doc.defaultView;
      if (win) {
        this.windows.add(win);
      }
    });
    this.registerEvent(
      this.app.workspace.on("window-open", (win, winWindow) => {
        this.windows.add(winWindow);
        this.initWallpaperForWindow(winWindow.document);
      })
    );
    this.registerEvent(
      this.app.workspace.on("window-close", (win, winWindow) => {
        this.windows.delete(winWindow);
      })
    );
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        WallpaperApplier.applyWallpaper(this, anyOptionEnabled, window.document);
      })
    );
    for (const win of this.windows) {
      await this.initWallpaperForWindow(win.document);
    }
    const firstWin = this.windows.values().next().value;
    if (Scheduler.Check(this.settings.ScheduledOptions) && firstWin === window) {
      this.startDayNightWatcher();
    }
  }
  async initWallpaperForWindow(doc) {
    if (!this.settings.currentWallpaper) {
      this.settings.currentWallpaper = this.settings.WallpaperConfigs[0];
    }
    ChangeWallpaperContainer(doc, { width: this.settings.mobileBackgroundWidth, height: this.settings.mobileBackgroundHeight });
    removeExistingWallpaperElements(doc);
    toggleModalStyles(doc, this);
    const newContainer = createWallpaperContainer(doc, this.settings.currentWallpaper, this.settings.AdnvOpend);
    const appContainer = doc.querySelector(".app-container");
    if (appContainer) appContainer.insertAdjacentElement("beforebegin", newContainer);
    else doc.body.appendChild(newContainer);
    doc.body.classList.add("live-wallpaper-active");
    WallpaperApplier.applyWallpaper(this, false, doc);
    UpdatePaths(this, { path: this.settings.currentWallpaper.path, type: this.settings.currentWallpaper.type });
    await applyBackgroundColor(doc, this.settings.AdnvOpend, this.settings.Color);
    if (this.settings.currentWallpaper.Reposition) {
      SettingsUtils.enableReposition(this, doc);
      const media = doc.getElementById("live-wallpaper-media");
      if (media && media.parentElement) {
        const reposition = () => {
          SettingsUtils.applyImagePosition(
            media,
            this.settings.currentWallpaper.positionX,
            this.settings.currentWallpaper.positionY,
            this.settings.currentWallpaper.Scale
          );
        };
        const imageLoadHandler = () => {
          reposition();
          media.removeEventListener("load", imageLoadHandler);
        };
        media.addEventListener("load", imageLoadHandler);
      }
    }
  }
  async unload() {
    for (const win of this.windows) {
      removeExistingWallpaperElements(win.document);
      win.document.body.classList.remove("live-wallpaper-active");
      await clearBackgroundColor(win.document);
      RemoveModalStyles(win.document);
      LoadOrUnloadChanges(win.document, this.settings.TextArenas, false);
      SettingsUtils.disableReposition(win);
    }
    this.windows.clear();
    this.stopDayNightWatcher();
    super.unload();
  }
  async loadSettings() {
    try {
      const loaded = await this.loadData();
      this.settings = { ...DEFAULT_SETTINGS, ...loaded };
    } catch (e) {
      console.error("Live Wallpaper Plugin \u2013 loadSettings error:", e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  isVersionLess(current, target) {
    const c = current.split(".").map(Number);
    const t = target.split(".").map(Number);
    for (let i = 0; i < t.length; i++) {
      if ((c[i] || 0) < t[i]) return true;
      if ((c[i] || 0) > t[i]) return false;
    }
    return false;
  }
  async ensureWallpaperFolderExists() {
    try {
      const dir = this.manifest.dir;
      if (!dir) throw new Error("manifest.dir is undefined");
      const wallpaperFolder = `${dir}/wallpaper`;
      return await this.app.vault.adapter.exists(wallpaperFolder);
    } catch (e) {
      console.error("Failed to check wallpaper folder:", e);
      return false;
    }
  }
  async CreateMedia(doc) {
    removeExistingWallpaperElements(doc);
    const newContainer = createWallpaperContainer(doc, this.settings.currentWallpaper, this.settings.AdnvOpend);
    const newMedia = await createMediaElement(doc, this);
    if (newMedia) {
      newMedia.id = "live-wallpaper-media";
      newContainer.appendChild(newMedia);
    }
    const appContainer = doc.querySelector(".app-container");
    if (appContainer) appContainer.insertAdjacentElement("beforebegin", newContainer);
    else doc.body.appendChild(newContainer);
    doc.body.classList.add("live-wallpaper-active");
    if (this.settings.currentWallpaper.Reposition) {
      await waitForMediaDimensions(newMedia);
      SettingsUtils.applyImagePosition(
        newMedia,
        this.settings.currentWallpaper.positionX,
        this.settings.currentWallpaper.positionY,
        this.settings.currentWallpaper.Scale
      );
    }
  }
  async applyWallpaperFile(file, slotIndex, doc, isScheduledPicker = false) {
    if (!validateWallpaperFile(file, this.settings.SizeLimited)) {
      return;
    }
    const baseDir = `${this.app.vault.configDir}/plugins/${this.manifest.id}/wallpapers`;
    const arrayBuffer = await getFileArrayBuffer(file, {
      maxWidth: doc.win.innerWidth,
      mobileBackgroundWidth: this.settings.mobileBackgroundWidth,
      allowFullRes: this.settings.currentWallpaper.Quality
    });
    const targetSubfolder = WallpaperConfigUtils.computeActiveSubfolder(slotIndex);
    let fileName = file.name;
    if (file.type.startsWith("image/") && this.settings.currentWallpaper.Quality) {
      const dotIndex = fileName.lastIndexOf(".");
      fileName = dotIndex !== -1 ? fileName.slice(0, dotIndex) + "_quality" + fileName.slice(dotIndex) : fileName + "_quality";
    }
    const activeRelPath = await saveUnder(
      this,
      baseDir,
      `active/${targetSubfolder}`,
      fileName,
      arrayBuffer
    );
    const historyRelPath = await saveUnder(
      this,
      baseDir,
      `history`,
      fileName,
      arrayBuffer
    );
    this.settings.HistoryPaths = prependHistory(this.settings.HistoryPaths, { path: historyRelPath, type: getWallpaperType(fileName), fileName });
    await trimHistory(this, 5, `${baseDir}/history`);
    if (this.settings.Preview && !isScheduledPicker) {
      this.settings.currentWallpaper.path = activeRelPath;
      this.settings.currentWallpaper.type = getWallpaperType(fileName);
    }
    if (this.settings.globalConfig.enabled) {
      this.settings.globalConfig.config.path = activeRelPath;
      this.settings.globalConfig.config.type = getWallpaperType(fileName);
    }
    this.settings.WallpaperConfigs[slotIndex].path = activeRelPath;
    this.settings.WallpaperConfigs[slotIndex].type = getWallpaperType(fileName);
    for (const win of this.windows) {
      await WallpaperApplier.applyWallpaper(this, false, win.document);
    }
    if (slotIndex === 0) {
      const folder = activeRelPath.substring(0, activeRelPath.lastIndexOf("/"));
      await removeAllExcept(this, folder, activeRelPath);
    } else {
      const folder = `${baseDir}/active/${targetSubfolder}`;
      await removeUnusedFilesInFolder(this, folder, slotIndex, activeRelPath);
    }
    UpdatePaths(this, { path: activeRelPath, type: getWallpaperType(fileName) });
  }
  async openFolderPicker(doc) {
    const files = await pickFolderFiles(doc);
    if (files === null) return;
    this.settings.WallpaperConfigs = WallpaperConfigUtils.ClearConfigsFromIndex(this.settings.WallpaperConfigs, 10);
    const validFiles = files.filter(
      (f) => validateWallpaperFile(f, this.settings.SizeLimited)
    );
    if (validFiles.length === 0) return;
    try {
      const START_INDEX = 10;
      for (let i = 0; i < validFiles.length; i++) {
        const slotIndex = START_INDEX + i;
        this.settings.WallpaperConfigs = WallpaperConfigUtils.NewConfig(this.settings.WallpaperConfigs);
        await this.applyWallpaperFile(validFiles[i], slotIndex, doc, false);
      }
      for (const win of this.windows) {
        await WallpaperApplier.applyWallpaper(this, false, win.document);
      }
      this.debouncedSave();
    } catch (error) {
      alert("Could not import wallpaper folder.");
      console.error(error);
    }
  }
  startDayNightWatcher() {
    this.stopDayNightWatcher();
    this._dayNightInterval = window.setInterval(async () => {
      if (this.settings.Preview) return;
      const index = WallpaperConfigUtils.getWallpaperIndex(this);
      if (index !== void 0) {
        if (this.settings.globalConfig.enabled) {
          this.settings.currentWallpaper = WallpaperConfigUtils.applyGlobalConfig(this.settings.WallpaperConfigs[index], this.settings.globalConfig.config);
        } else {
          this.settings.currentWallpaper = this.settings.WallpaperConfigs[index];
        }
        for (const win of this.windows) {
          await WallpaperApplier.applyWallpaper(this, true, win.document);
        }
        UpdatePaths(this, { path: this.settings.currentWallpaper.path, type: this.settings.currentWallpaper.type });
      }
    }, Scheduler.getIntervalInMs(this.settings.ScheduledOptions));
  }
  stopDayNightWatcher() {
    if (this._dayNightInterval) {
      clearInterval(this._dayNightInterval);
      this._dayNightInterval = -1;
    }
  }
};

/* nosourcemap */