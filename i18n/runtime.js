;(function () {
  var DEFAULT_LANG = 'en'

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

  function detectLang() {
    var stored = getStoredLang()
    if (stored === 'en' || stored === 'fr') return stored

    var docLang = (document.documentElement.getAttribute('lang') || '').toLowerCase()
    if (docLang === 'fr' || docLang === 'fr-fr') return 'fr'

    var navLang =
      (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase()
    if (navLang.indexOf('fr') === 0) return 'fr'

    return DEFAULT_LANG
  }

  function applyLanguage() {
    var lang = detectLang()
    document.documentElement.setAttribute('lang', lang)

    var all = window.I18N && window.I18N[lang]
    if (!all) return

    var nodes = document.querySelectorAll('[data-i18n]')
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i]
      var key = el.getAttribute('data-i18n')
      if (!key) continue
      var value = all[key]
      if (typeof value === 'string') {
        el.textContent = value
      }
    }

    var langLabel = document.querySelector('.lang-toggle-label')
    if (langLabel) {
      langLabel.textContent = lang.toUpperCase()
    }
  }

  window.__getLanguage = detectLang
  window.__setLanguage = function (lang) {
    if (lang !== 'en' && lang !== 'fr') return
    storeLang(lang)
    document.documentElement.setAttribute('lang', lang)
    applyLanguage()
  }
  window.__applyLanguage = applyLanguage

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLanguage)
  } else {
    applyLanguage()
  }
})()

