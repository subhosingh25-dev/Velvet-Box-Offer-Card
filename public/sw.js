// VelvetBoxs Ultra-Reliable Service Worker for Scheduled, Periodic, Offline & Background Notifications

const FUNNY_HINGLISH_JOKES = [
  {
    title: "Crush nahi hai jo ignore karoge! 😜",
    body: "Bhai 50% discount wait kar raha hai! Jaldi order karo coupon code use karke. 💍"
  },
  {
    title: "Mummy ki bargaining se bhi zyada discount! 😂",
    body: "Flat 50% OFF mil raha hai VelvetBoxs pe! Mauka haath se mat jaane do."
  },
  {
    title: "Shona ko gift kab de rahe ho? 🎁",
    body: "50% OFF chal raha hai, baad me mehenga padega toh mat bolna! 🏃‍♂️"
  },
  {
    title: "Padosi ko mat batana! 🤫",
    body: "Chupke se apna 50% discount jewellery order kar lo. Exclusive deal zindabad!"
  },
  {
    title: "5-Star hotel ki chai se sasta discount! ☕",
    body: "Itna bhari 50% off chhoot gaya toh bohot pachtaoge dost! ⏳"
  },
  {
    title: "Dost ko batane se pehle khud le lo! 🏃‍♂️💨",
    body: "VelvetBoxs ka 50% OFF offer timer chal raha hai! Abhi claim karo."
  },
  {
    title: "Zindagi me mauke baar baar nahi aate! 💎",
    body: "Arey abhi bhi soch rahe ho? 50% discount code active hai, tap karke khareedo!"
  }
];

const DB_NAME = 'VelvetBoxsNotificationsDB';
const DB_VERSION = 1;
const STORE_NAME = 'offer_state';

// IndexedDB Helper for persistent storage across browser terminations and device reboots
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveOfferToDB(offerData) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: 'active_offer', ...offerData, updatedAt: Date.now() });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('IDB Save Error in SW:', e);
  }
}

async function getOfferFromDB() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('active_offer');
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

let inMemoryOffer = null;
let intervalId = null;
let jokeIndex = 0;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      getOfferFromDB().then((offer) => {
        if (offer) {
          inMemoryOffer = offer;
          startIntervalTimer();
          scheduleFutureNotifications(offer);
        }
      })
    ])
  );
});

// Schedule future OS-level notifications if TimestampTrigger is supported
async function scheduleFutureNotifications(offer) {
  if (!('showTrigger' in Notification.prototype) || typeof TimestampTrigger === 'undefined') {
    return;
  }

  const baseNow = Date.now();
  const intervalsMinutes = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];

  for (let i = 0; i < intervalsMinutes.length; i++) {
    const delayMinutes = intervalsMinutes[i];
    const triggerTime = baseNow + delayMinutes * 60 * 1000;
    const joke = FUNNY_HINGLISH_JOKES[i % FUNNY_HINGLISH_JOKES.length];
    let body = joke.body;
    if (offer && offer.code && !body.includes(offer.code)) {
      body += ` (Code: ${offer.code})`;
    }

    try {
      await self.registration.showNotification(joke.title, {
        body: body,
        icon: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
        badge: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
        vibrate: [400, 150, 400, 150, 400],
        tag: `velvetboxs-scheduled-${delayMinutes}m`,
        renotify: true,
        requireInteraction: true,
        showTrigger: new TimestampTrigger(triggerTime),
        data: {
          url: (offer && offer.url) ? offer.url : '/',
          scheduledFor: triggerTime
        }
      });
    } catch (e) {
      console.log('TimestampTrigger scheduling error:', e);
    }
  }
}

