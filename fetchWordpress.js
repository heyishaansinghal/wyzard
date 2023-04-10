let currentPage = 1;

//Backup Version//

async function fetchPageContent(url) {
  try {
    const corsProxy = "https://api.allorigins.win/get?url=";
    const response = await fetch(corsProxy + encodeURIComponent(url));
    const result = await response.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.contents, "text/html");

    return {
      title: doc.querySelector("title").innerText,
      h1: doc.querySelector("h1") ? doc.querySelector("h1").outerHTML : "",
      content: doc.body.innerHTML,
    };
  } catch (error) {
    console.error("Error fetching content:", error);
    return "";
  }
}

async function saveChanges(postId, updatedContent, siteUrl, authHeader) {
  console.log(siteUrl);

  try {
    // Fetch both pages and posts concurrently
    const pagesApiUrl = `${siteUrl}/wp-json/wp/v2/pages/${postId}`;
    const postsApiUrl = `${siteUrl}/wp-json/wp/v2/posts/${postId}`;

    const [pagesResponse, postsResponse] = await Promise.all([
      fetch(pagesApiUrl),
      fetch(postsApiUrl),
    ]);

    // Determine the content type
    const contentType = pagesResponse.ok ? "page" : "post";

    // Update the content based on its type
    const apiUrl = `${siteUrl}/wp-json/wp/v2/${contentType}s/${postId}`;
    console.log("Saving Changes in WordPress");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ content: updatedContent }),
    });

    if (!response.ok) {
      throw new Error("Failed to update content");
    }

    console.log("Content updated successfully");
  } catch (error) {
    console.error("Error updating content:", error);
  }
}

async function countGrammarMistakes(rawText) {
  const text = extractTextFromHtml(rawText);
  console.log(rawText + "=========================" + text);
  const apiUrl = "https://api.languagetool.org/v2/check";
  const params = new URLSearchParams();
  params.append("c", "1");
  params.append("instanceId", "38876:1681068103877");
  params.append("v", "standalone");
  params.append("data", JSON.stringify({ text: text }));
  params.append("textSessionId", "38876:1681068103877");
  params.append("enableHiddenRules", "true");
  params.append("level", "picky");
  params.append("language", "auto");
  params.append("noopLanguages", "en");
  params.append("preferredLanguages", "en");
  params.append("preferredVariants", "en-US,de-DE,pt-BR,ca-es");
  params.append("disabledRules", "WHITESPACE_RULE");
  params.append("useragent", "webextension-chrome-ng");
  params.append("mode", "allButTextLevelOnly");
  params.append("allowIncompleteResults", "true");

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "POST",
    });

    const jsonResponse = await response.json();
    const matches = jsonResponse.matches;
    let mistakeCount = 0;

    for (const match of matches) {
      if (match.rule.issueType === "misspelling") {
        mistakeCount++;
      }
    }

    return mistakeCount;
  } catch (error) {
    console.error("Error fetching data from the API:", error);
    return -1;
  }
}

function getSelectedText() {
  let text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== "Control") {
    text = document.selection.createRange().text;
  }
  return text;
}
function displayOverlay(message) {
  const overlay = document.createElement("div");
  overlay.setAttribute(
    "style",
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 1000;"
  );

  const messageWrapper = document.createElement("div");
  messageWrapper.setAttribute(
    "style",
    "background-color: rgba(255, 182, 193, 0.8); padding: 10px 20px; border-radius: 5px; max-width: 200px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: opacity 0.3s ease-in-out; opacity: 0;"
  );

  const text = document.createElement("p");
  text.textContent = message;
  text.setAttribute(
    "style",
    "font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; font-weight: 300; color: black; text-align: center; margin: 0;"
  );

  messageWrapper.appendChild(text);
  overlay.appendChild(messageWrapper);
  document.body.appendChild(overlay);

  // Fade in the message
  setTimeout(() => {
    messageWrapper.style.opacity = "1";
  }, 0);

  // Fade out and remove the message after 2 seconds
  setTimeout(() => {
    messageWrapper.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }, 2000);

  // Remove the overlay when clicking outside of the message
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      messageWrapper.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  });
}

