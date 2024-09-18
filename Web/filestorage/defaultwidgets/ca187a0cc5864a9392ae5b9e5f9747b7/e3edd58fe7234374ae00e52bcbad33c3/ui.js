(function ($) {

    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
    if (typeof $.telligent.evolution.Calendar === 'undefined') { $.telligent.evolution.Calendar = {}; }
    if (typeof $.telligent.evolution.Calendar.widgets === 'undefined') { $.telligent.evolution.Calendar.widgets = {}; }

    var saveTags = function (context, tags, successFn) {
        var data = {
            Tags: tags.length > 0 ? tags.join(',') : '',
            Id: context.eventId
        };
        $.telligent.evolution.put({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/calendars/events/{Id}.json',
            data: data,
            dataType: 'json',
            success: function (response) {
                successFn();
                context.currentTags = tags;
                var tagsHtml = '';
                for (var i = 0; i < context.currentTags.length; i++) {
                    var tagName = $.trim(context.currentTags[i]);
                    var tagUrl = context.tagUrlTemplate.replace(/TAGNAME/g, encodeURIComponent(tagName.replace(/ /g, '+')));
                    tagsHtml = tagsHtml + '<a href="' + tagUrl + '">' + $('<div/>').text(tagName).html() + '</a>';
                    if (i + 1 < context.currentTags.length) tagsHtml = tagsHtml + ', ';
                }
                context.tagList.html(tagsHtml);
            },
            error: function (xhr, desc, ex) {
                alert(desc);
            }
        });
    },
    showRegistration = function (context) {
        $.glowModal([context.registerModal, '&eventId=', context.eventId, '&userId=', context.userId].join(''), {
            width: 500,
            height: 300
        });
    };

    $.telligent.evolution.Calendar.widgets.calendarEvent = {
        register: function (context) {
            if (context.tagEditor) context.tagEditor.evolutionInlineTagEditor({
                allTags: context.allTags,
                currentTags: context.currentTags,
                selectTagsText: context.selectTagsText,
                onSave: function (tags, successFn) {
                    saveTags(context, tags, successFn);
                }
            });

            $('.external-preview', context.wrapper).on('click', function() {
                var e = $(this);
                window.location = e.data('url');
            });

            $(context.register).on('click', function () {
                showRegistration(context);
            });
        }
    };

})(jQuery, window);
