var Cache = function(options) {
    var cache = {};
    var size = options.size || 100;

	function getKeys(o) {
		if (Object.keys) {
			return Object.keys(o);
		} else {
			var keys = [];
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					keys.push(i);
				}
			}
			return keys;
		}
	}

	return {
		get: function(key) {
			if(cache[key] !== undefined) {
				cache[key].lastAccess = (new Date().getTime());
				return cache[key].value;
			} else {
				return null;
			}
		},
		set: function(key, value) {
			if(cache[key] !== undefined) {
				cache[key].lastAccess = (new Date().getTime());
				cache[key].value = value;
			} else {
				if(getKeys(cache).length >= size) {
					var oldestKey = null;
					for(var cacheKey in cache) {
						if(oldestKey === null) {
							oldestKey = cacheKey;
						} else if(cache[cacheKey].lastAccess < cache[oldestKey].lastAccess) {
							oldestKey = cacheKey;
						}
					}
					if(oldestKey !== null) {
						delete cache[oldestKey];
					}
				}
				cache[key] = {
					lastAccess: (new Date().getTime()),
					value: value
				};
			}
		},
		del: function(key) {
			delete cache[key];
		},
		empty: function() {
		    cache = {};
		}
	}
};