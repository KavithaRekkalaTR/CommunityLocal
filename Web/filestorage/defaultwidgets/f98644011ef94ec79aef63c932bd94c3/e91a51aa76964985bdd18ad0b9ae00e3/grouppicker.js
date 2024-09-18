(function ($, global) {
	var GroupPicker = function(element, options, cb) {

		//default settings for options
		this.parentEl = 'body';
		this.element = $(element);
		this.includeGroups = '';
		this.includeSubGroups = '';
		this.includeApplications = '';
		this.groupLookupUrl = '';
		this.selectedGroups = [];
		this.applicationLookupUrl = '';
		this.selectedApplications = [];
		this.showIncludeSubGroups = false;
		this.showApplicationTypes = true;

		this.includeApplicationTypes = '';
		this.selectedApplicationTypes = [];
		this.applicationTypes = [];

		this.spinner = '<span class="ui-loading" width="48" height="48"></span>';
		this.glowGroupAttached = false;
		this.glowApplicationAttached = false;

		this.opens = 'right';
		if (this.element.hasClass('pull-right'))
			this.opens = 'left';

		this.drops = 'down';
		if (this.element.hasClass('dropup'))
			this.drops = 'up';

		this.locale = {
			direction: 'ltr',
			separator: ' - ',
			applyLabel: 'Apply',
			cancelLabel: 'Cancel',
			includeGroupsLabel: 'Include groups',
			excludeGroupsLabel: 'Exclude groups',
			includeSubGroupsLabel: 'Include subgroups',
			excludeSubGroupsLabel: 'Exclude subgroups',
			noGroupsFoundLabel: 'No matching groups found.',
			findLabel: 'Find a group...',
			filterInstructions: 'Include or Exclude contributions of people within specific group(s), application(s) or application type(s). Leave blank to see contributions across the entire community.',
			includeApplicationsLabel: 'Include applications',
			excludeApplicationsLabel: 'Exclude applications',
			noApplicationsFoundLabel: 'No matching applications found.',
			findApplicationLabel: 'Find an application...',
			alreadySelected: 'Already selected',
			includeApplicationTypesLabel: 'Include by Application Type',
			excludeApplicationTypesLabel: 'Exclude by Application Type',
		};

		this.callback = function() { };

		//some state information
		this.isShowing = false;

		//custom options from user
		if (typeof options !== 'object' || options === null)
			options = {};

		//allow setting options with data attributes
		//data-api options will be overwritten with custom javascript options
		options = $.extend(this.element.data(), options);

		//
		// handle all the possible options overriding defaults
		//

		if (typeof options.locale === 'object') {

			if (typeof options.locale.separator === 'string')
				this.locale.separator = options.locale.separator;

			if (typeof options.locale.applyLabel === 'string')
				this.locale.applyLabel = options.locale.applyLabel;

			if (typeof options.locale.cancelLabel === 'string')
				this.locale.cancelLabel = options.locale.cancelLabel;

			if (typeof options.locale.includeGroupsLabel === 'string')
				this.locale.includeGroupsLabel = options.locale.includeGroupsLabel;

			if (typeof options.locale.excludeGroupsLabel === 'string')
				this.locale.excludeGroupsLabel = options.locale.excludeGroupsLabel;

			if (typeof options.locale.includeSubGroupsLabel === 'string')
				this.locale.includeSubGroupsLabel = options.locale.includeSubGroupsLabel;

			if (typeof options.locale.excludeSubGroupsLabel === 'string')
				this.locale.excludeSubGroupsLabel = options.locale.excludeSubGroupsLabel;

			if (typeof options.locale.findLabel === 'string')
				this.locale.findLabel = options.locale.findLabel;

			if (typeof options.locale.includeApplicationsLabel === 'string')
				this.locale.includeApplicationsLabel = options.locale.includeApplicationsLabel;

			if (typeof options.locale.excludeApplicationsLabel === 'string')
				this.locale.excludeApplicationsLabel = options.locale.excludeApplicationsLabel;

			if (typeof options.locale.findApplicationLabel === 'string')
				this.locale.findApplicationLabel = options.locale.findApplicationLabel;

			if (typeof options.locale.filterInstructions === 'string')
				this.locale.filterInstructions = options.locale.filterInstructions;

			if (typeof options.locale.includeApplicationTypesLabel === 'string')
				this.locale.includeApplicationsLabel = options.locale.includeApplicationTypesLabel;

			if (typeof options.locale.excludeApplicationTypesLabel === 'string')
				this.locale.excludeApplicationsLabel = options.locale.excludeApplicationTypesLabel;
		}

		if (typeof options.includeGroups === 'string')
			this.includeGroups = options.includeGroups;

		this.selectedGroups = options.selectedGroups;

		if (typeof options.includeSubGroups === 'boolean')
			this.includeSubGroups = options.includeSubGroups;

		if (typeof options.includeApplications === 'string')
			this.includeApplications = options.includeApplications;

		this.selectedApplications = options.selectedApplications;

		if (typeof options.includeApplicationTypes === 'string')
			this.includeApplicationTypes = options.includeApplicationTypes;

		if (typeof options.selectedApplicationTypes !== undefined )
			this.selectedApplicationTypes = options.selectedApplicationTypes;

		this.applicationTypes = options.applicationTypes;

		if (typeof options.opens === 'string')
			this.opens = options.opens;

		if (typeof options.drops === 'string')
			this.drops = options.drops;

		if (typeof options.applicationLookupUrl === 'string')
			this.applicationLookupUrl = options.applicationLookupUrl;

		if (typeof options.groupLookupUrl === 'string')
			this.groupLookupUrl = options.groupLookupUrl;

		if (typeof options.showIncludeSubGroups === 'boolean')
			this.showIncludeSubGroups = options.showIncludeSubGroups;

		if (typeof options.showApplicationTypes === 'boolean')
			this.showApplicationTypes = options.showApplicationTypes;

		if (typeof cb === 'function') {
			this.callback = cb;
		}

		var includeSubGroupsHtml = '';
		if (this.showIncludeSubGroups == true) {
			includeSubGroupsHtml = '<div id="subGroupContainer" class="includesubgroups" style="display: none;">' +
				'<input type="checkbox" id="includeSubGroups"' + (this.includeSubGroups == true ? 'checked' : '') + ' /><label for="includeSubGroups">' + (this.includeGroups == 'exclude' ? this.locale.excludeSubGroupsLabel : this.locale.includeSubGroupsLabel) + '</label>' +
			'</div>';
		}

		var applicationTypesHtml = '';
		this.applicationTypes.forEach(element => {
			if (this.selectedApplicationTypes && this.selectedApplicationTypes.find(type => type.id == element.id)) {
				applicationTypesHtml += '<div><input type="checkbox" name="applicationTypes" id="' + element.id + '" value="' + element.id + '" data-name="' + element.name + '" checked /><label for="' + element.id + '">' + element.name + '</label></div>'
			}
			else {
				applicationTypesHtml += '<div><input type="checkbox" name="applicationTypes" id="' + element.id + '" value="' + element.id + '" data-name="' + element.name + '"/><label for="' + element.id + '">' + element.name + '</label></div>'
			}
		});

		//html template for the picker UI
		if (typeof options.template !== 'string' && !(options.template instanceof $))
			options.template = '<div class="grouppicker dropdown-menu">' +
				'<div class="instructions">' + this.locale.filterInstructions + '</div>' +
				'<fieldset>' +
					'<ul class="field-list">' +
						'<li class="field-item group">' +
							'<span class="field-item-input">' +
								'<select id="groupOption">' +
									'<option value="include" ' + (this.includeGroups == 'include' ? 'selected' : '') + '>' + this.locale.includeGroupsLabel + '</option>' +
									'<option value="exclude" ' + (this.includeGroups == 'exclude' ? 'selected' : '') + '>' +  this.locale.excludeGroupsLabel + '</option>' +
									'<option value="includeApplications" ' + (this.includeApplications == 'include' ? 'selected' : '') + '>' + this.locale.includeApplicationsLabel + '</option>' +
									'<option value="excludeApplications" ' + (this.includeApplications == 'exclude' ? 'selected' : '') + '>' +  this.locale.excludeApplicationsLabel + '</option>' +
								'</select><br />' +
								'<div id="groupContainer" style="display: none;"><input type="text" id="groupSelect" /></div>' +
								includeSubGroupsHtml +
								'<div id="applicationContainer" style="display: none;"><input type="text" id="applicationSelect" /></div>' +
							'</span>' +
						'</li>';

			if (this.showApplicationTypes) {
				options.template = options.template + '<li class="field-item types">' +
							'<span class="field-item-input">' +
								'<select id="applicationTypeOption">' +
									'<option value="include" ' + (this.includeApplicationTypes == 'include' ? 'selected' : '') + '>' + this.locale.includeApplicationTypesLabel + '</option>' +
									'<option value="exclude" ' + (this.includeApplicationTypes == 'exclude' ? 'selected' : '') + '>' +  this.locale.excludeApplicationTypesLabel + '</option>' +
								'</select><br />' +
								'<div class="applicationTypes">' + applicationTypesHtml + '</div>' +
							'</span>' +
						'</li>';
			}
			options.template = options.template + '<li class="field-item buttons">' +
							'<button class="applyBtn btn btn-sm btn-success" type="button"></button> ' +
							'<button class="cancelBtn btn btn-sm btn-default" type="button"></button>' +
						'</li>' +
					'</ul>' +
				'</fieldset>' +
			'</div>';

		this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
		this.container = $(options.template).appendTo(this.parentEl);


		this.container.addClass('opens' + this.opens);
		this.container.find('.applyBtn').html(this.locale.applyLabel);
		this.container.find('.cancelBtn').html(this.locale.cancelLabel);

		var self = this;

		this.container.find('.buttons')
			.on('click.grouppicker', 'button.applyBtn', $.proxy(this.clickApply, this))
			.on('click.grouppicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))

		this.container.on('change.grouppicker', 'select.groupOption', $.proxy(this.optionChanged, this))

		if (this.element.is('input') || this.element.is('button')) {
			this.element.on({
				'click.grouppicker': $.proxy(this.show, this),
				'focus.grouppicker': $.proxy(this.show, this)
			});
		} else {
			this.element.on('click.grouppicker', $.proxy(this.toggle, this));
		}
	};

	GroupPicker.prototype = {

		constructor: GroupPicker,

		move: function() {
			var parentOffset = { top: 0, left: 0 },
				containerTop;
			var parentRightEdge = $(window).width();
			if (!this.parentEl.is('body')) {
				parentOffset = {
					top: this.parentEl.offset().top - this.parentEl.scrollTop(),
					left: this.parentEl.offset().left - this.parentEl.scrollLeft()
				};
				parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
			}

			if (this.drops == 'up')
				containerTop = this.element.offset().top - this.container.outerHeight() - parentOffset.top;
			else
				containerTop = this.element.offset().top + this.element.outerHeight() - parentOffset.top;
			this.container[this.drops == 'up' ? 'addClass' : 'removeClass']('dropup');

			if (this.opens == 'left') {
				this.container.css({
					top: containerTop,
					right: parentRightEdge - this.element.offset().left - this.element.outerWidth(),
					left: 'auto'
				});
				if (this.container.offset().left < 0) {
					this.container.css({
						right: 'auto',
						left: 9
					});
				}
			} else if (this.opens == 'center') {
				this.container.css({
					top: containerTop,
					left: this.element.offset().left - parentOffset.left + this.element.outerWidth() / 2
							- this.container.outerWidth() / 2,
					right: 'auto'
				});
				if (this.container.offset().left < 0) {
					this.container.css({
						right: 'auto',
						left: 9
					});
				}
			} else {
				this.container.css({
					top: containerTop,
					left: this.element.offset().left - parentOffset.left,
					right: 'auto'
				});
				if (this.container.offset().left + this.container.outerWidth() > $(window).width()) {
					this.container.css({
						left: 'auto',
						right: 0
					});
				}
			}
		},

		show: function(e) {

			if (this.isShowing) return;

			this._outsideClickProxy = $.proxy(function(e) { this.outsideClick(e); }, this);
			this._changeProxy = $.proxy(function(e) { this.optionChanged(e); }, this);

			$(document)
			.on('mousedown.grouppicker', this._outsideClickProxy)
			// also support mobile devices
			.on('pointerend.grouppicker', this._outsideClickProxy)
			// also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
			.on('click.grouppicker', '[data-toggle=dropdown]', this._outsideClickProxy)
			// and also close when focus changes to outside the picker (eg. tabbing between controls)
			.on('focusin.grouppicker', this._outsideClickProxy)

			.on('change.grouppicker', this._changeProxy);


			// Reposition the picker if the window is resized while it's open
			$(window).on('resize.grouppicker', $.proxy(function(e) { this.move(e); }, this));

			this.oldincludeGroups = this.includeGroups;
			this.oldselectedGroups = this.selectedGroups;
			this.oldincludeApplications = this.includeApplications;
			this.oldselectedApplications = this.selectedApplications;
			this.oldincludeApplicationTypes = this.includeApplicationTypes;
			this.oldselectedApplicationTypes = this.selectedApplicationTypes;
			this.oldincludeSubGroups = this.includeSubGroups;

			this.container.show();

			this.attachGlow();

			this.move();
			this.element.trigger('show.grouppicker', this);
			this.isShowing = true;
		},

		attachGlow: function(e) {
			var self = this;

			var includeGroupsOrApplications = self.container.find('#groupOption').val();

			if (this.glowGroupAttached == false && (includeGroupsOrApplications == "include" || includeGroupsOrApplications == "exclude")) {
				this.container.find('#applicationContainer').hide();
				this.container.find('#groupContainer').show();

				if (this.showIncludeSubGroups)
					this.container.find('#subGroupContainer').show();

				this.includeGroupsLookupTextBox = this.container.find('#groupSelect')
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						window.clearTimeout(self.groupLookupTimeout);
						if (searchText && searchText.length >= 2) {
							tb.glowLookUpTextBox('updateSuggestions', [
								tb.glowLookUpTextBox('createLookUp', '', self.spinner, self.spinner, false)
							]);

							var selected = {};
							var count = tb.glowLookUpTextBox('count');
							for (var i = 0; i < count; i++) {
								var item = tb.glowLookUpTextBox('getByIndex', i);
								if (item) {
									selected[item.Value] = true;
								}
							}

							self.groupLookupTimeout = window.setTimeout(function () {
								$.telligent.evolution.get({
									url: self.groupLookupUrl,
									data: { w_searchText: searchText, Permission: 'Reporting_ContainerReports' },
									success: function (response) {
										if (response && response.Groups.length > 1) {
											var suggestions = [];
											for (var i = 0; i < response.Groups.length; i++) {
												var item = response.Groups[i];
												if (item && item.id) {
													var selectable = !selected[item.id];
													suggestions.push(tb.glowLookUpTextBox('createLookUp', item.id, item.preview, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + self.locale.alreadySelected + '</span></div>', selectable));
												}
											}

											tb.glowLookUpTextBox('updateSuggestions', suggestions);
										}
										else
											tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', self.locale.noGroupsFoundLabel, self.locale.noGroupsFoundLabel, false)]);
									}
								});
							}, 500);
						};
					},
					emptyHtml: self.locale.findLabel,
					selectedLookUpsHtml: []});

				if (self.selectedGroups.length > 0) {
					setTimeout(function() {
						for (var j = 0; j < self.selectedGroups.length; j++){
							var initialLookupValue = self.includeGroupsLookupTextBox.glowLookUpTextBox('createLookUp',
								self.selectedGroups[j].id,
								self.selectedGroups[j].name,
								self.selectedGroups[j].name,
								true);
							self.includeGroupsLookupTextBox.glowLookUpTextBox('add', initialLookupValue);
						};
					}, 10);
				};

				this.glowGroupAttached = true;
			}

			if (this.glowApplicationAttached == false && (includeGroupsOrApplications == "includeApplications" || includeGroupsOrApplications == "excludeApplications")) {
				this.container.find('#groupContainer').hide();

				if (this.showIncludeSubGroups)
					this.container.find('#subGroupContainer').hide();

				this.container.find('#applicationContainer').show();

				this.includeApplicationsLookupTextBox = this.container.find('#applicationSelect')
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						window.clearTimeout(self.applicationLookupTimeout);
						if (searchText && searchText.length >= 2) {
							tb.glowLookUpTextBox('updateSuggestions', [
								tb.glowLookUpTextBox('createLookUp', '', self.spinner, self.spinner, false)
							]);

							var selected = {};
							var count = tb.glowLookUpTextBox('count');
							for (var i = 0; i < count; i++) {
								var item = tb.glowLookUpTextBox('getByIndex', i);
								if (item) {
									selected[item.Value] = true;
								}
							}

							//apply filters

							var includeApplicationTypes = "";
							var selectedApplicationTypes = [];
							var selectedApplicationTypesParam = [];

							if(self.showApplicationTypes) {
								$("input:checkbox[name=applicationTypes]:checked", self.container).each(function(){
									selectedApplicationTypes.push($(this).val());
								});

								selectedApplicationTypesParam = selectedApplicationTypes.join();
								includeApplicationTypes = self.container.find('#applicationTypeOption').val();
							}
							else {
								selectedApplicationTypesParam = self.selectedApplicationTypes.map(function(elem){ return elem.id;}).join(",");
								includeApplicationTypes = self.includeApplicationTypes;
							}

							self.applicationLookupTimeout = window.setTimeout(function () {
								$.telligent.evolution.get({
									url: self.applicationLookupUrl,
									data: { w_searchText: searchText, w_selectedApplicationTypes: selectedApplicationTypesParam, w_includeApplicationTypes: includeApplicationTypes },
									success: function (response) {
										if (response && response.Applications.length > 1) {
											var suggestions = [];
											for (var i = 0; i < response.Applications.length; i++) {
												var item = response.Applications[i];
												if (item && item.id) {
													var selectable = !selected[item.id];
													suggestions.push(tb.glowLookUpTextBox('createLookUp', item.id, item.preview, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + self.locale.alreadySelected + '</span></div>', selectable));
												}
											}

											tb.glowLookUpTextBox('updateSuggestions', suggestions);
										}
										else {
											tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', self.locale.noApplicationsFoundLabel, self.locale.noApplicationsFoundLabel, false)]);
										}
									}
								});
							}, 1000);
						};
					},
					emptyHtml: self.locale.findApplicationLabel,
					selectedLookUpsHtml: []});

				if (self.selectedApplications.length > 0) {
					setTimeout(function() {
						for (var j = 0; j < self.selectedApplications.length; j++){
							var initialLookupValue = self.includeApplicationsLookupTextBox.glowLookUpTextBox('createLookUp',
								self.selectedApplications[j].id,
								self.selectedApplications[j].name,
								self.selectedApplications[j].name,
								true);
							self.includeApplicationsLookupTextBox.glowLookUpTextBox('add', initialLookupValue);
						};
					}, 10);
				};

				this.glowApplicationAttached = true;
			}
		},

		hide: function(e, cancel) {
			if (!this.isShowing) return;

			if (cancel == false) {
				var includeGroupsOrApplications = this.container.find('#groupOption').val();

				var includeGroups = '', includeApplications = '', includeSubGroups = '', includeApplicationTypes = '';

				if (includeGroupsOrApplications == 'include') {
					includeGroups = 'include';
				}
				else if (includeGroupsOrApplications == 'exclude') {
					includeGroups = 'exclude';
				}
				else if (includeGroupsOrApplications == 'includeApplications') {
					includeApplications = 'include';
				}
				else if (includeGroupsOrApplications == 'excludeApplications') {
					includeApplications = 'exclude';
				}

				if (includeGroups != '') {
					if (this.showIncludeSubGroups)
						includeSubGroups = this.container.find('#includeSubGroups').prop('checked');
					else
						includeSubGroups = false;
				}

				var groupIds = [];
				if (includeGroups != '') {
					var count = this.includeGroupsLookupTextBox.glowLookUpTextBox('count');
					for (var i = 0; i < count; i++) {
						var item = this.includeGroupsLookupTextBox.glowLookUpTextBox('getByIndex', i);
						if (item) {
							groupIds.push({id: item.Value, name: item.SelectedHtml});
						};
					}
				}

				var applicationIds = [];
				if (includeApplications != '') {
					var count = this.includeApplicationsLookupTextBox.glowLookUpTextBox('count');
					for (var i = 0; i < count; i++) {
						var item = this.includeApplicationsLookupTextBox.glowLookUpTextBox('getByIndex', i);
						if (item) {
							applicationIds.push({id: item.Value, name: item.SelectedHtml});
						};
					}
				}

				if (this.showApplicationTypes) { 
					includeApplicationTypes = this.container.find('#applicationTypeOption').val();

					var selectedApplicationTypes = [];

					$("input:checkbox[name=applicationTypes]:checked", this.container).each(function(){
						selectedApplicationTypes.push({id: $(this).val(), name: $(this).attr('data-name')});
					});
				}
				else {
					includeApplicationTypes = this.includeApplicationTypes;
					selectedApplicationTypes = this.selectedApplicationTypes;
				}

				if (includeGroups != this.oldincludeGroups || JSON.stringify(groupIds) != JSON.stringify(this.selectedGroups) || includeApplications != this.oldincludeApplications
					|| JSON.stringify(applicationIds) != JSON.stringify(this.selectedApplications) || includeSubGroups != this.oldincludeSubGroups
					|| JSON.stringify(selectedApplicationTypes) != JSON.stringify(this.oldselectedApplicationTypes) || includeApplicationTypes != this.oldincludeApplicationTypes) {
						this.includeGroups = includeGroups;
						this.selectedGroups = groupIds;
						this.includeApplications = includeApplications;
						this.selectedApplications = applicationIds;
						this.includeSubGroups = includeSubGroups;
						this.includeApplicationTypes = includeApplicationTypes;
						this.selectedApplicationTypes = selectedApplicationTypes;

						this.callback(this.includeGroups, this.selectedGroups, this.includeSubGroups, this.includeApplications, this.selectedApplications, this.includeApplicationTypes, this.selectedApplicationTypes, false);
				}
			}
			$(document).off('.grouppicker');
			$(window).off('.grouppicker');
			this.container.hide();
			this.element.trigger('hide.grouppicker', this);
			this.isShowing = false;
		},

		toggle: function(e) {
			if (this.isShowing) {
				this.hide(e, false);
			} else {
				this.show();
			}
		},

		optionChanged: function(e) {
			var includeGroupsOrApplications = this.container.find('#groupOption').val();

			if (includeGroupsOrApplications == "include" || includeGroupsOrApplications == "exclude") {
				this.container.find('#applicationContainer').hide();
				this.container.find('#groupContainer').show();

				if (this.showIncludeSubGroups) {
					this.container.find('#subGroupContainer').show();
					if (includeGroupsOrApplications  == "exclude") {
						this.container.find('#subGroupContainer > label').text(this.locale.excludeSubGroupsLabel);
					}
					else if (includeGroupsOrApplications == "include") {
						this.container.find('#subGroupContainer > label').text(this.locale.includeSubGroupsLabel);
					}
				}
			}
			else if (includeGroupsOrApplications == "includeApplications" || includeGroupsOrApplications == "excludeApplications") {
				this.container.find('#applicationContainer').show();
				this.container.find('#groupContainer').hide();

				if (this.showIncludeSubGroups)
					this.container.find('#subGroupContainer').hide();
			}

			this.attachGlow();
		},

		outsideClick: function(e) {
			var target = $(e.target);
			// if the page is clicked anywhere except within the grouppicker/button
			// itself then call this.hide()

			if (
				// ie modal dialog fix
				e.type == "focusin" ||
				target.closest(this.element).length ||
				target.closest(this.container).length ||
				target.closest('div[data-position="downleft"]').length ||
				target.closest('div[data-position="downright"]').length ||
				target.closest('div[data-position="upleft"]').length ||
				target.closest('div[data-position="upright"]').length
				) return;
			this.hide(e, false);
			this.element.trigger('outsideClick.grouppicker', this);
		},

		clickApply: function(e) {
			this.hide(e, false);
			this.element.trigger('apply.grouppicker', this);
		},

		clickCancel: function(e) {
			this.includeGroups = this.oldincludeGroups;
			this.selectedGroups = this.oldselectedGroups;
			this.includeApplications = this.oldincludeApplications;
			this.selectedApplications = this.oldselectedApplications;
			this.includeSubGroups = this.oldincludeSubGroups;
			this.includeApplicationTypes = this.oldincludeApplicationTypes;
			this.selectedApplicationTypes = this.oldselectedApplicationTypes;

			this.hide(e, true);
			this.element.trigger('cancel.grouppicker', this);
		},

		remove: function() {
			this.container.remove();
			this.element.off('.grouppicker');
			this.element.removeData();
		}

	};

	$.fn.grouppicker = function(options, callback) {
		this.each(function() {
			var el = $(this);
			if (el.data('grouppicker'))
				el.data('grouppicker').remove();
			el.data('grouppicker', new GroupPicker(el, options, callback));
		});
		return this;
	};

	return GroupPicker;

})(jQuery, window);
