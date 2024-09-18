var eventId = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("_w_eventId"))

context.HandleExportRequest(eventId);