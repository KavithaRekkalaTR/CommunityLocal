/***********************************************************************************************
Copyright (c) Telligent Systems Corporation.  All rights reserved.

Removes obsolete tables and data from an upgraded database.

Requirements: Telligent Evolution Platform 6.0

Instructions: Change @ForceDrop = 1 to force all obsolete tables to be dropped regardless of the
			  applications that exist. By default, if applications other than forums, blogs,
			  and media galleries exist, the data for those core applications will be deleted, but
			  the tables themselves will remain with the non-core application data intact. To see
			  if any non-core applications exist, execute the following SQL query:

SELECT	ApplicationType, COUNT(*) AS ApplicationCount
FROM	dbo.cs_Sections
WHERE	ApplicationType NOT IN ( 0, 1, 13 )
GROUP BY ApplicationType
ORDER BY ApplicationType

************************************************************************************************/

SET ANSI_NULLS ON;
SET ANSI_WARNINGS OFF;
SET NOCOUNT ON;

BEGIN TRY

	DECLARE @ForceDropAll bit, @ForceDrop5x bit, @ForceDrop6x bit, @ForceDrop7x bit, @ForceDrop12x bit, @rows int;

	SET @ForceDropAll = 1;  -- Set value to 1 to force dropping all obsolete tables.  Do not set to 1 unless you are running 8.x or later.
	
	
	SET @ForceDrop5x = 0;	-- Set value to 1 to force dropping all obsolete 5.x tables.
	SET @ForceDrop6x = 0;	-- Set value to 1 to force dropping all obsolete 6.x tables.  Do not drop 6.x tables unless you are on 7.x or later.
	SET @ForceDrop7x = 0;	-- Set value to 1 to force dropping all obsolete 7.x tables.  Do not drop 7.x tables unless you are on 8.x or later.
	SET @ForceDrop12x = 0;	-- Set value to 1 to force dropping all obsolete 12.x tables.  
	
	
	IF @ForceDropAll = 1
	BEGIN
		SET @ForceDrop5x = @ForceDropAll;
		SET @ForceDrop6x = @ForceDropAll;
		SET @ForceDrop7x = @ForceDropAll;
		SET @ForceDrop12x = @ForceDropAll;
	END
		
	DECLARE @MaxMajor INT
	SELECT  @MaxMajor = MAX(Major)
	FROM dbo.cs_SchemaVersion

	IF (@ForceDropAll = 1 OR @ForceDrop7x = 1) AND @MaxMajor < 8
	BEGIN
		RAISERROR('ERROR: You cannot drop obsolete 7.X tables unless version 8.X or higher has been installed.', 16, 1)
	END

	IF (@ForceDropAll = 1 OR @ForceDrop6x = 1) AND @MaxMajor < 7
	BEGIN
		RAISERROR('ERROR: You cannot drop obsolete 6.X tables unless version 7.X or higher has been installed.', 16, 1)
	END

	IF (@ForceDropAll = 1 OR @ForceDrop5x = 1) AND @MaxMajor < 6
	BEGIN
		RAISERROR('ERROR: You cannot drop obsolete 5.X tables unless version 6.X or higher has been installed.', 16, 1)
	END

	BEGIN TRANSACTION
	
