if (core_v2_page.IsPost) {
	core_v2_page.SetContentType('application/json')

	// issues a message on the bus to inform the job server to check
	// for an update. Intentionally doesn't wait for response
	updatesContext.Check();

	return { "success": true };
}
