/* ============================================================
   AKOIN FINTECH — SCRIPT (Enterprise Overhaul)
   Phases 0–6: Idempotency, Command Palette, Toast System,
   Keyboard Shortcuts, Focus Trapping, Memory-Safe Cleanup
   ============================================================ */
;(function () {
  'use strict';

  /* ---------- DOM REFS ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const body = document.body;
  const preloader = $('#preloader');
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const navLinks = $('#nav-links');
  const themeToggle = $('#theme-toggle');
  const scrollProgress = $('#scroll-progress');
  const backToTop = $('#back-to-top');
  const chatToggle = $('#chat-toggle');
  const chatWindow = $('#chat-window');
  const chatMessages = $('#chat-messages');
  const chatForm = $('#chat-form');
  const chatInput = $('#chat-input');
  const contactForm = $('#contact-form');
  const newsletterForm = $('#newsletter-form');

  /* Command Palette refs */
  const cmdModal = $('#cmd-palette-modal');
  const cmdInput = $('#cmd-palette-input');
  const cmdCloseBtn = $('#cmd-close-btn');
  const cmdPaletteBtn = $('#cmd-palette-btn');
  const cmdResults = $('#cmd-palette-results');
  const cmdToggleTheme = $('#cmd-toggle-theme');
  const cmdOpenChat = $('#cmd-open-chat');
  const cmdCopyLink = $('#cmd-copy-link');

  /* Toast container */
  const toastContainer = $('#toast-container');

  /* ==========================================================
     PHASE 0: TOAST NOTIFICATION ENGINE
     Global accessible toast alerts (role="alert", aria-live)
     ========================================================== */
  const TOAST_ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  function showToast(type, message, durationMs) {
    if (!toastContainer) return;
    durationMs = durationMs || 4500;
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'alert');
    toast.innerHTML =
      '<span class="toast-icon">' + (TOAST_ICONS[type] || '') + '</span>' +
      '<span class="toast-msg">' + message + '</span>' +
      '<button class="toast-close" aria-label="Dismiss">&times;</button>';
    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    let dismissTimer = setTimeout(function() { removeToast(toast); }, durationMs);

    closeBtn.addEventListener('click', function() {
      clearTimeout(dismissTimer);
      removeToast(toast);
    });
  }

  function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
  }

  /* Listen for custom global toast events (from fetcher.ts or any module) */
  window.addEventListener('akoin_toast', function(e) {
    var d = e.detail;
    if (d && d.type && d.message) showToast(d.type, d.message);
  });

  /* ==========================================================
     PRELOADER
     ========================================================== */
  window.addEventListener('load', function() {
    setTimeout(function() {
      preloader.classList.add('hidden');
      body.style.overflow = '';
    }, 2000);
  });
  body.style.overflow = 'hidden';

  /* ==========================================================
     THEME TOGGLE (Zero FOUC — init done in <head> script)
     ========================================================== */
  const THEME_KEY = 'akoin_theme_preference';
  /* The <head> inline script already applied data-theme.
     We sync our JS state from the DOM. */
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  themeToggle.addEventListener('click', function() {
    var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    /* Also write to legacy key for backwards compat */
    localStorage.setItem('akoin-theme', next);
  });

  /* ==========================================================
     MOBILE NAV (Phase 3.5 — Focus Trap + Overlay Backdrop)
     ========================================================== */
  /* Create overlay backdrop element dynamically */
  const navOverlay = document.createElement('div');
  navOverlay.className = 'nav-overlay';
  navOverlay.id = 'nav-overlay';
  body.appendChild(navOverlay);

  function openMobileNav() {
    navLinks.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';
    navOverlay.classList.add('active');
    /* Focus trap: move focus to first nav link */
    var firstLink = navLinks.querySelector('.nav-link');
    if (firstLink) firstLink.focus();
  }

  function closeMobileNav() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
    navOverlay.classList.remove('active');
    hamburger.focus();
  }

  hamburger.addEventListener('click', function() {
    var isOpen = navLinks.classList.contains('open');
    if (isOpen) closeMobileNav();
    else openMobileNav();
  });

  /* Close on overlay click */
  navOverlay.addEventListener('click', closeMobileNav);

  /* Close on nav link click with smooth scroll */
  $$('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        var target = $(href);
        if (target) {
          e.preventDefault();
          /* Close mobile drawer without focusing hamburger so viewport doesn't scroll back to top */
          navLinks.classList.remove('open');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
          body.style.overflow = '';
          navOverlay.classList.remove('active');

          setTimeout(function() {
            var navHeight = navbar ? navbar.offsetHeight : 70;
            var targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({
              top: targetPos,
              behavior: 'smooth'
            });
          }, 80);
          return;
        }
      }
      closeMobileNav();
    });
  });

  /* Focus trap inside mobile nav */
  navLinks.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab' || !navLinks.classList.contains('open')) return;
    var focusable = navLinks.querySelectorAll('a, button');
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ==========================================================
     NAVBAR SCROLL
     ========================================================== */
  var lastScroll = 0;
  function onScroll() {
    var y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);

    /* Scroll progress */
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH > 0) {
      scrollProgress.style.width = (y / docH * 100) + '%';
    }

    /* Back to top */
    backToTop.classList.toggle('visible', y > 500);

    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ==========================================================
     SCROLL SPY
     ========================================================== */
  var spySections = $$('#hero,#about,#products,#services,#industries,#pricing,#contact');
  var navLinkEls = $$('.nav-link');

  var spyObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var id = e.target.id;
        navLinkEls.forEach(function(l) {
          l.classList.toggle('active', l.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  spySections.forEach(function(s) { spyObs.observe(s); });

  /* ==========================================================
     SCROLL REVEAL
     ========================================================== */
  var revealObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var delay = e.target.style.getPropertyValue('--delay') || '0s';
        e.target.style.transitionDelay = delay;
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(function(el) { revealObs.observe(el); });

  /* ==========================================================
     ANIMATED COUNTERS
     ========================================================== */
  var counterObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var target = +el.dataset.target;
      var suffix = el.dataset.suffix || '';
      var current = 0;
      var step = Math.max(1, Math.ceil(target / 50));
      var interval = setInterval(function() {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current + suffix;
      }, 30);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  $$('.stat-num').forEach(function(el) { counterObs.observe(el); });

  /* ==========================================================
     HERO TYPING ANIMATION
     ========================================================== */
  var typedEl = $('#typed-text');
  var words = ['Digital Payments', 'Smart Banking', 'Instant Lending', 'Risk Analytics', 'Business Growth'];
  var wordIdx = 0, charIdx = 0, deleting = false;

  function typeLoop() {
    var word = words[wordIdx];
    if (!deleting) {
      charIdx++;
      typedEl.textContent = word.slice(0, charIdx);
      if (charIdx === word.length) {
        setTimeout(function() { deleting = true; typeLoop(); }, 2000);
        return;
      }
      setTimeout(typeLoop, 80);
    } else {
      charIdx--;
      typedEl.textContent = word.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        setTimeout(typeLoop, 400);
        return;
      }
      setTimeout(typeLoop, 40);
    }
  }
  setTimeout(typeLoop, 1200);

  /* ==========================================================
     PRODUCT TABS
     ========================================================== */
  $$('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      $$('.tab-btn').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      var tabId = btn.dataset.tab;
      $$('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      var target = $('#tab-' + tabId);
      if (target) target.classList.add('active');
    });
  });

  /* ==========================================================
     TESTIMONIAL CAROUSEL
     ========================================================== */
  var tTrack = $('#testimonial-track');
  var tDotsWrap = $('#tc-dots');
  var tCards = $$('.testimonial-card');
  var tIdx = 0, tAuto;

  function buildDots() {
    if (!tDotsWrap) return;
    tDotsWrap.innerHTML = '';
    tCards.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className = 'tc-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', function() { goToSlide(i); });
      tDotsWrap.appendChild(dot);
    });
  }
  buildDots();

  function goToSlide(i) {
    if (!tTrack) return;
    tIdx = ((i % tCards.length) + tCards.length) % tCards.length;
    tTrack.style.transform = 'translateX(-' + (tIdx * 100) + '%)';
    $$('.tc-dot').forEach(function(d, j) { d.classList.toggle('active', j === tIdx); });
    resetAuto();
  }

  function resetAuto() {
    clearInterval(tAuto);
    tAuto = setInterval(function() { goToSlide(tIdx + 1); }, 6000);
  }
  resetAuto();

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      clearInterval(tAuto);
    } else {
      resetAuto();
    }
  });

  var prevBtn = $('.tc-prev');
  var nextBtn = $('.tc-next');
  if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide(tIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide(tIdx + 1); });

  /* ==========================================================
     BACK TO TOP
     ========================================================== */
  backToTop.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ==========================================================
     3D TILT EFFECT ON CARDS (Desktop only — pointer: fine)
     ========================================================== */
  var hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (hasFinePointer) {
    $$('.tilt-card').forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var rotateX = ((y - cy) / cy) * -5;
        var rotateY = ((x - cx) / cx) * 5;
        card.style.transform = 'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function() {
        card.style.transform = '';
      });
    });
  }

  /* ==========================================================
     BUTTON RIPPLE EFFECT
     ========================================================== */
  $$('.btn-ripple').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      var rect = this.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(function() { ripple.remove(); }, 600);
    });
  });

  /* ==========================================================
     PHASE 0: CONTACT FORM — IDEMPOTENT SUBMIT (Mutex Lock)
     ========================================================== */
  var contactSubmitting = false;

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    /* Prevent double-submit */
    if (contactSubmitting) return;

    var feedback = $('#form-feedback');
    var submitBtn = $('#contact-submit-btn');
    var name = $('#c-name').value.trim();
    var email = $('#c-email').value.trim();

    /* Clear previous inline errors */
    $$('#contact-form input, #contact-form textarea, #contact-form select').forEach(function(el) {
      el.removeAttribute('aria-invalid');
    });

    if (!name) {
      feedback.textContent = 'Please enter your full name.';
      feedback.className = 'form-feedback error';
      $('#c-name').setAttribute('aria-invalid', 'true');
      $('#c-name').focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.textContent = 'Please enter a valid email address.';
      feedback.className = 'form-feedback error';
      $('#c-email').setAttribute('aria-invalid', 'true');
      $('#c-email').focus();
      return;
    }

    /* Lock UI */
    contactSubmitting = true;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    feedback.textContent = '';
    feedback.className = 'form-feedback';

    /* Simulate async request (replace with real API call + fetcher.ts) */
    setTimeout(function() {
      feedback.textContent = 'Thank you, ' + name + '! We\'ll be in touch within 24 hours.';
      feedback.className = 'form-feedback success';
      showToast('success', 'Message sent successfully!');
      contactForm.reset();

      /* Unlock UI */
      contactSubmitting = false;
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      submitBtn.setAttribute('aria-busy', 'false');
    }, 1500);
  });

  /* ==========================================================
     NEWSLETTER FORM — IDEMPOTENT SUBMIT
     ========================================================== */
  var nlSubmitting = false;

  newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (nlSubmitting) return;

    var input = $('#nl-email');
    if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
      showToast('warning', 'Please enter a valid email address.');
      return;
    }

    nlSubmitting = true;
    var btn = newsletterForm.querySelector('button');
    var orig = btn.textContent;
    btn.textContent = 'Subscribed!';
    btn.disabled = true;
    input.value = '';
    showToast('success', 'You\'re subscribed! Check your inbox for updates.');
    setTimeout(function() {
      btn.textContent = orig;
      btn.disabled = false;
      nlSubmitting = false;
    }, 3000);
  });

  /* ==========================================================
     CHATBOT
     ========================================================== */
  var chatOpen = false;

  function openChat() {
    chatOpen = true;
    chatWindow.classList.add('open');
    chatToggle.setAttribute('aria-expanded', 'true');
    if (chatMessages.children.length === 0) {
      addBotMessage('Hi there! 👋 Welcome to Akoin Fintech. How can I help you today?');
    }
    chatInput.focus();
  }

  function closeChat() {
    chatOpen = false;
    chatWindow.classList.remove('open');
    chatToggle.setAttribute('aria-expanded', 'false');
  }

  chatToggle.addEventListener('click', function() {
    if (chatOpen) closeChat();
    else openChat();
  });

  function addBotMessage(text) {
    var msg = document.createElement('div');
    msg.className = 'chat-msg bot';
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addUserMessage(text) {
    var msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping() {
    var msg = document.createElement('div');
    msg.className = 'chat-msg bot typing';
    msg.id = 'typing-indicator';
    msg.innerHTML = '<span class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTyping() {
    var t = $('#typing-indicator');
    if (t) t.remove();
  }

  function botReply(userText) {
    var text = userText.toLowerCase();
    showTyping();
    setTimeout(function() {
      removeTyping();
      addBotMessage(getResponse(text));
    }, 800 + Math.random() * 600);
  }

  function getResponse(text) {
    if (/\b(hi|hello|hey|howdy|hola)\b/.test(text)) return 'Hello! 😊 How can I assist you today? Ask about our products, pricing, or anything else!';
    if (/\bpric(e|ing|es)\b/.test(text)) return 'Our pricing starts at 1.9% per transaction (Starter). Growth plan: 1.5%, Enterprise: custom volume-based pricing. No hidden fees!';
    if (/\b(product|service|offer|feature)\b/.test(text)) return 'We offer Payment Gateway, Payment Links, Subscriptions, Bulk Payouts, Business Banking, Working Capital Loans, and more. Which one interests you?';
    if (/\b(payment|gateway|pay)\b/.test(text)) return 'Our Payment Gateway supports 100+ payment modes — UPI, cards, net banking, wallets, EMI, and international payments. Integration takes under an hour!';
    if (/\b(upi|autopay)\b/.test(text)) return 'We support all UPI apps including Google Pay, PhonePe, BHIM, and Paytm. UPI AutoPay is available for recurring payments like subscriptions and SIPs.';
    if (/\b(payout|bulk|disburs)\b/.test(text)) return 'Our Bulk Payouts feature lets you disburse to thousands of beneficiaries via IMPS, NEFT, RTGS, or UPI — all from one dashboard.';
    if (/\b(bank|account|current)\b/.test(text)) return 'Akoin Business Banking offers fully digital current accounts, escrow accounts, corporate cards, and cash-flow management tools.';
    if (/\b(lend|loan|credit|bnpl)\b/.test(text)) return 'We provide AI-powered working capital loans up to ₹50 lakhs, Buy Now Pay Later, and EMI options. Approval in under 5 minutes!';
    if (/\b(api|integrat|sdk|develop)\b/.test(text)) return 'RESTful APIs with JSON, SDKs for Node.js, Python, Java, PHP, Go. Sandbox environment, webhooks, and detailed docs. Go live in under an hour!';
    if (/\b(secur|safe|encrypt|pci)\b/.test(text)) return 'We are PCI-DSS Level 1 certified with 256-bit AES encryption, SOC 2 practices, real-time fraud monitoring, and regular third-party security audits.';
    if (/\b(support|help|contact|reach)\b/.test(text)) return 'We offer 24/7 support via live chat, email (hello@akoinfintech.com), and phone. Enterprise clients get a dedicated account manager.';
    if (/\b(about|company|who|founded)\b/.test(text)) return 'Akoin Fintech Pvt Ltd was incorporated in 2023, headquartered in Gurgaon, Haryana (CIN: U74999HR2023PTC114563). We\'re building India\'s next-gen financial infrastructure!';
    if (/\b(hour|time|open|office)\b/.test(text)) return 'Our office hours are Mon-Sat, 9:00 AM - 7:00 PM IST. Support and monitoring are available 24/7.';
    if (/\b(settlement|t\+0|instant)\b/.test(text)) return 'Standard: T+2, Growth: T+1, Enterprise: T+0 instant settlements — funds within minutes of payment!';
    if (/\b(kyc|verif|signup|register)\b/.test(text)) return 'Our digital KYC process takes just 2 minutes. Submit PAN, GSTIN, and bank details for instant verification. Start accepting payments the same day!';
    if (/\b(refund|cancel|return)\b/.test(text)) return 'Refunds can be processed directly from the dashboard — full or partial. They are typically completed within 3-5 business days.';
    if (/\b(international|forex|global|cross.?border)\b/.test(text)) return 'Enterprise plan supports 100+ countries, multi-currency processing, dynamic currency conversion, and INR settlements.';
    if (/\b(thanks|thank|thx)\b/.test(text)) return 'You\'re welcome! 😊 Is there anything else I can help you with?';
    if (/\b(bye|goodbye|see you)\b/.test(text)) return 'Goodbye! 👋 Have a great day. Feel free to come back anytime!';
    return 'I\'d be happy to help! You can ask about our products, pricing, integrations, security, or support. Or visit our FAQ section for quick answers.';
  }

  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = '';
    botReply(text);
  });

  /* Quick reply chips */
  $$('.quick-reply').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var msg = btn.dataset.msg;
      addUserMessage(msg);
      botReply(msg);
    });
  });

  /* ==========================================================
     PARALLAX ON HERO (mouse-follow) — Desktop only
     ========================================================== */
  var heroSection = $('#hero');
  if (hasFinePointer && heroSection) {
    heroSection.addEventListener('mousemove', function(e) {
      var rect = heroSection.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      var orbs = $$('.mesh-orb');
      orbs.forEach(function(orb, i) {
        var speed = (i + 1) * 12;
        orb.style.transform = 'translate(' + (x * speed) + 'px,' + (y * speed) + 'px)';
      });

      var heroLogo = $('.hero-logo-anim');
      if (heroLogo) {
        heroLogo.style.transform = 'translate(' + (x * -8) + 'px,' + (y * -8) + 'px)';
      }
    });
  }

  /* ==========================================================
     PHASE 3.6: COMMAND PALETTE (Cmd+K / Ctrl+K)
     ========================================================== */
  var cmdPaletteOpen = false;
  var cmdActiveIdx = -1;

  function openCmdPalette() {
    if (cmdPaletteOpen) return;
    cmdPaletteOpen = true;
    cmdModal.classList.add('open');
    cmdModal.setAttribute('aria-hidden', 'false');
    cmdInput.value = '';
    filterCmdItems('');
    cmdActiveIdx = -1;
    body.style.overflow = 'hidden';
    requestAnimationFrame(function() { cmdInput.focus(); });
  }

  function closeCmdPalette() {
    if (!cmdPaletteOpen) return;
    cmdPaletteOpen = false;
    cmdModal.classList.remove('open');
    cmdModal.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    /* Return focus to trigger */
    if (cmdPaletteBtn) cmdPaletteBtn.focus();
  }

  function filterCmdItems(query) {
    var q = query.toLowerCase().trim();
    var items = $$('.cmd-item', cmdResults);
    items.forEach(function(item) {
      var text = item.textContent.toLowerCase();
      if (!q || text.indexOf(q) !== -1) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
    cmdActiveIdx = -1;
  }

  function getVisibleCmdItems() {
    return $$('.cmd-item:not(.hidden)', cmdResults);
  }

  function setCmdActive(idx) {
    var items = getVisibleCmdItems();
    items.forEach(function(item) { item.classList.remove('active'); });
    if (idx >= 0 && idx < items.length) {
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
    cmdActiveIdx = idx;
  }

  if (cmdPaletteBtn) {
    cmdPaletteBtn.addEventListener('click', openCmdPalette);
  }
  if (cmdCloseBtn) {
    cmdCloseBtn.addEventListener('click', closeCmdPalette);
  }

  /* Close on backdrop click */
  if (cmdModal) {
    cmdModal.addEventListener('click', function(e) {
      if (e.target === cmdModal) closeCmdPalette();
    });
  }

  /* Filter as user types */
  if (cmdInput) {
    cmdInput.addEventListener('input', function() {
      filterCmdItems(cmdInput.value);
    });
  }

  /* Keyboard navigation inside palette */
  if (cmdInput) {
    cmdInput.addEventListener('keydown', function(e) {
      var items = getVisibleCmdItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = cmdActiveIdx < items.length - 1 ? cmdActiveIdx + 1 : 0;
        setCmdActive(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = cmdActiveIdx > 0 ? cmdActiveIdx - 1 : items.length - 1;
        setCmdActive(prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (cmdActiveIdx >= 0 && cmdActiveIdx < items.length) {
          items[cmdActiveIdx].click();
        }
      }
    });
  }

  /* Command palette actions */
  if (cmdToggleTheme) {
    cmdToggleTheme.addEventListener('click', function() {
      closeCmdPalette();
      themeToggle.click();
      showToast('info', 'Theme switched to ' + getCurrentTheme() + ' mode.');
    });
  }
  if (cmdOpenChat) {
    cmdOpenChat.addEventListener('click', function() {
      closeCmdPalette();
      openChat();
    });
  }
  if (cmdCopyLink) {
    cmdCopyLink.addEventListener('click', function() {
      closeCmdPalette();
      navigator.clipboard.writeText(window.location.href).then(function() {
        showToast('success', 'Page URL copied to clipboard!');
      }).catch(function() {
        showToast('error', 'Failed to copy URL.');
      });
    });
  }

  /* Navigation items inside palette close it and scroll */
  $$('.cmd-item[href]', cmdResults).forEach(function(link) {
    link.addEventListener('click', function() {
      closeCmdPalette();
    });
  });

  /* ==========================================================
     PHASE 3.6: GLOBAL KEYBOARD SHORTCUTS
     Cmd+K / Ctrl+K → Command Palette
     Escape → Close any modal/drawer/palette
     ========================================================== */
  document.addEventListener('keydown', function(e) {
    /* Cmd+K or Ctrl+K */
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (cmdPaletteOpen) closeCmdPalette();
      else openCmdPalette();
      return;
    }

    /* Escape key — close any open modal/drawer */
    if (e.key === 'Escape') {
      if (cmdPaletteOpen) {
        closeCmdPalette();
        return;
      }
      if (chatOpen) {
        closeChat();
        return;
      }
      if (navLinks.classList.contains('open')) {
        closeMobileNav();
        return;
      }
    }
  });

  /* ==========================================================
     FAQ ACCORDION (if present)
     ========================================================== */
  $$('.faq-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.closest('.faq-item');
      if (!item) return;
      var isOpen = item.classList.contains('open');
      /* Close all others (accordion behavior) */
      $$('.faq-item').forEach(function(fi) { fi.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ==========================================================
     PHASE 4: NETWORK STATUS DETECTION (Offline Resilience)
     ========================================================== */
  window.addEventListener('offline', function() {
    showToast('warning', 'You appear to be offline. Some features may be unavailable.');
  });
  window.addEventListener('online', function() {
    showToast('success', 'You\'re back online!');
  });

  /* ==========================================================
     PHASE 4: CROSS-TAB AUTH SYNC (BroadcastChannel)
     ========================================================== */
  try {
    var authChannel = new BroadcastChannel('akoin_auth_sync');
    authChannel.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'logout') {
        showToast('info', 'You were signed out from another tab.');
        /* In a real app, redirect to login */
      }
    });
    /* Expose for use: window.__akoinAuthChannel = authChannel; */
  } catch(e) {
    /* BroadcastChannel not supported — graceful fallback */
  }

  /* ==========================================================
     PHASE 7: INTERACTIVE NEOBANK SIMULATOR & 3D VIRTUAL CARD
     ========================================================== */
  ;(function initNeobankSimulator() {
    const cardWrapper = $('#card-3d-wrapper');
    const virtualCard = $('#virtual-card');
    const btnFlipCard = $('#btn-flip-card');
    const btnToggleCvv = $('#btn-toggle-cvv');
    const cvvDisplay = $('#cvv-display');
    const btnCopyCard = $('#btn-copy-card');

    let isFlipped = false;
    let isCvvVisible = false;

    // 3D Tilt on Hover / Drag
    if (cardWrapper && virtualCard) {
      cardWrapper.addEventListener('mousemove', function(e) {
        if (isFlipped) return;
        const rect = cardWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotX = -(y / (rect.height / 2)) * 12;
        const rotY = (x / (rect.width / 2)) * 14;
        virtualCard.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      cardWrapper.addEventListener('mouseleave', function() {
        if (isFlipped) {
          virtualCard.style.transform = 'rotateY(180deg)';
        } else {
          virtualCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
      });
    }

    // Flip Card
    if (btnFlipCard && virtualCard) {
      btnFlipCard.addEventListener('click', function(e) {
        e.stopPropagation();
        isFlipped = !isFlipped;
        virtualCard.classList.toggle('is-flipped', isFlipped);
        if (isFlipped) {
          virtualCard.style.transform = 'rotateY(180deg)';
        } else {
          virtualCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        }
      });
    }

    // Toggle CVV
    if (btnToggleCvv && cvvDisplay) {
      btnToggleCvv.addEventListener('click', function(e) {
        e.stopPropagation();
        isCvvVisible = !isCvvVisible;
        cvvDisplay.textContent = isCvvVisible ? '784' : '•••';
        showToast('info', isCvvVisible ? 'CVV revealed (784)' : 'CVV hidden');
      });
    }

    // Copy Card Number
    if (btnCopyCard) {
      btnCopyCard.addEventListener('click', function(e) {
        e.stopPropagation();
        const fullCardNum = '4532 8920 1042 8829';
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fullCardNum).then(function() {
            showToast('success', 'Card number copied: ' + fullCardNum);
          });
        } else {
          showToast('success', 'Card: ' + fullCardNum);
        }
      });
    }

    // --- QUICK TRANSFER & LIVE BALANCE ---
    let currentBalance = 248750.00;
    let totalOutflow = 136250.00;
    const balanceDisplay = $('#live-balance');
    const outflowDisplay = $('#ledger-total-outflow');
    const transferAmountInput = $('#transfer-amount');
    const btnSendTransfer = $('#btn-send-transfer');
    const recipientBtns = $$('.recipient-btn');
    const presetBtns = $$('.preset-btn');

    let selectedRecipient = { name: 'Rohan Sharma', upi: 'rohan@okaxis' };

    // Select Recipient
    recipientBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        recipientBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedRecipient = {
          name: this.dataset.name,
          upi: this.dataset.upi
        };
      });
    });

    // Preset Amount Selectors
    presetBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        presetBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        if (transferAmountInput) {
          transferAmountInput.value = this.dataset.amt;
        }
      });
    });

    if (transferAmountInput) {
      transferAmountInput.addEventListener('input', function() {
        presetBtns.forEach(b => b.classList.remove('active'));
      });
    }

    // --- TRANSACTIONS DATA & LEDGER ---
    const DEFAULT_TRANSACTIONS = [
      { id: 'tx-1', type: 'income', name: 'Razorpay Settlements', note: 'Batch Payout #9482', time: '12m ago', amount: 45000, positive: true },
      { id: 'tx-2', type: 'expense', name: 'AWS Cloud Services', note: 'Monthly Hosting Infrastructure', time: '1h ago', amount: 12450, positive: false },
      { id: 'tx-3', type: 'transfer', name: 'Vendor Payout - Logistics', note: 'BlueDart Air Express', time: '3h ago', amount: 8200, positive: false },
      { id: 'tx-4', type: 'income', name: 'Client Inward Remittance', note: 'TechCorp Europe B.V.', time: 'Yesterday', amount: 120000, positive: true },
      { id: 'tx-5', type: 'expense', name: 'Google Workspace Sub', note: '50 Enterprise Seats', time: '2 days ago', amount: 6500, positive: false }
    ];

    let liveTransactions = [...DEFAULT_TRANSACTIONS];
    const txFeed = $('#transactions-feed');
    const ledgerSearch = $('#ledger-search');
    const filterPills = $$('.filter-pill');
    const btnResetLedger = $('#btn-reset-ledger');

    let currentFilter = 'all';
    let searchQuery = '';

    function renderTransactions() {
      if (!txFeed) return;
      txFeed.innerHTML = '';

      const filtered = liveTransactions.filter(tx => {
        const matchesFilter = currentFilter === 'all' || tx.type === currentFilter;
        const matchesSearch = !searchQuery || 
          tx.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          tx.note.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      });

      if (filtered.length === 0) {
        txFeed.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.85rem;">No matching transactions found.</div>';
        return;
      }

      filtered.forEach(tx => {
        const row = document.createElement('div');
        row.className = 'tx-row';
        const iconSymbol = tx.type === 'income' ? '↓' : tx.type === 'transfer' ? '⇄' : '↑';
        const amtPrefix = tx.positive ? '+₹' : '-₹';
        const amtClass = tx.positive ? 'positive' : 'negative';

        row.innerHTML = `
          <div class="tx-left">
            <div class="tx-icon-wrap ${tx.type}">${iconSymbol}</div>
            <div class="tx-info">
              <h4>${tx.name}</h4>
              <small>${tx.note} • ${tx.time}</small>
            </div>
          </div>
          <div class="tx-right">
            <div class="tx-amount ${amtClass}">${amtPrefix}${tx.amount.toLocaleString('en-IN')}</div>
            <span class="tx-status-pill">Success</span>
          </div>
        `;
        txFeed.appendChild(row);
      });
    }

    renderTransactions();

    // Filter pills
    filterPills.forEach(pill => {
      pill.addEventListener('click', function() {
        filterPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTransactions();
      });
    });

    // Search input
    if (ledgerSearch) {
      ledgerSearch.addEventListener('input', function() {
        searchQuery = this.value.trim();
        renderTransactions();
      });
    }

    // Reset ledger
    if (btnResetLedger) {
      btnResetLedger.addEventListener('click', function() {
        liveTransactions = [...DEFAULT_TRANSACTIONS];
        currentBalance = 248750.00;
        totalOutflow = 136250.00;
        if (balanceDisplay) balanceDisplay.textContent = '₹' + currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (outflowDisplay) outflowDisplay.textContent = '-₹' + totalOutflow.toLocaleString('en-IN');
        currentFilter = 'all';
        searchQuery = '';
        if (ledgerSearch) ledgerSearch.value = '';
        filterPills.forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));
        renderTransactions();
        showToast('info', 'Demo ledger restored to default state.');
      });
    }

    // Send Instant Transfer
    if (btnSendTransfer) {
      btnSendTransfer.addEventListener('click', function() {
        const amount = parseFloat(transferAmountInput ? transferAmountInput.value : 0);
        if (isNaN(amount) || amount <= 0) {
          showToast('error', 'Please enter a valid transfer amount.');
          return;
        }

        if (amount > currentBalance) {
          showToast('error', 'Insufficient funds in Neobank balance.');
          return;
        }

        // Button loading state
        const origText = btnSendTransfer.innerHTML;
        btnSendTransfer.disabled = true;
        btnSendTransfer.innerHTML = '<span>Processing Transfer...</span>';

        setTimeout(() => {
          currentBalance -= amount;
          totalOutflow += amount;

          if (balanceDisplay) {
            balanceDisplay.textContent = '₹' + currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 });
          }
          if (outflowDisplay) {
            outflowDisplay.textContent = '-₹' + totalOutflow.toLocaleString('en-IN');
          }

          // Add transaction to ledger
          const newTx = {
            id: 'tx-' + Date.now(),
            type: 'transfer',
            name: 'Transfer to ' + selectedRecipient.name,
            note: 'UPI: ' + selectedRecipient.upi,
            time: 'Just now',
            amount: amount,
            positive: false
          };

          liveTransactions.unshift(newTx);
          renderTransactions();

          btnSendTransfer.disabled = false;
          btnSendTransfer.innerHTML = origText;

          showToast('success', `Sent ₹${amount.toLocaleString('en-IN')} to ${selectedRecipient.name} successfully! Ref #AK${Math.floor(100000 + Math.random() * 900000)}`);
        }, 600);
      });
    }
  })();

})();

