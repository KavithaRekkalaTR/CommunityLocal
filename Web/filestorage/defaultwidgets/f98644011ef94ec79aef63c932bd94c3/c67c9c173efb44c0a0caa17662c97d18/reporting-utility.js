/*

ReportingUtility

API:

ReportingUtility.guid()
ReportingUtility.updateTabData(key, data)
ReportingUtility.updateCurrentTabData(data)
ReportingUtility.deleteTabData(key)
ReportingUtility.getCurrentTabData()
ReportingUtility.getTabData(key)

*/
define('ReportingUtility', ['ReportingTabSettings'], function(ReportingTabSettings, $, global, undef) {

	function r4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	var contentTypeColors = [ {id: '00000000-0000-0000-0000-000000000000', color: '#93274e'},   //Unknown
        {id:  '48F9BAD6-9756-4845-AB98-382808C7BCED', color: '#9e281f'},   //Forum
        {id:  '46448885-D0E6-4133-BBFB-F0CD7B0FD6F7', color: '#b30000'},   //Forum Thread
        {id:  'F586769B-0822-468A-B7F3-A94D480ED9B0', color: '#ffcccc'},   //Forum Reply
        {id:  'A0753CFB-923B-4975-AD2A-42E5282A6D5D', color: '#a15e30'},   //Gallery
        {id:  '08CA0DA0-E017-4A80-9832-476C74D4F174', color: '#ea7924'},   //Media
        {id:  'CA0E7C80-8686-4D2F-A5A8-63B9E212E922', color: '#c19029'},   //Blog
        {id:  'F7D226AB-D59F-475C-9D22-4A79E3F0EC07', color: '#f8cb1a'},   //Blog Post
        {id:  '393E7426-CE8B-4921-9949-0C0B60CB1F1E', color: '#499faa'},   //Wiki
        {id:  '6B577B8C-0470-4E20-9D29-B6772BF67243', color: '#05dcdd'},   //Wiki Page
        {id:  '3D64F7EA-7F9A-4950-B4B5-29D104474601', color: '#3610e3'},   //Ideation
        {id:  'FB5D84B1-0A57-4544-8A7A-45DAFC1FAA43', color: '#8e8cfd'},   //Idea
        {id:  '6FC9D96C-E904-4CA9-8BEE-910640D4ECD3', color: '#df6ff1'},   //Calendar
        {id:  '07EEF79E-7081-4FD2-B548-6CDDD02E66B1', color: '#f5b8f4'},   //Calendar Event
        {id:  '9262536B-49A3-4494-802F-04DFF10424ED', color: '#000099'},   //Comment
        {id:  '23B05A61-C3E5-4451-90D9-BFA00453BCE4', color: '#ab8c76'},   //Group
        {id:  'E9ED4118-60ED-4F2B-A026-5705B8793D05', color: '#7e751a'},   //User
        {id:  '81AA61EB-CCB9-409B-BC6F-E2F9E7BDDA1D', color: '#a2af22'},   //Leaderboard
        {id:  '56F1A3EC-14BB-45C6-949F-EE7776D68C78', color: '#a831ee'},   //Status Message
        {id:  '68C65AF2-AA15-4E4C-9C81-155C6A3159F6', color: '#5b5058'},   //External Content
        {id:  'C922E523-50AD-4651-BBFF-B7511248F428', color: '#7e751a'},   //Unknown
    ];

    var activityTypeColors = [ {id:  0, color: '#93274e'},  //Unknown
        {id:  1, color: '#f8cb1a'},  //Blog post
        {id:  2, color: '#ee2911'},  //Forum post
        {id:  3, color: '#ea7924'},  //Media upload
        {id:  4, color: '#05dcdd'},  //New wiki page
        {id:  5, color: '#a831ee'},  //New status message
        {id:  6, color: '#f5b8f4'},  //New calendar event
        {id:  7, color: '#8e8cfd'},  //New idea
        {id:  8, color: '#f28071'},  //Forum reply
        {id:  9, color: '#000099'},  //Comment
        {id:  10, color: '#499faa'},  //Wiki revision
        {id:  11, color: '#05fec1'},  //Rating content
        {id:  12, color: '#976877'},  //Add tag
        {id:  13, color: '#387261'},  //Vote on a poll
        {id:  14, color: '#00b716'},  //Suggested answer to a question
        {id:  15, color: '#50fe34'},  //Verified answer to a question
        {id:  16, color: '#aabab3'},  //Subscribe - Daily
        {id:  17, color: '#84926c'},  //Subscribe - Weekly
        {id:  18, color: '#499faa'},  //Bookmarking/favorting
        {id:  19, color: '#2f6d82'},  //Private conversations
        {id:  20, color: '#3894d7'},  //Friendship request
        {id:  21, color: '#78cef8'},  //Invite a user to a group
        {id:  22, color: '#72629f'},  //Accepting a friendship request
        {id:  23, color: '#f5b8f4'},  //File download
        {id:  24, color: '#df6ff1'},  //Like
        {id:  25, color: '#a831ee'},  //Follow user
        {id:  26, color: '#3610e3'},  //Create a Group
        {id:  27, color: '#241267'},  //Create an Application
        {id:  28, color: '#7f2387'},  //Register for the community
        {id:  29, color: '#471a3a'},  //Log into the community
        {id:  30, color: '#93274e'},  //Report abuse
        {id:  31, color: '#976877'},  //Appeal abuse
        {id:  32, color: '#e57ea3'},  //Edit thread
        {id:  33, color: '#d5309d'},  //Move a post or thread
        {id:  34, color: '#dd385a'},  //Split or merge threads
        {id:  35, color: '#f28071'},  //Delete or ban a user
        {id:  36, color: '#ee2911'},  //Mention
        {id:  37, color: '#4e211a'},  //New Application Subscription
        {id:  38, color: '#5e4d28'},  //New Content Subscription
        {id:  39, color: '#a2af22'},  //Content Quality Vote
        {id:  40, color: '#7e751a'},  //Interest Vote
        {id:  41, color: '#dfb9ba'},  //Answer Verification Vote
        {id:  42, color: '#f8cb1a'},  //Idea vote
        {id:  43, color: '#a15e30'}  //Respond to an event invitation
    ];

    var participationTypeColors = [ {id: 'engagers', color: '#7d9e48'},
        {id:  'viewers', color: '#6b5b95'},
        {id:  'originators', color: '#3F729B'},
        {id:  'contributors', color: '#bf8040'}
    ];

	var ReportingUtility = {

		guid: function() {
			return r4() + r4() + '-' + r4() + '-' + r4() + '-' + r4() + '-' + r4() + r4() + r4();
		},

		debounce: function(fn, limit) {
			var bounceTimout;
			return function(){
				var scope = this;
				var args = arguments;
				clearTimeout(bounceTimout);
				bounceTimout = setTimeout(function(){
					fn.apply(scope, args);
				}, limit || 10);
			};
		},

		updateCurrentTabData: function (data) {
			var key = $.telligent.evolution.url.hashData()._tab_key;
			this.updateTabData(key, data);
		},

		updateTabData: function (key, data) {
			var tabSettingsUtility = new ReportingTabSettings();
			var settings = tabSettingsUtility.get();

			var tabIndex = -1;
			var tab  = {
				key: key
			};

			$.each(settings, function( index, value ) {
				if (value["key"] == key) {
					tab = value;
					tabIndex = index;
					return false;
				}
			});

			for(var id in data) {
				if (id != 'key') {
					tab[id] = data[id];
				}
			}

			if(tabIndex == -1) {
				settings.push(tab);
			}

			tabSettingsUtility.set(settings);
		},

		deleteTabData: function (key) {
			var tabSettingsUtility = new ReportingTabSettings();
			var settings = tabSettingsUtility.get();

			settings = $.grep(settings, function( value ) {
				return value["key"] !== key;
			  });

			tabSettingsUtility.set(settings);
		},

		getCurrentTabData: function () {
			var key = $.telligent.evolution.url.hashData()._tab_key;
			return this.getTabData(key);
		},

		getTabData: function (key) {
			var tabSettingsUtility = new ReportingTabSettings();
			var settings = tabSettingsUtility.get();

			var result = { key: key };

			$.each(settings, function( index, value ) {
				if (value["key"] == key) {
					result = value;
					return false;
				}
			});

			return result;
		},

		getLastItemInArray: function(items) {
			if (items !== undefined && items.length > 0) {
				return items[items.length - 1];
			}

			return false;
		},

		getActivityTypeSeriesColor: function(key) {
			var color = null;

			$(activityTypeColors).each(function(index, value) {
				if(value.id == key) {
					color = value.color;
					return false;
				};
			});

			return color;
		},

		getContentTypeSeriesColor: function(contentTypeId) {
			var color = null;

			$(contentTypeColors).each(function(index, value) {
				if(value.id.toLowerCase() == contentTypeId.toLowerCase()) {
					color = value.color;
					return false;
				};
			});

			return color;
        },

        getParticipationTypeSeriesColor: function(participationTypeId) {
			var color = null;

			$(participationTypeColors).each(function(index, value) {
				if(value.id.toLowerCase() == participationTypeId.toLowerCase()) {
					color = value.color;
					return false;
				};
			});

			return color;
		}

	};

	return ReportingUtility;

}, jQuery, window);
