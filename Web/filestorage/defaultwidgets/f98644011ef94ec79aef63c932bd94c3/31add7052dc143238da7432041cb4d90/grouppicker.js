(function ($, global) {
	var SingleGroupPicker = function(element, options, cb) {

		//default settings for options
		this.parentEl = 'body';
		this.element = $(element);
		this.groupLookupUrl = '';
		this.selectedGroup = undefined;

		this.spinner = '<span class="ui-loading" width="48" height="48"></span>';
		this.glowGroupAttached = false;

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
			noGroupsFoundLabel: 'No matching groups found.',
			findLabel: 'Find a group...',
			filterInstructions: 'Filter report for selected group.',
			alreadySelected: 'Already selected',
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

			if (typeof options.locale.findLabel === 'string')
				this.locale.findLabel = options.locale.findLabel;

			if (typeof options.locale.filterInstructions === 'string')
				this.locale.filterInstructions = options.locale.filterInstructions;
		}

		this.selectedGroup = options.selectedGroup;

		if (typeof options.opens === 'string')
			this.opens = options.opens;

		if (typeof options.drops === 'string')
			this.drops = options.drops;

		if (typeof options.groupLookupUrl === 'string')
			this.groupLookupUrl = options.groupLookupUrl;

		if (typeof cb === 'function') {
			this.callback = cb;
		}

		//html template for the picker UI
		if (typeof options.template !== 'string' && !(options.template instanceof $))
			options.template = '<div class="singlegrouppicker dropdown-menu">' +
				'<div class="instructions">' + this.locale.filterInstructions + '</div>' +

				'<fieldset>' +
					'<ul class="field-list">' +
						'<li class="field-item group">' +
							'<span class="field-item-input">' +
								'<div id="groupContainer" style="display: none;"><input type="text" id="groupSelect" /></div>' +
							'</span>' +
						'</li>' +
						'<li class="field-item buttons">' +
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
			.on('click.singlegrouppicker', 'button.applyBtn', $.proxy(this.clickApply, this))
			.on('click.singlegrouppicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))

		if (this.element.is('input') || this.element.is('button')) {
			this.element.on({
				'click.singlegrouppicker': $.proxy(this.show, this),
				'focus.singlegrouppicker': $.proxy(this.show, this)
			});
		} else {
			this.element.on('click.singlegrouppicker', $.proxy(this.toggle, this));
		}
	};

	SingleGroupPicker.prototype = {

		constructor: SingleGroupPicker,

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

			$(document)
			.on('mousedown.singlegrouppicker', this._outsideClickProxy)
			// also support mobile devices
			.on('pointerend.singlegrouppicker', this._outsideClickProxy)
			// also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
			.on('click.singlegrouppicker', '[data-toggle=dropdown]', this._outsideClickProxy)
			// and also close when focus changes to outside the picker (eg. tabbing between controls)
			.on('focusin.singlegrouppicker', this._outsideClickProxy)

			.on('change.singlegrouppicker', this._changeProxy);


			// Reposition the picker if the window is resized while it's open
			$(window).on('resize.singlegrouppicker', $.proxy(function(e) { this.move(e); }, this));

			this.oldselectedGroup = this.selectedGroup;

			this.container.show();

			this.attachGlow();

			this.move();
			this.element.trigger('show.singlegrouppicker', this);
			this.isShowing = true;
		},

		attachGlow: function(e) {
			var self = this;

			if (this.glowGroupAttached == false) {
				this.container.find('#groupContainer').show();

				this.includeGroupsLookupTextBox = this.container.find('#groupSelect')
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 1,
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

				if(self.selectedGroup) {

					setTimeout(function() {
						var initialLookupValue = self.includeGroupsLookupTextBox.glowLookUpTextBox('createLookUp',
							self.selectedGroup.id,
							self.selectedGroup.name,
							self.selectedGroup.name,
							true);
						self.includeGroupsLookupTextBox.glowLookUpTextBox('add', initialLookupValue);
					}, 10);
				};

				this.glowGroupAttached = true;
			}
		},

		hide: function(e, cancel) {
			if (!this.isShowing) return;

			if (cancel == false) {
				var count = this.includeGroupsLookupTextBox.glowLookUpTextBox('count');

				if (count == 1) {
					var item = this.includeGroupsLookupTextBox.glowLookUpTextBox('getByIndex', 0);

					this.selectedGroup = [{
						id: item.Value,
						name: item.SelectedHtml
					}]

					if (JSON.stringify(this.selectedGroup) != JSON.stringify(this.oldselectedGroup))
						this.callback(this.selectedGroup, false);
				}
				else if (count == 0) {
					this.selectedGroup = [];
					if (JSON.stringify(this.selectedGroup) != JSON.stringify(this.oldselectedGroup))
						this.callback([], false);
				}
			}

			$(document).off('.singlegrouppicker');
			$(window).off('.singlegrouppicker');
			this.container.hide();
			this.element.trigger('hide.singlegrouppicker', this);
			this.isShowing = false;
		},

		toggle: function(e) {
			if (this.isShowing) {
				this.hide(e, false);
			} else {
				this.show();
				if (this.container.find('#groupContainer').find('.glow-lookuptextbox').find('input').length > 0)
					this.container.find('#groupContainer').find('.glow-lookuptextbox').find('input').trigger('focus');
            }
		},

		outsideClick: function(e) {
			var target = $(e.target);
			// if the page is clicked anywhere except within the singlegrouppicker/button
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
			this.element.trigger('outsideClick.singlegrouppicker', this);
		},

		clickApply: function(e) {
			this.hide(e, false);
			this.element.trigger('apply.singlegrouppicker', this);
		},

		clickCancel: function(e) {
			this.selectedGroup = this.oldselectedGroup;
			this.hide(e, true);
			this.element.trigger('cancel.singlegrouppicker', this);
		},

		remove: function() {
			this.container.remove();
			this.element.off('.singlegrouppicker');
			this.element.removeData();
		}

	};

	$.fn.singlegrouppicker = function(options, callback) {
		this.each(function() {
			var el = $(this);
			if (el.data('singlegrouppicker'))
				el.data('singlegrouppicker').remove();
			el.data('singlegrouppicker', new SingleGroupPicker(el, options, callback));
		});
		return this;
	};

	return SingleGroupPicker;

})(jQuery, window);
