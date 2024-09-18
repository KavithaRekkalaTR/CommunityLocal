
function ContentFragmentContainer(wrapperId, layoutElementId, layoutRegionElements, currentLayoutId, tabsElementId, callbackFunction, stateElementId, currentTabId, authHeaderCookieName, containerType, editOverlayText, themeTypeId, themeApplicationId, themeName, isAdministrator, editorUrl, showEditorOnLoad, editorView, jqueryUiUrl)
{
	var _wrapperElement = document.getElementById(wrapperId);
	var _layoutElement = document.getElementById(layoutElementId);
	var _tabsElement = document.getElementById(tabsElementId);
	var _stateElement = document.getElementById(stateElementId);
	var _currentLayoutId = currentLayoutId;
	var _layoutRegions = new Array();
	var _callbackFunction = callbackFunction;
	var _tabs = null;
	var _currentTabId = currentTabId;
	var _fragmentPrefix = '';
	var _authHeaderCookieName = authHeaderCookieName;
	var _containerType = containerType;
	var _editOverlayText = editOverlayText;
	var _themeTypeId = themeTypeId;
	var _themeApplicationId = themeApplicationId;
	var _themeName = themeName;
	var _isAdministrator = isAdministrator;
	var _editorUrl = editorUrl;
	var _showEditorOnLoad = showEditorOnLoad;
	var _editorView = editorView;
	var _loadingText = '<div class="page-management-loading"><div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div></div>';
	var _jqueryUiHtml = '<script type="text/javascript" src="' + jqueryUiUrl + '"></script>';

	var _currentEditor = null;
	var _isResetting = false;

	/*
	layoutRegionElements[index]
		id
		name
	*/

	for (var i = 0; i < layoutRegionElements.length; i++)
	{
		_layoutRegions[i] = { 'element': $('.layout-region-inner', document.getElementById(layoutRegionElements[i].id)).get(0), 'name': layoutRegionElements[i].name };
	}

	/*
	layoutTypes[index]
		id
		previewImageUrl
		name
		regions[index]
			name
			copyFrom[index]
	*/

	var _userCanLock = false;
	var _currentLayoutName = '';
	var _isDefault = false;
	var _applicationName = '';
	var _themeTypeName = '';
	var _isFactoryDefault = false;
	var _hasDefault = false;
	var _hasFactoryDefault = false;
	var _supportsDefault = false;
	var _layoutTypes = null;
	var _isCustomizing = false;
	var _initialized = false;
	var _contentFragmentsInitialized = true;
	var _contentFragmentTypes = null;
	var _contentFragmentTypesIndex = null;
	var _contentFragmentWrappingFormats = null;
	var _localText = null;
	var _enableContentFragmentLocking = true;
	var _tabs = null;
	var _contentFragments = null;
	var _editTabUrl = null;
	var _isChanged = false;
	var _initialState = null;
	var _ignoreNavigationConfirmation = false;
	var _reflowOptions = null;
	var _defaultWrappingFormatWithHeader = '';
	var _defaultWrappingFormatWithoutHeader = '';
	var _isStaged = false;

	var EDIT_MESSAGE = 'contentfragmentcontainer.edit';
	var EDIT_EVENT = 'customizepage';
	var BEFORE_EDIT_EVENT = 'beforecustomizepage';

	var _contentFragmentWrappingFormatsMenu = null;
	var _contentFragmentWrappingFormatsOpeningElement = null;
	var _isShowingEditShade = false;

	if (_showEditorOnLoad) {
		var isInAdministration = false;

		$.telligent.evolution.messaging.subscribe('administration.panel.loaded', function () {
			isInAdministration = true;
		}, { excludeAutoNameSpaces: true });

		$(function () {
			window.setTimeout(function () {
				if (!isInAdministration) {
					window.location = _editorUrl;
				} else {
					_reset(false);
				}
			}, 250);
		});
	}

	$.telligent.evolution.messaging.subscribe(EDIT_MESSAGE, function (d) {
		if (d.contentFragmentContainerType != _containerType) {
			_showInactiveEditOverlay();
		} else {
			_hideInactiveEditOverlay();
		}
	}, { excludeAutoNameSpaces: true });

	function _initializePopUpMenu() {
		_contentFragmentWrappingFormatsMenu = $('<div></div>').appendTo(_wrapperElement);
		_contentFragmentWrappingFormatsMenu.glowPopUpMenu({
			groupCssClass: 'content-fragment-wrapper-format-content menu',
			itemCssClass: 'menu-item',
			itemSelectedCssClass: 'menu-item selected',
			position: 'down',
			zIndex: 1001
		}).on('glowPopUpMenuClosed', function () {
			if (_contentFragmentWrappingFormatsOpeningElement) {
				$(_contentFragmentWrappingFormatsOpeningElement).removeClass('active').closest('.content-fragment-management').removeClass('active');
			}
		});
	}

	function _hideInactiveEditOverlay() {
		if (_isShowingEditShade) {
			$(_wrapperElement)
				.css('overflow', 'visible')
				.css('max-height', 'none');

			$('.page-management-shade', _wrapperElement).remove();
			_isShowingEditShade = false;
		}
	}

	function _showInactiveEditOverlay() {
		if (!_isShowingEditShade) {
			_isShowingEditShade = true;

			$(_wrapperElement)
				.css('position', 'relative')
				.css('overflow', 'hidden')
				.css('max-height', Math.max($(_wrapperElement).outerHeight(), 100) + 'px')
				.addClass('active')
				.prepend(
					$('<div class="page-management-shade"></div>')
						.append(
							$('<a href="#"><span></span>' + _editOverlayText + '</a>')
								.on('click', function () {
									if (!_initialized) {
										_initialize(true);
									} else {
										_renderEditor(true);
									}
									return false;
								})
						)
						.on('click', function () {
							if (!_initialized) {
								_initialize(true);
							} else {
								_renderEditor(true);
							}
							return false;
						})
				);

			$('.layout', _wrapperElement).addClass('active');
		}
	}

	function _initialize(isActive) {
		return $.Deferred(function (d) {
			if (_initialized) {
				d.resolve();
				return;
			}

			// Disable document.write once edit mode is initialized
			document.write = function (html) { };

			$('body').one('rendered', function() {
				if (!_initialized) {
					_initialized = true;

					_initializePopUpMenu();

					if (_contentFragmentsInitialized)
						$('.content-fragment', _layoutElement).html('');

					_callbackFunction('initialize', '', function (result) {
						_initializeCallback(result, isActive)
							.then(function () {
								d.resolve();
							})
							.catch(function () {
								d.reject();
							})
					}, function () {
						d.reject();
					}, null, _getAuthValue());
				}
			}).append(_jqueryUiHtml);
		}).promise();
	}

	function _getAuthValue () {
		var nameEQ = _authHeaderCookieName + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1, c.length);
			}
			if (c.indexOf(nameEQ) == 0) {
				return c.substring(nameEQ.length, c.length);
			}
		}
		return '';
	}

	function _initializeCallback(result, isActive) {
		return $.Deferred(function (d) {
			var r = _parseJSON(result);

			_userCanLock = r.userCanLock;
			_layoutTypes = r.layoutTypes;
			_localText = r.localText;
			_contentFragmentWrappingFormats = r.contentFragmentWrappingFormats;
			_pages = r.pages;
			_fragmentPrefix = r.fragmentPrefix;
			_isDefault = r.isDefault;
			_isFactoryDefault = r.isFactoryDefault;
			_hasDefault = r.hasDefault;
			_hasFactoryDefault = r.hasFactoryDefault;
			_tabs = r.tabs;
			_contentFragments = r.contentFragments;
			_editTabUrl = r.editTabUrl;
			_reflowOptions = r.reflowOptions;
			_defaultWrappingFormatWithHeader = r.defaultWrappingFormatWithHeader;
			_defaultWrappingFormatWithoutHeader = r.defaultWrappingFormatWithoutHeader;
			_isStaged = r.isStaged;
			_applicationName = r.applicationName;
			_themeTypeName = r.themeTypeName;
			_supportsDefault = r.supportsDefault;

			$(document).trigger(BEFORE_EDIT_EVENT);

			for (var i = 0; i < _layoutTypes.length; i++) {
				if (_layoutTypes[i].id ==	_currentLayoutId) {
					_currentLayoutName = _layoutTypes[i].name;
					break;
				}
			}

			_indexContentFragmentTypes(r.contentFragmentTypes);

			_renderEditor(isActive)
				.catch(function () {
					d.reject();
				})
				.then(function () {
					_contentFragmentsInitialized = true;
					for (var i = 0; i < _layoutRegions.length; i++) {
						var regionName = _layoutRegions[i].name;
						$('.content-fragment-management', _layoutRegions[i].element).each(function () {
							var cfData = $(this).data('contentFragment');
							if (cfData) {
								$(this).find('.content-fragment-management-content').html(_loadingText);
								_callbackFunction('render-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&config=' + encodeURIComponent(cfData.configuration) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&region=' + encodeURIComponent(regionName) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
									_configureContentFragmentCallbackCallback(result);
								}, null, null, _getAuthValue());
							}
						});
					}

					_saveState();

					$(_layoutElement).on('click', '.delete-content-fragment', function (e) {
						var id = $(this).data('contentfragmentid');
						if (id) {
							_deleteContentFragment(id);
						}
						return false;
					});

					$(_layoutElement).on('click', '.content-fragment-wrapper-format-button', function (e) {
						var id = $(this).data('contentfragmentid');
						if (id) {
							_selectContentFragmentWrappingFormat(this, id);
						}
						return false;
					});

					$(_layoutElement).on('click', '.content-fragment-reflow-options-button', function (e) {
						var id = $(this).data('contentfragmentid');
						if (id) {
							_selectContentFragmentReflowOption(this, id);
						}
						return false;
					});

					$(_layoutElement).on('click', '.configure-content-fragment', function (e) {
						var id = $(this).data('contentfragmentid');
						if (id) {
							setTimeout(function () {
								_configureContentFragment(id);
							}, 100);
						}
						return false;
					});
					$(_layoutElement).on('dblclick', '.content-fragment-management', function (e) {
						var id = $(this).attr('id');
						var t = _getContentFragmentType($(this).data('contentFragment').type);
						if (t.configurable && id) {
							setTimeout(function () {
								_configureContentFragment(id);
							}, 100);
						}
						return false;
					});
					$(_layoutElement).on('click', '.lock-content-fragment, .unlock-content-fragment', function (e) {
						var id = $(this).data('contentfragmentid');
						if (id) {
							_toggleContentFragmentLock(this, id);
						}
						return false;
					});

					$(_layoutElement).on('click', '.edit-tab', function (e) {
						var id = $(this).data('tabid');
						if (id) {
							_editTab(id);
						}
						return false;
					});

					$(_layoutElement).on('click', '.delete-tab', function (e) {
						var id = $(this).data('tabid');
						if (id) {
							_deleteTab(id);
						}
						return false;
					});

					$(_layoutElement).on('click', '.tab > a', function (e) {
						var id = $(this).parent('.tab').attr('id');
						if (id == 'new-tab') {
							_createTab();
						}
						return false;
					});

					d.resolve();
				});
		}).promise();
	}

	function _renderEditor(isActive) {
		return $.Deferred(function (d) {
			if (isActive) {
				if (_currentEditor.contentFragmentListContainer) {
					_currentEditor.contentFragmentListContainer.empty();
					for (var i = 0; i < _contentFragmentTypes.length; i++) {
						_currentEditor.contentFragmentListContainer.append(
							$('<div></div>')
								.attr({
									'class': 'content-fragment-type',
									'title': _contentFragmentTypes[i].description,
									'data-type': _contentFragmentTypes[i].type,
									'data-text': (_contentFragmentTypes[i].name + ' ' + _contentFragmentTypes[i].description).toLowerCase()
								})
								.append($('<span class="name"></span>').html(_contentFragmentTypes[i].name))
								.append($('<span class="description"></span>').html(_contentFragmentTypes[i].description))
						);
					}

					if (_isCustomizing) {
						_disableCustomizationInLayout(true);
					}
					_enableCustomizationInLayout();
					_currentEditor.contentFragmentListContainer.disableSelection();
				}

				if (_currentEditor.layoutListContainer) {
					_currentEditor.layoutListContainer.empty();
					for (var i = 0; i < _layoutTypes.length; i++) {
						_currentEditor.layoutListContainer.append(
							$('<div></div>')
								.attr({
									'class': 'layout layout-' + _layoutTypes[i].id + (_layoutTypes[i].id == _currentLayoutId ? ' selected' : ''),
								})
								.append(
									$('<a href="#"></a>')
										.data('layoutid', _layoutTypes[i].id)
										.append(
											$('<img />')
												.attr('src', _layoutTypes[i].previewImageUrl)
										)
								)
						);
					}

					_currentEditor.layoutListContainer.off('click', '.layout a');
					_currentEditor.layoutListContainer.on('click', '.layout a', function () {
						var layoutId = parseInt($(this).data('layoutid'), 10);
						if (!isNaN(layoutId)) {
							_disableCustomizationInLayout();
							$(_layoutElement).fadeOut('fast', function () {
								_changeLayout(layoutId);
							});
						}
						return false;
					});

					_currentEditor.layoutListContainer.disableSelection();
				}
			}

			_enableCustomization(_contentFragments, _tabs, isActive);

			if (isActive) {
				if (_currentEditor.afterInitialization) {
					_currentEditor.afterInitialization({
						contentFragmentContainerType: _containerType
					});
				}
			}

			d.resolve();
		}).promise();
	}

	function _changeLayout (layoutId) {
		var newLayout = null;
		for (var i = 0; i < _layoutTypes.length; i++) {
			if (_layoutTypes[i].id == layoutId) {
				newLayout = _layoutTypes[i];
				break;
			}
		}

		if (!newLayout)
			return;

		var newLayoutRegions = new Array();
		for (var i = 0; i < newLayout.regions.length; i++) {
			var element = document.createElement('div');
			var layoutRegions = _layoutRegions;
			_layoutElement.appendChild(element);

			$(element).addClass('layout-region ' + newLayout.regions[i].name);
			$(element).append(_localText.layoutRegionLeaderTemplate);

			var innerElement = document.createElement('div');
			element.appendChild(innerElement);
			$(innerElement).addClass('layout-region-inner ' + newLayout.regions[i].name);

			newLayoutRegions[newLayoutRegions.length] = { 'element': innerElement, 'name': newLayout.regions[i].name };

			for (var j = 0; j < newLayout.regions[i].copyFrom.length; j++) {
				for (var k = 0; k < layoutRegions.length; k++) {
					$('.content-fragment-management', layoutRegions[k].element).each(function () {
						var cfData = $(this).data('contentFragment');
						if ((cfData && cfData.originalRegion && cfData.originalRegion == newLayout.regions[i].copyFrom[j]) || ((!cfData || !cfData.originalRegion) && layoutRegions[k].name == newLayout.regions[i].copyFrom[j])) {
							if (cfData) {
								cfData.region = newLayout.regions[i].name;
							}
							$(innerElement).append($(this));
						}
					});
				}
			}

			$(element).append(_localText.layoutRegionTrailerTemplate);
		}

		var oldRegionElements = new Array();
		for (var i = 0; i < _layoutRegions.length; i++) {
			oldRegionElements[i] = _layoutRegions[i].element;
		}

		$(oldRegionElements).parents('.layout-region').remove();

		$('.layout-' + _currentLayoutId, _currentEditor.layoutListContainer).removeClass('selected');
		_currentLayoutId = layoutId;
		_currentLayoutName = newLayout.name;
		_layoutRegions = newLayoutRegions;
		$('.layout-' + _currentLayoutId, _currentEditor.layoutListContainer).addClass('selected');

		$(_layoutElement).removeClass().addClass('layout-content ' + newLayout.name).fadeIn('fast');

		_enableCustomizationInLayout();
		_saveState();

		for (var i = 0; i < _layoutRegions.length; i++) {
			var regionName = _layoutRegions[i].name;
			$('.content-fragment-management', _layoutRegions[i].element).each(function () {
				var cfData = $(this).data('contentFragment');
				if (cfData) {
					$(this).find('.content-fragment-management-content').html(_loadingText);
					_callbackFunction('render-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&config=' + encodeURIComponent(cfData.configuration) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&region=' + encodeURIComponent(regionName) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
						_configureContentFragmentCallbackCallback(result);
					}, null, null, _getAuthValue());
				}
			});
		}
	}

	function _reset(isActive) {
		return $.Deferred(function (d) {
			_isResetting = true;
			_callbackFunction('reset', '', function (result) {
				var r = _parseJSON(result);

				_disableCustomizationInLayout(true);
				$(_wrapperElement).html('').html(r.content);
				_layoutElement = document.getElementById(layoutElementId);
				_tabsElement = document.getElementById(tabsElementId);
				_stateElement = document.getElementById(stateElementId);

				_tabsElement = document.getElementById(r.tabsElementId);
				_currentLayoutId = r.currentLayoutId;
				_layoutRegions = new Array();
				_currentTabId = r.currentTabId;

				_initialState = null;
				if (_isChanged) {
					_isChanged = false;
					if (_currentEditor && _currentEditor.isChanged) {
						_currentEditor.isChanged(false);
					}
				}

				if (_currentEditor && _currentEditor.edited) {
					_currentEditor.edited();
				}

				_layoutRegions = [];
				for (var i = 0; i < r.layoutRegionElements.length; i++) {
					_layoutRegions[i] = { 'element': $('.layout-region-inner', document.getElementById(r.layoutRegionElements[i].id)).get(0), 'name': r.layoutRegionElements[i].name };
				}

				_initialized = false;
				_isCustomizing = false;

				if (!isActive && _isShowingEditShade) {
					_isShowingEditShade = false;
					_showInactiveEditOverlay();
				} else {
					_isShowingEditShade = false;
				}

				_initialize(isActive)
					.then(function () {
						_isResetting = false;
						d.resolve();
					})
					.catch(function () {
						_isResetting = false;
						d.reject();
					})
			}, function () { _isResetting = false; d.reject(); }, null, _getAuthValue());
		}).promise();
	}

	function _revert (staged, isActive) {
		return $.Deferred(function (d) {
			_callbackFunction('revert', 'stage=' + staged, function () {
				_reset(isActive)
					.then(function () {
						d.resolve();
					})
					.catch(function () {
						d.reject();
					})
			}, function () { d.reject(); }, null, _getAuthValue());
		}).promise();
	}

	function _saveState () {
		var data = new Array();

		if (_tabsElement) {
			var orderNumber = 0;
			$(_tabsElement).children().each(function () {
				var tabData = $(this).data('tab');
				if (tabData) {
					data[data.length] = '&tab=' + encodeURIComponent('id=' + encodeURIComponent(tabData.id) + '&name=' + encodeURIComponent(tabData.name) + '&rawName=' + encodeURIComponent(tabData.rawName) + '&url=' + encodeURIComponent(tabData.url) + '&locked=' + encodeURIComponent(tabData.locked) + '&contentLocked=' + encodeURIComponent(tabData.contentLocked) + '&orderNumber=' + encodeURIComponent(orderNumber) + '&sourceContentFragmentTabId=' + encodeURIComponent(tabData.sourceContentFragmentTabId));
					orderNumber++;
				}
			});
		}

		data[data.length] = '&layoutId=' + encodeURIComponent(_currentLayoutId);

		for (var i = 0; i < _layoutRegions.length; i++) {
			var regionName = _layoutRegions[i].name;
			var orderNumber = 0;

			$('.content-fragment-management', _layoutRegions[i].element).each(function () {
				var cfData = $(this).data('contentFragment');
				if (cfData) {
					data[data.length] = '&fragment=' + encodeURIComponent('region=' + encodeURIComponent(regionName) + '&id=' + encodeURIComponent(cfData.id) + '&type=' + encodeURIComponent(cfData.type) + '&configuration=' + encodeURIComponent(cfData.configuration) + '&locked=' + encodeURIComponent(cfData.locked) + '&orderNumber=' + encodeURIComponent(orderNumber) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&sourceConfiguredContentFragmentId=' + encodeURIComponent(cfData.sourceConfiguredContentFragmentId) + '&contextId=' + encodeURIComponent(cfData.contextId));
					orderNumber++;
				}
			});
		}

		var state = data.join('');
		if (_initialState != null) {
			if (_initialState != state) {
				if (!_isChanged) {
					_isChanged = true;
					_ignoreNavigationConfirmation = false;
					if (_currentEditor && _currentEditor.isChanged) {
						_currentEditor.isChanged(_isChanged);
					}
				}
			} else {
				if (_isChanged) {
					_isChanged = false;
					if (_currentEditor && _currentEditor.isChanged) {
						_currentEditor.isChanged(_isChanged);
					}
				}
			}
		} else {
			_initialState = state;
		}

		_stateElement.value = state;

		if (_currentEditor && _currentEditor.edited) {
			_currentEditor.edited();
		}
	}

	function _saveCustomization (staged, isActive) {
		_saveState();

		return $.Deferred(function (d) {
			_callbackFunction('save', 'stage=' + staged, function (response) {
				var r = _parseJSON(response);
				if (r.success) {
					_reset(isActive)
						.then(function () {
							d.resolve({
								hasRelatedStagedItems: r.hasRelatedStagedItems === true
							});
						})
						.catch(function () {
							d.reject({});
						});
				} else {
					d.reject({
						hasStagedItems: r.hasStagedItems === true
					});
				}
			}, function () { d.reject(); }, null, _getAuthValue());
		}).promise();
	}

	function _enableCustomization(contentFragments, tabs, isActive) {
		$(document).trigger(EDIT_EVENT);

		if (isActive) {
			$.telligent.evolution.messaging.publish(EDIT_MESSAGE, {
				contentFragmentContainerType: _containerType
			})
		}

		if (_isCustomizing)
			return;

		_isCustomizing = true;

		$.telligent.evolution.messaging.subscribe('context.shell.closed', function (data) {
			if (!data._epHandled) {
				data.redirected = true;
				if (_isChanged) {
					data._epHandled = true;
					if (window.confirm(_localText.panelClosedConfirmation)) {
						_ignoreNavigationConfirmation = true;
						window.location = _editorUrl + '&_epc=' + _containerType + '&_epv=save';
					} else {
						_ignoreNavigationConfirmation = true;
						window.location = _localText.returnUrl;
					}
				} else {
					window.setTimeout(function () {
						if (!data._epHandled) {
							data._epHandled = true;
							window.location = _localText.returnUrl;
						}
					}, 499);
				}
			} else {
				_ignoreNavigationConfirmation = true;
			}
		}, { excludeAutoNameSpaces: true });

		$(window).on('beforeunload', function () {
			if (_isChanged && !_ignoreNavigationConfirmation) {
				return _localText.navigationConfirmation;
			}
		})

		if (_isAdministrator && _tabsElement) {
			for (var i = 0; i < tabs.length; i++) {
				if (tabs[i].id == _currentTabId) {
					if (tabs[i].locked)
						_enableContentFragmentLocking = !tabs[i].contentLocked;
					else
						_enableContentFragmentLocking = false;

					break;
				}
			}
		}

		$(_wrapperElement).addClass('active');
		$('.page-tabs-header', _wrapperElement).addClass('active');
		$('.page-tabs', _wrapperElement).addClass('active');
		$('.page-tabs-footer', _wrapperElement).addClass('active');
		$('.layout', _wrapperElement).addClass('active');

		for (var i = 0; i < contentFragments.length; i++) {
			var jContentFragment = $('#' + contentFragments[i].id);
			if (jContentFragment) {
				jContentFragment.data('contentFragment', contentFragments[i]);
				var cfType = _getContentFragmentType(contentFragments[i].type);

				if (contentFragments[i].locked && (!_userCanLock || contentFragments[i].isMergedFromParent)) {
					jContentFragment
						.wrap([
							'<div class="content-fragment-management locked content-fragment-management__locked">',
							'<div class="content-fragment-management-content">',
								'</div>',
							'</div>'].join(''))
						.removeAttr('id')
						.parent().parent().prepend(_getContentFragmentManagementHeaderHtml(contentFragments[i].id, cfType.name, cfType.configurable, true, contentFragments[i].isMergedFromParent, contentFragments[i].note))
						.attr('id', contentFragments[i].id).data('contentFragment', contentFragments[i]);
				}
				else {
					jContentFragment
						.wrap([
							'<div class="content-fragment-management">',
								'<div class="content-fragment-management-content">',
								'</div>',
							'</div>'].join(''))
						.removeAttr('id')
						.parent().parent().prepend(_getContentFragmentManagementHeaderHtml(contentFragments[i].id, cfType.name, cfType.configurable, contentFragments[i].locked, contentFragments[i].isMergedFromParent, contentFragments[i].note))
						.attr('id', contentFragments[i].id).data('contentFragment', contentFragments[i]);
				}
			}
		}

		for (var i = 0; i < _layoutRegions.length; i++) {
			var regionName = _layoutRegions[i].name;
			$('.content-fragment-management', _layoutRegions[i].element).each(function () {
				var cfData = $(this).data('contentFragment');
				if (cfData) {
					cfData.region = regionName;
					cfData.originalRegion = regionName;
				}
			});
		}

		$('.content-fragment-management .content-fragment-management-content', _layoutElement).append('<div class="content-fragment-management-shade"></div>');

		if (isActive) {
			// enable customization
			_enableCustomizationInLayout();
		}

		// enable toolbar reordering
		if (_tabsElement)
			_enableCustomizationInTabs(tabs);
	}

	function _enableCustomizationInTabs (tabs) {
		var editableTabs = $(_tabsElement);

		$('.page-tabs-header', _wrapperElement).addClass('active active__page-tabs-header');
		$('.page-tabs', _wrapperElement).addClass('active active__page-tabs');
		$('.page-tabs-footer', _wrapperElement).addClass('active active__page-tabs-footer');

		var html = new Array();
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].id == _currentTabId && tabs[i].locked && !_isAdministrator)
				html[html.length] = _localText.selectedTabFormat.replace('{0}', tabs[i].id).replace('{2}', tabs[i].name).replace('{3}', '');
			else if (tabs[i].locked && !_isAdministrator)
				html[html.length] = _localText.tabFormat.replace('{0}', tabs[i].id).replace('{2}', tabs[i].name).replace('{3}', '');
			else if (tabs[i].id == _currentTabId)
				html[html.length] = _localText.selectedTabFormat.replace('{0}', tabs[i].id).replace('{2}', tabs[i].name).replace('{3}', '<a href="#" data-tabid="' + tabs[i].id + '" class="internal-link edit-tab edit-tab__internal-link" title="' + _localText.editTab + '"><span></span>' + _localText.editTab + '</a>');
			else
				html[html.length] = _localText.tabFormat.replace('{0}', tabs[i].id).replace('{2}', tabs[i].name).replace('{3}', '<a href="#" data-tabid="' + tabs[i].id + '" class="internal-link edit-tab edit-tab__internal-link" title="' + _localText.editTab + '"><span></span>' + _localText.editTab + '</a><a href="#" data-tabid="' + tabs[i].id + '" class="internal-link delete-tab delete-tab__internal-link" title="' + _localText.deleteTab + '"><span></span>' + _localText.deleteTab + '</a>');
		}
		editableTabs.html(html.join(''));
		editableTabs.css('cursor', 'e-resize');
		editableTabs.find('a:not(.internal-link.delete-tab, .internal-link.edit-tab)').css('cursor', 'e-resize').each(function () { $(this).on('click', function () { return false; }); });
		editableTabs.append(_localText.tabFormat.replace('{0}', 'new-tab').replace('{2}', _localText.newTab).replace('{3}', ''));

		for (var i = 0; i < tabs.length; i++) {
			$('#' + tabs[i].id, editableTabs).data('tab', tabs[i]);
		}

		$(_tabsElement).sortable(
			{
				revert: true,
				cancel: '#new-tab',
				placeholder: 'tab placeholder placeholder__tab',
				opacity: .6,
				scrollSpeed: 10,
				update: function (event, ui) {
					_tabs_sortable_update(event, ui, this);
				}
			});

		$(_tabsElement).disableSelection();
	}

	function _enableCustomizationInLayout () {
		var regionElements = new Array();
		for (var i = 0; i < _layoutRegions.length; i++) {
			regionElements[i] = _layoutRegions[i].element;
		}

		$(regionElements).find(".content-fragment-management.locked .content-fragment-management-content").fadeTo(0, .6).stop(true, true);

		var sortableRegions = $(regionElements).sortable(
			{
				items: '.content-fragment-management',
				revert: true,
				connectWith: regionElements,
				placeholder: 'content-fragment-management placeholder',
				opacity: .6,
				tolerance: 'pointer',
				cursorAt: { left: 5, top: 38 },
				scrollSensitivity: 40,
				forceHelperSize: false,
				helper: function (e, el) {
					var data = _getContentFragmentType($(el).data('contentFragment').type);
					return $('<div class="content-fragment-type"></div>').append(
						$('<span class="name"></span>')
							.html(data.name)
						);
				},
				start: function (e, ui) {
					sortableRegions.sortable('refreshPositions');
					$('.layout', _wrapperElement).addClass('dragging');
					var label = null;
					if (ui.item.data('contentFragment')) {
						label = _getContentFragmentType(ui.item.data('contentFragment').type).name;
					} else {
						label = ui.item.find('.name').html();
					}
					ui.placeholder.html(label);
				},
				stop: function (event, ui) {
					_fragments_sortable_stop(event, ui, this);
				},
				deactivate: function() {
					$('.layout', _wrapperElement).removeClass('dragging');
				}
			});

		$(".content-fragment-type", _currentEditor.contentFragmentListContainer).draggable(
		   {
			   connectToSortable: regionElements,
			   helper: 'clone',
			   appendTo: _layoutElement,
			   revert: 'invalid',
			   opacity: .6,
			   scrollSensitivity: 40,
			   start: function () {
				   $.telligent.evolution.administration.hide();
				   $('.layout', _wrapperElement).addClass('dragging');
			   },
			   deactivate: function () {
				   $('.layout', _wrapperElement).removeClass('dragging');
			   }
		   });

		$(_layoutElement).disableSelection();
	}

	function _disableCustomizationInLayout (ignoreContentFragmentList) {
		var regionElements = new Array();
		for (var i = 0; i < _layoutRegions.length; i++) {
			regionElements[i] = _layoutRegions[i].element;
		}

		if (_initialized) {
			if (!ignoreContentFragmentList) {
				$(".content-fragment-type", _currentEditor.contentFragmentListContainer).draggable('destroy');
			}

			$(regionElements).find(".content-fragment-management.locked").fadeTo(0, 1).stop(true, true);

			$(_layoutElement).enableSelection();
		}
	}

	function _createTab() {
		$.glowModal(_editTabUrl + 'name=&isAdmin=' + _isAdministrator, {
			width: 500,
			height: 200,
			onClose: function (config) {
				_createTabCallback(config);
			}
		});
	}

	function _createTabCallback (response) {
		if (!response)
			return;

		var id = 'tab-n' + (new Date()).getTime();
		$('#new-tab', _tabsElement).before(_localText.tabFormat.replace('{0}', id).replace('{1}', '').replace('{2}', response.name).replace('{3}', '<a href="#" data-tabid="' + tabs[i].id + '" class="internal-link edit-tab edit-tab__internal-link" title="' + _localText.editTab + '"><span></span>' + _localText.editTab + '</a><a href="#" data-tabid="' + tabs[i].id + '" class="internal-link delete-tab delete-tab__internal-link" title="' + _localText.deleteTab + '"><span></span>' + _localText.deleteTab + '</a>'));
		$('#' + id, _tabsElement).data('tab', { 'id': id, 'name': response.name, 'rawName': response.rawName, 'url': response.url, 'locked': response.locked, 'contentLocked': response.contentLocked, 'sourceContentFragmentTabId': -1 }).find('a:not(.internal-link.delete-tab, .internal-link.edit-tab)').css('cursor', 'e-resize').each(function () { $(this).on('click', function () { return false; }); });

		_saveState();
	}

	function _editTab (id) {
		var tab = $('#' + id, _tabsElement).data('tab');
		if (!tab)
			return;

		$.glowModal(_editTabUrl + 'name=' + encodeURIComponent(tab.name).replace("'", '%27') + '&rawName=' + encodeURIComponent(tab.rawName).replace("'", '%27') + '&url=' + encodeURIComponent(tab.url) + '&locked=' + encodeURIComponent(tab.locked) + '&contentLocked=' + encodeURIComponent(tab.contentLocked) + '&isAdmin=' + _isAdministrator, {
			width: 500,
			height: 200,
			onClose: function (config) {
				_editTabCallback(id, config);
			}
		});
	}

	function _editTabCallback (id, response) {
		if (!response)
			return;

		if (id == _currentTabId)
			$('#' + id).replaceWith(_localText.selectedTabFormat.replace('{0}', id).replace('{1}', '').replace('{2}', response.name).replace('{3}', '<a href="#" data-tabid="' + tabs[i].id + '" class="internal-link edit-tab edit-tab__internal-link" title="' + _localText.editTab + '"><span></span>' + _localText.editTab + '</a>'));
		else
			$('#' + id).replaceWith(_localText.tabFormat.replace('{0}', id).replace('{1}', '').replace('{2}', response.name).replace('{3}', '<a href="#" data-tabid="' + tabs[i].id + '" class="internal-link edit-tab edit-tab__internal-link" title="' + _localText.editTab + '"><span></span>' + _localText.editTab + '</a><a href="#" data-tabid="' + tabs[i].id + '" class="internal-link delete-tab delete-tab__internal-link" title="' + _localText.deleteTab + '"><span></span>' + _localText.deleteTab + '</a>'));

		$('#' + id, _tabsElement).data('tab', { 'id': id, 'name': response.name, 'rawName': response.rawName, 'url': response.url, 'locked': response.locked, 'contentLocked': response.contentLocked, 'sourceContentFragmentTabId': -1 }).find('a:not(.internal-link.delete-tab, .internal-link.edit-tab)').css('cursor', 'e-resize').each(function () { $(this).on('click', function () { return false; }); });

		if (id == _currentTabId && _isAdministrator) {
			_enableContentFragmentLocking = response.locked && !response.contentLocked;

			var isAdministrator = _isAdministrator;
			$('.content-fragment-management', _layoutElement).each(function () {
				var cfData = $(this).data('contentFragment');
				if (cfData) {
					var cfType = _getContentFragmentType(cfData.type);
					if (cfData.locked && !isAdministrator)
						$('.content-fragment-management-header', this).replaceWith(_getContentFragmentManagementHeaderHtml(cfData.id, cfType.name, cfType.configurable, true, cfData.isMergedFromParent, cfData.note));
					else
						$('.content-fragment-management-header', this).replaceWith(_getContentFragmentManagementHeaderHtml(cfData.id, cfType.name, cfType.configurable, cfData.locked, cfData.isMergedFromParent, cfData.note));
				}
			});
		}

		_saveState();
	}

	function _deleteTab (id) {
		if ($(_tabsElement).children().length <= 2)
			alert(_localText.cannotDeleteLastTab);
		else if (window.confirm(_localText.deleteTabConfirmation)) {
			$('#' + id, _tabsElement).fadeOut('fast', function () { $(this).remove(); });
			_saveState();
		}
	}

	function _tabs_sortable_update (event, ui, element) {
		if ($('#' + _tabsElement.id + ' > div').last().attr('id') != 'new-tab') {
			// tab was moved to the last index, move it back.
			$('#new-tab', _tabsElement).before(ui.item);
		}
	}

	function _fragments_sortable_stop (event, ui, element) {
		if ($(ui.item).hasClass('content-fragment-type')) {
			var id = _fragmentPrefix + '-n' + (new Date()).getTime();
			var type = $(ui.item).data('type');

			var cfType = _getContentFragmentType(type);
			$(ui.item).removeClass('content-fragment-type').addClass('content-fragment-management').attr('id', id).attr('title', '').data('contentFragment', { 'id': id, 'contextId': '', 'type': type, 'configuration': '', 'locked': false, 'showHeader': cfType.showHeader, 'cssClassAddition': _getDefaultContentFragmentWrappingFormat(cfType.showHeader).cssClassName, 'sourceConfiguredContentFragmentId': -1, 'isMergedFromParent': false });
			$(ui.item).removeAttr('style');
			$(ui.item).html([
				_getContentFragmentManagementHeaderHtml(id, cfType.name, cfType.configurable, false, false, null),
				'<div class="content-fragment-management-content">',
				_loadingText,
				'</div>'].join(''));

			var region = '';
			for (var i = 0; i < _layoutRegions.length; i++) {
				var cfData = $('#' + id, _layoutRegions[i].element).data('contentFragment');
				if (cfData)
					region = cfData.region = cfData.originalRegion = _layoutRegions[i].name;
			}

			_saveState();
			_callbackFunction('render-content-fragment', 'type=' + encodeURIComponent(type) + '&id=' + encodeURIComponent(id) + '&showHeader=' + encodeURIComponent(cfType.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(_getDefaultContentFragmentWrappingFormat(cfType.showHeader).cssClassName) + '&region=' + encodeURIComponent(region) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
				_fragments_sortable_stopCallback(result);
			}, null, null, _getAuthValue());
		}
		else {
			var id = $(ui.item).attr('id');
			var cfData = null;
			for (var i = 0; i < _layoutRegions.length; i++) {
				cfData = $('#' + id, _layoutRegions[i].element).data('contentFragment');
				if (cfData) {
					cfData.region = cfData.originalRegion = _layoutRegions[i].name;
					break;
				}
			}

			_saveState();

			if (cfData) {
				if (cfData) {
					$(this).find('.content-fragment-management-content').html(_loadingText);
					_callbackFunction('render-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&config=' + encodeURIComponent(cfData.configuration) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&region=' + encodeURIComponent(cfData.region) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
						_configureContentFragmentCallbackCallback(result);
					}, null, null, _getAuthValue());
				}
			}
		}
	}

	function _fragments_sortable_stopCallback (result) {
		var r = _parseJSON(result);

		var jContentFragment = $('#' + r.id);
		if (!jContentFragment)
			return;

		var cfType = _getContentFragmentType(jContentFragment.data('contentFragment').type);

		jContentFragment.html([_getContentFragmentManagementHeaderHtml(r.id, cfType.name, cfType.configurable, false, false, null),
			'<div class="content-fragment-management-content">',
				r.html,
				'<div class="content-fragment-management-shade"></div>',
			'</div>'].join(''));

		if (cfType.configurable && r.configuration) {
			jContentFragment.data('contentFragment').configuration = r.configuration;
		}
	}

	function _configureContentFragment (id) {
		var cfData = $('#' + id).data('contentFragment');
		if (!cfData)
			return;

		_callbackFunction('configure-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&ContentFragmentId=' + encodeURIComponent(cfData.id) + '&configuration=' + encodeURIComponent(cfData.configuration), function (result) {
			var cfType = _getContentFragmentType(cfData.type);
			$.glowModal({
				html: result,
				title: cfType.name,
				width: 690,
				height: 200,
				onClose: function (config) {
					_configureContentFragmentCallback(id, config);
				}
			});
		}, null, null, _getAuthValue());
	}

	function _configureContentFragmentCallback (id, config) {
		if (config == null)
			return;

		var cfData = $('#' + id).data('contentFragment');
		if (!cfData)
			return;

		$('#' + id).find('.content-fragment-management-content').html(_loadingText);

		_callbackFunction('commit-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&configuration=' + encodeURIComponent(config) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&region=' + encodeURIComponent(cfData.region) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
			result = _parseJSON(result);

			cfData.configuration = result.configuration;

			_saveState();

			_callbackFunction('render-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&config=' + encodeURIComponent(cfData.configuration) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&region=' + encodeURIComponent(cfData.region) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
				_configureContentFragmentCallbackCallback(result);
			}, null, null, _getAuthValue());
		}, null, null, _getAuthValue());
	}

	function _removeReflowOptions(className) {
		for (var i = 0; i < _reflowOptions.length; i++) {
			if (className == _reflowOptions[i].cssClassName) {
				return '';
			} else if (className.indexOf(' ' + _reflowOptions[i].cssClassName) == className.length - _reflowOptions[i].cssClassName.length - 1) {
				return className.substr(0, className.indexOf(' ' + _reflowOptions[i].cssClassName));
			}
		}
		return className;
	}

	function _selectContentFragmentWrappingFormat (element, id) {
		if (_contentFragmentWrappingFormatsOpeningElement == element && _contentFragmentWrappingFormatsMenu.glowPopUpMenu('isOpen')) {
			_contentFragmentWrappingFormatsMenu.glowPopUpMenu('close');
			_contentFragmentWrappingFormatsOpeningElement = null;
			return;
		}

		var cfData = $('#' + id).data('contentFragment');
		if (!cfData)
			return;

		_contentFragmentWrappingFormatsMenu.glowPopUpMenu('clear');
		for (var i = 0; i < _contentFragmentWrappingFormats.length; i++) {
			(function (format) {
				var item = _contentFragmentWrappingFormatsMenu.glowPopUpMenu('createMenuItem', {
					id: i,
					text: ((cfData.cssClassAddition == format.cssClassName || _removeReflowOptions(cfData.cssClassAddition) == format.cssClassName) && cfData.showHeader == format.includeHeader) ? '<span class=\'active\'>' + format.name + '</span>' : format.name,
					onClick: function () {
						_selectContentFragmentWrappingFormatCallback(id, format.cssClassName, format.includeHeader);
					}
				});
				_contentFragmentWrappingFormatsMenu.glowPopUpMenu('add', item);
			})(_contentFragmentWrappingFormats[i]);
		}

		_contentFragmentWrappingFormatsMenu.glowPopUpMenu('refresh');
		_contentFragmentWrappingFormatsMenu.glowPopUpMenu('open', element);
		_contentFragmentWrappingFormatsOpeningElement = element;
		$(element).addClass('active').closest('.content-fragment-management').addClass('active');
	}

	function _selectContentFragmentWrappingFormatCallback (id, cssClassName, includeHeader) {
		var cfData = $('#' + id).data('contentFragment');
		if (!cfData)
			return;

		cfData.showHeader = includeHeader;

		var rfn = '';
		var classes = cfData.cssClassAddition.split(/ /);
		for (var i = 0; i < _reflowOptions.length; i++) {
			for (var j = 0; j < classes.length; j++) {
				if (classes[j] == _reflowOptions[i].cssClassName) {
					rfn = ' ' + _reflowOptions[i].cssClassName;
				}
			}
		}

		cfData.cssClassAddition = $.trim(cssClassName + rfn);
		$('#' + id).find('.content-fragment-management-content').html(_loadingText);

		_saveState();

		_callbackFunction('render-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&config=' + encodeURIComponent(cfData.configuration) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&region=' + encodeURIComponent(cfData.region) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
			_configureContentFragmentCallbackCallback(result);
		}, null, null, _getAuthValue());
	}

	function _selectContentFragmentReflowOption(element, id) {
		if (_contentFragmentWrappingFormatsOpeningElement == element && _contentFragmentWrappingFormatsMenu.glowPopUpMenu('isOpen')) {
			_contentFragmentWrappingFormatsMenu.glowPopUpMenu('close');
			_contentFragmentWrappingFormatsOpeningElement = null;
			return;
		}

		var cfData = $('#' + id).data('contentFragment');
		if (!cfData)
			return;

		_contentFragmentWrappingFormatsMenu.glowPopUpMenu('clear');
		for (var i = 0; i < _reflowOptions.length; i++) {
			(function (format) {
				var item = _contentFragmentWrappingFormatsMenu.glowPopUpMenu('createMenuItem', {
					id: i,
					text: (cfData.cssClassAddition.indexOf(format.cssClassName) >= 0) ? '<span class=\'active\'>' + format.name + '</span>' : format.name,
					onClick: function () {
						_selectContentFragmentReflowOptionCallback(id, format.cssClassName);
					}
				});
				_contentFragmentWrappingFormatsMenu.glowPopUpMenu('add', item);
			})(_reflowOptions[i]);
		}

		_contentFragmentWrappingFormatsMenu.glowPopUpMenu('refresh');
		_contentFragmentWrappingFormatsMenu.glowPopUpMenu('open', element);
		_contentFragmentWrappingFormatsOpeningElement = element;
		$(element).addClass('active').closest('.content-fragment-management').addClass('active');
	}

	function _selectContentFragmentReflowOptionCallback(id, cssClassName) {
		var cfData = $('#' + id).data('contentFragment');
		if (!cfData)
			return;

		var cn = _removeReflowOptions(cfData.cssClassAddition);
		cfData.cssClassAddition = $.trim(cn + ' ' + cssClassName);
		$('#' + id).find('.content-fragment-management-content').html(_loadingText);

		_saveState();

		_callbackFunction('render-content-fragment', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&config=' + encodeURIComponent(cfData.configuration) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&region=' + encodeURIComponent(cfData.region) + '&layout=' + encodeURIComponent(_currentLayoutName), function (result) {
			_configureContentFragmentCallbackCallback(result);
		}, null, null, _getAuthValue());
	}

	function _configureContentFragmentCallbackCallback (result) {
		var r = _parseJSON(result);
		var cf = $('#' + r.id);
		cf.find('.content-fragment-management-content').html(r.html + '<div class="content-fragment-management-shade"></div>');
		if (r.configuration) {
			var cfData = cf.data('contentFragment');
			if (cfData) {
				cfData.configuration = r.configuration;
			}
		}
	}

	function _deleteContentFragment (id) {
		if (window.confirm(_localText.deleteContentFragmentConfirmation)) {
			$('#' + id).slideUp('fast', function () {
				$(this).remove();
				_saveState();
			});
		}
	}

	function _toggleContentFragmentLock (element, id) {
		var cfData = $('#' + id).data('contentFragment');
		if (!cfData)
			return;

		if (cfData.locked) {
			cfData.locked = false;
			$(element)
				.removeClass('unlock-content-fragment')
				.addClass('lock-content-fragment')
				.attr('data-tip', _localText.lockContentFragment)
				.text(_localText.lockContentFragment);
		}
		else {
			cfData.locked = true;
			$(element)
				.removeClass('lock-content-fragment')
				.addClass('unlock-content-fragment')
				.attr('data-tip', _localText.unlockContentFragment)
				.text(_localText.unlockContentFragment);
		}

		_saveState();
	}

	/* utilities */

	function _parseJSON (resultText) {
		eval('var r = ' + resultText + ';');
		return r;
	}

	function _indexContentFragmentTypes (cfTypes) {
		_contentFragmentTypes = cfTypes;
		_contentFragmentTypesIndex = {};

		for (var i = 0; i < _contentFragmentTypes.length; i++) {
			_contentFragmentTypesIndex[_makeContentFragmentTypeKey(_contentFragmentTypes[i].type)] = _contentFragmentTypes[i];
		}
	}

	function _getContentFragmentType (cfType) {
		var cft = _contentFragmentTypesIndex[_makeContentFragmentTypeKey(cfType)];
		if (!cft)
			cft = { 'type': '', 'name': _localText.unknownContentFragmentType, 'configurable': false };

		return cft;
	}

	function _makeContentFragmentTypeKey (cfType) {
		return cfType.replace(/[\. \:]/g, '_');
	}

	function _getDefaultContentFragmentWrappingFormat (showHeader) {
		if (showHeader) {
			return { 'showHeader': showHeader, 'name': 'Unknown', 'cssClassName': _defaultWrappingFormatWithHeader };
		} else {
			return { 'showHeader': showHeader, 'name': 'Unknown', 'cssClassName': _defaultWrappingFormatWithoutHeader };
		}
	}

	function _combineClassNames (classNames) {
		classNames.sort();
		return classNames.join('__');
	}

	function _getContentFragmentManagementHeaderHtml (id, name, isConfigurable, isLocked, isMergedFromParent, note) {
		var header = new Array();
		header[header.length] = '<div class="content-fragment-management-header';
		if (note && note.length > 0) {
			header[header.length] = ' ui-tip" title="';
			header[header.length] = note;
		}
		header[header.length] = '"><div class="content- fragment - management - header - inner">';

		if ((!isLocked || _userCanLock) && !isMergedFromParent)
			header[header.length] = '<a href="#" data-contentfragmentid="' + id + '" class="internal-link delete-content-fragment ui-tip" data-tip="' + _localText.deleteContentFragment + '">' + _localText.deleteContentFragment + '</a>';

		header[header.length] = '<a href="#" data-contentfragmentid="' + id + '" class="menu-button content-fragment-wrapper-format-button ui-tip" data-tip="' + _localText.setContentFragmentWrapperFormat + '">' + _localText.setContentFragmentWrapperFormat + '</a>';

		if (_reflowOptions && _reflowOptions.length > 0) {
			header[header.length] = '<a href="#" data-contentfragmentid="' + id + '" class="menu-button content-fragment-reflow-options-button ui-tip" data-tip="' + _localText.reflowOptions + '">' + _localText.reflowOptions + '</a>';
		}

		if (((!isLocked || _userCanLock) && !isMergedFromParent) && isConfigurable)
			header[header.length] = '<a href="#" data-contentfragmentid="' + id + '" class="internal-link configure-content-fragment ui-tip" data-tip="' + _localText.configureContentFragment + '">' + _localText.configureContentFragment + '</a>';

		if (_userCanLock && !isMergedFromParent && _enableContentFragmentLocking) {
			if (isLocked)
				header[header.length] = '<a href="#" data-contentfragmentid="' + id + '" class="internal-link unlock-content-fragment ui-tip" data-tip="' + _localText.unlockContentFragment + '">' + _localText.unlockContentFragment + '</a>';
			else
				header[header.length] = '<a href="#" data-contentfragmentid="' + id + '" class="internal-link lock-content-fragment ui-tip" data-tip="' + _localText.lockContentFragment + '">' + _localText.lockContentFragment + '</a>';
		}

		header[header.length] = '<div class="content-fragment-management-fragment-name">' + name + '</div>';
		header[header.length] = '</div></div>';

		return header.join('');
	}

	return {
		isEditable: function() {
			return true;
		},
		registerEditor: function(options) {
			var o = $.extend({}, {
				contentFragmentListContainer: null,
				layoutListContainer: null,
				afterInitialization: function (options) { },
				isChanged: function (changed) { },
				edited: function() {}
			}, options);

			_currentEditor = o;
			if (!_initialized) {
				return _reset(false);
			} else {
				return _renderEditor(false);
			}
		},
		edit: function () {
			return $.Deferred(function (d) {
				var execEdit = function () {
					if (_isResetting) {
						window.setTimeout(function () {
							execEdit();
						}, 100);
					} else {
						if (!_initialized) {
							_reset(true)
								.then(function () { d.resolve(); })
								.catch(function () { d.reject(); });
						} else {
							_renderEditor(true)
								.then(function () { d.resolve(); })
								.catch(function () { d.reject(); });
						}
					}
				}
				execEdit();
			}).promise();
		},
		save: function (staged, isActive) {
			return _saveCustomization(staged, isActive);
		},
		revert: function (staged, isActive) {
			return _revert(staged, isActive);
		},
		reset: function(isActive) {
			return _reset(isActive);
		},
		info: function () {
			return {
				themeTypeId: _themeTypeId,
				themeApplicationId: _themeApplicationId,
				themeApplicationName: _applicationName,
				themeName: _themeName,
				themeTypeName: _themeTypeName,
				contentFragmentContainerType: _containerType,
				supportsDefault: _supportsDefault,
				isAdministrator: _isAdministrator,
				isDefault: _isDefault,
				isFactoryDefault: _isFactoryDefault,
				hasDefault: _hasDefault,
				hasFactoryDefault: _hasFactoryDefault,
				isStaged: _isStaged
			};
		},
		isEditing: function () {
			return _isCustomizing;
		},
		isChanged: function () {
			return _isChanged;
		},
		customCallback: function (id, callbackControlId, callbackParameter, callbackContext, successFunction, errorFunction) {
			var cfData = $('#' + id).data('contentFragment');
			if (!cfData)
				_callbackFunction('custom', 'id=' + encodeURIComponent(id) + '&renderFromCurrent=True&callback_control_id=' + encodeURIComponent(callbackControlId) + '&callback_argument=' + encodeURIComponent(callbackParameter), successFunction, errorFunction, callbackContext, _getAuthValue());
			else
				_callbackFunction('custom', 'type=' + encodeURIComponent(cfData.type) + '&id=' + encodeURIComponent(cfData.id) + '&config=' + encodeURIComponent(cfData.configuration) + '&showHeader=' + encodeURIComponent(cfData.showHeader ? 'True' : 'False') + '&cssClassAddition=' + encodeURIComponent(cfData.cssClassAddition) + '&callback_control_id=' + encodeURIComponent(callbackControlId) + '&callback_argument=' + encodeURIComponent(callbackParameter), successFunction, errorFunction, callbackContext, _getAuthValue());
		}
	};
}
