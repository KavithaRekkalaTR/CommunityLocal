return {
    validate: function(url) {
        var pattern = /^(https:\/\/)?(www\.)?twitter\.com\/([\/\w.-\?%])*/;
        var result = pattern.test(url);
        return result;
    },
    retrieve: function (url) {
        var result = core_v2_http.Get('https://publish.twitter.com/oembed', {
            Query: {
                url: url
            },
            isCacheable: true, 
            VaryCacheByUser: false
        });


        if (result.StatusCode == 200 && result.Data) {
            return result.Data.html;
        }

        return null;
    }
};