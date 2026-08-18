// VelvetBoxs Service Worker for Background, Periodic & Offline-to-Online Notifications
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

let activeOffer = null;
let intervalId = null;
let jokeIndex = 0;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Function to trigger native background notification with rotating funny joke
function sendFunnyOfferNotification(customTitle, customBody) {
  const joke = FUNNY_HINGLISH_JOKES[jokeIndex % FUNNY_HINGLISH_JOKES.length];
  jokeIndex++;

  const title = customTitle || joke.title;
  let body = customBody || joke.body;

  if (activeOffer && activeOffer.code && !body.includes(activeOffer.code)) {
    body += ` (Code: ${activeOffer.code})`;
  }

  return self.registration.showNotification(title, {
    body: body,
    icon: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
    badge: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: 'velvetboxs-funny-deal-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'claim', title: '🎁 Claim 50% OFF' },
      { action: 'open', title: '👀 View Deal' }
    ],
    data: {
      url: (activeOffer && activeOffer.url) ? activeOffer.url : '/'
    }
  });
}

// Listen to messages from App.tsx
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'START_BACKGROUND_NOTIFICATIONS') {
    activeOffer = event.data.offer || activeOffer;

    // Send immediate funny notification
    if (event.data.immediate) {
      sendFunnyOfferNotification(
        event.data.title || "🎉 50% OFF Unlocked! Mauka mat chhodna!",
        event.data.body || (activeOffer ? `"${activeOffer.productName}" pe 50% discount active ho gaya hai! Use Code: ${activeOffer.code}` : undefined)
      );
    }

    // Set repeating interval (every 5 minutes = 300,000 ms)
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      sendFunnyOfferNotification();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  if (event.data.type === 'ONLINE_TRIGGER') {
    sendFunnyOfferNotification(
      "🌐 Arey waah, Internet ON ho gaya!",
      "Phone chala hi rahe ho toh fatafat VelvetBoxs ka 50% discount claim karlo! 😜💨"
    );
  }
});

// Periodic background sync if available on mobile Chrome/Android
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'velvetboxs-offer-reminder') {
    event.waitUntil(sendFunnyOfferNotification());
  }
});

// Sync event (fires when connectivity is restored or background sync is triggered)
self.addEventListener('sync', (event) => {
  if (event.tag === 'velvetboxs-online-sync') {
    event.waitUntil(
      sendFunnyOfferNotification(
        "🌐 Internet Connected! Deal Alert 🎁",
        "Aapka 50% off coupon code active hai! Jaldi se apna favourite jewellery book karo."
      )
    );
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
