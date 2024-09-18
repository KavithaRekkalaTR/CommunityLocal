return {
    validate: function(content) {
        var pattern = /^(<blockquote class=\"instagram-media\"[^>]*>.*?<\/blockquote>[^<]*<script async src=\")((?:https:)?\/\/(?:platform|www)\.instagram\.com\/(?:[a-z]{2}_[a-z]{2}\/embeds\.js|embed\.js))(\"><\/script>)$/;
        var result = pattern.test(content);
        return result;
    }, 
    sanitize: function(content) {
        var htmlPattern = /^<blockquote class=\"instagram-media\"[^>]*data-instgrm-permalink=\"(https:\/\/www.instagram.com\/(?:reel|tv|p)\/[^\/]*\/[^\"]*)\"[^>]*>(.*?)<\/blockquote>[^<]*(<script async src=\"(?:https:)?\/\/(?:platform|www)\.instagram\.com\/(?:[a-z]{2}_[a-z]{2}\/embeds\.js|embed\.js)\"><\/script>)$/;
        var html = content.match(htmlPattern);
        
        var result = '';
    
        if (html) {
            result = '<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' + html[1] + '" data-instgrm-version="13" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">';
            result = result + core_v2_encoding.SanitizeHtml(html[2]) + '</blockquote>' + html[3];
        }

        return result;
    }
};