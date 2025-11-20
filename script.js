/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");

/* Array to store selected products */
let selectedProducts = [];

/* Store all products globally for modal access */
let allProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

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

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  /* Store products globally for modal access */
  allProducts = products;
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
