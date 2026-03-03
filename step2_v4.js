// step2_v4.js - TURBO VERSION
(function() {
    'use strict';

    if (!/https:\/\/craxpro\.to\/threads\//.test(window.location.href)) return;
    if (window.__step2Running) return;
    window.__step2Running = true;

    console.log('[Step2] 🚀 TURBO Like mode...');

    const LIKE_SELECTOR = 'a.reaction[data-reaction-id="1"]';
    let found = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 15;
    const RETRY_INTERVAL = 200;

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

        if (btn.classList.contains('is-active')) {
            console.log("[Step2] ⏭️ Already liked, next!");
        } else {
            btn.click();
            console.log("[Step2] 👍 LIKED!");
        }

        console.log("[Step2] → Next!");
        window.location.href = "https://craxpro.to";
    }

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

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(findAndClickLike, 200);
})();
