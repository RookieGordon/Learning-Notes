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
  default: () => LiveWallpaperPlugin2
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/Settings/SettingsManager.ts
var import_obsidian4 = require("obsidian");

// src/Settings/Settings.ts
var import_obsidian = require("obsidian");
var SettingsApp = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const anyOptionEnabled = Object.values(
      this.plugin.settings.scheduledWallpapers.options
    ).some((v) => v === true);
    const setting = new import_obsidian.Setting(containerEl).setName("Wallpaper source").setDesc("Select an image, GIF, or video file to use as your wallpaper");
    if (!anyOptionEnabled) {
      setting.addButton(
        (btn) => btn.setButtonText("History").setIcon("history").setClass("mod-cta").onClick(async () => {
          containerEl.empty();
          await this.plugin.cleanInvalidWallpaperHistory();
          this.plugin.settings.HistoryPaths.forEach((entry) => {
            new import_obsidian.Setting(containerEl).setName(entry.fileName).setDesc(entry.path).addButton((button) => {
              button.setButtonText("Select").onClick(() => {
                this.plugin.settings.wallpaperPath = entry.path;
                this.plugin.settings.wallpaperType = entry.type;
                this.plugin.applyWallpaper(false);
                this.display();
              });
            });
          });
        })
      );
    }
    setting.addButton((btn) => {
      btn.setButtonText("Check Wallpaper").setIcon("image-file").onClick(async () => {
        const path = `${this.plugin.app.vault.configDir}/${this.plugin.settings.wallpaperPath}`;
        if (!this.plugin.settings.wallpaperPath) {
          new import_obsidian.Notice("No wallpaper path set.");
          return;
        }
        const exists = await this.plugin.app.vault.adapter.exists(path);
        if (exists) {
          new import_obsidian.Notice("Wallpaper loaded successfully.");
        } else {
          new import_obsidian.Notice("Wallpaper file not found. Resetting path.");
          this.plugin.settings.wallpaperPath = "";
          await this.plugin.saveSettings();
        }
      });
    });
    if (!anyOptionEnabled) {
      setting.addButton(
        (btn) => btn.setButtonText("Browse").setIcon("folder-open").setClass("mod-cta").onClick(() => this.plugin.openFilePicker())
      );
    }
    new import_obsidian.Setting(containerEl).setName("Wallpaper opacity").setDesc(
      "Controls the transparency level of the wallpaper (0% = fully transparent, 100% = fully visible)"
    ).addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.opacity}%`,
        cls: "setting-item-description"
      });
      const initialValue = this.plugin.settings.AdnvOpend ? 100 : this.plugin.settings.opacity;
      if (this.plugin.settings.AdnvOpend) {
        this.plugin.settings.opacity = 100;
        valueEl.textContent = ` 100%`;
        this.plugin.saveSettings();
        this.plugin.applyWallpaper(anyOptionEnabled);
      }
      slider.setLimits(0, 80, 1).setValue(initialValue).setDisabled(this.plugin.settings.AdnvOpend).setDynamicTooltip().setInstant(true).onChange(async (v) => {
        if (!this.plugin.settings.AdnvOpend) {
          this.plugin.settings.opacity = v;
          valueEl.textContent = ` ${v}%`;
          await this.plugin.saveSettings();
          this.plugin.applyWallpaper(anyOptionEnabled);
        }
      });
    });
    new import_obsidian.Setting(containerEl).setName("Blur radius").setDesc("Applies a blur effect to the wallpaper in pixels").addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.blurRadius}px`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(0, 20, 1).setValue(this.plugin.settings.blurRadius).onChange(async (v) => {
        this.plugin.settings.blurRadius = v;
        valueEl.textContent = ` ${v}px`;
        await this.plugin.saveSettings();
        this.plugin.applyWallpaper(anyOptionEnabled);
      });
    });
    new import_obsidian.Setting(containerEl).setName("Brightness").setDesc("Adjusts the wallpaper brightness (100% = normal)").addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.brightness}%`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(20, 130, 1).setValue(this.plugin.settings.brightness).onChange(async (v) => {
        this.plugin.settings.brightness = v;
        valueEl.textContent = ` ${v}%`;
        await this.plugin.saveSettings();
        this.plugin.applyWallpaper(anyOptionEnabled);
      });
    });
    new import_obsidian.Setting(containerEl).setName("Layer position (z\u2011index)").setDesc(
      "Determines the stacking order: higher values bring the wallpaper closer to the front"
    ).addSlider((slider) => {
      const valueEl = containerEl.createEl("span", {
        text: ` ${this.plugin.settings.zIndex}`,
        cls: "setting-item-description"
      });
      if (this.plugin.settings.AdnvOpend) {
        this.plugin.settings.zIndex = 0;
        valueEl.textContent = ` 0`;
        this.plugin.saveSettings();
        this.plugin.applyWallpaper(anyOptionEnabled);
      }
      slider.setInstant(true).setLimits(-10, 100, 1).setValue(this.plugin.settings.zIndex).setDisabled(this.plugin.settings.AdnvOpend).onChange(async (v) => {
        if (!this.plugin.settings.AdnvOpend) {
          this.plugin.settings.zIndex = v;
          valueEl.textContent = ` ${v}`;
          await this.plugin.saveSettings();
          this.plugin.applyWallpaper(anyOptionEnabled);
        }
      });
    });
    new import_obsidian.Setting(containerEl).setName("Change playback speed").setDesc(
      "Adjust the playback speed for videos (0.25x \u2013 2x). This does not affect GIFs."
    ).addSlider((slider) => {
      const valueEl = containerEl.createSpan({
        text: `${this.plugin.settings.playbackSpeed.toFixed(2)}x`,
        cls: "setting-item-description"
      });
      slider.setInstant(true).setLimits(0.25, 2, 0.25).setValue(this.plugin.settings.playbackSpeed).onChange(async (val) => {
        this.plugin.settings.playbackSpeed = val;
        await this.plugin.saveSettings();
        await this.plugin.applyWallpaper(false);
        valueEl.setText(`${val.toFixed(2)}x`);
      });
    });
    if (import_obsidian.Platform.isMobileApp) {
      const desc = document.createElement("div");
      desc.textContent = "On mobile devices, zooming can affect background size. You can manually set the height and width to maintain consistency.";
      containerEl.appendChild(desc);
      new import_obsidian.Setting(containerEl).setName("Background width").setDesc(
        "Set a custom width for the background on mobile (e.g., 100vw or 500px)."
      ).addText(
        (text) => text.setPlaceholder("e.g., 100vw").setValue(this.plugin.settings.mobileBackgroundWidth || "").onChange(async (value) => {
          this.plugin.settings.mobileBackgroundWidth = value;
          await this.plugin.saveSettings();
          this.plugin.ChangeWallpaperContainer();
        })
      );
      new import_obsidian.Setting(containerEl).setName("Background height").setDesc(
        "Set a custom height for the background on mobile (e.g., 100vh or 800px)."
      ).addText(
        (text) => text.setPlaceholder("e.g., 100vh").setValue(this.plugin.settings.mobileBackgroundHeight || "").onChange(async (value) => {
          this.plugin.settings.mobileBackgroundHeight = value;
          await this.plugin.saveSettings();
          this.plugin.ChangeWallpaperContainer();
        })
      );
      new import_obsidian.Setting(containerEl).setName("Match screen size").setDesc(
        "Automatically set the background size to match your device's screen dimensions."
      ).addButton(
        (button) => button.setButtonText("Resize to screen").onClick(async () => {
          this.plugin.settings.mobileBackgroundHeight = window.innerHeight.toString() + "px";
          this.plugin.settings.mobileBackgroundWidth = window.innerWidth.toString() + "px";
          this.plugin.ChangeWallpaperContainer();
          await this.plugin.saveSettings();
          this.display();
        })
      );
    }
    new import_obsidian.Setting(containerEl).setName("Reset options").setDesc("Resets all settings").addButton(
      (Button) => Button.setButtonText("Reset").onClick(async () => {
        const defaults = DEFAULT_SETTINGS;
        this.plugin.settings.wallpaperPath = defaults.wallpaperPath;
        this.plugin.settings.wallpaperType = defaults.wallpaperType;
        this.plugin.settings.HistoryPaths = defaults.HistoryPaths;
        this.plugin.settings.playbackSpeed = defaults.playbackSpeed;
        this.plugin.settings.opacity = defaults.opacity;
        this.plugin.settings.zIndex = defaults.zIndex;
        this.plugin.settings.blurRadius = defaults.blurRadius;
        this.plugin.settings.brightness = defaults.brightness;
        this.plugin.settings.mobileBackgroundHeight = defaults.mobileBackgroundHeight;
        this.plugin.settings.mobileBackgroundWidth = defaults.mobileBackgroundWidth;
        await this.plugin.saveSettings();
        this.plugin.applyWallpaper(anyOptionEnabled);
        this.display();
      })
    );
  }
};

// src/Settings/ScheduledWallpaperSettings.ts
var import_obsidian2 = require("obsidian");
var ScheduledApp = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("Day and night mode").setDesc("Enable different wallpapers for day and night").addToggle(
      (toggle) => toggle.setValue(
        this.plugin.settings.scheduledWallpapers.options.dayNightMode
      ).onChange(async (value) => {
        this.plugin.settings.scheduledWallpapers.options.dayNightMode = value;
        await this.plugin.saveSettings();
        this.display();
        this.plugin.applyWallpaper(true);
      })
    );
    if (this.plugin.settings.scheduledWallpapers.options.dayNightMode) {
      const paths = this.plugin.settings.scheduledWallpapers.wallpaperPaths;
      if (!paths[0]) paths[0] = "";
      if (!paths[1]) paths[1] = "";
      new import_obsidian2.Setting(containerEl).setName("Day Wallpaper").setDesc("Wallpaper to use during the day").addButton(
        (btn) => btn.setIcon("folder-open").setTooltip("Browse for file").onClick(() => this.plugin.openFilePicker(0))
      );
      new import_obsidian2.Setting(containerEl).setName("Night Wallpaper").setDesc("Wallpaper to use at night").addButton(
        (btn) => btn.setIcon("folder-open").setTooltip("Browse for file").onClick(() => this.plugin.openFilePicker(1))
      );
    }
  }
};

// src/Settings/AdvnSettings.ts
var import_obsidian3 = require("obsidian");
var LiveWallpaperSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const advancedSection = containerEl.createDiv();
    const anyOptionEnabled = Object.values(
      this.plugin.settings.scheduledWallpapers.options
    ).some((v) => v === true);
    new import_obsidian3.Setting(advancedSection).setName("Experimental options").setHeading();
    new import_obsidian3.Setting(advancedSection).setName(
      "fine-tune advanced transparency settings to seamlessly integrate your wallpaper. these experimental features allow for deeper customization but may require css knowledge."
    );
    const toggleAdvancedButton = advancedSection.createEl("button", {
      text: this.plugin.settings.AdnvOpend ? "Disable experimental settings" : "Enable experimental settings"
    });
    const advancedOptionsContainer = advancedSection.createDiv();
    advancedOptionsContainer.style.display = this.plugin.settings.AdnvOpend ? "block" : "none";
    toggleAdvancedButton.onclick = () => {
      this.plugin.settings.AdnvOpend = !this.plugin.settings.AdnvOpend;
      advancedOptionsContainer.style.display = this.plugin.settings.AdnvOpend ? "block" : "none";
      toggleAdvancedButton.setText(
        this.plugin.settings.AdnvOpend ? "Hide advanced options" : "Show advanced options"
      );
      this.plugin.toggleModalStyles();
      this.plugin.settings.opacity = 40;
      this.plugin.settings.zIndex = 5;
      this.plugin.applyWallpaper(anyOptionEnabled);
      this.plugin.saveSettings();
      this.display();
    };
    const tableDescription = advancedOptionsContainer.createEl("p", {
      cls: "advanced-options-description"
    });
    tableDescription.innerHTML = "Define UI elements and CSS attributes that should be made transparent. This allows the wallpaper to appear behind the interface, improving readability and aesthetic. Each row lets you specify a target element (CSS selector) and the attribute you want to override.<br><br>Example targets and attributes you can modify:<br>\u2022 target: <code>.theme-dark</code>, attribute: <code>--background-primary</code><br>\u2022 target: <code>.theme-dark</code>, attribute: <code>--background-secondary</code><br>\u2022 target: <code>.theme-dark</code>, attribute: <code>--background-secondary-alt</code><br>\u2022 target: <code>.theme-dark</code>, attribute: <code>--col-pr-background</code><br>\u2022 target: <code>.theme-dark</code>, attribute: <code>--col-bckg-mainpanels</code><br>\u2022 target: <code>.theme-dark</code>, attribute: <code>--col-txt-titlebars</code><br><br>You can inspect elements and variables using browser dev tools (CTRL + SHIFT + I) to discover more attributes to adjust.";
    const tableContainer = advancedOptionsContainer.createEl("div", {
      cls: "text-arena-table-container"
    });
    const table = tableContainer.createEl("table", { cls: "text-arena-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Target element (CSS selector)" });
    headerRow.createEl("th", { text: "Attribute to modify" });
    const tbody = table.createEl("tbody");
    this.plugin.settings.TextArenas.forEach((entry, index) => {
      const row = tbody.createEl("tr");
      const targetCell = row.createEl("td");
      new import_obsidian3.Setting(targetCell).addText((text) => {
        text.setValue(entry.target).onChange((value) => {
          this.plugin.settings.TextArenas[index].target = value;
          this.plugin.saveSettings();
        });
      });
      const attrCell = row.createEl("td");
      new import_obsidian3.Setting(attrCell).addText((text) => {
        text.setValue(entry.attribute).onChange((value) => {
          this.plugin.RemoveChanges(index);
          this.plugin.settings.TextArenas[index].attribute = value;
          this.plugin.saveSettings();
          this.plugin.ApplyChanges(index);
        });
      });
      const actionCell = row.createEl("td");
      new import_obsidian3.Setting(actionCell).addExtraButton((btn) => {
        btn.setIcon("cross").setTooltip("Remove this entry").onClick(() => {
          this.plugin.RemoveChanges(index);
          this.plugin.settings.TextArenas.splice(index, 1);
          this.plugin.saveSettings();
          this.display();
        });
      });
    });
    new import_obsidian3.Setting(advancedOptionsContainer).addButton(
      (btn) => btn.setButtonText("Add new element").setClass("text-arena-center-button").setTooltip("Add a new row to the table").onClick(() => {
        this.plugin.settings.TextArenas.push({ target: "", attribute: "" });
        this.display();
      })
    );
    let colorPickerRef = null;
    const colorSetting = new import_obsidian3.Setting(advancedOptionsContainer).setName("Custom background color").setDesc("Set a custom color for the plugin's styling logic").addColorPicker((picker) => {
      colorPickerRef = picker;
      picker.setValue(this.plugin.settings.Color || "#000000").onChange(async (value) => {
        this.plugin.settings.Color = value;
        await this.plugin.saveSettings();
        this.plugin.applyBackgroundColor();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("Reset to default").onClick(async () => {
        this.plugin.settings.Color = "";
        await this.plugin.saveSettings();
        this.plugin.applyBackgroundColor();
        if (colorPickerRef) {
          colorPickerRef.setValue("#000000");
        }
      })
    );
  }
};

// src/Settings/SettingsManager.ts
var LiveWallpaperSettingManager = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.regularTab = new SettingsApp(app, plugin);
    this.scheduledTab = new ScheduledApp(app, plugin);
    this.advancedTab = new LiveWallpaperSettingTab(app, plugin);
    this.activeTab = "regular";
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const navContainer = containerEl.createDiv({
      cls: "live-wallpaper-settings-nav"
    });
    new import_obsidian4.Setting(navContainer).addButton((button) => {
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
      button.setButtonText("Advanced settings").setClass(this.activeTab === "advanced" ? "mod-cta" : "mod-off").onClick(() => {
        this.activeTab = "advanced";
        this.display();
      });
    });
    const contentContainer = containerEl.createDiv({
      cls: "live-wallpaper-settings-content"
    });
    if (this.activeTab === "regular") {
      this.regularTab.containerEl = contentContainer;
      this.regularTab.display();
    } else if (this.activeTab === "advanced") {
      this.advancedTab.containerEl = contentContainer;
      this.advancedTab.display();
    } else {
      this.scheduledTab.containerEl = contentContainer;
      this.scheduledTab.display();
    }
  }
};

// src/Scheduler.ts
var Scheduler = class {
  static applyScheduledWallpaper(Wallpapers, options) {
    const now = /* @__PURE__ */ new Date();
    const hour = now.getHours();
    const day = now.getDay();
    if (!Wallpapers || Wallpapers.length === 0 || !options) {
      return null;
    }
    if (options.dayNightMode) {
      const isDay = hour >= 7 && hour < 19;
      const index = isDay ? 0 : 1;
      if (Wallpapers[index]) return index;
    }
    if (options.weekly) {
      if (Wallpapers[day]) return day;
    }
    if (options.shuffle) {
      const randomIndex = Math.floor(Math.random() * Wallpapers.length);
      return randomIndex;
    }
    return null;
  }
};

// src/main.ts
var DEFAULT_SETTINGS = {
  wallpaperPath: "",
  wallpaperType: "image",
  playbackSpeed: 1,
  opacity: 40,
  zIndex: 5,
  blurRadius: 8,
  brightness: 100,
  HistoryPaths: [],
  mobileBackgroundWidth: "100vw",
  mobileBackgroundHeight: "100vh",
  AdnvOpend: false,
  TextArenas: [
    { target: "", attribute: "" }
  ],
  Color: "#000000",
  INBUILD: false,
  scheduledWallpapers: {
    wallpaperPaths: [],
    options: {
      dayNightMode: false,
      weekly: false,
      shuffle: false
    },
    wallpaperTypes: []
  }
};
var LiveWallpaperPlugin2 = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.lastPath = null;
    this.lastType = null;
  }
  async onload() {
    await this.loadSettings();
    await this.ensureWallpaperFolderExists();
    const anyOptionEnabled = Object.values(this.settings.scheduledWallpapers.options).some((v) => v === true);
    this.toggleModalStyles();
    this.addSettingTab(new LiveWallpaperSettingManager(this.app, this));
    this.ChangeWallpaperContainer();
    this.removeExistingWallpaperElements();
    const newContainer = this.createWallpaperContainer();
    const appContainer = document.querySelector(".app-container");
    if (appContainer) appContainer.insertAdjacentElement("beforebegin", newContainer);
    else document.body.appendChild(newContainer);
    document.body.classList.add("live-wallpaper-active");
    if (anyOptionEnabled) {
      this.startDayNightWatcher();
      this.applyWallpaper(true);
    } else {
      this.applyWallpaper(false);
    }
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        const el = document.getElementById("live-wallpaper-container");
        if (el) this.applyWallpaper(anyOptionEnabled);
      })
    );
    await this.applyBackgroundColor();
  }
  async unload() {
    await this.clearBackgroundColor();
    this.removeExistingWallpaperElements();
    this.RemoveModalStyles();
    this.stopDayNightWatcher();
    document.body.classList.remove("live-wallpaper-active");
    await this.LoadOrUnloadChanges(false);
    await super.unload();
  }
  async loadSettings() {
    try {
      const loaded = await this.loadData();
      this.settings = { ...DEFAULT_SETTINGS, ...loaded };
      await this.LoadOrUnloadChanges(true);
    } catch (e) {
      console.error("Live Wallpaper Plugin \u2013 loadSettings error:", e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async applyWallpaper(anyOptionEnabled) {
    let newPath = null;
    let newType = this.settings.wallpaperType;
    if (anyOptionEnabled) {
      const index = Scheduler.applyScheduledWallpaper(
        this.settings.scheduledWallpapers.wallpaperPaths,
        this.settings.scheduledWallpapers.options
      );
      if (index !== null) {
        newPath = this.settings.scheduledWallpapers.wallpaperPaths[index];
        newType = this.settings.scheduledWallpapers.wallpaperTypes[index];
        this.settings.wallpaperPath = newPath;
        this.settings.wallpaperType = newType;
        this.startDayNightWatcher();
      } else {
        this.lastPath = this.lastType = null;
        return;
      }
    } else if (!this.settings.wallpaperPath) {
      this.lastPath = this.lastType = null;
      return;
    } else {
      newPath = this.settings.wallpaperPath;
      newType = this.settings.wallpaperType;
    }
    const container = document.getElementById("live-wallpaper-container");
    let media = document.getElementById("live-wallpaper-media");
    if (container && media) {
      Object.assign(container.style, {
        opacity: `${this.settings.opacity / 100}`,
        zIndex: `${this.settings.zIndex}`,
        filter: `blur(${this.settings.blurRadius}px) brightness(${this.settings.brightness}%)`
      });
      if (media instanceof HTMLVideoElement) {
        media.playbackRate = this.settings.playbackSpeed;
      }
      if (newPath !== this.lastPath || newType !== this.lastType) {
        const newMedia2 = await this.createMediaElement();
        if (newMedia2) {
          container.replaceChild(newMedia2, media);
          media = newMedia2;
          this.lastPath = newPath;
          this.lastType = newType;
        }
      }
      await this.saveSettings();
      return;
    }
    this.removeExistingWallpaperElements();
    const newContainer = this.createWallpaperContainer();
    const newMedia = await this.createMediaElement();
    if (newMedia) {
      newMedia.id = "live-wallpaper-media";
      newContainer.appendChild(newMedia);
    }
    const appContainer = document.querySelector(".app-container");
    if (appContainer) appContainer.insertAdjacentElement("beforebegin", newContainer);
    else document.body.appendChild(newContainer);
    document.body.classList.add("live-wallpaper-active");
    this.lastPath = newPath;
    this.lastType = newType;
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
  removeExistingWallpaperElements() {
    const existingContainer = document.getElementById("live-wallpaper-container");
    const existingStyles = document.getElementById("live-wallpaper-overrides");
    const existingTitlebarStyles = document.getElementById("live-wallpaper-titlebar-styles");
    existingContainer?.remove();
    existingStyles?.remove();
    existingTitlebarStyles?.remove();
    document.body.classList.remove("live-wallpaper-active");
  }
  createWallpaperContainer() {
    const container = document.createElement("div");
    container.id = "live-wallpaper-container";
    Object.assign(container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: `${this.settings.zIndex}`,
      opacity: `${this.settings.opacity / 100}`,
      overflow: "hidden",
      pointerEvents: "none",
      filter: `blur(${this.settings.blurRadius}px) brightness(${this.settings.brightness}%)`
    });
    return container;
  }
  ChangeWallpaperContainer() {
    const container = document.getElementById("live-wallpaper-container");
    if (container == null) return;
    const width = this.settings.mobileBackgroundWidth || "100vw";
    const height = this.settings.mobileBackgroundHeight || "100vh";
    Object.assign(container.style, {
      width,
      height
    });
  }
  async createMediaElement() {
    const isVideo = this.settings.wallpaperType === "video";
    const media = isVideo ? document.createElement("video") : document.createElement("img");
    media.id = "live-wallpaper-media";
    if (media instanceof HTMLImageElement) {
      media.loading = "lazy";
    }
    const path = `${this.app.vault.configDir}/${this.settings.wallpaperPath}`;
    const exists = await this.app.vault.adapter.exists(path);
    if (exists) {
      media.src = this.app.vault.adapter.getResourcePath(path);
    } else {
      this.settings.wallpaperPath = "";
      return null;
    }
    Object.assign(media.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    });
    if (isVideo) {
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
      media.playbackRate = this.settings.playbackSpeed;
    }
    return media;
  }
  async openFilePicker(slotIndex) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".jpg,.jpeg,.png,.gif,.mp4,.webm";
    fileInput.multiple = false;
    fileInput.addEventListener("change", async (event) => {
      const target = event.target;
      if (!target.files || target.files.length === 0) return;
      const file = target.files[0];
      const allowedExtensions = ["jpg", "jpeg", "png", "gif", "mp4", "webm"];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        alert("Unsupported file type!");
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        alert("File is too large (max 12MB).");
        return;
      }
      try {
        const pluginWallpaperDir = `${this.app.vault.configDir}/plugins/${this.manifest.id}/wallpaper`;
        await this.app.vault.adapter.mkdir(pluginWallpaperDir);
        const wallpaperPath = `${pluginWallpaperDir}/${file.name}`;
        let arrayBuffer;
        if (file.type.startsWith("image/")) {
          const resizedBlob = await this.resizeImageToBlob(file);
          arrayBuffer = await resizedBlob.arrayBuffer();
        } else {
          arrayBuffer = await file.arrayBuffer();
        }
        await this.app.vault.adapter.writeBinary(wallpaperPath, arrayBuffer);
        const wallpaperPathRelativeForObsidian = `plugins/${this.manifest.id}/wallpaper/${file.name}`;
        const historyEntry = {
          path: wallpaperPathRelativeForObsidian,
          type: this.getWallpaperType(file.name),
          fileName: file.name
        };
        this.settings.HistoryPaths = this.settings.HistoryPaths.filter((entry) => entry.path !== historyEntry.path);
        this.settings.HistoryPaths.unshift(historyEntry);
        if (this.settings.HistoryPaths.length > 5) {
          const toRemove = this.settings.HistoryPaths.slice(5);
          this.settings.HistoryPaths = this.settings.HistoryPaths.slice(0, 5);
          for (const entry of toRemove) {
            const fileName = entry.fileName;
            const fullPath = `${this.manifest.dir}/wallpaper/${fileName}`;
            await this.app.vault.adapter.remove(fullPath).catch(() => {
            });
          }
        }
        const anyOptionEnabled = Object.values(this.settings.scheduledWallpapers.options).some((v) => v === true);
        if (anyOptionEnabled && typeof slotIndex === "number") {
          const paths = this.settings.scheduledWallpapers.wallpaperPaths;
          while (paths.length < 2) paths.push("");
          const types = this.settings.scheduledWallpapers.wallpaperTypes;
          while (types.length < 2) types.push("image");
          paths[slotIndex] = wallpaperPathRelativeForObsidian;
          types[slotIndex] = this.getWallpaperType(file.name);
        } else {
          this.settings.wallpaperPath = wallpaperPathRelativeForObsidian;
          this.settings.wallpaperType = this.getWallpaperType(file.name);
        }
        this.applyWallpaper(anyOptionEnabled);
      } catch (error) {
        alert("Could not save the file. Check disk permissions.");
        console.error(error);
      }
    });
    fileInput.click();
  }
  getWallpaperType(filename) {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (["mp4", "webm"].includes(extension || "")) return "video";
    if (extension === "gif") return "gif";
    return "image";
  }
  async resizeImageToBlob(file) {
    const img = await createImageBitmap(file);
    const MAX_WIDTH = 1920;
    if (img.width <= MAX_WIDTH) return new Blob([await file.arrayBuffer()], { type: file.type });
    const canvas = new OffscreenCanvas(MAX_WIDTH, img.height / img.width * MAX_WIDTH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.convertToBlob({ quality: 0.8, type: "image/jpeg" });
  }
  async LoadOrUnloadChanges(load) {
    for (const { target, attribute } of this.settings.TextArenas) {
      try {
        const attr = attribute?.trim();
        if (!attr) continue;
        const isVar = attr.startsWith("--");
        if (isVar) {
          const el2 = document.body.classList.contains("theme-dark") ? document.body : document.documentElement;
          if (load) {
            el2.style.setProperty(attr, "transparent", "important");
          } else {
            el2.style.removeProperty(attr);
          }
          continue;
        }
        const targetSelector = target?.trim();
        if (!targetSelector) continue;
        const el = document.querySelector(targetSelector);
        if (!el) continue;
        if (load) {
          el.style.setProperty(attr, "transparent", "important");
        } else {
          el.style.removeProperty(attr);
          if (!el.getAttribute("style")) {
            el.removeAttribute("style");
          }
        }
      } catch (error) {
        console.error("Error processing element:", { target, attribute }, error);
      }
    }
  }
  ApplyChanges(id) {
    const { target, attribute } = this.settings.TextArenas[id];
    const attr = attribute.trim();
    const isVar = attr.startsWith("--");
    const el = isVar ? document.body.classList.contains("theme-dark") ? document.body : document.documentElement : document.querySelector(target);
    if (!el) return;
    if (isVar) {
      el.style.setProperty(attr, "transparent", "important");
    } else {
      el.style.setProperty(attr, "transparent", "important");
    }
  }
  async RemoveChanges(id, oldAttribute) {
    if (id < 0 || id >= this.settings.TextArenas.length) {
      return;
    }
    const attribute = (oldAttribute ?? this.settings.TextArenas[id].attribute)?.trim();
    const target = this.settings.TextArenas[id].target?.trim();
    if (!attribute || !target) {
      return;
    }
    try {
      if (!attribute.startsWith("--")) {
        const el = document.querySelector(target);
        if (el) {
          el.style.removeProperty(attribute);
          if (!el.getAttribute("style")) {
            el.removeAttribute("style");
          }
        }
      } else {
        const el = document.body.classList.contains("theme-dark") ? document.body : document.documentElement;
        el.style.removeProperty(attribute);
        el.style.setProperty(attribute, "");
        el.removeAttribute("style");
      }
    } catch (error) {
      console.error(`Error removing '${attribute}' at index ${id}:`, error);
    }
    this.LoadOrUnloadChanges(true);
  }
  toggleModalStyles() {
    const styleId = "extrastyles-dynamic-css";
    const existingStyle = document.getElementById(styleId);
    if (this.settings.AdnvOpend) {
      if (!existingStyle) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
                  .modal-container.mod-dim {
                      background: rgba(0, 0, 0, 0.7);
                      backdrop-filter: blur(10px);
                  }
                  .modal-container {
                      background: rgba(0, 0, 0, 0.7);
                      backdrop-filter: blur(10px);
                  }
              `;
        document.head.appendChild(style);
      }
      this.LoadOrUnloadChanges(true);
    } else {
      this.LoadOrUnloadChanges(false);
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }
  RemoveModalStyles() {
    const styleId = "extrastyles-dynamic-css";
    const existingStyle = document.getElementById(styleId);
    existingStyle != null ? existingStyle.remove() : "";
  }
  async applyBackgroundColor() {
    const existingElement = document.getElementById("live-wallpaper-container");
    if (existingElement) {
      if (this.settings.AdnvOpend && this.settings.Color) {
        existingElement.parentElement?.style.setProperty("background-color", this.settings.Color, "important");
      }
      return;
    }
    await new Promise((resolve) => {
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.getElementById("live-wallpaper-container");
        if (element) {
          obs.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
    if (this.settings.AdnvOpend && this.settings.Color) {
      const Main = document.getElementById("live-wallpaper-container");
      Main?.parentElement?.style.setProperty("background-color", this.settings.Color, "important");
    }
  }
  async clearBackgroundColor() {
    const Main = document.getElementById("live-wallpaper-container");
    Main?.parentElement?.style.removeProperty("background-color");
  }
  startDayNightWatcher() {
    this.stopDayNightWatcher();
    this._dayNightInterval = window.setInterval(() => {
      const { wallpaperPaths, options, wallpaperTypes } = this.settings.scheduledWallpapers;
      const index = Scheduler.applyScheduledWallpaper(wallpaperPaths, options);
      if (index !== null && wallpaperPaths[index]) {
        this.settings.wallpaperPath = wallpaperPaths[index];
        this.settings.wallpaperType = wallpaperTypes[index];
        this.applyWallpaper(true);
      }
    }, 10 * 60 * 1e3);
  }
  stopDayNightWatcher() {
    if (this._dayNightInterval) {
      clearInterval(this._dayNightInterval);
      this._dayNightInterval = -1;
    }
  }
  async cleanInvalidWallpaperHistory() {
    const validPaths = [];
    for (const entry of this.settings.HistoryPaths) {
      const fullPath = `${this.app.vault.configDir}/${entry.path}`;
      const exists = await this.app.vault.adapter.exists(fullPath);
      if (exists) {
        validPaths.push(entry);
      }
    }
    this.settings.HistoryPaths = validPaths;
    await this.saveSettings();
  }
};

/* nosourcemap */