function getElementIndex(element) {
  // Get all the elements of the same type as the given element
  const elements = document.getElementsByTagName(element.tagName);
  // Get the index of the given element in the array of elements
  const index = Array.from(elements).indexOf(element);
  // Return the index + 1 as a string with "st", "nd", "rd", or "th" suffix
  const suffix =
    index % 10 == 1 && index != 11
      ? "st"
      : index % 10 == 2 && index != 12
      ? "nd"
      : index % 10 == 3 && index != 13
      ? "rd"
      : "th";
  return `${index + 1}${suffix}`;
}

function createContextMenu(x, y, selectedText) {
  const contextMenu = document.createElement("div");
  contextMenu.setAttribute(
    "style",
    `position: absolute; top: ${y}px; left: ${x}px; background-color: white; padding: 10px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); z-index: 1000;`
  );

  function createTextPopup(x, y, text) {
    const textPopup = document.createElement("div");
    textPopup.setAttribute(
      "style",
      `position: absolute; top: ${y}px; left: ${x}px; background-color: white; max-height:150px; padding: 10px; border-radius: 8px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3); z-index: 1000; max-width:350px; padding:15px; overflow:scroll;`
    );

    const loaderHTML = `
    <div class="center" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
    </div>
  `;
    textPopup.innerHTML = loaderHTML;

    // Create copy icon element
    const copyIcon = document.createElement("i");
    copyIcon.className = "copy-icon";
    copyIcon.innerHTML = "📋"; // or use an actual icon from an icon library like Font Awesome or Material Icons
    copyIcon.setAttribute(
      "style",
      `position: absolute; top: 5px; right: 5px; cursor: pointer; font-size: 20px;`
    );

    // Create tooltip
    const tooltip = document.createElement("span");
    tooltip.textContent = "Copied!";
    tooltip.setAttribute(
      "style",
      `visibility: hidden; background-color: #555; color: white; text-align: center; border-radius: 6px; padding: 5px 10px; font-size: 14px; position: absolute; z-index: 1; top: -25px; right: 5px; opacity: 0; transition: opacity 0.3s;`
    );
    copyIcon.appendChild(tooltip);

    // Add click event to copy text
    copyIcon.addEventListener("click", () => {
      const textarea = document.createElement("textarea");
      textarea.value = textPopup.textContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      // Show tooltip
      tooltip.style.visibility = "visible";
      tooltip.style.opacity = "1";
      setTimeout(() => {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
      }, 1500);
    });

    getAIText(text).then((correctedText) => {
      textPopup.innerHTML = "";
      textPopup.textContent = correctedText;
      textPopup.appendChild(copyIcon); // Add the copy icon to the textPopup div
    });

    return textPopup;
  }

  // Add the CSS for the spin animation
  const style = document.createElement("style");
  style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
  document.head.appendChild(style);

  const option2 = document.createElement("div");
  option2.textContent = "AI Help";
  option2.setAttribute(
    "style",
    "cursor: pointer; padding: 5px; transition: background-color 0.3s;"
  );

  option2.addEventListener("mouseover", () => {
    option2.style.backgroundColor = "#f3f3f3";
  });

  option2.addEventListener("mouseout", () => {
    option2.style.backgroundColor = "transparent";
  });
  option2.addEventListener("click", () => {
    const textPopup = createTextPopup(x, y, selectedText);
    document.body.appendChild(textPopup);
    textPopup.addEventListener("click", () => {
      textPopup.remove();
    });

    document.addEventListener("mousedown", (e) => {
      const isClickInsideTextPopup = textPopup.contains(e.target);
      if (!isClickInsideTextPopup) {
        textPopup.remove();
      }
    });

    contextMenu.remove();
  });

  contextMenu.appendChild(option2);

  // Add the mousedown event listener inside the createContextMenu function
  return contextMenu;
}

