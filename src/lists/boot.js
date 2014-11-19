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
    var liEls;
    var headingsEls;
    var wrapperEl;
    var navEl;
    var h2s;
    var previousValue = false;

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

        var headingLinks = figureEl.querySelectorAll('a');
        for(var i = 0; i < headingLinks.length; i++) {
            headingLinks[i].className = headingLinks[i].className.replace('active-link','');
        }

        var currentChapter = headingLinks[getNearestTopIndex()];
        if (currentChapter) {
            currentChapter.className += 'active-link';
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
        mainBodyEl = document.querySelector('.content__main-column.content__main-column--article');
        articleBodyEl = document.querySelector('.content__article-body');
        h2s = document.querySelectorAll('.content__article-body h2');

        navEl = document.createElement('div');
        navEl.setAttribute('id','article-navigation');
        navEl.className += ' article_nav';

        var navigationTitle = document.createElement('h2');
        var altText = figureEl.getAttribute('data-alt');
        var altData;

        try {
            altData = JSON.parse(altText);
        } catch(err) {
            console.log('ERROR: parsing data-alt', err);
        }

        if (altData && altData.hasOwnProperty('title')) {
            navigationTitle.innerHTML = altData.title; 
        } else {
            navigationTitle.innerHTML = 'Navigation'; 
        }
        navEl.appendChild(navigationTitle);
        

        var chapterNames = Array.prototype.map.call(h2s, function(el) {
            return el.innerHTML;
        }); 
        
        var navList = document.createElement('ol');
        
        Array.prototype.map.call(h2s, function(el, i) {
            var headingParts = getHeadingParts(el);
            modifyHeading(el, headingParts);

            var navListItem = document.createElement('li');
            el.setAttribute('id', 'nav' + i);
            el.setAttribute('name', 'nav' + i);

            var navLink = document.createElement('a');
            navLink.href = '#' + el.getAttribute('id');
            navLink.innerHTML = chapterNames[i];
            navLink.setAttribute('data-title', (i + 1) + '. ' + chapterNames[i]);
            navLink.addEventListener('click', jumpToHeading, false);

            navListItem.appendChild(navLink);
            navList.appendChild(navListItem);
        });

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
        var menuEl = document.createElement('div');
        menuEl.className +=  ' menu';
        navEl.appendChild(menuEl);
    
        if (altData && altData.hasOwnProperty('css')) {
            addCSS(altData.css);
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

    function getHeadingParts(el) {
        var text = (el.innerText || el.textContent);
        text = text.trim();

        var num = text.match(/^(\d+)(?=.)/i)[1];        
        var title = text.match(/^\d+.\W*(.+)(?=\W*\|)/i)[1];        
        var subTitle = text.match(/\|\W*(.+)\W*$/i)[1];

        return {
            num: num,
            title: title,
            subTitle: subTitle
        };
    }

    function modifyHeading(el, textParts) {
        el.classList.add('superlist-item');
        el.innerHTML = '';
        
        var numEl = document.createElement('span');
        numEl.setAttribute('class', 'superlist-number');
        numEl.innerHTML = textParts.num;
        el.appendChild(numEl);

        var titleEl = document.createElement('span');
        titleEl.setAttribute('class', 'superlist-title');
        titleEl.innerHTML = textParts.title;
        el.appendChild(titleEl);

        var subTitleEl = document.createElement('span');
        subTitleEl.setAttribute('class', 'superlist-subtitle');
        subTitleEl.innerHTML = textParts.subTitle;
        el.appendChild(subTitleEl);
       
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

