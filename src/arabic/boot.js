define([], function() {

    return {
    	boot: function(el) {

    		var contentHeadline = document.querySelector('.content__main-column');
            if (contentHeadline) {
			 contentHeadline.style.direction = 'rtl';
             contentHeadline.lang = 'ar';
            }

			var contentStandfirst = document.querySelector('.content__standfirst');
            if (contentStandfirst) {
			 contentStandfirst.style.direction = 'rtl';
             contentStandfirst.lang = 'ar';
            }

			var contentBody = document.querySelector('.content__article-body');
            if (contentBody) {
			 contentBody.style.direction = 'rtl';
             contentBody.lang = 'ar';
            }

			var contentPicshares = document.querySelector('.block-share--article');
            if (contentPicshares) {
			 contentPicshares.style.left = '0px';
            }
			
    	}
    }
});