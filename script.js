/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");
const searchInput = document.getElementById("searchInput");

const WORKER_URL = "https://dark-cherry-630d.ericken.workers.dev";
const systemPrompt = `
You are a friendly L'Oréal Beauty Assistant who specializes in creating personalized routines based on the L'Oréal products the user likes or provides. You can help with skincare, haircare, makeup, fragrance, and other beauty-related topics.

Use the product information sent to you to build clear, helpful routines and explain how the products work together. After creating a routine, users may ask follow-up questions. Only answer questions related to the routine or to beauty topics such as skincare, haircare, makeup, fragrance, and product ingredients.

If a user asks something outside beauty or unrelated to the ongoing routine, politely respond that you do not know. Keep your tone warm, supportive, and aligned with the L'Oréal brand.
`;

/* Array to store selected products */
let selectedProducts = [];

/* Store all products globally for modal access */
let allProducts = [];

/* Store current filter state */
let currentCategory = "";
let currentSearchTerm = "";

/* Store conversation history for context */
let conversationHistory = [
  {
    role: "system",
    content: systemPrompt,
  },
];

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  /* Get saved product IDs from localStorage */
  const savedProductIds = localStorage.getItem("selectedProductIds");

  if (savedProductIds) {
    try {
      /* Parse the JSON string back to an array */
      const productIds = JSON.parse(savedProductIds);

      /* Load all products and filter to get selected ones */
      loadProducts().then((products) => {
        allProducts = products;
        /* Find products that match the saved IDs */
        selectedProducts = products.filter((product) =>
          productIds.includes(product.id)
        );

        /* Display the selected products */
        displaySelectedProducts();
      });
    } catch (error) {
      console.error("Error loading selected products:", error);
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  /* Extract just the product IDs */
  const productIds = selectedProducts.map((product) => product.id);

  /* Save to localStorage as a JSON string */
  localStorage.setItem("selectedProductIds", JSON.stringify(productIds));
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load saved selections when page loads */
loadSelectedProductsFromStorage();

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card-content">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
      <button class="about-btn" data-product-id="${product.id}">About</button>
    </div>
  `
    )
    .join("");

  /* Add click event listeners to product cards (not About buttons) */
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    /* Click on card itself (excluding About button) */
    card.addEventListener("click", (e) => {
      /* Don't trigger if clicking the About button */
      if (!e.target.closest(".about-btn")) {
        handleProductClick(card, products);
      }
    });
  });

  /* Add click event listeners to About buttons */
  const aboutButtons = document.querySelectorAll(".about-btn");
  aboutButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      /* Stop event from bubbling to card click handler */
      e.stopPropagation();
      const productId = parseInt(button.dataset.productId);
      openProductModal(productId);
    });
  });

  /* Restore selected state for previously selected products */
  updateProductCardStates();
}

/* Handle clicking on a product card */
function handleProductClick(card, products) {
  const productId = parseInt(card.dataset.productId);

  /* Find if product is already selected */
  const existingIndex = selectedProducts.findIndex((p) => p.id === productId);

  if (existingIndex >= 0) {
    /* Remove product if already selected */
    selectedProducts.splice(existingIndex, 1);
    card.classList.remove("selected");
  } else {
    /* Add product to selection */
    const product = products.find((p) => p.id === productId);
    selectedProducts.push(product);
    card.classList.add("selected");
  }

  /* Update the selected products display */
  displaySelectedProducts();

  /* Save to localStorage */
  saveSelectedProductsToStorage();
}

/* Update the visual state of product cards based on selection */
function updateProductCardStates() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some((p) => p.id === productId);
    if (isSelected) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Display selected products as tags */
function displaySelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p style="color: #666;">No products selected yet</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
    <div class="selected-product-tag">
      <span>${product.name}</span>
      <button onclick="removeProduct(${product.id})" aria-label="Remove ${product.name}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `
    )
    .join("");
}

/* Remove a product from selection */
function removeProduct(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  displaySelectedProducts();
  updateProductCardStates();

  /* Save updated selection to localStorage */
  saveSelectedProductsToStorage();
}

/* Open modal with product details */
function openProductModal(productId) {
  /* Find the product by ID */
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  /* Create modal HTML */
  const modalHTML = `
    <div class="modal-overlay active" id="productModal">
      <div class="modal-content">
        <button class="modal-close" onclick="closeProductModal()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <img src="${product.image}" alt="${product.name}" class="modal-product-image">
        <div class="modal-product-brand">${product.brand}</div>
        <h2 class="modal-product-name">${product.name}</h2>
        <span class="modal-product-category">${product.category}</span>
        <p class="modal-product-description">${product.description}</p>
      </div>
    </div>
  `;

  /* Add modal to page */
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  /* Close modal when clicking outside content */
  const modalOverlay = document.getElementById("productModal");
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeProductModal();
    }
  });
}

/* Close and remove modal */
function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.remove();
  }
}

