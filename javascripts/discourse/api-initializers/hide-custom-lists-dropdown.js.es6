import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  const siteSettings = api.container.lookup("site-settings:main");
  const themeSettings = settings;

  // Only run if the setting is enabled
  if (!themeSettings.hide_custom_lists_dropdown) {
    return;
  }

  // Function to remove custom lists dropdown from navigation
  // BUT: Always keep it visible on /lists/ pages
  const removeCustomListsDropdown = function() {
    // Don't remove dropdown if we're on a /lists/ page
    const currentPath = window.location.pathname;
    if (currentPath.includes('/lists/') || currentPath.includes('/community/lists/')) {
      return; // Keep the dropdown on lists pages
    }

    const customListItems = document.querySelectorAll('.category-breadcrumb li.custom-list-item, li.custom-list-item');
    customListItems.forEach(function(item) {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    });
  };

  // Run on every page change
  api.onPageChange(() => {
    // Remove immediately
    removeCustomListsDropdown();

    // Remove after short delays to catch late renders
    setTimeout(removeCustomListsDropdown, 50);
    setTimeout(removeCustomListsDropdown, 100);
    setTimeout(removeCustomListsDropdown, 250);
    setTimeout(removeCustomListsDropdown, 500);
    setTimeout(removeCustomListsDropdown, 1000);
  });

  // Use MutationObserver to remove as soon as element is added to DOM
  api.onPageChange(() => {
    const observer = new MutationObserver((mutations) => {
      let needsRemoval = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('custom-list-item')) {
              needsRemoval = true;
            }
            if (node.querySelectorAll) {
              const found = node.querySelectorAll('li.custom-list-item');
              if (found.length > 0) {
                needsRemoval = true;
              }
            }
          }
        });
      });

      if (needsRemoval) {
        removeCustomListsDropdown();
      }
    });

    // Observe the entire document body for new custom list items
    const bodyElement = document.body;
    if (bodyElement) {
      observer.observe(bodyElement, {
        childList: true,
        subtree: true
      });
    }
  });
});
