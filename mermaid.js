;(function () {
  function loadScript(src, onLoad) {
    var script = document.createElement('script')
    script.src = src
    script.onload = onLoad
    script.async = true
    document.head.appendChild(script)
  }

  function initMermaid() {
    if (!window.mermaid) return

    window.mermaid.initialize({
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
    })
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
