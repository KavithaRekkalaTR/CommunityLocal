(function($, global) {

    function registerContent(context) {
        context.api.registerContent({
            name: context.text.contentFiltering,
            orderNumber: 300,
            selected: function() {
                context.wrapper.css({
                    visibility: 'visible',
                    height: 'auto',
                    width: 'auto',
                    left: '0',
                    position: 'static',
                    overflow: 'visible',
                    top: '0'
                });
            },
            unselected: function() {
                context.wrapper.css({
                    visibility: 'hidden',
                    height: '100px',
                    width: '800px',
                    left: '-1000px',
                    position: 'absolute',
                    overflow: 'hidden',
                    top: '-1000px'
                });
            }
        });
    }

    function loadFields(context) {
        context.fields = {
            AllowedFileExtensions: $(context.fieldIds.AllowedFileExtensions),
            AllowedHosts: $(context.fieldIds.AllowedHosts),
            AllowedProtocols: $(context.fieldIds.AllowedProtocols),
            AllowIpHosts: $(context.fieldIds.AllowIpHosts),
            AllowLocalNetworkHosts: $(context.fieldIds.AllowLocalNetworkHosts),
            DisallowedFileExtensions: $(context.fieldIds.DisallowedFileExtensions),
            DisallowedHosts: $(context.fieldIds.DisallowedHosts),
    	    Mentions: $(context.fieldIds.Mentions),
        	Hashtags: $(context.fieldIds.Hashtags),
        	UrlEmbedding: $(context.fieldIds.UrlEmbedding),
        	EmbeddableContent: $(context.fieldIds.EmbeddableContent),
        	FileEmbedding: $(context.fieldIds.FileEmbedding),
        	Emoticons: $(context.fieldIds.Emoticons),
        	Font: $(context.fieldIds.Font),
        	FontDecoration: $(context.fieldIds.FontDecoration),
        	FontSize: $(context.fieldIds.FontSize),
        	ForegroundColor: $(context.fieldIds.ForegroundColor),
        	Background: $(context.fieldIds.Background),
        	BordersAndLines: $(context.fieldIds.BordersAndLines),
        	Lists: $(context.fieldIds.Lists),
        	Paragraphs: $(context.fieldIds.Paragraphs),
        	Tables: $(context.fieldIds.Tables),
        	Links: $(context.fieldIds.Links),
        	MaxFileSizeMegaBytes: $(context.fieldIds.MaxFileSizeMegaBytes),
        	Microformats: $(context.fieldIds.Microformats),
        	SemanticMarkup: $(context.fieldIds.SemanticMarkup),
        	CustomStyles: $(context.fieldIds.CustomStyles),
        	Frames: $(context.fieldIds.Frames),
        	Data: $(context.fieldIds.Data)
        };
    }

	var api = {
		register: function(context) {
		    loadFields(context);
		    registerContent(context);

			context.api.registerSave(function(o) {

                var allowedProtocols = [];
                context.fields.AllowedProtocols.find('input[type="checkbox"]:checked').each(function() {
                   allowedProtocols.push($(this).val());
                });

                var disallowedEmbedTypes = [];
                context.fields.EmbeddableContent.find('input[type="checkbox"]').each(function() {
                   if (!$(this).is(':checked')) {
                       disallowedEmbedTypes.push($(this).val());
                   }
                });
                
                var disallowedFileExtensions = [];
                $.each(context.fields.DisallowedFileExtensions.val().split('\n'), function(i, v) {
                    var extension = $.trim(v);
                    if (extension && extension.length > 0) {
                        disallowedFileExtensions.push(extension);
                    }
                });

                var disallowedHosts = [];
                $.each(context.fields.DisallowedHosts.val().split('\n'), function(i, v) {
                    var host = $.trim(v);
                    if (host && host.length > 0) {
                        disallowedHosts.push(host);
                    }
                });

                var data = {
                    AllowedProtocols: allowedProtocols.join(','),
                    AllowIpHosts: context.fields.AllowIpHosts.is(':checked'),
                    AllowLocalNetworkHosts: context.fields.AllowLocalNetworkHosts.is(':checked'),
                	UrlEmbedding: context.fields.UrlEmbedding.is(':checked'),
                	DisallowedEmbeddableContentTypeIds: disallowedEmbedTypes.join(','),
                	DisallowedFileExtensions: disallowedFileExtensions.join(','),
                	DisallowedHosts: disallowedHosts.join(','),
                	FileEmbedding: context.fields.FileEmbedding.is(':checked'),
                	Emoticons: context.fields.Emoticons.is(':checked'),
                	Font: context.fields.Font.is(':checked'),
                	FontDecoration: context.fields.FontDecoration.is(':checked'),
                	FontSize: context.fields.FontSize.is(':checked'),
                	ForegroundColor: context.fields.ForegroundColor.is(':checked'),
                	Background: context.fields.Background.is(':checked'),
                	BordersAndLines: context.fields.BordersAndLines.is(':checked'),
                	Lists: context.fields.Lists.is(':checked'),
                	Paragraphs: context.fields.Paragraphs.is(':checked'),
                	Tables: context.fields.Tables.is(':checked'),
                	Links: context.fields.Links.is(':checked'),
                	MaxFileSizeMegaBytes: context.fields.MaxFileSizeMegaBytes.val(),
                	Microformats: context.fields.Microformats.is(':checked'),
                	SemanticMarkup: context.fields.SemanticMarkup.is(':checked'),
                	CustomStyles: context.fields.CustomStyles.is(':checked'),
                	Frames: context.fields.Frames.is(':checked'),
                	Data: context.fields.Data.is(':checked')
                };
                
                if (context.fields.AllowedFileExtensions.length > 0) {
                    var allowedFileExtensions = [];
                    context.fields.AllowedFileExtensions.find('input[type="checkbox"]:checked').each(function() {
                       allowedFileExtensions.push($(this).val());
                    });
                    data.AllowedFileExtensions = allowedFileExtensions.join(',');
                }

                if (context.fields.AllowedHosts.length > 0) {
                    var allowedHosts = [];
                    context.fields.AllowedHosts.find('input[type="checkbox"]:checked').each(function() {
                        allowedHosts.push($(this).val());
                    });
                    data.AllowedHosts = allowedHosts.join(',');
                }

                if (context.fields.Mentions.length > 0) {
                    data.Mentions = context.fields.Mentions.is(':checked');
                }

                if (context.fields.Hashtags.length > 0) {
                	data.Hashtags = context.fields.Hashtags.is(':checked');
                }

                $.telligent.evolution.post({
                    url: context.urls.save,
                    data: data
                })
                    .then(function() {
                        o.success();
                    })
                    .catch(function() {
                        o.error();
                    });
    		});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.contentFilteringPlugin = api;

}(jQuery, window));