--5.x tables
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Sections]') AND type in (N'U')) 
	BEGIN
		IF @ForceDrop5x = 0 AND EXISTS ( SELECT 1 FROM dbo.cs_Sections WHERE ApplicationType NOT IN ( 0, 1, 13 ) )
		BEGIN

			DECLARE @sections TABLE ( SectionID int NOT NULL PRIMARY KEY );
			
			INSERT INTO @sections ( SectionID )
			SELECT SectionID FROM dbo.cs_Sections WHERE ApplicationType IN ( 0, 1, 13 );

			PRINT N'Deleting thread tracking'
			
			DELETE	tt
			FROM	dbo.cs_TrackedThreads tt
					JOIN dbo.cs_Threads t ON t.ThreadID = tt.ThreadID
					JOIN @sections s ON s.SectionID = t.SectionID
			
			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';
			
			PRINT N'Deleting thread mutes'
			
			DELETE	tm
			FROM	dbo.cs_MutedThreads tm
					JOIN dbo.cs_Threads t ON t.ThreadID = tm.ThreadID
					JOIN @sections s ON s.SectionID = t.SectionID
			
			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting spam posts'
			
			DELETE	sp
			FROM	dbo.cs_SpamPosts sp 
					JOIN @sections s ON s.SectionID = sp.SectionID
			
			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';
			
			PRINT N'Deleting post edit notes'
			
			DELETE	pen
			FROM	dbo.cs_PostEditNotes pen
					JOIN cs_Posts p ON p.PostID = pen.PostID
					JOIN @sections s ON s.SectionID = p.SectionID
			
			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting post metadata'
			
			DELETE	pm
			FROM	dbo.cs_PostMetadata pm
					JOIN cs_Posts p ON p.PostID = pm.PostID
					JOIN @sections s ON s.SectionID = p.SectionID
			
			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting post ratings'
			
			DELETE	pr
			FROM	dbo.cs_PostRating pr
					JOIN cs_Posts p ON p.PostID = pr.PostID
					JOIN @sections s ON s.SectionID = p.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting archived deleted posts'
			
			DELETE	p
			FROM	dbo.cs_posts_deleted_archive p
			WHERE	p.ApplicationType IN ( 0, 1, 13 )

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting post downloads'
			
			DELETE	pd
			FROM	dbo.cs_Posts_Downloads pd
					JOIN cs_Posts p ON p.PostID = pd.PostID
					JOIN @sections s ON s.SectionID = p.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting roller blog posts'
			
			DELETE	rbp
			FROM	dbo.cs_RollerBlogPost rbp
					JOIN dbo.cs_RollerBlogFeeds rbf ON rbf.FeedID = rbp.FeedID
					JOIN @sections s ON s.SectionID = rbf.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting roller blog feeds'
			
			DELETE	rbf
			FROM	dbo.cs_RollerBlogFeeds rbf
					JOIN @sections s ON s.SectionID = rbf.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting roller blog feed urls'
			
			DELETE	rbu
			FROM	dbo.cs_RollerBlogUrls rbu
			WHERE	UrlID NOT IN ( SELECT UrlID FROM dbo.cs_RollerBlogFeeds )

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting archived posts'
			
			DELETE	pa
			FROM	dbo.cs_PostsArchive pa
					JOIN @sections s ON s.SectionID = pa.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting posts'
			
			DELETE	p
			FROM	dbo.cs_Posts p
					JOIN @sections s ON s.SectionID = p.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting thread daily stats'
			
			DELETE	tds
			FROM	dbo.cs_Thread_Daily_Stats tds
					JOIN dbo.cs_Threads t ON t.ThreadID = tds.ThreadID
					JOIN @sections s ON s.SectionID = t.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting thread ratings'
			
			DELETE	tr
			FROM	dbo.cs_ThreadRating tr
					JOIN dbo.cs_Threads t ON t.ThreadID = tr.ThreadID
					JOIN @sections s ON s.SectionID = t.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting read threads'
			
			DELETE	tr
			FROM	dbo.cs_ThreadsRead tr
					JOIN dbo.cs_Threads t ON t.ThreadID = tr.ThreadID
					JOIN @sections s ON s.SectionID = t.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting embedded thread URLs'
			
			DELETE	etu
			FROM	[dbo].cs_Forum_EmbeddedThreadUrl etu
					JOIN dbo.cs_Threads t ON t.ThreadID = etu.ThreadID
					JOIN @sections s ON s.SectionID = t.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting threads'
			
			DELETE	t
			FROM	dbo.cs_Threads t
					JOIN @sections s ON s.SectionID = t.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting section subscriptions'
			
			DELETE	ss
			FROM	dbo.cs_SectionSubscriptions ss
					JOIN @sections s ON s.SectionID = ss.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting tracked sections'
			
			DELETE	ts
			FROM	dbo.cs_TrackedSections ts
					JOIN @sections s ON s.SectionID = ts.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting read sections'
			
			DELETE	sr
			FROM	dbo.cs_SectionsRead sr
					JOIN @sections s ON s.SectionID = sr.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			PRINT N'Deleting blog contact requests'
			
			DELETE	cr
			FROM	dbo.cs_Weblog_ContactRequests cr
					JOIN @sections s ON s.SectionID = cr.WeblogId

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';
			
			PRINT N'Deleting blogs'
			
			DELETE	w
			FROM	dbo.cs_weblog_Weblogs w
					JOIN @sections s ON s.SectionID = w.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';
			
			PRINT N'Deleting sections'
			
			DELETE	cs
			FROM	dbo.cs_Sections cs
					JOIN @sections s ON s.SectionID = cs.SectionID

			SELECT @rows = @@ROWCOUNT;
			PRINT N'   ' + CONVERT(nvarchar(10), @rows) + ' row(s)';

			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_WebAnalytics]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_WebAnalytics''; DROP TABLE [dbo].[cs_WebAnalytics]; END'

		END
		ELSE
		BEGIN
			SET @ForceDrop5x = 1;
		END
	END
	ELSE
	BEGIN
		SET @ForceDrop5x = 1;
	END
	
	IF @ForceDrop5x = 1
	BEGIN
		
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_TrackedThreads]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_TrackedThreads''; DROP TABLE [dbo].[cs_TrackedThreads]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_MutedThreads]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_MutedThreads''; DROP TABLE [dbo].[cs_MutedThreads]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_RollerBlogPost]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_RollerBlogPost''; DROP TABLE [dbo].[cs_RollerBlogPost]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_RollerBlogFeeds]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_RollerBlogFeeds''; DROP TABLE [dbo].[cs_RollerBlogFeeds]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_RollerBlogUrls]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_RollerBlogUrls''; DROP TABLE [dbo].[cs_RollerBlogUrls]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Posts_Downloads]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Posts_Downloads''; DROP TABLE [dbo].[cs_Posts_Downloads]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_PostsArchive]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_PostsArchive''; DROP TABLE [dbo].[cs_PostsArchive]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_SpamPosts]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_SpamPosts''; DROP TABLE [dbo].[cs_SpamPosts]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_PostEditNotes]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_PostEditNotes''; DROP TABLE [dbo].[cs_PostEditNotes]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_PostMetadata]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_PostMetadata''; DROP TABLE [dbo].[cs_PostMetadata]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_PostRating]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_PostRating''; DROP TABLE [dbo].[cs_PostRating]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Posts]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Posts''; DROP TABLE [dbo].[cs_Posts]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_ThreadPage]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_ThreadPage''; DROP TABLE [dbo].[cs_Wiki_ThreadPage]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Thread_Daily_Stats]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Thread_Daily_Stats''; DROP TABLE [dbo].[cs_Thread_Daily_Stats]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_ThreadRating]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_ThreadRating''; DROP TABLE [dbo].[cs_ThreadRating]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_ThreadsRead]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_ThreadsRead''; DROP TABLE [dbo].[cs_ThreadsRead]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Forum_EmbeddedThreadUrl]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Forum_EmbeddedThreadUrl''; DROP TABLE [dbo].[cs_Forum_EmbeddedThreadUrl]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Threads]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Threads''; DROP TABLE [dbo].[cs_Threads]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_SectionTotals_tbl01]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_SectionTotals_tbl01''; DROP TABLE [dbo].[cs_SectionTotals_tbl01]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_SectionTotals_tbl02]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_SectionTotals_tbl02''; DROP TABLE [dbo].[cs_SectionTotals_tbl02]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_SectionSubscriptions]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_SectionSubscriptions''; DROP TABLE [dbo].[cs_SectionSubscriptions]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_TrackedSections]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_TrackedSections''; DROP TABLE [dbo].[cs_TrackedSections]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_SectionsRead]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_SectionsRead''; DROP TABLE [dbo].[cs_SectionsRead]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Weblog_ContactRequests]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Weblog_ContactRequests''; DROP TABLE [dbo].[cs_Weblog_ContactRequests]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_weblog_Weblogs]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_weblog_Weblogs''; DROP TABLE [dbo].[cs_weblog_Weblogs]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Sections]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Sections''; DROP TABLE [dbo].[cs_Sections]; END'
		EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_WebAnalytics]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_WebAnalytics''; DROP TABLE [dbo].[cs_WebAnalytics]; END'
	
	END

