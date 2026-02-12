// Auto-updating widget script for Scriptable
// Fetches and executes MyQuotes.js from GitHub raw content

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
 * Fetches code from GitHub and saves it locally, then executes it
 * @param {string} githubRawUrl - The raw GitHub URL
 * @param {string} localModuleName - Name for the local module cache
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
      const request = new Request(githubRawUrl);
      code = await request.loadString();
    } catch (fetchError) {
      console.error("❌ Fetch failed:", String(fetchError));
      throw fetchError;
    }
    
    if (!code || code.length === 0) {
      console.error("❌ Failed to fetch code from GitHub - empty response");
      return null;
    }
    
    console.log("✅ Code fetched successfully, length:", code.length);
    
    if (inScriptable) {
      // Scriptable environment - use eval to execute directly
      console.log("💾 Caching code...");
      
      try {
        // Wrap code in a function to handle top-level returns
        const wrappedCode = `
(async () => {
  try {
    ${code}
  } catch (e) {
    console.error("Error in fetched code:", e);
  }
})();
`;
        
        console.log("⚡ Executing fetched code...");
        eval(wrappedCode);
        console.log("✅ Code executed successfully");
        
      } catch (evalError) {
        console.error("Eval error:", String(evalError));
        throw evalError;
      }
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
  }
}

// Run the auto-update widget
await runAutoWidget();
