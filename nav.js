;(function () {
  var root = document.documentElement
  var theme = 'light'
  try {
    var stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') theme = stored
  } catch (error) {}
  root.setAttribute('data-theme', theme)
  function init() {
    // Complete older cached pages that still have an empty navigation placeholder.
    var placeholder = document.getElementById('site-nav-root')
    if (placeholder && !placeholder.querySelector('nav')) {
      fetch('/nav.html').then(function (response) {
        if (!response.ok) throw new Error('Navigation unavailable')
        return response.text()
      }).then(function (html) {
        placeholder.innerHTML = html
        if (typeof window.__applyLanguage === 'function') window.__applyLanguage()
        init()
      }).catch(function () {})
      return
    }
    var toggle = document.querySelector('.theme-toggle')
    if (!toggle) return
    var french = root.lang === 'fr'
    function update() {
      var dark = root.getAttribute('data-theme') === 'dark'
      toggle.setAttribute('aria-pressed', String(dark))
      toggle.setAttribute('aria-label', french ? 'Thème sombre' : 'Dark theme')
      toggle.querySelector('.theme-toggle-icon').textContent = dark ? '☀' : '☾'
      toggle.querySelector('.theme-toggle-label').textContent = dark ? (french ? 'Clair' : 'Light') : (french ? 'Sombre' : 'Dark')
    }
    toggle.hidden = false
    update()
    var legacyLanguage = document.querySelector('button.lang-toggle')
    if (legacyLanguage) {
      if (typeof window.__setLanguage === 'function') {
        legacyLanguage.addEventListener('click', function () {
          window.__setLanguage(root.lang === 'fr' ? 'en' : 'fr')
          french = root.lang === 'fr'
          update()
        })
      } else legacyLanguage.hidden = true
    }
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      root.setAttribute('data-theme', next)
      try { localStorage.setItem('theme', next) } catch (error) {}
      update()
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
