if (core_v2_page.IsPost) {
	core_v2_page.SetContentType('application/json');
	core_v2_widget.SetIntValue('cacheMemoryLimitMegabytes', core_v2_utility.ParseInt(core_v2_page.GetFormValue('cacheMemoryLimitMegabytes')));
	core_v2_widget.SetIntValue('cacheRollingTimeoutMinutes', core_v2_utility.ParseInt(core_v2_page.GetFormValue('cacheRollingTimeoutMinutes')));
	
	return {
	    "cacheMemoryLimitMegabytes": core_v2_widget.GetIntValue('cacheMemoryLimitMegabytes', 500),
	    "cacheRollingTimeoutMinutes": core_v2_widget.GetIntValue('cacheRollingTimeoutMinutes', 30)
	}
}