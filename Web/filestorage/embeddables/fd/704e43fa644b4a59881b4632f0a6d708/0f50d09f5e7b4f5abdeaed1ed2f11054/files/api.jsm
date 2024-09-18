return {
    validate: function(content) {
        var pattern = /^(<iframe[^>]*?src=\"https:\/\/www\.google\.com\/maps\/embed?[^"]*\"[^>]*><\/iframe>)$/;
        var result = pattern.test(content);
        return result;
    },
    sanitize: function(content) {
        var urlPattern = /^(?:<iframe[^>]*?src=\"(https:\/\/www\.google\.com\/maps\/embed?[^"]*)\"[^>]*><\/iframe>)$/;
        var url = content.match(urlPattern);

        if (url) {
            var heightPattern = /^(?:<iframe[^>]*?height=\"([0-9]*)\"[^>]*><\/iframe>)$/;
            var widthPattern = /^(?:<iframe[^>]*?width=\"([0-9]*)\"[^>]*><\/iframe>)$/;

            var height = 500;
            var parsedHeight = content.match(heightPattern);
            var width = 500;
            var parsedWidth = content.match(widthPattern);
        
            if (parsedWidth && parsedWidth.length > 1)
                width = parsedWidth[1];
            if (parsedHeight && parsedHeight.length > 1)
                height = parsedHeight[1];
            
            return '<iframe src="' + url[1] + '" width="' + width + '" height="' + height + '" style="border:0;" allowfullscreen="" loading="lazy"></iframe>';
        }
        else
            return "";
    }
};