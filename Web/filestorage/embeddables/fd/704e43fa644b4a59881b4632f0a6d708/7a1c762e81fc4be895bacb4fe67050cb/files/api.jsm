return {
    validate: function(content) {
        var pattern = /^(?:<iframe[^>]*?src=\"(https:\/\/calendar\.google\.com\/calendar\/embed[^"]*)\"[^>]*><\/iframe>)$/;
        var result = pattern.test(content);
        return result;
    },
    sanitize: function(content) {
        var urlPattern = /^(?:<iframe[^>]*?src=\"(https:\/\/calendar\.google\.com\/calendar\/embed[^"]*)\"[^>]*><\/iframe>)$/;
        var url = content.match(urlPattern);

        if (url) {
            return '<iframe src="' + url[1] + '" width="800" height="600" style="border: 0;" frameborder="0" scrolling="no"></iframe>';
        }
        else
            return "";            
    }
};