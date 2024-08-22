// Scrape Google AutoSuggest through "Scout Suggest: Free Keyword Research Tool"
// Avoid network timeouts, blocking and ban with random pauses and random mouse moves
// Open https://seoscout.com/suggest
// Set language, country and search variables
// Ctrl + Shift + J or Cmd + Option + J
// Paste the script, edit keyword list, enter
// If handle longer keyword lists, set longer range for pause (currently 11-41 seconds, line 19)
//
const keywords = ["keyword1", "keyword2", "keyword3"];
let currentKeywordIndex = 0;
let stopMouseMovements = false;

async function processNextKeyword() {
  if (currentKeywordIndex < keywords.length) {
    try {
      await updateInputAndClick(keywords[currentKeywordIndex]);
      currentKeywordIndex++;
      
      const pauseDuration = Math.floor(Math.random() * (41 - 11 + 1) + 11) * 1000;
      console.log(`Pausing for ${pauseDuration / 1000} seconds before processing next keyword...`);
      await new Promise(resolve => setTimeout(resolve, pauseDuration));
      
    } catch (error) {
      console.error(`Error processing keyword ${keywords[currentKeywordIndex]}:`, error);
      await new Promise(resolve => setTimeout(resolve, 15000));
      await processNextKeyword();
      return;
    }
    processNextKeyword();
  } else {
    console.log("All keywords processed!");
  }
}

async function updateInputAndClick(keyword) {
  console.log(`Processing keyword: ${keyword}`);
  
  const inputElement = await waitForElement('input[id="__BVID__16"]');
  inputElement.value = keyword;
  inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  console.log("Keyword has been updated to:", keyword);

  await new Promise(resolve => setTimeout(resolve, 3000));

  const startButton = await waitForElement('button.btn-primary[data-v-41bc90f0]');
  startButton.click();
  console.log("Start button clicked!");

  stopMouseMovements = false;
  simulateRandomMouseMovements();
  await checkForGroupsLink();
}

async function simulateRandomMouseMovements() {
  console.log("Starting random mouse movements...");
  while (!stopMouseMovements) {
    const x = Math.floor(Math.random() * window.innerWidth);
    const y = Math.floor(Math.random() * window.innerHeight);

    const moveEvent = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });

    document.dispatchEvent(moveEvent);
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150)); // 50-200ms between moves
  }
  console.log("Finished random mouse movements.");
}

async function waitForElement(selector, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

async function checkForGroupsLink() {
  console.log("Checking for Groups link...");
  const maxAttempts = 30; // 5 minutes total (30 * 10 seconds)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const groupsLink = await waitForXPath('//a[text()="Groups"]', 10000);
      if (groupsLink) {
        console.log("Groups link found!");
        stopMouseMovements = true;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for mouse movements to stop
        groupsLink.click();
        console.log("Groups link clicked!");
        await new Promise(resolve => setTimeout(resolve, 3000));
        await clickDownloadCSV();
        return;
      }
    } catch (error) {
      console.log("Groups link not found yet. Checking again in 10 seconds.");
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
  }
  
  stopMouseMovements = true;
  throw new Error("Groups link not found after 5 minutes");
}

async function clickDownloadCSV() {
  const downloadButton = await waitForXPath('//button[text()="Download CSV "]');
  downloadButton.click();
  console.log("Download CSV button clicked!");
  
  await new Promise(resolve => setTimeout(resolve, 7000));
}

async function waitForXPath(xpath, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`XPath ${xpath} not found within ${timeout}ms`);
}

processNextKeyword().catch(error => console.error("Script execution failed:", error));
