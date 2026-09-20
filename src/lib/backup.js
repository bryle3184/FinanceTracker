// @ts-check
/**
 * JSON backup / restore helpers.
 * A backup is the full persisted Zustand state (7 collections + settings).
 */

/**
 * Export the app data to a JSON string.
 * @param {import('../types.js').AppData} data
 * @returns {string} pretty-printed JSON with metadata envelope
 */
export function exportBackup(data) {
  const envelope = {
    appName: 'FinanceTracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    data
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Download a string as a file.
 * @param {string} content
 * @param {string} filename
 */
export function downloadJSON(content, filename = 'finance-tracker-backup.json') {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read a user-selected file as text (via input[type=file]).
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Validate and extract the data payload from a backup file.
 * @param {string} text raw file content
 * @returns {{ok:true, data:import('../types.js').AppData}|{ok:false, error:string}}
 */
export function parseBackup(text) {
  try {
    const obj = JSON.parse(text);
    if (!obj || obj.appName !== 'FinanceTracker') {
      return { ok: false, error: 'Not a FinanceTracker backup file.' };
    }
    if (!obj.data || typeof obj.data !== 'object') {
      return { ok: false, error: 'Invalid backup format (missing data).' };
    }
    // Basic shape check
    const arrayKeys = ['members', 'transactions', 'comments', 'recurring', 'budgets', 'goals', 'netWorth'];
    for (const key of arrayKeys) {
      if (!Array.isArray(obj.data[key])) {
        // tolerate older backups without a 'comments' array
        if (key === 'comments') continue;
        return { ok: false, error: `Invalid backup: expected array at data.${key}.` };
      }
    }
    if (!obj.data.settings || typeof obj.data.settings !== 'object') {
      return { ok: false, error: 'Invalid backup: missing settings.' };
    }
    return { ok: true, data: obj.data };
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }
}