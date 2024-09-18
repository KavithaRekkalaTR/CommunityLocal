if (!core_v2_page.IsPost)
	return { success: false };

var result = context.LogoutUsers();

if (result.HasErrors()) {
	result.ThrowErrors();
}

return {
	complete: true
};