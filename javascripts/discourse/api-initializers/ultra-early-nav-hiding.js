import { apiInitializer } from "discourse/lib/api";

// Use version 0.1 to load as early as possible
export default apiInitializer("0.1", (api) => {
  // Only run on /lists/ pages
  if (!window.location.pathname.includes('/lists/') && !window.location.pathname.includes('/community/lists/')) {
    return;
  }

  // JavaScript-based element hiding to supplement CSS
  const hideElementsImmediately = () => {
    // Main navigation items
    const navItems = document.querySelectorAll('#navigation-bar .nav-item_categories, #navigation-bar .nav-item_latest, #navigation-bar .nav-item_new, #navigation-bar .nav-item_top, #navigation-bar .nav-item_unread');
    navItems.forEach(item => {
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
      item.style.width = '0';
      item.style.height = '0';
      item.style.overflow = 'hidden';
    });

    // Sorting navigation elements
    const sortingElements = document.querySelectorAll('.navigation-controls .nav-pills .nav-item, .topic-list-header .sortable, .period-chooser, .list-controls .nav-pills');
    sortingElements.forEach(item => {
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
      item.style.width = '0';
      item.style.height = '0';
      item.style.overflow = 'hidden';
    });

    const filterDropdowns = document.querySelectorAll('.category-breadcrumb .category-drop, .category-breadcrumb .tag-drop:not(.custom-list-dropdown)');
    filterDropdowns.forEach(item => {
      item.style.display = 'none';
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
      item.style.width = '0';
      item.style.height = '0';
      item.style.overflow = 'hidden';
    });

    const breadcrumbItems = document.querySelectorAll('.category-breadcrumb li');
    breadcrumbItems.forEach((li, index) => {
      if (index < 2) { // Hide first two <li> elements (categories and tags)
        const hasCustomList = li.querySelector('.custom-list-dropdown');
        if (!hasCustomList) {
          li.style.display = 'none';
          li.style.visibility = 'hidden';
          li.style.opacity = '0';
          li.style.width = '0';
          li.style.height = '0';
          li.style.overflow = 'hidden';
        }
      }
    });
  };

  // Run immediately
  hideElementsImmediately();

  // Run on every animation frame for the first second to catch any late-loading elements
  let frameCount = 0;
  const maxFrames = 60; // ~1 second at 60fps
  const frameHider = () => {
    hideElementsImmediately();
    frameCount++;
    if (frameCount < maxFrames) {
      requestAnimationFrame(frameHider);
    }
  };
  requestAnimationFrame(frameHider);
});
