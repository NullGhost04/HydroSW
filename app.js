(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page;
  let selectedVariant = HYDROSEAL.variants[0].id;
  let selectedQty = 1;
  let selectedRating = 0;
  let toastTimer;

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function setMessage(el, message, kind = "error") {
    if (!el) return;
    el.textContent = message;
    el.className = "form-message " + kind;
  }
  function updateHeader() {
    const count = Store.cart().reduce((sum, item) => sum + item.qty, 0);
    $$(".cart-count").forEach(el => el.textContent = count);
    const user = Store.currentUser();
    $$("[data-account-link]").forEach(el => {
      el.href = user ? "account.html" : "auth.html";
      el.innerHTML = user ? `Hi, ${escapeHTML(user.name.split(" ")[0])} <span>↗</span>` : 'Sign in <span>↗</span>';
    });
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }
  function toggleMenu() { $("#mainNav")?.classList.toggle("nav-open"); }
  window.toggleMenu = toggleMenu;

  function getUserCart() { return Store.cart().filter(i => i.userId === (Store.currentUser()?.id || "guest")); }
  function saveUserCart(items) {
    const userId = Store.currentUser()?.id || "guest";
    const all = Store.cart().filter(i => i.userId !== userId);
    Store.saveCart([...all, ...items.map(i => ({ ...i, userId }))]);
  
  // HydroSeal Gel educational simulator and optional AI assistant.
  function initHydroSealLab() {
    const simulator = $("#leakSimulatorForm");
    const result = $("#simulationResult");
    const assistantForm = $("#assistantForm");
    const messages = $("#assistantMessages");
    const status = $("#assistantStatus");
    if (!simulator && !assistantForm) return;

    const scenarios = {
      hairline: {
        title: "Small crack: inspect and prepare carefully",
        safe: true,
        summary: "A small hairline crack may be a candidate for a suitable crack-sealing product, but the cause, moisture conditions, and product compatibility must be checked first.",
        steps: ["Inspect the crack and surrounding surface; note whether it is growing or returning.", "Remove loose material and prepare the surface only as directed by the verified product label.", "Confirm HydroSeal Gel is approved for this exact surface and moisture condition before application.", "Follow the label for application, curing, ventilation, and protective equipment."]
      },
      damp: {
        title: "Damp patch: identify the moisture source",
        safe: true,
        summary: "A damp mark does not always mean water is entering through a crack. The source could be plumbing, condensation, roof drainage, or water moving through the wall.",
        steps: ["Check whether the patch changes after rain or plumbing use.", "Look for nearby pipes, roof leaks, exterior drainage issues, and condensation.", "Do not seal over an unidentified source; confirm product suitability and follow the label if a crack is confirmed."]
      },
      seepage: {
        title: "Active seepage: get an on-site assessment",
        safe: false,
        summary: "Water actively passing through concrete can indicate water pressure or a more serious moisture pathway. This simple simulator cannot determine the cause or confirm HydroSeal Gel is suitable.",
        steps: ["Keep people away from electrical hazards and slippery areas.", "If safe, note when the water appears and whether the flow increases after rain.", "Ask a qualified professional to assess the source and recommend a compatible repair system before applying any product."]
      },
      wide: {
        title: "Wide or growing crack: prioritize professional inspection",
        safe: false,
        summary: "A wide, stepped, or widening crack can be associated with movement or structural issues. Do not rely on a gel sealant to address a potentially structural problem.",
        steps: ["Do not treat the crack as a cosmetic leak until it has been assessed.", "Seek a qualified building professional or structural engineer, especially if there is movement, sagging, or new cracking.", "Use HydroSeal Gel only if the assessment and official product instructions confirm it is appropriate."]
      }
    };
    const severityText = {
      low: "Reported severity: low. Monitor whether the condition changes.",
      moderate: "Reported severity: moderate. Check the source and document when moisture returns.",
      high: "Reported severity: high. Do not rely on this automated result; seek an on-site assessment."
    };
    const materialText = {
      concrete: "Surface selected: concrete. Confirm that the actual surface and condition match the HydroSeal Gel label.",
      masonry: "Surface selected: masonry/cement render. Compatibility must be confirmed; suitability for concrete does not automatically prove suitability for every masonry surface.",
      other: "Surface selected: other/unknown. Identify the substrate and check compatibility before using any repair product."
    };

    simulator?.addEventListener("submit", event => {
      event.preventDefault();
      const type = $("#leakType").value;
      const severity = $("#leakSeverity").value;
      const material = $("#leakMaterial").value;
      const scenario = scenarios[type] || scenarios.hairline;
      const caution = !scenario.safe || severity === "high" || material === "other";
      result.replaceChildren();
      const tag = document.createElement("span");
      tag.className = "result-tag" + (caution ? " caution" : "");
      tag.textContent = caution ? "CAUTION · NOT A PERFORMANCE PREDICTION" : "GUIDED EDUCATIONAL RESULT";
      const heading = document.createElement("h4");
      heading.textContent = scenario.title;
      const summary = document.createElement("p");
      summary.textContent = scenario.summary;
      const severityNote = document.createElement("p");
      severityNote.textContent = severityText[severity] + " " + materialText[material];
      const list = document.createElement("ul");
      scenario.steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
      });
      result.append(tag, heading, summary, severityNote, list);
    });

    function addMessage(kind, title, text) {
      const message = document.createElement("div");
      message.className = "assistant-message " + (kind === "user" ? "assistant-user" : "assistant-reply");
      const strong = document.createElement("b");
      strong.textContent = title;
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      message.append(strong, paragraph);
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
      return message;
    }

    function localGuideAnswer(question) {
      const q = question.toLowerCase();
      if (/refund|return|cancel|payment|credit card|debit card|order/.test(q)) {
        return "I can explain HydroSeal Gel, but I cannot access orders, process payments, or issue refunds from this product assistant. Use the website's order-support process for purchases. For live payments, only a verified payment provider can confirm or return funds.";
      }
      if (/apply|application|use|how to/.test(q)) {
        return "Before applying HydroSeal Gel, check the official product label for approved surfaces, surface preparation, application method, curing time, and safety precautions. I don't have verified manufacturer instructions in this demo, so I shouldn't invent exact application steps. If water is actively flowing or the crack is widening, get an on-site assessment first.";
      }
      if (/price|cost|size|500|750|1l|2l|5l|pack/.test(q)) {
        return "This website shows sample HydroSeal Gel package sizes and prices for the student demo. Please confirm the real product sizes, prices, stock, and delivery charges with the project owner before treating them as official.";
      }
      if (/safe|toxic|skin|eye|child|pet|chemical/.test(q)) {
        return "Please consult the actual HydroSeal Gel label and safety data sheet for protective equipment, ventilation, first aid, storage, and exposure guidance. I don't have verified safety documentation available here, so I can't confirm specific safety claims.";
      }
      if (/crack|leak|water|damp|moist|concrete|wall|seep/.test(q)) {
        return "Start by identifying where the moisture comes from and whether the crack is stable. Small, stable surface cracks may need a compatible repair product, but active seepage, recurring dampness, wide or growing cracks, or signs of movement should be assessed on site. HydroSeal Gel should only be used when the official label confirms it suits the surface and condition. What type of surface is affected, and does water actively flow through it?";
      }
      return "I can help with general HydroSeal Gel product questions and moisture-troubleshooting steps. Tell me the surface material, what you observe (crack, damp patch, or active seepage), and whether it changes after rain. I will keep recommendations cautious because this demo does not have verified product testing or manufacturer instructions.";
    }

    async function askAssistant(question, replyNode) {
      const original = replyNode.querySelector("p");
      original.textContent = "Thinking…";
      try {
        if (window.HydroSealGemini?.hasKey()) {
          original.textContent = await window.HydroSealGemini.askQuestion(question);
          if (status) {
            status.classList.add("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Live Gemini response';
          }
        } else {
          original.textContent = localGuideAnswer(question);
          if (status) {
            status.classList.remove("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Local guide mode · no key or installation needed';
          }
        }
      } catch {
        original.textContent = localGuideAnswer(question);
        if (status) {
          status.classList.remove("ai-connected");
          status.innerHTML = '<span class="status-dot"></span> Local guide mode · live AI unavailable';
        }
      }
      messages.scrollTop = messages.scrollHeight;
    }

    assistantForm?.addEventListener("submit", async event => {
      event.preventDefault();
      const input = $("#assistantQuestion");
      const question = input.value.trim();
      if (!question) return;
      if (question.length > 1000) return;
      addMessage("user", "You", question);
      input.value = "";
      const reply = addMessage("assistant", "HydroSeal guide", "Thinking…");
      const button = assistantForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try { await askAssistant(question, reply); }
      finally { if (button) button.disabled = false; input.focus(); }
    });
  }

  updateHeader();
  }
  function addToCart(variantId, qty = 1) {
    const variant = getVariant(variantId);
    if (!variant) return false;
    const items = getUserCart();
    const existing = items.find(i => i.variantId === variantId);
    const nextQty = (existing?.qty || 0) + qty;
    if (nextQty > variant.stock) { showToast(`Only ${variant.stock} demo units are available for ${variant.size}.`); return false; }
    if (existing) existing.qty = nextQty;
    else items.push({ variantId, qty });
    saveUserCart(items);
    return true;
  }
  function addWishlist(variantId) {
    const user = Store.currentUser();
    if (!user) { location.href = "auth.html?next=wishlist"; return; }
    const list = Store.wishlist();
    if (list.some(x => x.userId === user.id && x.variantId === variantId)) {
      showToast("That size is already in your wishlist."); return;
    }
    list.push({ userId: user.id, variantId, createdAt: new Date().toISOString() });
    Store.saveWishlist(list);
    showToast("Saved to your wishlist.");
    renderHomeReviewStats();
  }
  function renderVariants() {
    const holder = $("#variantOptions");
    if (!holder) return;
    holder.innerHTML = HYDROSEAL.variants.map(v => `<button type="button" class="variant-option ${v.id === selectedVariant ? "selected" : ""}" data-variant="${v.id}" aria-pressed="${v.id === selectedVariant}"><img class="variant-photo" src="${escapeHTML(v.image)}" alt="HydroSeal ${escapeHTML(v.size)} package"><span class="variant-info"><b>${escapeHTML(v.size)}</b><small>${escapeHTML(v.note)}</small></span><strong>${money(v.price)}</strong></button>`).join("");
    holder.addEventListener("click", event => {
      const button = event.target.closest("[data-variant]");
      if (!button) return;
      selectedVariant = button.dataset.variant;
      $$(".variant-option", holder).forEach(el => {
        const active = el.dataset.variant === selectedVariant;
        el.classList.toggle("selected", active);
        el.setAttribute("aria-pressed", String(active));
      });
      updateSelectedPrice();
    });
    updateSelectedPrice();
  }
  function updateSelectedPrice() {
    const v = getVariant(selectedVariant);
    if ($("#selectedPrice")) $("#selectedPrice").textContent = money(v.price * selectedQty);
    if (v && $("#selectedProductImage")) {
      $("#selectedProductImage").src = v.image;
      $("#selectedProductImage").alt = `HydroSeal Gel ${v.size} package`;
    }
    if (v && $("#selectedProductCaption")) $("#selectedProductCaption").textContent = `HYDROSEAL GEL · ${v.size}`;
    if ($("#selectedQty")) $("#selectedQty").textContent = selectedQty;
  }
  function renderHomeReviewStats() {
    const reviews = Store.reviews();
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
    if ($("#averageRating")) $("#averageRating").textContent = avg;
    if ($("#reviewCount")) $("#reviewCount").textContent = reviews.length;
    const holder = $("#homeReviews");
    if (!holder) return;
    if (!reviews.length) {
      holder.innerHTML = `<div class="review-empty"><span>✳</span><h3>Your feedback belongs here.</h3><p>Complete a demo order, mark it delivered in your account, and share a review.</p></div>`;
      return;
    }
    holder.innerHTML = reviews.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,3).map(r => {
      const user = Store.users().find(u => u.id === r.userId);
      return `<article class="review-card"><div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>“${escapeHTML(r.text)}”</p><div class="review-author"><span class="review-avatar">${escapeHTML((user?.name || "C")[0].toUpperCase())}</span><div><b>${escapeHTML(user?.name || "Demo customer")}</b><small>Verified demo purchase</small></div></div></article>`;
    }).join("");
  }
  function initHome() {
    renderVariants();
    renderHomeReviewStats();
    $("#qtyMinus")?.addEventListener("click", () => { selectedQty = Math.max(1, selectedQty - 1); updateSelectedPrice(); });
    $("#qtyPlus")?.addEventListener("click", () => { selectedQty = Math.min(getVariant(selectedVariant).stock, selectedQty + 1); updateSelectedPrice(); });
    $("#addToCart")?.addEventListener("click", () => {
      if (addToCart(selectedVariant, selectedQty)) showToast(`${getVariant(selectedVariant).size} added to your bag.`);
    });
    $("#addWishlist")?.addEventListener("click", () => addWishlist(selectedVariant));
  }

  function initAuth() {
    const loginForm = $("#loginForm"), registerForm = $("#registerForm");
    const tabs = $$("[data-auth-tab]");
    function showTab(name) {
      const login = name === "login";
      loginForm?.classList.toggle("hidden", !login);
      registerForm?.classList.toggle("hidden", login);
      tabs.forEach(t => t.classList.toggle("active", t.dataset.authTab === name));
    }
    tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.authTab)));
    if (new URLSearchParams(location.search).get("mode") === "register") showTab("register");
    loginForm?.addEventListener("submit", event => {
      event.preventDefault();
      const email = $("#loginEmail").value.trim().toLowerCase();
      const password = $("#loginPassword").value;
      const user = Store.users().find(u => u.email === email && u.demoPassword === password);
      if (!user) { setMessage($("#loginMessage"), "We couldn't match that demo account. Check your details or create an account."); return; }
      Store.login(user.id);
      setMessage($("#loginMessage"), "Signed in! Taking you to your account…", "success");
    
  // HydroSeal Gel educational simulator and optional AI assistant.
  function initHydroSealLab() {
    const simulator = $("#leakSimulatorForm");
    const result = $("#simulationResult");
    const assistantForm = $("#assistantForm");
    const messages = $("#assistantMessages");
    const status = $("#assistantStatus");
    if (!simulator && !assistantForm) return;

    const scenarios = {
      hairline: {
        title: "Small crack: inspect and prepare carefully",
        safe: true,
        summary: "A small hairline crack may be a candidate for a suitable crack-sealing product, but the cause, moisture conditions, and product compatibility must be checked first.",
        steps: ["Inspect the crack and surrounding surface; note whether it is growing or returning.", "Remove loose material and prepare the surface only as directed by the verified product label.", "Confirm HydroSeal Gel is approved for this exact surface and moisture condition before application.", "Follow the label for application, curing, ventilation, and protective equipment."]
      },
      damp: {
        title: "Damp patch: identify the moisture source",
        safe: true,
        summary: "A damp mark does not always mean water is entering through a crack. The source could be plumbing, condensation, roof drainage, or water moving through the wall.",
        steps: ["Check whether the patch changes after rain or plumbing use.", "Look for nearby pipes, roof leaks, exterior drainage issues, and condensation.", "Do not seal over an unidentified source; confirm product suitability and follow the label if a crack is confirmed."]
      },
      seepage: {
        title: "Active seepage: get an on-site assessment",
        safe: false,
        summary: "Water actively passing through concrete can indicate water pressure or a more serious moisture pathway. This simple simulator cannot determine the cause or confirm HydroSeal Gel is suitable.",
        steps: ["Keep people away from electrical hazards and slippery areas.", "If safe, note when the water appears and whether the flow increases after rain.", "Ask a qualified professional to assess the source and recommend a compatible repair system before applying any product."]
      },
      wide: {
        title: "Wide or growing crack: prioritize professional inspection",
        safe: false,
        summary: "A wide, stepped, or widening crack can be associated with movement or structural issues. Do not rely on a gel sealant to address a potentially structural problem.",
        steps: ["Do not treat the crack as a cosmetic leak until it has been assessed.", "Seek a qualified building professional or structural engineer, especially if there is movement, sagging, or new cracking.", "Use HydroSeal Gel only if the assessment and official product instructions confirm it is appropriate."]
      }
    };
    const severityText = {
      low: "Reported severity: low. Monitor whether the condition changes.",
      moderate: "Reported severity: moderate. Check the source and document when moisture returns.",
      high: "Reported severity: high. Do not rely on this automated result; seek an on-site assessment."
    };
    const materialText = {
      concrete: "Surface selected: concrete. Confirm that the actual surface and condition match the HydroSeal Gel label.",
      masonry: "Surface selected: masonry/cement render. Compatibility must be confirmed; suitability for concrete does not automatically prove suitability for every masonry surface.",
      other: "Surface selected: other/unknown. Identify the substrate and check compatibility before using any repair product."
    };

    simulator?.addEventListener("submit", event => {
      event.preventDefault();
      const type = $("#leakType").value;
      const severity = $("#leakSeverity").value;
      const material = $("#leakMaterial").value;
      const scenario = scenarios[type] || scenarios.hairline;
      const caution = !scenario.safe || severity === "high" || material === "other";
      result.replaceChildren();
      const tag = document.createElement("span");
      tag.className = "result-tag" + (caution ? " caution" : "");
      tag.textContent = caution ? "CAUTION · NOT A PERFORMANCE PREDICTION" : "GUIDED EDUCATIONAL RESULT";
      const heading = document.createElement("h4");
      heading.textContent = scenario.title;
      const summary = document.createElement("p");
      summary.textContent = scenario.summary;
      const severityNote = document.createElement("p");
      severityNote.textContent = severityText[severity] + " " + materialText[material];
      const list = document.createElement("ul");
      scenario.steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
      });
      result.append(tag, heading, summary, severityNote, list);
    });

    function addMessage(kind, title, text) {
      const message = document.createElement("div");
      message.className = "assistant-message " + (kind === "user" ? "assistant-user" : "assistant-reply");
      const strong = document.createElement("b");
      strong.textContent = title;
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      message.append(strong, paragraph);
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
      return message;
    }

    function localGuideAnswer(question) {
      const q = question.toLowerCase();
      if (/refund|return|cancel|payment|credit card|debit card|order/.test(q)) {
        return "I can explain HydroSeal Gel, but I cannot access orders, process payments, or issue refunds from this product assistant. Use the website's order-support process for purchases. For live payments, only a verified payment provider can confirm or return funds.";
      }
      if (/apply|application|use|how to/.test(q)) {
        return "Before applying HydroSeal Gel, check the official product label for approved surfaces, surface preparation, application method, curing time, and safety precautions. I don't have verified manufacturer instructions in this demo, so I shouldn't invent exact application steps. If water is actively flowing or the crack is widening, get an on-site assessment first.";
      }
      if (/price|cost|size|500|750|1l|2l|5l|pack/.test(q)) {
        return "This website shows sample HydroSeal Gel package sizes and prices for the student demo. Please confirm the real product sizes, prices, stock, and delivery charges with the project owner before treating them as official.";
      }
      if (/safe|toxic|skin|eye|child|pet|chemical/.test(q)) {
        return "Please consult the actual HydroSeal Gel label and safety data sheet for protective equipment, ventilation, first aid, storage, and exposure guidance. I don't have verified safety documentation available here, so I can't confirm specific safety claims.";
      }
      if (/crack|leak|water|damp|moist|concrete|wall|seep/.test(q)) {
        return "Start by identifying where the moisture comes from and whether the crack is stable. Small, stable surface cracks may need a compatible repair product, but active seepage, recurring dampness, wide or growing cracks, or signs of movement should be assessed on site. HydroSeal Gel should only be used when the official label confirms it suits the surface and condition. What type of surface is affected, and does water actively flow through it?";
      }
      return "I can help with general HydroSeal Gel product questions and moisture-troubleshooting steps. Tell me the surface material, what you observe (crack, damp patch, or active seepage), and whether it changes after rain. I will keep recommendations cautious because this demo does not have verified product testing or manufacturer instructions.";
    }

    async function askAssistant(question, replyNode) {
      const original = replyNode.querySelector("p");
      original.textContent = "Thinking…";
      try {
        if (window.HydroSealGemini?.hasKey()) {
          original.textContent = await window.HydroSealGemini.askQuestion(question);
          if (status) {
            status.classList.add("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Live Gemini response';
          }
        } else {
          original.textContent = localGuideAnswer(question);
          if (status) {
            status.classList.remove("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Local guide mode · no key or installation needed';
          }
        }
      } catch {
        original.textContent = localGuideAnswer(question);
        if (status) {
          status.classList.remove("ai-connected");
          status.innerHTML = '<span class="status-dot"></span> Local guide mode · live AI unavailable';
        }
      }
      messages.scrollTop = messages.scrollHeight;
    }

    assistantForm?.addEventListener("submit", async event => {
      event.preventDefault();
      const input = $("#assistantQuestion");
      const question = input.value.trim();
      if (!question) return;
      if (question.length > 1000) return;
      addMessage("user", "You", question);
      input.value = "";
      const reply = addMessage("assistant", "HydroSeal guide", "Thinking…");
      const button = assistantForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try { await askAssistant(question, reply); }
      finally { if (button) button.disabled = false; input.focus(); }
    });
  }

  updateHeader();
      setTimeout(() => location.href = new URLSearchParams(location.search).get("next") === "wishlist" ? "account.html#wishlist" : "account.html", 450);
    });
    registerForm?.addEventListener("submit", event => {
      event.preventDefault();
      const name = $("#registerName").value.trim();
      const email = $("#registerEmail").value.trim().toLowerCase();
      const password = $("#registerPassword").value;
      const confirm = $("#registerConfirm").value;
      if (password !== confirm) return setMessage($("#registerMessage"), "The passwords don't match. Please try again.");
      if (password.length < 6) return setMessage($("#registerMessage"), "Use at least 6 characters for this demo password.");
      const users = Store.users();
      if (users.some(u => u.email === email)) return setMessage($("#registerMessage"), "An account with this email already exists in this browser.");
      const user = { id: "usr_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7), name, email, phone: "", createdAt: new Date().toISOString(), demoPassword: password };
      users.push(user);
      Store.saveUsers(users);
      Store.login(user.id);
      setMessage($("#registerMessage"), "Demo account created! Opening your account…", "success");
      setTimeout(() => location.href = "account.html", 500);
    });
  }

  function cartTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      const v = getVariant(item.variantId);
      return sum + (v ? v.price * item.qty : 0);
    }, 0);
    return { subtotal, delivery: subtotal > 0 ? HYDROSEAL.deliveryFee : 0, total: subtotal + (subtotal > 0 ? HYDROSEAL.deliveryFee : 0) };
  }
  function initCart() {
    const holder = $("#cartList");
    if (!holder) return;
    function render() {
      const items = getUserCart();
      if (!items.length) {
        holder.innerHTML = `<div class="empty-state"><div class="empty-icon">⌁</div><h2>Your bag is taking a breather.</h2><p>Choose a HydroSeal Gel size to start your order.</p><a class="button button-primary" href="index.html#shop">Explore sizes <span>↗</span></a></div>`;
      } else {
        holder.innerHTML = `<div class="cart-list-head"><span>PRODUCT</span><span>QUANTITY</span><span>TOTAL</span></div>` + items.map(item => {
          const v = getVariant(item.variantId);
          if (!v) return "";
          return `<article class="cart-item" data-cart-variant="${v.id}"><div class="cart-product"><div class="cart-product-art"><img src="${escapeHTML(v.image)}" alt="HydroSeal ${escapeHTML(v.size)} package"></div><div><b>HydroSeal Gel</b><small>${escapeHTML(v.size)} package</small><small>${money(v.price)} / unit</small><button class="remove-link" data-remove="${v.id}">Remove</button></div></div><div class="cart-qty"><div class="quantity-control"><button data-change="-1" data-id="${v.id}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-change="1" data-id="${v.id}" aria-label="Increase quantity">+</button></div></div><div class="cart-item-total">${money(v.price * item.qty)}</div></article>`;
        }).join("");
      }
      const totals = cartTotals(items);
      $("#cartItemCount").textContent = `${items.reduce((s,i)=>s+i.qty,0)} item${items.reduce((s,i)=>s+i.qty,0) === 1 ? "" : "s"}`;
      $("#cartSubtotal").textContent = money(totals.subtotal);
      $("#cartDelivery").textContent = money(totals.delivery);
      $("#cartTotal").textContent = money(totals.total);
      $("#checkoutButton").disabled = !items.length;
    
  // HydroSeal Gel educational simulator and optional AI assistant.
  function initHydroSealLab() {
    const simulator = $("#leakSimulatorForm");
    const result = $("#simulationResult");
    const assistantForm = $("#assistantForm");
    const messages = $("#assistantMessages");
    const status = $("#assistantStatus");
    if (!simulator && !assistantForm) return;

    const scenarios = {
      hairline: {
        title: "Small crack: inspect and prepare carefully",
        safe: true,
        summary: "A small hairline crack may be a candidate for a suitable crack-sealing product, but the cause, moisture conditions, and product compatibility must be checked first.",
        steps: ["Inspect the crack and surrounding surface; note whether it is growing or returning.", "Remove loose material and prepare the surface only as directed by the verified product label.", "Confirm HydroSeal Gel is approved for this exact surface and moisture condition before application.", "Follow the label for application, curing, ventilation, and protective equipment."]
      },
      damp: {
        title: "Damp patch: identify the moisture source",
        safe: true,
        summary: "A damp mark does not always mean water is entering through a crack. The source could be plumbing, condensation, roof drainage, or water moving through the wall.",
        steps: ["Check whether the patch changes after rain or plumbing use.", "Look for nearby pipes, roof leaks, exterior drainage issues, and condensation.", "Do not seal over an unidentified source; confirm product suitability and follow the label if a crack is confirmed."]
      },
      seepage: {
        title: "Active seepage: get an on-site assessment",
        safe: false,
        summary: "Water actively passing through concrete can indicate water pressure or a more serious moisture pathway. This simple simulator cannot determine the cause or confirm HydroSeal Gel is suitable.",
        steps: ["Keep people away from electrical hazards and slippery areas.", "If safe, note when the water appears and whether the flow increases after rain.", "Ask a qualified professional to assess the source and recommend a compatible repair system before applying any product."]
      },
      wide: {
        title: "Wide or growing crack: prioritize professional inspection",
        safe: false,
        summary: "A wide, stepped, or widening crack can be associated with movement or structural issues. Do not rely on a gel sealant to address a potentially structural problem.",
        steps: ["Do not treat the crack as a cosmetic leak until it has been assessed.", "Seek a qualified building professional or structural engineer, especially if there is movement, sagging, or new cracking.", "Use HydroSeal Gel only if the assessment and official product instructions confirm it is appropriate."]
      }
    };
    const severityText = {
      low: "Reported severity: low. Monitor whether the condition changes.",
      moderate: "Reported severity: moderate. Check the source and document when moisture returns.",
      high: "Reported severity: high. Do not rely on this automated result; seek an on-site assessment."
    };
    const materialText = {
      concrete: "Surface selected: concrete. Confirm that the actual surface and condition match the HydroSeal Gel label.",
      masonry: "Surface selected: masonry/cement render. Compatibility must be confirmed; suitability for concrete does not automatically prove suitability for every masonry surface.",
      other: "Surface selected: other/unknown. Identify the substrate and check compatibility before using any repair product."
    };

    simulator?.addEventListener("submit", event => {
      event.preventDefault();
      const type = $("#leakType").value;
      const severity = $("#leakSeverity").value;
      const material = $("#leakMaterial").value;
      const scenario = scenarios[type] || scenarios.hairline;
      const caution = !scenario.safe || severity === "high" || material === "other";
      result.replaceChildren();
      const tag = document.createElement("span");
      tag.className = "result-tag" + (caution ? " caution" : "");
      tag.textContent = caution ? "CAUTION · NOT A PERFORMANCE PREDICTION" : "GUIDED EDUCATIONAL RESULT";
      const heading = document.createElement("h4");
      heading.textContent = scenario.title;
      const summary = document.createElement("p");
      summary.textContent = scenario.summary;
      const severityNote = document.createElement("p");
      severityNote.textContent = severityText[severity] + " " + materialText[material];
      const list = document.createElement("ul");
      scenario.steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
      });
      result.append(tag, heading, summary, severityNote, list);
    });

    function addMessage(kind, title, text) {
      const message = document.createElement("div");
      message.className = "assistant-message " + (kind === "user" ? "assistant-user" : "assistant-reply");
      const strong = document.createElement("b");
      strong.textContent = title;
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      message.append(strong, paragraph);
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
      return message;
    }

    function localGuideAnswer(question) {
      const q = question.toLowerCase();
      if (/refund|return|cancel|payment|credit card|debit card|order/.test(q)) {
        return "I can explain HydroSeal Gel, but I cannot access orders, process payments, or issue refunds from this product assistant. Use the website's order-support process for purchases. For live payments, only a verified payment provider can confirm or return funds.";
      }
      if (/apply|application|use|how to/.test(q)) {
        return "Before applying HydroSeal Gel, check the official product label for approved surfaces, surface preparation, application method, curing time, and safety precautions. I don't have verified manufacturer instructions in this demo, so I shouldn't invent exact application steps. If water is actively flowing or the crack is widening, get an on-site assessment first.";
      }
      if (/price|cost|size|500|750|1l|2l|5l|pack/.test(q)) {
        return "This website shows sample HydroSeal Gel package sizes and prices for the student demo. Please confirm the real product sizes, prices, stock, and delivery charges with the project owner before treating them as official.";
      }
      if (/safe|toxic|skin|eye|child|pet|chemical/.test(q)) {
        return "Please consult the actual HydroSeal Gel label and safety data sheet for protective equipment, ventilation, first aid, storage, and exposure guidance. I don't have verified safety documentation available here, so I can't confirm specific safety claims.";
      }
      if (/crack|leak|water|damp|moist|concrete|wall|seep/.test(q)) {
        return "Start by identifying where the moisture comes from and whether the crack is stable. Small, stable surface cracks may need a compatible repair product, but active seepage, recurring dampness, wide or growing cracks, or signs of movement should be assessed on site. HydroSeal Gel should only be used when the official label confirms it suits the surface and condition. What type of surface is affected, and does water actively flow through it?";
      }
      return "I can help with general HydroSeal Gel product questions and moisture-troubleshooting steps. Tell me the surface material, what you observe (crack, damp patch, or active seepage), and whether it changes after rain. I will keep recommendations cautious because this demo does not have verified product testing or manufacturer instructions.";
    }

    async function askAssistant(question, replyNode) {
      const original = replyNode.querySelector("p");
      original.textContent = "Thinking…";
      try {
        if (window.HydroSealGemini?.hasKey()) {
          original.textContent = await window.HydroSealGemini.askQuestion(question);
          if (status) {
            status.classList.add("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Live Gemini response';
          }
        } else {
          original.textContent = localGuideAnswer(question);
          if (status) {
            status.classList.remove("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Local guide mode · no key or installation needed';
          }
        }
      } catch {
        original.textContent = localGuideAnswer(question);
        if (status) {
          status.classList.remove("ai-connected");
          status.innerHTML = '<span class="status-dot"></span> Local guide mode · live AI unavailable';
        }
      }
      messages.scrollTop = messages.scrollHeight;
    }

    assistantForm?.addEventListener("submit", async event => {
      event.preventDefault();
      const input = $("#assistantQuestion");
      const question = input.value.trim();
      if (!question) return;
      if (question.length > 1000) return;
      addMessage("user", "You", question);
      input.value = "";
      const reply = addMessage("assistant", "HydroSeal guide", "Thinking…");
      const button = assistantForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try { await askAssistant(question, reply); }
      finally { if (button) button.disabled = false; input.focus(); }
    });
  }

  updateHeader();
    }
    holder.addEventListener("click", event => {
      const remove = event.target.closest("[data-remove]");
      const change = event.target.closest("[data-change]");
      let items = getUserCart();
      if (remove) items = items.filter(i => i.variantId !== remove.dataset.remove);
      if (change) {
        const item = items.find(i => i.variantId === change.dataset.id);
        const variant = getVariant(change.dataset.id);
        if (item) {
          item.qty += Number(change.dataset.change);
          if (item.qty < 1) items = items.filter(i => i.variantId !== change.dataset.id);
          else if (item.qty > variant.stock) { item.qty = variant.stock; showToast("Maximum demo stock reached."); }
        }
      }
      if (remove || change) { saveUserCart(items); render(); }
    });
    $("#checkoutButton")?.addEventListener("click", () => {
      if (!getUserCart().length) return;
      if (!Store.currentUser()) { location.href = "auth.html?next=checkout"; return; }
      location.href = "checkout.html";
    });
    render();
  }

  function initCheckout() {
    const form = $("#checkoutForm");
    if (!form) return;
    const user = Store.currentUser();
    if (!user) { location.href = "auth.html?next=checkout"; return; }
    const items = getUserCart();
    if (!items.length) { location.href = "cart.html"; return; }
    $("#deliveryName").value = user.name || "";
    $("#deliveryEmail").value = user.email || "";
    $("#deliveryPhone").value = user.phone || "";
    const totals = cartTotals(items);
    $("#checkoutItems").innerHTML = items.map(i => {
      const v = getVariant(i.variantId);
      return `<div class="checkout-item"><div class="checkout-item-thumb"><div class="mini-can tiny-can"><div class="mini-lid"></div><div class="mini-label"><b>H<span>·</span></b><strong>H<br>S</strong><small>${escapeHTML(v.size)}</small></div></div></div><div><b>HydroSeal Gel</b><small>${escapeHTML(v.size)} × ${i.qty}</small></div><strong>${money(v.price * i.qty)}</strong></div>`;
    }).join("");
    $("#checkoutSubtotal").textContent = money(totals.subtotal);
    $("#checkoutDelivery").textContent = money(totals.delivery);
    $("#checkoutTotal").textContent = money(totals.total);
    const methodRadios = $$('input[name="paymentMethod"]');
    function syncPaymentUI() {
      $$(".payment-option").forEach(el => el.classList.toggle("selected", $("input", el).checked));
      const cod = $('input[name="paymentMethod"]:checked')?.value === "Cash on Delivery";
      $("#simulationControls").classList.toggle("hidden", cod);
      $("#placeOrderButton").innerHTML = cod ? 'Place demo COD order <span>↗</span>' : 'Simulate payment <span>↗</span>';
    }
    methodRadios.forEach(r => r.addEventListener("change", syncPaymentUI));
    syncPaymentUI();
    form.addEventListener("submit", event => {
      event.preventDefault();
      const message = $("#checkoutMessage");
      if (!form.reportValidity()) return;
      const currentCart = getUserCart();
      if (!currentCart.length) return setMessage(message, "Your cart is empty. Please return to the bag.");
      for (const item of currentCart) {
        const v = getVariant(item.variantId);
        if (!v || item.qty < 1 || item.qty > v.stock) return setMessage(message, "One of your quantities is no longer available. Please review your bag.");
      }
      const method = $('input[name="paymentMethod"]:checked').value;
      const simResult = $('input[name="simResult"]:checked')?.value || "success";
      if (method !== "Cash on Delivery" && simResult === "failure") {
        return setMessage(message, "Simulated payment failed. No order was placed and your bag is unchanged. You can try again.", "error");
      }
      const finalTotals = cartTotals(currentCart);
      const orderId = "HS-" + new Date().toISOString().slice(2,10).replace(/-/g,"") + "-" + Math.random().toString(36).slice(2,6).toUpperCase();
      const isCOD = method === "Cash on Delivery";
      const order = {
        id: orderId, userId: user.id, createdAt: new Date().toISOString(),
        items: currentCart.map(i => { const v = getVariant(i.variantId); return { variantId: v.id, size: v.size, unitPrice: v.price, qty: i.qty, name: HYDROSEAL.name }; }),
        subtotal: finalTotals.subtotal, delivery: finalTotals.delivery, total: finalTotals.total,
        customer: { name: $("#deliveryName").value.trim(), email: $("#deliveryEmail").value.trim(), phone: $("#deliveryPhone").value.trim(), city: $("#deliveryCity").value.trim(), address: $("#deliveryAddress").value.trim(), notes: $("#deliveryNotes").value.trim() },
        paymentMethod: method, paymentStatus: isCOD ? "COD demo — unpaid" : "SIMULATED — successful",
        status: "Order placed (demo)", statusHistory: [{ status: "Order placed (demo)", at: new Date().toISOString() }],
        isDemo: true
      };
      const orders = Store.orders();
      orders.unshift(order);
      if (!Store.saveOrders(orders)) return setMessage(message, "Could not save the demo order in browser storage. Check available browser storage.");
      saveUserCart([]);
      localStorage.setItem("hydroseal_last_order", JSON.stringify({ id: order.id, userId: user.id }));
      location.href = "confirmation.html";
    });
  }

  function initConfirmation() {
    const holder = $("#receiptCard");
    if (!holder) return;
    let ref = null;
    try { ref = JSON.parse(localStorage.getItem("hydroseal_last_order") || "null"); } catch {}
    const user = Store.currentUser();
    const order = ref && user && ref.userId === user.id ? Store.orders().find(o => o.id === ref.id && o.userId === user.id) : null;
    if (!order) {
      holder.innerHTML = `<div class="receipt-empty"><p>No recent demo order was found for this account.</p><a class="text-link" href="account.html#orders">Open my orders ↗</a></div>`;
      return;
    }
    holder.innerHTML = `<div class="receipt-top"><span>ORDER REFERENCE</span><b>${escapeHTML(order.id)}</b><span class="status-pill">${escapeHTML(order.paymentStatus)}</span></div><div class="receipt-lines">${order.items.map(i => `<div class="summary-line"><span>${escapeHTML(i.name)} · ${escapeHTML(i.size)} × ${i.qty}</span><b>${money(i.unitPrice*i.qty)}</b></div>`).join("")}</div><div class="summary-line"><span>Subtotal</span><b>${money(order.subtotal)}</b></div><div class="summary-line"><span>Delivery estimate</span><b>${money(order.delivery)}</b></div><div class="summary-line summary-total"><span>Demo total</span><b>${money(order.total)}</b></div><div class="receipt-address"><small>DELIVER TO (DEMO)</small><b>${escapeHTML(order.customer.name)}</b><span>${escapeHTML(order.customer.address)}, ${escapeHTML(order.customer.city)}</span><span>${escapeHTML(order.customer.phone)}</span></div>`;
  }

  function requireAccount() {
    const user = Store.currentUser();
    if (!user) { location.href = "auth.html"; return null; }
    return user;
  }
  function initAccount() {
    const user = requireAccount();
    if (!user) return;
    $("#accountGreeting").textContent = (user.name || "there").split(" ")[0] + ".";
    $("#accountEmail").textContent = user.email;
    $("#profileName").value = user.name || "";
    $("#profileEmail").value = user.email || "";
    $("#profilePhone").value = user.phone || "";
    $("#logoutButton")?.addEventListener("click", () => { Store.logout(); location.href = "index.html"; });
    $("#profileForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const users = Store.users();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx < 0) return;
      users[idx].name = $("#profileName").value.trim();
      users[idx].phone = $("#profilePhone").value.trim();
      Store.saveUsers(users);
      $("#accountGreeting").textContent = users[idx].name.split(" ")[0] + ".";
      setMessage($("#profileMessage"), "Profile saved in this browser.", "success");
    
  // HydroSeal Gel educational simulator and optional AI assistant.
  function initHydroSealLab() {
    const simulator = $("#leakSimulatorForm");
    const result = $("#simulationResult");
    const assistantForm = $("#assistantForm");
    const messages = $("#assistantMessages");
    const status = $("#assistantStatus");
    if (!simulator && !assistantForm) return;

    const scenarios = {
      hairline: {
        title: "Small crack: inspect and prepare carefully",
        safe: true,
        summary: "A small hairline crack may be a candidate for a suitable crack-sealing product, but the cause, moisture conditions, and product compatibility must be checked first.",
        steps: ["Inspect the crack and surrounding surface; note whether it is growing or returning.", "Remove loose material and prepare the surface only as directed by the verified product label.", "Confirm HydroSeal Gel is approved for this exact surface and moisture condition before application.", "Follow the label for application, curing, ventilation, and protective equipment."]
      },
      damp: {
        title: "Damp patch: identify the moisture source",
        safe: true,
        summary: "A damp mark does not always mean water is entering through a crack. The source could be plumbing, condensation, roof drainage, or water moving through the wall.",
        steps: ["Check whether the patch changes after rain or plumbing use.", "Look for nearby pipes, roof leaks, exterior drainage issues, and condensation.", "Do not seal over an unidentified source; confirm product suitability and follow the label if a crack is confirmed."]
      },
      seepage: {
        title: "Active seepage: get an on-site assessment",
        safe: false,
        summary: "Water actively passing through concrete can indicate water pressure or a more serious moisture pathway. This simple simulator cannot determine the cause or confirm HydroSeal Gel is suitable.",
        steps: ["Keep people away from electrical hazards and slippery areas.", "If safe, note when the water appears and whether the flow increases after rain.", "Ask a qualified professional to assess the source and recommend a compatible repair system before applying any product."]
      },
      wide: {
        title: "Wide or growing crack: prioritize professional inspection",
        safe: false,
        summary: "A wide, stepped, or widening crack can be associated with movement or structural issues. Do not rely on a gel sealant to address a potentially structural problem.",
        steps: ["Do not treat the crack as a cosmetic leak until it has been assessed.", "Seek a qualified building professional or structural engineer, especially if there is movement, sagging, or new cracking.", "Use HydroSeal Gel only if the assessment and official product instructions confirm it is appropriate."]
      }
    };
    const severityText = {
      low: "Reported severity: low. Monitor whether the condition changes.",
      moderate: "Reported severity: moderate. Check the source and document when moisture returns.",
      high: "Reported severity: high. Do not rely on this automated result; seek an on-site assessment."
    };
    const materialText = {
      concrete: "Surface selected: concrete. Confirm that the actual surface and condition match the HydroSeal Gel label.",
      masonry: "Surface selected: masonry/cement render. Compatibility must be confirmed; suitability for concrete does not automatically prove suitability for every masonry surface.",
      other: "Surface selected: other/unknown. Identify the substrate and check compatibility before using any repair product."
    };

    simulator?.addEventListener("submit", event => {
      event.preventDefault();
      const type = $("#leakType").value;
      const severity = $("#leakSeverity").value;
      const material = $("#leakMaterial").value;
      const scenario = scenarios[type] || scenarios.hairline;
      const caution = !scenario.safe || severity === "high" || material === "other";
      result.replaceChildren();
      const tag = document.createElement("span");
      tag.className = "result-tag" + (caution ? " caution" : "");
      tag.textContent = caution ? "CAUTION · NOT A PERFORMANCE PREDICTION" : "GUIDED EDUCATIONAL RESULT";
      const heading = document.createElement("h4");
      heading.textContent = scenario.title;
      const summary = document.createElement("p");
      summary.textContent = scenario.summary;
      const severityNote = document.createElement("p");
      severityNote.textContent = severityText[severity] + " " + materialText[material];
      const list = document.createElement("ul");
      scenario.steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
      });
      result.append(tag, heading, summary, severityNote, list);
    });

    function addMessage(kind, title, text) {
      const message = document.createElement("div");
      message.className = "assistant-message " + (kind === "user" ? "assistant-user" : "assistant-reply");
      const strong = document.createElement("b");
      strong.textContent = title;
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      message.append(strong, paragraph);
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
      return message;
    }

    function localGuideAnswer(question) {
      const q = question.toLowerCase();
      if (/refund|return|cancel|payment|credit card|debit card|order/.test(q)) {
        return "I can explain HydroSeal Gel, but I cannot access orders, process payments, or issue refunds from this product assistant. Use the website's order-support process for purchases. For live payments, only a verified payment provider can confirm or return funds.";
      }
      if (/apply|application|use|how to/.test(q)) {
        return "Before applying HydroSeal Gel, check the official product label for approved surfaces, surface preparation, application method, curing time, and safety precautions. I don't have verified manufacturer instructions in this demo, so I shouldn't invent exact application steps. If water is actively flowing or the crack is widening, get an on-site assessment first.";
      }
      if (/price|cost|size|500|750|1l|2l|5l|pack/.test(q)) {
        return "This website shows sample HydroSeal Gel package sizes and prices for the student demo. Please confirm the real product sizes, prices, stock, and delivery charges with the project owner before treating them as official.";
      }
      if (/safe|toxic|skin|eye|child|pet|chemical/.test(q)) {
        return "Please consult the actual HydroSeal Gel label and safety data sheet for protective equipment, ventilation, first aid, storage, and exposure guidance. I don't have verified safety documentation available here, so I can't confirm specific safety claims.";
      }
      if (/crack|leak|water|damp|moist|concrete|wall|seep/.test(q)) {
        return "Start by identifying where the moisture comes from and whether the crack is stable. Small, stable surface cracks may need a compatible repair product, but active seepage, recurring dampness, wide or growing cracks, or signs of movement should be assessed on site. HydroSeal Gel should only be used when the official label confirms it suits the surface and condition. What type of surface is affected, and does water actively flow through it?";
      }
      return "I can help with general HydroSeal Gel product questions and moisture-troubleshooting steps. Tell me the surface material, what you observe (crack, damp patch, or active seepage), and whether it changes after rain. I will keep recommendations cautious because this demo does not have verified product testing or manufacturer instructions.";
    }

    async function askAssistant(question, replyNode) {
      const original = replyNode.querySelector("p");
      original.textContent = "Thinking…";
      try {
        if (window.HydroSealGemini?.hasKey()) {
          original.textContent = await window.HydroSealGemini.askQuestion(question);
          if (status) {
            status.classList.add("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Live Gemini response';
          }
        } else {
          original.textContent = localGuideAnswer(question);
          if (status) {
            status.classList.remove("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Local guide mode · no key or installation needed';
          }
        }
      } catch {
        original.textContent = localGuideAnswer(question);
        if (status) {
          status.classList.remove("ai-connected");
          status.innerHTML = '<span class="status-dot"></span> Local guide mode · live AI unavailable';
        }
      }
      messages.scrollTop = messages.scrollHeight;
    }

    assistantForm?.addEventListener("submit", async event => {
      event.preventDefault();
      const input = $("#assistantQuestion");
      const question = input.value.trim();
      if (!question) return;
      if (question.length > 1000) return;
      addMessage("user", "You", question);
      input.value = "";
      const reply = addMessage("assistant", "HydroSeal guide", "Thinking…");
      const button = assistantForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try { await askAssistant(question, reply); }
      finally { if (button) button.disabled = false; input.focus(); }
    });
  }

  updateHeader();
    });
    const orders = Store.orders().filter(o => o.userId === user.id);
    const wishlist = Store.wishlist().filter(w => w.userId === user.id);
    $("#orderNavCount").textContent = orders.length;
    $("#wishNavCount").textContent = wishlist.length;
    $("#ordersSectionCount").textContent = String(orders.length).padStart(2,"0");
    $("#wishlistSectionCount").textContent = String(wishlist.length).padStart(2,"0");
    renderOrders(user, orders);
    renderWishlist(user, wishlist);
    renderReviews(user);
    $$("[data-account-section]").forEach(link => link.addEventListener("click", () => activateSection(link.dataset.accountSection)));
    $("#logoutButton")?.addEventListener("click", () => { Store.logout(); location.href = "index.html"; });
    const section = location.hash.replace("#","");
    activateSection(["orders","wishlist","reviews","profile"].includes(section) ? section : "profile");
  }
  function activateSection(name) {
    const names = ["profile","orders","wishlist","reviews"];
    names.forEach(n => {
      $(`#${n}Section`)?.classList.toggle("hidden", n !== name);
      $(`[data-account-section="${n}"]`)?.classList.toggle("active", n === name);
    });
    if (history.replaceState) history.replaceState(null, "", "#" + name);
  }
  function renderOrders(user, orders) {
    const holder = $("#ordersList");
    if (!orders.length) {
      holder.innerHTML = `<div class="empty-state compact-empty"><div class="empty-icon">▤</div><h3>No orders yet.</h3><p>Your completed demo checkouts will appear here.</p><a class="button button-primary" href="index.html#shop">Explore sizes <span>↗</span></a></div>`;
      return;
    }
    holder.innerHTML = orders.map(order => `<article class="order-card"><div class="order-card-head"><div><small>ORDER REFERENCE</small><b>${escapeHTML(order.id)}</b><span>${new Date(order.createdAt).toLocaleString("en-PH",{dateStyle:"medium",timeStyle:"short"})}</span></div><span class="order-status">${escapeHTML(order.status)}</span></div><div class="order-items-preview">${order.items.map(i => `<div><span>${escapeHTML(i.size)} × ${i.qty}</span><b>${money(i.unitPrice*i.qty)}</b></div>`).join("")}</div><div class="order-card-total"><span>Total · <small>${escapeHTML(order.paymentStatus)}</small></span><b>${money(order.total)}</b></div><div class="tracking-box"><div class="tracking-head"><b>Demo tracking timeline</b><button class="text-button" data-advance="${escapeHTML(order.id)}">${order.status === "Delivered (demo)" ? "Delivered ✓" : "Advance demo status ↗"}</button></div><div class="tracking-steps">${renderTracking(order)}</div></div><div class="order-card-actions"><button class="button button-outline button-small" data-receipt="${escapeHTML(order.id)}">View receipt</button>${order.status === "Delivered (demo)" ? `<button class="button button-primary button-small" data-review-order="${escapeHTML(order.id)}">Leave a review ★</button>` : ""}</div></article>`).join("");
    holder.onclick = event => {
      const advance = event.target.closest("[data-advance]");
      const review = event.target.closest("[data-review-order]");
      const receipt = event.target.closest("[data-receipt]");
      if (advance) {
        const all = Store.orders();
        const o = all.find(x => x.id === advance.dataset.advance && x.userId === user.id);
        if (!o) return;
        const sequence = ["Order placed (demo)", "Processing (demo)", "Shipped (demo)", "Delivered (demo)"];
        const current = sequence.indexOf(o.status);
        if (current < sequence.length - 1) {
          o.status = sequence[current + 1];
          o.statusHistory = o.statusHistory || [];
          o.statusHistory.push({ status: o.status, at: new Date().toISOString() });
          Store.saveOrders(all);
          renderOrders(user, Store.orders().filter(x => x.userId === user.id));
          renderReviews(user);
          showToast("Demo tracking status updated.");
        } else showToast("This demo order is already marked delivered.");
      }
      if (review) {
        activateSection("reviews");
        const eligible = $("#reviewOrderItem");
        if (eligible) eligible.value = review.dataset.reviewOrder;
      }
      if (receipt) {
        const o = Store.orders().find(x => x.id === receipt.dataset.receipt && x.userId === user.id);
        if (o) {
          const win = window.open("", "_blank", "noopener,noreferrer,width=650,height=750");
          if (!win) return showToast("Please allow pop-ups to open the demo receipt.");
          const lines = o.items.map(i => `<p>${escapeHTML(i.name)} — ${escapeHTML(i.size)} × ${i.qty}: ${money(i.unitPrice*i.qty)}</p>`).join("");
          win.document.write(`<!doctype html><html><head><title>Demo receipt ${escapeHTML(o.id)}</title><style>body{font:16px Arial;max-width:600px;margin:40px auto;padding:20px;color:#173d36}h1{font-size:26px}hr{border:0;border-top:1px solid #ddd}small{color:#777}</style></head><body><small>HYDROSEAL GEL · STUDENT PROJECT DEMO</small><h1>Order receipt</h1><p><b>${escapeHTML(o.id)}</b></p><p>${new Date(o.createdAt).toLocaleString()}</p><hr>${lines}<hr><p>Subtotal: ${money(o.subtotal)}</p><p>Delivery: ${money(o.delivery)}</p><h2>Total: ${money(o.total)}</h2><p>Payment: ${escapeHTML(o.paymentMethod)} — ${escapeHTML(o.paymentStatus)}</p><p>Customer: ${escapeHTML(o.customer.name)}</p><p>Address: ${escapeHTML(o.customer.address)}, ${escapeHTML(o.customer.city)}</p><hr><small>Simulation only. No actual payment was processed.</small><script>window.onload=()=>window.print()<\/script></body></html>`);
          win.document.close();
        }
      }
    };
  }
  function renderTracking(order) {
    const sequence = ["Order placed (demo)", "Processing (demo)", "Shipped (demo)", "Delivered (demo)"];
    const active = Math.max(0, sequence.indexOf(order.status));
    return sequence.map((s,i) => `<div class="tracking-step ${i <= active ? "done" : ""}"><span>${i < active ? "✓" : i + 1}</span><small>${s.replace(" (demo)","")}</small></div>`).join("");
  }
  function renderWishlist(user, wishlist) {
    const holder = $("#wishlistList");
    if (!wishlist.length) {
      holder.innerHTML = `<div class="empty-state compact-empty"><div class="empty-icon">♡</div><h3>Your wishlist is open.</h3><p>Save your preferred HydroSeal Gel sizes for later.</p><a class="button button-primary" href="index.html#shop">Explore sizes <span>↗</span></a></div>`;
      return;
    }
    holder.innerHTML = wishlist.map(w => {
      const v = getVariant(w.variantId);
      if (!v) return "";
      return `<article class="wishlist-row"><div class="wishlist-product-icon">H<span>·</span></div><div class="wishlist-product-copy"><b>HydroSeal Gel</b><small>${escapeHTML(v.size)} · ${money(v.price)}</small></div><button class="button button-outline button-small" data-wish-cart="${v.id}">Add to bag</button><button class="remove-wish" data-wish-remove="${v.id}" aria-label="Remove from wishlist">×</button></article>`;
    }).join("");
    holder.onclick = event => {
      const add = event.target.closest("[data-wish-cart]");
      const remove = event.target.closest("[data-wish-remove]");
      if (add) { if (addToCart(add.dataset.wishCart,1)) showToast("Added to your bag."); }
      if (remove) {
        Store.saveWishlist(Store.wishlist().filter(w => !(w.userId === user.id && w.variantId === remove.dataset.wishRemove)));
        renderWishlist(user, Store.wishlist().filter(w => w.userId === user.id));
        $("#wishNavCount").textContent = Store.wishlist().filter(w => w.userId === user.id).length;
      }
    };
  }
  function renderReviews(user) {
    const allOrders = Store.orders().filter(o => o.userId === user.id && o.status === "Delivered (demo)");
    const existing = Store.reviews().filter(r => r.userId === user.id);
    const alreadyReviewed = new Set(existing.map(r => `${r.orderId}:${r.variantId}`));
    const eligible = [];
    allOrders.forEach(order => order.items.forEach(item => {
      if (!alreadyReviewed.has(`${order.id}:${item.variantId}`)) eligible.push({ order, item });
    }));
    const eligibility = $("#reviewEligibility");
    if (!eligible.length) {
      eligibility.innerHTML = `<div class="inline-info"><span>☆</span><p>${allOrders.length ? "You've reviewed all eligible items from delivered demo orders." : "To unlock a review, place a demo order and advance its tracking status to Delivered."}</p></div>`;
      $("#reviewForm")?.classList.add("hidden");
    } else {
      eligibility.innerHTML = `<div class="inline-info"><span>✳</span><p>You have ${eligible.length} eligible item${eligible.length === 1 ? "" : "s"} from delivered demo orders. Share your experience below.</p></div>`;
      $("#reviewForm")?.classList.remove("hidden");
      $("#reviewOrderItem").innerHTML = eligible.map(({order,item}) => `<option value="${escapeHTML(order.id)}|${escapeHTML(item.variantId)}">${escapeHTML(item.size)} — Order ${escapeHTML(order.id)}</option>`).join("");
    }
    const myReviews = $("#myReviews");
    if (myReviews) {
      myReviews.innerHTML = existing.length ? `<h3 class="subsection-title">Your submitted reviews</h3>` + existing.slice().reverse().map(r => `<article class="my-review-card"><div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>${escapeHTML(r.text)}</p><small>${escapeHTML(r.size)} · ${new Date(r.createdAt).toLocaleDateString()}</small></article>`).join("") : "";
    }
    const starButtons = $$("#starPicker button");
    starButtons.forEach(button => button.onclick = () => {
      selectedRating = Number(button.dataset.rating);
      starButtons.forEach(b => b.classList.toggle("chosen", Number(b.dataset.rating) <= selectedRating));
      $("#ratingLabel").textContent = `${selectedRating} out of 5 stars`;
    });
    if ($("#reviewForm")) $("#reviewForm").onsubmit = event => {
      event.preventDefault();
      if (!selectedRating) return setMessage($("#reviewMessage"), "Please select a star rating.");
      const selection = $("#reviewOrderItem").value.split("|");
      const orderId = selection[0], variantId = selection[1];
      const order = Store.orders().find(o => o.id === orderId && o.userId === user.id && o.status === "Delivered (demo)");
      const item = order?.items.find(i => i.variantId === variantId);
      if (!item) return setMessage($("#reviewMessage"), "That item is not eligible for a review.");
      const reviews = Store.reviews();
      if (reviews.some(r => r.userId === user.id && r.orderId === orderId && r.variantId === variantId)) return setMessage($("#reviewMessage"), "You have already reviewed this item.");
      const review = { id: "rev_" + Date.now().toString(36), userId: user.id, orderId, variantId, size: item.size, rating: selectedRating, text: $("#reviewText").value.trim(), createdAt: new Date().toISOString() };
      if (review.text.length < 10) return setMessage($("#reviewMessage"), "Please write at least 10 characters.");
      reviews.push(review);
      Store.saveReviews(reviews);
      setMessage($("#reviewMessage"), "Thank you! Your demo review has been saved.", "success");
      $("#reviewText").value = "";
      selectedRating = 0;
      starButtons.forEach(b => b.classList.remove("chosen"));
      $("#ratingLabel").textContent = "Choose a rating";
      renderReviews(user);
      renderHomeReviewStats();
    };
  }


  // HydroSeal Gel educational simulator and optional AI assistant.
  function initHydroSealLab() {
    const simulator = $("#leakSimulatorForm");
    const result = $("#simulationResult");
    const assistantForm = $("#assistantForm");
    const messages = $("#assistantMessages");
    const status = $("#assistantStatus");
    if (!simulator && !assistantForm) return;

    const scenarios = {
      hairline: {
        title: "Small crack: inspect and prepare carefully",
        safe: true,
        summary: "A small hairline crack may be a candidate for a suitable crack-sealing product, but the cause, moisture conditions, and product compatibility must be checked first.",
        steps: ["Inspect the crack and surrounding surface; note whether it is growing or returning.", "Remove loose material and prepare the surface only as directed by the verified product label.", "Confirm HydroSeal Gel is approved for this exact surface and moisture condition before application.", "Follow the label for application, curing, ventilation, and protective equipment."]
      },
      damp: {
        title: "Damp patch: identify the moisture source",
        safe: true,
        summary: "A damp mark does not always mean water is entering through a crack. The source could be plumbing, condensation, roof drainage, or water moving through the wall.",
        steps: ["Check whether the patch changes after rain or plumbing use.", "Look for nearby pipes, roof leaks, exterior drainage issues, and condensation.", "Do not seal over an unidentified source; confirm product suitability and follow the label if a crack is confirmed."]
      },
      seepage: {
        title: "Active seepage: get an on-site assessment",
        safe: false,
        summary: "Water actively passing through concrete can indicate water pressure or a more serious moisture pathway. This simple simulator cannot determine the cause or confirm HydroSeal Gel is suitable.",
        steps: ["Keep people away from electrical hazards and slippery areas.", "If safe, note when the water appears and whether the flow increases after rain.", "Ask a qualified professional to assess the source and recommend a compatible repair system before applying any product."]
      },
      wide: {
        title: "Wide or growing crack: prioritize professional inspection",
        safe: false,
        summary: "A wide, stepped, or widening crack can be associated with movement or structural issues. Do not rely on a gel sealant to address a potentially structural problem.",
        steps: ["Do not treat the crack as a cosmetic leak until it has been assessed.", "Seek a qualified building professional or structural engineer, especially if there is movement, sagging, or new cracking.", "Use HydroSeal Gel only if the assessment and official product instructions confirm it is appropriate."]
      }
    };
    const severityText = {
      low: "Reported severity: low. Monitor whether the condition changes.",
      moderate: "Reported severity: moderate. Check the source and document when moisture returns.",
      high: "Reported severity: high. Do not rely on this automated result; seek an on-site assessment."
    };
    const materialText = {
      concrete: "Surface selected: concrete. Confirm that the actual surface and condition match the HydroSeal Gel label.",
      masonry: "Surface selected: masonry/cement render. Compatibility must be confirmed; suitability for concrete does not automatically prove suitability for every masonry surface.",
      other: "Surface selected: other/unknown. Identify the substrate and check compatibility before using any repair product."
    };

    simulator?.addEventListener("submit", event => {
      event.preventDefault();
      const type = $("#leakType").value;
      const severity = $("#leakSeverity").value;
      const material = $("#leakMaterial").value;
      const scenario = scenarios[type] || scenarios.hairline;
      const caution = !scenario.safe || severity === "high" || material === "other";
      result.replaceChildren();
      const tag = document.createElement("span");
      tag.className = "result-tag" + (caution ? " caution" : "");
      tag.textContent = caution ? "CAUTION · NOT A PERFORMANCE PREDICTION" : "GUIDED EDUCATIONAL RESULT";
      const heading = document.createElement("h4");
      heading.textContent = scenario.title;
      const summary = document.createElement("p");
      summary.textContent = scenario.summary;
      const severityNote = document.createElement("p");
      severityNote.textContent = severityText[severity] + " " + materialText[material];
      const list = document.createElement("ul");
      scenario.steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
      });
      result.append(tag, heading, summary, severityNote, list);
    });

    function addMessage(kind, title, text) {
      const message = document.createElement("div");
      message.className = "assistant-message " + (kind === "user" ? "assistant-user" : "assistant-reply");
      const strong = document.createElement("b");
      strong.textContent = title;
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      message.append(strong, paragraph);
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
      return message;
    }

    function localGuideAnswer(question) {
      const q = question.toLowerCase();
      if (/refund|return|cancel|payment|credit card|debit card|order/.test(q)) {
        return "I can explain HydroSeal Gel, but I cannot access orders, process payments, or issue refunds from this product assistant. Use the website's order-support process for purchases. For live payments, only a verified payment provider can confirm or return funds.";
      }
      if (/apply|application|use|how to/.test(q)) {
        return "Before applying HydroSeal Gel, check the official product label for approved surfaces, surface preparation, application method, curing time, and safety precautions. I don't have verified manufacturer instructions in this demo, so I shouldn't invent exact application steps. If water is actively flowing or the crack is widening, get an on-site assessment first.";
      }
      if (/price|cost|size|500|750|1l|2l|5l|pack/.test(q)) {
        return "This website shows sample HydroSeal Gel package sizes and prices for the student demo. Please confirm the real product sizes, prices, stock, and delivery charges with the project owner before treating them as official.";
      }
      if (/safe|toxic|skin|eye|child|pet|chemical/.test(q)) {
        return "Please consult the actual HydroSeal Gel label and safety data sheet for protective equipment, ventilation, first aid, storage, and exposure guidance. I don't have verified safety documentation available here, so I can't confirm specific safety claims.";
      }
      if (/crack|leak|water|damp|moist|concrete|wall|seep/.test(q)) {
        return "Start by identifying where the moisture comes from and whether the crack is stable. Small, stable surface cracks may need a compatible repair product, but active seepage, recurring dampness, wide or growing cracks, or signs of movement should be assessed on site. HydroSeal Gel should only be used when the official label confirms it suits the surface and condition. What type of surface is affected, and does water actively flow through it?";
      }
      return "I can help with general HydroSeal Gel product questions and moisture-troubleshooting steps. Tell me the surface material, what you observe (crack, damp patch, or active seepage), and whether it changes after rain. I will keep recommendations cautious because this demo does not have verified product testing or manufacturer instructions.";
    }

    async function askAssistant(question, replyNode) {
      const original = replyNode.querySelector("p");
      original.textContent = "Thinking…";
      try {
        if (window.HydroSealGemini?.hasKey()) {
          original.textContent = await window.HydroSealGemini.askQuestion(question);
          if (status) {
            status.classList.add("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Live Gemini response';
          }
        } else {
          original.textContent = localGuideAnswer(question);
          if (status) {
            status.classList.remove("ai-connected");
            status.innerHTML = '<span class="status-dot"></span> Local guide mode · no key or installation needed';
          }
        }
      } catch {
        original.textContent = localGuideAnswer(question);
        if (status) {
          status.classList.remove("ai-connected");
          status.innerHTML = '<span class="status-dot"></span> Local guide mode · live AI unavailable';
        }
      }
      messages.scrollTop = messages.scrollHeight;
    }

    assistantForm?.addEventListener("submit", async event => {
      event.preventDefault();
      const input = $("#assistantQuestion");
      const question = input.value.trim();
      if (!question) return;
      if (question.length > 1000) return;
      addMessage("user", "You", question);
      input.value = "";
      const reply = addMessage("assistant", "HydroSeal guide", "Thinking…");
      const button = assistantForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try { await askAssistant(question, reply); }
      finally { if (button) button.disabled = false; input.focus(); }
    });
  }

  updateHeader();
  if (page === "home") { initHome(); initHydroSealLab(); }
  if (page === "auth") initAuth();
  if (page === "cart") initCart();
  if (page === "checkout") initCheckout();
  if (page === "confirmation") initConfirmation();
  if (page === "account") initAccount();
})();