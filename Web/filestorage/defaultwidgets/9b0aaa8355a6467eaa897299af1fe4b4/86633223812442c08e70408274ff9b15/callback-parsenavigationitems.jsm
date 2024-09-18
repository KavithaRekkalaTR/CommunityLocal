core_v2_page.SetContentType('application/json');

return {
    navigationItems: context.ParseNavigationItems(core_v2_page.GetFormValue('serializedNavigationItems'))
}