// icon-color: purple; icon-glyph: quote-right;

// === Start: Param Handling ===
const defaultCategory = "machiavelli";
// const defaultCategory = "kafka";
const defaultSize = config.widgetFamily === "small" ? "s" : config.widgetFamily === "medium" ? "m" : "l";
const validSizes = ["s", "m", "l"];
const validCategories = ["myquotes", "gita", "test", "zen", "machiavelli", "aurelius", "fyodor", "kafka"];

// const param = args.widgetParameter ? args.widgetParameter.trim().toLowerCase() : `${defaultCategory}`;
const param = args.widgetParameter ? args.widgetParameter.trim().toLowerCase() : defaultCategory;
// const param = args.widgetParameter ? args.widgetParameter.trim().toLowerCase() : "540";
const parts = param.split(",");
let category = defaultCategory;
let sizeParam = defaultSize;
let forcedIndex = null;

for (const p of parts) {
  const trimmed = p.trim();
  if (validCategories.includes(trimmed)) {
    category = trimmed;
  } else if (validSizes.includes(trimmed)) {
    sizeParam = trimmed;
  } else if (!isNaN(parseInt(trimmed))) {
    forcedIndex = parseInt(trimmed);
  }
}

// Determine widget size fallback
let widgetSize;
if (validSizes.includes(sizeParam)) {
  widgetSize = sizeParam;
} else if (config.widgetFamily === "medium") {
  widgetSize = "m";
} else if (config.widgetFamily === "large") {
  widgetSize = "l";
} else {
  widgetSize = "s";
}

// If category is invalid, just refresh and exit
if (!validCategories.includes(category)) {
  console.warn("⚠️ Invalid category. Refreshing...");
  Script.complete();
  return;
}

const fm = FileManager.iCloud();
// myQuotes, test ,gita, zen, machiavelli, Aurelius, fyodor, kafka
// const defaultParam = "machiavelli";
// const param = args.widgetParameter ? args.widgetParameter.trim().toLowerCase() : "machiavelli";
// const SOURCE = param || "gita"; 
const SHEET_ID = "1amFMwf_j83eRLNOAWnqMNfA3ZyE6igqjZF_OrSNww84";
// const SHEET_TAB = param;
// const SHEET_TAB = category.charAt(0).toUpperCase() + category.slice(1);
const SHEET_TAB = category;
const COLOR_PAIRS_PATH = fm.joinPath(fm.documentsDirectory(), ".source/dark_theme_color_pairs.json");

// === Custom Quotes ===
const MY_CUSTOM_QUOTES = [
    { quote: "Tänkte att du kanske måste få veta att du är den vackraste personen i världen ❤️", author: "Din habibi" },
    { quote: "Jag älskar dej mest av alla i hela världen, bästa bästa du ❤️", author: "Joel" },
    { quote: "Hoppas du är medveten att oavsett hur dålig dag jag eller du har, så är jag alltid med dig", author: "Din bästa ❤️" },
    { quote: "Måste bara nämna hur sjukt fina ögon du har hapopo ❤️", author: "Joule" },
    { quote: "Jag hade sagt bra jobbat men jag tycker inte de hejdå.", author: "Tjakim" },
    { quote: "Du är så himla fin och jag är så himla glad att jag har dig i mitt liv ❤️", author: "Din habibi" },
    { quote: "Du är det bästa som hänt mig och jag älskar dig så mycket ❤️", author: "Joel" },
    { quote: "Motiveringen är OBEGRIPLIG", author: "Tjakim" },
    { quote: "Smaken är som röven... klöven", author: "Tjakim" },
    { quote: "Hoppas ni är lika trötta på mig som jag är på er", author: "Tjakim" },
    { quote: "Uttnytja varandra (första dagen) \n Säkerheten först (x3) \n Micke Mus (menar musse pig)", author: "HORANNI" },
    { quote: "Jag hoppas du har en bra dag bara :) Skolan kan ju vara jobbig, men du är bäst", author: "Joel" },
    { quote: "Dagens ord: Vacker \n Varför: Det matchar min bästa, finaste, vackraste flickvän och bästa vän allmänt ❤️", author: "Dois" },
    { quote: "Du klarar vad som helst ❤️❤️❤️", author: "Din bästa" } ]
  // Add more of your own quotes here!

