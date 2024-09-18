(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
    if (typeof $.telligent.evolution.Calendar === 'undefined') { $.telligent.evolution.Calendar = {}; }
    if (typeof $.telligent.evolution.Calendar.widgets === 'undefined') { $.telligent.evolution.Calendar.widgets = {}; }


    var errorHtml = '<div class="message error">{ErrorText}</div>',
    attachHandlers = function (context) {
        context.wrapper.on('click', 'tr.month_head a.next_link', function (e) { 
            moveNext(context); 
            return false; 
        });
        context.wrapper.on('click', 'tr.month_head a.prev_link', function (e) { 
            movePrevious(context); 
            return false;
        });
        context.wrapper.on('click', '.calendar_day', function (e) {
            if (e.target && e.target.href && e.target.nodeName == 'A') {
                return;
            }
            var date = parseDate($(this).attr('data-date'))
            if (context.calendarDate && date.getFullYear() == context.calendarDate.getFullYear() && date.getMonth() == context.calendarDate.getMonth() && date.getDate() == context.calendarDate.getDate()) {
                goToDate(date.getFullYear(), date.getMonth() + 1, null);   
            } else {
                goToDate(date.getFullYear(), date.getMonth() + 1, date);
            }
        });
        $(global).on('hashchange', function(d) {
           var hash = $.telligent.evolution.url.hashData();
           if (hash) {
               if (hash['currentDate']) {
                   var newDate = parseDate(hash['currentDate']);
                   if (newDate.getFullYear() != context.year || newDate.getMonth() + 1 != context.month) {
                       context.calendarDate = newDate;
                       context.year = newDate.getFullYear();
                       context.month = newDate.getMonth() + 1;
                       load(context);
                   } else if (newDate != context.calendarDate) {
                       context.calendarDate = newDate;
                       showSelectedDate(context);
                   }
               } else if (hash['currentYear'] && hash['currentMonth']) {
                   var year = parseInt(hash['currentYear'], 10);
                   var month = parseInt(hash['currentMonth'], 10);
                   if (year != context.year || month != context.month) {
                       context.year = year;
                       context.month = month;
                       context.calendarDate = null;
                       load(context);
                   } else {
                       context.calendarDate = null;
                       showSelectedDate(context);
                   }
               }
           }
        });
    },
    showSelectedDate = function(context) {
        $('.calendar_day.selected', context.wrapper).removeClass('selected');
        if (context.calendarDate) {
            $('.calendar_day[data-date="' + formatDate(context.calendarDate) + '"]', context.wrapper).addClass('selected');
        }
    },
    setContent = function (context, html, doEffect) {
        context.content.html(html);
        context.loading.hide();
        if (doEffect) {
            context.content.fadeIn(200);
        } else {
            context.content.show();
        }
        
        showSelectedDate(context);
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
    goToDate = function(year, month, date) {
        $.telligent.evolution.url.hashData({
            currentYear: year,
            currentMonth: month,
            currentDate: date == null ? '': formatDate(date)
        });
    },
    moveNext = function (context) {
        var month = context.month + 1;
        var year = context.year;
        if (month > 12) {
            month = 1;
            year++;
        }
        goToDate(year, month, null);
    },
    movePrevious = function (context) {
        var month = context.month - 1;
        var year = context.year;
        if (month < 1) {
            month = 12;
            year--;
        }
        goToDate(year, month, null);
    },
    load = function (context) {
        context.content.hide();
        context.loading.show();
        $.telligent.evolution.get({
            url: context.loadingUrl,
            data: {
                w_calendarId: context.calendarId,
                w_calendarIds: context.calendarIds,
                w_groupId: context.referenceId,
                w_includeSubGroups: context.includeSubGroups,
                w_month: context.month,
                w_year: context.year
            },
            success: function (response) {
                setContent(context, response, true);
            },
            error: function () {
                setContent(context, errorHtml.replace(/\{ErrorText\}/g, context.errorText), false);
            }
        });
    };

    $.telligent.evolution.Calendar.widgets.calendar = {
        register: function (context) {
            attachHandlers(context);
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
