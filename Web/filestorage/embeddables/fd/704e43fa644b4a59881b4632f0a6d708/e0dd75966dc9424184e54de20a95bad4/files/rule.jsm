if (context_v2_propertyRule.Action == 'Execute') {
    var urlPattern = /^(?:<iframe[^>]*?src=\"(https:\/\/docs\.google\.com\/?[^"]*)\"[^>]*><\/iframe>)$/;
    var content = context_v2_propertyRule.GetHtmlValue('embedCode');
    var url = content.match(urlPattern);

    var result = '';

    if (url) {
        result = '<iframe src="' + url[1] + '" width="1000" height="750" style="border: 1px solid #eee;"></iframe>';
    }

    context_v2_propertyRule.SetHtmlValue('sanitizedEmbedCode', result);
}
else {
    return '';    
}