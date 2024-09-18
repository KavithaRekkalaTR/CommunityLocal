core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var user = core_v2_user.Accessing;
var articleId = core_v2_page.GetFormValue('_w_articleId');
var ratingId = core_v2_page.GetFormValue('_w_ratingId');

// delete unhelpful rating
var helpfulRatingDeletion = articles_v1_helpfulness.Delete(core_v2_utility.ParseInt(ratingId));
if (helpfulRatingDeletion && helpfulRatingDeletion.HasErrors())
	core_v2_page.SendJsonError(helpfulRatingDeletion.Errors);

// get article after rating deletion
var article = articles_v1_articles.Get({ Id: articleId });
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