/* Send message to OpenAI API via Cloudflare Worker */
async function sendToOpenAI(messages) {
  try {
    /* Make request to Cloudflare Worker */
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    /* Check if we got a valid response */
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("Invalid response from API");
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

/* Display a message in the chat window */
function displayMessage(content, role) {
  const messageDiv = document.createElement("div");
  messageDiv.style.marginBottom = "16px";
  messageDiv.style.padding = "12px";
  messageDiv.style.borderRadius = "8px";

  if (role === "user") {
    /* User messages - right aligned with dark background */
    messageDiv.style.backgroundColor = "#000";
    messageDiv.style.color = "#fff";
    messageDiv.style.marginLeft = "20%";
    messageDiv.style.textAlign = "right";
  } else {
    /* Assistant messages - left aligned with light background */
    messageDiv.style.backgroundColor = "#f0f0f0";
    messageDiv.style.color = "#333";
    messageDiv.style.marginRight = "20%";
  }

  messageDiv.textContent = content;
  chatWindow.appendChild(messageDiv);

  /* Scroll to bottom of chat */
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Generate routine from selected products */
async function generateRoutine() {
  /* Check if any products are selected */
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <p style="color: #666; text-align: center; padding: 40px;">
        Please select at least one product to generate a routine.
      </p>
    `;
    return;
  }

  /* Clear chat window and show loading message */
  chatWindow.innerHTML = "";
  displayMessage("Generating your personalized routine...", "assistant");

  /* Build product information string */
  const productsInfo = selectedProducts
    .map((product) => {
      return `Product: ${product.name}\nBrand: ${product.brand}\nCategory: ${product.category}\nDescription: ${product.description}`;
    })
    .join("\n\n");

  /* Create user message with product information */
  const userMessage = `I have selected the following products. Please create a personalized beauty routine for me:\n\n${productsInfo}`;

  /* Add user message to conversation history */
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  /* Get response from OpenAI */
  const assistantResponse = await sendToOpenAI(conversationHistory);

  /* Add assistant response to conversation history */
  conversationHistory.push({
    role: "assistant",
    content: assistantResponse,
  });

  /* Clear loading message and display the routine */
  chatWindow.innerHTML = "";
  displayMessage(userMessage, "user");
  displayMessage(assistantResponse, "assistant");

  /* Enable the chat input for follow-up questions */
  userInput.placeholder = "Ask a follow-up question...";
}

/* Handle follow-up questions in the chat */
async function handleChatSubmit(e) {
  e.preventDefault();

  const message = userInput.value.trim();

  /* Check if message is empty */
  if (!message) return;

  /* Check if a routine has been generated */
  if (conversationHistory.length === 1) {
    displayMessage(
      "Please generate a routine first by selecting products and clicking 'Generate Routine'.",
      "assistant"
    );
    return;
  }

  /* Display user message */
  displayMessage(message, "user");

  /* Clear input field */
  userInput.value = "";

  /* Add user message to conversation history */
  conversationHistory.push({
    role: "user",
    content: message,
  });

  /* Show loading indicator */
  const loadingDiv = document.createElement("div");
  loadingDiv.style.color = "#666";
  loadingDiv.style.fontStyle = "italic";
  loadingDiv.textContent = "Thinking...";
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  /* Get response from OpenAI */
  const assistantResponse = await sendToOpenAI(conversationHistory);

  /* Remove loading indicator */
  loadingDiv.remove();

  /* Add assistant response to conversation history */
  conversationHistory.push({
    role: "assistant",
    content: assistantResponse,
  });

  /* Display assistant response */
  displayMessage(assistantResponse, "assistant");
}

/* Filter products based on category and search term */
function filterProducts(products, category, searchTerm) {
  let filtered = products;

  /* Filter by category if one is selected */
  if (category) {
    filtered = filtered.filter((product) => product.category === category);
  }

  /* Filter by search term if user typed something */
  if (searchTerm) {
    /* Convert search term to lowercase for case-insensitive matching */
    const searchLower = searchTerm.toLowerCase();

    filtered = filtered.filter((product) => {
      /* Check if search term matches product name, brand, or description */
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    });
  }

  return filtered;
}

/* Update product display based on current filters */
async function updateProductDisplay() {
  /* Load all products */
  const products = await loadProducts();
  allProducts = products;

  /* Apply both category and search filters */
  const filteredProducts = filterProducts(
    products,
    currentCategory,
    currentSearchTerm
  );

  /* Check if any products match the filters */
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found matching your search.
      </div>
    `;
  } else {
    /* Display the filtered products */
    displayProducts(filteredProducts);
  }
}

/* Add event listener for Generate Routine button */
generateRoutineBtn.addEventListener("click", generateRoutine);

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  /* Update current category */
  currentCategory = e.target.value;

  /* Update the display with both filters */
  updateProductDisplay();
});

/* Filter products as user types in search field */
searchInput.addEventListener("input", (e) => {
  /* Update current search term */
  currentSearchTerm = e.target.value.trim();

  /* Only search if a category is selected or search has content */
  if (currentCategory || currentSearchTerm) {
    updateProductDisplay();
  } else {
    /* Show placeholder if nothing is selected */
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category or search for products
      </div>
    `;
  }
});

/* Chat form submission handler - now handles follow-up questions */
chatForm.addEventListener("submit", handleChatSubmit);
