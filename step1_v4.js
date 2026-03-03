// step1_v4.js - TURBO VERSION with TOGGLEABLE LINK DELETION
// Features:
// 1. Configurable DELETE_LINKS variable
// 2. If TRUE: Deletes link from Firebase after fetch
// 3. If FALSE: Tracks used links locally (sessionStorage)
// 4. Fast redirect after fetch
(function() {
    'use strict';

    if (window.__step1Running) return;
    window.__step1Running = true;

    // ============================================
    // ⚙️ CONFIGURATION - SET YOUR PREFERENCE HERE
    // ============================================
    const DELETE_LINKS = true;  // true = DELETE from DB | false = TRACK locally only
    
    const DB_URL = "https://craxlinks-bb690-default-rtdb.firebaseio.com/links.json";

    // ============================================
    // LOCAL STORAGE HELPERS (for tracking mode)
    // ============================================
    const STORAGE_KEY = '__craxUsedLinks';
    
    function getUsedLinks() {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) { 
            return []; 
        }
    }

    function saveUsedLink(link) {
        try {
            const used = getUsedLinks();
            used.push(link);
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(used));
            console.log(`[Step1] 📝 Tracked locally (${used.length} total)`);
        } catch (e) {}
    }

    function clearUsedLinks() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            console.log('[Step1] 🗑️ Cleared local tracking');
        } catch (e) {}
    }

    // ============================================
    // DELETE LINK FROM FIREBASE (deletion mode)
    // ============================================
    async function deleteLinkFromDB(linkToDelete) {
        try {
            // First, get all links to find the key
            const response = await fetch(DB_URL);
            if (!response.ok) {
                console.log('[Step1] ⚠️ Cannot fetch for deletion');
                return false;
            }

            const data = await response.json();
            
            if (!data || typeof data !== 'object') {
                console.log('[Step1] ⚠️ No object data to delete from');
                return false;
            }

            // Find and delete the specific link
            let deleted = false;
            for (const [key, value] of Object.entries(data)) {
                // Handle multiple formats
                const linkValue = typeof value === 'object' ? value.url : value;
                
                if (linkValue === linkToDelete) {
                    const deleteUrl = `https://craxlinks-bb690-default-rtdb.firebaseio.com/links/${key}.json`;
                    const deleteResponse = await fetch(deleteUrl, {
                        method: 'DELETE'
                    });
                    
                    if (deleteResponse.ok) {
                        console.log(`[Step1] 🗑️ DELETED from DB: ${linkToDelete.substring(0, 50)}...`);
                        deleted = true;
                    } else {
                        console.log('[Step1] ⚠️ Delete failed (permission denied?)');
                    }
                    break;
                }
            }

            return deleted;
        } catch (e) {
            console.log('[Step1] 💥 Delete error:', e.message);
            return false;
        }
    }

    // ============================================
    // FIND NEXT UNUSED LINK (for tracking mode)
    // ============================================
    function findNextUnusedLink(links) {
        const usedLinks = getUsedLinks();
        
        for (const link of links) {
            if (link && !usedLinks.includes(link)) {
                return link;
            }
        }
        
        return null;
    }

    // ============================================
    // MAIN FETCH & REDIRECT LOGIC
    // ============================================
    async function fetchAndRedirect() {
        const modeText = DELETE_LINKS ? 'DELETE MODE' : 'TRACK MODE';
        console.log(`[Step1] 🚀 Fetching link (${modeText})...`);

        try {
            const response = await fetch(DB_URL, { cache: 'no-cache' });
            if (!response.ok) { 
                console.log('[Step1] ❌ Fetch failed'); 
                return; 
            }

            const data = await response.json();
            let links = [];

            // Parse different data formats
            if (typeof data === 'string') {
                links = data.trim().split(/\s+/).filter(l => l.startsWith('http'));
            } else if (Array.isArray(data)) {
                // Handle array format: ["url1", "url2", ...]
                links = data.filter(l => l && l.startsWith('http'));
            } else if (data && typeof data === 'object') {
                // Handle object format: {"-NXxx": "url1", "-NYyy": "url2"}
                // or {"-NXxx": {"url": "url1"}, ...}
                links = Object.entries(data).map(([key, value]) => {
                    if (typeof value === 'string' && value.startsWith('http')) {
                        return value;
                    } else if (typeof value === 'object' && value.url) {
                        return value.url;
                    }
                    return null;
                }).filter(l => l);
            }

            if (!links.length) { 
                console.log('[Step1] ⚠️ No links available'); 
                return; 
            }

            console.log(`[Step1] 📊 Total links in DB: ${links.length}`);

            let targetLink = null;

            // ============================================
            // MODE: DELETE FROM DB
            // ============================================
            if (DELETE_LINKS) {
                // Get the FIRST link (FIFO - First In First Out)
                targetLink = links[0];
                console.log(`[Step1] ✅ Found (FIFO): ${targetLink.substring(0, 60)}...`);
                
                // DELETE THE LINK FROM DATABASE
                const deleted = await deleteLinkFromDB(targetLink);
                
                if (deleted) {
                    console.log('[Step1] ✅ Link removed from DB');
                    console.log(`[Step1] 📊 Links remaining in DB: ${links.length - 1}`);
                } else {
                    console.log('[Step1] ⚠️ Delete failed, proceeding anyway...');
                }
            }
            // ============================================
            // MODE: TRACK LOCALLY (no deletion)
            // ============================================
            else {
                // Find next unused link
                targetLink = findNextUnusedLink(links);
                
                if (!targetLink) {
                    console.log('[Step1] ⚠️ All links used, clearing local tracker...');
                    clearUsedLinks();
                    return;
                }
                
                console.log(`[Step1] ✅ Found (unused): ${targetLink.substring(0, 60)}...`);
                
                // Track this link locally
                saveUsedLink(targetLink);
                
                const usedLinks = getUsedLinks();
                console.log(`[Step1] 📊 Progress: ${usedLinks.length}/${links.length} links processed`);
            }

            // FAST REDIRECT - only 500ms
            setTimeout(() => {
                console.log('[Step1] → Redirecting now!');
                window.location.href = targetLink;
            }, 500);

        } catch (e) {
            console.log('[Step1] 💥 Error:', e.message);
        }
    }

    // Start immediately - no delay
    fetchAndRedirect();
})();
