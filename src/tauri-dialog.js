// Tauri Dialog API wrapper for browser usage
// This provides the dialog functionality without ES6 module imports

window.TauriDialog = {
  async open(options = {}) {
    const { invoke } = window.__TAURI__.core;

    // Use the Tauri command to open file dialog
    return await invoke('plugin:dialog|open', {
      options: {
        defaultPath: options.defaultPath || null,
        directory: options.directory || false,
        filters: options.filters || [],
        multiple: options.multiple || false,
        recursive: options.recursive || false,
        title: options.title || null
      }
    });
  },

  async save(options = {}) {
    const { invoke } = window.__TAURI__.core;

    return await invoke('plugin:dialog|save', {
      options: {
        defaultPath: options.defaultPath || null,
        filters: options.filters || [],
        title: options.title || null
      }
    });
  }
};