function extractTextFromHtml(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove script and style tags
  const scriptTags = tempDiv.getElementsByTagName("script");
  const styleTags = tempDiv.getElementsByTagName("style");

  for (let i = scriptTags.length - 1; i >= 0; i--) {
    scriptTags[i].parentNode.removeChild(scriptTags[i]);
  }

  for (let i = styleTags.length - 1; i >= 0; i--) {
    styleTags[i].parentNode.removeChild(styleTags[i]);
  }

  // Remove HTML comments
  html = tempDiv.innerHTML.replace(/<!--[\s\S]*?-->/g, "");

  // Remove WordPress shortcodes
  html = html.replace(/\[[^\]]+\]/g, "");

  // Update the temporary div with the cleaned-up HTML
  tempDiv.innerHTML = html;

  return tempDiv.textContent || tempDiv.innerText || "";
}

function getAuthHeader() {
  const configSettings = JSON.parse(localStorage.getItem("configSettings"));
  const { wordpressUsername, wordpressPassword } = configSettings;

  // Combine the username and password with a colon separator
  const credentials = `${wordpressUsername}:${wordpressPassword}`;

  // Convert the credentials to a base64-encoded string
  const base64Credentials = btoa(credentials);

  // Return the Authorization header value
  return `Basic ${base64Credentials}`;
}