// === Utilities ===
function getColor(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return null;
  try {
    return new Color(hex);
  } catch (_) {
    return null;
  }
}

function getColorPairFromJSON() {
  // Default fallback colors
  return {
    backgroundColor: new Color("#1a1a1a"),
    fontColor: Color.white()
  };
}

// --- Color contrast helpers ---
// Convert a Color or hex string to RGB {r,g,b} in 0..255
function colorToRgb(col) {
  try {
    if (!col) return null;
    if (typeof col === 'string') {
      const hex = col.replace('#','').trim();
      if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
      const bigint = parseInt(hex, 16);
      if (hex.length === 6) return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
      if (hex.length === 3) return { r: parseInt(hex[0]+hex[0],16), g: parseInt(hex[1]+hex[1],16), b: parseInt(hex[2]+hex[2],16) };
    }
    // Scriptable Color object: try .red() .green() .blue()
    if (typeof col.red === 'function' && typeof col.green === 'function' && typeof col.blue === 'function') {
      return { r: Math.round(col.red()*255), g: Math.round(col.green()*255), b: Math.round(col.blue()*255) };
    }
    // Try numeric properties
    if (typeof col.r !== 'undefined' && typeof col.g !== 'undefined' && typeof col.b !== 'undefined') {
      const r = col.r > 1 ? col.r : Math.round(col.r*255);
      const g = col.g > 1 ? col.g : Math.round(col.g*255);
      const b = col.b > 1 ? col.b : Math.round(col.b*255);
      return { r, g, b };
    }
    // Fallback: try toString -> hex
    if (typeof col.toString === 'function') {
      const s = String(col.toString());
      const m = s.match(/#([0-9a-fA-F]{6})/);
      if (m) return colorToRgb('#'+m[1]);
    }
  } catch (_) {}
  return null;
}

function relativeLuminance(rgb) {
  if (!rgb) return 0;
  const srgb = [rgb.r, rgb.g, rgb.b].map(v => v/255).map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4));
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}

// Return better contrasting Color (Color.white() or Color.black()), prefer provided color if readable
function getContrastingColor(backgroundColor, preferredColor = null) {
  try {
    if (preferredColor) {
      const prefRgb = colorToRgb(preferredColor);
      const bgRgb = colorToRgb(backgroundColor);
      if (prefRgb && bgRgb) {
        const lum1 = relativeLuminance(bgRgb);
        const lum2 = relativeLuminance(prefRgb);
        const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
        if (contrast >= 4.5) return preferredColor;
      }
    }
  } catch (_) {}
  const rgb = colorToRgb(backgroundColor);
  if (!rgb) return Color.white();
  const lum = relativeLuminance(rgb);
  return lum > 0.5 ? Color.black() : Color.white();
}

// === Scheduler: run updates three times per day (configurable) ===
// Times are local device times in HH:MM (24h) format. Change these as needed.
const SCHEDULE_TIMES = ["05:00", "12:00", "17:00"]; // morning, eftermiddag (midday/afternoon), evening

function parseTimeStringToTodayDate(timeStr) {
  const parts = timeStr.split(":").map(p => parseInt(p, 10));
  const d = new Date();
  d.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  return d;
}

function getNextRefreshDate(timesArray) {
  const now = new Date();
  const candidates = timesArray.map(t => {
    const d = parseTimeStringToTodayDate(t);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  });
  candidates.sort((a,b) => a - b);
  return candidates[0];
}

/**
 * Generate a deterministic number based on daily buckets.
 * Divides the day into `numBuckets` parts and returns a stable index
 * for the current bucket so the quote changes each scheduled run.
 */
function getDeterministicDailyBucket(min, max, numBuckets) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const bucketSize = (24 * 60) / numBuckets;
  const bucket = Math.floor(minutes / bucketSize);
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + bucket;
  const hash = Math.abs(Math.sin(seed) * 10000);
  const normalized = hash - Math.floor(hash);
  return Math.floor(normalized * (max - min)) + min;
}