--6.x tables
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_Tag_Tags]') AND type in (N'U')) 
	BEGIN
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.te_Tag_Tags ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Tag_TagItems]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Tag_TagItems''; DROP TABLE [dbo].[te_Tag_TagItems]; END'
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Tag_Tags]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Tag_Tags''; DROP TABLE [dbo].[te_Tag_Tags]; END'	
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Wiki_Tags]') AND type in (N'U')) 
	BEGIN
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Wiki_Tags ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_PageTags]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_PageTags''; DROP TABLE [dbo].[cs_Wiki_PageTags]; END'
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_Tags]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_Tags''; DROP TABLE [dbo].[cs_Wiki_Tags]; END'	
		END
	END

	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Wiki_PageComments]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Wiki_PageComments ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_PageCommentRatings]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_PageCommentRatings''; DROP TABLE [dbo].[cs_Wiki_PageCommentRatings]; END'
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_PageComments]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_PageComments''; DROP TABLE [dbo].[cs_Wiki_PageComments]; END'	
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_FileGallery_Comments]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.te_FileGallery_Comments ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_FileGallery_CommentProperties]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_FileGallery_CommentProperties''; DROP TABLE [dbo].[te_FileGallery_CommentProperties]; END'
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_FileGallery_Comments]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_FileGallery_Comments''; DROP TABLE [dbo].[te_FileGallery_Comments]; END'	
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_Blog_PostComments]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.te_Blog_PostComments ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Blog_PostCommentSpamProperties]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Blog_PostCommentSpamProperties''; DROP TABLE [dbo].[te_Blog_PostCommentSpamProperties]; END'
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Blog_PostCommentSpam]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Blog_PostCommentSpam''; DROP TABLE [dbo].[te_Blog_PostCommentSpam]; END'
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Blog_PostCommentProperties]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Blog_PostCommentProperties''; DROP TABLE [dbo].[te_Blog_PostCommentProperties]; END'
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Blog_PostComments]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Blog_PostComments''; DROP TABLE [dbo].[te_Blog_PostComments]; END'	
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Wiki_PageRatings]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Wiki_PageRatings ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_PageRatings]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_PageRatings''; DROP TABLE [dbo].[cs_Wiki_PageRatings]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_Blog_PostRating]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.te_Blog_PostRating ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Blog_PostRating]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Blog_PostRating''; DROP TABLE [dbo].[te_Blog_PostRating]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_FileGallery_FileRatings]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.te_FileGallery_FileRatings ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_FileGallery_FileRatings]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_FileGallery_FileRatings''; DROP TABLE [dbo].[te_FileGallery_FileRatings]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_Forum_ThreadReplyRatings]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.te_Forum_ThreadReplyRatings ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Forum_ThreadReplyRatings]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Forum_ThreadReplyRatings''; DROP TABLE [dbo].[te_Forum_ThreadReplyRatings]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_Forum_ThreadRatings]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop6x = 1 OR (@ForceDrop6x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.te_Forum_ThreadRatings ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[te_Forum_ThreadRatings]'') AND type in (N''U'')) BEGIN PRINT N''Dropping te_Forum_ThreadRatings''; DROP TABLE [dbo].[te_Forum_ThreadRatings]; END'
		END
	END