async function handleClick(url, textContent, postId) {
  console.log(postId);
  // Create the loader
  const loader = document.createElement("div");
  loader.setAttribute(
    "style",
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #fff8f8d1; z-index: 900; display: flex; align-items: center; justify-content: center;"
  );

  const spinner = document.createElement("div");
  spinner.setAttribute(
    "style",
    "border: 6px solid #f3f3f3; border-top: 6px solid #63e7da; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite;"
  );

  loader.appendChild(spinner);
  document.body.appendChild(loader);

  // Add the spin animation keyframes
  const spinAnimation = document.createElement("style");
  spinAnimation.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(spinAnimation);
  const { title, h1, content } = await fetchPageContent(url);

  // Remove the loader
  loader.remove();

  const overlay = document.createElement("div");
  overlay.setAttribute(
    "style",
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0); z-index: 999; opacity: 0; transition: opacity 0.5s;"
  );
  setTimeout(() => {
    overlay.style.opacity = "1";
  }, 0);

  const contentWrapper = document.createElement("div");
  contentWrapper.setAttribute(
    "style",
    "width: 80%; margin: 50px auto; background-color: white; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); backdrop-filter: blur(10px); border-radius: 10px; overflow-y: auto; max-height: 80vh; position: relative; display: flex; justify-content: space-between;"
  );

  const button1 = document.createElement("button");
  button1.textContent = "Save Changes";

  const button3 = document.createElement("button");
  button3.textContent = "AI Write";

  const buttonsContainer = document.createElement("div");
  buttonsContainer.setAttribute(
    "style",
    "display: flex; justify-content: center; margin-bottom: 20px; gap: 10px;"
  );

  buttonsContainer.appendChild(button1);
  buttonsContainer.appendChild(button3);

  button1.setAttribute(
    "style",
    " background-color: #63e7da; border: none; outline: none; cursor: pointer; padding: 10px 15px; font-size: 14px; color: white; border-radius: 3px; transition: all 0.3s ease;"
  );
  button1.addEventListener("mouseover", () => {
    button1.style.transform = "scale(1.05)";
    button1.style.backgroundColor = "#68f1d9";
  });

  button1.addEventListener("mouseout", () => {
    button1.style.transform = "scale(1)";
    button1.style.backgroundColor = "#63e7da";
  });
  button1.addEventListener("click", (e) => {
    console.log("Button Just got Clicked");
    const updatedContent = scrappedTextContainer.innerHTML;
    const authHeader = getAuthHeader();
    saveChanges(
      postId,
      updatedContent,
      `https://${configSettings.domain}`,
      authHeader
    );
  });

  button3.setAttribute(
    "style",
    " background-color: #63e7da; border: none; outline: none; cursor: pointer; padding: 10px 15px; font-size: 14px; color: white; border-radius: 3px; transition: all 0.3s ease;"
  );
  button3.addEventListener("mouseover", () => {
    button3.style.transform = "scale(1.05)";
    button3.style.backgroundColor = "#68f1d9";
  });

  button3.addEventListener("mouseout", () => {
    button3.style.transform = "scale(1)";
    button3.style.backgroundColor = "#63e7da";
  });

  button3.addEventListener("click", async () => {
    // Create and display the loader
    const loader = document.createElement("div");
    loader.setAttribute(
      "style",
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #fff8f8d1; z-index: 1100; display: flex; align-items: center; justify-content: center;"
    );
    const spinner = document.createElement("div");
    spinner.setAttribute(
      "style",
      "border: 6px solid #f3f3f3; border-top: 6px solid #63e7da; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite;"
    );
    loader.appendChild(spinner);
    document.body.appendChild(loader);

    const scrappedText = scrappedTextContainer.textContent;
    const aiText = await getAIText(scrappedText);

    // Remove the loader
    loader.remove();

    const aiSuggestionPopup = createAiSuggestionPopup(aiText);
    document.body.appendChild(aiSuggestionPopup);
  });

  contentWrapper.innerHTML = `
  <div style="overflow-y: auto; width: 49%; padding: 20px;">${content}</div>
  <div style="overflow-y: auto; width: 49%; padding: 20px;">
    ${h1}
    <grammarly-editor-plugin config.suggestionCards="on" config.activation="immediate" config.autocomplete="on">
    <div class="scrapped-text" contenteditable="true">${textContent}</div>
    <grammarly-editor-plugin>
  </div>
`;

  const rightContentWrapper = contentWrapper.children[1];
  rightContentWrapper.insertBefore(
    buttonsContainer,
    rightContentWrapper.children[1]
  );

  const iframeContent = contentWrapper.children[0];
  const navbar = iframeContent.querySelector("nav, header");
  const footer = iframeContent.querySelector("footer");

  if (navbar) {
    navbar.remove();
  }

  if (footer) {
    footer.remove();
  }
  function displayOverlay(message) {
    const overlay = document.createElement("div");
    overlay.setAttribute(
      "style",
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 1000;"
    );

    const messageWrapper = document.createElement("div");
    messageWrapper.setAttribute(
      "style",
      "background-color: rgba(255, 182, 193, 0.8); padding: 10px 20px; border-radius: 5px; max-width: 200px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: opacity 0.3s ease-in-out; opacity: 0;"
    );

    const text = document.createElement("p");
    text.textContent = message;
    text.setAttribute(
      "style",
      "font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; font-weight: 300; color: black; text-align: center; margin: 0;"
    );

    messageWrapper.appendChild(text);
    overlay.appendChild(messageWrapper);
    document.body.appendChild(overlay);

    // Fade in the message
    setTimeout(() => {
      messageWrapper.style.opacity = "1";
    }, 0);

    // Fade out and remove the message after 2 seconds
    setTimeout(() => {
      messageWrapper.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }, 2000);

    // Remove the overlay when clicking outside of the message
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        messageWrapper.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
        }, 300);
      }
    });
  }

  const scrappedTextContainer = contentWrapper.children[1];

  iframeContent.addEventListener("scroll", (e) => {
    scrappedTextContainer.scrollTop = iframeContent.scrollTop;
  });

  scrappedTextContainer.addEventListener("scroll", (e) => {
    iframeContent.scrollTop = scrappedTextContainer.scrollTop;
  });

  scrappedTextContainer.addEventListener("click", (a) => {
    let originalText = "";
    originalText = a.target.textContent;
    const elements = iframeContent.querySelectorAll(a.target.tagName);
    scrappedTextContainer.addEventListener("input", (e) => {
      elements.forEach((el) => {
        if (el.textContent === originalText) {
          el.textContent = a.target.textContent;
          originalText = a.target.textContent;
        }
      });
    });
  });
  scrappedTextContainer.addEventListener("input", () => {
    const updatedContent = scrappedTextContainer.innerHTML;
    iframe.contentWindow.document.body.innerHTML = updatedContent;

    const elements = iframe.contentWindow.document.querySelectorAll("*");
    elements.forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
      });
    });
  });

  const backButton = document.createElement("button");
  backButton.setAttribute(
    "style",
    "position: absolute; top: 60px; border-radius : 8px ;left: 40px; background-color: #63e7da; border: none; outline: none; cursor: pointer; padding: 10px 15px; font-size: 14px; color: white; border-radius: 3px; transition: all 0.3s ease;"
  );

  backButton.textContent = "Back";
  backButton.onclick = () => {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
    }, 500);
  };
  backButton.addEventListener("mouseover", () => {
    backButton.style.transform = "scale(1.05)";
    backButton.style.backgroundColor = "#68f1d9";
  });

  backButton.addEventListener("mouseout", () => {
    backButton.style.transform = "scale(1)";
    backButton.style.backgroundColor = "#63e7da";
  });

  overlay.appendChild(contentWrapper);
  overlay.appendChild(backButton);
  document.body.appendChild(overlay);

  scrappedTextContainer.addEventListener("keydown", (e) => {
    const blockedKeys = ["a", "A", "x", "X", "v", "V"];
    if ((e.ctrlKey || e.metaKey) && blockedKeys.includes(e.key)) {
      e.preventDefault();
      displayOverlay("This action is disabled.");
    }

    if (
      e.shiftKey &&
      (e.key === "Delete" ||
        e.key === "Insert" ||
        (e.ctrlKey && e.key === "Insert"))
    ) {
      e.preventDefault();
      displayOverlay("This action is disabled.");
    }
  });

  const scrappedTextContainerContextMenuSelector =
    document.querySelector(".scrapped-text");

  scrappedTextContainerContextMenuSelector.addEventListener(
    "contextmenu",
    (e) => {
      e.preventDefault();

      // Get the selected text
      const selectedText = getSelectedText();

      // If some text is selected, display the custom context menu and log the selected text
      if (selectedText) {
        const contextMenu = createContextMenu(
          e.clientX,
          e.clientY,
          selectedText
        );
        document.body.appendChild(contextMenu);
        contextMenu.addEventListener("click", () => {
          contextMenu.remove();
        });
        document.addEventListener("mousedown", (e) => {
          const isClickInsideContextMenu = contextMenu.contains(e.target);
          if (!isClickInsideContextMenu) {
            contextMenu.remove();
          }
        });
        console.log(selectedText);
      } else {
        // If no text is selected, display the default context menu
        e.stopPropagation();
      }
    }
  );
}

