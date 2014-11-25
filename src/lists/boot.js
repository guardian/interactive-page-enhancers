    define([], function() {
    'use strict';

    // Underscore's throttle.
    var throttle = function(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        options = options || {};
        var later = function() {
            previous = new Date();
            timeout = null;
            result = func.apply(context, args);
        };

        return function() {
            var now = new Date();
            if (!previous && options.leading === false) { previous = now; }
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;

            if (remaining <= 0) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
      };
    
    var articleBodyEl;
    var mainBodyEl;
    var figureEl;
    var throttledScroll = throttle(onScroll, 300);
    var throttledResize = throttle(onResize, 300);
    var linksEl;
    var liEls = [];
    var headingsEls;
    var wrapperEl;
    var navEl;
    var preNumEl;
    var nextNumEl;
    var h2s;
    var altData;
    var headings;
    var previousValue = false;
    var colours = {};
    var currentChapterIndex = 0;
    var cssText = '';
    var isNumberedList;

    // Match: 1. Heading | sub heading
    var LIST_HEADING_REGEX = /^\W*(\d+)\W*\.\W*(.+)\W*\|\W*(.+)\W*$/;
    var NUMBER_START_REGEX = /^\W?\d+?\./;

    function resizeWrapper() {
        if (navEl.className.indexOf('active') === -1) {
            return;
        }
        var contentMargin = parseInt(getComputedStyle(articleBodyEl).marginLeft, 10);
        var contentWidth = parseInt(articleBodyEl.getBoundingClientRect().width, 10);
        var contentOffset = articleBodyEl.getBoundingClientRect().left;
        navEl.style.width = contentMargin + contentWidth + 'px';
        navEl.style.left = contentOffset - contentMargin + 'px';
    }

    function onResize() {
        resizeWrapper();
    }

    function onScroll() {
        if (isStaticNavOutOfView()) {
            if (navEl.className.indexOf('active') === -1) {
                // Set timeout to wait for the correct height of the wrapper
                setTimeout(function(){
                    var navWrapper = document.querySelector('.nav_wrapper');
                    navWrapper.style.height = navWrapper.getBoundingClientRect().height + 'px';
                    navEl.className += ' active';
                    resizeWrapper();
                }, 100);
            }
        } else {
            navEl.className = navEl.className.replace(' active','');
            navEl.className = navEl.className.replace('openNav','');
            navEl.style.width = 'auto';
        }


        var newChapterIndex = getNearestTopIndex();

        if (newChapterIndex !== null && currentChapterIndex !== newChapterIndex) {
            currentChapterIndex = newChapterIndex;

            // Remove active class from previous item
            var activeLink = document.querySelector('.active-link');
            if (activeLink) {
                activeLink.className = activeLink.className.replace(/\W+active-link/,'');
            }

            var chapterLinkEl = liEls[currentChapterIndex]; 
            if (chapterLinkEl) {
                chapterLinkEl.className += ' active-link';
            }
            //updateNav();
        }
    }

    function updateNav() {
        var preNum = (currentChapterIndex - 1 < 1) ? 1 : currentChapterIndex - 1; 
        var nexNum = (currentChapterIndex - 1 < 1) ? 3 : currentChapterIndex + 1; 

        preNumEl.innerHTML = preNum;
        nextNumEl.innerHTML = nexNum;
    }

    function isStaticNavOutOfView() {
        return (wrapperEl.getBoundingClientRect().bottom < 0 && 
                mainBodyEl.getBoundingClientRect().bottom - window.innerHeight / 2 > 0);
    }
    
    function addCSS(url) {
        var cssEl = document.createElement('link');
        cssEl.setAttribute('type', 'text/css');
        cssEl.setAttribute('rel', 'stylesheet');
        cssEl.setAttribute('href', url);
        var head = document.querySelector('head');
        head.appendChild(cssEl);
    }

    function jumpToHeading(el) {
        var pos = el.getBoundingClientRect().top + window.pageYOffset;
        pos -= window.innerHeight / 8;
        window.scrollTo(0, pos);
    }

    // Returns the requested element's text by looking at data-alt and the
    // window.guardian page object
    function getPageElementText(elmName) {
        var text = elmName;

        if (altData && altData.hasOwnProperty(elmName)) {
            text = altData[elmName];
        } else if (guardian && guardian.config.page.hasOwnProperty(elmName)) {
            text = guardian.config.page[elmName];    
        }

        return text;
    }


    function createElement(elmName, attributes) {
        var elm = document.createElement(elmName);
        if (attributes) {
            Object.keys(attributes)
                .forEach(function(key) {
                    elm.setAttribute(key, attributes[key]);
                });
        }

        return elm;
    }

    function getCSSValue(elm, property) {
        var styles = window.getComputedStyle(elm, null);
        return styles.getPropertyValue(property);
    }

    function getAltData() {
        var altText = figureEl.getAttribute('data-alt');
        try {
            altData = JSON.parse(altText);
        } catch(err) {
            return console.log('ERROR: parsing data-alt', err);
        }
        
        return altData;
    }

    function navToNextItem(e) {
        e.stopPropagation();
        if (currentChapterIndex < headings.length - 1) {
            jumpToHeading(headings[currentChapterIndex + 1].el);
            closeNav();
        }
    }

    function navToPreviousItem(e) {
        e.stopPropagation();
        if (currentChapterIndex > 0) {
            jumpToHeading(headings[currentChapterIndex - 1].el);
            closeNav();
        }
    }

    function navToHeading(e) {
        var el = e.currentTarget;
        var id = el.getAttribute('data-id');
        jumpToHeading(headings[id].el);
    }


    function createPrevNextNav() {
        var wrapperEl = createElement('div', { class: 'superlist-prenext-wrapper' });

        var preEl = createElement('div', { class: 'superlist-prenext-btn superlist-prenext-pre' });
        preEl.innerHTML = '<i class="i i-arrow-white-right i-arrow-white-left"></i>';
        preNumEl = createElement('span', { class: 'superlist-prenext-num pre-num' });
        preNumEl.innerHTML = 'Prev';
        preEl.appendChild(preNumEl);
        preEl.addEventListener('click', navToPreviousItem, false);
        wrapperEl.appendChild(preEl);
        
        var nextEl = createElement('div', { class: 'superlist-prenext-btn superlist-prenext-next' });
        nextEl.innerHTML = '<i class="i i-arrow-white-right"></i>';
        nextNumEl = createElement('span', { class: 'superlist-prenext-num next-num' });
        nextNumEl.innerHTML = 'Next';
        nextEl.appendChild(nextNumEl);

        nextEl.addEventListener('click', navToNextItem, false);
        wrapperEl.appendChild(nextEl);
        
        return wrapperEl;
    }

    function createListItemEl(heading, i) {
        var navListItem = createElement('li', { class: 'superlist-item' });
        navListItem.addEventListener('click', navToHeading, false);
        navListItem.setAttribute('data-id', i);
        
        heading.el.setAttribute('id', 'nav' + i);
        heading.el.setAttribute('name', 'nav' + i);

        var navLink = createElement('a', { class: 'superlist-item-link' });
        navLink.href = '#' + heading.el.getAttribute('id');

        var linkTitleEl = createElement('span', { class: 'superlist-link-title' });
        linkTitleEl.innerHTML = heading.title;
        
        var linkSubTitleEl = createElement('span', { class: 'superlist-link-subtitle' });
        linkSubTitleEl.innerHTML = heading.subTitle;

        navLink.appendChild(linkTitleEl);
        navLink.appendChild(linkSubTitleEl);

        navLink.setAttribute('data-title', (i + 1) + '. ' + heading.title);
        navLink.setAttribute('data-num', heading.num);
        //navLink.addEventListener('click', jumpToHeading, false);
        navListItem.appendChild(navLink);

        return navListItem;
    }

    function getColours() {
        var headerEl = document.querySelector('.tonal__header');
        colours.header = getCSSValue(headerEl, 'background-color') || '#CCC';

        var standEl = document.querySelector('.tonal__standfirst');
        colours.stand = getCSSValue(standEl, 'background-color') || '#EEE';

        var sectionEl = document.querySelector('.content__section-label__link');
        colours.section =  getCSSValue(sectionEl, 'color') || '#666';

        return colours;
    }

    function testElmTestStartsWithNumber(el) {
        var text = (el.innerText || el.textContent);
        return NUMBER_START_REGEX.test(text);
    }

    function setupDOM() {
        mainBodyEl = document.querySelector('.content__main-column.content__main-column--article');
        articleBodyEl = document.querySelector('.content__article-body');
        h2s = document.querySelectorAll('.content__article-body h2');
        navEl = createElement('div', { class: 'article_nav noselect', id: 'article-navigation' });
        updateCSSText('.article_nav.active', 'background', colours.header);
        updateCSSText('.article_nav.active', 'border-color', colours.stand);

        // First h2 is used to determine if list is numbered or not
        isNumberedList = testElmTestStartsWithNumber(h2s[0]);

        var sectionText = getPageElementText('sectionName');
        var navSectionEl = createElement('span', { class: 'superlist-nav-section'});
        updateCSSText('.superlist-nav-section', 'color', colours.section);
        navSectionEl.innerHTML = sectionText; 
        navEl.appendChild(navSectionEl);
        
        var headlineText = getPageElementText('headline');
        var navHeadlineEl = createElement('h2', { class: 'superlist-nav-headline'});
        
        navHeadlineEl.appendChild(navSectionEl);
        navHeadlineEl.appendChild(document.createTextNode( headlineText )); 
        navEl.appendChild(navHeadlineEl);
        navEl.appendChild(createPrevNextNav()); 

        headings = Array.prototype.map.call(h2s, getHeadingParts); 

        var navList = createElement('ol', { class: 'superlist-list' });
        Array.prototype.map.call(headings, function(heading, i) {
            if (!heading) {
                return;
            }

            modifyHeading(heading);
            var liEl = createListItemEl(heading, i);
            navList.appendChild(liEl);
            liEls.push(liEl);
        });

        // Only show top mini-list if the list is numbered
        if (!isNumberedList) {
            navList.setAttribute('class', navList.getAttribute('class') + ' hidden-nav');
        }

        updateCSSText('.active.article_nav li:hover', 'background-color', colours.stand);

        navEl.appendChild(navList);
        navEl.addEventListener('click', handleNavClick, false);

        // Add wrapper around <ol> so when it becomes fixed it doesn't alter
        // the page height causing jump
        wrapperEl = document.createElement('figure');
        wrapperEl.className += 'nav_wrapper element';
        wrapperEl.appendChild(navEl);
        figureEl.innerHTML = '';
        articleBodyEl.insertBefore(wrapperEl, articleBodyEl.firstElementChild);
        
        // Add menu button
        var menuEl = createElement('div', { class: 'menu' });
        var hamEl = createElement('div', { class: 'menu-ham' });
        updateCSSText('.menu-ham', 'border-color', colours.header);
        menuEl.appendChild(hamEl);
        updateCSSText('.article_nav.active .menu', 'background-color', colours.section);
        navEl.appendChild(menuEl);
    
        if (altData && altData.hasOwnProperty('css')) {
            addCSS(altData.css);
        }
        
        // Set active link colours
        updateCSSText('.active.article_nav .superlist-item.active-link', 'background-color', colours.section);
        updateCSSText('.active.article_nav .superlist-item.active-link', 'color', colours.header);

        // Add CSS style elm
        var styleEl = addCSSElement();
        document.querySelector('head').appendChild(styleEl);
    }

    function handleNavClick() {
        if (navEl.className.indexOf('active') === -1) {
            return false;
        }
        
        if (navEl.className.indexOf('openNav') === -1) {
            navEl.className += ' openNav';
        } else {
            navEl.className = navEl.className.replace('openNav', '');
        }
    }

    function closeNav() {
        navEl.className = navEl.className.replace('openNav', '');
    }

    function getHeadingParts(el) {
        var num;
        var title;
        var subTitle;
        var text = (el.innerText || el.textContent);

        if (!text) {
            console.log('GUI: Heading did not match pattern', el);
            return false;
        } else if (isNumberedList) {
            num = text.match(/^(\d+)(?=.)/i);
            title = text.match(/^\d+.\W*(.+)(?=\W*\|)/i);
            subTitle = text.match(/\|\W*(.+)\W*$/i);
        } else {
            title = text.match(/^([^\|]+)/i);
            subTitle = text.match(/(?:\|)(.+)$/i);
        }

        return {
            num: (num) ? num[1].trim() : null, 
            title: (title) ? title[1].trim() : null,
            subTitle: (subTitle) ? subTitle[1].trim() : null, 
            el: el
        };
    }

    function modifyHeading(heading) {
        heading.el.setAttribute('class', heading.el.getAttribute('class') + ' superlist-heading-item');
        heading.el.innerHTML = '';

        if (isNumberedList) {
            var numEl = document.createElement('span');
            numEl.setAttribute('class', 'superlist-number');
            numEl.innerHTML = heading.num;
            heading.el.appendChild(numEl);
        }

        if (heading.title) {
            var titleEl = document.createElement('span');
            titleEl.setAttribute('class', 'superlist-title');
            titleEl.innerHTML = heading.title;
            heading.el.appendChild(titleEl);
        }

        if (heading.subTitle) {
            var subTitleEl = document.createElement('span');
            subTitleEl.setAttribute('class', 'superlist-subtitle');
            subTitleEl.innerHTML = heading.subTitle;
            heading.el.appendChild(subTitleEl);
        }
    }

    // TODO: Better way to determine top
    function getNearestTopIndex() {
        var nearestIndex = null;
        var tmpHeight = -100000;

        for (var i = 0; i < h2s.length; i++) {
            var top = h2s[i].getBoundingClientRect().top;
            top -= (window.innerHeight / 8) + 5;

            if (top < 0 && top > tmpHeight) {
                tmpHeight = top;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }

    function updateCSSText(selector, attribute, value) {
        cssText += selector + '{' + attribute + ':' + value + ';}';
    }

    function addCSSElement() {
        var styleEl = createElement('style');
        styleEl.type = 'text/css';
        if (styleEl.styleSheet){
          styleEl.styleSheet.cssText = cssText;
        } else {
          styleEl.appendChild(document.createTextNode(cssText));
        }
        return styleEl;
    }

    function boot(el) {
        figureEl = el;
        getColours();
        getAltData(); 
        setupDOM();
        throttledScroll();
        throttledResize();
        window.addEventListener('scroll', throttledScroll);
        window.addEventListener('resize', throttledResize);
    }
    
    return {
        boot: boot
    };
});

