;(function($) {

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

	var getSelectedRevisions = function(context) {
			return $("input:checked", context.revisionListingContainer).map(function(){
				return this.name;
			});
		},
		handleVersionComparisons = function(context) {
			var result = '',
				numChecks = 0;
				versions = getSelectedRevisions(context);

			if(versions.length > 2) {
				alert(context.tooManyVersionsText);
			} else if(versions.length < 2) {
				alert(context.notEnoughVersionsText);
			} else {
				window.location = $.telligent.evolution.url.modify({
					url: 'compare',
					query: {
						revA: versions[1],
						revB: versions[0]
					}
				});
			}
		},
		handleVersionDeletions = function(context) {
			var versions = getSelectedRevisions(context),
				revisionDeletionRequests = [];

			if(versions.length === 0) {
				alert(context.deleteNotEnoughText);
			} else if(versions[0] == '0') {
				alert(context.deleteCurrentText);
			} else if(confirm(context.deleteConfirmText)) {

				var versionList = $.makeArray(versions);
				versionList.sort();
				var versionsDeletionConfirmationText = versionList.join(', '),
					deletionConfirmationText = versions.length > 1 ? context.deleteCompleteMultipleText.replace(/\{0\}/gi, versionsDeletionConfirmationText) : context.deleteCompleteSingleText.replace(/\{0\}/gi, versionsDeletionConfirmationText);

				revisionDeletionRequests = $.map(versions, function(version) {
					return WikiService.deleteRevision(context.wikiId, context.wikiPageId, version);
				});

				$.when.apply($, revisionDeletionRequests).then(function(){
					if(context.revisionCount > (versions.length + 1)) {
						$("input:checked", context.revisionListingContainer).closest('tr').remove();
					}
					$.telligent.evolution.notifications.show(deletionConfirmationText, {
						type: 'success',
						duration: 5000,
						onHide: function() {
							if(context.revisionCount === (versions.length + 1)) {
								window.location.reload(true);
							}
						}
					});
				});
			}
		};

	var api = {
		register: function(context) {
			context.compareVersionsButton.on('click', function() {
				handleVersionComparisons(context);
			});
			context.deleteVersionsButton.on('click', function(){
				handleVersionDeletions(context);
			});

			if ($(":checkbox", context.revisionListingContainer).length > 1) {
				$(":checkbox", context.revisionListingContainer).get(1).setAttribute('checked', 'checked');
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.history = $.telligent.evolution.widgets.history || api;

})(jQuery);
