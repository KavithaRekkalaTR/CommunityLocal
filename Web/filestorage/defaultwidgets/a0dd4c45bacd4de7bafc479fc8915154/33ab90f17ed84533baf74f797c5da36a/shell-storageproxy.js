/*
StudioStorageProxy

API:

var proxy = new StudioStorageProxy(user)

proxy.set(key, data)
proxy.get(key)
proxy.del(key)
proxy.empty()

settings.set(settings);

*/
define('StudioStorageProxy', function($, global, undef) {

	function addUserToKey(user, key) {
		return (!user.isSystemAccount ? (user.id + ':') : '') + key;
	}

	function addNameSpaceToKey(proxy, key) {
		return proxy._ns + ':' + key;
	}

	function StudioStorageProxy(user, namespace) {
		this._ns = 'studioshell:' + (namespace || 'fragments');

		if(!user) {
			user = $.telligent.evolution.user.accessing;
		}

		this._contextualStore = user.isSystemAccount
			? global.sessionStorage
			: global.localStorage;

		this._user = user;
	}
	StudioStorageProxy.prototype.set = function(key, obj) {
		if (!this._contextualStore) { return ; }
		this._contextualStore.setItem(addNameSpaceToKey(this, addUserToKey(this._user, key)), JSON.stringify(obj));
	};
	StudioStorageProxy.prototype.get = function(key) {
		if (!this._contextualStore) { return ; }
		return JSON.parse(this._contextualStore.getItem(addNameSpaceToKey(this, addUserToKey(this._user, key))));
	};
	StudioStorageProxy.prototype.del = function(key) {
		if (!this._contextualStore) { return ; }
		this._contextualStore.removeItem(addNameSpaceToKey(this, addUserToKey(this._user, key)));
	};
	StudioStorageProxy.prototype.empty = function() {
		if (!this._contextualStore) { return ; }
		this._contextualStore.clear();
	};

	return StudioStorageProxy;

}, jQuery, window);