--7.x tables

	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Groups_FavoriteGroups]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop7x = 1 OR (@ForceDrop7x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Groups_FavoriteGroups ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Groups_FavoriteGroups]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Groups_FavoriteGroups''; DROP TABLE [dbo].[cs_Groups_FavoriteGroups]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Wiki_FavoriteWikis]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop7x = 1 OR (@ForceDrop7x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Wiki_FavoriteWikis ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_FavoriteWikis]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_FavoriteWikis''; DROP TABLE [dbo].[cs_Wiki_FavoriteWikis]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Wiki_FavoritePages]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop7x = 1 OR (@ForceDrop7x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Wiki_FavoritePages ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Wiki_FavoritePages]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Wiki_FavoritePages''; DROP TABLE [dbo].[cs_Wiki_FavoritePages]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_FavoriteSections]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop7x = 1 OR (@ForceDrop7x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_FavoriteSections ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_FavoriteSections]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_FavoriteSections''; DROP TABLE [dbo].[cs_FavoriteSections]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_FavoritePosts]') AND type in (N'U')) 
	BEGIN		
		IF @ForceDrop7x = 1 OR (@ForceDrop7x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_FavoritePosts ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_FavoritePosts]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_FavoritePosts''; DROP TABLE [dbo].[cs_FavoritePosts]; END'
		END
	END
	
	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Messaging_ActivityMessages]') AND type in (N'U')) 
	BEGIN
		IF @ForceDrop7x = 1 OR (@ForceDrop7x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Messaging_ActivityMessages ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Messaging_ActivityMessages]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Messaging_ActivityMessages''; DROP TABLE [dbo].[cs_Messaging_ActivityMessages]; END'
		END
	END	

	IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cs_Content]') AND type in (N'U')) 
	BEGIN
		IF @ForceDrop12x = 1 OR (@ForceDrop12x = 0 AND NOT EXISTS ( SELECT 1 FROM dbo.cs_Content ))
		BEGIN
			EXEC sp_executesql N'IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N''[dbo].[cs_Content]'') AND type in (N''U'')) BEGIN PRINT N''Dropping cs_Content''; DROP TABLE [dbo].[cs_Content]; END'
		END
	END	

END TRY
BEGIN CATCH
	SELECT	ERROR_NUMBER() AS ErrorNumber,
			ERROR_SEVERITY() AS ErrorSeverity,
			ERROR_STATE() AS ErrorState,
			ERROR_LINE () AS ErrorLine,
			ERROR_PROCEDURE() AS ErrorProcedure,
			ERROR_MESSAGE() AS ErrorMessage;
        
	IF (XACT_STATE()) = -1
	BEGIN
		ROLLBACK TRANSACTION;
	END
END CATCH

IF (XACT_STATE()) = 1
BEGIN
	COMMIT TRANSACTION;
END
    
SET ANSI_WARNINGS ON;
