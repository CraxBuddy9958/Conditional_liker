# 🚀 TURBO EDITION - Optimization Summary

## What Changed?

### ⏱️ Timing Improvements

| Component | Old Value | New Value | Speed Gain |
|-----------|-----------|-----------|------------|
| Main loop check | 60 seconds | 10 seconds | 6x faster |
| Step1 initial delay | 500ms | 0ms | Instant |
| Step1 redirect delay | 1000ms | 500ms | 2x faster |
| Step2 initial delay | 800ms | 200ms | 4x faster |
| Step2 retry interval | 300ms | 200ms | 1.5x faster |
| Page wait condition | networkidle2 | domcontentloaded | ~3x faster |
| Inject script delay | 1500ms | 500ms | 3x faster |
| Idle timeout | 3 minutes | 1 minute | Faster recovery |

### 🔥 New Features

1. **Link Deletion** (step1_v4.js)
   - Fetches link from Firebase
   - **DELETES the link immediately from DB**
   - Redirects to the fetched link
   - No duplicate processing!

2. **Parallel Processing** (run.js)
   - Run multiple accounts simultaneously
   - Configurable `MAX_CONCURRENT_PAGES`
   - Block images/styles/fonts for speed

3. **MutationObserver** (step2_v4.js)
   - Detects like button instantly when DOM changes
   - No polling delays

4. **Resource Blocking** (run.js)
   - Blocks images, CSS, fonts, media
   - Significantly faster page loads

### 📊 Expected Performance

| Metric | Old | New (Estimated) |
|--------|-----|-----------------|
| Cycles per hour | ~100 | ~300-400+ |
| 364 links processing | ~3.6 hours | ~1 hour or less |
| Links per minute | ~1.7 | ~5-7 |

---

## 📁 Files Created

```
/home/z/my-project/download/optimized/
├── run.js          # Main bot (v3.0 TURBO)
├── step1_v4.js     # Fetch & DELETE mode
├── step2_v4.js     # Fast like detection
└── scheduler.js    # Updated scheduler
```

---

## 🚀 How to Use

### 1. Copy the files to your repo:

```bash
# Replace your existing files
cp run.js /path/to/your/repo/
cp step1_v4.js /path/to/your/repo/
cp step2_v4.js /path/to/your/repo/
```

### 2. Update step1_v4.js DB URL if needed:

```javascript
const DB_URL = "https://craxlinks-bb690-default-rtdb.firebaseio.com/links.json";
```

### 3. Run the bot:

```bash
node run.js
# OR use the scheduler
node scheduler.js
```

---

## ⚙️ Configuration Options

In `run.js`, adjust these settings:

```javascript
const CONFIG = {
    // Timing
    ONE_HOUR_MS: 60 * 60 * 1000,
    RESTART_DELAY_MS: 2000,        // Faster restart
    MAX_RESTARTS: 10,               // More retries
    IDLE_TIMEOUT_MS: 60 * 1000,     // 1 min idle timeout
    PAGE_TIMEOUT: 30000,            // 30s page timeout
    MAIN_LOOP_INTERVAL: 10000,      // Check every 10s

    // Execution Mode
    PARALLEL_ACCOUNTS: true,        // Enable parallel
    MAX_CONCURRENT_PAGES: 3,        // Adjust based on RAM

    // 🔥 LINK DELETION MODE 🔥
    // true  = Delete links from Firebase after fetching (no duplicates)
    // false = Track used links locally only (keep all links in DB)
    DELETE_LINKS: true,             // <-- CHANGE THIS TO TOGGLE MODE
};
```

### DELETE_LINKS Modes Explained

| Setting | Behavior |
|---------|----------|
| `DELETE_LINKS: true` | **DELETE MODE** - Links are removed from Firebase after fetch. No duplicates possible. Best for single bot instance. |
| `DELETE_LINKS: false` | **TRACK MODE** - Links stay in Firebase. Bot tracks used links in sessionStorage. Good for multiple bot instances sharing same DB. |

---

## ⚠️ Important Notes

### Link Deletion Feature (Configurable!)
Set `DELETE_LINKS: true` or `DELETE_LINKS: false` in `run.js` CONFIG:

**DELETE_MODE (true):**
- ✅ No duplicate processing
- ✅ Clear progress tracking in DB
- ⚠️ Links are permanently removed from Firebase
- ⚠️ If bot crashes, that link is lost

**TRACK_MODE (false):**
- ✅ Links stay in Firebase (good for multiple bots)
- ✅ Tracks used links in sessionStorage
- ⚠️ sessionStorage clears on browser close
- ⚠️ Multiple bots may process same links

### Firebase Structure Support
The deletion code handles multiple formats:
```javascript
// Array format
["url1", "url2"]

// Object format (key-value)
{"-NXxx": "url1", "-NYyy": "url2"}

// Object format (nested)
{"-NXxx": {"url": "url1"}}
```

### Resource Blocking
Images, CSS, fonts, and media are blocked for speed.
If the site breaks, comment out this section in `run.js`:
```javascript
// Comment out if site breaks
await page.setRequestInterception(true);
page.on('request', (req) => { ... });
```

---

## 🔧 Troubleshooting

### Bot not finding links?
- Check Firebase URL is correct
- Check Firebase rules allow DELETE
- Check console for errors

### Too many restarts?
- Increase `MAX_RESTARTS`
- Check network connectivity
- Check if site is blocking requests

### Running out of memory?
- Reduce `MAX_CONCURRENT_PAGES` to 1 or 2
- Close other applications

---

## 📈 Monitoring Progress

The bot now shows real-time stats:
```
[runner] ✅ Cycle #45 | Total: 45 | Speed: 320/hr
```

---

## 🆚 Comparison: Old vs New

### Old Flow:
```
Page Load (3s) → Wait (1.5s) → Fetch Link → Wait (1s) → Redirect
→ Page Load (3s) → Wait (1.5s) → Find Like → Wait (0.8s) → Click
→ Wait (0.5s) → Redirect → Total: ~11s per cycle
```

### New Flow:
```
Page Load (1s) → Fetch & DELETE → Wait (0.5s) → Redirect
→ Page Load (1s) → Find Like (instant) → Click → Redirect
→ Total: ~3-4s per cycle
```

**Speed improvement: ~3x faster!**
