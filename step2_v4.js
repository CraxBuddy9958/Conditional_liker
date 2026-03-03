// step2_v4.js - TURBO VERSION
// Features:
// 1. Faster button detection with MutationObserver
// 2. Instant redirect after like
// 3. No unnecessary retries
(function() {
    'use strict';

    if (!/https:\/\/craxpro\.to\/threads\//.test(window.location.href)) return;
    if (window.__step2Running) return;
    window.__step2Running = true;

    console.log('[Step2] 🚀 TURBO Like mode...');

    const LIKE_SELECTOR = 'a.reaction[data-reaction-id="1"]';
    let found = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 15;  // Quick fail
    const RETRY_INTERVAL = 200;  // Fast retry

    // ============================================
    // FAST BUTTON FINDER with MutationObserver
    // ============================================
    function findAndClickLike() {
        if (found) return;

        attempts++;
        const btn = document.querySelector(LIKE_SELECTOR);

        if (!btn) {
            if (attempts < MAX_ATTEMPTS) {
                setTimeout(findAndClickLike, RETRY_INTERVAL);
            } else {
                console.log("[Step2] ❌ No button found, redirecting...");
                window.location.href = "https://craxpro.to";
            }
            return;
        }

        found = true;
        console.log("[Step2] ✔ Found button!");

        // Check if already liked
        if (btn.classList.contains('is-active')) {
            console.log("[Step2] ⏭️ Already liked, next!");
        } else {
            btn.click();
            console.log("[Step2] 👍 LIKED!");
        }

        // INSTANT REDIRECT - no delay
        console.log("[Step2] → Next!");
        window.location.href = "https://craxpro.to";
    }

    // ============================================
    // MUTATION OBSERVER for faster detection
    // ============================================
    const observer = new MutationObserver((mutations) => {
        if (found) {
            observer.disconnect();
            return;
        }
        
        const btn = document.querySelector(LIKE_SELECTOR);
        if (btn) {
            observer.disconnect();
            findAndClickLike();
        }
    });

    // Start observing for dynamic content
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also try immediately and with quick retries
    setTimeout(findAndClickLike, 200);  // Start very quickly
})();
