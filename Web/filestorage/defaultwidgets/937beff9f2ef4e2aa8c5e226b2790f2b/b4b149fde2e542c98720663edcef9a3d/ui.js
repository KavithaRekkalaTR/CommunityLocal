(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    function loadFields(context) {
        context.fields = {
            AllowedFileExtensions: $(context.fieldIds.AllowedFileExtensions),
            AllowedHosts: $(context.fieldIds.AllowedHosts),
            AllowedProtocols: $(context.fieldIds.AllowedProtocols),
            HostlessProtocols: $(context.fieldIds.HostlessProtocols),
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
        	Data: $(context.fieldIds.Data),
        	AllowedClassNames:  $(context.fieldIds.AllowedClassNames),
        	AllowedClassNamesSelection:  $(context.fieldIds.AllowedClassNamesSelection),
        	AllowedIdPrefixes:  $(context.fieldIds.AllowedIdPrefixes),
        	AllowedIdPrefixesSelection:  $(context.fieldIds.AllowedIdPrefixesSelection)
        };
    }

	$.telligent.evolution.widgets.contentFiltering = {
		register: function(context) {
		    loadFields(context);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			$.telligent.evolution.administration.header($.telligent.evolution.template.compile(context.headerTemplateId)({}));

            context.fields.AllowedClassNames.on('change', function() {
               var v = context.fields.AllowedClassNames.val();
               console.log(v);
               if (v == 'selection') {
                   context.fields.AllowedClassNamesSelection.show();
               } else {
                   context.fields.AllowedClassNamesSelection.hide();
               }
            });
            
            context.fields.AllowedIdPrefixes.on('change', function() {
               var v = context.fields.AllowedIdPrefixes.val();
               console.log(v);
               if (v == 'selection') {
                   context.fields.AllowedIdPrefixesSelection.show();
               } else {
                   context.fields.AllowedIdPrefixesSelection.hide();
               }
            });

    		var saveButton = $('.button.save', $.telligent.evolution.administration.header());
    		saveButton.on('click', function() {
    		    if (!saveButton.hasClass('disabled')) {
    		        saveButton.addClass('disabled');
    		        
    		        var allowedFileExtensions = [];
                    $.each(context.fields.AllowedFileExtensions.val().split('\n'), function(i, v) {
                        var ext = $.trim(v);
                        if (ext && ext.length > 0) {
                            allowedFileExtensions.push(ext);
                        }
                    });

    		        var allowedHosts = [];
                    $.each(context.fields.AllowedHosts.val().split('\n'), function(i, v) {
                        var host = $.trim(v);
                        if (host && host.length > 0) {
                            allowedHosts.push(host);
                        }
                    });

    		        var allowedProtocols = [];
                    $.each(context.fields.AllowedProtocols.val().split('\n'), function(i, v) {
                        var protocol = $.trim(v);
                        if (protocol && protocol.length > 0) {
                            allowedProtocols.push(protocol);
                        }
                    });

                    var hostlessProtocols = [];
                    $.each(context.fields.HostlessProtocols.val().split('\n'), function(i, v) {
                        var protocol = $.trim(v);
                        if (protocol && protocol.length > 0) {
                            hostlessProtocols.push(protocol);
                        }
                    });

                    var disallowedEmbedTypes = [];
                    context.fields.EmbeddableContent.find('input[type="checkbox"]').each(function() {
                       if (!$(this).is(':checked')) {
                           disallowedEmbedTypes.push($(this).val());
                       }
                    });
                    
                    var disallowedFileExtensions = [];
                    $.each(context.fields.DisallowedFileExtensions.val().split('\n'), function(i, v) {
                        var ext = $.trim(v);
                        if (ext && ext.length > 0) {
                            disallowedFileExtensions.push(ext);
                        }
                    });

                    var disallowedHosts = [];
                    $.each(context.fields.DisallowedHosts.val().split('\n'), function(i, v) {
                        var host = $.trim(v);
                        if (host && host.length > 0) {
                            disallowedHosts.push(host);
                        }
                    });
                    
                    var allowedIdPrefixes = []
                    $.each(context.fields.AllowedIdPrefixesSelection.val().split('\n'), function(i, v) {
                        var prefix = $.trim(v);
                        if (prefix && prefix.length > 0) {
                            allowedIdPrefixes.push(prefix);
                        }
                    });
                    
                    var allowedClassNames = [];
                    $.each(context.fields.AllowedClassNamesSelection.val().split('\n'), function(i, v) {
                        var name = $.trim(v);
                        if (name && name.length > 0) {
                            allowedClassNames.push(name);
                        }
                    });
                    
                    var data = {
                        Mentions: context.fields.Mentions.is(':checked'),
                        Hashtags: context.fields.Hashtags.is(':checked'),
                        AllowedFileExtensions: allowedFileExtensions.join(','),
                        AllowedHosts: allowedHosts.join(','),
                        AllowedProtocols: allowedProtocols.join(','),
                        HostlessProtocols: hostlessProtocols.join(','),
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
                    	Data: context.fields.Data.is(':checked'),
                    	AllowedClassNames: context.fields.AllowedClassNames.val(),
                    	AllowedClassnamesSelection: allowedClassNames.join(','),
                    	AllowedIdPrefixes: context.fields.AllowedIdPrefixes.val(),
                    	AllowedIdPrefixesSelection: allowedIdPrefixes.join(',')
                    };

    		        $.telligent.evolution.post({
    		            url: context.urls.save,
    		            data: data
    		        })
    		            .then(function() {
    		                $.telligent.evolution.notifications.show(context.text.saveSuccessful, {
    		                    type: 'success'
    		                })
    		            })
    		            .always(function() {
    		                saveButton.removeClass('disabled');
    		            });
    		    }

    		    return false;
    		});

		}
	};
}(jQuery, window));