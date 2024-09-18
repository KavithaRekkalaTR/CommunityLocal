core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var articleId = core_v2_page.GetFormValue('_w_articleId');
var article = articles_v1_articles.Get({ Id: articleId });
var user = core_v2_user.Accessing;
var isRegistered = core_v2_user.IsRegistered(core_v2_user.Accessing.Id);

if (!article)
	return { success: false };

if (article && article.HasErrors())
	core_v2_page.SendJsonError(article.Errors);

if (isRegistered) {
	// get existing helpful rating if exists
	var existingHelpfulRatings = articles_v1_helpfulness.List({
		ArticleId: articleId,
		AuthorId: user.Id,
		PageIndex: 0,
		PageSize: 1,
		IsHelpful: true,
		State: 'Unresolved'
	});

	if (existingHelpfulRatings && existingHelpfulRatings.HasErrors())
		core_v2_page.SendJsonError(existingHelpfulRatings.Errors);

	var existingHelpfulRating = null;
	if (existingHelpfulRatings && existingHelpfulRatings.length > 0)
		existingHelpfulRating = existingHelpfulRatings[0];

	// delete existing helpful rating if exists
	if (existingHelpfulRating) {
		var helpfulRatingDeletion = articles_v1_helpfulness.Delete(existingHelpfulRating.Id);
		if (helpfulRatingDeletion && helpfulRatingDeletion.HasErrors())
			core_v2_page.SendJsonError(helpfulRatingDeletion.Errors);
	}
}

// apply new rating if this is a toggle to helpful
if (!isRegistered || !existingHelpfulRating) {
	// apply rating
	var ratingCreationResponse = articles_v1_helpfulness.IsHelpful(article.Id);
	if (ratingCreationResponse && ratingCreationResponse.HasErrors())
		core_v2_page.SendJsonError(ratingCreationResponse.Errors);
	if (ratingCreationResponse && ratingCreationResponse.HasWarnings())
		core_v2_page.SendJsonWarning(ratingCreationResponse.Warnings);
}

// re-request article to get latest counts
article = articles_v1_articles.Get({ Id: articleId });

if (!article)
	return { success: false };

if (article && article.HasErrors())
	core_v2_page.SendJsonError(article.Errors);

// get state of helpfulness to user
var existingRatings = articles_v1_helpfulness.List({
	ArticleId: articleId,
	AuthorId: user.Id,
	PageIndex: 0,
	PageSize: 1,
	IsHelpful: true,
	State: 'Unresolved'
});
if (existingRatings && existingRatings.HasErrors())
	core_v2_page.SendJsonError(existingRatings.Errors);
var ratedHelpful = (existingRatings && existingRatings.length > 0);

// get state of helpfulness to user
var existingRatings = articles_v1_helpfulness.List({
	ArticleId: articleId,
	AuthorId: user.Id,
	PageIndex: 0,
	PageSize: 1,
	IsHelpful: false,
	State: 'Unresolved'
});
if (existingRatings && existingRatings.HasErrors())
	core_v2_page.SendJsonError(existingRatings.Errors);
var ratedUnhelpful = (existingRatings && existingRatings.length > 0);

return {
	success: true,
	totalHelpful: article.TotalHelpful,
	totalUnhelpful: article.TotalUnhelpful,
	ratedHelpful: ratedHelpful,
	ratedUnhelpful: ratedUnhelpful
};