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


    var DEFAULT_CSS = 'http://interactive.guim.co.uk/page-enhancers/nav/boot.css';
    var DEFAULT_INTRO_HEADING_TEXT = 'Introduction';

    var articleBodyEl;
    var mainBodyEl;
    var figureEl;
    var introHeaderEl;
    var linksEl;
    var liEls;
    var headingsEls;
    var wrapperEl;
    var navEl;
    var h2s;

    var altHeadings = [];
    var isNumbered = true;

    var throttledScroll = throttle(onScroll, 300);
    var throttledResize = throttle(onResize, 300);
    var previousValue = false;

    // TODO: Better detection of iOS and Android web view
    var mode = (!!document.querySelector('.content__main-column')) ? 'web' : 'app';

    var config = {
        selectors: {
            web: {
                articleBody: '.content__main-column.content__main-column--article',
                mainBody: '.content__main-column.content__main-column--article',
                h2s: '.content__article-body h2'
            },
            app: {
                articleBody: '.article__body',
                mainBody: '.article',
                h2s: '.article__body h2'
            }
        }
    };



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

        var headingLinks = figureEl.querySelectorAll('a,.intro_heading');
        for(var i = 0; i < headingLinks.length; i++) {
            headingLinks[i].className = headingLinks[i].className.replace(/\W*active-link/,'');
        }

        // FIXME: Cache nav DOM links.
        headingLinks = figureEl.querySelectorAll('a');
        var currentChapter = headingLinks[getNearestTopIndex()];
        if (currentChapter) {
            currentChapter.className += ' active-link';
        } else {
            introHeaderEl.className += ' active-link';
        }
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

    function jumpToHeading(event) {
        event.preventDefault();
        var eventElement = event.currentTarget;
        var targetEl = document.querySelector(eventElement.getAttribute('href'));
        var pos = targetEl.getBoundingClientRect().top + window.pageYOffset;
        pos -= window.innerHeight / 8;
        window.scrollTo(0, pos);
    }


    function setupDOM() {
        mainBodyEl = document.querySelector(config.selectors[mode].mainBody);
        articleBodyEl = document.querySelector(config.selectors[mode].articleBody);
        h2s = document.querySelectorAll(config.selectors[mode].h2s);

        navEl = document.createElement('div');
        navEl.setAttribute('id','article-navigation');
        navEl.className += ' article_nav';


        introHeaderEl = document.createElement('div');
        introHeaderEl.className += ' intro_heading';
        introHeaderEl.innerHTML = DEFAULT_INTRO_HEADING_TEXT;
        navEl.appendChild(introHeaderEl);

        var navigationTitle = document.createElement('h2');
        var altText = figureEl.getAttribute('data-alt');
        var altData;

        try {
            altData = JSON.parse(altText);
        } catch(err) {
            console.log('ERROR: parsing data-alt', err);
        }

        if (altData && altData.hasOwnProperty('headings')) {
            altHeadings = altData.headings;
        }

        if (altData && altData.hasOwnProperty('isNumbered')) {
            isNumbered = altData.isNumbered;
        }


        if (altData && altData.hasOwnProperty('title')) {
            navigationTitle.innerHTML = altData.title;
        } else {
            navigationTitle.innerHTML = 'Contents';
        }
        navEl.appendChild(navigationTitle);


        var chapterNames = Array.prototype.map.call(h2s, function(el, index) {
            return (altHeadings[index]) ? altHeadings[index] : el.textContent;
        });

        var navList = document.createElement('ol');
        if (isNumbered === false) {
            navList.setAttribute('class', 'no-numbers');
        }

        // Add nav IDs to the <h2> headings
        for (var i = 0; i < h2s.length; i++) {
            var navListItem = document.createElement('li');
            h2s[i].setAttribute('id', 'nav' + i);
            h2s[i].setAttribute('name', 'nav' + i);

            var navLink = document.createElement('a');
            navLink.href = '#' + h2s[i].getAttribute('id');
            navLink.innerHTML = chapterNames[i];

            var dataTitle = chapterNames[i];
            if (isNumbered) {
                isNumbered = (i + 1) + '. ' + isNumbered;
            }
            navLink.setAttribute('data-title', dataTitle);
            navLink.addEventListener('click', jumpToHeading, false);

            navListItem.appendChild(navLink);
            navList.appendChild(navListItem);
        }

        navEl.appendChild(navList);
        navEl.addEventListener('click', handleNavClick, false);

        // Add wrapper around <ol> so when it becomes fixed it doesn't alter
        // the page height causing jump
        wrapperEl = document.createElement('figure');
        wrapperEl.className += 'nav_wrapper element';
        wrapperEl.appendChild(navEl);
        figureEl.innerHTML = '';
        figureEl.appendChild(wrapperEl);

        // Add menu button
        var menuEl = document.createElement('div');
        menuEl.className +=  ' menu';
        navEl.appendChild(menuEl);




        if (altData && altData.hasOwnProperty('css')) {
            addCSS(altData.css);
        } else {
            addCSS(DEFAULT_CSS);
        }
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

    function boot(el) {
        figureEl = el;
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

