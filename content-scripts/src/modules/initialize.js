import { allSettingsKeys } from "../../../storage-keys";
import { runDynamicFeatures } from "./features/dynamic";
import { applyStaticFeatures } from "./features/static";
import addStyleSheet from "./utilities/addStyleSheet";
import { extractColorsAsRootVars } from "./utilities/colors";
import debounce from "./utilities/debounce";
import { isDevelopmentMode } from "./utilities/isDevelopmentMode";
import isMutationSkippable from "./utilities/isMutationSkippable";
import { getStorage } from "./utilities/storage";

/**
 * Initialization:
 * - Sets up MutationObserver for dynamic features
 * - Adds load/resize event listeners
 * - Loads and caches required stylesheets
 * - Extracts Twitter theme colors
 */

export const addStylesheets = async () => {
  addStyleSheet("main", chrome.runtime.getURL("css/main.css"));
  addStyleSheet("typefully", chrome.runtime.getURL("css/typefully.css"));

  // Only fetch from CDN in production
  if (!(await isDevelopmentMode())) {
    try {
      // Add timeout and better error handling for CDN requests
      const fetchWithTimeout = (url, timeout = 5000) => {
        return Promise.race([
          fetch(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const [mainStylesheetFromCDN, typefullyStylesheetFromCDN] = await Promise.allSettled([
        fetchWithTimeout("https://raw.githubusercontent.com/typefully/minimal-twitter/main/css/main.css"),
        fetchWithTimeout("https://raw.githubusercontent.com/typefully/minimal-twitter/main/css/typefully.css")
      ]);

      let combinedStyles = "";
      
      if (mainStylesheetFromCDN.status === 'fulfilled' && mainStylesheetFromCDN.value.ok) {
        const mainText = (await mainStylesheetFromCDN.value.text()).trim();
        combinedStyles += mainText;
      } else {
        console.warn("Failed to fetch main stylesheet from CDN, using local version");
      }
      
      if (typefullyStylesheetFromCDN.status === 'fulfilled' && typefullyStylesheetFromCDN.value.ok) {
        const typefullyText = (await typefullyStylesheetFromCDN.value.text()).trim();
        combinedStyles += combinedStyles ? "\n\n" + typefullyText : typefullyText;
      } else {
        console.warn("Failed to fetch typefully stylesheet from CDN, using local version");
      }
      
      if (combinedStyles) {
        addStyleSheet("external", null, combinedStyles);
      }
    } catch (error) {
      console.warn("CDN stylesheet fetch failed, falling back to local stylesheets:", error.message || error);
    }
  } else {
    console.log("🚧 Development mode, not adding CDN-cached stylesheets");
  }
};

const addMutationObserver = () => {
  const observer = new MutationObserver((mutations) => {
    if (!mutations.length || isMutationSkippable(mutations)) return;
    runDynamicFeatures();
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
};

const addPageLoadListener = () => {
  document.addEventListener("DOMContentLoaded", () => {
    runDynamicFeatures();
  });
};

const addResizeListener = () => {
  window.addEventListener(
    "resize",
    debounce(() => {
      runDynamicFeatures();
    }, 50)
  );
};

export const initializeExtension = async () => {
  await addStylesheets();

  const allData = await getStorage(allSettingsKeys);
  applyStaticFeatures(allData);
  runDynamicFeatures();

  addMutationObserver();
  addPageLoadListener();
  addResizeListener();

  extractColorsAsRootVars();
  setTimeout(() => {
    // Let's extract colors when the page is likely fully loaded again
    extractColorsAsRootVars();
  }, 3000);
};
