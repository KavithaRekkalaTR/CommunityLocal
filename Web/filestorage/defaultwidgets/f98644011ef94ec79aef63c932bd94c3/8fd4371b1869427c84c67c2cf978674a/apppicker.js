(function ($, global) {
	var SingleApplicationPicker = function(element, options, cb) {

		//default settings for options
		this.parentEl = 'body';
		this.element = $(element);
		this.applicationLookupUrl = '';
		this.selectedApplication = undefined;
		this.applicationTypeId = undefined;
		this.applicationTypeName = 'application';

		this.spinner = '<span class="ui-loading" width="48" height="48"></span>';
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
			noApplicationsFoundLabel: 'No matching application found.',
			findLabel: 'Find...',
			filterInstructions: 'Filter report for selected application.',
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

		this.selectedApplication = options.selectedApplication;

		if (typeof options.opens === 'string')
			this.opens = options.opens;

		if (typeof options.drops === 'string')
			this.drops = options.drops;

		if (typeof options.applicationLookupUrl === 'string')
			this.applicationLookupUrl = options.applicationLookupUrl;

		if (typeof options.applicationTypeId === 'string') {
			this.applicationTypeId = options.applicationTypeId;
		}

		if (typeof options.applicationTypeName  === 'string') {
			this.applicationTypeName = options.applicationTypeName;
			this.locale.noApplicationsFoundLabel = 'No matching ' + this.applicationTypeName + ' found.';
			this.locale.filterInstructions = 'Filter report for selected ' + this.applicationTypeName + '.';
		}

		var start, end, range;

		if (typeof cb === 'function') {
			this.callback = cb;
		}

		//html template for the picker UI
		if (typeof options.template !== 'string' && !(options.template instanceof $))
			options.template = '<div class="singleapplicationpicker dropdown-menu">' +
				'<div class="instructions">' + this.locale.filterInstructions + '</div>' +

				'<fieldset>' +
					'<ul class="field-list">' +
						'<li class="field-item application">' +
							'<span class="field-item-input">' +
								'<div id="applicationContainer" style="display: none;"><input type="text" id="applicationSelect" /></div>' +
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
			.on('click.singleapplicationpicker', 'button.applyBtn', $.proxy(this.clickApply, this))
			.on('click.singleapplicationpicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))

		if (this.element.is('input') || this.element.is('button')) {
			this.element.on({
				'click.singleapplicationpicker': $.proxy(this.show, this),
				'focus.singleapplicationpicker': $.proxy(this.show, this)
			});
		} else {
			this.element.on('click.singleapplicationpicker', $.proxy(this.toggle, this));
		}
	};

	SingleApplicationPicker.prototype = {

		constructor: SingleApplicationPicker,

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
			.on('mousedown.singleapplicationpicker', this._outsideClickProxy)
			// also support mobile devices
			.on('pointerend.singleapplicationpicker', this._outsideClickProxy)
			// also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
			.on('click.singleapplicationpicker', '[data-toggle=dropdown]', this._outsideClickProxy)
			// and also close when focus changes to outside the picker (eg. tabbing between controls)
			.on('focusin.singleapplicationpicker', this._outsideClickProxy)

			.on('change.singleapplicationpicker', this._changeProxy);


			// Reposition the picker if the window is resized while it's open
			$(window).on('resize.singleapplicationpicker', $.proxy(function(e) { this.move(e); }, this));

			this.oldselectedApplication = this.selectedApplication;

			this.container.show();

			this.attachGlow();

			this.move();
			this.element.trigger('show.singleapplicationpicker', this);
			this.isShowing = true;
		},

		attachGlow: function(e) {
			var self = this;

			if (this.glowApplicationAttached == false) {
				this.container.find('#applicationContainer').show();

				this.includeApplicationsLookupTextBox = this.container.find('#applicationSelect')
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 1,
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

							self.applicationLookupTimeout = window.setTimeout(function () {
								$.telligent.evolution.get({
									url: self.applicationLookupUrl,
									data: { w_searchText: searchText, w_applicationTypeId: self.applicationTypeId },
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
							}, 500);
						};
					},
					emptyHtml: self.locale.findLabel,
					selectedLookUpsHtml: []});

					if(self.selectedApplication) {
						setTimeout(function() {
							var initialLookupValue = self.includeApplicationsLookupTextBox.glowLookUpTextBox('createLookUp',
								self.selectedApplication.id,
								self.selectedApplication.name,
								self.selectedApplication.name,
								true);
							self.includeApplicationsLookupTextBox.glowLookUpTextBox('add', initialLookupValue);
						}, 10);
				};

				this.glowApplicationAttached = true;
			}
		},

		hide: function(e, cancel) {
			if (!this.isShowing) return;

			if (cancel == false) {
				var count = this.includeApplicationsLookupTextBox.glowLookUpTextBox('count');
				if (count == 1) {
					var item = this.includeApplicationsLookupTextBox.glowLookUpTextBox('getByIndex', 0);

					this.selectedApplication = [{
						id: item.Value,
						name: item.SelectedHtml
					}]

					if (JSON.stringify(this.selectedApplication) != JSON.stringify(this.oldselectedApplication))
						this.callback(this.selectedApplication, false);
				}
				else if (count == 0) {
					this.selectedApplication = [];
					if (JSON.stringify(this.selectedApplication) != JSON.stringify(this.oldselectedApplication))
						this.callback([], false);
				}
			}

			$(document).off('.singleapplicationpicker');
			$(window).off('.singleapplicationpicker');
			this.container.hide();
			this.element.trigger('hide.singleapplicationpicker', this);
			this.isShowing = false;
		},

		toggle: function(e) {
			if (this.isShowing) {
				this.hide(e, false);
			} else {
				this.show();
				if (this.container.find('#applicationContainer').find('.glow-lookuptextbox').find('input').length > 0)
					this.container.find('#applicationContainer').find('.glow-lookuptextbox').find('input').trigger('focus');
			}
		},

		outsideClick: function(e) {
			var target = $(e.target);
			// if the page is clicked anywhere except within the singleapplicationpicker/button
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
			this.element.trigger('outsideClick.singleapplicationpicker', this);
		},

		clickApply: function(e) {
			this.hide(e, false);
			this.element.trigger('apply.singleapplicationpicker', this);
		},

		clickCancel: function(e) {
			this.selectedApplication = this.oldselectedApplication;
			this.hide(e, true);
			this.element.trigger('cancel.singleapplicationpicker', this);
		},

		remove: function() {
			this.container.remove();
			this.element.off('.singleapplicationpicker');
			this.element.removeData();
		}
	};

	$.fn.singleapplicationpicker = function(options, callback) {
		this.each(function() {
			var el = $(this);
			if (el.data('singleapplicationpicker'))
				el.data('singleapplicationpicker').remove();
			el.data('singleapplicationpicker', new SingleApplicationPicker(el, options, callback));
		});
		return this;
	};

	return SingleApplicationPicker;

})(jQuery, window);
