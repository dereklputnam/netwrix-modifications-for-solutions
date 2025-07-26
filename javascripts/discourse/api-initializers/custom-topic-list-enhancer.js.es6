import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.11.1", (api) => {
  // PRIORITY: Hide navigation elements immediately to prevent flash
  const hideNavElements = () => {
    const style = document.createElement('style');
    style.textContent = `
      #navigation-bar .nav-item_categories,
      #navigation-bar .nav-item_latest, 
      #navigation-bar .nav-item_new,
      #navigation-bar .nav-item_top,
      #navigation-bar .nav-item_unread {
        display: none !important;
      }
      
      /* Hide responsive line breaks by default */
      .category-title .break-medium,
      .category-title .break-small {
        display: none !important;
      }
      
      /* Show breaks on medium screens */
      @media (max-width: 1200px) {
        .category-title .break-medium {
          display: inline !important;
        }
      }
      
      /* Show breaks on small screens */
      @media (max-width: 768px) {
        .category-title .break-small {
          display: inline !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Also hide immediately with JavaScript
    const navItems = document.querySelectorAll('#navigation-bar .nav-item_categories, #navigation-bar .nav-item_latest, #navigation-bar .nav-item_new, #navigation-bar .nav-item_top, #navigation-bar .nav-item_unread');
    navItems.forEach(item => item.style.display = 'none');
    
    // Hide category and tag filter dropdowns
    const filterDropdowns = document.querySelectorAll('.category-breadcrumb .category-drop, .category-breadcrumb .select-kit.tag-drop:not(.custom-list-dropdown)');
    filterDropdowns.forEach(item => item.style.display = 'none');
    
    // Also hide their parent <li> elements
    const breadcrumbItems = document.querySelectorAll('.category-breadcrumb li');
    breadcrumbItems.forEach((li, index) => {
      if (index < 2) { // Hide first two <li> elements (categories and tags)
        const hasCustomList = li.querySelector('.custom-list-dropdown');
        if (!hasCustomList) {
          li.style.display = 'none';
        }
      }
    });
  };
  
  // Execute immediately
  hideNavElements();
  
  // Also run on DOM ready and with intervals for persistent hiding
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideNavElements);
  } else {
    hideNavElements();
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
    
    // First try to get from site.custom_topic_lists (Custom Topic Lists plugin)
    const customTopicLists = api.container.lookup("service:site")?.custom_topic_lists || [];
    let solutionConfig = customTopicLists.find(list => list.slug === slug);
    
    // Fallback to theme settings if not found in plugin
    if (!solutionConfig) {
      solutionConfig = settings.netwrix_solutions?.find(solution => solution.slug === slug);
    }
    
    if (!solutionConfig) {
      if (isAdmin || isDevelopment) {
        console.log(`No solution configuration found for slug: ${slug}`);
        console.log(`Available in plugin:`, customTopicLists?.map(s => s.slug));
        console.log(`Available in theme:`, settings.netwrix_solutions?.map(s => s.slug));
      }
      return null;
    }

    if (isAdmin || isDevelopment) {
      console.log(`Found solution config for: ${solutionConfig.title || solutionConfig.name} (slug: ${slug})`);
    }
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

      if (isAdmin || isDevelopment) {
        console.log(`✅ ${configTitle} Level 4 categories: ${validLevel4Names.join(', ')} (IDs: ${level4Ids.join(', ')})`);
        console.log(`✅ ${configTitle} Level 3 categories: ${validLevel3Names.join(', ')} (IDs: ${level3Ids.join(', ')})`);
      }
    }

    // Validate current solution
    if (initialConfig) {
      validateSolutionCategories(initialConfig.solutionConfig);
    }

    // Function to update dropdown text
    function updateDropdownText() {
      const dropdown = document.querySelector('.custom-list-dropdown .select-kit-selected-name .name');
      if (dropdown && dropdown.textContent.trim() === 'Custom lists') {
        dropdown.textContent = 'Solution';
      }
      
      // Also update the aria-label and title attributes
      const header = document.querySelector('.custom-list-dropdown .select-kit-header');
      if (header) {
        const ariaLabel = header.getAttribute('aria-label');
        const dataName = header.getAttribute('data-name');
        
        if (ariaLabel && ariaLabel.includes('Custom lists')) {
          header.setAttribute('aria-label', ariaLabel.replace('Custom lists', 'Solution'));
        }
        if (dataName === 'Custom lists') {
          header.setAttribute('data-name', 'Solution');
        }
      }
      
      const selectedChoice = document.querySelector('.custom-list-dropdown .selected-name.choice');
      if (selectedChoice) {
        const title = selectedChoice.getAttribute('title');
        const dataName = selectedChoice.getAttribute('data-name');
        
        if (title === 'Custom lists') {
          selectedChoice.setAttribute('title', 'Solution');
        }
        if (dataName === 'Custom lists') {
          selectedChoice.setAttribute('data-name', 'Solution');
        }
      }
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
      if (!currentConfig) return;
      
      // If forcing update, clear the styled flag and previous slug
      if (forceUpdate) {
        delete header.dataset.styled;
        delete header.dataset.currentSlug;
      }
      
      // Check if we need to update content (different solution)
      if (header.dataset.currentSlug && header.dataset.currentSlug === currentConfig.slug && !forceUpdate) {
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

      // Apply header container styling
      header.style.background = "var(--secondary)";
      header.style.border = "1px solid var(--primary-low)";
      header.style.borderTop = "6px solid var(--tertiary)";
      header.style.borderRadius = "6px";
      header.style.padding = "0";
      header.style.marginBottom = "20px";
      header.style.display = "flex";
      header.style.justifyContent = "center";
      
      // Show header after styling is complete
      header.style.visibility = 'visible';
      header.classList.add("header-styled");

      // Style the contents wrapper
      const contents = header.querySelector(".category-title-contents");
      if (contents) {
        contents.style.padding = "40px 20px 20px";
        contents.style.margin = "0 auto";
        contents.style.width = "100%";
        contents.style.maxWidth = "850px";
        contents.style.textAlign = "center";
      }

      // Style the title
      const titleEl = header.querySelector(".category-title");
      if (titleEl) {
        titleEl.style.fontSize = "clamp(22px, 3vw, 30px)";
        titleEl.style.fontWeight = "700";
        titleEl.style.color = "var(--primary)";
        titleEl.style.lineHeight = "1.2";
        titleEl.style.maxWidth = "850px";
        titleEl.style.margin = "0 auto 16px auto";
        titleEl.style.textAlign = "center";
        titleEl.style.display = "block";
        titleEl.style.width = "100%";
        
      }

      // Style the description
      const subtext = header.querySelector(".solution-subtext");
      if (subtext) {
        subtext.style.fontSize = "17px";
        subtext.style.color = "var(--primary-high)";
        subtext.style.lineHeight = "1.6";
        subtext.style.maxWidth = "900px";
        subtext.style.margin = "0 auto";
        subtext.style.textAlign = "center";
      }
      
      // Mark as styled and remember current solution
      header.dataset.styled = 'true';
      header.dataset.currentSlug = currentConfig.slug;
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
      btn.innerHTML = isSubscribed ? `✅ Subscribed&nbsp;<span class="mobile-hidden">To All News & Security Advisories</span>` : `${bellIcon} Subscribe&nbsp;<span class="mobile-hidden">To All News & Security Advisories</span>`;
      if (isSubscribed) btn.classList.add("subscribed");

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
            const configTitle = currentConfig.solutionConfig.title || currentConfig.solutionConfig.name || 'Solution';
            btn.innerHTML = subscribing ? `✅ Subscribed&nbsp;<span class="mobile-hidden">To All ${configTitle} News & Security Advisories</span>` : `${bellIcon} Subscribe&nbsp;<span class="mobile-hidden">To All ${configTitle} News & Security Advisories</span>`;
            if (subscribing) {
              btn.classList.add("subscribed");
            } else {
              btn.classList.remove("subscribed");
            }
            btn.disabled = false;
          })
          .catch((error) => {
            if (isAdmin || isDevelopment) {
              console.error("Error updating subscription:", error);
            }
            const configTitle = currentConfig.solutionConfig.title || currentConfig.solutionConfig.name || 'Solution';
            btn.innerHTML = subscribing ? `${bellIcon} Subscribe&nbsp;<span class="mobile-hidden">To All ${configTitle} News & Security Advisories</span>` : `✅ Subscribed&nbsp;<span class="mobile-hidden">To All ${configTitle} News & Security Advisories</span>`;
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
      }, 100);
    }

    // Listen for page changes using Discourse's router
    api.onPageChange((url) => {
      const isListsPage = url.includes('/lists/');
      
      setTimeout(() => {
        if (isListsPage) {
          const currentConfig = getCurrentSolutionConfig();
          if (currentConfig) {
            const configTitle = currentConfig.solutionConfig.title || currentConfig.solutionConfig.name || 'Solution';
            if (isAdmin || isDevelopment) {
              console.log(`✅ Navigated to solution: ${configTitle}`);
              validateSolutionCategories(currentConfig.solutionConfig);
            }
            applyCurrentPageStyles();
          }
        }
      }, 300); // Give time for DOM to update
    });

    // Fallback: Use MutationObserver to watch for header changes
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasHeader = addedNodes.some(node => 
            node.nodeType === 1 && (
              node.classList?.contains('category-title-header') ||
              node.querySelector?.('.category-title-header')
            )
          );
          
          if (hasHeader) {
            shouldUpdate = true;
          }
        }
      });
      
      if (shouldUpdate) {
        setTimeout(() => {
          applyCurrentPageStyles();
        }, 50);
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