// Mermaid diagram initialization for MkDocs Material

// Configure mermaid globally
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    themeVariables: {
      primaryColor: '#2e7d32',
      primaryTextColor: '#fff',
      primaryBorderColor: '#2e7d32',
      lineColor: '#2e7d32',
      secondaryColor: '#c8e6c9',
      tertiaryColor: '#e8f5e9',
      background: 'transparent',
      mainBkg: 'transparent',
      secondBkg: 'transparent',
      tertiaryBkg: 'transparent',
      textColor: '#1d1d1d',
      nodeBorder: '#2e7d32',
      clusterBorder: '#2e7d32',
      defaultLinkColor: '#2e7d32',
      titleColor: '#1d1d1d',
      edgeLabelBackground: '#e8f5e9',
      actorBorder: '#2e7d32',
      actorTextColor: '#1d1d1d',
      actorBkg: '#c8e6c9',
      useMaxWidth: true,
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      bottomMarginAdj: 1,
      useMaxWidth: true,
    },
    gantt: {
      useMaxWidth: true,
    },
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
  });
}

// Re-render mermaid on navigation (for Material's instant loading)
document.addEventListener('DOMContentLoaded', () => {
  if (typeof mermaid !== 'undefined') {
    mermaid.init(undefined, document.querySelectorAll('.mermaid'));
  }
});

// Handle instant navigation (Material for MkDocs)
if (typeof document$ !== 'undefined') {
  document$.subscribe(() => {
    if (typeof mermaid !== 'undefined') {
      mermaid.init(undefined, document.querySelectorAll('.mermaid:not([data-processed])'));
    }
  });
}

// Fallback for standard navigation
document.addEventListener('nav', () => {
  if (typeof mermaid !== 'undefined') {
    mermaid.init(undefined, document.querySelectorAll('.mermaid:not([data-processed])'));
  }
});