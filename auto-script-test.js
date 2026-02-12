// Auto-updating widget script for Scriptable - PC TEST VERSION
// Fetches and executes MyQuotes.js from GitHub raw content

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Detect if running in Scriptable environment
 */
function isScriptable() {
  try {
    return typeof importModule === "function" && typeof FileManager !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Fetch from GitHub using Node.js https module
 */
function fetchFromGithub(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Node.js Test' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Fetches code from GitHub and saves it locally, then executes it
 */
async function fetchAndExecuteFromGithub(githubRawUrl, localModuleName = "RemoteWidget") {
  try {
    console.log("📡 Fetching code from GitHub...");
    console.log("URL:", githubRawUrl);
    
    // Check environment
    const inScriptable = isScriptable();
    console.log("Environment: " + (inScriptable ? "Scriptable" : "Node/PC"));
    
    console.log("Making request...");
    let code;
    
    try {
      if (inScriptable) {
        // Use Scriptable's Request API
        const request = new Request(githubRawUrl);
        request.headers = {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
          "Cache-Control": "no-cache"
        };
        code = await request.loadString();
      } else {
        // Use Node.js https module
        code = await fetchFromGithub(githubRawUrl);
      }
    } catch (fetchError) {
      console.error("❌ Fetch failed:", String(fetchError));
      throw fetchError;
    }
    
    if (!code || code.length === 0) {
      console.error("❌ Failed to fetch code from GitHub - empty response");
      return null;
    }
    
    console.log("✅ Code fetched successfully, length:", code.length);
    console.log("📄 First 200 chars:", code.substring(0, 200));
    
    if (inScriptable) {
      // Scriptable environment - use importModule
      console.log("💾 Saving to local module:", localModuleName);
      const fm = FileManager.local();
      const modulePath = fm.joinPath(fm.documentsDirectory(), localModuleName + ".js");
      fm.writeString(modulePath, code);
      
      console.log("⚡ Executing fetched code via importModule...");
      const module = importModule(localModuleName);
      console.log("Module loaded:", typeof module);
    } else {
      // PC/Node environment - save only (don't eval due to return statements)
      const testDir = path.join(__dirname, '.scriptable-cache');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
      }
      
      const filePath = path.join(testDir, localModuleName + '.js');
      console.log("💾 Saving to:", filePath);
      fs.writeFileSync(filePath, code, 'utf-8');
      
      console.log("⚡ Code saved successfully (not executing on PC due to Scriptable-specific code)");
      console.log("✅ Ready to run on Scriptable!");
    }
    
    return code;
  } catch (error) {
    console.error("❌ Error fetching/executing from GitHub");
    console.error("Error type:", typeof error);
    console.error("Error string:", String(error));
    
    // Try to extract more details
    if (error) {
      console.error("Error name:", error.name || "unknown");
      console.error("Error message:", error.message || "no message");
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
    
    throw error;
  }
}

/**
 * Main function to load and run the widget
 */
async function runAutoWidget() {
  const GITHUB_RAW_URL = "https://raw.githubusercontent.com/vesgt/widget/refs/heads/main/MyQuotes.js";
  
  try {
    const result = await fetchAndExecuteFromGithub(GITHUB_RAW_URL, "RemoteMyQuotes");
    
    if (result) {
      console.log("✅ Widget executed successfully from GitHub source");
    } else {
      console.log("⚠️ Failed to execute widget from GitHub");
    }
  } catch (error) {
    console.error("❌ Fatal error in runAutoWidget:");
    console.error(String(error));
    process.exit(1);
  }
}

// Run the auto-update widget
runAutoWidget();