async function getAIText(userContent) {
  const localStorageData = JSON.parse(localStorage.getItem("prompts"));
  const configSettings = JSON.parse(localStorage.getItem("configSettings"));

  if (!localStorageData || !localStorageData.aiTextPrompt) {
    displayOverlay("Prompt is not available in localStorage.");
    return;
  }

  if (!configSettings || !configSettings.openAPIKey) {
    displayOverlay("OpenAI API key is not available in localStorage.");
    return;
  }

  const promptToUse = localStorageData.aiTextPrompt;
  const apiKey = configSettings.openAPIKey;
  const maxWordsPerRequest = 3000;

  // Split the text into chunks if it exceeds the maximum words per request
  const words = userContent.split(/\s+/);
  const chunks = [];
  while (words.length > 0) {
    chunks.push(words.splice(0, maxWordsPerRequest).join(" "));
  }

  let finalResult = "";

  // Process each chunk one by one
  for (const chunk of chunks) {
    const url = "https://api.openai.com/v1/chat/completions";
    const requestBody = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `${promptToUse}`,
        },
        { role: "user", content: chunk },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Check for common error status codes and displayOverlay the appropriate message
    if (!response.ok) {
      switch (response.status) {
        case 400:
          displayOverlay(
            "Bad Request: The request was invalid or cannot be served."
          );
          break;
        case 401:
          displayOverlay("Unauthorized: The request requires authentication.");
          break;
        case 403:
          displayOverlay(
            "Forbidden: The server understood the request but refuses to authorize it."
          );
          break;
        case 404:
          displayOverlay(
            "Not Found: The requested resource could not be found."
          );
          break;
        case 429:
          displayOverlay(
            "Too Many Requests: You have exceeded the rate limit."
          );
          break;
        case 500:
          displayOverlay(
            "Internal Server Error: The server has encountered an error."
          );
          break;
        case 501:
          displayOverlay(
            "Not Implemented: The requested method is not supported by the server."
          );
          break;
        default:
          displayOverlay(
            `Error: An unexpected error occurred with status code ${response.status}.`
          );
      }

      return;
    }

    const jsonResponse = await response.json();
    finalResult += jsonResponse.choices[0].message.content;
  }

  return finalResult;
}

