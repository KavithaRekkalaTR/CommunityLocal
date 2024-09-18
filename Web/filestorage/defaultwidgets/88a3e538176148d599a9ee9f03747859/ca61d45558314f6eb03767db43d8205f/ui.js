(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.wordReplacement = {
		register: function(options) {
		    var newTemplate;
            var deletions = {};

			options.configApi.registerContent([{
			    name: options.tabName,
			    selected: function() {
			        options.tabElement.show();
			    },
			    unselected: function() {
			        options.tabElement.hide();
			    }
            }]);

			options.configApi.registerSave(function(saveOptions) {
			    var additions = {};

			    options.wordList.find('li.word').each(function() {
			        var elm = $(this);

			        var originalWord = elm.data('originalword');
			        var originalRegex = elm.data('originalregex') ? '1' : '0';
			        var originalReplacement = elm.data('originalreplacement');

			        var id = elm.data('wordreplacementid');
			        var word = elm.find('.pattern').val();
			        var replacement = elm.find('.replacement').val();
			        var isRegex = elm.find('input[type="checkbox"]').is(':checked') ? '1' : '0';

			        if (word !== "" && (word != originalWord || isRegex != originalRegex || replacement != originalReplacement)) {
			            additions[id] = { 
			                // existing entries will be number ids, newly added entries will have no id
			                id: id !== "" ? id : null,
			                word: word,
			                isRegex: isRegex == '1',
			                replacement: replacement, 
			                elm: elm
			            };
			        }
			    });

			    var tasks = [];

			    $.each(deletions, function(k, v) {
			        if (v === true) {
			            tasks.push(
			                $.telligent.evolution.post({
			                    url: options.urls.del,
			                    data: {
			                        Id: k
			                    }
			                }).then(function() {
			                    deletions[k] = null;
			                })
                        );
			        }
			    });

			    $.each(additions, function(k, v) {
			        tasks.push(
			                $.telligent.evolution.post({
			                    url: options.urls.add,
			                    data: {
			                        Id: v.id,
			                        Word: v.word,
			                        IsRegex: v.isRegex,
			                        Replacement: v.replacement
			                    }
			                }).then(function(response) {
			                    v.elm.data('originalword', v.word);
            			        v.elm.data('originalregex', v.isRegex);
            			        v.elm.data('originalreplacement', v.replacement);
            			        v.elm.data('wordreplacementid', response.id);
			                })
                        );
			    });

                $.when.apply($, tasks)
                    .then(function() {
                        saveOptions.success();
                        deletions = {};
                    })
                    .catch(function() {
                        saveOptions.error();
                    });
			});

			$.telligent.evolution.messaging.subscribe('wordreplacement.add', function(d) {
			    newTemplate = newTemplate || $.telligent.evolution.template(options.newTemplate);
                var elm = $(newTemplate({
                    UniqueId: "new_" + options.newid
                }));
                options.newid++;
                options.wordList.append(elm.hide().slideDown(100));
			});

			$.telligent.evolution.messaging.subscribe('wordreplacement.delete', function(d) {
			    var elm = $(d.target).closest('li');
                var id = elm.data('wordreplacementid');

                // existing entries will be number ids, newly added entries will have no id
                if (id !== "") {
                    deletions[id] = true;
                }
                elm.slideUp(100, function() {
                    elm.remove();
                });
			});

			options.wordList.on('change input', 'input.pattern', function() {
			   var elm = $(this).closest('li');
			   var id = elm.data('wordreplacementid');
			   var word = elm.find('.pattern').val();
		       var isRegex = elm.find('input[type="checkbox"]').is(':checked') ? '1' : '0';

		       if (word.length === 0 || isRegex == '0') {
		           elm.removeClass('invalid');
		       } else {
		           $.telligent.evolution.post({
		               url: options.urls.testRegex,
		               data: {
		                   Pattern: word
		               }
		           }).then(function(r) {
		               var currentWord = elm.find('.pattern').val();
		               var currentIsRegex = elm.find('input[type="checkbox"]').is(':checked') ? '1' : '0';
		               if (word == currentWord && isRegex == currentIsRegex) {
    		              if (r.success) {
    		                  elm.removeClass('invalid');
    		              } else {
    		                  elm.addClass('invalid');
    		              }
		               }
		           });
		       }
			});
		}
	};
}(jQuery, window));