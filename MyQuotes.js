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
    { quote: "Jag hoppas du har en bra daga bara :) Skolan kan ju vara jobbig, men du är bäst", author: "Joel" }
  // Add more of your own quotes here!
];

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
  try {
    if (!fm.fileExists(COLOR_PAIRS_PATH)) return null;
    const raw = fm.readString(COLOR_PAIRS_PATH);
    const pairs = JSON.parse(raw);
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    return {
      backgroundColor: getColor(pair.background) || new Color("#000000"),
      fontColor: getColor(pair.font) || Color.white()
    };
  } catch (_) {
    return {
      backgroundColor: new Color("#000000"),
      fontColor: Color.white()
    };
  }
}

/**
 * Get a custom quote that changes every 12 hours
 * @param {number|null} forcedIndex - If provided, use this specific quote index instead of 12-hour rotation
 */
function getCustomQuote12Hour(forcedIndex = null) {
  let index;
  
  // If a specific index is forced (e.g., from widget parameter), use it
  if (forcedIndex !== null && forcedIndex >= 0 && forcedIndex < MY_CUSTOM_QUOTES.length) {
    index = forcedIndex;
    console.log("🎯 Using forced quote index:", forcedIndex);
  } else if (forcedIndex !== null) {
    console.warn("⚠️ Forced index out of range:", forcedIndex, "valid range: 0 -", MY_CUSTOM_QUOTES.length - 1);
    index = getDeterministic12HourNumber(0, MY_CUSTOM_QUOTES.length);
  } else {
    // Use deterministic 12-hour rotation
    index = getDeterministic12HourNumber(0, MY_CUSTOM_QUOTES.length);
    console.log("⏰ Using 12-hour rotation, index:", index);
  }
  
  const quote = MY_CUSTOM_QUOTES[index];
  
  return {
    quote: quote.quote,
    author: quote.author,
    fontColor: Color.white(),
    backgroundColor: new Color("#1a1a1a")
  };
}

/**
 * Generate a deterministic number based on 12-hour intervals
 * Same number all day until 12 hours pass, then changes
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} - Deterministic number in range [min, max)
 */
function getDeterministic12HourNumber(min, max) {
  const now = new Date();
  // Get 12-hour bucket (0 or 1 per day)
  const bucket = Math.floor(now.getHours() / 12);
  // Create seed from date + 12-hour bucket
  const seed = now.getFullYear() * 10000 + 
               (now.getMonth() + 1) * 100 + 
               now.getDate() + 
               bucket * 0.5;
  
  // Simple hash function
  const hash = Math.sin(seed) * 10000;
  const normalized = hash - Math.floor(hash); // 0 to 1
  
  return Math.floor(normalized * (max - min)) + min;
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
  const quoteData = await getCustomQuote12Hour(forcedIndex);

  // Lock screen styling
  if (isLockScreen) {
    widget.backgroundColor = new Color("#000000", 0.3);
    
    if (config.widgetFamily === "accessoryInline") {
      // Inline lock screen (horizontal)
      const text = widget.addText(`"${quoteData.quote}" — ${quoteData.author}`);
      text.font = Font.systemFont(10);
      text.textColor = Color.white();
      text.lineLimit = 1;
    } else if (config.widgetFamily === "accessorySmall") {
      // Small square lock screen
      const stack = widget.addStack();
      stack.layoutVertically();
      stack.spacing = 2;
      
      const quoteText = stack.addText(quoteData.quote);
      quoteText.font = Font.systemFont(11);
      quoteText.textColor = Color.white();
      quoteText.lineLimit = 3;
      quoteText.minimumScaleFactor = 0.8;
      
      if (quoteData.author) {
        const authorText = stack.addText(`— ${quoteData.author}`);
        authorText.font = Font.systemFont(8);
        authorText.textColor = Color.white();
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
      quoteText.textColor = Color.white();
      quoteText.lineLimit = 4;
      quoteText.minimumScaleFactor = 0.85;
      
      if (quoteData.author) {
        const authorText = stack.addText(`— ${quoteData.author}`);
        authorText.font = Font.systemFont(9);
        authorText.textColor = Color.white();
        authorText.lineLimit = 1;
        authorText.minimumScaleFactor = 0.8;
      }
    }
    
    // Lock screen refresh - every 12 hours
    const nextUpdate = new Date();
    nextUpdate.setHours(nextUpdate.getHours() + 12);
    widget.refreshAfterDate = nextUpdate;
    
    return widget;
  }

  const fallback = getColorPairFromJSON();

  const bgColor = quoteData.backgroundColor || fallback.backgroundColor;
  const fontColor = quoteData.fontColor || fallback.fontColor;

  widget.backgroundColor = bgColor;

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
  quoteText.textColor = fontColor;
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
    authorText.textColor = fontColor;
    // authorText.minimumScaleFactor = 0.5;
    authorText.rightAlignText();
  }

  // stack.addSpacer();
  // widget.refreshAfterDate = new Date(Date.now() + 3600000); // refresh hourly

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // exactly at 12:00:00 AM (midnight)
  widget.refreshAfterDate = tomorrow;

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