function createAiSuggestionPopup(aiText) {
  const popupWrapper = document.createElement("div");
  popupWrapper.setAttribute(
    "style",
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 1000; background-color: rgba(0, 0, 0, 0.5); opacity: 0; transition: opacity 0.3s;"
  );
  setTimeout(() => {
    popupWrapper.style.opacity = "1";
  }, 0);

  const loader = document.createElement("div");
  loader.setAttribute(
    "style",
    "border: 4px solid #f3f3f3; border-top: 4px solid #63e7da; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite;"
  );
  popupWrapper.appendChild(loader);

  setTimeout(() => {
    loader.remove();

    const popupContent = document.createElement("div");
    popupContent.setAttribute(
      "style",
      "background-color: white; padding: 20px; border-radius: 5px; width: 80%; min-width: 500px; max-height:700px ;text-align: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.3s;"
    );
    popupContent.textContent = aiText;
    popupWrapper.appendChild(popupContent);

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy Text";
    copyButton.setAttribute(
      "style",
      "background-color: #63e7da; border: none; outline: none; cursor: pointer; padding: 10px 15px; font-size: 14px; color: white; border-radius: 3px; margin-top: 15px; transition: all 0.3s ease;"
    );
    copyButton.addEventListener("mouseover", () => {
      copyButton.style.transform = "scale(1.05)";
      copyButton.style.backgroundColor = "#68f1d9";
    });
    copyButton.addEventListener("mouseout", () => {
      copyButton.style.transform = "scale(1)";
      copyButton.style.backgroundColor = "#63e7da";
    });
    copyButton.addEventListener("click", () => {
      const textArea = document.createElement("textarea");
      textArea.value = aiText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();

      popupWrapper.style.opacity = "0";
      setTimeout(() => {
        popupWrapper.remove();
      }, 300);
    });

    popupWrapper.appendChild(copyButton);
  }, 2000);

  popupWrapper.addEventListener("click", (e) => {
    if (e.target === popupWrapper) {
      popupWrapper.style.opacity = "0";
      setTimeout(() => {
        popupWrapper.remove();
      }, 300);
    }
  });

  return popupWrapper;
}

function handleSearch(event) {
  const query = event.target.value.toLowerCase();
  filterAccordionItems(query);
}
function createAccordionItem(pageContent) {
  const pageText = extractTextFromHtml(pageContent.text);
  const accordionItem = document.createElement("div");
  accordionItem.setAttribute("style", "margin-bottom: 10px;");
  accordionItem.classList.add("accordion-item"); // Add the "accordion-item" class

  const accordionHeader = document.createElement("button");
  accordionHeader.setAttribute(
    "style",
    "width: 100%; text-align: left; background-color: #f9f9f9; border: none; outline: none; cursor: pointer; padding: 18px 10px; font-size: 18px; font-weight: 600; color: #333; border-radius : 10px ; text-align:center; color: white; font-size: 1.1rem; background-image: linear-gradient(135deg, #68f1d947 0%, #63e7da94 100%); transition: 0.3s;"
  );
  accordionHeader.innerHTML = pageContent.title;
  accordionHeader.addEventListener("click", async (e) => {
    e.preventDefault();
    handleClick(pageContent.url, pageContent.text, pageContent.id);
  });

  accordionHeader.addEventListener("mouseover", () => {
    accordionHeader.style.transform = "scale(1.05)";
  });

  accordionHeader.addEventListener("mouseout", () => {
    accordionHeader.style.transform = "scale(1)";
  });
  return countGrammarMistakes(pageText).then((mistakeCount) => {
    const circleElement = document.createElement("div");
    circleElement.innerHTML = mistakeCount;
    circleElement.classList.add("circle-number");
    circleElement.setAttribute(
      "style",
      "position: absolute; background-color: #d91837; width: 30px; height: 30px; line-height: 30px; border-radius: 50%; text-align: center; font-size: 16px; font-weight: 600; color: white; top: 10px; right: 10px;"
    );
    accordionHeader.appendChild(circleElement);
    const accordionLink = document.createElement("a");
    accordionLink.setAttribute("style", "text-decoration: none; color: #333;");
    accordionLink.setAttribute("href", pageContent.url);
    accordionLink.setAttribute("target", "_blank");
    accordionLink.appendChild(accordionHeader);

    accordionItem.appendChild(accordionLink);
    return { accordionItem, mistakeCount };
  });
}
function createSearchInput() {
  const searchInput = document.createElement("input");
  searchInput.setAttribute("type", "text");
  searchInput.setAttribute("placeholder", "Search...");
  searchInput.setAttribute(
    "style",
    "text-align: center ; display: block; width: 100%; margin-bottom: 20px; padding: 10px 5px; font-size: 16px; border-radius: 8px; border: 1px solid #ccc;  transition: 0.3s;"
  );
  searchInput.setAttribute("id", "search-input");
  searchInput.addEventListener("input", handleSearch);

  searchInput.addEventListener("focus", () => {
    searchInput.style.outline = "none";
    searchInput.style.boxShadow = "0 0 0 2px rgba(99, 231, 218, 0.5)";
  });

  searchInput.addEventListener("blur", () => {
    searchInput.style.boxShadow = "none";
  });

  return searchInput;
}