/**
 * Get a custom quote that changes per configured daily buckets (e.g., 3 updates/day)
 * @param {number|null} forcedIndex - If provided, use this specific quote index instead of bucket rotation
 * @param {number} numBuckets - Number of buckets per day (default 3)
 */
function getCustomQuoteForBuckets(forcedIndex = null, numBuckets = 3) {
  let index;
  if (forcedIndex !== null && forcedIndex >= 0 && forcedIndex < MY_CUSTOM_QUOTES.length) {
    index = forcedIndex;
    console.log("🎯 Using forced quote index:", forcedIndex);
  } else if (forcedIndex !== null) {
    console.warn("⚠️ Forced index out of range:", forcedIndex, "valid range: 0 -", MY_CUSTOM_QUOTES.length - 1);
    index = getDeterministicDailyBucket(0, MY_CUSTOM_QUOTES.length, numBuckets);
  } else {
    index = getDeterministicDailyBucket(0, MY_CUSTOM_QUOTES.length, numBuckets);
    console.log("⏰ Using bucket rotation (", numBuckets, "/day), index:", index);
  }

  const quote = MY_CUSTOM_QUOTES[13];
  return {
    quote: quote.quote,
    author: quote.author,
    fontColor: Color.white(),
    backgroundColor: new Color("#1a1a1a")
  };
}

const sfs = 12;
const mfs = 14;
const lfs = 16;

function isQuoteTooLong(quote, author, sizeKey) {
  const totalText = `“${quote}”— ${author}`;
  const length = totalText.length;

  if (sizeKey === "s") {
    return length < 1 || length > 140;
  }

  if (sizeKey === "m") {
    return length <= 140 || length > 260;
  }

  if (sizeKey === "l") {
    return length <= 260; // anything above 260 is fine!
  }

  return false; // fallback safety
}


// === Font Loader ===
function loadCustomFont(fileName, size) {
  const fontPath = fm.joinPath(fm.documentsDirectory(), `.fonts/${fileName}`);
  if (fm.fileExists(fontPath)) {
    return new Font(fileName, size);
  } else {
    console.warn(`⚠️ Font not found: ${fileName}`);
    return Font.systemFont(size);
  }
}

