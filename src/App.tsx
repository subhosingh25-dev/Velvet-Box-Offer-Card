/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScratchCard } from './components/ScratchCard';
import { BrandLogo } from './components/BrandLogo';
import { Gift, Clock, Bell, Sparkles, X, Check, Share2 } from 'lucide-react';
import { PRODUCTS } from './data/products';
import { motion, AnimatePresence } from 'motion/react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Hilarious Hinglish notification jokes and urgency lines
const FUNNY_HINGLISH_NOTIFICATIONS = [
  {
    title: "Crush nahi hai jo ignore karoge! 😜",
    body: "Bhai 50% discount wait kar raha hai! Jaldi order karo coupon code use karke. 💍",
  },
  {
    title: "Mummy ki bargaining se bhi zyada discount! 😂",
    body: "Flat 50% OFF mil raha hai VelvetBoxs pe! Mauka haath se mat jaane do.",
  },
  {
    title: "Shona ko gift kab de rahe ho? 🎁",
    body: "50% OFF chal raha hai, baad me mehenga padega toh mat bolna! 🏃‍♂️",
  },
  {
    title: "Padosi ko mat batana! 🤫",
    body: "Chupke se apna 50% discount jewellery order kar lo. Exclusive deal zindabad!",
  },
  {
    title: "5-Star hotel ki chai se sasta discount! ☕",
    body: "Itna bhari 50% off chhoot gaya toh bohot pachtaoge dost! ⏳",
  },
  {
    title: "Dost ko batane se pehle khud le lo! 🏃‍♂️💨",
    body: "VelvetBoxs ka 50% OFF offer timer chal raha hai! Abhi claim karo.",
  },
  {
    title: "Zindagi me mauke baar baar nahi aate! 💎",
    body: "Arey abhi bhi soch rahe ho? 50% discount code active hai, tap karke khareedo!",
  },
];

