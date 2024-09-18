// moderation UI component override
define('UiModerate', function($, global, undef) {

	function addAbuseReport(contentId, contentTypeId) {
		return $.telligent.evolution.post({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abusereports.json',
			data: {
				ContentId: contentId,
				ContentTypeId: contentTypeId
			},
			cache: false,
			dataType: 'json'
		});
	}

	function show(elm) {
		return elm.css({ display: 'block'});
	}

	function hide(elm) {
		return elm.css({ display: 'none'});
	}

	$.telligent.evolution.ui.components.moderate = {
		setup: function() { },
		add: function (elm, options) {
			if (options.supportsabuse === 'false') {
				elm.remove();
				return;
			}
			elm.empty();
			var flagLink = hide($('<a href="#">' + $.telligent.evolution.ui.components.moderate.defaults.flagText + '</a>').appendTo(elm));
			var	changing = hide($('<a href="#">…</a>').appendTo(elm));
			var	flaggedState = hide($('<a href="#">' + $.telligent.evolution.ui.components.moderate.defaults.flaggedText + '</a>').appendTo(elm));

			// if already flagged, show that instead of the link
			if(options.initialstate == 'true') {
				show(flaggedState).on('click', function(e){ return false; });
			} else {
				show(flagLink).on('click', function(e){
					e.preventDefault();
					e.stopPropagation();
					// when tapped, show the 'changing' state
					show(changing);
					hide(flagLink);
					// and submit the abuse report
					addAbuseReport(options.contentid, options.contenttypeid).then(function(){
						// switch to the 'flagged' link state
						show(flaggedState);
						hide(changing);
						// raise ui.reportabuse message
						$.telligent.evolution.messaging.publish('ui.reportabuse', {
							contentId: options.contentid,
							contentTypeId: options.contenttypeid
						});
						// show a message
						$.telligent.evolution.notifications.show($.telligent.evolution.ui.components.moderate.defaults.reportedText, {
							duration: $.telligent.evolution.ui.components.moderate.defaults.duration
						});
					});
				});
			}
		}
	};
	$.telligent.evolution.ui.components.moderate.defaults = {
		reportedText: 'Thank you for your report',
		flagText: 'Flag Author as Abusive',
		flaggedText: 'Author Flagged as Abusive',
		duration: 5 * 1000
	};

	return {};

}, jQuery, window);
