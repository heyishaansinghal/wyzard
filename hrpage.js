let configSettings = JSON.parse(localStorage.getItem("configSettings"));
const wizard = document.querySelector(".wizard");
const steps = wizard.querySelectorAll(".step");
const startBtn = document.querySelector(".start-btn");
const nextBtns = wizard.querySelectorAll(".next-btn");
const backBtns = wizard.querySelectorAll(".back-btn");
const launchBtn = document.querySelector(".launch-btn");

const additionalFields = document.getElementById("additional-fields");
const verifyLicenseKey = (key) => {
  const email = "ishaansinghalsocials@gmail.com";
  const webAppUrl =
    "https://script.google.com/macros/s/AKfycbxh2lQdPux2bhjhx4SMyi_SuRZzI9GfayGQQW74G9mfgpM47ml9IRMt1QFXfppI_nc/exec";

  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(
        `${webAppUrl}?key=${encodeURIComponent(key)}&email=${encodeURIComponent(
          email
        )}`
      );
      const data = await response.json();
      if (data.error) {
        reject(data.error);
      } else {
        const configSettings = {
          key: data.data[0].key,
          domain: data.data[0].domain,
          email: data.data[0].email,
        };
        localStorage.setItem("configSettings", JSON.stringify(configSettings));
        resolve(data.data);
      }
    } catch (error) {
      reject("Fetch error: " + error);
    }
  });
};

function showStep(index) {
  steps.forEach((step) => step.classList.remove("active"));
  steps[index].classList.add("active");
}
nextBtns[0].addEventListener("click", async () => {
  const licenseKeyInput = document.getElementById("licenseKey");
  const licenseKey = licenseKeyInput.value;

  if (!licenseKey) {
    alert("Please enter a license key.");
    return;
  }

  nextBtns[0].classList.add("loading");
  licenseKeyInput.setAttribute("disabled", true);

  try {
    const response = await verifyLicenseKey(licenseKey);
    console.log(response);
    showStep(2);
  } catch (error) {
    console.error(error);
    alert("Error verifying license key. Please try again.");
  } finally {
    nextBtns[0].classList.remove("loading");
    licenseKeyInput.removeAttribute("disabled");
  }
});
function saveConfigSettings() {
  let configSettings = JSON.parse(localStorage.getItem("configSettings"));
  const domain = configSettings.domain;
  const email = configSettings.email;
  const licenseKey = document.getElementById("licenseKey").value;
  const wordpressUsername = document.getElementById("wordpressUsername").value;
  const wordpressPassword = document.getElementById("wordpressPassword").value;
  const openAPIKey = document.getElementById("openAPIKey").value; // Add this line
  configSettings = {
    licenseKey,
    wordpressUsername,
    wordpressPassword,
    domain,
    email,
    openAPIKey, // Add this line
  };
  localStorage.setItem("configSettings", JSON.stringify(configSettings));
}

function getConfigSettingsFromLocalStorage() {
  const configSettings = JSON.parse(localStorage.getItem("configSettings"));
  if (configSettings) {
    if (configSettings.openAPIKey) {
      document.getElementById("openAPIKey").value = configSettings.openAPIKey;
    }
    document.getElementById("Domain").value = configSettings.domain;
  }
}

function validateOpenAPIKey(apiKey) {
  // Adjust the validation according to your actual requirements
  return apiKey.startsWith("sk-") && apiKey.length >= 16;
}
function displaySummary() {
  const summary = document.querySelector(".summary");
  const configSettings = JSON.parse(localStorage.getItem("configSettings"));
  const licenseKey = document.getElementById("licenseKey").value;
  const wordpressUsername = document.getElementById("wordpressUsername").value;
  const wordpressPassword = document.getElementById("wordpressPassword").value;
  summary.innerHTML = `
      <div class="summaryDiv"><p class="summaryLabel">License Key:</p>
      <p>${licenseKey}</p>
      </div>
      <div class="summaryDiv"><p class="summaryLabel">Domain:</p>
      <p>${configSettings.domain}</p>
      </div>
      <div class="summaryDiv"><p class="summaryLabel">Email:</p>
      <p>${configSettings.email}</p>
      </div>
      <div class="summaryDiv"><p class="summaryLabel">Wordpress Username:</p>
      <p>${wordpressUsername}</p>
      </div>
      <div class="summaryDiv"><p class="summaryLabel">Wordpress Password:</p>
      <p>${wordpressPassword}</p>
      </div>`;
}

// Add event listeners unconditionally
startBtn.addEventListener("click", () => {
  if (!configSettings) {
    showStep(1);
  } else {
    showStep(2);
  }
});

backBtns[0].addEventListener("click", () => showStep(1));

