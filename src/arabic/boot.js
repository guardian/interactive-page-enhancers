define([], function() {

    return {
    	boot: function(el) {

    		var contentHeadline = document.querySelector('.content__main-column');
			contentHeadline.style.direction = "rtl";

			var contentStandfirst = document.querySelector('.content__standfirst');
			contentStandfirst.style.direction = "rtl";

			var contentBody = document.querySelector('.content__article-body');
			contentBody.style.direction = "rtl";

			var contentBody = document.querySelector('.content__article-body');
			contentBody.lang = "ar";

			var contentHeadline = document.querySelector('.content__main-column');
			contentHeadline.lang = "ar";

			var contentStandfirst = document.querySelector('.content__standfirst');
			contentStandfirst.lang = "ar";

			var contentPicshares = document.querySelector('.block-share--article');
			contentPicshares.style.left = "0px";
			
    	}
    }
});