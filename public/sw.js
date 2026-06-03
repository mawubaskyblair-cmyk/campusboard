// sw.js - Service Worker for Push Notifications
const CACHE_NAME = 'campusboard-v1'

self.addEventListener('install', event => {
  console.log('Service Worker installed')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  console.log('Service Worker activated')
  event.waitUntil(self.clients.claim())
})

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'New Notice', body: '' }
  
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    requireInteraction: data.urgent || false,
    data: {
      url: '/',
      noticeId: data.noticeId
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})