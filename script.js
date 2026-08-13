/* ============================================================
   AKOIN FINTECH — SCRIPT
   Premium interactions & animations
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

  /* ==========================================================
     PRELOADER
     ========================================================== */
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      body.style.overflow = '';
    }, 2000);
  });
  body.style.overflow = 'hidden';

  /* ==========================================================
     THEME TOGGLE
     ========================================================== */
  const savedTheme = localStorage.getItem('akoin-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('akoin-theme', next);
  });

  /* ==========================================================
     MOBILE NAV
     ========================================================== */
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', String(open));
    body.style.overflow = open ? 'hidden' : '';
  });

  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
    });
  });

  /* ==========================================================
     NAVBAR SCROLL
     ========================================================== */
  let lastScroll = 0;
  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);

    /* Scroll progress */
    const docH = document.documentElement.scrollHeight - window.innerHeight;
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
  const spySections = $$('#hero,#about,#products,#services,#industries,#pricing,#contact');
  const navLinkEls = $$('.nav-link');

  const spyObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinkEls.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  spySections.forEach(s => spyObs.observe(s));

  /* ==========================================================
     SCROLL REVEAL
     ========================================================== */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = e.target.style.getPropertyValue('--delay') || '0s';
        e.target.style.transitionDelay = delay;
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ==========================================================
     ANIMATED COUNTERS
     ========================================================== */
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 50));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current + suffix;
      }, 30);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  $$('.stat-num').forEach(el => counterObs.observe(el));

  /* ==========================================================
     HERO TYPING ANIMATION
     ========================================================== */
  const typedEl = $('#typed-text');
  const words = ['Digital Payments', 'Smart Banking', 'Instant Lending', 'Risk Analytics', 'Business Growth'];
  let wordIdx = 0, charIdx = 0, deleting = false;

  function typeLoop() {
    const word = words[wordIdx];
    if (!deleting) {
      charIdx++;
      typedEl.textContent = word.slice(0, charIdx);
      if (charIdx === word.length) {
        setTimeout(() => { deleting = true; typeLoop(); }, 2000);
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
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const tabId = btn.dataset.tab;
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      const target = $('#tab-' + tabId);
      if (target) target.classList.add('active');
    });
  });

  /* ==========================================================
     TESTIMONIAL CAROUSEL
     ========================================================== */
  const tTrack = $('#testimonial-track');
  const tDotsWrap = $('#tc-dots');
  const tCards = $$('.testimonial-card');
  let tIdx = 0, tAuto;

  function buildDots() {
    tDotsWrap.innerHTML = '';
    tCards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'tc-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', () => goToSlide(i));
      tDotsWrap.appendChild(dot);
    });
  }
  buildDots();

  function goToSlide(i) {
    tIdx = ((i % tCards.length) + tCards.length) % tCards.length;
    tTrack.style.transform = 'translateX(-' + (tIdx * 100) + '%)';
    $$('.tc-dot').forEach((d, j) => d.classList.toggle('active', j === tIdx));
    resetAuto();
  }

  function resetAuto() {
    clearInterval(tAuto);
    tAuto = setInterval(() => goToSlide(tIdx + 1), 6000);
  }
  resetAuto();

  $('.tc-prev').addEventListener('click', () => goToSlide(tIdx - 1));
  $('.tc-next').addEventListener('click', () => goToSlide(tIdx + 1));

  /* ==========================================================
     BACK TO TOP
     ========================================================== */
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ==========================================================
     3D TILT EFFECT ON CARDS
     ========================================================== */
  $$('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -5;
      const rotateY = ((x - cx) / cx) * 5;
      card.style.transform = 'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ==========================================================
     BUTTON RIPPLE EFFECT
     ========================================================== */
  $$('.btn-ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ==========================================================
     CONTACT FORM
     ========================================================== */
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const feedback = $('#form-feedback');
    const name = $('#c-name').value.trim();
    const email = $('#c-email').value.trim();

    if (!name || !email) {
      feedback.textContent = 'Please fill in your name and email.';
      feedback.className = 'form-feedback error';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.textContent = 'Please enter a valid email address.';
      feedback.className = 'form-feedback error';
      return;
    }

    feedback.textContent = 'Thank you, ' + name + '! We\'ll be in touch within 24 hours.';
    feedback.className = 'form-feedback success';
    contactForm.reset();
  });

  /* ==========================================================
     NEWSLETTER FORM
     ========================================================== */
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#nl-email');
    if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) return;
    const btn = newsletterForm.querySelector('button');
    const orig = btn.textContent;
    btn.textContent = 'Subscribed!';
    btn.disabled = true;
    input.value = '';
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
  });

  /* ==========================================================
     CHATBOT
     ========================================================== */
  let chatOpen = false;

  chatToggle.addEventListener('click', () => {
    chatOpen = !chatOpen;
    chatWindow.classList.toggle('open', chatOpen);
    chatToggle.setAttribute('aria-expanded', String(chatOpen));
    if (chatOpen && chatMessages.children.length === 0) {
      addBotMessage('Hi there! 👋 Welcome to Akoin Fintech. How can I help you today?');
    }
  });

  function addBotMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot';
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping() {
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot typing';
    msg.id = 'typing-indicator';
    msg.innerHTML = '<span class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTyping() {
    const t = $('#typing-indicator');
    if (t) t.remove();
  }

  function botReply(userText) {
    const text = userText.toLowerCase();
    showTyping();
    setTimeout(() => {
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

  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = '';
    botReply(text);
  });

  /* Quick reply chips */
  $$('.quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      addUserMessage(msg);
      botReply(msg);
    });
  });

  /* ==========================================================
     PARALLAX ON HERO (mouse-follow)
     ========================================================== */
  const heroSection = $('#hero');
  heroSection.addEventListener('mousemove', e => {
    const { width, height, left, top } = heroSection.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;

    const orbs = $$('.mesh-orb');
    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 12;
      orb.style.transform = 'translate(' + (x * speed) + 'px,' + (y * speed) + 'px)';
    });

    const heroLogo = $('.hero-logo-anim');
    if (heroLogo) {
      heroLogo.style.transform = 'translate(' + (x * -8) + 'px,' + (y * -8) + 'px)';
    }
  });

})();
