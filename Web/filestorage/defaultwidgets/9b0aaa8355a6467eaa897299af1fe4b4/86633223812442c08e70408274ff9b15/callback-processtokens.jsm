core_v2_page.SetContentType('application/json');

return {
    text: context.ResolveTokens(core_v2_page.GetFormValue('text') || '')
}
