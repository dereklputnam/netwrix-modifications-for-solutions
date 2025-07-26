// Pre-initializer runs before all other Discourse JavaScript
// This is the earliest possible point to intercept text changes

export default {
  name: "custom-lists-text-replacement",
  
  initialize() {
    // Override the text content as early as possible
    const replaceCustomListsText = () => {
      // Method 1: Direct text replacement only in custom-list-dropdown elements
      const customListDropdowns = document.querySelectorAll('.custom-list-dropdown');
      customListDropdowns.forEach(dropdown => {
        const textNodes = document.createTreeWalker(
          dropdown,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function(node) {
              return node.textContent.includes('Custom lists') ? 
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          }
        );
        
        let node;
        while (node = textNodes.nextNode()) {
          if (node.textContent.trim() === 'Custom lists') {
            node.textContent = 'Solutions';
            // Mark parent element as replaced
            const parentElement = node.parentElement;
            if (parentElement) {
              parentElement.setAttribute('data-text-replaced', 'true');
              // Also mark grandparent if it's a header
              const grandParent = parentElement.closest('.select-kit-header');
              if (grandParent) {
                grandParent.setAttribute('data-text-replaced', 'true');
              }
            }
          } else if (node.textContent.includes('Custom lists')) {
            node.textContent = node.textContent.replace(/Custom lists/g, 'Solutions');
            // Mark parent element as replaced
            const parentElement = node.parentElement;
            if (parentElement) {
              parentElement.setAttribute('data-text-replaced', 'true');
              // Also mark grandparent if it's a header
              const grandParent = parentElement.closest('.select-kit-header');
              if (grandParent) {
                grandParent.setAttribute('data-text-replaced', 'true');
              }
            }
          }
        }
      });
      
      // Method 2: Target specific selectors for custom-list-dropdown only
      const selectors = [
        '.custom-list-dropdown .select-kit-selected-name .name',
        '.custom-list-dropdown .selected-name .name',
        '.custom-list-dropdown .name'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element.textContent && element.textContent.trim() === 'Custom lists') {
            element.textContent = 'Solutions';
            // Mark element as replaced to make it visible
            element.setAttribute('data-text-replaced', 'true');
            // Also mark parent elements that might control visibility
            const parentHeader = element.closest('.select-kit-header');
            if (parentHeader) {
              parentHeader.setAttribute('data-text-replaced', 'true');
            }
          }
        });
      });
      
      // Method 3: Update attributes that might contain "Custom lists"
      const attributeSelectors = [
        '[aria-label*="Custom lists"]',
        '[data-name="Custom lists"]',
        '[name*="Custom lists"]',
        '[title="Custom lists"]'
      ];
      
      attributeSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          let wasReplaced = false;
          ['aria-label', 'data-name', 'name', 'title'].forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && value.includes('Custom lists')) {
              element.setAttribute(attr, value.replace(/Custom lists/g, 'Solutions'));
              wasReplaced = true;
            }
          });
          
          if (wasReplaced) {
            element.setAttribute('data-text-replaced', 'true');
            // Also mark any child name elements
            const nameElements = element.querySelectorAll('.name');
            nameElements.forEach(nameEl => {
              nameEl.setAttribute('data-text-replaced', 'true');
            });
          }
        });
      });
    };
    
    // Run immediately
    replaceCustomListsText();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', replaceCustomListsText);
    } else {
      replaceCustomListsText();
    }
    
    // Use MutationObserver to catch dynamically added content, but only in custom-list-dropdown elements
    const observer = new MutationObserver((mutations) => {
      let shouldReplace = false;
      
      mutations.forEach((mutation) => {
        // Only process mutations that are within or add custom-list-dropdown elements
        const isInCustomListDropdown = mutation.target.closest && mutation.target.closest('.custom-list-dropdown');
        const isCustomListDropdown = mutation.target.classList && mutation.target.classList.contains('custom-list-dropdown');
        
        if (!isInCustomListDropdown && !isCustomListDropdown) {
          // Check if any added nodes are custom-list-dropdown elements
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const hasCustomListDropdown = addedNodes.some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node.classList?.contains('custom-list-dropdown') || node.querySelector?.('.custom-list-dropdown'))
            );
            if (!hasCustomListDropdown) {
              return; // Skip this mutation
            }
          } else {
            return; // Skip this mutation
          }
        }
        
        if (mutation.type === 'childList') {
          // Check if any added nodes contain "Custom lists" text
          const addedNodes = Array.from(mutation.addedNodes);
          addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Custom lists')) {
              shouldReplace = true;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if element or its children contain the text
              const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode: function(textNode) {
                    return textNode.textContent.includes('Custom lists') ? 
                      NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                  }
                }
              );
              if (walker.nextNode()) {
                shouldReplace = true;
              }
            }
          });
        } else if (mutation.type === 'characterData') {
          // Direct text content change
          if (mutation.target.textContent.includes('Custom lists')) {
            shouldReplace = true;
          }
        }
      });
      
      if (shouldReplace) {
        // Small delay to ensure DOM is stable
        setTimeout(replaceCustomListsText, 0);
      }
    });
    
    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Also run at frequent intervals to catch any missed changes
    const intervalId = setInterval(replaceCustomListsText, 200);
    
    // Clean up interval after reasonable time
    setTimeout(() => {
      clearInterval(intervalId);
    }, 30000); // Stop after 30 seconds
  }
};