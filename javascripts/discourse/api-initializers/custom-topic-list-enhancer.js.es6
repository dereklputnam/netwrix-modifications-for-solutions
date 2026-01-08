import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.11.1", (api) => {
  // ULTRA-AGGRESSIVE navigation hiding with JavaScript fallback and persistent enforcement
  const aggressiveHideNavElements = () => {
    // Only hide elements if we're on a /lists/ page
    if (!window.location.pathname.includes('/lists/') && !window.location.pathname.includes('/community/lists/')) {
      return;
    }

    // Ultra-aggressive JavaScript hiding with multiple properties - MAIN NAVIGATION
    const navItems = document.querySelectorAll('#navigation-bar .nav-item_categories, #navigation-bar .nav-item_latest, #navigation-bar .nav-item_new, #navigation-bar .nav-item_top, #navigation-bar .nav-item_unread');
    navItems.forEach(item => {
      if (!item || !item.style) return;
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
      item.style.width = '0';
      item.style.height = '0';
      item.style.overflow = 'hidden';
      item.style.position = 'absolute';
      item.style.left = '-9999px';
      item.setAttribute('hidden', 'true');
      item.setAttribute('aria-hidden', 'true');
    });

    // Ultra-aggressive JavaScript hiding - SORTING NAVIGATION ELEMENTS
    const sortingElements = document.querySelectorAll('.navigation-controls .nav-pills .nav-item, .topic-list-header .sortable, .period-chooser, .list-controls .nav-pills');
    sortingElements.forEach(item => {
      if (!item || !item.style) return;
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
      item.style.width = '0';
      item.style.height = '0';
      item.style.overflow = 'hidden';
      item.style.position = 'absolute';
      item.style.left = '-9999px';
      item.setAttribute('hidden', 'true');
      item.setAttribute('aria-hidden', 'true');
    });

    // Hide category and tag filter dropdowns with aggressive properties
    const filterDropdowns = document.querySelectorAll('.category-breadcrumb .category-drop, .category-breadcrumb .tag-drop:not(.custom-list-dropdown)');
    filterDropdowns.forEach(item => {
      if (!item || !item.style) return;
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
      item.style.width = '0';
      item.style.height = '0';
      item.style.overflow = 'hidden';
      item.style.position = 'absolute';
      item.style.left = '-9999px';
      item.setAttribute('hidden', 'true');
      item.setAttribute('aria-hidden', 'true');
    });

    // Hide parent <li> elements that contain category/tag dropdowns (but not custom lists) - match staging exactly
    const breadcrumbItems = document.querySelectorAll('.category-breadcrumb li');
    breadcrumbItems.forEach((li, index) => {
      if (!li || !li.style) return;
      if (index < 2) { // Hide first two <li> elements (categories and tags)
        const hasCustomList = li.querySelector('.custom-list-dropdown');
        if (!hasCustomList) {
          li.style.display = 'none';
          li.style.visibility = 'hidden';
          li.style.opacity = '0';
          li.style.width = '0';
          li.style.height = '0';
          li.style.overflow = 'hidden';
          li.style.position = 'absolute';
          li.style.left = '-9999px';
          li.setAttribute('hidden', 'true');
          li.setAttribute('aria-hidden', 'true');
        }
      }
    });
  };
  
  // Execute immediately 
  aggressiveHideNavElements();
  
  // Also run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aggressiveHideNavElements);
  } else {
    aggressiveHideNavElements();
  }
  
  // ULTRA-AGGRESSIVE: Run every 100ms for the first 5 seconds to catch any dynamically loaded elements
  if (window.location.pathname.includes('/lists/') || window.location.pathname.includes('/community/lists/')) {
    let intervalCount = 0;
    const maxIntervals = 50; // 5 seconds (50 * 100ms)
    const persistentHider = setInterval(() => {
      aggressiveHideNavElements();
      intervalCount++;
      if (intervalCount >= maxIntervals) {
        clearInterval(persistentHider);
      }
    }, 100);
  }
  

  // Get current user and environment info for debug logging
  const currentUser = api.getCurrentUser();
  const isAdmin = currentUser?.admin || currentUser?.moderator;
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('dev');

  // Function to get current solution config
  function getCurrentSolutionConfig() {
    const currentPath = window.location.pathname;
    const slugMatch = currentPath.match(/^\/lists\/([^\/?#]+)/);
    if (!slugMatch) return null;

    const slug = slugMatch[1];
    
    // First try to get from theme settings (has subscription fields)
    let solutionConfig = settings.netwrix_solutions?.find(solution => solution.slug === slug);
    
    // If not found in theme settings, try plugin data as fallback
    if (!solutionConfig) {
      const customTopicLists = api.container.lookup("service:site")?.custom_topic_lists || [];
      solutionConfig = customTopicLists.find(list => list.slug === slug);
    }
    
    if (!solutionConfig) {
      if (isAdmin || isDevelopment) {
        console.log(`No solution configuration found for slug: ${slug}`);
        console.log(`Available in theme:`, settings.netwrix_solutions?.map(s => s.slug));
        const customTopicLists = api.container.lookup("service:site")?.custom_topic_lists || [];
        console.log(`Available in plugin:`, customTopicLists?.map(s => s.slug));
      }
      return null;
    }

    // Reduced logging for cleaner console
    return { slug, solutionConfig };
  }

  // Check if we're on a solution page initially
  const initialConfig = getCurrentSolutionConfig();
  if (!initialConfig && (isAdmin || isDevelopment)) {
    console.log("Not on a solution page. Navigate to /lists/[slug] to test subscription functionality.");
    // Don't return here - continue to setup page change handlers
  }

  // Function to get category IDs for current solution
  function getCategoryIds(solutionConfig) {
    const level4Categories = solutionConfig.level_4_categories || "";
    const level3Categories = solutionConfig.level_3_categories || "";
    
    
    const level4Ids = level4Categories 
      ? level4Categories.split(',').map(s => parseInt(s.trim())).filter(id => !isNaN(id))
      : [];
    const level3Ids = level3Categories 
      ? level3Categories.split(',').map(s => parseInt(s.trim())).filter(id => !isNaN(id))
      : [];
      
      
    return { level4Ids, level3Ids };
  }

  ajax("/site.json").then((siteData) => {
    const idToCategory = {};
    siteData.categories.forEach((cat) => {
      idToCategory[cat.id] = cat;
    });

    // Function to validate and log category IDs for a solution
    function validateSolutionCategories(solutionConfig) {
      const { level4Ids, level3Ids } = getCategoryIds(solutionConfig);
      
      const invalidLevel4 = level4Ids.filter(id => !idToCategory[id]);
      const invalidLevel3 = level3Ids.filter(id => !idToCategory[id]);
      
      const configTitle = solutionConfig.title || solutionConfig.name || 'Solution';
      
      if (invalidLevel4.length > 0 && (isAdmin || isDevelopment)) {
        console.error(`❌ Invalid Level 4 category IDs for ${configTitle}: ${invalidLevel4.join(', ')}`);
      }
      
      if (invalidLevel3.length > 0 && (isAdmin || isDevelopment)) {
        console.error(`❌ Invalid Level 3 category IDs for ${configTitle}: ${invalidLevel3.join(', ')}`);
      }

      const validLevel4Names = level4Ids.filter(id => idToCategory[id]).map(id => idToCategory[id].name);
      const validLevel3Names = level3Ids.filter(id => idToCategory[id]).map(id => idToCategory[id].name);

    }

    // Initial validation only in development/admin mode
    if (initialConfig && (isAdmin || isDevelopment)) {
      validateSolutionCategories(initialConfig.solutionConfig);
    }

    // Function to update dropdown text
    function updateDropdownText() {
      // Update the main dropdown text
      const dropdown = document.querySelector('.custom-list-dropdown .select-kit-selected-name .name');
      if (dropdown && dropdown.textContent && dropdown.textContent.trim() === 'Custom lists') {
        dropdown.textContent = 'Solutions';
      }

      // Also find dropdowns by data-name attribute in case the class isn't there
      const dropdownsByName = document.querySelectorAll('.select-kit-selected-name .name');
      dropdownsByName.forEach(nameEl => {
        if (nameEl && nameEl.textContent && nameEl.textContent.trim() === 'Custom lists') {
          nameEl.textContent = 'Solutions';
        }
      });

      // Update the aria-label and title attributes for the header
      const headers = document.querySelectorAll('.select-kit-header');
      headers.forEach(header => {
        if (!header) return;

        const ariaLabel = header.getAttribute('aria-label');
        const dataName = header.getAttribute('data-name');

        if (ariaLabel && ariaLabel.includes('Custom lists')) {
          header.setAttribute('aria-label', ariaLabel.replace('Custom lists', 'Solutions'));
        }
        if (dataName === 'Custom lists') {
          header.setAttribute('data-name', 'Solutions');
        }
      });

      // Update selected choice elements
      const selectedChoices = document.querySelectorAll('.selected-name.choice');
      selectedChoices.forEach(selectedChoice => {
        if (!selectedChoice) return;

        const title = selectedChoice.getAttribute('title');
        const dataName = selectedChoice.getAttribute('data-name');

        if (title === 'Custom lists') {
          selectedChoice.setAttribute('title', 'Solutions');
        }
        if (dataName === 'Custom lists') {
          selectedChoice.setAttribute('data-name', 'Solutions');
        }
      });
    }

    const currentUser = api.getCurrentUser();
    const watched = currentUser?.watched_category_ids || [];
    const watchedFirst = currentUser?.watched_first_post_category_ids || [];

    // Function to check subscription status for current solution
    function isSubscribedToSolution(solutionConfig) {
      if (!currentUser) return false;
      const { level4Ids, level3Ids } = getCategoryIds(solutionConfig);
      return level4Ids.length > 0 && level4Ids.every((id) => watchedFirst.includes(id)) &&
             level3Ids.length > 0 && level3Ids.every((id) => watched.includes(id));
    }

    // Header styling function for reuse
    function styleHeader(header, forceUpdate = false) {
      if (!header) return;

      const currentConfig = getCurrentSolutionConfig();
      if (!currentConfig || !currentConfig.solutionConfig) return;

      // If forcing update, clear the styled flag and previous slug
      if (forceUpdate && header.dataset) {
        delete header.dataset.styled;
        delete header.dataset.currentSlug;
      }

      // Check if we need to update content (different solution)
      if (header.dataset && header.dataset.currentSlug && header.dataset.currentSlug === currentConfig.slug && !forceUpdate) {
        return; // Same solution, no need to update
      }

      const config = currentConfig.solutionConfig;
      const title = config.subtitle || config.name || config.title || 'Solution';
      const desc = config.description || '';

      header.innerHTML = `
        <div class="category-title-contents">
          <h1 class="category-title">${title}<br>News & Security Advisories</h1>
          <div class="category-title-description">
            <div class="solution-subtext">
              ${desc}
            </div>
          </div>
        </div>
      `;

      // Apply header container styling - match staging exactly
      if (header.style) {
        header.style.background = "var(--secondary)";
        header.style.borderTop = "6px solid var(--tertiary)";
        header.style.borderRadius = "6px";
        header.style.padding = "0px";
        header.style.marginBottom = "20px";
        header.style.display = "flex";
        header.style.justifyContent = "center";
        header.style.visibility = "visible";
      }

      // Show header after styling is complete
      if (header.style) {
        header.style.visibility = 'visible';
      }
      if (header.classList) {
        header.classList.add("header-styled");
      }

      // Style the contents wrapper - increased width to allow subtext expansion
      const contents = header.querySelector(".category-title-contents");
      if (contents && contents.style) {
        contents.style.padding = "20px";
        contents.style.margin = "0px auto";
        contents.style.width = "100%";
        contents.style.maxWidth = "1100px";
        contents.style.textAlign = "center";
        contents.style.visibility = "visible";
      }

      // Style the title - match staging exactly
      const titleEl = header.querySelector(".category-title");
      if (titleEl && titleEl.style) {
        titleEl.style.fontSize = "clamp(22px, 3vw, 30px)";
        titleEl.style.fontWeight = "700";
        titleEl.style.color = "var(--primary)";
        titleEl.style.lineHeight = "1.2";
        titleEl.style.maxWidth = "850px";
        titleEl.style.margin = "0px auto 16px";
        titleEl.style.textAlign = "center";
        titleEl.style.display = "block";
        titleEl.style.width = "100%";
      }

      // Style the description - expanded width for two-line layout
      const subtext = header.querySelector(".solution-subtext");
      if (subtext && subtext.style) {
        subtext.style.fontSize = "17px";
        subtext.style.color = "var(--primary-high)";
        subtext.style.lineHeight = "1.6";
        subtext.style.maxWidth = "1000px";
        subtext.style.margin = "0px auto";
        subtext.style.textAlign = "center";
      }

      // Mark as styled and remember current solution
      if (header.dataset) {
        header.dataset.styled = 'true';
        header.dataset.currentSlug = currentConfig.slug;
      }
    }

    // Function to update subscribe button for current solution
    function updateSubscribeButton() {
      const nav = document.querySelector(".navigation-controls");
      if (!nav || !currentUser) return; // Only show subscribe button if user is logged in

      const currentConfig = getCurrentSolutionConfig();
      if (!currentConfig) {
        // Remove subscribe button if not on solution page
        const existingWrapper = document.querySelector("#solution-subscribe-wrapper");
        if (existingWrapper) existingWrapper.remove();
        return;
      }
      
      // Remove existing button
      const existingWrapper = document.querySelector("#solution-subscribe-wrapper");
      if (existingWrapper) existingWrapper.remove();
      
      const { level4Ids, level3Ids } = getCategoryIds(currentConfig.solutionConfig);
      const isSubscribed = isSubscribedToSolution(currentConfig.solutionConfig);

      nav.style.display = "flex";
      nav.style.alignItems = "center";

      const wrapper = document.createElement("div");
      wrapper.id = "solution-subscribe-wrapper";
      wrapper.style.marginLeft = "auto";

      const btn = document.createElement("button");
      btn.id = "solution-subscribe-button";
      btn.className = "btn btn-default";
      const bellIcon = '<svg class="fa d-icon d-icon-d-regular svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#far-bell"></use></svg>';
      
      // Dynamic button text based on window width with ultra-compact mode
      function updateButtonText() {
        const windowWidth = window.innerWidth;
        const isCurrentlySubscribed = btn.classList.contains("subscribed");
        
        if (windowWidth > 1200) {
          // Full text mode - above 1200px
          if (isCurrentlySubscribed) {
            btn.innerHTML = `✅ Subscribed&nbsp;To All News & Security Advisories`;
          } else {
            btn.innerHTML = `${bellIcon} Subscribe&nbsp;To All News & Security Advisories`;
          }
        } else if (windowWidth > 800) {
          // Truncated text mode - 800px to 1200px
          if (isCurrentlySubscribed) {
            btn.innerHTML = `✅ Subscribed`;
          } else {
            btn.innerHTML = `${bellIcon} Subscribe`;
          }
        } else {
          // Ultra-compact mode - below 800px (just icon)
          if (isCurrentlySubscribed) {
            btn.innerHTML = `✅`;
            btn.title = "Subscribed To All News & Security Advisories";
          } else {
            btn.innerHTML = bellIcon;
            btn.title = "Subscribe To All News & Security Advisories";
          }
        }
      }
      
      // Set initial text
      updateButtonText();
      
      // Update text on window resize
      const resizeHandler = () => updateButtonText();
      window.addEventListener('resize', resizeHandler);
      if (isSubscribed) btn.classList.add("subscribed");
      
      // FORCE navigation alignment with JavaScript since CSS isn't working
      function forceNavigationAlignment() {
        // Target the full container hierarchy
        const listControls = document.querySelector('.list-controls');
        const container = listControls?.querySelector('.container');
        const navigationContainer = container?.querySelector('.navigation-container');
        const categoryBreadcrumb = navigationContainer?.querySelector('.category-breadcrumb');
        const navigationControls = navigationContainer?.querySelector('.navigation-controls');
        const subscribeWrapper = navigationControls?.querySelector('#solution-subscribe-wrapper');

        if (listControls && listControls.style) {
          listControls.style.width = '100%';
        }

        if (container && container.style) {
          container.style.width = '100%';
          container.style.maxWidth = 'none';
        }

        if (navigationContainer && navigationContainer.style) {
          navigationContainer.style.display = 'flex';
          navigationContainer.style.justifyContent = 'space-between';
          navigationContainer.style.alignItems = 'center';
          navigationContainer.style.width = '100%';
        }

        if (categoryBreadcrumb && categoryBreadcrumb.style) {
          categoryBreadcrumb.style.display = 'flex';
          categoryBreadcrumb.style.alignItems = 'center';
          categoryBreadcrumb.style.flexGrow = '1';
        }

        if (navigationControls && navigationControls.style) {
          navigationControls.style.display = 'flex';
          navigationControls.style.alignItems = 'center';
          navigationControls.style.marginLeft = 'auto';
          navigationControls.style.flexShrink = '0';
        }

        if (subscribeWrapper && subscribeWrapper.style) {
          subscribeWrapper.style.marginLeft = 'auto';
          subscribeWrapper.style.flexShrink = '0';
        }
      }
      
      // Apply alignment immediately and on resize
      forceNavigationAlignment();
      window.addEventListener('resize', forceNavigationAlignment);

      if (level4Ids.length === 0 && level3Ids.length === 0) {
        btn.disabled = true;
        btn.textContent = "No valid categories configured";
        btn.title = "Check console for available category IDs";
      }

      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        
        const subscribing = !btn.classList.contains("subscribed");
        const allUpdates = [];

        level4Ids.forEach((id) => {
          allUpdates.push(
            ajax(`/category/${id}/notifications`, {
              type: "POST",
              data: { notification_level: subscribing ? 4 : 1 },
            })
          );
        });

        level3Ids.forEach((id) => {
          allUpdates.push(
            ajax(`/category/${id}/notifications`, {
              type: "POST",
              data: { notification_level: subscribing ? 3 : 1 },
            })
          );
        });

        btn.disabled = true;
        btn.innerHTML = subscribing ? "⏳ Subscribing..." : "⏳ Unsubscribing...";

        Promise.all(allUpdates)
          .then(() => {
            // Update subscription status and refresh button text
            if (subscribing) {
              btn.classList.add("subscribed");
            } else {
              btn.classList.remove("subscribed");
            }
            updateButtonText(); // Use the dynamic text function
          })
          .catch((error) => {
            console.error("Failed to update subscriptions:", error);
            btn.innerHTML = "❌ Error - Try again";
            setTimeout(() => {
              updateButtonText(); // Use the dynamic text function
            }, 3000);
          })
          .finally(() => {
            btn.disabled = false;
          });
      });

      wrapper.appendChild(btn);
      nav.appendChild(wrapper);
    }

    // Handler for applying styles to current page
    function applyCurrentPageStyles() {
      const header = document.querySelector(".category-title-header");
      if (header) {
        styleHeader(header, true); // Force update to handle page navigation
      }
      updateSubscribeButton();
      updateDropdownText();
    }

    // Apply initial styles if we're on a solution page
    if (initialConfig) {
      // Use a timer to ensure DOM is ready
      setTimeout(() => {
        applyCurrentPageStyles();
        updateDropdownText(); // Update dropdown text on initial load
      }, 100);
      
      // Update dropdown text periodically to catch any dynamic updates
      const textUpdateInterval = setInterval(() => {
        if (window.location.pathname.includes('/lists/')) {
          updateDropdownText();
        } else {
          clearInterval(textUpdateInterval);
        }
      }, 500);
    }

    // Listen for page changes using Discourse's router with ULTRA-AGGRESSIVE enforcement
    api.onPageChange((url) => {
      const isListsPage = url.includes('/lists/');
      
      // IMMEDIATE aggressive hiding on navigation
      aggressiveHideNavElements();
      
      // Also run with multiple timeouts for persistent enforcement
      setTimeout(() => {
        aggressiveHideNavElements();
        
        if (isListsPage) {
          const currentConfig = getCurrentSolutionConfig();
          if (currentConfig) {
            const configTitle = currentConfig.solutionConfig.title || currentConfig.solutionConfig.name || 'Solution';
            // Reduced logging for cleaner console
            applyCurrentPageStyles();
          }
        }
      }, 50); // Reduced delay for faster response
      
      // Additional aggressive enforcement at different intervals
      setTimeout(() => aggressiveHideNavElements(), 100);
      setTimeout(() => aggressiveHideNavElements(), 200);
      setTimeout(() => aggressiveHideNavElements(), 500);
      
      // Ultra-aggressive: Run every 100ms for 3 seconds after page change
      if (isListsPage) {
        let pageChangeIntervalCount = 0;
        const maxPageChangeIntervals = 30; // 3 seconds (30 * 100ms)
        const pageChangeHider = setInterval(() => {
          aggressiveHideNavElements();
          pageChangeIntervalCount++;
          if (pageChangeIntervalCount >= maxPageChangeIntervals) {
            clearInterval(pageChangeHider);
          }
        }, 100);
      }
    });

    // ULTRA-AGGRESSIVE MutationObserver to watch for navigation elements and headers
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      let shouldHideNav = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes) {
          const addedNodes = Array.from(mutation.addedNodes);

          // Check for header changes
          const hasHeader = addedNodes.some(node =>
            node && node.nodeType === 1 && (
              (node.classList && node.classList.contains('category-title-header')) ||
              (node.querySelector && node.querySelector('.category-title-header'))
            )
          );

          // Check for navigation elements that need hiding
          const hasNavElements = addedNodes.some(node =>
            node && node.nodeType === 1 && (
              (node.classList && (
                node.classList.contains('nav-item_categories') ||
                node.classList.contains('nav-item_latest') ||
                node.classList.contains('nav-item_top') ||
                node.classList.contains('nav-item_new') ||
                node.classList.contains('nav-item_unread') ||
                node.classList.contains('navigation-controls')
              )) ||
              (node.querySelector && (
                node.querySelector('.nav-item_categories, .nav-item_latest, .nav-item_top, .nav-item_new, .nav-item_unread') ||
                node.querySelector('.navigation-controls .nav-pills, .topic-list-header .sortable, .period-chooser')
              ))
            )
          );

          if (hasHeader) {
            shouldUpdate = true;
          }

          if (hasNavElements) {
            shouldHideNav = true;
          }
        }
      });

      if (shouldUpdate) {
        setTimeout(() => {
          applyCurrentPageStyles();
        }, 10); // Faster response
      }

      if (shouldHideNav) {
        // Immediate hiding when navigation elements are detected
        aggressiveHideNavElements();
        // Also run with small delays to catch any late additions
        setTimeout(() => aggressiveHideNavElements(), 10);
        setTimeout(() => aggressiveHideNavElements(), 50);
        setTimeout(() => aggressiveHideNavElements(), 100);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Clean up observer when leaving the page
    api.onPageChange(() => {
      // Don't disconnect observer, we want it to keep working
    });
  });
});