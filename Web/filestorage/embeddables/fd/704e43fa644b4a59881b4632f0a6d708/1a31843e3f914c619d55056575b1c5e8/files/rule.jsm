if (context_v2_propertyRule.Action == 'Execute') {
    var url = context_v2_propertyRule.GetUrlValue('url');

    var result = core_v2_http.Get('https://publish.twitter.com/oembed', {
        Query: {
            url: url
        },
        isCacheable: true, 
        VaryCacheByUser: false
    });


    if (result.StatusCode == 200 && result.Data) {
        context_v2_propertyRule.SetHtmlValue('sanitizedEmbedCode', result.Data.html);
    }
    else {
        context_v2_propertyRule.SetHtmlValue('sanitizedEmbedCode', '');
    }
}
else {
    return '';    
}