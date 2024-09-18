var renderNavigationSelectOptionsInternal = function (items, depth, html, treeItemHtml) {
    var i, j;
    for(i = 0; i < items.Count; i++) {
        html.push('<option value="id=');
        html.push(core_v2_encoding.HtmlAttributeEncode(core_v2_encoding.UrlEncode(items[i].Id.ToString())));
        html.push('&amp;navigationPluginId=');
        html.push(core_v2_encoding.HtmlAttributeEncode(core_v2_encoding.UrlEncode(items[i].NavigationPluginId)));
        html.push('&amp;configuration=');
        html.push(core_v2_encoding.HtmlAttributeEncode(core_v2_encoding.UrlEncode(items[i].Configuration)));
        html.push('&amp;avatarUrl=');
        html.push(core_v2_encoding.HtmlAttributeEncode(core_v2_encoding.UrlEncode(items[i].AvatarUrl || '')));
        html.push('&amp;description=');
        html.push(core_v2_encoding.HtmlAttributeEncode(core_v2_encoding.UrlEncode(items[i].Description || '')));
        html.push('&amp;label=');
        html.push(core_v2_encoding.HtmlAttributeEncode(core_v2_encoding.UrlEncode(items[i].Label || '')));
        html.push('">');
        for (j = 0; j < depth; j++) {
            html.push('--');
        }
        html.push(' ');
        html.push(items[i].Label);
        treeItemHtml.push(formatPreviewHtml(items[i]));
        html.push('</option>');
        if (items[i].Children != null && items[i].Children.Count > 0) {
            renderNavigationSelectOptionsInternal(items[i].Children, depth + 1, html, treeItemHtml);
        }
    }
}, formatPreviewHtml = function(item) {
    var previewHtml = [];
    if (context.EnableAvatars) {
        var avatarUrl = item.AvatarUrl;
        if (avatarUrl == null || avatarUrl.length == 0) {
            avatarUrl = item.DefaultAvatarUrl;
        }
        
        previewHtml.push('<div style="padding: 4px 2px 4px 42px; min-height: 40px; position: relative; display: inline-block;">')
        if (avatarUrl) {
            var imagePreview = core_v2_ui.GetResizedImageHtml(avatarUrl, 32, 32, { OutputIsPersisted: false, ResizeMethod: 'ZoomAndCrop' });
            if (imagePreview) {
                previewHtml.push('<span style="position: absolute; width: 32px; height: 32px; left: 2px; top: 4px;">');
                previewHtml.push(imagePreview);
                previewHtml.push('</span>');
            }
        }
    } else {
        previewHtml.push('<div style="display: inline-block; padding: 2px;">');
    }
    
    var label = item.Label;
    if (label == null || label.length == 0) {
        label = item.DefaultLabel;
        if (label == null || label.length == 0) {
            label = item.Id.ToString();
        }
    }

    if (context.EnableDescriptions) {
        var description = item.Description;
        if (description == null || description.length == 0) {
            description = item.DefaultDescription;
        }
        
        previewHtml.push('<strong>');
        previewHtml.push(label || item.Id.ToString());
        previewHtml.push('</strong><br />');
        previewHtml.push(description || '');
    } else {
        previewHtml.push(label || item.Id.ToString());
    }
    
    previewHtml.push('</div>');
    
    return previewHtml.join('');
}, renderReadOnlyItems = function(items, html) {
    html.push('<ul>\n');
    for(var i = 0; i < items.Count; i++) {
        html.push('<li>');
        html.push(items[i].Label);
        if (items[i].Children != null && items[i].Children.Count > 0) {
            showNavigation(items[i].Children);
        }
        html.push('</li>');
    }
    html.push('</ul>');
}

return {
    getEditableRendering: function () {
        var html = [];
        var treeItemHtml = [];
        renderNavigationSelectOptionsInternal(context.ParseNavigationItems(context.Value), 0, html, treeItemHtml);
        
        return {
            html: html.join(''), 
            treeItemHtml: treeItemHtml
        };
    },
    formatPreviewHtml: function(item) {
      return formatPreviewHtml(item);  
    },
    getReadOnlyRendering: function() {
        html = [];
        renderReadOnlyItems(context.ParseNavigationItems(context.Value), html);
        return html.join('');
    }
};