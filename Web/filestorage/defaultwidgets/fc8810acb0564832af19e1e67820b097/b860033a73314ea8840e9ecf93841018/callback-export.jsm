var Id = core_v2_utility.ParseLong(core_v2_page.GetQueryStringValue("_w_id"))

context.HandleExportRequest(Id);