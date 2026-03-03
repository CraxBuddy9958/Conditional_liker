// step1_v4.js - TURBO VERSION with TOGGLEABLE LINK DELETION
(function() {
    'use strict';

    if (window.__step1Running) return;
    window.__step1Running = true;

    // ============================================
    // ⚙️ CONFIG - true = DELETE | false = TRACK
    // ============================================
    const DELETE_LINKS = true;
    
    const DB_URL = "https://craxlinks-bb690-default-rtdb.firebaseio.com/links.json";

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

    async function deleteLinkFromDB(linkToDelete) {
        try {
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

            let deleted = false;
            for (const [key, value] of Object.entries(data)) {
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

            // Handle string format (space-separated URLs)
            if (!deleted && typeof data === 'string') {
                const deleteResponse = await fetch(DB_URL, {
                    method: 'PUT',
                    body: JSON.stringify('')
                });
                if (deleteResponse.ok) {
                    console.log('[Step1] 🗑️ DELETED string data from DB');
                    deleted = true;
                }
            }

            return deleted;
        } catch (e) {
            console.log('[Step1] 💥 Delete error:', e.message);
            return false;
        }
    }

    function findNextUnusedLink(links) {
        const usedLinks = getUsedLinks();
        
        for (const link of links) {
            if (link && !usedLinks.includes(link)) {
                return link;
            }
        }
        
        return null;
    }

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

            // Parse string format (space-separated)
            if (typeof data === 'string') {
                links = data.trim().split(/\s+/).filter(l => l.startsWith('http'));
            } else if (Array.isArray(data)) {
                links = data.filter(l => l && l.startsWith('http'));
            } else if (data && typeof data === 'object') {
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

            if (DELETE_LINKS) {
                targetLink = links[0];
                console.log(`[Step1] ✅ Found (FIFO): ${targetLink.substring(0, 60)}...`);
                
                const deleted = await deleteLinkFromDB(targetLink);
                
                if (deleted) {
                    console.log('[Step1] ✅ Link removed from DB');
                    console.log(`[Step1] 📊 Links remaining in DB: ${links.length - 1}`);
                } else {
                    console.log('[Step1] ⚠️ Delete failed, proceeding anyway...');
                }
            } else {
                targetLink = findNextUnusedLink(links);
                
                if (!targetLink) {
                    console.log('[Step1] ⚠️ All links used, clearing local tracker...');
                    clearUsedLinks();
                    return;
                }
                
                console.log(`[Step1] ✅ Found (unused): ${targetLink.substring(0, 60)}...`);
                saveUsedLink(targetLink);
                
                const usedLinks = getUsedLinks();
                console.log(`[Step1] 📊 Progress: ${usedLinks.length}/${links.length} links processed`);
            }

            setTimeout(() => {
                console.log('[Step1] → Redirecting now!');
                window.location.href = targetLink;
            }, 500);

        } catch (e) {
            console.log('[Step1] 💥 Error:', e.message);
        }
    }

    fetchAndRedirect();
})();
