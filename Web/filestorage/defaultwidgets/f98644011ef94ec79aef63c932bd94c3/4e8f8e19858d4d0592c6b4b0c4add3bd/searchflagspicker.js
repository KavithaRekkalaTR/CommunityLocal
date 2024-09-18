(function ($, global) {
	var SearchFlagsPicker = function(element, options, cb) {
		//default settings for options
		this.parentEl = 'body';
		this.element = $(element);
        this.selectedSearchFlags = '';
        this.searchFlagsUrl = '';
        this.searchFlagsOptions = [];

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
            all: 'Any type'
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
		}

		this.selectedSearchFlags = options.selectedSearchFlags;
        this.searchFlagsOptions = options.searchFlagsOptions;
		if (typeof options.searchFlagsUrl === 'string')
        this.searchFlagsUrl = options.searchFlagsUrl;

		if (typeof options.opens === 'string')
			this.opens = options.opens;

		if (typeof options.drops === 'string')
			this.drops = options.drops;

		if (typeof cb === 'function') {
			this.callback = cb;
		}

        //html template for the picker UI
        if (typeof options.template !== 'string' && !(options.template instanceof $)) {
            options.template = '<div class="searchflagspicker dropdown-menu">' +
                '<div class="searchFlags">' +
                    '<ul>' +
                        '<li search-flags-key=""' + (this.selectedSearchFlags == '' ? 'class="active"' : '') + '>' + this.locale.all + '</li>';

            for (var i = 0; i < this.searchFlagsOptions.length; i++) {
                var item = this.searchFlagsOptions[i];
                options.template += '<li search-flags-key="' + item.name + '"' + (this.selectedSearchFlags == item.name ? 'class="active"' : '') + '>' + item.name + '</li>';
            }

            options.template += '</ul>' +
                '</div>' +
            '</div>';
        }

        this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
        this.container = $(options.template).appendTo(this.parentEl);
        this.container.addClass('opens' + this.opens);

        this.container.find('.searchFlags')
            .on('click.searchflagspicker', 'li', $.proxy(this.clickRange, this))

        if (this.element.is('input') || this.element.is('button')) {
            this.element.on({
                'click.searchflagspicker': $.proxy(this.show, this),
                'focus.searchflagspicker': $.proxy(this.show, this)
            });
        } else {
            this.element.on('click.searchflagspicker', $.proxy(this.toggle, this));
        }
    }

	SearchFlagsPicker.prototype = {

		constructor: SearchFlagsPicker,

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
			.on('mousedown.searchflagspicker', this._outsideClickProxy)
			// also support mobile devices
			.on('pointerend.searchflagspicker', this._outsideClickProxy)
			// also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
			.on('click.searchflagspicker', '[data-toggle=dropdown]', this._outsideClickProxy)
			// and also close when focus changes to outside the picker (eg. tabbing between controls)
			.on('focusin.searchflagspicker', this._outsideClickProxy)

			.on('change.searchflagspicker', this._changeProxy);


			// Reposition the picker if the window is resized while it's open
			$(window).on('resize.searchflagspicker', $.proxy(function(e) { this.move(e); }, this));

			this.container.show();
			this.move();
			this.element.trigger('show.searchflagspicker', this);
			this.isShowing = true;
		},

		hide: function(e, cancel) {
			if (!this.isShowing) return;

			if (cancel == false) {
				this.callback(this.selectedSearchFlags, false);
			}

			$(document).off('.searchflagspicker');
			$(window).off('.searchflagspicker');
			this.container.hide();
			this.element.trigger('hide.searchflagspicker', this);
			this.isShowing = false;
		},

		clickRange: function(e) {
			this.selectedSearchFlags = e.target.getAttribute('search-flags-key');;
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
			// if the page is clicked anywhere except within the searchFlagsPicker/button
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
			this.element.trigger('outsideClick.searchflagspicker', this);
		},

		remove: function() {
			this.container.remove();
			this.element.off('.searchflagspicker');
			this.element.removeData();
		}

	};

	$.fn.searchFlagsPicker = function(options, callback) {
		this.each(function() {
			var el = $(this);
			if (el.data('searchflagspicker'))
				el.data('searchflagspicker').remove();
			el.data('searchflagspicker', new SearchFlagsPicker(el, options, callback));
		});
		return this;
	};

	return SearchFlagsPicker;

})(jQuery, window);
