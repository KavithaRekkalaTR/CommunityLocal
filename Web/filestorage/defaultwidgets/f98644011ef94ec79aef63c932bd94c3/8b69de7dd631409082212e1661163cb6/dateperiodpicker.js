(function ($, global) {
	var datePeriodPicker = function(element, options, cb) {

		//default settings for options
		this.parentEl = 'body';
		this.element = $(element);
		this.datePeriod = 'day';

		this.spinner = '<span class="ui-loading" width="48" height="48"></span>';

		this.opens = 'right';
		if (this.element.hasClass('pull-right'))
			this.opens = 'left';

		this.drops = 'down';
		if (this.element.hasClass('dropup'))
			this.drops = 'up';

		this.locale = {
			direction: 'ltr',
			separator: ' - ',
			day: 'By day',
			week: 'By week',
			month: 'By month',
			year: 'By year'
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

			if (typeof options.locale.day === 'string')
				this.locale.day = options.locale.day;

			if (typeof options.locale.week === 'string')
				this.locale.week = options.locale.week;

			if (typeof options.locale.month === 'string')
				this.locale.month = options.locale.month;

			if (typeof options.locale.year === 'string')
				this.locale.year = options.locale.year;
		}

		this.datePeriod = options.datePeriod;

		if (typeof options.opens === 'string')
			this.opens = options.opens;

		if (typeof options.drops === 'string')
			this.drops = options.drops;

		if (typeof cb === 'function') {
			this.callback = cb;
		}

		//html template for the picker UI
		if (typeof options.template !== 'string' && !(options.template instanceof $))
			options.template = '<div class="dateperiodpicker dropdown-menu">' +
				'<div class="datePeriods">' +
					'<ul>' +
						'<li data-period-key="day"' + (this.datePeriod == 'day' ? 'class="active"' : '') + '>' + this.locale.day + '</li>' +
						'<li data-period-key="week"' + (this.datePeriod == 'week' ? 'class="active"' : '') + '>' + this.locale.week + '</li>' +
						'<li data-period-key="month"' + (this.datePeriod == 'month' ? 'class="active"' : '') + '>' + this.locale.month + '</li>' +
						'<li data-period-key="year"' + (this.datePeriod == 'year' ? 'class="active"' : '') + '>' + this.locale.year + '</li>' +
					'</ul>' +
				'</div>' +
			'</div>';

		this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
		this.container = $(options.template).appendTo(this.parentEl);
		this.container.addClass('opens' + this.opens);

		var self = this;

		this.container.find('.datePeriods')
			.on('click.datePeriodPicker', 'li', $.proxy(this.clickRange, this))

		if (this.element.is('input') || this.element.is('button')) {
			this.element.on({
				'click.datePeriodPicker': $.proxy(this.show, this),
				'focus.datePeriodPicker': $.proxy(this.show, this)
			});
		} else {
			this.element.on('click.datePeriodPicker', $.proxy(this.toggle, this));
		}
	};

	datePeriodPicker.prototype = {

		constructor: datePeriodPicker,

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
			.on('mousedown.datePeriodPicker', this._outsideClickProxy)
			// also support mobile devices
			.on('pointerend.datePeriodPicker', this._outsideClickProxy)
			// also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
			.on('click.datePeriodPicker', '[data-toggle=dropdown]', this._outsideClickProxy)
			// and also close when focus changes to outside the picker (eg. tabbing between controls)
			.on('focusin.datePeriodPicker', this._outsideClickProxy)

			.on('change.datePeriodPicker', this._changeProxy);


			// Reposition the picker if the window is resized while it's open
			$(window).on('resize.datePeriodPicker', $.proxy(function(e) { this.move(e); }, this));

			this.olddatePeriod = this.datePeriod;

			this.container.show();
			this.move();
			this.element.trigger('show.datePeriodPicker', this);
			this.isShowing = true;
		},

		hide: function(e, cancel) {
			if (!this.isShowing) return;

			if (cancel == false  && this.olddatePeriod != this.datePeriod) {
				this.olddatePeriod = this.datePeriod;
				this.callback(this.datePeriod, false);
			}

			$(document).off('.datePeriodPicker');
			$(window).off('.datePeriodPicker');
			this.container.hide();
			this.element.trigger('hide.datePeriodPicker', this);
			this.isShowing = false;
		},

		clickRange: function(e) {
			this.datePeriod = e.target.getAttribute('data-period-key');
			$(e.target).closest('ul').find('li').removeClass("active");
			$(e.target).addClass("active");
			this.hide(e, false);
		},

		toggle: function(e) {
			if (this.isShowing) {
				this.hide(e, false);
			} else {
				this.show();
			}
		},

		outsideClick: function(e) {
			var target = $(e.target);
			// if the page is clicked anywhere except within the datePeriodPicker/button
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
			this.element.trigger('outsideClick.datePeriodPicker', this);
		},

		remove: function() {
			this.container.remove();
			this.element.off('.datePeriodPicker');
			this.element.removeData();
		}

	};

	$.fn.datePeriodPicker = function(options, callback) {
		this.each(function() {
			var el = $(this);
			if (el.data('datePeriodPicker'))
				el.data('datePeriodPicker').remove();
			el.data('datePeriodPicker', new datePeriodPicker(el, options, callback));
		});
		return this;
	};

	return datePeriodPicker;

})(jQuery, window);
