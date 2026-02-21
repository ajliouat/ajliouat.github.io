;(function () {
  var MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'

  function loadScript(src, onLoad) {
    var script = document.createElement('script')
    script.src = src
    script.onload = onLoad
    script.async = true
    document.head.appendChild(script)
  }

  function getCurrentTheme() {
    var root = document.documentElement
    var attr = root.getAttribute('data-theme')
    if (attr === 'dark' || attr === 'light') return attr
    return 'dark'
  }

  function getConfig(theme) {
    var isDark = theme === 'dark'

    var base = {
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
      themeVariables: {
        fontSize: '13px',
      },
      flowchart: {
        curve: 'basis',
        htmlLabels: true,
        padding: 12,
        useMaxWidth: true,
      },
      sequence: {
        useMaxWidth: true,
        actorFontSize: 13,
        messageFontSize: 13,
      },
    }

    if (isDark) {
      base.theme = 'dark'
      base.themeVariables.primaryColor = '#0b1120'
      base.themeVariables.primaryBorderColor = '#1d4ed8'
      base.themeVariables.primaryTextColor = '#e5e7eb'
      base.themeVariables.lineColor = '#38bdf8'
      base.themeVariables.secondaryColor = '#020617'
      base.themeVariables.tertiaryColor = '#111827'
      base.themeVariables.textColor = '#e5e7eb'
    } else {
      base.theme = 'default'
      base.themeVariables.primaryColor = '#eff6ff'
      base.themeVariables.primaryBorderColor = '#1d4ed8'
      base.themeVariables.primaryTextColor = '#0f172a'
      base.themeVariables.lineColor = '#1d4ed8'
      base.themeVariables.secondaryColor = '#ffffff'
      base.themeVariables.tertiaryColor = '#e5e7eb'
      base.themeVariables.textColor = '#111827'
    }

    return base
  }

  function render(theme) {
    if (!window.mermaid) return
    var currentTheme = theme || getCurrentTheme()
    var config = getConfig(currentTheme)

    window.mermaid.initialize(config)
    if (typeof window.mermaid.run === 'function') {
      window.mermaid.run({ querySelector: '.mermaid' })
    }
  }

  function observeTheme() {
    var root = document.documentElement
    if (!window.MutationObserver || !root) return

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i]
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          render(root.getAttribute('data-theme'))
          break
        }
      }
    })

    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
  }

  function init() {
    if (!window.mermaid) {
      loadScript(MERMAID_CDN, function () {
        render()
        observeTheme()
      })
      return
    }

    render()
    observeTheme()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
