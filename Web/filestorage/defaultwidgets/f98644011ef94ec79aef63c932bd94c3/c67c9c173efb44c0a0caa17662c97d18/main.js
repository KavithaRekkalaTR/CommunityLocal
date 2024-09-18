define('main', [
	'StudioTabListView',
	'StudioBrowseView',
	'StudioShortcutsController',
	'StudioEnvironment',
	'StudioTabContentView',
	'StudioTabListStore',
	'ViewProvider',
	'ReportingUtility',
	'ReportingModel',
	'ReportingRouter' ],
function(
	StudioTabListView,
	StudioBrowseView,
	StudioShortcutsController,
	StudioEnvironment,
	StudioTabContentView,
	StudioTabListStore,
	ViewProvider,
	ReportingUtility,
	ReportingModel,
	ReportingRouter,
	$, global, undef)
{

// adjust tables to be scrollable if they are larger than the content width and available height
(function($) {
	var maxHeight = 1500,
		checkResize = function() {
			$('.content-scrollable-wrapper').each(function() {
				var w = $(this);
				var sw = w.prop('scrollWidth') || w.width();
				if (sw > w.outerWidth()) {
					w.addClass('content-scrollable-wrapper-scrolled').css('max-height', (maxHeight * .8) + 'px');
				} else {
					w.removeClass('content-scrollable-wrapper-scrolled').css('max-height', 'none');
				}
			});
		},
		detectElements = function() {
			$('.scrollable-table').each(function() {
				var t = $(this);
				if (t.parents('.content-scrollable-wrapper').length == 0) {
					t.wrap('<div class="content-scrollable-wrapper" style="max-width: 100%; overflow: auto;"></div>');
				}
			});
		};

	$.telligent.evolution.messaging.subscribe('window.scrollableheight', function(data) {
		maxHeight = data.height;
		checkResize();
	});

	$(function() {
		var mutationTimeout;
		$('body').on('mutate', function() {
			clearTimeout(mutationTimeout);
			mutationTimeout = setTimeout(function(){
				detectElements();
				checkResize();
			}, 500);
		});

		detectElements();
		checkResize();
	});
})(jQuery);




	function setupViews(context) {

		return $.Deferred(function(d){

			//
			// Tab List View
			//
			var headerContainer = $('<div></div>');
			$.telligent.evolution.administration.header(headerContainer, {
				inherit: false
			});

			ViewProvider.tabListView = new StudioTabListView({
				container: headerContainer,
				onSelected: function(key) {
					context.router.navigateTo(key);
				},
				onClosed: function(key) {
					ViewProvider.tabContentView.close(key);
					ReportingUtility.deleteTabData(key);
					$.fn.evolutionTip.hide();
				},
				onChange: function(keys) {
					ViewProvider.tabListStore.persist();
				}
			});


			//
			// Tab List Storage
			//

			// Persist open tab lists across reload
			ViewProvider.tabListStore = new StudioTabListStore({
				tabListView: ViewProvider.tabListView,
				storageNameSpace: 'Reporting',
				onLoad: function(key) {
					var keyValues = $.telligent.evolution.url.parseQuery(key || '');

					var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(key);

					var drillReportIds = tabData._drillReportId ? tabData._drillReportId.split(',') : [];
					var drillReportId = drillReportIds[drillReportIds.length -1] || false;

					if (keyValues.type == 'report' && drillReportId != false) {
						return context.model.getReport(keyValues.id).then(function(item){
							ViewProvider.browseView.select({ key: $.telligent.evolution.url.serializeQuery({ type: keyValues.type, id: keyValues.id}) });

							return context.model.getReport(drillReportId).then(function(reportItem){
								return {
									key: key,
									content: buildTabContent(item.name, reportItem.description, reportItem.name)
								};
							});
						});
					}
					else if (keyValues.type == 'report') {
						return context.model.getReport(keyValues.id).then(function(item){
							ViewProvider.browseView.select({ key: $.telligent.evolution.url.serializeQuery({ type: keyValues.type, id: keyValues.id}) });

							return {
								key: key,
								content: buildTabContent(item.name, item.description, context.resources.report)
							};
						});
					}
				}
			});

			var contentContainer = $.telligent.evolution.administration.panelWrapper().find('.content-container');

			ViewProvider.tabContentView = new StudioTabContentView({
				container: contentContainer
			});

			var sideBarContainer = $('<div></div>').get(0);
			return $.telligent.evolution.administration.sidebar({
				content: sideBarContainer
			}).then(function(){

				ViewProvider.browseView = new StudioBrowseView({
					container: $(sideBarContainer),
					wrapperCssClass: 'reporting-shell',
					treeNodeTemplate: context.templates.browseViewItemTemplate,
					onSelected: function(key, modifiers) {

						var keyValues = $.telligent.evolution.url.parseQuery(key || '');
						if (keyValues.type != 'report') {
							return;
						}

						if (modifiers.ctrlKey == true) {
							context.router.navigateTo(key);
						} else {
							var openTabs = ViewProvider.tabListView.list();

							var matchingOpenTabs = openTabs.filter(function(tab){
								var tabValues = $.telligent.evolution.url.parseQuery(tab.key || '');
								return keyValues.id == tabValues.id;
							});

							if (matchingOpenTabs.length == 0) {
								context.router.navigateTo(key);
							}
							else if(matchingOpenTabs.length == 1) {
								context.router.navigateTo(matchingOpenTabs[0].key);
							}
							else {
								var currentTab = ViewProvider.tabListView.current();
								var index = matchingOpenTabs.findIndex(function(tab){
									return tab.key == currentTab;
								});

								if (index == -1 || index == matchingOpenTabs.length - 1) {
									context.router.navigateTo(matchingOpenTabs[0].key);
								}
								else {
									context.router.navigateTo(matchingOpenTabs[index + 1].key);
								}
							}
						}
					},
					onSearchExit: function() {
						ViewProvider.browseView.removeAll();
						ViewProvider.browseView.add({ nodes: context.browseNodes });
					},
					onSearchQuery: function(query) {
						return $.Deferred(function(d){

							var newNodes = [];
							$.each(context.browseNodes, function(index, value) {
								var childNodes = [];
								$.each(value.children, function(nodeIndex, nodeValue) {
									if(nodeValue.label.toLowerCase().search(query.toLowerCase()) >= 0) {
										childNodes.push(nodeValue);
									}
								});

								if (childNodes.length > 0) {
									var newCategory = {
										key: value.key,
										expanded: value.expanded || false,
										cssClass: value.cssClass,
										label: value.label,
										model: value
									};

									newCategory.children = childNodes;
									newNodes.push(newCategory);
								}
							});

							d.resolve({
								query: query,
								nodes: newNodes
							});
						}).promise();
					},

					searchPlaceholder: context.resources.Search

				});

				ViewProvider.shortcutsController = new StudioShortcutsController({
					tabListView: ViewProvider.tabListView,
					browseView: ViewProvider.browseView
				});
				ViewProvider.shortcutsController.registerDefaultShortcuts();

				d.resolve();
			});
		}).promise();
	}

	function buildTabContent(name, description, secondaryName) {
		return '<div class="tab-content-item"><span class="primary">' + name + '</span> <span class="secondary">' + secondaryName + '</span></div>';
	}

	function handleDrillDownClick(e, target, context) {
		e.preventDefault();
		//e.stopPropagation();
		//e.stopImmediatePropagation();

		var reportId = $(target).data('report-id') || $(target).closest('.report-drilldown').data('report-id');
		var key = $.telligent.evolution.url.hashData()._tab_key;

		var applicationid = $(target).data('applicationid');
		var applicationname = $(target).data('applicationname');
		var applicationtypeid = $(target).data('applicationtypeid');
		var applicationtype = $(target).data('applicationtype');
		var containerid = $(target).data('containerid');
		var containername = $(target).data('containername');
		var userid = $(target).data('userid');
		var username = $(target).data('username');
		var contentid = $(target).data('contentid');
		var contenttypeid = $(target).data('contenttypeid');
		var contentname = $(target).data('contentname');
		var localStartDate = $(target).data('localstartdate');
		var localEndDate = $(target).data('localenddate');
        var filtertype = $(target).data('localfiltertype');
		var filterid = $(target).data('localfilterid');
		var filtername = $(target).data('localfiltername');
		var filtertypeid = $(target).data('localfiltertypeid');

		if (e.ctrlKey == true) {
			var newKey = $.telligent.evolution.url.serializeQuery({
				type: 'report',
				id: reportId,
				tab: $.telligent.evolution.widgets.reporting.util.guid()
			});

			//copy current tab settings, to new report key
			var tabData = $.telligent.evolution.widgets.reporting.util.getCurrentTabData();
			tabData.key = newKey;

			if (applicationid) {
				tabData.selectedApplications = [{ id: applicationid, name: applicationname }];
				tabData.includeApplications = 'include';
			}
			if (applicationtypeid) {
				tabData.selectedApplicationTypes = [{ id: applicationtypeid, name: applicationtype }];
				tabData.includeApplicationTypes = 'include';
			}			
			if (containerid) {
				tabData.selectedGroups = [{ id: containerid, name: containername }];
				tabData.includeGroups = 'include';
			}
			if (userid || userid == 0) {
				tabData.selectedUsers = [{ id: userid, name: username }];
			}
			if (contentid) {
				tabData.selectedContent = [{ id: contentid, name: contentname, typeid: contenttypeid }];
			}
			if (localStartDate) {
				tabData.localStartDate = localStartDate;
			}
			if (localEndDate) {
				tabData.localEndDate =localEndDate;
            }

            if(filtertype) {
                tabData.localfilter = [{ type: filtertype, id: filterid, typeid: filtertypeid, name: filtername }];
            }
            else {
                 tabData.localfilter = null;
            }

			tabData._drillReportId = null;

			$.telligent.evolution.widgets.reporting.util.updateTabData(newKey, tabData);

			context.router.navigateTo(newKey);
		}
		else {
			var tabData = $.telligent.evolution.widgets.reporting.util.getCurrentTabData();

			if (applicationid) {
				tabData.selectedApplications = [{ id: applicationid, name: applicationname }];
				tabData.includeApplications = 'include';
			}

			if (applicationtypeid) {
				tabData.selectedApplicationTypes = [{ id: applicationtypeid, name: applicationtype }];
				tabData.includeApplicationTypes = 'include';
			}					
			if (containerid) {
				tabData.selectedGroups = [{ id: containerid, name: containername }];
				tabData.includeGroups = 'include';
			}
			if (userid || userid == 0) {
				tabData.selectedUsers = [{ id: userid, name: username }];
			}
			if (contentid) {
				tabData.selectedContent = [{ id: contentid, name: contentname, typeid: contenttypeid }];
			}
			if (localStartDate) {
				tabData.localStartDate = localStartDate;
			}
			if (localEndDate) {
				tabData.localEndDate =localEndDate;
            }
            if(filtertype) {
                tabData.localfilter = { type: filtertype, id: filterid, typeid: filtertypeid, name: filtername };
            }
            else {
                 tabData.localfilter = null;
            }

			$.telligent.evolution.widgets.reporting.util.updateTabData(key, tabData);

			var drillReportIds = tabData._drillReportId ? tabData._drillReportId.split() : [];
			drillReportIds.push(reportId);

			var tabData = { _drillReportId: drillReportIds };
			context.router.navigateTo(key, tabData);
		}
	}

	api = {
		register: function(options) {
			var context = options;

			Highcharts.setOptions({
				colors: ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#3B3EAC', '#0099C6', '#DD4477', '#66AA00',
				'#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6', '#3B3EAC']
			});

			setupViews(context).then(function(){
				context.model = new ReportingModel(context);

				context.router = new ReportingRouter({
					onNavigate: function(key, forceRender) {
						var keyValues = $.telligent.evolution.url.parseQuery(key || '');

						// first detect if tab is already open:
						var openTabs = ViewProvider.tabListView.list();
						result =  openTabs.filter(function(tab) {
							return tab.key == key;
						});

						var matchingOpenTab = false;
						if (result.length > 0) {
							matchingOpenTab = result[0];
						}
						var matchingRenderedContent = ViewProvider.tabContentView.get(key);
						var tabData = $.telligent.evolution.widgets.reporting.util.getCurrentTabData();

						var drillReportIds = $.telligent.evolution.url.hashData()._drillReportId !== undefined ? $.telligent.evolution.url.hashData()._drillReportId.split(',') : [];
						var drillReportId = drillReportIds[drillReportIds.length -1] || false;

						var dataDrillReportIds = tabData._drillReportId ? tabData._drillReportId.split(','): [];
						var lastDrillReportId = $.telligent.evolution.widgets.reporting.util.getLastItemInArray(dataDrillReportIds);

						if (matchingOpenTab && matchingRenderedContent) {
							if (drillReportId != false) {
								context.model.getReport(drillReportId).then(function(item){
									ViewProvider.tabContentView.render(key, context.model.loadReport(key, item.id, keyValues.id, drillReportIds).responseText);

									context.model.getReport(keyValues.id).then(function(reportItem){
										ViewProvider.tabListView.update({
											key: key,
											content: buildTabContent(reportItem.name, item.description, item.name)
										});
									});

									var data = {
										_drillReportId: drillReportId
									};

									$.telligent.evolution.widgets.reporting.util.updateCurrentTabData(data);
								});
							}
							else {
								if (forceRender || lastDrillReportId != drillReportId) {
									context.model.getReport(keyValues.id).then(function(item){
										ViewProvider.tabContentView.render(key, context.model.loadReport(key, item.id, null, drillReportIds).responseText);

										ViewProvider.tabListView.update({
											key: key,
											content: buildTabContent(item.name, item.description, context.resources.report)
										});

										var data = {
											_drillReportId: null
										};

										$.telligent.evolution.widgets.reporting.util.updateCurrentTabData(data);
									});
								}
								else {
									ViewProvider.tabContentView.render(key);
								}
							}

							ViewProvider.tabListView.addOrSelect({ key: key });
							ViewProvider.browseView.select({ key: $.telligent.evolution.url.serializeQuery({ type: keyValues.type, id: keyValues.id}) });
						} else {
							if (drillReportId != false) {
								context.model.getReport(drillReportId).then(function(item){
									context.model.getReport(keyValues.id).then(function(reportItem){
										ViewProvider.tabListView.addOrSelect({
											key: key,
											content: buildTabContent(reportItem.name, item.description, item.name)
										});
									});

									ViewProvider.tabContentView.render(key, context.model.loadReport(key, item.id, keyValues.id, drillReportIds).responseText);
									ViewProvider.browseView.select({ key: $.telligent.evolution.url.serializeQuery({ type: keyValues.type, id: keyValues.id}) });
								});
							}
							else {
								context.model.getReport(keyValues.id).then(function(item){
									ViewProvider.tabListView.addOrSelect({
										key: key,
										content: buildTabContent(item.name, item.description, context.resources.report)
									});

									ViewProvider.tabContentView.render(key, context.model.loadReport(key, item.id, null, drillReportIds).responseText);
									ViewProvider.browseView.select({ key: $.telligent.evolution.url.serializeQuery({ type: keyValues.type, id: keyValues.id}) });
								});
							}
						}
					}
				});

				$(global).on('hashchange.ReportingRouter', function(){
					context.router.processCurrent();
				});

				var nodes = [];

				context.model.listReports().then(function(response){

					$(response.categories).each(function() {
						var category = {};
						category.key = $.telligent.evolution.url.serializeQuery({
							type: this.type,
							id: this.name
						});
						category.label = this.name;
						category.expanded = true;
						category.children = [];
						category.cssClass = this.type;
						category.model = this;

						$(this.reports).each(function() {
							if (context.hasSiteReportingPermission == 'true' || (this.requiresSitePermission == 'false' && context.hasGroupReportingPermission == 'true')) {
								var report = {};
								report.key = $.telligent.evolution.url.serializeQuery({
									type: this.type,
									id: this.id
								});
								report.label = this.name;
								report.cssClass = this.type;
								report.model = this;
								category.children.push(report);
							}
						});

						if(category.children.length > 0) {
							nodes.push(category);
						}
					});

					context.browseNodes = nodes;
					if (nodes.length > 0) {
						ViewProvider.browseView.add({nodes: nodes });
					}
				});

				// restore previously-loaded tabs
				ViewProvider.tabListStore.restore().then(function(previouslyCurrentTabKey){

					// then attempt to process the current URL at load to set it as current
					var urlRequest = context.router.processCurrent();

					// if the URL doesn't have a current tab key, then set the previously current key to current
					if (!urlRequest && previouslyCurrentTabKey) {
						ViewProvider.tabListView.addOrSelect({ key: previouslyCurrentTabKey });
					}

				});
			});


			$("body").on("click", ".report-drilldown", function(e){
				handleDrillDownClick(e, e.target, context);
			});

			$("body").on("click", ".report-tile", function(e){
				if (e.target.tagName.toLowerCase() !== "a" && $(this).data('report-id').length > 0 && $(e.target).closest('.highcharts-legend-item').length == 0) {
					handleDrillDownClick(e, this, context);
				}
			}).children('.highcharts-legend').on("click", function(e){
				return false;
			});

			//handle the Open New option in the browseView and open a new tab
			$.telligent.evolution.messaging.subscribe('reporting.report.openNew', function(data){

				var key = $(data.target).data('key');
				var containerid = $(data.target).data('containerid');
				var containername = $(data.target).data('containername');
				var applicationid = $(data.target).data('applicationid');
				var applicationname = $(data.target).data('applicationname');
				var userid = $(data.target).data('userid');
				var username = $(data.target).data('username');

				var newKey = key + '&tab=' + $.telligent.evolution.widgets.reporting.util.guid();

				//copy current tab settings, to new report key
				var tabData = $.telligent.evolution.widgets.reporting.util.getCurrentTabData();
				tabData.key = newKey;

				if (applicationid) {
					tabData.selectedApplications = [{ id: applicationid, name: applicationname }];
					tabData.includeApplications = 'include';
				}
				if (containerid) {
					tabData.selectedGroups = [{ id: containerid, name: containername }];
					tabData.includeGroups = 'include';
				}
				if (userid) {
					tabData.selectedUsers = [{ id: userid, name: username }];
				}

				tabData._drillReportId = null;

				$.telligent.evolution.widgets.reporting.util.updateTabData(newKey, tabData);

				context.router.navigateTo(newKey);
			});

			//handle the drill up click
			$.telligent.evolution.messaging.subscribe('reporting.drill.up', function(data){
				var key = $.telligent.evolution.url.hashData()._tab_key;
				var drillReportIds = $.telligent.evolution.url.hashData()._drillReportId ?? '';
				var targetid = $(data.target).data('targetid');

				var ids = drillReportIds.split(',');
				var index = ids.indexOf(targetid);

				if (index >= 0) {
					var newData = { _drillReportId: ids.slice(0, ids.indexOf(targetid) + 1).join(',') };
				}
				else {
					var newData = { _drillReportId: null };
				}

				context.router.navigateTo(key, newData);
			});

			//handles message from reset Report Filter
			$.telligent.evolution.messaging.subscribe('reporting.reset.report', function(data){

				var tabData = $.telligent.evolution.widgets.reporting.util.getCurrentTabData();
				var key = tabData.key;

				var newData = {
					key: tabData.key,
					_drillReportId: tabData._drillReportId
				};

				if (tabData.defaultFilters) {
					newData.defaultFilters = tabData.defaultFilters;
					var filterValues = $.telligent.evolution.url.parseQuery(tabData.defaultFilters || '');
					$.extend(newData, filterValues);
				}

				$.telligent.evolution.widgets.reporting.util.deleteTabData(key);
				$.telligent.evolution.widgets.reporting.util.updateTabData(key, newData);
				context.router.reset();
			});

			// clean up on unload
			$.telligent.evolution.administration.on('panel.unloaded', function(){
				context.router.cleanup();
				ViewProvider.browseView.cleanup();
				ViewProvider.tabListView.cleanup();
			});
		}
	};

	return api;

}, jQuery, window);

