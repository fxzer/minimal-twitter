import { defaultPreferences } from "../../../../storage-keys";

/*--
- Docs: https://developer.chrome.com/docs/extensions/reference/storage/
- Use storage.local to allow user to store customizations
--*/

export const getStorage = (storageKeyOrKeys) => {
  try {
    if (typeof storageKeyOrKeys !== "string" && !Array.isArray(storageKeyOrKeys)) {
      throw new Error("storageKeyOrKeys must be a string or an array of strings");
    }
    if (Array.isArray(storageKeyOrKeys)) {
      return getMultipleStorageKeys(storageKeyOrKeys);
    } else {
      return getSingleStorageKey(storageKeyOrKeys);
    }
  } catch (error) {
    console.error(error);
  }
};

const getSingleStorageKey = (key) => {
  return new Promise((resolve, _reject) => {
    // Check if extension context is still valid
    if (!chrome?.runtime?.id) {
      console.warn('Extension context invalidated, using default preference for key:', key);
      resolve(defaultPreferences[key]);
      return;
    }
    
    try {
      chrome?.storage?.local.get([key], (data) => {
        if (chrome.runtime.lastError) {
          console.warn('Chrome storage error:', chrome.runtime.lastError.message);
          resolve(defaultPreferences[key]);
          return;
        }
        resolve(data[key] ?? defaultPreferences[key]); // Fallback to the default preference
      });
    } catch (error) {
      console.warn('Storage access failed:', error.message);
      resolve(defaultPreferences[key]);
    }
  });
};

const getMultipleStorageKeys = (keysArray) => {
  return new Promise((resolve, _reject) => {
    // Check if extension context is still valid
    if (!chrome?.runtime?.id) {
      console.warn('Extension context invalidated, using default preferences for keys:', keysArray);
      const res = keysArray.reduce((acc, cur) => {
        acc[cur] = defaultPreferences[cur];
        return acc;
      }, {});
      resolve(res);
      return;
    }
    
    try {
      chrome?.storage?.local.get(keysArray, (data) => {
        if (chrome.runtime.lastError) {
          console.warn('Chrome storage error:', chrome.runtime.lastError.message);
          const res = keysArray.reduce((acc, cur) => {
            acc[cur] = defaultPreferences[cur];
            return acc;
          }, {});
          resolve(res);
          return;
        }
        const res = keysArray.reduce((acc, cur) => {
          acc[cur] = data[cur] ?? defaultPreferences[cur]; // For each key, fallback to the default preference
          return acc;
        }, {});
        resolve(res);
      });
    } catch (error) {
      console.warn('Storage access failed:', error.message);
      const res = keysArray.reduce((acc, cur) => {
        acc[cur] = defaultPreferences[cur];
        return acc;
      }, {});
      resolve(res);
    }
  });
};

/*--
- Set storage with storage.local
- kv => {key: value} (Single key value pair)
- Throttle function to prevent hitting API limits
- The maximum number of set, remove, or clear operations = 120
  - 1 min = 60000 ms
  - 60000 ms / 120 operations = 500 ms/operation
--*/
export const setStorage = async (kv) => {
  const promise = new Promise((resolve, reject) => {
    // Check if extension context is still valid
    if (!chrome?.runtime?.id) {
      console.warn('Extension context invalidated, cannot save storage:', kv);
      reject(new Error('Extension context invalidated'));
      return;
    }
    
    try {
      chrome?.storage?.local.set(kv, () => {
        if (chrome.runtime.lastError) {
          console.warn('Chrome storage error:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        return resolve(kv);
      });
    } catch (error) {
      console.warn('Storage set failed:', error.message);
      reject(error);
    }
  });
  return promise;
};
