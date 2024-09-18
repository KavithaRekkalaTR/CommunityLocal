core_v2_page.SetContentType('application/json');
var exportFieldIds = core_v2_page.GetFormValue('ExportFieldIds');
var key = core_v2_utility.StoreTemporaryData(exportFieldIds);
return {
    key: key
}