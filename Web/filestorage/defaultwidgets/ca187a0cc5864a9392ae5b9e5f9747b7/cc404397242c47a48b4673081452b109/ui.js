(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
    if (typeof $.telligent.evolution.Calendar === 'undefined') { $.telligent.evolution.Calendar = {}; }
    if (typeof $.telligent.evolution.Calendar.widgets === 'undefined') { $.telligent.evolution.Calendar.widgets = {}; }

    var loadingHtml = '<div class="ui-loading"></div>',
    setContent = function (context, html, doEffect) {
        context.content.html(html).hide();
        if (doEffect) {
            context.content.fadeIn(200);
        } else {
            context.content.show();
        }
        
        var pagerData = $('.pager-data', context.content);
        context.pager.empty();
        if (pagerData.length > 0) {
            var pageSize = parseInt(pagerData.data('pagesize'), 10);
            var totalCount = parseInt(pagerData.data('totalitems'), 10);
            var dateString = pagerData.data('date');
            if (dateString) {
                $('.content-fragment-header', context.wrapper).html(context.eventsOnText.replace(/\{0\}/g, dateString));
            } else {
                $('.content-fragment-header', context.wrapper).html(context.upcomingEventsText);
            }
            
            var p = $('<div class="pager"></div>');
            context.pager.append(p);
            p.evolutionPager({
                currentPage: 0,
                pageSize: pageSize,
                totalItems: totalCount,
                pageKey: context.pageIndexParameter,
                onPage: function(pageIndex, complete, hash) {
                    page(context, pageIndex, complete);
                },
                pagedContentContainer: context.content
            });
        }
    },
    pad = function(v, l) {
      v = v + '';
      while (v.length < l) {
          v = '0' + v;
      }
      return v;
    },
    formatDate = function (date) {
        return  pad(date.getMonth() + 1, 2) + '/' + pad(date.getDate(), 2) + '/' + pad(date.getFullYear(), 4) + ' 00:00:00';
    },
    parseDate = function(sDate) {
        var components = sDate.split(' ')[0].split('/');
        return new Date(parseInt(components[2], 10), parseInt(components[0], 10) - 1, parseInt(components[1], 10));
    },
    page = function(context, pageIndex, success) {
        var data = {
            w_month: context.month,
            w_year: context.year,
            w_date: context.calendarDate == null ? '' : formatDate(context.calendarDate)
        };
        
        data[context.pageIndexParameter] = pageIndex;
        
        $.telligent.evolution.get({
            url: context.loadingUrl,
            data: data,
            success: function (response) {
                success(response);
            }
        });
    },
    load = function (context) {
        var data = {
            w_month: context.month,
            w_year: context.year,
            w_date: context.calendarDate == null ? '' : formatDate(context.calendarDate)
        };
        
        data[context.pageIndexParameter] = 1;
        var d = {};
        d[context.pageIndexParameter] = 1;
        $.telligent.evolution.url.hashData(d);
        
        $.telligent.evolution.get({
            url: context.loadingUrl,
            data: data,
            success: function (response) {
                setContent(context, response, true);
            }
        });
    };

    $.telligent.evolution.Calendar.widgets.eventList = {
        register: function (context) {
            
            $(global).on('hashchange', function(d) {
               var hash = $.telligent.evolution.url.hashData();
               if (hash) {
                   if (hash['currentDate']) {
                       var newDate = parseDate(hash['currentDate']);
                       if (!context.calendarDate || newDate.getTime() != context.calendarDate.getTime()) {
                           context.calendarDate = newDate;
                           context.year = newDate.getFullYear();
                           context.month = newDate.getMonth() + 1;
                           context.pageIndex = 1;
                           load(context);
                       } 
                   } else if (hash['currentYear'] && hash['currentMonth']) {
                       var year = parseInt(hash['currentYear'], 10);
                       var month = parseInt(hash['currentMonth'], 10);
                       if (year != context.year || month != context.month) {
                           context.year = year;
                           context.month = month;
                           context.calendarDate = null;
                           context.pageIndex = 1;
                           load(context);
                       } else if (context.calendarDate) {
                           context.calendarDate = null;
                           context.pageIndex = 1;
                           load(context);
                       }
                   }
               }
            });

            var q = $.telligent.evolution.url.parseQuery(global.location.href);
            var h = $.telligent.evolution.url.hashData();
            if (h['currentDate']) {
                context.calendarDate = parseDate(h['currentDate']);
                context.month = context.calendarDate.getMonth() + 1;
                context.year = context.calendarDate.getFullYear();
                load(context);
            } else if (q['currentDate']) {
                context.calendarDate = parseDate(q['currentDate']);
                context.month = context.calendarDate.getMonth() + 1;
                context.year = context.calendarDate.getFullYear();
                load(context);
            } else if (h['currentYear'] && h['currentMonth']) {
                context.month = parseInt(h['currentMonth'], 10);
                context.year = parseInt(h['currentYear'], 10);
                load(context);
            } else {
                load(context);
            }
        }
    };

})(jQuery, window);