nextBtns[2].addEventListener("click", () => {
  saveConfigSettings();
  showStep(4);
});
nextBtns[1].addEventListener("click", (event) => {
  event.preventDefault(); // Prevent the form from proceeding
  const wpUsername = document.getElementById("wordpressUsername");
  const wpPassword = document.getElementById("wordpressPassword");
  const wpUsernameError = document.getElementById("wordpressUsernameError");
  const wpPasswordError = document.getElementById("wordpressPasswordError");

  let hasError = false;

  if (!wpUsername.value) {
    wpUsernameError.style.display = "block";
    hasError = true;
  } else {
    wpUsernameError.style.display = "none";
  }

  if (!wpPassword.value) {
    wpPasswordError.style.display = "block";
    hasError = true;
  } else {
    wpPasswordError.style.display = "none";
  }

  if (!hasError) {
    saveConfigSettings();
    displaySummary();
    showStep(3);
  }
  alert(!hasError);
});

// ...
const settingsBtn = document.getElementById("settingsBtn");
const overlay = document.createElement("div");
const overlayContent = document.createElement("div");
const heading = document.createElement("h2");
const botNumber = document.createElement("label");
const botInput = document.createElement("input");
const aiTextLabel = document.createElement("label");
const aiTextPromptInput = document.createElement("input");
const saveSettingsBtn = document.createElement("button");

overlay.className = "overlay hidden";

overlayContent.className = "overlay-content";
overlayContent.className = "wizard-container";
heading.textContent = "Settings";
botNumber.textContent = "Number of Bots:";
botNumber.htmlFor = "botNumber";
botInput.type = "number";
botInput.value = 10;
botInput.id = "botNumber";
botInput.placeholder = "Number of Bots";
aiTextLabel.textContent = "AI Text Prompt:";
aiTextLabel.htmlFor = "aiTextPrompt";
aiTextPromptInput.type = "text";
aiTextPromptInput.id = "aiTextPrompt";
aiTextPromptInput.placeholder = "AI Text Prompt";
saveSettingsBtn.textContent = "Save";

overlayContent.appendChild(heading);
overlayContent.appendChild(botNumber);
overlayContent.appendChild(botInput);
overlayContent.appendChild(aiTextLabel);
overlayContent.appendChild(aiTextPromptInput);
overlayContent.appendChild(saveSettingsBtn);
overlay.appendChild(overlayContent);
document.body.appendChild(overlay);

// ...

saveSettingsBtn.addEventListener("click", () => {
  const prompts = {
    botNumber: botInput.value,
    aiTextPrompt: aiTextPromptInput.value,
  };
  overlay.classList.remove("disp-flex");
  overlay.classList.add("hidden");
  localStorage.setItem("prompts", JSON.stringify(prompts));
});

settingsBtn.addEventListener("click", () => {
  const prompts = JSON.parse(localStorage.getItem("prompts"));

  if (prompts) {
    botInput.value = prompts.botNumber;
    aiTextPromptInput.value = prompts.aiTextPrompt;
  }

  overlay.classList.remove("hidden");
  overlay.classList.add("disp-flex");
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    overlay.classList.add("hidden");
  }
});

// ...

console.log(nextBtns);
// Add a new event listener for the Save button in Step 3
document.querySelector("#step3 .next-btn").addEventListener("click", () => {
  saveConfigSettings();
  displaySummary();
  showStep(4);
});

launchBtn.addEventListener("click", () => {
  let prompts = JSON.parse(localStorage.getItem("prompts"));
  let configSettings = JSON.parse(localStorage.getItem("configSettings"));
  if (prompts && prompts.botNumber > 0) {
    fetchWordPressContent(`https://${configSettings.domain}`);
  } else if (configSettings.domain) {
    location.reload();
    displayOverlay("Please Set Prompts and OPEN API KEY Before Procceding");
  }
});

// Show additional input fields conditionally

if (configSettings) {
  additionalFields.style.display = "block";
  document.getElementById("wordpressUsername").value =
    configSettings.wordpressUsername;
  document.getElementById("wordpressPassword").value =
    configSettings.wordpressPassword;
} else {
  additionalFields.style.display = "none";
}
// Initialize the wizard
if (!configSettings) {
  showStep(0);
} else {
  showStep(2);
  additionalFields.style.display = "block";
  document.getElementById("licenseKey").value = configSettings.licenseKey;
  document.getElementById("wordpressUsername").value =
    configSettings.wordpressUsername;
  document.getElementById("wordpressPassword").value =
    configSettings.wordpressPassword;
  getConfigSettingsFromLocalStorage(); // Add this line
}

if (document.getElementById("logoutBtn")) {
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    console.log("Button Clicked");
    localStorage.removeItem("configSettings");
    location.reload();
  });
}
