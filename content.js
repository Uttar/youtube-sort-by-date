(function() {
    function parseYouTubeDate(dateString) {
        if (!dateString) return 0;
        
        const now = new Date();
        const dateStringLower = dateString.toLowerCase();
        
        // Handle special cases
        if (dateStringLower.includes('yesterday')) {
            return now - 24 * 60 * 60 * 1000;
        }
        if (dateStringLower.includes('just now') || dateStringLower.includes('moment ago')) {
            return now - 10 * 1000;
        }

        // Extract number using regex because string can start with "Streamed" or other words
        const match = dateStringLower.match(/(\d+)/);
        let value = match ? parseInt(match[1]) : 0;
        
        if (!match) {
            if (dateStringLower.includes('second')) value = 1;
            else if (dateStringLower.includes('minute')) value = 1;
            else if (dateStringLower.includes('hour')) value = 1;
            else if (dateStringLower.includes('day')) value = 1;
            else if (dateStringLower.includes('week')) value = 1;
            else if (dateStringLower.includes('month')) value = 1;
            else if (dateStringLower.includes('year')) value = 1;
            else return 0; // Unknown format
        }

        if (dateStringLower.includes('second')) return now - value * 1000;
        if (dateStringLower.includes('minute')) return now - value * 60 * 1000;
        if (dateStringLower.includes('hour')) return now - value * 60 * 60 * 1000;
        if (dateStringLower.includes('day')) return now - value * 24 * 60 * 60 * 1000;
        if (dateStringLower.includes('week')) return now - value * 7 * 24 * 60 * 60 * 1000;
        if (dateStringLower.includes('month')) return now - value * 30 * 24 * 60 * 60 * 1000;
        if (dateStringLower.includes('year')) return now - value * 365 * 24 * 60 * 60 * 1000;
        
        return 0;
    }

    function sortVideos() {
        if (window._ytSortingInProgress) return;
        window._ytSortingInProgress = true;
        
        console.log('Sort button clicked');
        
        let container = document.querySelector('ytd-section-list-renderer #contents, ytd-item-section-renderer #contents, #contents.ytd-rich-grid-renderer, #items.ytd-grid-renderer');
        
        if (!container) {
            // Fallback: try to find any container that has video renderers as direct children
            const possibleContainers = document.querySelectorAll('#contents, #items');
            for (const c of possibleContainers) {
                if (c.querySelector('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer')) {
                    container = c;
                    break;
                }
            }
        }
        
        if (!container) {
            console.error('Video container not found');
            console.log('DOM structure hint:', document.querySelector('ytd-page-manager')?.tagName);
            window._ytSortingInProgress = false;
            return;
        }

        sortVideosWithContainer(container);
        window._ytSortingInProgress = false;
    }

    function sortVideosWithContainer(container) {
        // Get ALL children to maintain their presence (ads, shelves, etc.)
        const children = Array.from(container.children);
        
        // Identify which children are videos
        // YouTube may use different tags depending on the layout
        const isVideoElement = (el) => {
            const tagName = el.tagName.toLowerCase();
            return tagName === 'ytd-video-renderer' || 
                   tagName === 'ytd-grid-video-renderer' || 
                   tagName === 'ytd-rich-item-renderer' ||
                   tagName === 'ytd-compact-video-renderer';
        };

        // If a child is a container like ytd-item-section-renderer, we might need to look inside
        // But for sorting, we need to operate on elements that are siblings in the same container.
        let actualVideoElements = children.filter(isVideoElement);
        
        // If we found very few videos, maybe they are inside a sub-container
        if (actualVideoElements.length <= 1) {
            for (const child of children) {
                const innerVideos = Array.from(child.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer'));
                if (innerVideos.length > actualVideoElements.length) {
                    // If we found a child that contains many videos, that child's parent (the current container)
                    // might be too high. But we need to be careful about where we append.
                    // If all videos are inside one child's #contents, let's switch to that.
                    const innerContainer = child.querySelector('#contents, #items');
                    if (innerContainer && innerContainer.children.length > 1) {
                        console.log('Switching to inner container:', innerContainer.tagName, 'inside', child.tagName);
                        return sortVideosWithContainer(innerContainer);
                    }
                }
            }
        }

        const videoElements = actualVideoElements;
        
        if (videoElements.length === 0) {
            console.log('No video elements found to sort. Children count:', children.length);
            if (children.length > 0) {
                console.log('First 3 children tag names:', children.slice(0, 3).map(c => c.tagName));
            }
            return;
        }

        console.log(`Sorting ${videoElements.length} videos in container`, container);

        const getDateText = (el) => {
            // metadata-line is common for ytd-video-renderer
            // inline-metadata-item is often used in rich-item or other layouts
            const metadataSelectors = ['#metadata-line span', '#video-info span', '.inline-metadata-item'];
            
            for (const selector of metadataSelectors) {
                const spans = Array.from(el.querySelectorAll(selector));
                for (let i = spans.length - 1; i >= 0; i--) {
                    const text = spans[i].innerText.toLowerCase();
                    if (text.includes('ago') || text.includes('hour') || text.includes('day') || 
                        text.includes('week') || text.includes('month') || text.includes('year') ||
                        text.includes('minute') || text.includes('second') || text.includes('yesterday')) {
                        return spans[i].innerText;
                    }
                }
            }
            return '';
        };

        // Cache dates to avoid repeated DOM lookups during sort
        const videoData = videoElements.map(el => {
            const text = getDateText(el);
            const time = parseYouTubeDate(text);
            return { el, text, time };
        });

        videoData.sort((a, b) => b.time - a.time);

        // Re-append items in order
        let videoIdx = 0;
        children.forEach(child => {
            if (isVideoElement(child)) {
                container.appendChild(videoData[videoIdx].el);
                videoIdx++;
            } else {
                // For non-video elements, re-append them to maintain relative order with videos
                container.appendChild(child);
            }
        });

        console.log('Sorting completed. Order:');
        videoData.slice(0, 5).forEach((v, i) => console.log(`${i+1}: ${v.text} (${v.time})`));
    }

    // Add sort button to YouTube interface
    function addSortButton() {
        if (document.getElementById('yt-sort-date-btn')) return;

        const filterMenu = document.querySelector('#container.ytd-search-sub-menu-renderer');
        if (!filterMenu) return;

        const btn = document.createElement('button');
        btn.id = 'yt-sort-date-btn';
        btn.innerText = 'Sort by Date';
        btn.style.cssText = 'background: #606060; color: #fff; border: none; padding: 10px 16px; margin: 10px; cursor: pointer; border-radius: 18px; font-weight: 500; font-size: 14px; font-family: "Roboto", "Arial", sans-serif;';
        
        btn.onclick = sortVideos;
        
        filterMenu.appendChild(btn);
    }

    // Watch for page changes as YouTube is an SPA
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            // Clear flag on URL change
            window._ytSorted = false;
        }
        addSortButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();