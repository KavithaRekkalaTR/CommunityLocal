return (function(){

	function extend (target, source) {
		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				target[key] = source[key];
			}
		}
		return target;
	}

	function map (items, func) {
		return (items || []).map(func);
	}

	return {
		extend: extend,
		map: map
	};

})();
