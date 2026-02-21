;(function () {
  var placeholder = document.getElementById('site-nav-root')
  if (!placeholder) return

  function getStoredTheme() {
    try {
      return window.localStorage.getItem('theme')
    } catch (e) {
      return null
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem('theme', theme)
    } catch (e) {}
  }

  function getPreferredTheme() {
    var stored = getStoredTheme()
    if (stored === 'light' || stored === 'dark') return stored

    return 'dark'
  }

  function applyTheme(theme) {
    var root = document.documentElement
    root.setAttribute('data-theme', theme)
  }

  function updateToggle(theme) {
    var toggle = placeholder.querySelector('.theme-toggle')
    if (!toggle) return

    var icon = toggle.querySelector('.theme-toggle-icon')
    var label = toggle.querySelector('.theme-toggle-label')

    if (theme === 'dark') {
      if (icon) icon.textContent = '☀'
      if (label) label.textContent = 'Light'
    } else {
      if (icon) icon.textContent = '☾'
      if (label) label.textContent = 'Dark'
    }
  }

  function getStoredLang() {
    try {
      return window.localStorage.getItem('lang')
    } catch (e) {
      return null
    }
  }

  function storeLang(lang) {
    try {
      window.localStorage.setItem('lang', lang)
    } catch (e) {}
  }

  function getPreferredLang() {
    var stored = getStoredLang()
    if (stored === 'en' || stored === 'fr') return stored
    if (typeof window.__getLanguage === 'function') return window.__getLanguage()
    return 'en'
  }

  function updateLangToggle(lang) {
    var btn = placeholder.querySelector('.lang-toggle')
    if (!btn) return
    var label = btn.querySelector('.lang-toggle-label')
    if (label) label.textContent = (lang || 'en').toUpperCase()
  }

  fetch('/nav.html')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load nav include')
      return res.text()
    })
    .then(function (html) {
      placeholder.innerHTML = html

      var path = window.location.pathname || '/'
      var key = 'home'

      if (path === '/' || path === '/index.html') {
        key = 'home'
      } else if (path.indexOf('/about') === 0) {
        key = 'about'
      } else if (path.indexOf('/projects') === 0) {
        key = 'projects'
      } else if (path.indexOf('/blog') === 0) {
        key = 'blog'
      } else if (path.indexOf('/contact') === 0) {
        key = 'contact'
      }

      var active = placeholder.querySelector('.nav-link-active')
      if (active) active.classList.remove('nav-link-active')

      var link = placeholder.querySelector('[data-nav="' + key + '"]')
      if (link) {
        link.classList.add('nav-link-active')
      }

      var currentTheme = getPreferredTheme()
      applyTheme(currentTheme)
      updateToggle(currentTheme)

      var themeToggle = placeholder.querySelector('.theme-toggle')
      if (themeToggle) {
        themeToggle.addEventListener('click', function () {
          var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
          applyTheme(next)
          storeTheme(next)
          updateToggle(next)
        })
      }

      var currentLang = getPreferredLang()
      if (typeof window.__setLanguage === 'function') {
        window.__setLanguage(currentLang)
      } else if (typeof window.__applyLanguage === 'function') {
        window.__applyLanguage()
      }
      updateLangToggle(currentLang)

      var langToggle = placeholder.querySelector('.lang-toggle')
      if (langToggle) {
        langToggle.addEventListener('click', function () {
          var next = getPreferredLang() === 'en' ? 'fr' : 'en'
          storeLang(next)
          if (typeof window.__setLanguage === 'function') {
            window.__setLanguage(next)
          } else {
            document.documentElement.setAttribute('lang', next)
          }
          updateLangToggle(next)
        })
      }
    })
    .catch(function () {})
})()
