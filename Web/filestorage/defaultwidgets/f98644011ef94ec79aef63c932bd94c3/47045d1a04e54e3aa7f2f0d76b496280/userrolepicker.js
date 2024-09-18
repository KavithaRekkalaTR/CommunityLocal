(function ($, global) {
	var UserRolePicker = function(element, options, cb) {

		//default settings for options
		this.parentEl = 'body';
		this.element = $(element);
		this.includeUsers = 'include';
		this.includeRoles = 'include';
		this.includeAnonymous = true;
		this.roleLookupUrl = '';
		this.userLookupUrl = '';
		this.selectedUsers = [];
		this.selectedRoles = [];
		this.spinner = '<span class="ui-loading" width="48" height="48"></span>';
		this.glowAttached = false;

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
			includeUsersLabel: 'Include members',
			excludeUsersLabel: 'Exclude members',
			includeRolesLabel: 'Include members in roles',
			excludeRolesLabel: 'Exclude members in roles',
			noRolesFoundLabel: 'No matching roles found.',
			noUsersFoundLabel: 'No matching users found.',
			includeAnonymousLabel: 'Include anonymous users',
			findRoleLabel: 'Find a role...',
			findUserLabel: 'Find a user...',
			filterInstructions: 'Show contributions only from specific people, people within role(s), or not in specific role(s).  Leave blank to show statistics from everyone.',
			alreadySelected: 'Already selected'
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

			if (typeof options.locale.includeAnonymousLabel === 'string')
				this.locale.includeAnonymousLabel = options.locale.includeAnonymousLabel;

			if (typeof options.locale.includeUsersLabel === 'string')
				this.locale.includeUsersLabel = options.locale.includeUsersLabel;

			if (typeof options.locale.excludeUsersLabel === 'string')
				this.locale.excludeUsersLabel = options.locale.excludeUsersLabel;

			if (typeof options.locale.includeRolesLabel === 'string')
				this.locale.includeRolesLabel = options.locale.includeRolesLabel;

			if (typeof options.locale.excludeRolesLabel === 'string')
				this.locale.excludeRolesLabel = options.locale.excludeRolesLabel;

			if (typeof options.locale.noRolesFoundLabel === 'string')
				this.locale.noRolesFoundLabel = options.locale.noRolesFoundLabel;

			if (typeof options.locale.findRoleLabel === 'string')
				this.locale.findRoleLabel = options.locale.findRoleLabel;

			if (typeof options.locale.findUserLabel === 'string')
				this.locale.findUserLabel = options.locale.findUserLabel;

			if (typeof options.locale.filterInstructions === 'string')
				this.locale.filterInstructions = options.locale.filterInstructions;
		}

		if (typeof options.includeRoles === 'string')
			this.includeRoles = options.includeRoles;

		if (typeof options.includeUsers === 'string')
			this.includeUsers = options.includeUsers;

		//if (typeof options.selectedUsers === 'object')
		this.selectedUsers = options.selectedUsers;

		//if (typeof options.selectedRoles === 'object')
		this.selectedRoles = options.selectedRoles;

		if (typeof options.includeAnonymous === 'boolean')
		this.includeAnonymous = options.includeAnonymous;

		if (typeof options.opens === 'string')
			this.opens = options.opens;

		if (typeof options.drops === 'string')
			this.drops = options.drops;

		if (typeof options.roleLookupUrl === 'string')
			this.roleLookupUrl = options.roleLookupUrl;

		if (typeof options.userLookupUrl === 'string')
			this.userLookupUrl = options.userLookupUrl;

		var start, end, range;

		if (typeof cb === 'function') {
			this.callback = cb;
		}

		//html template for the picker UI
		if (typeof options.template !== 'string' && !(options.template instanceof $))
			options.template = '<div class="userrolepicker dropdown-menu">' +
				'<div class="instructions">' + this.locale.filterInstructions + '</div>' +

				'<fieldset>' +
					'<ul class="field-list">' +
						'<li class="field-item role">' +
							'<span class="field-item-input">' +
								'<select id="roleOption">' +
									'<option value="include" ' + (this.includeRoles != 'exclude' ? 'selected' : '') + '>' + this.locale.includeRolesLabel + '</option>' +
									'<option value="exclude" ' + (this.includeRoles == 'exclude' ? 'selected' : '') + '>' +  this.locale.excludeRolesLabel + '</option>' +
								'</select><br />' +
								'<input type="text" id="roleSelect" />' +
							'</span>' +
						'</li>' +
						'<li class="field-item user">' +
							'<span class="field-item-input">' +
								'<select id="userOption">' +
									'<option value="include" ' + (this.includeUsers != 'exclude' ? 'selected' : '') + '>' + this.locale.includeUsersLabel + '</option>' +
									'<option value="exclude" ' + (this.includeUsers == 'exclude' ? 'selected' : '') + '>' +  this.locale.excludeUsersLabel + '</option>' +
								'</select><br />' +
								'<input type="text" id="userSelect" />' +
							'</span>' +
						'</li>' +
						'<li class="field-item anonymous">' +
							'<span class="field-item-input">' +
								'<input type="checkbox" id="includeAnonymous"' + (this.includeAnonymous == true ? 'checked' : '') + ' /><label for="includeAnonymous">' + this.locale.includeAnonymousLabel + '</label>' +
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
			.on('click.userrolepicker', 'button.applyBtn', $.proxy(this.clickApply, this))
			.on('click.userrolepicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))

		if (this.element.is('input') || this.element.is('button')) {
			this.element.on({
				'click.userrolepicker': $.proxy(this.show, this),
				'focus.userrolepicker': $.proxy(this.show, this),
			});
		} else {
			this.element.on('click.userrolepicker', $.proxy(this.toggle, this));
		}
	};

	UserRolePicker.prototype = {

		constructor: UserRolePicker,

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
			.on('mousedown.userrolepicker', this._outsideClickProxy)
			// also support mobile devices
			.on('pointerend.userrolepicker', this._outsideClickProxy)
			// also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
			.on('click.userrolepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
			// and also close when focus changes to outside the picker (eg. tabbing between controls)
			.on('focusin.userrolepicker', this._outsideClickProxy);

			// Reposition the picker if the window is resized while it's open
			$(window).on('resize.userrolepicker', $.proxy(function(e) { this.move(e); }, this));

			this.oldincludeRoles = this.includeRoles;
			this.oldincludeUsers = this.includeUsers;
			this.oldselectedRoles = this.selectedRoles;
			this.oldselectedUsers = this.selectedUsers;
			this.oldincludeAnonymous = this.includeAnonymous;

			this.container.show();

			this.attachGlow();

			this.move();
			this.element.trigger('show.userrolepicker', this);
			this.isShowing = true;
		},

		attachGlow: function(e) {
			var self = this;

			if (this.glowAttached == false) {
				this.includeRolesLookupTextBox = this.container.find('#roleSelect')
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						window.clearTimeout(self.roleLookupTimeout);
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

							self.roleLookupTimeout = window.setTimeout(function () {
								$.telligent.evolution.get({
									url: self.roleLookupUrl,
									data: { w_SearchText: searchText },
									success: function (response) {
										if (response && response.matches.length > 1) {
											var suggestions = [];
											for (var i = 0; i < response.matches.length; i++) {
												var item = response.matches[i];
												if (item && item.roleId) {
													var selectable = !selected[item.roleId];
													suggestions.push(tb.glowLookUpTextBox('createLookUp', item.roleId, item.title, selectable ? item.title : '<div class="glowlookuptextbox-alreadyselected">' + item.title + '<span class="glowlookuptextbox-identifier">' + self.locale.alreadySelected + '</span></div>', selectable));
												}
											}

											tb.glowLookUpTextBox('updateSuggestions', suggestions);
										}
										else
											tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', self.locale.noRolesFoundLabel, self.locale.noRolesFoundLabel, false)]);
									}
								});
							}, 749);
						};
					},
					emptyHtml: self.locale.findRoleLabel,
					selectedLookUpsHtml: []});

				if (self.selectedRoles.length > 0) {
					setTimeout(function() {
						for (var j = 0; j < self.selectedRoles.length; j++){
							var initialLookupValue = self.includeRolesLookupTextBox.glowLookUpTextBox('createLookUp',
								self.selectedRoles[j].id,
								self.selectedRoles[j].name,
								self.selectedRoles[j].name,
								true);
							self.includeRolesLookupTextBox.glowLookUpTextBox('add', initialLookupValue);
						};
					}, 10);
				};

				this.includeUsersLookupTextBox = this.container.find('#userSelect')
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						window.clearTimeout(self.userLookupTimeout);
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

							self.userLookupTimeout = window.setTimeout(function () {
								$.telligent.evolution.get({
									url: self.userLookupUrl,
									data: { w_SearchText: searchText },
									success: function (response) {
										if (response && response.matches.length > 1) {
											var suggestions = [];
											for (var i = 0; i < response.matches.length; i++) {
												var item = response.matches[i];
												if (item && item.userId) {
													var selectable = !selected[item.userId];
													suggestions.push(tb.glowLookUpTextBox('createLookUp', item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + self.locale.alreadySelected + '</span></div>', selectable));
												}
											}

											tb.glowLookUpTextBox('updateSuggestions', suggestions);
										}
										else
											tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', self.locale.noUsersFoundLabel, self.locale.noUsersFoundLabel, false)]);
									}
								});
							}, 500);
						};
					},
					emptyHtml: self.locale.findUserLabel,
					selectedLookUpsHtml: []});

				if (self.selectedUsers.length > 0) {
					setTimeout(function() {
						for (var j = 0; j < self.selectedUsers.length; j++){
							var initialLookupValue = self.includeUsersLookupTextBox.glowLookUpTextBox('createLookUp',
								self.selectedUsers[j].id,
								self.selectedUsers[j].name,
								self.selectedUsers[j].name,
								true);
							self.includeUsersLookupTextBox.glowLookUpTextBox('add', initialLookupValue);
						};
					}, 10);
				};
			}

			this.glowAttached = true;
		},

		hide: function(e, cancel) {
			if (!this.isShowing) return;

			if (cancel == false) {
				var includeRoles = this.container.find('#roleOption').val();
				var includeUsers = this.container.find('#userOption').val();
				var includeAnonymous = this.container.find('#includeAnonymous').prop('checked');

				var roleIds = [];
				var count = this.includeRolesLookupTextBox.glowLookUpTextBox('count');
				for (var i = 0; i < count; i++) {
					var item = this.includeRolesLookupTextBox.glowLookUpTextBox('getByIndex', i);
					if (item) {
						roleIds.push({id: item.Value, name: item.SelectedHtml});
					};
				}

				var userIds = [];
				var count = this.includeUsersLookupTextBox.glowLookUpTextBox('count');
				for (var i = 0; i < count; i++) {
					var item = this.includeUsersLookupTextBox.glowLookUpTextBox('getByIndex', i);
					if (item) {
						userIds.push({id: item.Value, name: item.SelectedHtml});
					};
				}

				if (includeRoles != this.oldincludeRoles || includeUsers != this.oldincludeUsers || includeAnonymous != this.oldincludeAnonymous ||
					JSON.stringify(roleIds) != JSON.stringify(this.selectedRoles) || JSON.stringify(userIds) != JSON.stringify(this.selectedUsers)) {
						this.selectedRoles = roleIds;
						this.selectedUsers = userIds;
						this.includeRoles = includeRoles;
						this.includeUsers = includeUsers;
						this.includeAnonymous = includeAnonymous;

						this.callback(this.includeRoles, this.includeUsers, this.selectedRoles, this.selectedUsers, this.includeAnonymous, false);
				}
			}
			$(document).off('.userrolepicker');
			$(window).off('.userrolepicker');
			this.container.hide();
			this.element.trigger('hide.userrolepicker', this);
			this.isShowing = false;
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
			// if the page is clicked anywhere except within the userrolepicker/button
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
			this.element.trigger('outsideClick.userrolepicker', this);
		},

		clickApply: function(e) {
			this.hide(e, false);
			this.element.trigger('apply.userrolepicker', this);
		},

		clickCancel: function(e) {
			this.includeRoles = this.oldincludeRoles;
			this.includeUsers = this.oldincludeUsers;
			this.selectedRoles = this.oldselectedRoles;
			this.selectedUsers = this.oldselectedUsers;
			this.includeAnonymous = this.oldincludeAnonymous;
			this.hide(e, true);
			this.element.trigger('cancel.userrolepicker', this);
		},

		remove: function() {
			this.container.remove();
			this.element.off('.userrolepicker');
			this.element.removeData();
		}

	};

	$.fn.userrolepicker = function(options, callback) {
		this.each(function() {
			var el = $(this);
			if (el.data('userrolepicker'))
				el.data('userrolepicker').remove();
			el.data('userrolepicker', new UserRolePicker(el, options, callback));
		});
		return this;
	};

	return UserRolePicker;

})(jQuery, window);
