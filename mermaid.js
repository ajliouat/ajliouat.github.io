;(function () {
  function loadScript(src, onLoad) {
    var script = document.createElement('script')
    script.src = src
    script.onload = onLoad
    script.async = true
    document.head.appendChild(script)
  }

  function getCurrentTheme() {
    var root = document.documentElement
    var t = root.getAttribute('data-theme')
    if (t === 'light' || t === 'dark') return t
    return 'dark'
  }

  function getConfig(theme) {
    if (theme === 'light') {
      return {
        startOnLoad: true,
        securityLevel: 'loose',
        theme: 'default',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
        themeVariables: {
          primaryColor: '#eff6ff',
          primaryBorderColor: '#1d4ed8',
          primaryTextColor: '#111827',
          lineColor: '#0ea5e9',
          secondaryColor: '#f9fafb',
          tertiaryColor: '#e5e7eb',
          textColor: '#111827',
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
    }

    return {
      startOnLoad: true,
      securityLevel: 'loose',
      theme: 'dark',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
      themeVariables: {
        primaryColor: '#0b1120',
        primaryBorderColor: '#1d4ed8',
        primaryTextColor: '#e5e7eb',
        lineColor: '#38bdf8',
        secondaryColor: '#020617',
        tertiaryColor: '#111827',
        textColor: '#e5e7eb',
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
  }

  function applyMermaidTheme(theme) {
    if (!window.mermaid) return
    window.mermaid.initialize(getConfig(theme))
    if (typeof window.mermaid.run === 'function') {
      window.mermaid.run()
    } else if (typeof window.mermaid.contentLoaded === 'function') {
      window.mermaid.contentLoaded()
    }
  }

  function initMermaid() {
    if (!window.mermaid) return

    applyMermaidTheme(getCurrentTheme())

    var root = document.documentElement
    var lastTheme = getCurrentTheme()

    var observer = new MutationObserver(function (mutations) {
      var changed = false
      for (var i = 0; i < mutations.length; i++) {
        if (
          mutations[i].type === 'attributes' &&
          mutations[i].attributeName === 'data-theme'
        ) {
          changed = true
          break
        }
      }
      if (!changed) return
      var next = getCurrentTheme()
      if (next === lastTheme) return
      lastTheme = next
      applyMermaidTheme(next)
    })

    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
  }

  if (window.mermaid) {
    initMermaid()
  } else {
    loadScript(
      'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
      initMermaid
    )
  }
})()