// Trigger native phone system notification into device notification bar
async function triggerDeviceNotification(customTitle, customBody, explicitOffer) {
  const offer = explicitOffer || inMemoryOffer || (await getOfferFromDB());
  const joke = FUNNY_HINGLISH_JOKES[jokeIndex % FUNNY_HINGLISH_JOKES.length];
  jokeIndex++;

  const title = customTitle || joke.title;
  let body = customBody || joke.body;

  if (offer && offer.code && !body.includes(offer.code)) {
    body += ` (Code: ${offer.code})`;
  }

  // Update last notification time in DB
  if (offer) {
    saveOfferToDB({ ...offer, lastNotifTime: Date.now() });
  }

  const notificationOptions = {
    body: body,
    icon: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
    badge: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
    vibrate: [400, 150, 400, 150, 400],
    tag: 'velvetboxs-deal-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    silent: false,
    actions: [
      { action: 'claim', title: '🎁 Claim 50% OFF' },
      { action: 'open', title: '👀 View Deal' }
    ],
    data: {
      url: (offer && offer.url) ? offer.url : '/',
      timestamp: Date.now()
    }
  };

  return self.registration.showNotification(title, notificationOptions);
}

function startIntervalTimer() {
  if (intervalId) clearInterval(intervalId);
  // Send notification every 5 minutes (300,000 ms)
  intervalId = setInterval(() => {
    triggerDeviceNotification();
  }, 5 * 60 * 1000);
}

// Check if 5 minutes have elapsed since the last notification
async function checkAndSendPeriodicNotification() {
  const offer = inMemoryOffer || (await getOfferFromDB());
  if (!offer) return;

  const now = Date.now();
  const lastTime = offer.lastNotifTime || 0;
  const FIVE_MINUTES = 5 * 60 * 1000;

  if (now - lastTime >= FIVE_MINUTES) {
    await triggerDeviceNotification(null, null, offer);
  }
}

// Listen to messages from App.tsx
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'START_BACKGROUND_NOTIFICATIONS') {
    const offer = event.data.offer;
    if (offer) {
      inMemoryOffer = offer;
      saveOfferToDB({ ...offer, lastNotifTime: Date.now() });
      scheduleFutureNotifications(offer);
    }

    if (event.data.immediate) {
      triggerDeviceNotification(
        event.data.title || "🎉 50% OFF Unlocked! Mauka mat chhodna!",
        event.data.body || (offer ? `"${offer.productName}" pe 50% discount active ho gaya hai! Use Code: ${offer.code}` : undefined),
        offer
      );
    }

    startIntervalTimer();
  }

  if (event.data.type === 'ONLINE_TRIGGER') {
    triggerDeviceNotification(
      "🌐 Arey waah, Internet ON ho gaya! 😜",
      "Phone chala hi rahe ho toh fatafat VelvetBoxs pe 50% discount claim karlo! Mauka mat jaane do 🏃‍♂️💨"
    );
  }

  if (event.data.type === 'CHECK_NOTIFICATION') {
    checkAndSendPeriodicNotification();
  }
});

// Periodic background sync (available in Chrome/Android PWA)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'velvetboxs-offer-reminder' || event.tag === 'velvetboxs-5min-sync') {
    event.waitUntil(checkAndSendPeriodicNotification());
  }
});

// Sync event (fires when connectivity is restored or background sync fires)
self.addEventListener('sync', (event) => {
  if (event.tag === 'velvetboxs-online-sync' || event.tag === 'velvetboxs-reminder-sync') {
    event.waitUntil(
      triggerDeviceNotification(
        "🌐 Internet Connected! Deal Alert 🎁",
        "Aapka 50% off coupon code active hai! Jaldi se apna favourite jewellery book karo."
      )
    );
  }
});

// Intercept fetch requests: Wakes up the SW when any network traffic occurs
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );

  event.waitUntil(checkAndSendPeriodicNotification());
});

// Push event fallback if web push is sent
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  event.waitUntil(
    triggerDeviceNotification(
      data.title || "🎁 VelvetBoxs 50% OFF Surprise!",
      data.body || undefined
    )
  );
});

// Notification Click Handler - Focuses window or opens product URL in browser
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