function createOverlayLoaderAccordion(siteUrl) {
  const overlay = document.createElement("div");
  overlay.setAttribute("class", "overlay");
  overlay.style.display = "block";
  document.body.appendChild(overlay);

  const loader = document.createElement("div");
  loader.setAttribute("class", "loader");
  loader.style.display = "block";
  overlay.appendChild(loader);

  const accordion = document.createElement("div");
  accordion.setAttribute("class", "accordion");
  const searchInput = createSearchInput();
  searchInput.style.zIndex = "10001"; // Set a higher z-index value for the search input

  accordion.appendChild(searchInput);
  overlay.appendChild(accordion);

  const loadMoreButton = document.createElement("button");
  loadMoreButton.innerHTML = "Load More";
  loadMoreButton.setAttribute(
    "style",
    "display: block; width: 20%; margin: 20px auto; background-color: #63e7da; color: white; border: none; outline: none; cursor: pointer; padding: 15px 10px; font-size: 16px; font-weight: 600; border-radius: 8px; transition: 0.3s;"
  );
  loadMoreButton.classList.add("opacity0");
  loadMoreButton.addEventListener("click", () => {
    fetchWordPressContent(siteUrl);
  });

  loadMoreButton.addEventListener("mouseover", () => {
    loadMoreButton.style.transform = "scale(1.05)";
    loadMoreButton.style.backgroundColor = "#68f1d9";
  });

  loadMoreButton.addEventListener("mouseout", () => {
    loadMoreButton.style.transform = "scale(1)";
    loadMoreButton.style.backgroundColor = "#63e7da";
  });

  overlay.appendChild(loadMoreButton);
}

function sortAccordionItems(accordionItemsArray, mistakesCounts) {
  const accordion = document.querySelector(".accordion");

  const searchInput = document.querySelector("#search-input"); // Select the search input using the ID

  const sortedItems = accordionItemsArray
    .map((item, index) => ({ item, count: mistakesCounts[index] }))
    .sort((a, b) => b.count - a.count)
    .map((sortedItem) => sortedItem.item);

  accordion.innerHTML = ""; // Clear the existing accordion items

  accordion.appendChild(searchInput); // Re-append the search input to the accordion

  // Append the sorted accordion items
  for (const item of sortedItems) {
    accordion.appendChild(item);
  }
}

