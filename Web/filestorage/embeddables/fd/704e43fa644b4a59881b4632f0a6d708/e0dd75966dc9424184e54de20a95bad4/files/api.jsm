return {
    validate: function(content) {
        var pattern = /^(?:<iframe[^>]*?src=\"(https:\/\/docs\.google\.com\/?[^"]*)\"[^>]*><\/iframe>)$/;
        var result = pattern.test(content);
        return result;
    },
    sanitize: function(content) {
        var urlPattern = /^(?:<iframe[^>]*?src=\"(https:\/\/docs\.google\.com\/?[^"]*)\"[^>]*><\/iframe>)$/;
        var url = content.match(urlPattern);

        if (url) {
            return '<iframe src="' + url[1] + '" width="1000" height="750" style="border: 1px solid #eee;"></iframe>';
        }
        else
            return "";            
    }
};