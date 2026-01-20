import { apiInitializer } from "discourse/lib/api";

// Use version 0.1 to load as early as possible
export default apiInitializer("0.1", (api) => {
  // Ultra-aggressive function to replace "Custom lists" with "Solutions"
  function ultraAggressiveTextReplacement() {
    // Ultra-aggressive text replacement with multiple approaches
    const selectors = [
      '.tag-drop-header[data-name="Custom lists"]',
      '.select-kit-header[data-name="Custom lists"]',
      '.custom-list-dropdown .select-kit-header',
      '.custom-list-dropdown',
      '[data-name*="Custom lists"]',
      '[aria-label*="Custom lists"]'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Update all possible attributes
        ['aria-label', 'name', 'data-name', 'title'].forEach(attr => {
          const value = element.getAttribute(attr);
          if (value && value.includes('Custom lists')) {
            element.setAttribute(attr, value.replace(/Custom lists/g, 'Solutions'));
          }
        });

        // Update ONLY header text content, avoid ALL dropdown body content
        const nameElements = element.querySelectorAll('.name, .selected-name, .select-kit-selected-name');
        nameElements.forEach(nameEl => {
          // Skip if this element is inside ANY dropdown body content
          if (nameEl.closest('.select-kit-body') ||
              nameEl.closest('.select-kit-collection') ||
              nameEl.closest('.select-kit-row') ||
              nameEl.closest('.select-kit-item') ||
              nameEl.hasAttribute('data-value') ||
              (nameEl.parentElement && nameEl.parentElement.hasAttribute('data-value'))) {
            return;
          }

          if (nameEl.textContent && nameEl.textContent.includes('Custom lists')) {
            nameEl.textContent = nameEl.textContent.replace(/Custom lists/g, 'Solutions');
            nameEl.classList.add('solutions-ready');
          }
        });

        // Direct text content replacement ONLY for headers
        if (element.classList.contains('select-kit-header') &&
            element.textContent && element.textContent.includes('Custom lists')) {
          element.textContent = element.textContent.replace(/Custom lists/g, 'Solutions');
        }

        // Mark as processed
        const dropdown = element.closest('.custom-list-dropdown') || element;
        if (dropdown.classList && dropdown.classList.contains('custom-list-dropdown')) {
          dropdown.classList.add('solutions-ready');
        }
      });
    });

    // Ultra-aggressive direct text node replacement
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (node.textContent && node.textContent.includes('Custom lists')) {
            const parent = node.parentElement;
            // EXCLUDE ALL dropdown body content and options to prevent clearing
            if (parent && (
              parent.closest('.select-kit-body') ||
              parent.closest('.select-kit-collection') ||
              parent.closest('.select-kit-row') ||
              parent.closest('.select-kit-item') ||
              parent.closest('.select-kit-filter') ||
              parent.closest('.collection') ||
              parent.classList.contains('select-kit-row') ||
              parent.classList.contains('select-kit-item') ||
              parent.classList.contains('collection') ||
              parent.hasAttribute('data-value') // Items with data-value are likely options
            )) {
              return NodeFilter.FILTER_REJECT;
            }

            // INCLUDE only very specific header elements for replacement
            if (parent && (
              (parent.closest('.select-kit-header') && !parent.closest('.select-kit-body')) ||
              (parent.classList.contains('name') && parent.closest('.custom-list-dropdown .select-kit-header')) ||
              (parent.classList.contains('selected-name') && parent.closest('.custom-list-dropdown .select-kit-header')) ||
              (parent.classList.contains('select-kit-selected-name') && parent.closest('.custom-list-dropdown .select-kit-header'))
            )) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      textNode.textContent = textNode.textContent.replace(/Custom lists/g, 'Solutions');
      const parent = textNode.parentElement;
      if (parent) {
        parent.classList.add('solutions-ready');
        const dropdown = parent.closest('.custom-list-dropdown');
        if (dropdown) {
          dropdown.classList.add('solutions-ready');
        }
      }
    }
  }

  // Run immediately
  ultraAggressiveTextReplacement();

  // Run on every animation frame for first second
  let frameCount = 0;
  const maxFrames = 60; // ~1 second at 60fps
  const frameTextReplacer = () => {
    ultraAggressiveTextReplacement();
    frameCount++;
    if (frameCount < maxFrames) {
      requestAnimationFrame(frameTextReplacer);
    }
  };
  requestAnimationFrame(frameTextReplacer);

  // Use MutationObserver to catch dynamically added content
  const observer = new MutationObserver(function(mutations) {
    let shouldReplace = false;

    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            // Check if it's a custom list dropdown or contains one
            if (node.classList && (
                node.classList.contains('custom-list-dropdown') ||
                node.classList.contains('tag-drop-header') ||
                node.classList.contains('select-kit-header')
              )) {
              shouldReplace = true;
            } else if (node.querySelector) {
              if (node.querySelector('.custom-list-dropdown') ||
                  node.querySelector('.tag-drop-header') ||
                  node.querySelector('[data-name*="Custom"]')) {
                shouldReplace = true;
              }
            }
          }
        });
      } else if (mutation.type === 'characterData') {
        // Text content changed
        if (mutation.target.textContent && mutation.target.textContent.includes('Custom lists')) {
          shouldReplace = true;
        }
      } else if (mutation.type === 'attributes') {
        // Attribute changed
        if (mutation.attributeName === 'data-name' || mutation.attributeName === 'aria-label') {
          const value = mutation.target.getAttribute(mutation.attributeName);
          if (value && value.includes('Custom lists')) {
            shouldReplace = true;
          }
        }
      }
    });

    if (shouldReplace) {
      // Immediate replacement, no delay
      ultraAggressiveTextReplacement();
    }
  });

  // Start observing
  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-name', 'aria-label', 'name', 'title']
    });
  }

  // Run every 50ms for the first 5 seconds
  let intervalCount = 0;
  const maxIntervals = 100; // 5 seconds (100 * 50ms)
  const persistentTextReplacer = setInterval(() => {
    ultraAggressiveTextReplacement();
    intervalCount++;
    if (intervalCount >= maxIntervals) {
      clearInterval(persistentTextReplacer);
    }
  }, 50);

  // Ultimate fallback: ensure all dropdown text is visible after 3 seconds
  setTimeout(function() {
    const allCustomDropdowns = document.querySelectorAll('.custom-list-dropdown');
    allCustomDropdowns.forEach(function(dropdown) {
      dropdown.classList.add('solutions-ready');
      const allNames = dropdown.querySelectorAll('.name');
      allNames.forEach(function(name) {
        name.classList.add('solutions-ready');
      });
    });
  }, 3000);
});