async function fetchWordPressContent(siteUrl) {
  const botInput = JSON.parse(localStorage.getItem("prompts"));
  if (botInput.botNumber < 1) {
    botInput.botNumber = 10;
  }
  const pagesApiUrl = `${siteUrl}/wp-json/wp/v2/pages?_fields=id,title,link,content&per_page=${botInput.botNumber}&page=${currentPage}`;
  const postsApiUrl = `${siteUrl}/wp-json/wp/v2/posts?_fields=id,title,link,content&per_page=${botInput.botNumber}&page=${currentPage}`;

  let overlay = document.querySelector(".overlay");
  let loader = document.querySelector(".loader");
  let accordion = document.querySelector(".accordion");
  let loadMoreButton = document.querySelector("button");

  if (!overlay || !loader || !accordion || !loadMoreButton) {
    createOverlayLoaderAccordion(siteUrl);
    overlay = document.querySelector(".overlay");
    loader = document.querySelector(".loader");
    accordion = document.querySelector(".accordion");
    loadMoreButton = document.querySelector("button");
  } else {
    loader.style.display = "block";
    loadMoreButton.style.display = "none";
  }
  const accordionItemsArray = [];
  const mistakesCounts = [];

  accordion.style.display = "none";

  try {
    const [pagesResponse, postsResponse] = await Promise.all([
      fetch(pagesApiUrl),
      fetch(postsApiUrl),
    ]);
    const pages = await pagesResponse.json();
    const posts = await postsResponse.json();
    const combinedContent = [...pages, ...posts];

    const promises = combinedContent.map(async (content) => {
      if (content.content.rendered.trim() === "") {
        return;
      }

      const contentData = {
        id: content.id,
        url: content.link,
        title: content.title.rendered,
        text: content.content.rendered,
      };

      const { accordionItem, mistakeCount } = await createAccordionItem(
        contentData
      );
      accordionItemsArray.push(accordionItem);
      mistakesCounts.push(mistakeCount);
    });

    await Promise.all(promises);

    currentPage++;

    loader.style.display = "none";
    accordion.style.display = "block";
    loadMoreButton.style.display = "block";
    const opacity0Element = document.querySelector(".opacity0");
    if (opacity0Element) {
      opacity0Element.classList.remove("opacity0");
    }
    sortAccordionItems(accordionItemsArray, mistakesCounts);
  } catch (error) {
    console.log("Error fetching content:", error);
    console.log(currentPage);
    loader.style.display = "none";
    loadMoreButton.style.display = "block";
  }
}

function filterAccordionItems(query) {
  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const title = item.querySelector("a").innerText.toLowerCase();
    if (title.includes(query)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Add spinning loader and overlay CSS
const css = `
.overlay {
display: block;
position: fixed;
left: 0;
top: 0;
width: 100%;
height: 100%;
background-color: #fff8f8d1;
z-index: 100;
}

.loader {
display: block;
border: 8px solid #f3f3f3;
border-radius: 50%;
border-top: 8px solid #63e7da;
width: 60px;
height: 60px;
animation: spin 2s linear infinite;
position: absolute;
left: 50%;
top: 50%;
transform: translate(-50%, -50%);
}

.accordion {
width: 50%;
margin: 50px auto;
    overflow-y: scroll;
    max-height:70%;
    overflow-x:hidden;
background-color: white;
padding: 40px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
backdrop-filter: blur(10px);
border-radius: 10px;
}

@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}
/* Set the width and color of the scrollbar */
::-webkit-scrollbar {
  width: 2px;
  height: auto;
  background-color: rgb(99, 231, 218);
}

/* Customize the scrollbar track */
::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

/* Customize the scrollbar thumb */
::-webkit-scrollbar-thumb {
  background-color: rgb(99, 231, 218);
  border-radius: 10px;
}

/* Customize the scrollbar thumb on hover */
::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}
/* Customize the color of the text highlight */
::selection {
  background-color: rgb(99, 231, 218); /* Blue color */
  color: #fff;
}
html {
  scroll-behavior: smooth;
}
html {
  scroll-behavior: smooth;
  scroll-snap-type: y mandatory;
  scroll-snap-points-y: repeat(10%);
}
div[contenteditable]:focus {
  padding : 10px 20px;
  border-radius : 8px;
  outline: 3px solid rgb(99, 231, 218);
}

`;

// Add spinning loader and overlay style
const style = document.createElement("style");
style.innerHTML = css;
document.head.appendChild(style);

// Usage