// === Widget ===
async function createWidget() {
  // Check if running on lock screen
  const isLockScreen = config.widgetFamily === "accessorySmall" || 
                       config.widgetFamily === "accessoryRectangular" ||
                       config.widgetFamily === "accessoryInline";
  
  const widget = new ListWidget();
  // const quoteData = await getQuoteFromSheet();
  const quoteData = await getCustomQuoteForBuckets(forcedIndex, SCHEDULE_TIMES.length);

  // Get colors
  const fallback = getColorPairFromJSON();
  const bgColor = quoteData.backgroundColor || fallback.backgroundColor;
  const preferredColor = quoteData.fontColor || fallback.fontColor;
  const finalFontColor = getContrastingColor(bgColor, preferredColor);
  
  widget.backgroundColor = bgColor;

  // Lock screen styling
  if (isLockScreen) {
    if (config.widgetFamily === "accessoryInline") {
      // Inline lock screen (horizontal)
      const text = widget.addText(`"${quoteData.quote}" — ${quoteData.author}`);
      text.font = Font.systemFont(10);
      text.textColor = finalFontColor;
      text.lineLimit = 1;
    } else if (config.widgetFamily === "accessorySmall") {
      // Small square lock screen
      const stack = widget.addStack();
      stack.layoutVertically();
      stack.spacing = 2;
      
      const quoteText = stack.addText(quoteData.quote);
      quoteText.font = Font.systemFont(11);
      quoteText.textColor = finalFontColor;
      quoteText.lineLimit = 3;
      quoteText.minimumScaleFactor = 0.8;
      
      if (quoteData.author) {
        const authorText = stack.addText(`— ${quoteData.author}`);
        authorText.font = Font.systemFont(8);
        authorText.textColor = finalFontColor;
        authorText.lineLimit = 1;
        authorText.minimumScaleFactor = 0.7;
      }
    } else if (config.widgetFamily === "accessoryRectangular") {
      // Wide lock screen
      const stack = widget.addStack();
      stack.layoutVertically();
      stack.spacing = 3;
      
      const quoteText = stack.addText(quoteData.quote);
      quoteText.font = Font.systemFont(12);
      quoteText.textColor = finalFontColor;
      quoteText.lineLimit = 4;
      quoteText.minimumScaleFactor = 0.85;
      
      if (quoteData.author) {
        const authorText = stack.addText(`— ${quoteData.author}`);
        authorText.font = Font.systemFont(9);
        authorText.textColor = finalFontColor;
        authorText.lineLimit = 1;
        authorText.minimumScaleFactor = 0.8;
      }
    }
    
    // Lock screen refresh - align with scheduler times
    widget.refreshAfterDate = getNextRefreshDate(SCHEDULE_TIMES);
    
    return widget;
  }

  // Font settings
  // const fontSize = config.widgetFamily === "small" ? 13 : 16;
  const fontSize = widgetSize === "s" ? sfs : widgetSize === "l" ? lfs : mfs;

  // new Font(FONT, fontSize - 3); 
  // loadCustomFont("Roboto-Bold.ttf", fontSize);
  // Font.boldSystemFont(fontSize)
  // loadCustomFont("Roboto-Italic.ttf", fontSize - 3);
  // Font.italicSystemFont(fontSize - 3)

  // // "Avenir-Black"  "Avenir-Heavy" Avenir-Oblique  Roboto
  // 1 style
  // const FONT = "Avenir-Heavy";
  // const quoteFont = new Font(FONT, fontSize);
  // const authorFont = new Font("Avenir-Oblique", fontSize - 3);

  // 2 style
  // const FONT = "Roboto";
  // const quoteFont = new Font(FONT, fontSize);
  // const authorFont = new Font(FONT, fontSize - 3);

  // 3 style
  const quoteFont = Font.boldSystemFont(fontSize);
  const authorFont = Font.italicSystemFont(fontSize - 1);

  const stack = widget.addStack(); // Create a vertical stack
  stack.layoutVertically();
  stack.addSpacer();

  const textStack = stack.addStack();
  textStack.layoutHorizontally();
  // textStack.centerAlignContent();
  // stack.centerAlignContent();
  // textStack.addSpacer();

  // Quote: bold
  const quoteText = textStack.addText(`“${quoteData.quote}”`);
  quoteText.font = quoteFont;
  // quoteText.font = loadCustomFont("Roboto-Bold.ttf", fontSize);
  quoteText.textColor = finalFontColor;
  // quoteText.minimumScaleFactor = 0.5;
  quoteText.leftAlignText();

  stack.addSpacer();

  // Author: italic
  if (quoteData.author) {
    const textStack = stack.addStack();
    textStack.layoutHorizontally();
    textStack.addSpacer();
    const authorText = textStack.addText(`— ${quoteData.author}`);
    // textStack.addSpacer(0);
    // authorText.font = new Font(FONT, fontSize - 3);
    // authorText.font = loadCustomFont("Roboto-Italic.ttf", fontSize - 3);
    authorText.font = authorFont;
    authorText.textColor = finalFontColor;
    // authorText.minimumScaleFactor = 0.5;
    authorText.rightAlignText();
  }

  // stack.addSpacer();
  // widget.refreshAfterDate = new Date(Date.now() + 3600000); // refresh hourly

  // Schedule next widget refresh to the next configured time (morning/midday/evening)
  const next = getNextRefreshDate(SCHEDULE_TIMES);
  widget.refreshAfterDate = next;

  console.log("🔁 Next scheduled widget refresh:", next.toString());

  console.log("=== Quote Widget Info ===");
  console.log("📱 Widget size:", config.widgetFamily);
  console.log("🔤 Quote index:", MY_CUSTOM_QUOTES.indexOf(MY_CUSTOM_QUOTES.find(q => q.quote === quoteData.quote)));
  console.log("👤 Author:", quoteData.author);
  console.log("📏 Size param:", sizeParam);
  console.log("🎯 Forced index:", forcedIndex);
  console.log("✅ Widget ready to display");

  return widget;
}

// === Run ===
const widget = await createWidget();
if (!config.runsInWidget) await widget.presentMedium();
// if (!config.runsInWidget) await widget.presentMedium();
// if (!config.runsInWidget) await widget.presentLarge();
else Script.setWidget(widget);
Script.complete();