export default function App() {
  // Select a random product on first visit and save its ID in localStorage
  // This guarantees device persistence - one time open per device, they keep their offer!
  const [assignedProduct] = useState(() => {
    try {
      const savedId = localStorage.getItem('velvet_assigned_product_id');
      const found = PRODUCTS.find((p) => p.id === savedId);
      if (found) return found;

      // Select random item
      const randomIndex = Math.floor(Math.random() * PRODUCTS.length);
      const chosen = PRODUCTS[randomIndex];
      localStorage.setItem('velvet_assigned_product_id', chosen.id);
      return chosen;
    } catch (e) {
      // Fallback if localStorage fails
      return PRODUCTS[0];
    }
  });

  // Track whether the scratch card has been revealed
  const [isCardRevealed, setIsCardRevealed] = useState(() => {
    try {
      return localStorage.getItem('velvet_scratch_card_revealed') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Track the offer's expiry time (5 days from scratch reveal)
  const [expiryTime, setExpiryTime] = useState<number | null>(() => {
    try {
      const savedExpiry = localStorage.getItem('velvet_offer_expiry');
      if (savedExpiry) {
        return parseInt(savedExpiry, 10);
      }
      
      // If card was already scratched/revealed but expiry wasn't set, initialize it
      const alreadyRevealed = localStorage.getItem('velvet_scratch_card_revealed') === 'true';
      if (alreadyRevealed) {
        const fiveDays = Date.now() + 5 * 24 * 60 * 60 * 1000;
        localStorage.setItem('velvet_offer_expiry', fiveDays.toString());
        return fiveDays;
      }
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }
    return null;
  });

  // Track human-readable time remaining
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  // Track app push-style notification visibility
  const [showNotification, setShowNotification] = useState(false);

  // Track dynamic toast content with funny Hinglish jokes
  const [toastMessage, setToastMessage] = useState(() => ({
    title: "Crush nahi hai jo ignore karoge! 😜",
    body: `Bhai 50% discount wait kar raha hai! Jaldi order karo coupon code use karke. 💍`
  }));

  // Track share feedback toast
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Track native browser permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  // Register service worker on mount for native phone notification delivery and background tasking
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(async (reg) => {
          console.log('Service Worker registered successfully:', reg);
          
          // Register Periodic Sync if supported by mobile Chrome/PWA
          if ('periodicSync' in reg) {
            try {
              await (reg as any).periodicSync.register('velvetboxs-offer-reminder', {
                minInterval: 5 * 60 * 1000,
              });
            } catch (e) {
              console.log('Periodic sync registration optional:', e);
            }
          }

          // Register Background Sync for offline-to-online triggers
          if ('sync' in reg) {
            try {
              await (reg as any).sync.register('velvetboxs-online-sync');
            } catch (e) {}
          }

          const alreadyRevealed = isCardRevealed || localStorage.getItem('velvet_scratch_card_revealed') === 'true';
          if (alreadyRevealed) {
            navigator.serviceWorker.ready.then((readyReg) => {
              if (readyReg.active) {
                readyReg.active.postMessage({
                  type: 'START_BACKGROUND_NOTIFICATIONS',
                  offer: {
                    productName: assignedProduct.name,
                    code: assignedProduct.code,
                    url: assignedProduct.url
                  },
                  immediate: false
                });
              }
            });
          }
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    }
  }, [isCardRevealed, assignedProduct]);

  // Setup live countdown interval
  useEffect(() => {
    if (!expiryTime) return;

    const calculateTimeLeft = (): TimeLeft => {
      const difference = expiryTime - Date.now();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Set immediately
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (expiryTime <= Date.now()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  // Show internal app notification when page loads if offer is already active
  useEffect(() => {
    if (expiryTime && expiryTime > Date.now()) {
      const timeout = setTimeout(() => {
        const randomJoke = FUNNY_HINGLISH_NOTIFICATIONS[Math.floor(Math.random() * FUNNY_HINGLISH_NOTIFICATIONS.length)];
        setToastMessage({
          title: randomJoke.title,
          body: `${randomJoke.body} (Code: ${assignedProduct.code})`
        });
        setShowNotification(true);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [expiryTime, assignedProduct]);

  // Periodic reminder: Send funny notifications every 5 minutes (300,000 ms)
  useEffect(() => {
    const alreadyRevealed = isCardRevealed || localStorage.getItem('velvet_scratch_card_revealed') === 'true';
    if (!alreadyRevealed) return;

    const interval = setInterval(() => {
      const randomJoke = FUNNY_HINGLISH_NOTIFICATIONS[Math.floor(Math.random() * FUNNY_HINGLISH_NOTIFICATIONS.length)];
      const bodyWithCode = `${randomJoke.body} Use Code: ${assignedProduct.code}`;

      triggerNativePhoneNotification(randomJoke.title, bodyWithCode);
      setToastMessage({
        title: randomJoke.title,
        body: bodyWithCode
      });
      setShowNotification(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isCardRevealed, assignedProduct]);

  // Listen for Tab Visibility & Device Screen Wakeup to immediately check and trigger alert
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      const alreadyRevealed = isCardRevealed || localStorage.getItem('velvet_scratch_card_revealed') === 'true';
      if (alreadyRevealed && document.visibilityState === 'visible') {
        const lastNotifStr = localStorage.getItem('velvet_last_notif_time');
        const lastNotif = lastNotifStr ? parseInt(lastNotifStr, 10) : 0;
        const now = Date.now();

        // If at least 5 minutes passed since user was away
        if (now - lastNotif >= 5 * 60 * 1000) {
          localStorage.setItem('velvet_last_notif_time', now.toString());
          const randomJoke = FUNNY_HINGLISH_NOTIFICATIONS[Math.floor(Math.random() * FUNNY_HINGLISH_NOTIFICATIONS.length)];
          const bodyWithCode = `${randomJoke.body} Use Code: ${assignedProduct.code}`;
          triggerNativePhoneNotification(randomJoke.title, bodyWithCode);
          setToastMessage({
            title: randomJoke.title,
            body: bodyWithCode
          });
          setShowNotification(true);
        }

        // Notify SW to run background check
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CHECK_NOTIFICATION' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isCardRevealed, assignedProduct]);

  // Listen for Internet ON (Online Event) to trigger extra funny notifications
  useEffect(() => {
    const handleOnline = () => {
      const alreadyRevealed = isCardRevealed || localStorage.getItem('velvet_scratch_card_revealed') === 'true';
      if (alreadyRevealed) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            if (reg.active) {
              reg.active.postMessage({ type: 'ONLINE_TRIGGER' });
            }
          });
        }

        const onlineTitle = "🌐 Arey waah, Internet ON ho gaya! 😜";
        const onlineBody = `Phone chala hi rahe ho toh fatafat "${assignedProduct.name}" pe 50% discount claim karlo! Code: ${assignedProduct.code}`;

        triggerNativePhoneNotification(onlineTitle, onlineBody);
        setToastMessage({
          title: onlineTitle,
          body: onlineBody
        });
        setShowNotification(true);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isCardRevealed, assignedProduct]);

  // Trigger standard HTML5 / Service Worker native phone system notification
  const triggerNativePhoneNotification = (title: string, body: string) => {
    if (!('Notification' in window)) {
      console.warn('System notifications are not supported by this device browser.');
      return;
    }

    const deliverSystemAlert = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: body,
            icon: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
            badge: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png',
            vibrate: [300, 100, 300, 100, 300],
            tag: 'velvetboxs-deal-' + Date.now(),
            renotify: true,
            requireInteraction: true
          } as any).catch(() => {
            new Notification(title, { body, icon: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png' });
          });
        });
      } else {
        new Notification(title, {
          body: body,
          icon: 'https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png'
        });
      }
    };

    if (Notification.permission === 'granted') {
      deliverSystemAlert();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          deliverSystemAlert();
        }
      });
    }
  };

  // Set 5-day countdown start and trigger notifications when scratch card is revealed
  const handleReveal = () => {
    setIsCardRevealed(true);
    if (expiryTime) return; // Already running

    const fiveDaysFromNow = Date.now() + 5 * 24 * 60 * 60 * 1000;
    setExpiryTime(fiveDaysFromNow);
    try {
      localStorage.setItem('velvet_offer_expiry', fiveDaysFromNow.toString());
    } catch (e) {
      console.warn('Error saving expiry time to localStorage', e);
    }

    const firstJoke = FUNNY_HINGLISH_NOTIFICATIONS[0];
    const initialBody = `Bhai "${assignedProduct.name}" pe 50% discount unlocked hai! Code: ${assignedProduct.code}`;
    setToastMessage({
      title: firstJoke.title,
      body: initialBody
    });
    setShowNotification(true);

    // Request notification permission and trigger first alert immediately
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          triggerNativePhoneNotification(firstJoke.title, initialBody);
        }
      });
    } else {
      triggerNativePhoneNotification(firstJoke.title, initialBody);
    }

    // Start background loop in Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'START_BACKGROUND_NOTIFICATIONS',
            offer: {
              productName: assignedProduct.name,
              code: assignedProduct.code,
              url: assignedProduct.url
            },
            immediate: true
          });
        }
      });
    }
  };

  // Web Share API handler with fresh Scratch & Win link (each friend gets their own surprise offer)
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://velvetboxs.com';
    const shareMessage = `🎁 Scratch the mystery box on VelvetBoxs to unlock your exclusive 50% OFF discount!`;
    const shareData = {
      title: 'VelvetBoxs Scratch & Win - 50% Surprise Discount',
      text: shareMessage,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast('Share link sent!');
        setTimeout(() => setShareToast(null), 3000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // If native share encountered an error, fallback to clipboard
          copyShareFallback(shareUrl);
        }
      }
    } else {
      copyShareFallback(shareUrl);
    }
  };

  const copyShareFallback = async (shareUrl: string) => {
    const fullText = `🎁 Scratch the mystery box on VelvetBoxs to unlock your exclusive 50% OFF discount!\n\nOpen link: ${shareUrl}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
        setShareToast('Scratch card link copied! Send it to your friends.');
      } else {
        setShareToast('Link copied to clipboard!');
      }
      setTimeout(() => setShareToast(null), 3500);
    } catch (e) {
      setShareToast('Link copied to clipboard!');
      setTimeout(() => setShareToast(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5ff] flex flex-col items-center selection:bg-purple-200 font-sans pb-12 relative overflow-x-hidden">
      
      {/* Share Confirmation Toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-2xl z-[120] flex items-center gap-2 border border-zinc-700 select-none pointer-events-none"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Device-style Push Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-[360px] bg-white/95 backdrop-blur-md border border-purple-200/80 rounded-2xl p-4 shadow-[0_15px_30px_-5px_rgba(107,33,168,0.15)] z-[100] flex items-start gap-3 select-none"
          >
            <div className="bg-purple-100 p-2 rounded-xl text-purple-700 flex-shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500 fill-purple-400" /> VelvetBoxs Offer
                </span>
                <span className="text-[9px] text-zinc-400 font-medium">Just now</span>
              </div>
              <h4 className="text-[11px] font-black text-purple-950 mt-1 uppercase tracking-wide">
                {toastMessage.title}
              </h4>
              <p className="text-[10px] text-zinc-600 leading-relaxed font-medium mt-0.5">
                {toastMessage.body}
              </p>
              
              <div className="mt-2.5 flex items-center gap-2">
                <button 
                  onClick={() => {
                    const buyBtn = document.getElementById('buy-now-button');
                    if (buyBtn) buyBtn.click();
                  }}
                  className="bg-purple-950 text-white font-black text-[9px] tracking-wider uppercase py-1.5 px-3 rounded-lg hover:bg-purple-900 transition-colors cursor-pointer"
                >
                  Claim Offer
                </button>
                <button 
                  onClick={() => setShowNotification(false)}
                  className="text-zinc-400 hover:text-zinc-600 font-bold text-[9px] tracking-wider uppercase py-1.5 px-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowNotification(false)}
              className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="w-full pt-4 pb-2 flex flex-col justify-center items-center backdrop-blur-md sticky top-0 z-50">
        <BrandLogo />
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-4 pb-4 flex flex-col items-center">
        <div className="text-center mb-6 min-h-[76px] flex flex-col justify-center items-center">
          {!isCardRevealed ? (
            <div>
              <h2 className="text-4xl font-extrabold text-purple-950 mb-3 tracking-tighter">Your Special Offer!</h2>
              <p className="text-purple-700/80 font-medium">Scratch the card below to reveal your surprise discount.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <span className="text-purple-600 font-extrabold text-xs uppercase tracking-[0.25em] pl-1 animate-pulse mb-0.5">
                CONGRATULATIONS!
              </span>
              <span className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-1">
                YOU GOT 50% OFF ON
              </span>
              <h2 className="text-base sm:text-lg font-black text-zinc-950 uppercase tracking-tight max-w-[320px] leading-tight">
                {assignedProduct.name}
              </h2>
            </motion.div>
          )}
        </div>

        <div className="relative w-full mt-4 mb-8 pointer-events-auto">
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-purple-400/20 blur-3xl w-[120%] h-[120%] -left-[10%] -top-[10%] rounded-full pointer-events-none" />
          <ScratchCard 
            productName={assignedProduct.name}
            productImage={assignedProduct.image}
            promoCode={assignedProduct.code}
            onReveal={handleReveal}
          />
        </div>

        {/* Real-time Urgency Countdown Timer (Starts when card is scratched) */}
        {timeLeft && (
          <div className="w-full max-w-[320px] mx-auto mb-5 bg-white/95 border border-purple-200/80 rounded-full py-1.5 px-4 flex items-center justify-between shadow-sm select-none animate-fadeIn transition-all duration-300 hover:scale-[1.01]" id="urgency-countdown-container">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-widest pl-0.5 font-sans">
                OFFER EXPIRES:
              </span>
            </div>
            
            <div className="flex items-center gap-1 font-mono text-[11px] font-black text-purple-950" id="countdown-digits">
              <span className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-900">{timeLeft.days.toString().padStart(2, '0')}d</span>
              <span className="text-purple-300/80 font-bold">:</span>
              <span className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-900">{timeLeft.hours.toString().padStart(2, '0')}h</span>
              <span className="text-purple-300/80 font-bold">:</span>
              <span className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-900">{timeLeft.minutes.toString().padStart(2, '0')}m</span>
              <span className="text-purple-300/80 font-bold">:</span>
              <span className="bg-rose-50 px-1.5 py-0.5 rounded text-rose-600 animate-pulse">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
            </div>
          </div>
        )}

        {/* Action Trigger Section */}
        <div className="flex flex-col items-center w-full gap-2.5 mt-2 mb-6" id="order-action-container">
          <span className="text-[10px] font-black text-purple-600/80 uppercase tracking-[0.25em] pl-1 font-sans">
            choice your next order
          </span>
          <a 
            href={assignedProduct.url} 
            target="_blank" 
            rel="noreferrer" 
            className="w-full max-w-[240px] bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-black uppercase py-3 px-6 rounded-xl tracking-[0.2em] text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 text-center cursor-pointer shadow-lg shadow-purple-950/20 flex items-center justify-center gap-2"
            id="buy-now-button"
          >
            BUY NOW
          </a>

          {/* Web Share API Button */}
          <button
            onClick={handleShare}
            className="w-full max-w-[240px] bg-white hover:bg-purple-50/80 border border-purple-300/80 text-purple-900 hover:text-purple-950 font-black uppercase py-2.5 px-6 rounded-xl tracking-[0.15em] text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 text-center cursor-pointer shadow-sm flex items-center justify-center gap-2"
            id="share-offer-button"
            title="Share this discount with friends"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Share With Friends</span>
          </button>

          {/* Direct System / Phone Notification Bar Permission Trigger */}
          {isCardRevealed && notificationPermission !== 'granted' && (
            <button
              onClick={async () => {
                if ('Notification' in window) {
                  try {
                    const perm = await Notification.requestPermission();
                    setNotificationPermission(perm);
                    if (perm === 'granted') {
                      const testJoke = FUNNY_HINGLISH_NOTIFICATIONS[0];
                      const bodyWithCode = `${testJoke.body} Use Code: ${assignedProduct.code}`;
                      triggerNativePhoneNotification(testJoke.title, bodyWithCode);
                      setShareToast('🔔 Phone Notification Bar Alerts Enabled!');
                      setTimeout(() => setShareToast(null), 3500);
                    }
                  } catch (e) {
                    console.warn('Permission error:', e);
                  }
                }
              }}
              className="mt-1 text-[11px] font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1.5 bg-purple-100/80 hover:bg-purple-200/90 px-3.5 py-1.5 rounded-full transition-all border border-purple-300/80 shadow-xs cursor-pointer active:scale-95"
              id="enable-phone-notifications-button"
            >
              <Bell className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span>Allow Phone Notification Bar Alerts</span>
            </button>
          )}
        </div>

        {/* Footer Area */}
        <div className="flex flex-col items-center mt-2 w-full text-center text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Gift className="w-4 h-4 text-purple-400" />
            <span>Valid for registered users on velvetboxs.com</span>
          </div>
        </div>
      </main>
    </div>
  );
}
