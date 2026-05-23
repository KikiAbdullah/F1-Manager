// ============================================================
// SPA Router — F1 Manager 2026
// Manages screen transitions with GSAP animations
// ============================================================

import { store } from './store.js'

const SCREENS = [
  'main-menu', 'create-team', 'dashboard',
  'race', 'personnel', 'finance', 'rnd', 'calendar',
]

let _currentScreen = 'main-menu'
let _onEnterCallbacks = {}

export const router = {
  /** Register a callback called when screen becomes active */
  onEnter(screenName, cb) {
    _onEnterCallbacks[screenName] = cb
  },

  /** Navigate to a screen with GSAP transition */
  async goTo(screenName, params = {}) {
    if (!SCREENS.includes(screenName)) {
      console.warn(`[Router] Unknown screen: ${screenName}`)
      return
    }
    if (screenName === _currentScreen) return

    const prev = document.getElementById(`screen-${_currentScreen}`)
    const next = document.getElementById(`screen-${screenName}`)

    if (!next) {
      console.warn(`[Router] DOM element not found: screen-${screenName}`)
      return
    }

    // Animate out
    if (prev && window.gsap) {
      await new Promise(resolve => {
        gsap.to(prev, {
          opacity: 0, x: -30, duration: 0.25, ease: 'power2.in',
          onComplete: resolve,
        })
      })
      prev.classList.add('hidden')
      prev.classList.remove('active')
      gsap.set(prev, { opacity: 1, x: 0 })
    } else if (prev) {
      prev.classList.add('hidden')
      prev.classList.remove('active')
    }

    // Show next
    next.classList.remove('hidden')
    next.classList.add('active')
    _currentScreen = screenName
    store.set('currentScreen', screenName)

    // Animate in
    if (window.gsap) {
      gsap.fromTo(next,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      )
    }

    // Fire onEnter callback
    if (_onEnterCallbacks[screenName]) {
      _onEnterCallbacks[screenName](params)
    }
  },

  current() {
    return _currentScreen
  },
}
