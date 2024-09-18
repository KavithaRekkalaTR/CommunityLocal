if (context_v2_propertyRule.Action == 'Execute') {
    var urlPattern = /^(?:<iframe[^>]*?src=\"(https:\/\/calendar\.google\.com\/calendar\/embed[^"]*)\"[^>]*><\/iframe>)$/;
    var content = context_v2_propertyRule.GetHtmlValue('embedCode');
    var url = content.match(urlPattern);

    var result = '';

    if (url) {
        result = '<iframe src="' + url[1] + '" width="800" height="600" style="border: 0;" frameborder="0" scrolling="no"></iframe>';
    }

    context_v2_propertyRule.SetHtmlValue('sanitizedEmbedCode', result);
}
else {
    return '';    
}