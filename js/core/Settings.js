const KEY = 'mathshooter_settings';

const DEFAULTS = {
  sound: true,
  showSpeedBonus: true,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch (_) {
    return { ...DEFAULTS };
  }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
}

let _data = load();

export const Settings = {
  get(k) {
    return _data[k];
  },
  set(k, v) {
    _data[k] = v;
    save(_data);
  },
  toggle(k) {
    _data[k] = !_data[k];
    save(_data);
    return _data[k];
  },
};
