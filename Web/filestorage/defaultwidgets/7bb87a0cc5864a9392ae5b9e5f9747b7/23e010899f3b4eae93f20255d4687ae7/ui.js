(function($, global) {

	var WikiService = (function(){
		return {
			deleteRevision: function(wikiId, pageId, revisionId) {
				return $.telligent.evolution.del({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages/{PageId}/revisions/{RevisionNumber}.json',
					data: {
						WikiId: wikiId,
						PageId: pageId,
						RevisionNumber: revisionId
					}
				});
			}
		}
	})();

	var handleRevert = function(context) {
			if (!confirm(context.revertPageConfirmationText)) {
				return false;
			}

			context.revertPageButton.addClass('processing');

			$.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/pages/{PageId}.json',
				data: {
					PageId: context.pageId,
					Title: context.pageRevisionTitle,
					Body: context.pageRevisionBody,
					Tags: context.pageRevisionTags
				},
				success: function(response) {
					context.revertPageButton.removeClass('processing');
					global.location = context.pageUrl;
				},
				defaultErrorMessage: context.processingErrorText,
				error: function(xhr, desc) {
					context.revertPageButton.removeClass('processing');
					$.telligent.evolution.notifications.show(desc,{type:'error'});
				}
			});
		},
		handleDelete = function(context) {
			if(confirm(context.deleteRevisionConfirmationText)) {
				WikiService.deleteRevision(context.wikiId, context.pageId, context.revisionId).then(function(){
					var deletionConfirmationText = context.deleteRevisionCompleteText.replace(/\{0\}/gi, context.revisionId);
					$.telligent.evolution.notifications.show(deletionConfirmationText, {
						type: 'success',
						duration: 5000,
						onHide: function() {
							global.location = context.historyUrl;
						}
					});
				});
			}
		};

	var api = {
		register: function(context) {
			context.revertPageButton.on('click', function(e) {
				e.preventDefault();
				handleRevert(context);
			});
			context.deleteRevisionButton.on('click', function(e){
				e.preventDefault();
				handleDelete(context);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.revision = $.telligent.evolution.widgets.revision || api;

})(jQuery, window);
