import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.11.1", (api) => {
  // Note: Element hiding is now handled by CSS files for zero-flash experience

  // PRIORITY: Hide navigation elements immediately to prevent flash - ONLY on /lists/ pages
  const hideNavElements = () => {
    // Only run on /lists/ pages
    if (!window.location.pathname.includes('/lists/')) {
      return;
    }
    
    // Hide specific navigation elements immediately with JavaScript on /lists/ pages only
    const navItems = document.querySelectorAll('#navigation-bar .nav-item_categories, #navigation-bar .nav-item_latest, #navigation-bar .nav-item_top');
    navItems.forEach(item => item.style.display = 'none');
    
    // Hide category and tag filter dropdowns with multiple selector approaches
    // Method 1: Hide by header data-name attribute
    const categoryHeaders = document.querySelectorAll('.category-breadcrumb .category-drop-header[data-name="categories"]');
    const tagHeaders = document.querySelectorAll('.category-breadcrumb .tag-drop-header[data-name="tags"]');
    
    categoryHeaders.forEach(header => {
      const parentLi = header.closest('li');
      if (parentLi) {
        parentLi.style.display = 'none';
        parentLi.style.visibility = 'hidden';
      }
    });
    
    tagHeaders.forEach(header => {
      const parentLi = header.closest('li');
      if (parentLi) {
        parentLi.style.display = 'none';
        parentLi.style.visibility = 'hidden';
      }
    });
    
    // Method 2: Hide by dropdown classes (broader approach)
    const filterDropdowns = document.querySelectorAll('.category-breadcrumb .category-drop, .category-breadcrumb .select-kit.tag-drop:not(.custom-list-dropdown), .category-breadcrumb .tag-drop:not(.custom-list-dropdown)');
    filterDropdowns.forEach(item => {
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      const parentLi = item.closest('li');
      if (parentLi) {
        parentLi.style.display = 'none';
        parentLi.style.visibility = 'hidden';
      }
    });
    
    // Method 3: Hide breadcrumb li elements that contain category/tag dropdowns (but not Solutions)
    const breadcrumbItems = document.querySelectorAll('.category-breadcrumb li');
    breadcrumbItems.forEach((li, index) => {
      // Skip if it contains the Solutions dropdown
      if (li.querySelector('.custom-list-dropdown')) {
        return;
      }
      
      // Hide if it contains category or tag dropdowns
      const hasCategoryDrop = li.querySelector('.category-drop');
      const hasTagDrop = li.querySelector('.tag-drop:not(.custom-list-dropdown)');
      
      if (hasCategoryDrop || hasTagDrop) {
        li.style.display = 'none';
        li.style.visibility = 'hidden';
      }
    });
  };
  
  // Global function to update dropdown text from "Custom lists" to "Solutions" 
  const updateDropdownTextGlobal = () => {
    // Update all select-kit headers with "Custom lists" data-name or aria-label
    const headers = document.querySelectorAll('.select-kit-header');
    headers.forEach(header => {
      const ariaLabel = header.getAttribute('aria-label');
      const dataName = header.getAttribute('data-name');
      const summaryName = header.getAttribute('name');
      
      if (ariaLabel && ariaLabel.includes('Custom lists')) {
        header.setAttribute('aria-label', ariaLabel.replace(/Custom lists/g, 'Solutions'));
      }
      if (dataName === 'Custom lists') {
        header.setAttribute('data-name', 'Solutions');
      }
      if (summaryName && summaryName.includes('Custom lists')) {
        header.setAttribute('name', summaryName.replace(/Custom lists/g, 'Solutions'));
      }
    });
    
    // Update all selected-name elements
    const selectedNames = document.querySelectorAll('.selected-name');
    selectedNames.forEach(selected => {
      const title = selected.getAttribute('title');
      const dataName = selected.getAttribute('data-name');
      
      if (title === 'Custom lists') {
        selected.setAttribute('title', 'Solutions');
      }
      if (dataName === 'Custom lists') {
        selected.setAttribute('data-name', 'Solutions');
      }
    });
    
    // Update text content in name spans
    const nameSpans = document.querySelectorAll('.select-kit-selected-name .name, .selected-name .name');
    nameSpans.forEach(nameEl => {
      if (nameEl.textContent && nameEl.textContent.trim() === 'Custom lists') {
        nameEl.textContent = 'Solutions';
      }
    });
    
    // Also check for any dropdown elements that might contain "Custom lists"
    const dropdowns = document.querySelectorAll('.custom-list-dropdown .select-kit-selected-name .name');
    dropdowns.forEach(dropdown => {
      if (dropdown.textContent && dropdown.textContent.trim() === 'Custom lists') {
        dropdown.textContent = 'Solutions';
      }
    });
  };

  // Execute immediately
  hideNavElements();
  updateDropdownTextGlobal();
  
  // Also run on DOM ready and with intervals for persistent hiding and text updates
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      hideNavElements();
      updateDropdownTextGlobal();
    });
  } else {
    hideNavElements();
    updateDropdownTextGlobal();
  }
  
  // Run text updates frequently to catch dynamic changes
  const textUpdateInterval = setInterval(() => {
    updateDropdownTextGlobal();
  }, 500);
  

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

    if (isAdmin || isDevelopment) {
      console.log(`Found solution config for: ${solutionConfig.title || solutionConfig.name} (slug: ${slug})`);
      console.log(`Config source: ${settings.netwrix_solutions?.find(s => s.slug === slug) ? 'theme settings' : 'plugin data'}`);
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
    
    if (isAdmin || isDevelopment) {
      console.log(`Category data for ${solutionConfig.title || solutionConfig.name}:`);
      console.log(`  level_4_categories: "${level4Categories}"`);
      console.log(`  level_3_categories: "${level3Categories}"`);
    }
    
    const level4Ids = level4Categories 
      ? level4Categories.split(',').map(s => parseInt(s.trim())).filter(id => !isNaN(id))
      : [];
    const level3Ids = level3Categories 
      ? level3Categories.split(',').map(s => parseInt(s.trim())).filter(id => !isNaN(id))
      : [];
      
    if (isAdmin || isDevelopment) {
      console.log(`  Parsed level4Ids: [${level4Ids.join(', ')}]`);
      console.log(`  Parsed level3Ids: [${level3Ids.join(', ')}]`);
    }
      
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
      // Update the main dropdown text
      const dropdown = document.querySelector('.custom-list-dropdown .select-kit-selected-name .name');
      if (dropdown && dropdown.textContent.trim() === 'Custom lists') {
        dropdown.textContent = 'Solutions';
      }
      
      // Also find dropdowns by data-name attribute in case the class isn't there
      const dropdownsByName = document.querySelectorAll('.select-kit-selected-name .name');
      dropdownsByName.forEach(nameEl => {
        if (nameEl.textContent.trim() === 'Custom lists') {
          nameEl.textContent = 'Solutions';
        }
      });
      
      // Update the aria-label and title attributes for the header
      const headers = document.querySelectorAll('.select-kit-header');
      headers.forEach(header => {
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
        if (isAdmin || isDevelopment) {
          console.error(`❌ No valid categories found for ${currentConfig.solutionConfig.title || currentConfig.solutionConfig.name}`);
          console.error(`   level_4_categories: "${currentConfig.solutionConfig.level_4_categories || 'undefined'}"`);
          console.error(`   level_3_categories: "${currentConfig.solutionConfig.level_3_categories || 'undefined'}"`);
        }
      } else if (isAdmin || isDevelopment) {
        console.log(`✅ Subscribe button enabled with ${level4Ids.length} level 4 + ${level3Ids.length} level 3 categories`);
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
      updateDropdownTextGlobal(); // Also run global text updates
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

    // Listen for page changes using Discourse's router
    api.onPageChange((url) => {
      const isListsPage = url.includes('/lists/');
      
      // Always run hideNavElements and global text updates to handle showing/hiding based on page type
      setTimeout(() => {
        hideNavElements();
        updateDropdownTextGlobal();
        
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
          updateDropdownTextGlobal(); // Ensure text updates after DOM changes
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